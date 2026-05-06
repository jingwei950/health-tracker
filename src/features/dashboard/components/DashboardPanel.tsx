"use client";

import { Activity, Moon, Utensils, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { bmi, bmiInfo, sleepScore } from "@/lib/health-track/nutrition";
import type { MacroTotals } from "@/lib/health-track/nutrition";
import type { Goals, SleepEntry, TabId } from "@/lib/health-track/types";
import { calendarWeekCalories } from "@/lib/health-track/week-calories";
import type { ActivityLog, NutritionLog } from "@/types/health.types";

import { CalorieRing } from "./CalorieRing";
import { DashboardMacroBars } from "./DashboardMacroBars";
import { WeekCalorieChart } from "./WeekCalorieChart";

const cardCls = "rounded-[8px] border border-border bg-card p-4";
const ctCls =
  "mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

const ACTIVITY_KCAL_GOAL = 600;

function Chip({ label, colorVar }: { label: string; colorVar: string }) {
  return (
    <span
      className="rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{
        background: `color-mix(in oklch, ${colorVar} 14%, transparent)`,
        color: colorVar,
      }}
    >
      {label}
    </span>
  );
}

function SleepBadge({ score }: { score: number }) {
  const getStyle = (statusVar: string) => ({
    background: `color-mix(in oklch, ${statusVar} 12%, transparent)`,
    color: statusVar,
  });

  if (score >= 80)
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={getStyle("var(--status-success)")}
      >
        Good
      </span>
    );
  if (score >= 60)
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={getStyle("var(--status-warning)")}
      >
        Fair
      </span>
    );
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={getStyle("var(--status-danger)")}
    >
      Poor
    </span>
  );
}

function intensityStyle(level: ActivityLog["intensityLevel"]) {
  if (level === "high")
    return { text: "High", color: "var(--status-danger)" };
  if (level === "medium")
    return { text: "Med", color: "var(--status-warning)" };
  return { text: "Low", color: "var(--muted-foreground)" };
}

