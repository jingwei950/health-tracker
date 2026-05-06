"use client";

import { Moon, Search, Sun, Utensils, Zap } from "lucide-react";
import { useState } from "react";

import type { MacroTotals } from "@/lib/health-track/nutrition";
import type { Goals } from "@/lib/health-track/types";
import type { NutritionLog } from "@/types/health.types";
import type { VerifiedNutrition } from "@/hooks/useNutritionSearch";
import { useNutritionSearch } from "@/hooks/useNutritionSearch";
import { FoodReviewCard } from "@/components/nutrition/FoodReviewCard";

const cardCls = "mb-3.5 rounded-[8px] border border-border bg-card p-4";
const ctCls =
  "mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

const MEAL_GROUPS: {
  id: NutritionLog["mealType"];
  label: string;
  Icon: typeof Sun;
}[] = [
  { id: "breakfast", label: "Breakfast", Icon: Sun },
  { id: "lunch", label: "Lunch", Icon: Utensils },
  { id: "dinner", label: "Dinner", Icon: Moon },
  { id: "snack", label: "Snacks", Icon: Zap },
];

const SUGGESTIONS = [
  "Chicken Rice",
  "Milo",
  "Nasi Lemak",
  "Laksa",
  "Roti Prata",
];

function NutritionSummaryBar({ t, goals }: { t: MacroTotals; goals: Goals }) {
  const remaining = Math.max(0, goals.calories - t.calories);
  const cells = [
    {
      label: "Consumed",
      val: t.calories.toLocaleString(),
      unit: "kcal",
      color: "var(--primary)",
      pct: goals.calories > 0 ? t.calories / goals.calories : 0,
    },
    {
      label: "Remaining",
      val: remaining.toLocaleString(),
      unit: "kcal",
      color: "var(--status-success)",
      pct: goals.calories > 0 ? remaining / goals.calories : 0,
    },
    {
      label: "Protein",
      val: `${t.protein}g`,
      unit: `/ ${goals.protein}g`,
      color: "var(--chart-1)",
      pct: goals.protein > 0 ? t.protein / goals.protein : 0,
    },
    {
      label: "Carbs · Fat",
      val: `${t.carbs}g · ${t.fat}g`,
      unit: `/ ${goals.carbs}g · ${goals.fat}g`,
      color: "var(--status-warning)",
      pct: goals.carbs > 0 ? t.carbs / goals.carbs : 0,
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4">
      {cells.map(({ label, val, unit, color, pct }) => (
        <div
          key={label}
          className="relative overflow-hidden bg-card px-3.5 py-3"
        >
          <div
            className="absolute bottom-0 left-0 h-[3px] transition-[width]"
            style={{
              width: `${Math.min(100, pct * 100)}%`,
              background: color,
            }}
          />
          <div className="mb-1.5 text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
            {label}
          </div>
          <div className="text-lg font-bold leading-none" style={{ color }}>
            {val}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">{unit}</div>
        </div>
      ))}
    </div>
  );
}

function FoodMacroRings({ t, goals }: { t: MacroTotals; goals: Goals }) {
  const items = [
    {
      label: "Protein",
      val: t.protein,
      goal: goals.protein,
      color: "var(--chart-1)",
      kcal: t.protein * 4,
    },
    {
      label: "Carbs",
      val: t.carbs,
      goal: goals.carbs,
      color: "var(--status-warning)",
      kcal: t.carbs * 4,
    },
    {
      label: "Fat",
      val: t.fat,
      goal: goals.fat,
      color: "var(--status-danger)",
      kcal: t.fat * 9,
    },
  ];
  const cx = 28,
    cy = 28,
    r = 22,
    sw = 5;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {items.map(({ label, val, goal, color, kcal }) => {
        const circ = 2 * Math.PI * r;
        const pct = Math.min(1, goal > 0 ? val / goal : 0);
        const dash = pct * circ;
        return (
          <div
            key={label}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md bg-[var(--card2)] px-3 py-2.5"
          >
            <svg
              width={56}
              height={56}
              viewBox="0 0 56 56"
              className="shrink-0"
              aria-hidden
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="var(--border)"
                strokeWidth={sw}
              />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={sw}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={circ * 0.25}
                strokeLinecap="round"
              />
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill={color}
                className="font-sans"
              >
                {Math.round(pct * 100)}%
              </text>
            </svg>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
                {label}
              </div>
              <div className="mt-0.5 text-[15px] font-bold" style={{ color }}>
                {val}g
              </div>
              <div className="text-[9px] text-muted-foreground">
                of {goal}g · {kcal} kcal
              </div>
              <div className="mt-1.5 h-[3px] w-[60px] overflow-hidden rounded-[2px] bg-border">
                <div
                  className="h-full rounded-[2px]"
                  style={{ width: `${pct * 100}%`, background: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FoodPanel({
  uid,
  goals,
  food,
  t,
  onLog,
  onRemove,
}: {
  uid?: string | null;
  goals: Goals;
  food: NutritionLog[];
  t: MacroTotals;
  onLog: (entry: VerifiedNutrition & { mealType: string }) => Promise<void>;
  onRemove: (entry: NutritionLog) => void;
}) {
  const [query, setQuery] = useState("");
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const { state, result, error, search, reset } = useNutritionSearch(
    uid ?? undefined,
  );

  const totalKcal = food.reduce((s, f) => s + f.calories, 0);

  return (
    <div className="p-5">
      <NutritionSummaryBar t={t} goals={goals} />

      <div className={cardCls}>
        <FoodMacroRings t={t} goals={goals} />
      </div>

      <div className={`${cardCls} border-2 border-border`}>
        <div className="mb-2.5 flex items-center justify-between">
          <div className={ctCls + " mb-0"}>Search &amp; log food</div>
          <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary bg-[var(--primary-dim)]">
            AI-POWERED
          </span>
        </div>
        <div className="mb-2.5 flex flex-wrap gap-2">
          <div className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-md border-2 border-border bg-[var(--card2)] px-3 py-2 transition-colors focus-within:border-primary">
            <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
            <input
              className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-foreground outline-none"
              placeholder="e.g. Chicken rice, 1 plate…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search(query);
              }}
            />
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border-none bg-primary px-[18px] py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={state === "searching" || state === "verifying"}
            onClick={() => search(query)}
          >
            {state === "searching" ? (
              <>
                <span className="ht-spin" /> Searching…
              </>
            ) : state === "verifying" ? (
              <>
                <span className="ht-spin" /> Verifying…
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {state !== "ready" || !result ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[10px] text-muted-foreground">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="cursor-pointer rounded-full border border-border bg-transparent px-2.5 py-1 text-[11px] text-[var(--sub-foreground)] transition-colors hover:border-primary hover:text-primary"
                onClick={() => {
                  setQuery(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {state === "error" && error ? (
          <div
            className="mb-2 rounded-md border px-3 py-2 text-xs"
            style={{
              background:
                "color-mix(in oklch, var(--status-danger) 12%, transparent)",
              borderColor: "var(--status-danger)",
              color: "var(--status-danger)",
            }}
          >
            {error}{" "}
            <button
              type="button"
              className="ml-1.5 cursor-pointer rounded-md border border-border bg-transparent px-2 py-1 text-xs text-foreground hover:bg-muted"
              onClick={() => search(query)}
            >
              Retry
            </button>
          </div>
        ) : null}
        {state === "ready" && result ? (
          <FoodReviewCard
            result={result}
            loading={logging}
            onConfirm={async (entry) => {
              setLogging(true);
              setLogError(null);
              try {
                await onLog(entry);
                reset();
                setQuery("");
              } catch (err: unknown) {
                setLogError(
                  err instanceof Error
                    ? err.message
                    : "Failed to save. Please try again.",
                );
              } finally {
                setLogging(false);
              }
            }}
            onCancel={() => {
              reset();
              setLogError(null);
            }}
          />
        ) : null}
        {logError ? (
          <div
            className="mb-2 rounded-md border px-3 py-2 text-xs"
            style={{
              background:
                "color-mix(in oklch, var(--status-danger) 12%, transparent)",
              borderColor: "var(--status-danger)",
              color: "var(--status-danger)",
            }}
          >
            {logError}
          </div>
        ) : null}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className={ctCls + " mb-0"}>
          Today&apos;s log · {food.length} items
        </div>
        <div className="text-[11px] font-bold text-primary">
          {totalKcal.toLocaleString()} kcal total
        </div>
      </div>

      {MEAL_GROUPS.map((meal) => {
        const items = food.filter((f) => f.mealType === meal.id);
        if (!items.length) return null;
        const { Icon } = meal;
        return (
          <div key={meal.id} className={`${cardCls} mb-3`}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-[var(--primary-dim)] text-primary">
                <Icon className="size-3.5" strokeWidth={2} />
              </div>
              <span className="text-[13px] font-semibold">{meal.label}</span>
            </div>
            {items.map((f) => (
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
                    {f.servingSize}
                    {f.servingUnit}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {!f.dataVerified ? (
                      <span className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        est.
                      </span>
                    ) : null}
                    {f.source ? (
                      <span className="text-[10px] text-muted-foreground">
                        {f.source}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    {f.calories}
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border-none bg-transparent px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${f.foodName}`}
                    onClick={() => onRemove(f)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {food.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          <div className="mb-2 text-2xl opacity-30">—</div>
          <div className="text-[13px]">No food logged yet. Search above to add items.</div>
        </div>
      ) : null}
    </div>
  );
}
