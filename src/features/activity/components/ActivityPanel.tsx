"use client";

import type { ActivityIntensity } from "@/lib/health-track/types";
import type { ActivityLog } from "@/types/health.types";

const mets: Record<ActivityIntensity, number> = {
  low: 3.5,
  medium: 6.0,
  high: 9.0,
};

const inpCls = "w-full rounded-md border border-border bg-muted px-2.5 py-[7px] text-[13px] text-foreground outline-none transition-colors focus:border-primary";
const btnPrimaryCls = "mt-2 w-full cursor-pointer rounded-md border bg-primary px-3.5 py-[7px] text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export function ActivityPanel({
  weightKg,
  act,
  atab,
  onAtab,
  an,
  onAn,
  ad,
  onAd,
  ai,
  onAi,
  wj,
  onWj,
  we,
  onAddManual,
  onImportWatch,
  onRemove,
}: {
  weightKg: number;
  act: ActivityLog[];
  atab: "manual" | "watch";
  onAtab: (t: "manual" | "watch") => void;
  an: string;
  onAn: (s: string) => void;
  ad: string;
  onAd: (s: string) => void;
  ai: ActivityIntensity;
  onAi: (i: ActivityIntensity) => void;
  wj: string;
  onWj: (s: string) => void;
  we: string | null;
  onAddManual: () => void;
  onImportWatch: () => void;
  onRemove: (entry: ActivityLog) => void;
}) {
  const met = mets[ai] ?? 6;
  const dur = Number.parseFloat(ad) || 0;
  const est = ad ? Math.round((met * weightKg * dur) / 60) : 0;

  return (
    <div className="p-3 md:p-5">
      <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Log activity
        </div>
        <div className="mb-2.5 flex gap-[3px] rounded-md bg-background p-[3px]">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-[5px] border-none bg-transparent py-[5px] text-center text-xs font-medium text-muted-foreground transition-colors data-[active=true]:bg-card data-[active=true]:text-foreground"
            data-active={atab === "manual"}
            onClick={() => onAtab("manual")}
          >
            Manual entry
          </button>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-[5px] border-none bg-transparent py-[5px] text-center text-xs font-medium text-muted-foreground transition-colors data-[active=true]:bg-card data-[active=true]:text-foreground"
            data-active={atab === "watch"}
            onClick={() => onAtab("watch")}
          >
            Apple Watch
          </button>
        </div>
        {atab === "manual" ? (
          <>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <div>
                <label className="mb-0.5 block text-xs text-muted-foreground">
                  Activity name
                </label>
                <input
                  className={inpCls}
                  value={an}
                  placeholder="Volleyball, Running…"
                  onChange={(e) => onAn(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-muted-foreground">
                  Duration (min)
                </label>
                <input
                  className={inpCls}
                  type="number"
                  min={1}
                  placeholder="60"
                  value={ad}
                  onChange={(e) => onAd(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-2.5">
              <label className="mb-0.5 block text-xs text-muted-foreground">
                Intensity
              </label>
              <select
                className={`${inpCls} cursor-pointer`}
                value={ai}
                onChange={(e) => onAi(e.target.value as ActivityIntensity)}
              >
                <option value="low">Low (MET 3.5) — yoga, walking</option>
                <option value="medium">Medium (MET 6.0) — cycling, swimming</option>
                <option value="high">High (MET 9.0) — volleyball, HIIT</option>
              </select>
            </div>
            {est > 0 ? (
              <div
                className="mt-2 flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                style={{
                  background: "color-mix(in oklch, var(--status-info) 12%, transparent)",
                  borderColor: "var(--status-info)",
                  color: "var(--status-info)",
                }}
              >
                <span>
                  Est. burn: <strong>{est} kcal</strong>
                </span>
                <span
                  className="rounded-full border px-2 py-0.5 text-[11px]"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  est.
                </span>
              </div>
            ) : null}
            <button type="button" className={btnPrimaryCls} onClick={onAddManual}>
              Add activity
            </button>
          </>
        ) : (
          <>
            <label className="mb-0.5 block text-xs text-muted-foreground">
              Paste Apple Watch export JSON
            </label>
            <textarea
              className="w-full resize-y rounded-md border border-border bg-muted px-2.5 py-[7px] font-mono text-[11px] text-foreground outline-none min-h-[70px] focus:border-primary"
              value={wj}
              onChange={(e) => onWj(e.target.value)}
              placeholder='{"date":"2026-04-11","active_calories":420,"resting_calories":1650,"workouts":[{"name":"Outdoor Walk","duration_min":45,"calories":280}]}'
            />
            {we ? (
              <div
                className="mt-1.5 rounded-md border px-3 py-2 text-xs"
                style={{
                  background: "color-mix(in oklch, var(--status-danger) 12%, transparent)",
                  borderColor: "var(--status-danger)",
                  color: "var(--status-danger)",
                }}
              >
                {we}
              </div>
            ) : null}
            <button type="button" className={btnPrimaryCls} onClick={onImportWatch}>
              Import watch data
            </button>
          </>
        )}
      </div>
      <div className="mb-1.5 mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        Activity log ({act.length})
      </div>
      {act.length ? (
        [...act].reverse().map((a) => (
          <div key={a.id} className="mb-2 rounded-[10px] border border-border bg-card px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-medium">{a.activityName}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {a.durationMinutes ? `${a.durationMinutes} min` : ""}
                  {a.intensityLevel
                    ? `${a.durationMinutes ? " · " : ""}${a.intensityLevel.charAt(0).toUpperCase()}${a.intensityLevel.slice(1)}`
                    : ""}
                  {a.source === "apple_watch" ? " · Watch import" : ""}
                </div>
                {a.estimated ? (
                  <div className="mt-1">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[11px]"
                      style={{
                        borderColor: "var(--input)",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      est.
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[15px] font-medium" style={{ color: "var(--status-danger)" }}>
                  {a.caloriesBurned}{" "}
                  <span className="text-[10px] text-muted-foreground">kcal</span>
                </span>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border-none bg-transparent px-[7px] py-[3px] text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${a.activityName}`}
                  onClick={() => onRemove(a)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No activity logged yet
        </div>
      )}
    </div>
  );
}