export function DashboardPanel({
  goals,
  t,
  recentFoods,
  nutritionLogs,
  activityLogs,
  sessionCount,
  sleep,
  weightKg,
  heightCm,
  onQuickAdd,
  onGoEat,
}: {
  goals: Goals;
  t: MacroTotals;
  recentFoods: NutritionLog[];
  nutritionLogs: NutritionLog[];
  activityLogs: ActivityLog[];
  sessionCount: number;
  sleep: SleepEntry[];
  weightKg: number | null;
  heightCm: number | null;
  onQuickAdd: (id: string) => void;
  onGoEat: (t: TabId) => void;
}) {
  const net = t.calories - t.burn;
  const diff = net - goals.calories;
  const last = sleep[sleep.length - 1];
  const sc = last ? sleepScore(last) : null;
  const hasBmi =
    weightKg != null &&
    heightCm != null &&
    Number.isFinite(weightKg) &&
    Number.isFinite(heightCm);
  const bv = hasBmi ? bmi(weightKg, heightCm) : 0;
  const bi = hasBmi ? bmiInfo(bv) : null;

  const week = calendarWeekCalories(nutritionLogs);
  const recentActs = [...activityLogs].reverse().slice(0, 2);

  let alert: ReactNode = null;
  if (t.calories > 0 && Math.abs(diff) > 300) {
    const statusVar = diff > 0 ? "var(--status-warning)" : "var(--status-info)";
    alert = (
      <div
        className="mb-3.5 flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-xs"
        style={{
          background: `color-mix(in oklch, ${statusVar} 10%, transparent)`,
          borderColor: `color-mix(in oklch, ${statusVar} 40%, transparent)`,
          color: statusVar,
        }}
      >
        <Zap className="size-3.5 shrink-0" strokeWidth={2.5} />
        {diff > 0
          ? `${diff} kcal above your goal today`
          : `${Math.abs(diff)} kcal below your goal — consider a snack`}
      </div>
    );
  }

  const stageFlex = last
    ? {
        deep: last.stages.deep,
        rem: last.stages.rem,
        light: last.stages.core,
        awake: last.stages.awake,
      }
    : null;

  return (
    <div className="flex flex-col gap-3.5 p-5">
      {alert}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className={cardCls}>
          <div className={ctCls}>Calories today</div>
          <CalorieRing consumed={t.calories} burned={t.burn} goal={goals.calories} />
        </div>
        <div className={cardCls}>
          <div className={ctCls}>Macronutrients</div>
          <DashboardMacroBars t={t} goals={goals} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <div className={ctCls + " mb-0"}>Sleep</div>
            <div
              className="flex size-[26px] items-center justify-center rounded-md"
              style={{
                background:
                  "color-mix(in oklch, var(--status-info) 14%, transparent)",
                color: "var(--status-info)",
              }}
            >
              <Moon className="size-[13px]" strokeWidth={2} />
            </div>
          </div>
          {last && sc != null ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[28px] font-bold leading-none text-[var(--status-info)]"
                >
                  {sc}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-2">
                <SleepBadge score={sc} />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {last.totalHours}h · {last.date}
              </div>
              {stageFlex ? (
                <>
                  <div className="mt-2.5 flex h-1 overflow-hidden rounded-[2px]">
                    <div className="bg-primary" style={{ flex: stageFlex.deep }} />
                    <div className="bg-[var(--status-info)]" style={{ flex: stageFlex.rem }} />
                    <div className="bg-sub-foreground" style={{ flex: stageFlex.light }} />
                    <div className="bg-[var(--status-warning)]" style={{ flex: stageFlex.awake }} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(
                      [
                        ["Deep", "var(--primary)", stageFlex.deep] as const,
                        ["REM", "var(--status-info)", stageFlex.rem] as const,
                        ["Light", "var(--sub-foreground)", stageFlex.light] as const,
                      ] as const
                    ).map(([l, c, v]) => (
                      <div key={l} className="flex items-center gap-1">
                        <div
                          className="size-[5px] rounded-[1px]"
                          style={{ background: c }}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {l}{" "}
                          {last.totalHours > 0
                            ? Math.round((v / last.totalHours) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-xs text-muted-foreground">No data yet</div>
          )}
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <div className={ctCls + " mb-0"}>BMI</div>
            <div
              className="flex size-[26px] items-center justify-center rounded-md"
              style={{
                background:
                  "color-mix(in oklch, var(--status-success) 14%, transparent)",
                color: "var(--status-success)",
              }}
            >
              <span className="text-[11px] font-bold">B</span>
            </div>
          </div>
          {hasBmi && bi ? (
            <>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[28px] font-bold leading-none"
                  style={{ color: bi.color }}
                >
                  {bv.toFixed(1)}
                </span>
              </div>
              <div className="mt-2">
                <Chip label={bi.label} colorVar={bi.color} />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {weightKg}kg · {heightCm}cm
              </div>
              <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-md bg-[var(--card2)]">
                <div
                  className="absolute inset-0 rounded-md"
                  style={{
                    background: `linear-gradient(to right, var(--status-info), var(--status-success) 30%, var(--status-warning) 62%, var(--status-danger))`,
                  }}
                />
                <div
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--status-success)] bg-card"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((bv - 16) / (34 - 16)) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
                <span>16</span>
                <span>34</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              No data yet — add height &amp; weight in BMI
            </div>
          )}
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <div className={ctCls + " mb-0"}>Activity</div>
            <div
              className="flex size-[26px] items-center justify-center rounded-md"
              style={{
                background:
                  "color-mix(in oklch, var(--status-danger) 14%, transparent)",
                color: "var(--status-danger)",
              }}
            >
              <Activity className="size-[13px]" strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold leading-none text-[var(--status-danger)]">
              {t.burn}
            </span>
            <span className="text-xs text-muted-foreground">kcal</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {sessionCount} session{sessionCount !== 1 ? "s" : ""} today
          </div>
          <div className="mt-2.5 h-[5px] overflow-hidden rounded-[2px] bg-[var(--card2)]">
            <div
              className="h-full rounded-[2px] bg-[var(--status-danger)] transition-[width]"
              style={{
                width: `${Math.min(100, (t.burn / ACTIVITY_KCAL_GOAL) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>Goal: {ACTIVITY_KCAL_GOAL} kcal</span>
            <span>{Math.round((t.burn / ACTIVITY_KCAL_GOAL) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className={cardCls}>
          <div className={ctCls}>This week</div>
          <WeekCalorieChart week={week} goal={goals.calories} />
        </div>

        <div className={cardCls}>
          <div className="mb-2.5 flex items-center justify-between">
            <div className={ctCls + " mb-0"}>Food log</div>
            <button
              type="button"
              onClick={() => onGoEat("fd")}
              className="flex cursor-pointer items-center gap-1 border-none bg-transparent text-[10px] font-medium tracking-wide text-primary"
            >
              <span className="text-sm leading-none">+</span> Add
            </button>
          </div>
          {recentFoods.slice(0, 4).map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary-dim)] text-primary">
                <Utensils className="size-[13px]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{f.foodName}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  P {f.protein}g · C {f.carbs}g · F {f.fat}g
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold text-primary">{f.calories}</div>
                <div className="text-[9px] text-muted-foreground">kcal</div>
              </div>
            </div>
          ))}
          {recentFoods.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No foods logged yet
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onGoEat("fd")}
              className="mt-2 w-full cursor-pointer rounded border border-primary/30 bg-[var(--primary-dim)] py-2 text-[11px] font-semibold tracking-wide text-primary"
            >
              See all {nutritionLogs.length} entries
            </button>
          )}
        </div>

        <div className={cardCls}>
          <div className="mb-2.5 flex items-center justify-between">
            <div className={ctCls + " mb-0"}>Activity log</div>
            <button
              type="button"
              onClick={() => onGoEat("ac")}
              className="flex cursor-pointer items-center gap-1 border-none bg-transparent text-[10px] font-medium tracking-wide text-[var(--status-danger)]"
            >
              <span className="text-sm leading-none">+</span> Log
            </button>
          </div>
          {recentActs.map((a) => {
            const inten = intensityStyle(a.intensityLevel);
            return (
              <div
                key={a.id}
                className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--status-danger)]"
                  style={{
                    background:
                      "color-mix(in oklch, var(--status-danger) 12%, transparent)",
                  }}
                >
                  <Zap className="size-[13px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{a.activityName}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {a.durationMinutes} min ·{" "}
                    <span style={{ color: inten.color }}>{inten.text}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-[var(--status-danger)]">
                    {a.caloriesBurned}
                  </div>
                  <div className="text-[9px] text-muted-foreground">kcal</div>
                </div>
              </div>
            );
          })}
          {recentActs.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No activity logged
            </div>
          ) : null}
          <div className="mt-3.5 flex gap-2">
            {(
              [
                ["Burned", t.burn, "var(--status-danger)"] as const,
                ["Goal", ACTIVITY_KCAL_GOAL, "var(--border)"] as const,
              ] as const
            ).map(([lab, val, c]) => (
              <div
                key={lab}
                className="flex min-w-0 flex-1 flex-col rounded bg-[var(--card2)] px-2.5 py-2"
              >
                <div className="text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
                  {lab}
                </div>
                <div
                  className="mt-0.5 text-base font-bold"
                  style={{ color: c }}
                >
                  {val}
                </div>
                <div className="text-[9px] text-muted-foreground">kcal</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onGoEat("ac")}
            className="mt-2 w-full cursor-pointer rounded border border-[var(--status-danger)]/30 bg-[color-mix(in_oklch,var(--status-danger)_10%,transparent)] py-2 text-[11px] font-semibold tracking-wide text-[var(--status-danger)]"
          >
            + Log workout
          </button>
        </div>
      </div>

      {t.protein + t.carbs + t.fat > 0 ? (
        <div className={cardCls}>
          <div className={ctCls}>Quick-add recent foods</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recentFoods.map((f) => (
              <button
                key={f.id}
                type="button"
                className="cursor-pointer rounded-full border border-border bg-[var(--card2)] px-2.5 py-[3px] text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
                onClick={() => {
                  onQuickAdd(f.id);
                  onGoEat("fd");
                }}
              >
                {f.foodName}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
