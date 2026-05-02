import { NextRequest, NextResponse } from 'next/server';
import { getAdminNutritionCache } from '@/lib/firebase/admin';
import { searchNutrition }        from '@/lib/search/tavily';

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
  rawContent?: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2)
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });

  // ── Tier 1: Firestore cache ───────────────────────────────────
  const cached = await getAdminNutritionCache(query);
  if (cached)
    return NextResponse.json({ candidates: [cached], tier: 'cache' });

  // ── Tier 2: Tavily web search ─────────────────────────────────
  try {
    const results = await searchNutrition(query);
    const candidates: NutritionCandidate[] = results.map(r => ({
      foodName: query, calories: 0, protein: 0, carbs: 0, fat: 0,
      servingSize: 100, servingUnit: 'g',
      source: 'Tavily Search', rawContent: r.content,
    }));
    return NextResponse.json({ candidates, tier: 'tavily' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Tavily search failed:', msg);
    return NextResponse.json({ candidates: [], tier: 'none' });
  }
}
