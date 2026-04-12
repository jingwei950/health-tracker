import type { FoodSearchResult } from "./types";

const FOOD_SEARCH_SYSTEM_SHAPE = `{"food_name":"","serving_size":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fibre_g":0,"sugar_g":0,"source_url":"","source_name":""}`;

export function stripCodeFences(raw: string): string {
  return raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/**
 * Parses model text into a validated FoodSearchResult.
 */
export function parseFoodResponseText(text: string): FoodSearchResult {
  const cleaned = stripCodeFences(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Could not parse nutrition data. The model did not return valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid nutrition response shape.");
  }
  const o = parsed as Record<string, unknown>;
  const result: FoodSearchResult = {
    food_name: str(o.food_name),
    serving_size: str(o.serving_size),
    calories: num(o.calories),
    protein_g: num(o.protein_g),
    carbs_g: num(o.carbs_g),
    fat_g: num(o.fat_g),
    fibre_g: num(o.fibre_g),
    sugar_g: num(o.sugar_g),
    source_url: str(o.source_url),
    source_name: str(o.source_name),
  };
  if (!result.food_name.trim()) {
    throw new Error("Search returned empty food name.");
  }
  return result;
}

export const foodSearchSystemPrompt = `You are a nutrition database. Respond ONLY with raw JSON, no markdown, no preamble, no code fences. Return exactly this shape: ${FOOD_SEARCH_SYSTEM_SHAPE}. Prefer HPB Singapore (healthhub.sg) for SG local dishes, then Nutritionix, USDA FoodData Central, CalorieKing.`;
