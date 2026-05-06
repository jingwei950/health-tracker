import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import type { NutritionLog } from "@/types/health.types";

import { calendarWeekCalories } from "./week-calories";

function entry(partial: Partial<NutritionLog> & Pick<NutritionLog, "id" | "date" | "calories">): NutritionLog {
  return {
    foodName: "x",
    mealType: "snack",
    servingSize: 1,
    servingUnit: "g",
    servings: 1,
    protein: 0,
    carbs: 0,
    fat: 0,
    source: "",
    dataVerified: true,
    estimated: false,
    logSource: "search",
    loggedAt: Timestamp.now(),
    ...partial,
  };
}

describe("calendarWeekCalories", () => {
  it("sums calories per local calendar day for Mon–Sun week", () => {
    const anchor = new Date(2026, 4, 7); // Thursday 7 May 2026
    const logs: NutritionLog[] = [
      entry({ id: "1", date: "2026-05-04", calories: 1000 }), // Mon
      entry({ id: "2", date: "2026-05-07", calories: 500 }), // Thu (today)
    ];
    const w = calendarWeekCalories(logs, anchor);
    expect(w).toHaveLength(7);
    expect(w[0].dayLabel).toBe("M");
    expect(w[0].cal).toBe(1000);
    expect(w[3].cal).toBe(500);
    expect(w[3].isToday).toBe(true);
  });
});
