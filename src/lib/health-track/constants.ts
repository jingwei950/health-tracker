import type {
  ActivityItem,
  FoodItem,
  Goals,
  SleepEntry,
} from "@/lib/health-track/types";

export const defaultGoals: Goals = {
  calories: 1800,
  protein: 120,
  carbs: 200,
  fat: 60,
};

export const defaultFood: FoodItem[] = [
  {
    id: 1,
    name: "Chicken Rice",
    servingSize: "1 plate (400g)",
    calories: 607,
    protein: 32,
    carbs: 78,
    fat: 18,
    fiber: 2,
    sugar: 3,
    sourceName: "HPB Singapore",
    sourceUrl: "https://www.healthhub.sg/programmes/nutritionhub",
  },
];

export const defaultAct: ActivityItem[] = [
  {
    id: 1,
    name: "Volleyball",
    duration: 60,
    intensity: "high",
    calories: 648,
    type: "manual",
  },
];

export const defaultSleep: SleepEntry[] = [
  {
    id: 1,
    date: "2026-04-10",
    totalHours: 7.2,
    stages: { core: 2.8, deep: 1.1, rem: 1.9, awake: 1.4 },
    heartRate: 58,
  },
];
