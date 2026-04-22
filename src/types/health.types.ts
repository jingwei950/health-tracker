// src/types/health.types.ts
import { type Timestamp } from 'firebase/firestore';

export interface NutritionLog {
  id:           string;
  foodName:     string;
  mealType:     'breakfast' | 'lunch' | 'dinner' | 'snack';
  servingSize:  number;
  servingUnit:  string;
  servings:     number;
  calories:     number;
  protein:      number;
  carbs:        number;
  fat:          number;
  fiber?:       number;
  sugar?:       number;
  sodium?:      number;
  source:       string;
  dataVerified: boolean;
  estimated:    boolean;
  logSource:    'search' | 'quick_add' | 'manual' | 'barcode';
  date:         string;
  loggedAt:     Timestamp;
}

export interface ActivityLog {
  id:              string;
  activityName:    string;
  category:        'sport' | 'cardio' | 'strength' | 'flexibility' | 'other';
  durationMinutes: number;
  durationHours:   number;
  intensityLevel:  'low' | 'medium' | 'high';
  met:             number;
  caloriesBurned:  number;
  notes?:          string;
  heartRateAvg?:   number;
  heartRateMax?:   number;
  distanceKm?:     number;
  estimated:       boolean;
  date:            string;
  loggedAt:        Timestamp;
  source:          'manual' | 'apple_watch' | 'import';
}

export interface SleepLog {
  id:          string;
  date:        string;
  totalHours:  number;
  quality:     'poor' | 'fair' | 'good' | 'excellent';
  stages?: { core: number; deep: number; rem: number; awake: number };
  heartRateAvg?: number;
  notes?:        string;
  loggedAt:      Timestamp;
  source:        'manual' | 'apple_watch' | 'import';
}

export interface DailySummary {
  date: string;
  nutrition: {
    totalCalories: number;
    totalProtein:  number;
    totalCarbs:    number;
    totalFat:      number;
    mealCount:     number;
  };
  activity: {
    totalCaloriesBurned: number;
    totalMinutes:        number;
    sessionCount:        number;
    activities:          string[];
  };
  sleep?: { totalHours: number; quality: string };
  netCalories: number;
  lastUpdated: Timestamp;
}

export interface UserProfile {
  displayName:      string;
  email:            string;
  createdAt:        Timestamp;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  age?:             number;
  heightCm?:        number;
  weightKg?:        number;
  timezone?:        string;
  goals?: {
    dailyCalories?:   number;
    dailyProtein?:    number;
    dailyCarbs?:      number;
    dailyFat?:        number;
    weeklyWorkouts?:  number;
    dailySleepHours?: number;
  };
}

export interface UserPreferences {
  aiEnabled:             boolean;
  firebaseAIConsent:     boolean;
  preferLocalAI:         boolean;
  notificationsEnabled:  boolean;
  dataRetentionDays:     number;
}

export interface NutritionCacheEntry {
  foodName:     string;
  cachedAt:     Timestamp;
  expiresAt:    Timestamp;
  source:       string;
  calories:     number;
  protein:      number;
  carbs:        number;
  fat:          number;
  servingSize:  number;
  servingUnit:  string;
  dataVerified: boolean;
}
