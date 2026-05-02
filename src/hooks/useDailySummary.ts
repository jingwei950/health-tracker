'use client';
import { useState, useEffect } from 'react';
import { subscribeDailySummary } from '@/lib/firebase/firestore';
import type { DailySummary } from '@/types/health.types';

const today = () => new Date().toISOString().split('T')[0];

const EMPTY: DailySummary = {
  date:        today(),
  nutrition:   { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 },
  activity:    { totalCaloriesBurned: 0, totalMinutes: 0, sessionCount: 0, activities: [] },
  netCalories: 0,
  lastUpdated: null as any,
};

export function useDailySummary(uid: string | null) {
  const [summary, setSummary] = useState<DailySummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setSummary(EMPTY); setLoading(false); return; }
    setLoading(true);
    return subscribeDailySummary(uid, today(), data => { setSummary(data ?? EMPTY); setLoading(false); });
  }, [uid]);

  return { summary, loading };
}
