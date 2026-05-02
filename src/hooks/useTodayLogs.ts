'use client';
import { useState, useEffect } from 'react';
import { subscribeNutritionLogs, subscribeActivityLogs } from '@/lib/firebase/firestore';
import type { NutritionLog, ActivityLog } from '@/types/health.types';

const today = () => new Date().toISOString().split('T')[0];

export function useNutritionLogs(uid: string | null) {
  const [logs,    setLogs]    = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLogs([]); setLoading(false); return; }
    setLoading(true);
    return subscribeNutritionLogs(uid, today(), data => { setLogs(data); setLoading(false); });
  }, [uid]);

  return {
    logs, loading,
    totalCalories: logs.reduce((s, l) => s + l.calories, 0),
    totalProtein:  logs.reduce((s, l) => s + l.protein,  0),
    totalCarbs:    logs.reduce((s, l) => s + l.carbs,    0),
    totalFat:      logs.reduce((s, l) => s + l.fat,      0),
  };
}

export function useActivityLogs(uid: string | null) {
  const [logs,    setLogs]    = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLogs([]); setLoading(false); return; }
    setLoading(true);
    return subscribeActivityLogs(uid, today(), data => { setLogs(data); setLoading(false); });
  }, [uid]);

  return {
    logs, loading,
    totalCaloriesBurned: logs.reduce((s, l) => s + l.caloriesBurned,  0),
    totalMinutes:        logs.reduce((s, l) => s + l.durationMinutes, 0),
  };
}
