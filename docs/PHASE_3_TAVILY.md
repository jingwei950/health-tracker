# Phase 3 — Tavily Installation and Setup

**Goal:** Tavily is installed server-side only. The 3-tier nutrition search API route works. The Firestore nutrition cache prevents repeat credit usage. No UI wiring yet — this phase is pure data pipeline.

**Prerequisite:** All Phase 2 tasks must be `[x]` in PROGRESS.md before starting.  
**Tasks:** T3.1 → T3.4  
**Mark progress in:** PROGRESS.md

---

## [ ] T3.1 — Get Tavily API Key
> ⚠️ **MANUAL STEP — user sign-up at tavily.com required.**

Present to the user and wait:

1. Go to https://tavily.com and click **Get API Key**
2. Sign up with email or GitHub — no credit card required
3. Copy the API key from the dashboard — it starts with `tvly-`
4. Provide the key to the agent

Add the key to `.env.local` (no `NEXT_PUBLIC_` prefix — server-side only):

```bash
echo "TAVILY_API_KEY=[REPLACE:tavily_api_key]" >> .env.local
```

**VERIFY:**
```bash
# Key present and starts with tvly-
grep "TAVILY_API_KEY" .env.local | grep "tvly-"
# Must print a line

# Key must NOT have NEXT_PUBLIC_ prefix
grep "NEXT_PUBLIC_TAVILY" .env.local
# Must print nothing
```

---

## [ ] T3.2 — Install Tavily SDK

```bash
npm install @tavily/core
```

**VERIFY:**
```bash
node -e "const { tavily } = require('@tavily/core'); console.log('OK')"
# Must print: OK
```

---

## [ ] T3.3 — Create Tavily Client

Create `src/lib/search/tavily.ts`:

```typescript
// src/lib/search/tavily.ts
// Server-side only — never import from client components or pages
import { tavily } from '@tavily/core';

if (!process.env.TAVILY_API_KEY) {
  throw new Error('TAVILY_API_KEY is not set in .env.local (must not have NEXT_PUBLIC_ prefix)');
}

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export interface TavilyResult {
  title:   string;
  url:     string;
  content: string;
  score:   number;
}

export async function searchNutrition(foodName: string): Promise<TavilyResult[]> {
  const response = await client.search(
    `${foodName} nutrition calories protein carbs fat Singapore HPB`,
    {
      searchDepth:       'basic',  // 1 credit per query regardless of result count
      maxResults:        5,
      includeRawContent: false,    // Reduces payload size passed to Gemini
      includeImages:     false,
    },
  );
  return response.results.map(r => ({
    title:   r.title,
    url:     r.url,
    content: r.content,
    score:   r.score ?? 0,
  }));
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "tavily.ts"
# Must print nothing
```

---

## [ ] T3.4 — Build the 3-Tier Nutrition Search Route

Create `src/app/api/nutrition/search/route.ts`:

```typescript
// src/app/api/nutrition/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchNutrition }         from '@/lib/search/tavily';
import { getAdminNutritionCache }  from '@/lib/firebase/admin';

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
  rawContent?: string;  // Tavily results only — fed to Gemini
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2)
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });

  // ── Tier 1: Firestore nutrition cache ─────────────────────────
  const cached = await getAdminNutritionCache(query);
  if (cached)
    return NextResponse.json({ candidates: [cached], tier: 'cache' });

  // ── Tier 2: Tavily web search ─────────────────────────────────
  try {
    const results = await searchNutrition(query);
    if (results.length > 0) {
      const candidates: NutritionCandidate[] = results.map(r => ({
        foodName: query, calories: 0, protein: 0, carbs: 0, fat: 0,
        servingSize: 100, servingUnit: 'g',
        source: 'Tavily Search', rawContent: r.content,
      }));
      return NextResponse.json({ candidates, tier: 'tavily' });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Tavily search failed, falling back to Open Food Facts:', msg);
  }

  // ── Tier 3: Open Food Facts fallback ─────────────────────────
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
```

**VERIFY:**
```bash
# With dev server running (npm run dev):

# Test 1: Unknown food — must hit Tavily (or Open Food Facts if not cached)
curl -s "http://localhost:3000/api/nutrition/search?q=Avocado+Salmon+Bowl"
# Expected: "tier":"tavily" and candidates with rawContent field

# Test 2: Previously searched food — must hit cache
# (Search Chicken Rice once via UI first, then:)
curl -s "http://localhost:3000/api/nutrition/search?q=Chicken+Rice"
# Expected: "tier":"cache"

# Test 3: TAVILY_API_KEY must not appear in browser network requests
# Open DevTools → Network tab while running Test 1
# Inspect the /api/nutrition/search request — TAVILY_API_KEY must not appear anywhere
```

---

## ✅ Phase 3 Complete When

All 2 checks pass:

```bash
# 1. Unknown food returns tavily tier
curl -s "http://localhost:3000/api/nutrition/search?q=Spaghetti+Carbonara" | grep '"tier":"tavily"'
# Must match

# 2. No TypeScript errors
npx tsc --noEmit && echo "TypeScript OK"
```

And manually confirm: `TAVILY_API_KEY` is absent from all browser network requests.

**Mark all Phase 3 tasks `[x]` in PROGRESS.md, then open PHASE_4_INTEGRATION.md.**
