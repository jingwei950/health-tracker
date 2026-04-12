"use client";

import type { MacroTotals } from "@/lib/health-track/nutrition";
import type { FoodItem, FoodSearchResult, Goals } from "@/lib/health-track/types";

import { MacroProgressList } from "@/components/MacroProgressList";

const cardCls = "mb-2.5 rounded-[10px] border border-border bg-card p-3";
const ctCls = "mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground";
const inpCls = "w-full rounded-md border border-input bg-muted px-2.5 py-[7px] text-[13px] text-foreground outline-none transition-colors focus:border-primary";
const btnSmCls = "cursor-pointer rounded-md border border-input bg-transparent px-2.5 py-[5px] text-xs font-medium text-card-foreground transition-colors hover:bg-muted";
const btnSmPrimaryCls = "cursor-pointer rounded-md border bg-primary px-2.5 py-[5px] text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export function FoodPanel({
  goals,
  food,
  t,
  foodQuery,
  onFoodQueryChange,
  foodResult,
  foodLoading,
  foodError,
  onSearch,
  onDiscard,
  onAdd,
  onRemove,
  onRetry,
}: {
  goals: Goals;
  food: FoodItem[];
  t: MacroTotals;
  foodQuery: string;
  onFoodQueryChange: (q: string) => void;
  foodResult: FoodSearchResult | null;
  foodLoading: boolean;
  foodError: string | null;
  onSearch: () => void;
  onDiscard: () => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
  onRetry: () => void;
}) {
  return (
    <div className="p-3">
      <div className={cardCls}>
        <div className={ctCls}>Search &amp; log food</div>
        <div className="mb-2 flex gap-2">
          <input
            className={`${inpCls} min-w-0 flex-1`}
            placeholder="Egg Prata, Chicken Rice, Milo Dinosaur…"
            value={foodQuery}
            onChange={(e) => onFoodQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
          <button
            type="button"
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-md border bg-primary px-3.5 py-[7px] text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={foodLoading}
            onClick={onSearch}
          >
            {foodLoading ? (
              <>
                <span className="ht-spin" />
                Searching…
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>
        {foodError ? (
          <div
            className="mb-2 rounded-md border px-3 py-2 text-xs"
            style={{
              background: "rgba(248,113,113,.12)",
              borderColor: "#f87171",
              color: "#f87171",
            }}
          >
            {foodError}{" "}
            <button type="button" className={`${btnSmCls} ml-1.5`} onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : null}
        {foodResult ? (
          <div className="mt-0.5 rounded-[10px] border border-primary bg-card p-3">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium">{foodResult.food_name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {foodResult.serving_size}
                </div>
              </div>
              <div className="shrink-0 text-lg font-medium text-primary">
                {foodResult.calories}{" "}
                <span className="text-[10px] text-muted-foreground">kcal</span>
              </div>
            </div>
            <div className="my-[7px] grid grid-cols-4 gap-1.5 max-[480px]:grid-cols-2">
              <div className="rounded-md bg-muted p-1.5 text-center">
                <div className="text-sm font-medium text-[#34d399]">
                  {foodResult.protein_g}g
                </div>
                <div className="text-[10px] text-muted-foreground">Protein</div>
              </div>
              <div className="rounded-md bg-muted p-1.5 text-center">
                <div className="text-sm font-medium text-[#60a5fa]">
                  {foodResult.carbs_g}g
                </div>
                <div className="text-[10px] text-muted-foreground">Carbs</div>
              </div>
              <div className="rounded-md bg-muted p-1.5 text-center">
                <div className="text-sm font-medium text-[#fbbf24]">
                  {foodResult.fat_g}g
                </div>
                <div className="text-[10px] text-muted-foreground">Fat</div>
              </div>
              <div className="rounded-md bg-muted p-1.5 text-center">
                <div className="text-sm font-medium text-card-foreground">
                  {foodResult.fibre_g}g
                </div>
                <div className="text-[10px] text-muted-foreground">Fibre</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full border border-input px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  est.
                </span>
                {foodResult.source_name ? (
                  <a
                    href={foodResult.source_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground no-underline hover:text-primary hover:underline"
                  >
                    {foodResult.source_name}
                  </a>
                ) : null}
              </div>
              <div className="flex gap-1.5">
                <button type="button" className={btnSmCls} onClick={onDiscard}>
                  Discard
                </button>
                <button type="button" className={btnSmPrimaryCls} onClick={onAdd}>
                  Add to log
                </button>
              </div>
            </div>
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
                <div className="truncate text-[13px] font-medium">{f.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {f.servingSize} · P:{f.protein}g C:{f.carbs}g F:{f.fat}g
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-input px-2 py-0.5 text-[11px] text-muted-foreground">
                    est.
                  </span>
                  {f.sourceName ? (
                    <a
                      href={f.sourceUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground no-underline hover:text-primary hover:underline"
                    >
                      {f.sourceName}
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[15px] font-medium text-primary">
                  {f.calories}
                </span>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border-none bg-transparent px-[7px] py-[3px] text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => onRemove(f.id)}
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
