// Server-side only — never import from client components or pages
// HPB Singapore Food Insights Database (SG FoodID) — https://pphtpc.hpb.gov.sg/web/sgfoodid/

const BASE = 'https://pphtpc.hpb.gov.sg/bff/v1/food-portal';
const DETAIL_URL = 'https://pphtpc.hpb.gov.sg/web/sgfoodid/tools/food-search/details';

interface HpbSearchItem {
  crId:        string;
  name:        string;
  description: string;
  l1Category:  string;
  l2Category:  string;
}

interface HpbNutrients {
  energy:       number;
  protein:      number;
  fat:          number;
  carbohydrate: number;
}

interface HpbDetail {
  crId:                    string;
  name:                    string;
  defaultWeight:           number;   // default serving in grams
  defaultPortion:          string;   // e.g. "1 plate(s) = 346g"
  baseFoodNutrients:       HpbNutrients; // per 100g
  calculatedFoodNutrients: HpbNutrients; // per default serving
}

export interface HpbResult {
  foodName:    string;
  calories:    number;
  protein:     number;
  carbs:       number;
  fat:         number;
  servingSize: number;
  servingUnit: string;
  source:      string;
  sourceUrl:   string;
}

export async function searchHpbFood(query: string): Promise<HpbResult | null> {
  // Step 1 — search by name
  const searchRes = await fetch(
    `${BASE}/foods?searchText=${encodeURIComponent(query)}&pageNumber=1`,
    { headers: { Accept: 'application/json' } },
  );
  if (!searchRes.ok) return null;

  const items: HpbSearchItem[] = await searchRes.json();
  if (!items.length) return null;

  // Step 2 — get nutrition detail for the top result
  const detailRes = await fetch(
    `${BASE}/foods/details/${items[0].crId}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!detailRes.ok) return null;

  const d: HpbDetail = await detailRes.json();
  const n = d.calculatedFoodNutrients;   // prefer per-serving values

  if (!n.energy || n.energy <= 0) return null;

  return {
    foodName:    d.name,
    calories:    Math.round(n.energy),
    protein:     Math.round(n.protein  * 10) / 10,
    carbs:       Math.round(n.carbohydrate * 10) / 10,
    fat:         Math.round(n.fat      * 10) / 10,
    servingSize: d.defaultWeight,
    servingUnit: 'g',
    source:      'HPB FoodID',
    sourceUrl:   `${DETAIL_URL}/${d.crId}`,
  };
}
