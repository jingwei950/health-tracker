# Phase 4 — End-to-End Integration and Testing

**Goal:** The full food search pipeline works — Tavily → Gemini verification → user review card → Firestore write. Real-time UI updates work. Delete wiring works. All smoke tests pass.

**Prerequisite:** All Phase 3 tasks must be `[x]` in PROGRESS.md before starting.  
**Tasks:** T4.1 → T4.11  
**Mark progress in:** PROGRESS.md

---

## [ ] T4.1 — Build the Nutrition Verification Route

Create `src/app/api/nutrition/verify/route.ts`:

```typescript
// src/app/api/nutrition/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel }     from '@/lib/ai/gemini';
import { setNutritionCache }  from '@/lib/firebase/firestore';
import type { NutritionCandidate } from '../search/route';

export const runtime = 'nodejs';

interface VerifiedResult {
  foodName:         string;
  calories:         number;
  protein:          number;
  carbs:            number;
  fat:              number;
  servingSize:      number;
  servingUnit:      string;
  source:           string;
  dataVerified:     boolean;
  verificationNote: string;
}

// Local sanity check — overrides Gemini if macros don't add up
function macroSanityCheck(r: VerifiedResult): VerifiedResult {
  const est      = (r.protein * 4) + (r.carbs * 4) + (r.fat * 9);
  const variance = Math.abs(est - r.calories) / (r.calories || 1);
  if (variance > 0.20) {
    return {
      ...r,
      dataVerified:     false,
      verificationNote: `Macro totals (${Math.round(est)} kcal) differ from stated calories (${r.calories} kcal) by ${Math.round(variance * 100)}%`,
    };
  }
  return r;
}

export async function POST(request: NextRequest) {
  try {
    const { query, candidates }: { query: string; candidates: NutritionCandidate[] } =
      await request.json();

    if (!candidates?.length)
      return NextResponse.json({ error: 'No candidates provided' }, { status: 400 });

    const model = getGeminiModel();

    const candidateSummary = candidates.map((c, i) =>
      `Candidate ${i + 1}:\n  Source: ${c.source}\n` +
      (c.rawContent
        ? `  Web snippet: ${c.rawContent.slice(0, 600)}`
        : `  Nutrition: ${c.calories} kcal · P ${c.protein}g · C ${c.carbs}g · F ${c.fat}g · ${c.servingSize}${c.servingUnit}`)
    ).join('\n\n');

    const prompt = `You are a nutrition data verifier for a Singapore health tracker.
User searched for: "${query}"

Available data:
${candidateSummary}

Tasks:
1. Identify the best match for "${query}"
2. Extract or estimate: calories, protein (g), carbs (g), fat (g), serving size and unit
3. Set dataVerified to true ONLY if data is internally consistent and from a credible source (HPB, HealthHub, official nutrition database)
4. If extracting from a web snippet, pull the actual numbers from the text

Reply with ONLY valid JSON — no markdown fences, no preamble:
{
  "foodName": string,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "servingSize": number,
  "servingUnit": string,
  "source": string,
  "dataVerified": boolean,
  "verificationNote": string
}`;

    const response = await model.generateContent(prompt);
    const rawText  = response.response.text().trim()
      .replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed: VerifiedResult = JSON.parse(rawText);
    const verified = macroSanityCheck(parsed);

    // Cache results from Tavily (not Open Food Facts — less reliable)
    if (candidates.some(c => c.source === 'Tavily Search') && verified.dataVerified) {
      setNutritionCache(query, verified).catch(() => {});  // Non-blocking
    }

    return NextResponse.json({ ok: true, result: verified });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

**VERIFY:**
```bash
curl -s -X POST http://localhost:3000/api/nutrition/verify \
  -H "Content-Type: application/json" \
  -d '{"query":"Chicken Rice","candidates":[{"foodName":"Chicken Rice","calories":607,"protein":32,"carbs":78,"fat":18,"servingSize":400,"servingUnit":"g","source":"HPB Singapore"}]}' \
  | grep '"ok":true'
