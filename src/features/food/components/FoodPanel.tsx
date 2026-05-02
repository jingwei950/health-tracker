"use client";

import { useState } from 'react';
import type { MacroTotals } from "@/lib/health-track/nutrition";
import type { Goals } from "@/lib/health-track/types";
import type { NutritionLog } from "@/types/health.types";
import type { VerifiedNutrition } from "@/hooks/useNutritionSearch";
import { useNutritionSearch } from "@/hooks/useNutritionSearch";
import { FoodReviewCard } from "@/components/nutrition/FoodReviewCard";

import { MacroProgressList } from "@/components/MacroProgressList";

const cardCls = "mb-2.5 rounded-[10px] border border-border bg-card p-3";
const ctCls = "mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground";
const inpCls = "w-full rounded-md border border-border bg-muted px-2.5 py-[7px] text-[13px] text-foreground outline-none transition-colors focus:border-primary";
const btnSmCls = "cursor-pointer rounded-md border border-border bg-transparent px-2.5 py-[5px] text-xs font-medium text-card-foreground transition-colors hover:bg-muted";

export function FoodPanel({
  goals,
  food,
  t,
  onLog,
  onRemove,
}: {
  goals:    Goals;
  food:     NutritionLog[];
  t:        MacroTotals;
  onLog:    (entry: VerifiedNutrition & { mealType: string }) => Promise<void>;
  onRemove: (entry: NutritionLog) => void;
}) {
  const [query,    setQuery]    = useState('');
  const [logging,  setLogging]  = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const { state, result, error, search, reset } = useNutritionSearch();

  return (
    <div className="p-3 md:p-5">
      <div className={cardCls}>
        <div className={ctCls}>Search &amp; log food</div>
        <div className="mb-2 flex gap-2">
          <input
            className={`${inpCls} min-w-0 flex-1`}
            placeholder="Egg Prata, Chicken Rice, Milo Dinosaur…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search(query); }}
          />
          <button
            type="button"
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-md border bg-primary px-3.5 py-[7px] text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={state === 'searching' || state === 'verifying'}
            onClick={() => search(query)}
          >
            {state === 'searching' ? (
              <><span className="ht-spin" />Searching…</>
            ) : state === 'verifying' ? (
              <><span className="ht-spin" />Verifying…</>
            ) : (
              'Search'
            )}
          </button>
        </div>
        {state === 'error' && error ? (
          <div
            className="mb-2 rounded-md border px-3 py-2 text-xs"
            style={{
              background: "color-mix(in oklch, var(--status-danger) 12%, transparent)",
              borderColor: "var(--status-danger)",
              color: "var(--status-danger)",
            }}
          >
            {error}{" "}
            <button type="button" className={`${btnSmCls} ml-1.5`} onClick={() => search(query)}>
              Retry
            </button>
          </div>
        ) : null}
        {state === 'ready' && result ? (
          <FoodReviewCard
            result={result}
            loading={logging}
            onConfirm={async (entry) => {
              setLogging(true);
              setLogError(null);
              try {
                await onLog(entry);
                reset();
                setQuery('');
              } catch (err: unknown) {
                setLogError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
              } finally {
                setLogging(false);
              }
            }}
            onCancel={() => { reset(); setLogError(null); }}
          />
        ) : null}
        {logError ? (
          <div
            className="mb-2 rounded-md border px-3 py-2 text-xs"
            style={{
              background: "color-mix(in oklch, var(--status-danger) 12%, transparent)",
              borderColor: "var(--status-danger)",
              color: "var(--status-danger)",
            }}
          >
            {logError}
          </div>
        ) : null}
      </div>
      <div className={cardCls}>
        <div className={ctCls}>Daily progress</div>
        <MacroProgressList t={t} goals={goals} />
      </div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        Today&apos;s log ({food.length})
      </div>
      {food.length ? (
        [...food].reverse().map((f) => (
          <div key={f.id} className="mb-2 rounded-[10px] border border-border bg-card px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{f.foodName}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {f.servingSize}{f.servingUnit} · P:{f.protein}g C:{f.carbs}g F:{f.fat}g
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {!f.dataVerified ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      est.
                    </span>
                  ) : null}
                  {f.source ? (
                    <span className="text-[11px] text-muted-foreground">{f.source}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[15px] font-medium text-primary">{f.calories}</span>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border-none bg-transparent px-[7px] py-[3px] text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${f.foodName}`}
                  onClick={() => onRemove(f)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No food logged yet
        </div>
      )}
    </div>
  );
}
