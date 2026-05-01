# Phase 3 — Tavily Installation and Setup

**Goal:** Tavily is installed server-side only. The 3-tier nutrition search API route works. The Firestore nutrition cache prevents repeat credit usage. No UI wiring yet — this phase is pure data pipeline.

**Prerequisite:** All Phase 2 tasks must be `[x]` in PROGRESS.md before starting.  
**Tasks:** T3.1 → T3.5  
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

## [ ] T3.4 — Create Local SG Foods Dataset

Create `src/data/sg-foods.json`:

```json
[
  { "foodName": "Chicken Rice",      "calories": 607, "protein": 32, "carbs": 78, "fat": 18, "servingSize": 400, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Char Kway Teow",    "calories": 744, "protein": 24, "carbs": 96, "fat": 28, "servingSize": 400, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Nasi Lemak",        "calories": 494, "protein": 17, "carbs": 58, "fat": 22, "servingSize": 300, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Roti Prata Plain",  "calories": 210, "protein":  6, "carbs": 28, "fat":  9, "servingSize": 100, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Roti Prata Egg",    "calories": 280, "protein": 10, "carbs": 30, "fat": 13, "servingSize": 120, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Laksa",             "calories": 589, "protein": 26, "carbs": 67, "fat": 24, "servingSize": 500, "servingUnit": "ml", "source": "HPB Singapore" },
  { "foodName": "Mee Goreng",        "calories": 660, "protein": 22, "carbs": 88, "fat": 24, "servingSize": 400, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Bak Chor Mee",      "calories": 510, "protein": 28, "carbs": 68, "fat": 14, "servingSize": 350, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Wonton Noodles",    "calories": 420, "protein": 22, "carbs": 58, "fat": 11, "servingSize": 320, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Hokkien Mee",       "calories": 632, "protein": 30, "carbs": 76, "fat": 24, "servingSize": 380, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Fried Rice",        "calories": 520, "protein": 14, "carbs": 76, "fat": 18, "servingSize": 350, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Chicken Biryani",   "calories": 650, "protein": 35, "carbs": 78, "fat": 20, "servingSize": 450, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Milo Dinosaur",     "calories": 296, "protein":  6, "carbs": 52, "fat":  7, "servingSize": 350, "servingUnit": "ml", "source": "HPB Singapore" },
  { "foodName": "Teh Tarik",         "calories": 110, "protein":  3, "carbs": 18, "fat":  3, "servingSize": 250, "servingUnit": "ml", "source": "HPB Singapore" },
  { "foodName": "Kaya Toast",        "calories": 320, "protein":  8, "carbs": 42, "fat": 14, "servingSize": 140, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Chicken Satay",     "calories": 190, "protein": 20, "carbs":  8, "fat":  9, "servingSize": 120, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Carrot Cake White", "calories": 350, "protein":  8, "carbs": 52, "fat": 12, "servingSize": 250, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Carrot Cake Black", "calories": 370, "protein":  8, "carbs": 56, "fat": 13, "servingSize": 250, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Popiah",            "calories": 238, "protein":  9, "carbs": 35, "fat":  7, "servingSize": 200, "servingUnit": "g",  "source": "HPB Singapore" },
  { "foodName": "Chee Cheong Fun",   "calories": 280, "protein":  7, "carbs": 48, "fat":  7, "servingSize": 200, "servingUnit": "g",  "source": "HPB Singapore" }
]
```

Create `src/lib/search/sg-foods.ts`:

```typescript
// src/lib/search/sg-foods.ts
import sgFoodsData from '@/data/sg-foods.json';

export interface SGFood {
  foodName: string; calories: number; protein: number;
  carbs: number;    fat: number;      servingSize: number;
  servingUnit: string; source: string;
}

const sgFoods: SGFood[] = sgFoodsData as SGFood[];

export function searchLocalSGFoods(query: string): SGFood[] {
  const q = query.toLowerCase().trim();
  return sgFoods.filter(f =>
    f.foodName.toLowerCase().includes(q) ||
    q.includes(f.foodName.toLowerCase()),
  );
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "sg-foods"
# Must print nothing

# Functional check:
npx tsx -e "
import { searchLocalSGFoods } from './src/lib/search/sg-foods';
const r = searchLocalSGFoods('chicken rice');
console.log(r.length > 0 && r[0].calories === 607 ? 'PASS' : 'FAIL: ' + JSON.stringify(r));
"
# Must print: PASS
```

