"use client";

import { useCallback, useMemo, useState } from "react";

import { useStoredTheme } from "@/hooks/useStoredTheme";
import { useRouter } from "next/navigation";

import type { MacroTotals } from "@/lib/health-track/nutrition";
import type {
  ActivityIntensity,
  Goals,
  SleepEntry,
  TabId,
} from "@/lib/health-track/types";
import { cn } from "@/lib/utils";

import { AppHeader } from "./AppHeader";
import { ActivityPanel } from "@/features/activity/components/ActivityPanel";
import { defaultGoals, defaultSleep } from "@/lib/health-track/constants";
import { DashboardPanel } from "@/features/dashboard/components/DashboardPanel";
import { FoodPanel } from "@/features/food/components/FoodPanel";
import { GoalsDialog } from "./GoalsDialog";
import { BmiPanel } from "@/features/bmi/components/BmiPanel";
import { SleepPanel } from "@/features/sleep/components/SleepPanel";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

import { useAuthContext }   from "@/contexts/AuthContext";
import { useNutritionLogs, useActivityLogs } from "@/hooks/useTodayLogs";
import { useUserProfileBody } from "@/hooks/useUserProfileBody";
import { logOut } from "@/lib/firebase/auth";
import { clearAuthCookie } from "@/lib/firebase/session";
import {
  logFoodEntry, deleteFoodEntry,
  logActivityEntry, deleteActivityEntry,
} from "@/lib/firebase/firestore";
import type { NutritionLog, ActivityLog } from "@/types/health.types";
import type { VerifiedNutrition } from "@/hooks/useNutritionSearch";

const ACTIVITY_METS: Record<ActivityIntensity, number> = {
  low: 3.5,
  medium: 6.0,
  high: 9.0,
};

