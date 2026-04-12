import { describe, expect, it } from "vitest";
import type { FoodItem } from "./types";
import {
  bmi,
  bmiInfo,
  macroCaloriesFromMacros,
  pct,
  sleepScore,
  totals,
} from "./nutrition";

describe("totals", () => {
  it("sums food and activity burn", () => {
    const food: FoodItem[] = [
      {
        id: 1,
        name: "x",
        servingSize: "1",
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 5,
        fiber: 0,
        sugar: 0,
        sourceName: "",
        sourceUrl: "",
      },
    ];
    const t = totals(food, [{ id: 1, name: "run", duration: 30, intensity: "high", calories: 50, type: "manual" }]);
    expect(t.calories).toBe(100);
    expect(t.burn).toBe(50);
  });
});

describe("bmi", () => {
  it("matches standard formula", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 1);
  });
});

describe("bmiInfo", () => {
  it("returns healthy for mid range", () => {
    expect(bmiInfo(22).label).toBe("Healthy");
  });
});

describe("sleepScore", () => {
  it("returns 0-100 scale number", () => {
    const sc = sleepScore({
      id: 1,
      date: "2026-01-01",
      totalHours: 8,
      stages: { core: 4, deep: 1.5, rem: 2, awake: 0.5 },
      heartRate: 60,
    });
    expect(sc).toBeGreaterThanOrEqual(0);
    expect(sc).toBeLessThanOrEqual(100);
  });
});

describe("pct", () => {
  it("caps at 100", () => {
    expect(parseFloat(pct(2000, 1000))).toBe(100);
  });
});

describe("macroCaloriesFromMacros", () => {
  it("sums macro calories", () => {
    expect(
      macroCaloriesFromMacros({
        calories: 0,
        protein: 10,
        carbs: 10,
        fat: 10,
        burn: 0,
      }),
    ).toBe(10 * 4 + 10 * 4 + 10 * 9);
  });
});