# Must match — Gemini returns a verified result
```

---

## [ ] T4.2 — Macro Sanity Check Unit Test

Create `src/lib/ai/__tests__/macro-sanity.test.ts`:

```typescript
// src/lib/ai/__tests__/macro-sanity.test.ts
describe('Macro sanity check — 20% tolerance', () => {
  function check(p: number, c: number, f: number, cal: number): boolean {
    const est      = (p * 4) + (c * 4) + (f * 9);
    const variance = Math.abs(est - cal) / (cal || 1);
    return variance <= 0.20;
  }

  it('passes for valid Chicken Rice macros (607 kcal)', () => {
    expect(check(32, 78, 18, 607)).toBe(true);
  });

  it('fails when calories are grossly incorrect', () => {
    expect(check(32, 78, 18, 200)).toBe(false);
  });

  it('fails when more than 20% over estimated', () => {
    const est  = (32 * 4) + (78 * 4) + (18 * 9);   // 602
    const over = Math.round(est * 1.25);
    expect(check(32, 78, 18, over)).toBe(false);
  });

  it('passes at exactly 20% boundary', () => {
    const est      = (32 * 4) + (78 * 4) + (18 * 9);
    const boundary = Math.round(est * 1.20);
    expect(check(32, 78, 18, boundary)).toBe(true);
  });
});
```

**VERIFY:**
```bash
npx jest src/lib/ai/__tests__/macro-sanity.test.ts --no-coverage 2>&1 | grep -E "PASS|FAIL"
# Must print: PASS
```

---

## [ ] T4.3 — Build the Nutrition Search Hook

Create `src/hooks/useNutritionSearch.ts`:

```typescript
// src/hooks/useNutritionSearch.ts
'use client';
import { useState } from 'react';

export type SearchState = 'idle' | 'searching' | 'verifying' | 'ready' | 'error';

export interface VerifiedNutrition {
  foodName:         string;
  calories:         number;
  protein:          number;
  carbs:            number;
  fat:              number;
  servingSize:      number;
  servingUnit:      string;
  source:           string;
  dataVerified:     boolean;
  verificationNote: string;
}

