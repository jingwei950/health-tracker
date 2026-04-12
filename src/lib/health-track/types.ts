export type TabId = "db" | "fd" | "ac" | "sl" | "bm";

export type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodItem = {
  id: number;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sourceName: string;
  sourceUrl: string;
};

/** Raw API / model shape before mapping to FoodItem */
export type FoodSearchResult = {
  food_name: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  source_url: string;
  source_name: string;
};

export type ActivityIntensity = "low" | "medium" | "high";

export type ActivityItem = {
  id: number;
  name: string;
  duration: number;
  intensity: ActivityIntensity | null;
  calories: number;
  type: "manual" | "watch";
};

export type SleepStages = {
  core: number;
  deep: number;
  rem: number;
  awake: number;
};

export type SleepEntry = {
  id: number;
  date: string;
  totalHours: number;
  stages: SleepStages;
  heartRate: number | null;
};

export type BmiBand = "bb" | "bgg" | "ba" | "br";

export type BmiInfo = {
  label: string;
  band: BmiBand;
  color: string;
  tooltip: string;
};
