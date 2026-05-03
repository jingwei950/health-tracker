import { NextRequest, NextResponse } from 'next/server';
import { searchHpbFood }          from '@/lib/search/hpb';
import { searchNutrition }        from '@/lib/search/tavily';
import { getAdminNutritionCache } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export interface NutritionCandidate {
  foodName:    string;
  calories:    number;
  protein:     number;
  carbs:       number;
  fat:         number;
  servingSize: number;
  servingUnit: string;
  source:      string;
  url?:        string;
  rawContent?: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2)
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });

  const uid = request.nextUrl.searchParams.get('uid') ?? undefined;

  // ── Tier 1: Firestore nutrition cache ─────────────────────────
  const cached = await getAdminNutritionCache(query, uid);
  if (cached)
    return NextResponse.json({ candidates: [cached], tier: 'cache' });

  // ── Tier 2+3: HPB and Tavily in parallel — Gemini picks the best match ──
  const [hpbRes, tavilyRes] = await Promise.allSettled([
    searchHpbFood(query),
    searchNutrition(query),
  ]);

  const candidates: NutritionCandidate[] = [];

  if (hpbRes.status === 'fulfilled' && hpbRes.value) {
    const hpb = hpbRes.value;
    candidates.push({
      foodName:    hpb.foodName,
      calories:    hpb.calories,
      protein:     hpb.protein,
      carbs:       hpb.carbs,
      fat:         hpb.fat,
      servingSize: hpb.servingSize,
      servingUnit: hpb.servingUnit,
      source:      hpb.source,
      url:         hpb.sourceUrl,
    });
  } else if (hpbRes.status === 'rejected') {
    console.warn('HPB FoodID search failed:', hpbRes.reason?.message ?? hpbRes.reason);
  }

  if (tavilyRes.status === 'fulfilled' && tavilyRes.value.length > 0) {
    tavilyRes.value.forEach(r => candidates.push({
      foodName:    query,
      calories:    0,
      protein:     0,
      carbs:       0,
      fat:         0,
      servingSize: 100,
      servingUnit: 'g',
      source:      'Tavily Search',
      url:         r.url,
      rawContent:  `[Source URL: ${r.url}]\n${r.content}`,
    }));
  } else if (tavilyRes.status === 'rejected') {
    console.warn('Tavily search failed:', tavilyRes.reason?.message ?? tavilyRes.reason);
  }

  if (candidates.length > 0) {
    const hasHpb    = candidates.some(c => c.source === 'HPB FoodID');
    const hasTavily = candidates.some(c => c.source === 'Tavily Search');
    const tier = hasHpb && hasTavily ? 'hpb+tavily' : hasHpb ? 'hpb_foodid' : 'tavily';
    return NextResponse.json({ candidates, tier });
  }

  // ── Tier 4: Open Food Facts fallback ─────────────────────────
  try {
    const res  = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=3&lc=en&cc=sg`,
    );
    const data = await res.json();
    const candidates: NutritionCandidate[] = (data.products ?? [])
      .filter((p: any) => p.nutriments)
      .slice(0, 3)
      .map((p: any) => ({
        foodName:    p.product_name ?? query,
        calories:    Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
        protein:     Math.round(p.nutriments['proteins_100g']    ?? 0),
        carbs:       Math.round(p.nutriments['carbohydrates_100g'] ?? 0),
        fat:         Math.round(p.nutriments['fat_100g']         ?? 0),
        servingSize: p.serving_quantity      ?? 100,
        servingUnit: p.serving_quantity_unit ?? 'g',
        source:      'Open Food Facts',
      }));
    return NextResponse.json({ candidates, tier: 'open_food_facts' });
  } catch {
    return NextResponse.json({ candidates: [], tier: 'none' });
  }
}
