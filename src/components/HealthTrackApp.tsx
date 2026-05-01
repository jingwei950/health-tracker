"use client";

import { useCallback, useMemo, useState } from "react";

import { totals } from "@/lib/health-track/nutrition";
import type {
  ActivityIntensity,
  ActivityItem,
  FoodItem,
  FoodSearchResult,
  Goals,
  SleepEntry,
  TabId,
} from "@/lib/health-track/types";
import { cn } from "@/lib/utils";

import { AppHeader } from "./AppHeader";
import { ActivityPanel } from "@/features/activity/components/ActivityPanel";
import {
  defaultAct,
  defaultFood,
  defaultGoals,
  defaultSleep,
} from "@/lib/health-track/constants";
import { DashboardPanel } from "@/features/dashboard/components/DashboardPanel";
import { FoodPanel } from "@/features/food/components/FoodPanel";
import { GoalsDialog } from "./GoalsDialog";
import { BmiPanel } from "@/features/bmi/components/BmiPanel";
import { searchResultToFoodItem } from "@/lib/health-track/map-food";
import { SleepPanel } from "@/features/sleep/components/SleepPanel";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

function formatFoodSearchError(message: string): string {
  if (message.includes("missing ANTHROPIC_API_KEY")) {
    return "Add your Anthropic API key: set ANTHROPIC_API_KEY in .env.local at the project root, then restart the dev server. On Vercel, add ANTHROPIC_API_KEY under Project → Settings → Environment Variables and redeploy.";
  }
  return message;
}

export function HealthTrackApp() {
  const [tab, setTab] = useState<TabId>("db");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [goalsDialogKey, setGoalsDialogKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [food, setFood] = useState<FoodItem[]>(defaultFood);
  const [act, setAct] = useState<ActivityItem[]>(defaultAct);
  const [sleep, setSleep] = useState<SleepEntry[]>(defaultSleep);
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(174);

  const [foodQuery, setFoodQuery] = useState("");
  const [foodResult, setFoodResult] = useState<FoodSearchResult | null>(null);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState<string | null>(null);

  const [atab, setAtab] = useState<"manual" | "watch">("manual");
  const [an, setAn] = useState("");
  const [ad, setAd] = useState("");
  const [ai, setAi] = useState<ActivityIntensity>("medium");
  const [wj, setWj] = useState("");
  const [we, setWe] = useState<string | null>(null);

  const [sj, setSj] = useState("");
  const [se, setSe] = useState<string | null>(null);

  const t = useMemo(() => totals(food, act), [food, act]);

  const searchFood = useCallback(async () => {
    const q = foodQuery.trim();
    if (!q) return;
    setFoodLoading(true);
    setFoodError(null);
    setFoodResult(null);
    try {
      const res = await fetch("/api/food-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = (await res.json()) as { error?: string; result?: FoodSearchResult };
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      if (!data.result) throw new Error("Invalid response from server.");
      setFoodResult(data.result);
    } catch (e) {
      const raw =
        e instanceof Error ? e.message : "Search failed. Try again.";
      setFoodError(formatFoodSearchError(raw));
    } finally {
      setFoodLoading(false);
    }
  }, [foodQuery]);

  const addFoodFromResult = useCallback(() => {
    if (!foodResult) return;
    setFood((prev) => [
      ...prev,
      searchResultToFoodItem(foodResult, Date.now()),
    ]);
    setFoodResult(null);
    setFoodQuery("");
  }, [foodResult]);

  const removeFood = useCallback((id: number) => {
    setFood((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const quickAddFood = useCallback((id: number) => {
    const f = food.find((x) => x.id === id);
    if (f) {
      setFood((prev) => [...prev, { ...f, id: Date.now() }]);
    }
  }, [food]);

  const addManualActivity = useCallback(() => {
    const n = an.trim();
    const d = Number.parseFloat(ad);
    if (!n || !d || d <= 0) return;
    const mets: Record<ActivityIntensity, number> = {
      low: 3.5,
      medium: 6.0,
      high: 9.0,
    };
    const calories = Math.round(((mets[ai] ?? 6) * weightKg * d) / 60);
    setAct((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: n,
        duration: d,
        intensity: ai,
        calories,
        type: "manual",
      },
    ]);
    setAn("");
    setAd("");
  }, [an, ad, ai, weightKg]);

  const importWatch = useCallback(() => {
    setWe(null);
    try {
      const d = JSON.parse(wj.trim()) as {
        workouts?: Array<{
          name: string;
          duration_min: number;
          calories: number;
        }>;
        active_calories?: number;
      };
      const additions: ActivityItem[] = [];
      (d.workouts ?? []).forEach((w) => {
        additions.push({
          id: Date.now() + Math.random(),
          name: w.name,
          duration: w.duration_min,
          intensity: null,
          calories: w.calories,
          type: "watch",
        });
      });
      if (!d.workouts?.length && d.active_calories) {
        additions.push({
          id: Date.now(),
          name: "Apple Watch Activity",
          duration: 0,
          intensity: null,
          calories: d.active_calories,
          type: "watch",
        });
      }
      setAct((prev) => [...prev, ...additions]);
      setWj("");
    } catch {
      setWe("Invalid JSON — check the format");
    }
  }, [wj]);

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
      setSe(
        e instanceof Error ? e.message : "Invalid JSON format",
      );
    }
  }, [sj]);

  const handleOpenGoals = useCallback(() => {
    setGoalsDialogKey((k) => k + 1);
    setGoalsOpen(true);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((th) => (th === "dark" ? "light" : "dark"));
  }, []);

  return (
    <div
      className={cn(
        "min-h-svh bg-background font-sans text-sm leading-normal",
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
          onToggleTheme={handleToggleTheme}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader
            onOpenGoals={handleOpenGoals}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
          <TopBar tab={tab} onOpenGoals={handleOpenGoals} />
          <main className="flex-1 overflow-y-auto">
        {tab === "db" ? (
          <DashboardPanel
            goals={goals}
            food={food}
            act={act}
            sleep={sleep}
            weightKg={weightKg}
            heightCm={heightCm}
            onQuickAdd={quickAddFood}
            onGoEat={setTab}
          />
        ) : null}
        {tab === "fd" ? (
          <FoodPanel
            goals={goals}
            food={food}
            t={t}
            foodQuery={foodQuery}
            onFoodQueryChange={setFoodQuery}
            foodResult={foodResult}
            foodLoading={foodLoading}
            foodError={foodError}
            onSearch={searchFood}
            onDiscard={() => setFoodResult(null)}
            onAdd={addFoodFromResult}
            onRemove={removeFood}
            onRetry={searchFood}
          />
        ) : null}
        {tab === "ac" ? (
          <ActivityPanel
            weightKg={weightKg}
            act={act}
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
            onRemove={(id) =>
              setAct((prev) => prev.filter((a) => a.id !== id))
            }
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
