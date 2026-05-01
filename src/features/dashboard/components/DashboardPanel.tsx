"use client";

import type { ReactNode } from "react";

import { bmi, bmiInfo, pct, sleepScore, totals } from "@/lib/health-track/nutrition";
import type {
  ActivityItem,
  BmiBand,
  FoodItem,
  Goals,
  SleepEntry,
  TabId,
} from "@/lib/health-track/types";

import { MacroDonut } from "@/components/MacroDonut";
import { MacroProgressList } from "@/components/MacroProgressList";

const cardCls = "mb-2.5 rounded-[10px] border border-border bg-card p-3";
const ctCls = "mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground";

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

function bandStyle(band: BmiBand) {
  const map: Record<BmiBand, string> = {
    bgg: "var(--status-success)",
    ba: "var(--status-warning)",
    bb: "var(--status-info)",
    br: "var(--status-danger)",
  };
  const c = map[band];
  return {
    background: `color-mix(in oklch, ${c} 12%, transparent)`,
    color: c,
  };
}

export function DashboardPanel({
  goals,
  food,
  act,
  sleep,
  weightKg,
  heightCm,
  onQuickAdd,
  onGoEat,
}: {
  goals: Goals;
  food: FoodItem[];
  act: ActivityItem[];
  sleep: SleepEntry[];
  weightKg: number;
  heightCm: number;
  onQuickAdd: (id: number) => void;
  onGoEat: (t: TabId) => void;
}) {
  const t = totals(food, act);
  const net = t.calories - t.burn;
  const diff = net - goals.calories;
  const last = sleep[sleep.length - 1];
  const sc = last ? sleepScore(last) : null;
  const bv = bmi(weightKg, heightCm);
  const bi = bmiInfo(bv);
  const recent = [...food].reverse().slice(0, 5);

  let alert: ReactNode = null;
  if (food.length && Math.abs(diff) > 500) {
    const statusVar = diff > 0 ? "var(--status-warning)" : "var(--status-info)";
    alert = (
      <div
        className="mb-2 rounded-md px-3 py-2 text-xs"
        style={{
          background: `color-mix(in oklch, ${statusVar} 12%, transparent)`,
          border: `1px solid ${statusVar}`,
          color: statusVar,
        }}
      >
        {diff > 0
          ? `${diff} kcal above`
          : `${Math.abs(diff)} kcal below`}{" "}
        your {goals.calories} kcal goal today
      </div>
    );
  }

  return (
    <div className="p-3 md:p-5">
      {alert}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <div className={cardCls}>
          <div className={ctCls}>Calories today</div>
          <div className="text-[30px] font-medium leading-none text-primary">
            {t.calories}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            consumed ·{" "}
            <span style={{ color: "var(--status-danger)" }}>{t.burn}</span> burned
          </div>
          <div
            className="mt-1 text-[13px] font-medium"
            style={{ color: net > goals.calories ? "var(--status-warning)" : "var(--status-success)" }}
          >
            {net} net
          </div>
          <div className="mt-2 h-[5px] overflow-hidden rounded-[3px] bg-muted">
            <div
              className="h-full rounded-[3px] transition-[width]"
              style={{
                width: `${pct(t.calories, goals.calories)}%`,
                background: "var(--primary)",
              }}
            />
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Goal: {goals.calories} kcal
          </div>
        </div>
        <div className={cardCls}>
          <div className={ctCls}>Macros</div>
          <MacroDonut t={t} />
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className={cardCls}>
          <div className={ctCls}>Sleep</div>
          {last && sc != null ? (
            <>
              <div className="text-2xl font-medium">{sc}</div>
              <div className="mt-1">
                <SleepBadge score={sc} />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {last.date}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">No data yet</div>
          )}
        </div>
        <div className={cardCls}>
          <div className={ctCls}>BMI</div>
          <div className="text-2xl font-medium" style={{ color: bi.color }}>
            {bv.toFixed(1)}
          </div>
          <div className="mt-1">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={bandStyle(bi.band)}
            >
              {bi.label}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {weightKg}kg · {heightCm}cm
          </div>
        </div>
        <div className={cardCls}>
          <div className={ctCls}>Activity</div>
          <div className="text-2xl font-medium" style={{ color: "var(--status-danger)" }}>
            {t.burn}
          </div>
          <div className="text-[11px] text-muted-foreground">kcal burned</div>
          <div className="text-[11px] text-muted-foreground">
            {act.length} session{act.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
      {t.protein + t.carbs + t.fat > 0 ? (
        <div className={cardCls}>
          <div className={ctCls}>Macro progress</div>
          <MacroProgressList t={t} goals={goals} />
        </div>
      ) : null}
      {recent.length > 0 ? (
        <div className={cardCls}>
          <div className={ctCls}>Quick-add recent foods</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {recent.map((f) => (
              <button
                key={f.id}
                type="button"
                className="cursor-pointer rounded-[14px] border border-border bg-muted px-[9px] py-[3px] text-xs text-card-foreground transition-colors hover:border-primary hover:text-primary"
                onClick={() => {
                  onQuickAdd(f.id);
                  onGoEat("fd");
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