export function useNutritionSearch() {
  const [state,  setState]  = useState<SearchState>('idle');
  const [result, setResult] = useState<VerifiedNutrition | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  const search = async (query: string) => {
    setState('searching');
    setResult(null);
    setError(null);

    // Offline check
    if (!navigator.onLine) {
      const cacheRes = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`).catch(() => null);
      if (cacheRes?.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData.tier === 'cache' && cacheData.candidates.length > 0) {
          setResult({ ...cacheData.candidates[0], dataVerified: true, verificationNote: 'Cached result — offline mode' });
          setState('ready');
          return;
        }
      }
      setState('error');
      setError('You are offline. Previously searched foods may be available from cache.');
      return;
    }

    try {
      // Step 1: Fetch candidates
      const searchRes  = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();

      if (!searchData.candidates?.length) {
        setState('error');
        setError('No results found. Try a different spelling or enter manually.');
        return;
      }

      // Step 2: Gemini verification
      setState('verifying');
      const verifyRes  = await fetch('/api/nutrition/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query, candidates: searchData.candidates }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.ok) throw new Error(verifyData.error);

      setResult(verifyData.result);
      setState('ready');
    } catch (err: any) {
      setState('error');
      setError(err.message ?? 'Search failed. Please try again.');
    }
  };

  const reset = () => { setState('idle'); setResult(null); setError(null); };

  return { state, result, error, search, reset };
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "useNutritionSearch"
# Must print nothing
```

---

## [ ] T4.4 — Build the Food Review Card Component

Create `src/components/nutrition/FoodReviewCard.tsx`:

```typescript
// src/components/nutrition/FoodReviewCard.tsx
'use client';
import { useState } from 'react';
import type { VerifiedNutrition } from '@/hooks/useNutritionSearch';

interface Props {
  result:    VerifiedNutrition;
  onConfirm: (entry: VerifiedNutrition & { mealType: string }) => void;
  onCancel:  () => void;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export function FoodReviewCard({ result, onConfirm, onCancel }: Props) {
  const [mealType, setMealType] = useState('lunch');
  const [edited,   setEdited]   = useState({ ...result });

  const handleChange = (field: keyof VerifiedNutrition, value: string) => {
    setEdited(prev => ({
      ...prev,
      [field]: ['foodName', 'servingUnit', 'source', 'verificationNote'].includes(field as string)
        ? value : Number(value),
    }));
  };

  return (
    <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16, background: '#1a1a1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#e0e0e0', fontSize: 16 }}>{edited.foodName}</h3>
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 11,
          background: edited.dataVerified ? '#1a4a1a' : '#4a2a1a',
          color:      edited.dataVerified ? '#4caf50' : '#ff9800',
        }}>
          {edited.dataVerified ? '✓ Verified' : '⚠ Estimated'}
        </span>
      </div>

      {!edited.dataVerified && (
        <p style={{ fontSize: 12, color: '#ff9800', margin: '0 0 8px' }}>{edited.verificationNote}</p>
      )}
      <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>Source: {edited.source}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {([
          ['Calories (kcal)', 'calories'],
          ['Protein (g)',     'protein'],
          ['Carbs (g)',       'carbs'],
          ['Fat (g)',         'fat'],
        ] as [string, keyof VerifiedNutrition][]).map(([label, field]) => (
          <div key={field}>
            <label style={{ fontSize: 11, color: '#888', display: 'block' }}>{label}</label>
            <input
              type="number"
              value={edited[field] as number}
              onChange={e => handleChange(field, e.target.value)}
              style={{ width: '100%', padding: '4px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 4, color: '#e0e0e0', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Meal Type</label>
        <select
          value={mealType}
          onChange={e => setMealType(e.target.value)}
          style={{ width: '100%', padding: '6px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 4, color: '#e0e0e0' }}
        >
          {MEAL_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onConfirm({ ...edited, mealType })}
          style={{ flex: 1, padding: '8px 0', background: '#c8f040', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
        >
          Add to Log
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '8px 16px', background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: 4, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "FoodReviewCard"
# Must print nothing
```

---

## [ ] T4.5 — Wire Search into Nutrition Tab

Find the Nutrition tab component:

```bash
find src -name "*.tsx" | xargs grep -l "SEARCH\|Nutrition\|food\|Search" 2>/dev/null | head -5
```

Add these imports at the top of the Nutrition tab file:

```typescript
import { useNutritionSearch }  from '@/hooks/useNutritionSearch';
import { FoodReviewCard }      from '@/components/nutrition/FoodReviewCard';
import { logFoodEntry }        from '@/lib/firebase/firestore';
import { useAuthContext }      from '@/contexts/AuthContext';
```

Inside the component body, add:

```typescript
const { user }                              = useAuthContext();
const { state, result, error, search, reset } = useNutritionSearch();
const today = new Date().toISOString().split('T')[0];
```

Wire the search input button to call `search(inputValue)`.

Add below the search input, before the food log list:

```tsx
{state === 'searching'  && <p style={{ color: '#888' }}>Searching...</p>}
{state === 'verifying'  && <p style={{ color: '#888' }}>Verifying with AI...</p>}
{state === 'error'      && <p style={{ color: '#f44' }}>{error}</p>}
{state === 'ready' && result && (
  <FoodReviewCard
    result={result}
    onConfirm={async (entry) => {
      if (!user) return;
      await logFoodEntry(user.uid, {
        ...entry,
        servings:  1,
        logSource: 'search',
        estimated: !entry.dataVerified,
        date:      today,
      });
      reset();
    }}
    onCancel={reset}
  />
)}
```

**VERIFY:**
```
Manual test in browser:
1. Sign in to the app
2. Go to Nutrition tab
3. Type "Chicken Rice" → click Search
4. Expected: review card with calories 607, "✓ Verified", source "HPB Singapore"
5. Click "Add to Log"
6. Expected: entry appears in TODAY'S LOG; dashboard calorie total increases
```

---

## [ ] T4.6 — Privacy Network Inspection Test
> ⚠️ **MANUAL TEST — present to user and wait for confirmation.**

Present these instructions:

> Open the app in Chrome → DevTools → Network tab → filter by Fetch/XHR  
> Search for any food item. Inspect every outbound request and confirm ALL of the following:
>
> 1. ☐ No request contains `tvly-` (Tavily key)
> 2. ☐ No request body or URL contains your name, email, or Firebase UID
> 3. ☐ No request goes directly to `api.tavily.com` from the browser (all Tavily calls come from `/api/nutrition/search`)
> 4. ☐ No request body contains raw health entries

**VERIFY:** User confirms all 4 checks above are ☑ before continuing.

---

## [ ] T4.7 — Offline Degradation Test
> ⚠️ **MANUAL TEST — present to user.**

Present these instructions:

> 1. Search "Chicken Rice" once (to populate the Firestore cache)
> 2. In DevTools → Network tab → click "Offline"
> 3. Search "Chicken Rice" again
> 4. Expected: result appears with note "Cached result — offline mode"
> 5. Expected: no unhandled errors in the console

The offline handling code is already in `useNutritionSearch.ts` from T4.3.

**VERIFY:** User confirms result appears from cache when offline, with no console errors.

---

## [ ] T4.8 — Real-Time Log Display Hooks

The real-time subscription functions were already added to `src/lib/firebase/firestore.ts` in T1.9 (`subscribeNutritionLogs`, `subscribeActivityLogs`, `subscribeDailySummary`). This task adds the hooks that consume them.

Create `src/hooks/useTodayLogs.ts`:

```typescript
// src/hooks/useTodayLogs.ts
'use client';
import { useState, useEffect } from 'react';
import { subscribeNutritionLogs, subscribeActivityLogs } from '@/lib/firebase/firestore';
import type { NutritionLog, ActivityLog } from '@/types/health.types';

const today = () => new Date().toISOString().split('T')[0];

export function useNutritionLogs(uid: string | null) {
  const [logs,    setLogs]    = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    return subscribeNutritionLogs(uid, today(), data => { setLogs(data); setLoading(false); });
  }, [uid]);

  return {
    logs, loading,
    totalCalories: logs.reduce((s, l) => s + l.calories, 0),
    totalProtein:  logs.reduce((s, l) => s + l.protein,  0),
    totalCarbs:    logs.reduce((s, l) => s + l.carbs,    0),
    totalFat:      logs.reduce((s, l) => s + l.fat,      0),
  };
}

export function useActivityLogs(uid: string | null) {
  const [logs,    setLogs]    = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    return subscribeActivityLogs(uid, today(), data => { setLogs(data); setLoading(false); });
  }, [uid]);

  return {
    logs, loading,
    totalCaloriesBurned: logs.reduce((s, l) => s + l.caloriesBurned,  0),
    totalMinutes:        logs.reduce((s, l) => s + l.durationMinutes, 0),
  };
}
```

Create `src/hooks/useDailySummary.ts`:

```typescript
// src/hooks/useDailySummary.ts
'use client';
import { useState, useEffect } from 'react';
import { subscribeDailySummary } from '@/lib/firebase/firestore';
import type { DailySummary } from '@/types/health.types';

const today = () => new Date().toISOString().split('T')[0];

const EMPTY: DailySummary = {
  date:        today(),
  nutrition:   { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 },
  activity:    { totalCaloriesBurned: 0, totalMinutes: 0, sessionCount: 0, activities: [] },
  netCalories: 0,
  lastUpdated: null as any,
};

export function useDailySummary(uid: string | null) {
  const [summary, setSummary] = useState<DailySummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    return subscribeDailySummary(uid, today(), data => { setSummary(data ?? EMPTY); setLoading(false); });
  }, [uid]);

  return { summary, loading };
}
```

**VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep -E "useTodayLogs|useDailySummary"
# Must print nothing
```

---

## [ ] T4.9 — Delete Entry UI Wiring

In the **Nutrition tab** component, add:

```typescript
import { deleteFoodEntry } from '@/lib/firebase/firestore';
import { useNutritionLogs } from '@/hooks/useTodayLogs';

// Inside the component:
const { logs: todayFoods } = useNutritionLogs(user?.uid ?? null);

const handleDeleteFood = async (entry: NutritionLog) => {
  if (!user) return;
  await deleteFoodEntry(user.uid, entry.id, {
    date: entry.date, calories: entry.calories,
    protein: entry.protein, carbs: entry.carbs, fat: entry.fat,
  });
  // No state update needed — onSnapshot fires automatically
};

// Render the log list using todayFoods (from hook) instead of local state
// Wire the × button: onClick={() => handleDeleteFood(entry)}
```

In the **Activity tab** component, add:

```typescript
import { deleteActivityEntry } from '@/lib/firebase/firestore';
import { useActivityLogs }     from '@/hooks/useTodayLogs';

const { logs: todayActivities } = useActivityLogs(user?.uid ?? null);

const handleDeleteActivity = async (entry: ActivityLog) => {
  if (!user) return;
  await deleteActivityEntry(user.uid, entry.id, {
    date: entry.date, caloriesBurned: entry.caloriesBurned,
    durationMinutes: entry.durationMinutes, activityName: entry.activityName,
  });
};
```

**VERIFY:**
```
Manual test:
1. Log a food item
2. Click the × button on that item
3. Expected: item disappears immediately (real-time listener fires)
4. Expected: dashboard calorie total decreases by the deleted amount
5. Check Firestore Emulator UI: nutrition_logs document deleted; daily_summaries.nutrition.totalCalories decreased
```

---

## [ ] T4.10 — Dashboard Real-Time Summary Wiring

In the **Dashboard** component, replace any hardcoded or one-time fetched values:

```typescript
import { useDailySummary } from '@/hooks/useDailySummary';
import { useAuthContext }  from '@/contexts/AuthContext';

// Inside the component:
const { user }             = useAuthContext();
const { summary, loading } = useDailySummary(user?.uid ?? null);

// Replace hardcoded values with:
// Calories consumed:  summary.nutrition.totalCalories
// Calories burned:    summary.activity.totalCaloriesBurned
// Net calories:       summary.netCalories
// Protein (g):        summary.nutrition.totalProtein
// Carbs (g):          summary.nutrition.totalCarbs
// Fat (g):            summary.nutrition.totalFat
// Activity sessions:  summary.activity.sessionCount
// Activities today:   summary.activity.activities.join(', ')
```

**VERIFY:**
```
Manual test:
1. Open Dashboard tab — keep it visible
2. In another browser tab, go to Nutrition and log a food item
3. Switch back to Dashboard
4. Expected: calorie and macro values update WITHOUT a page refresh
5. Delete the food item
6. Expected: Dashboard values revert in real time
```

---

## [ ] T4.11 — Final End-to-End Smoke Test

Run every check in order. All must pass.

### Check 1 — TypeScript: zero errors
```bash
npx tsc --noEmit
echo "Exit code: $?"
# Exit code must be 0
```

### Check 2 — All files exist
```bash
for f in \
  src/lib/firebase/config.ts \
  src/lib/firebase/auth.ts \
  src/lib/firebase/firestore.ts \
  src/lib/firebase/admin.ts \
  src/lib/firebase/verify-token.ts \
  src/lib/firebase/migration.ts \
  src/lib/ai/gemini.ts \
  src/lib/ai/consent.ts \
  src/lib/search/tavily.ts \
  src/types/health.types.ts \
  src/hooks/useAuth.ts \
  src/hooks/useNutritionSearch.ts \
  src/hooks/useTodayLogs.ts \
  src/hooks/useDailySummary.ts \
  src/contexts/AuthContext.tsx \
  src/middleware.ts \
  src/components/nutrition/FoodReviewCard.tsx \
  src/app/api/ai/test/route.ts \
  src/app/api/ai/test-tools/route.ts \
  src/app/api/nutrition/search/route.ts \
  src/app/api/nutrition/verify/route.ts \
  functions/index.js \
  firestore.rules \
  firestore.indexes.json \
  storage.rules; do
  [ -f "$f" ] && echo "✓ $f" || echo "✗ MISSING: $f"
done
# Must show ✓ for every file — no ✗
```

### Check 3 — No security violations
```bash
# Tavily key must not be in client code
grep -r "TAVILY_API_KEY" src/app --include="*.tsx" --include="*.ts" | grep -v "src/app/api/"
# Must print nothing

# firebase-admin must not be in client components
grep -r "firebase-admin" src/app --include="*.tsx" | grep -v "src/app/api/"
# Must print nothing

# No direct Tavily API calls from browser
grep -r "tavily.com" src --include="*.tsx" --include="*.ts" | grep -v "src/lib/search/tavily.ts"
# Must print nothing
```

### Check 4 — API endpoints respond correctly
```bash
# 4a. Known food hits Firestore cache (after at least one prior search)
curl -s "http://localhost:3000/api/nutrition/search?q=Chicken+Rice" | grep '"tier":"cache"'
# Must match

# 4b. Unknown food goes to Tavily
curl -s "http://localhost:3000/api/nutrition/search?q=Avocado+Salmon+Bowl" | grep '"tier":"tavily"'
# Must match

# 4c. Verify route returns ok
curl -s -X POST http://localhost:3000/api/nutrition/verify \
  -H "Content-Type: application/json" \
  -d '{"query":"Egg","candidates":[{"foodName":"Egg","calories":78,"protein":6,"carbs":1,"fat":5,"servingSize":50,"servingUnit":"g","source":"Open Food Facts"}]}' \
  | grep '"ok":true'
# Must match

# 4d. Function calling smoke test
curl -s "http://localhost:3000/api/ai/test-tools" | grep '"functionName":"get_nutrition_data"'
# Must match
```

### Check 5 — Environment variables
```bash
# All Firebase public keys present
for k in NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID \
         NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID; do
  grep -q "^${k}=" .env.local && echo "✓ $k" || echo "✗ MISSING: $k"
done

# Tavily key has NO NEXT_PUBLIC_ prefix
grep "NEXT_PUBLIC_TAVILY" .env.local && echo "✗ FAIL: Tavily key has wrong prefix" || echo "✓ Tavily key prefix correct"
```

### Check 6 — Macro sanity unit test
```bash
npx jest src/lib/ai/__tests__/macro-sanity.test.ts --no-coverage 2>&1 | grep -E "Tests:|passed"
# Must show all tests passed
```

### Check 7 — Privacy network check (manual)
> Present to user: Open Chrome DevTools → Network → Fetch/XHR. Search for "Teh Tarik". Confirm `tvly-` key, your email, and UID are absent from all requests. User must confirm before marking T4.11 done.

### Check 8 — Real-time Dashboard update (manual)
> Present to user: Log a food item. Confirm the Dashboard calorie total updates without a page refresh. Delete the item. Confirm it reverts. User must confirm before marking T4.11 done.

---

## ✅ Phase 4 Complete When

All 8 smoke test checks above return expected results.

**Mark all Phase 4 tasks `[x]` in PROGRESS.md.**  
**Implementation is complete. Open PHASE_5_FUTURE.md only when ready to continue development.**