export function HealthTrackApp() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("db");
  const { theme, toggleTheme } = useStoredTheme();
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [goalsDialogKey, setGoalsDialogKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [sleep, setSleep] = useState<SleepEntry[]>(defaultSleep);

  const [atab, setAtab] = useState<"manual" | "watch">("manual");
  const [an, setAn] = useState("");
  const [ad, setAd] = useState("");
  const [ai, setAi] = useState<ActivityIntensity>("medium");
  const [wj, setWj] = useState("");
  const [we, setWe] = useState<string | null>(null);

  const [sj, setSj] = useState("");
  const [se, setSe] = useState<string | null>(null);

  const { user } = useAuthContext();
  const uid = user?.uid ?? null;
  const today = new Date().toISOString().split('T')[0];

  const { weightKg, heightCm, setWeightKg, setHeightCm } = useUserProfileBody(uid);

  const { logs: nutritionLogs } = useNutritionLogs(uid);
  const { logs: activityLogs }  = useActivityLogs(uid);

  const t = useMemo<MacroTotals>(() => ({
    calories: nutritionLogs.reduce((s, l) => s + l.calories, 0),
    protein:  nutritionLogs.reduce((s, l) => s + l.protein,  0),
    carbs:    nutritionLogs.reduce((s, l) => s + l.carbs,    0),
    fat:      nutritionLogs.reduce((s, l) => s + l.fat,      0),
    burn:     activityLogs.reduce((s, l)  => s + l.caloriesBurned, 0),
  }), [nutritionLogs, activityLogs]);

  const recentFoods = useMemo(() => [...nutritionLogs].reverse().slice(0, 5), [nutritionLogs]);
  const sessionCount = activityLogs.length;

  const handleLogFood = useCallback(async (entry: VerifiedNutrition & { mealType: string }) => {
    if (!uid) throw new Error('Sign in to log food');
    await logFoodEntry(uid, {
      foodName:    entry.foodName,
      mealType:    entry.mealType as NutritionLog['mealType'],
      servings:    1,
      servingSize: entry.servingSize,
      servingUnit: entry.servingUnit,
      calories:    entry.calories,
      protein:     entry.protein,
      carbs:       entry.carbs,
      fat:         entry.fat,
      source:      entry.source,
      dataVerified: entry.dataVerified,
      estimated:   !entry.dataVerified,
      logSource:   'search',
      date:        today,
    });
  }, [uid, today]);

  const handleDeleteFood = useCallback(async (entry: NutritionLog) => {
    if (!uid) return;
    await deleteFoodEntry(uid, entry.id, {
      date:     entry.date,
      calories: entry.calories,
      protein:  entry.protein,
      carbs:    entry.carbs,
      fat:      entry.fat,
    });
  }, [uid]);

  const handleQuickAdd = useCallback(async (logId: string) => {
    if (!uid) return;
    const entry = nutritionLogs.find(l => l.id === logId);
    if (!entry) return;
    await logFoodEntry(uid, {
      foodName:    entry.foodName,
      mealType:    entry.mealType,
      servings:    entry.servings,
      servingSize: entry.servingSize,
      servingUnit: entry.servingUnit,
      calories:    entry.calories,
      protein:     entry.protein,
      carbs:       entry.carbs,
      fat:         entry.fat,
      source:      entry.source,
      dataVerified: entry.dataVerified,
      estimated:   entry.estimated,
      logSource:   'quick_add',
      date:        today,
    });
  }, [uid, nutritionLogs, today]);

  const addManualActivity = useCallback(async () => {
    const n = an.trim();
    const d = Number.parseFloat(ad);
    if (!n || !d || d <= 0 || weightKg == null) return;
    const met      = ACTIVITY_METS[ai] ?? 6;
    const calories = Math.round((met * weightKg * d) / 60);
    if (uid) {
      await logActivityEntry(uid, {
        activityName:    n,
        category:        'other',
        durationMinutes: d,
        durationHours:   d / 60,
        intensityLevel:  ai,
        met,
        caloriesBurned:  calories,
        estimated:       true,
        date:            today,
        source:          'manual',
      });
    }
    setAn("");
    setAd("");
  }, [an, ad, ai, weightKg, uid, today]);

  const importWatch = useCallback(async () => {
    setWe(null);
    try {
      const d = JSON.parse(wj.trim()) as {
        workouts?: Array<{ name: string; duration_min: number; calories: number }>;
        active_calories?: number;
      };
      const entries: Omit<ActivityLog, 'id' | 'loggedAt'>[] = [];
      (d.workouts ?? []).forEach((w) => {
        entries.push({
          activityName:    w.name,
          category:        'other',
          durationMinutes: w.duration_min,
          durationHours:   w.duration_min / 60,
          intensityLevel:  'medium',
          met:             6.0,
          caloriesBurned:  w.calories,
          estimated:       false,
          date:            today,
          source:          'apple_watch',
        });
      });
      if (!d.workouts?.length && d.active_calories) {
        entries.push({
          activityName:    'Apple Watch Activity',
          category:        'other',
          durationMinutes: 0,
          durationHours:   0,
          intensityLevel:  'medium',
          met:             6.0,
          caloriesBurned:  d.active_calories,
          estimated:       false,
          date:            today,
          source:          'apple_watch',
        });
      }
      if (uid) {
        await Promise.all(entries.map(e => logActivityEntry(uid, e)));
      }
      setWj("");
    } catch {
      setWe("Invalid JSON — check the format");
    }
  }, [wj, uid, today]);

  const handleDeleteActivity = useCallback(async (entry: ActivityLog) => {
    if (!uid) return;
    await deleteActivityEntry(uid, entry.id, {
      date:            entry.date,
      caloriesBurned:  entry.caloriesBurned,
      durationMinutes: entry.durationMinutes,
      activityName:    entry.activityName,
    });
  }, [uid]);

  const importSleep = useCallback(() => {
    setSe(null);
    try {
      const d = JSON.parse(sj.trim()) as {
        date?: string;
        total_hours?: number;
        stages?: SleepEntry["stages"];
        heart_rate_avg?: number | null;
      };
      if (!d.date || d.total_hours == null || !d.stages) {
        throw new Error("Missing required fields: date, total_hours, stages");
      }
      const entry: SleepEntry = {
        id: Date.now(),
        date: d.date,
        totalHours: d.total_hours,
        stages: d.stages,
        heartRate: d.heart_rate_avg ?? null,
      };
      setSleep((prev) => [...prev, entry]);
      setSj("");
    } catch (e) {
      setSe(e instanceof Error ? e.message : "Invalid JSON format");
    }
  }, [sj]);

  const handleOpenGoals = useCallback(() => {
    setGoalsDialogKey((k) => k + 1);
    setGoalsOpen(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await logOut();
    clearAuthCookie();
    router.replace("/login");
  }, [router]);

  return (
    <div
      className={cn(
        "min-h-svh bg-background font-sans leading-normal text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <h2 className="sr-only">
        HealthTrack SG — personal health and nutrition tracker with food logging,
        activity, sleep, and BMI calculator
      </h2>
      <div className="flex h-svh flex-col overflow-hidden md:flex-row">
        <Sidebar
          tab={tab}
          onTab={setTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader
            onOpenGoals={handleOpenGoals}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
          />
          <TopBar
            tab={tab}
            onOpenGoals={handleOpenGoals}
            userInitial={
              user?.displayName?.trim()?.[0] ??
              user?.email?.trim()?.[0] ??
              null
            }
          />
          <main className="flex-1 overflow-y-auto">
        {tab === "db" ? (
          <DashboardPanel
            goals={goals}
            t={t}
            recentFoods={recentFoods}
            nutritionLogs={nutritionLogs}
            activityLogs={activityLogs}
            sessionCount={sessionCount}
            sleep={sleep}
            weightKg={weightKg}
            heightCm={heightCm}
            onQuickAdd={handleQuickAdd}
            onGoEat={setTab}
          />
        ) : null}
        {tab === "fd" ? (
          <FoodPanel
            uid={uid}
            goals={goals}
            food={nutritionLogs}
            t={t}
            onLog={handleLogFood}
            onRemove={handleDeleteFood}
          />
        ) : null}
        {tab === "ac" ? (
          <ActivityPanel
            weightKg={weightKg}
            act={activityLogs}
            atab={atab}
            onAtab={setAtab}
            an={an}
            onAn={setAn}
            ad={ad}
            onAd={setAd}
            ai={ai}
            onAi={setAi}
            wj={wj}
            onWj={setWj}
            we={we}
            onAddManual={addManualActivity}
            onImportWatch={importWatch}
            onRemove={handleDeleteActivity}
          />
        ) : null}
        {tab === "sl" ? (
          <SleepPanel
            sleep={sleep}
            sj={sj}
            onSj={setSj}
            se={se}
            onImport={importSleep}
            onRemove={(id) =>
              setSleep((prev) => prev.filter((s) => s.id !== id))
            }
          />
        ) : null}
        {tab === "bm" ? (
          <BmiPanel
            weightKg={weightKg}
            heightCm={heightCm}
            onWeight={setWeightKg}
            onHeight={setHeightCm}
          />
        ) : null}
          </main>
          <BottomNav tab={tab} onTab={setTab} />
        </div>
      </div>
      <GoalsDialog
        key={goalsDialogKey}
        open={goalsOpen}
        onOpenChange={setGoalsOpen}
        goals={goals}
        onSave={setGoals}
      />
    </div>
  );
}