---

## [ ] T3.5 — Build the 3-Tier Nutrition Search Route

Create `src/app/api/nutrition/search/route.ts`:

```typescript
// src/app/api/nutrition/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchLocalSGFoods } from '@/lib/search/sg-foods';
import { searchNutrition }    from '@/lib/search/tavily';
import { getNutritionCache }  from '@/lib/firebase/firestore';

export const runtime = 'nodejs';

export interface NutritionCandidate {
  foodName:     string;
  calories:     number;
  protein:      number;
  carbs:        number;
  fat:          number;
  servingSize:  number;
  servingUnit:  string;
  source:       string;
  rawContent?:  string;  // Tavily results only — fed to Gemini
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2)
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });

  // ── Tier 1: Local HPB SG JSON ─────────────────────────────
  const local = searchLocalSGFoods(query);
  if (local.length === 1)
    return NextResponse.json({ candidates: [local[0]], tier: 'local_hpb', singleHPBMatch: true });
  if (local.length > 1)
    return NextResponse.json({ candidates: local, tier: 'local_hpb', singleHPBMatch: false });

  // ── Tier 2: Firestore nutrition cache ─────────────────────
  const cached = await getNutritionCache(query);
  if (cached)
    return NextResponse.json({ candidates: [cached], tier: 'cache', singleHPBMatch: false });

  // ── Tier 3: Tavily web search ─────────────────────────────
  try {
    const results = await searchNutrition(query);
    if (results.length > 0) {
      const candidates: NutritionCandidate[] = results.map(r => ({
        foodName: query, calories: 0, protein: 0, carbs: 0, fat: 0,
        servingSize: 100, servingUnit: 'g',
        source: 'Tavily Search', rawContent: r.content,
      }));
      return NextResponse.json({ candidates, tier: 'tavily', singleHPBMatch: false });
    }
  } catch (err: any) {
    console.warn('Tavily failed, falling back to Open Food Facts:', err.message);
  }

  // ── Tier 4: Open Food Facts fallback ─────────────────────
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
        servingSize: p.serving_quantity     ?? 100,
        servingUnit: p.serving_quantity_unit ?? 'g',
        source:      'Open Food Facts',
      }));
    return NextResponse.json({ candidates, tier: 'open_food_facts', singleHPBMatch: false });
  } catch {
    return NextResponse.json({ candidates: [], tier: 'none', singleHPBMatch: false });
  }
}
```

**VERIFY:**
```bash
# With dev server running (npm run dev):

# Test 1: HPB match — must be instant, no Tavily call
curl -s "http://localhost:3000/api/nutrition/search?q=Chicken+Rice"
# Expected: "tier":"local_hpb" and "singleHPBMatch":true and "calories":607

# Test 2: Unknown food — must hit Tavily
curl -s "http://localhost:3000/api/nutrition/search?q=Avocado+Salmon+Bowl"
# Expected: "tier":"tavily" and candidates with rawContent field

# Test 3: TAVILY_API_KEY must not appear in browser network requests
# Open DevTools → Network tab while running Test 2
# Inspect the /api/nutrition/search request — TAVILY_API_KEY must not appear anywhere
```

---

## ✅ Phase 3 Complete When

All 3 checks pass:

```bash
# 1. HPB match returns local_hpb
curl -s "http://localhost:3000/api/nutrition/search?q=Chicken+Rice" | grep '"tier":"local_hpb"'
# Must match

# 2. Unknown food returns tavily tier
curl -s "http://localhost:3000/api/nutrition/search?q=Spaghetti+Carbonara" | grep '"tier":"tavily"'
# Must match

# 3. No TypeScript errors
npx tsc --noEmit && echo "TypeScript OK"
```

And manually confirm: `TAVILY_API_KEY` is absent from all browser network requests.

**Mark all Phase 3 tasks `[x]` in PROGRESS.md, then open PHASE_4_INTEGRATION.md.**
