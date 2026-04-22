import type {
  ActivityItem,
  BmiInfo,
  FoodItem,
  Goals,
  SleepEntry,
} from "./types";

export const f2 = (n: number) => parseFloat(n.toFixed(2));

export function pct(v: number, mx: number): string {
  return Math.min(100, (v / mx) * 100).toFixed(1);
}

export function sleepScore(e: SleepEntry): number {
  return Math.round(
    (e.stages.deep / e.totalHours) * 40 +
      (e.stages.rem / e.totalHours) * 35 +
      Math.min(e.totalHours / 8, 1) * 25,
  );
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiInfo(b: number): BmiInfo {
  if (b < 18.5)
    return {
      label: "Underweight",
      band: "bb",
      color: "var(--status-info)",
      tooltip: "Consider increasing caloric intake with nutrient-dense foods.",
    };
  if (b < 25)
    return {
      label: "Healthy",
      band: "bgg",
      color: "var(--status-success)",
      tooltip: "Great work! Maintain your current habits.",
    };
  if (b < 30)
    return {
      label: "Overweight",
      band: "ba",
      color: "var(--status-warning)",
      tooltip: "A modest calorie deficit of 300–500 kcal/day can help.",
    };
  return {
    label: "Obese",
    band: "br",
    color: "var(--status-danger)",
    tooltip: "Consult a healthcare professional for a personalised plan.",
  };
}

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  burn: number;
};

export function totals(food: FoodItem[], act: ActivityItem[]): MacroTotals {
  return {
    calories: food.reduce((s, f) => s + f.calories, 0),
    protein: food.reduce((s, f) => s + f.protein, 0),
    carbs: food.reduce((s, f) => s + f.carbs, 0),
    fat: food.reduce((s, f) => s + f.fat, 0),
    burn: act.reduce((s, a) => s + a.calories, 0),
  };
}

export function degXY(
  cx: number,
  cy: number,
  r: number,
  deg: number,
): { x: number; y: number } {
  const rd = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rd), y: cy + r * Math.sin(rd) };
}

export function arcPath(
  cx: number,
  cy: number,
  r: number,
  a1: number,
  a2: number,
): string {
  const s = degXY(cx, cy, r, a1);
  const e = degXY(cx, cy, r, a2);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${lg} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

export function macroCaloriesFromMacros(t: MacroTotals): number {
  return t.protein * 4 + t.carbs * 4 + t.fat * 9;
}

export function idealWeightRangeKg(heightCm: number): { min: string; max: string } {
  const hm = heightCm / 100;
  return {
    min: (18.5 * hm * hm).toFixed(1),
    max: (24.9 * hm * hm).toFixed(1),
  };
}

export type MacroRow = {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
};

export function macroProgressRows(t: MacroTotals, goals: Goals): MacroRow[] {
  return [
    {
      label: "Calories",
      value: t.calories,
      goal: goals.calories,
      unit: "kcal",
      color: "var(--primary)",
    },
    { label: "Protein", value: t.protein, goal: goals.protein, unit: "g", color: "var(--chart-1)" },
    { label: "Carbs", value: t.carbs, goal: goals.carbs, unit: "g", color: "var(--chart-3)" },
    { label: "Fat", value: t.fat, goal: goals.fat, unit: "g", color: "var(--chart-5)" },
  ];
}

export function bmiXY(b: number, r: number): { x: number; y: number } {
  const a =
    (180 - ((Math.max(10, Math.min(40, b)) - 10) / 30) * 180) * (Math.PI / 180);
  return { x: f2(100 + r * Math.cos(a)), y: f2(100 - r * Math.sin(a)) };
}
