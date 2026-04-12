import type { FoodItem, FoodSearchResult } from "@/lib/health-track/types";

export function searchResultToFoodItem(
  r: FoodSearchResult,
  id: number,
): FoodItem {
  return {
    id,
    name: r.food_name,
    servingSize: r.serving_size,
    calories: Math.round(r.calories),
    protein: r.protein_g,
    carbs: r.carbs_g,
    fat: r.fat_g,
    fiber: r.fibre_g,
    sugar: r.sugar_g,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
  };
}
