import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel }         from '@/lib/ai/gemini';
import { macroSanityCheck }       from '@/lib/ai/macro-sanity';
import { setAdminNutritionCache } from '@/lib/firebase/admin';
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
  sourceUrl:        string;
  dataVerified:     boolean;
  verificationNote: string;
}

// Coerce Gemini's response fields to numbers — it may return null when data is missing
function sanitizeNumbers(r: VerifiedResult): VerifiedResult {
  return {
    ...r,
    calories:    Number(r.calories)    || 0,
    protein:     Number(r.protein)     || 0,
    carbs:       Number(r.carbs)       || 0,
    fat:         Number(r.fat)         || 0,
    servingSize: Number(r.servingSize) || 100,
    sourceUrl:   r.sourceUrl ?? '',
  };
}

function applyMacroSanity(r: VerifiedResult): VerifiedResult {
  const s = sanitizeNumbers(r);

  if (s.calories === 0) {
    return {
      ...s,
      dataVerified:     false,
      verificationNote: 'Could not extract calorie data — values are estimated, please review and adjust',
    };
  }

  if (!macroSanityCheck(s.protein, s.carbs, s.fat, s.calories)) {
    const est = s.protein * 4 + s.carbs * 4 + s.fat * 9;
    const pct = Math.round(Math.abs(est - s.calories) / s.calories * 100);
    return {
      ...s,
      dataVerified:     false,
      verificationNote: `Macro totals (${Math.round(est)} kcal) differ from stated calories (${s.calories} kcal) by ${pct}%`,
    };
  }
  return s;
}

export async function POST(request: NextRequest) {
  try {
    const { query, candidates }: { query: string; candidates: NutritionCandidate[] } =
      await request.json();

    if (!candidates?.length)
      return NextResponse.json({ error: 'No candidates provided' }, { status: 400 });

    // ── Fast path: HPB FoodID data is pre-extracted from official SG source ──
    const hpb = candidates.find(c => c.source === 'HPB FoodID' && !c.rawContent && c.calories > 0);
    if (hpb) {
      const result: VerifiedResult = {
        foodName:         hpb.foodName,
        calories:         hpb.calories,
        protein:          hpb.protein,
        carbs:            hpb.carbs,
        fat:              hpb.fat,
        servingSize:      hpb.servingSize,
        servingUnit:      hpb.servingUnit,
        source:           'HPB FoodID',
        sourceUrl:        hpb.url ?? '',
        dataVerified:     true,
        verificationNote: 'Verified — HPB Singapore Food Insights Database',
      };
      const verified = applyMacroSanity(result);
      setAdminNutritionCache(query, verified).catch(() => {});
      return NextResponse.json({ ok: true, result: verified });
    }

    // ── Gemini path: extract from web snippets or Open Food Facts numbers ──
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
2. Extract nutrition values from the web snippet if present; otherwise use your knowledge of Singapore food nutrition to estimate
3. Always return numeric values for calories, protein, carbs, fat, servingSize — never null or 0 unless the food genuinely has none
4. Set dataVerified to true ONLY if data is from a credible source (HPB, HealthHub, official nutrition database) and internally consistent
5. Set dataVerified to false and note "Estimated from food knowledge" if using estimates rather than extracted data
6. Set sourceUrl to the URL from the "[Source URL: ...]" line in the web snippet, or "" if absent

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
  "sourceUrl": string,
  "dataVerified": boolean,
  "verificationNote": string
}`;

    const response = await model.generateContent(prompt);
    const rawText  = response.response.text().trim()
      .replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed: VerifiedResult = JSON.parse(rawText);
    const verified = applyMacroSanity(parsed);

    if (candidates.some(c => c.rawContent) && verified.dataVerified) {
      setAdminNutritionCache(query, verified).catch(() => {});
    }

    return NextResponse.json({ ok: true, result: verified });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
