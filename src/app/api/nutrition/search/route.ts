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

  // ── Tier 1: Firestore nutrition cache ─────────────────────────
  const cached = await getAdminNutritionCache(query);
  if (cached)
    return NextResponse.json({ candidates: [cached], tier: 'cache' });

  // ── Tier 2: HPB Singapore Food Insights Database (direct API) ─
  try {
    const hpb = await searchHpbFood(query);
    if (hpb) {
      const candidate: NutritionCandidate = {
        foodName:    hpb.foodName,
        calories:    hpb.calories,
        protein:     hpb.protein,
        carbs:       hpb.carbs,
        fat:         hpb.fat,
        servingSize: hpb.servingSize,
        servingUnit: hpb.servingUnit,
        source:      hpb.source,
        url:         hpb.sourceUrl,
      };
      return NextResponse.json({ candidates: [candidate], tier: 'hpb_foodid' });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('HPB FoodID search failed, falling back to Tavily:', msg);
  }

  // ── Tier 3: Tavily general web search ─────────────────────────
  try {
    const results = await searchNutrition(query);
    if (results.length > 0) {
      const candidates: NutritionCandidate[] = results.map(r => ({
        foodName: query, calories: 0, protein: 0, carbs: 0, fat: 0,
        servingSize: 100, servingUnit: 'g',
        source:     'Tavily Search',
        url:        r.url,
        rawContent: `[Source URL: ${r.url}]\n${r.content}`,
      }));
      return NextResponse.json({ candidates, tier: 'tavily' });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Tavily search failed, falling back to Open Food Facts:', msg);
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
