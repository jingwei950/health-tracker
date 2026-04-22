"use client";

import { sleepScore } from "@/lib/health-track/nutrition";
import type { SleepEntry } from "@/lib/health-track/types";

import { SleepScoreTrend } from "./SleepScoreTrend";
import { SleepStageBar } from "./SleepStageBar";

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

export function SleepPanel({
  sleep,
  sj,
  onSj,
  se,
  onImport,
  onRemove,
}: {
  sleep: SleepEntry[];
  sj: string;
  onSj: (s: string) => void;
  se: string | null;
  onImport: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="p-3 md:p-5">
      <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Import sleep data
        </div>
        <label className="mb-0.5 block text-xs text-muted-foreground">
          Paste Apple Watch sleep JSON
        </label>
        <textarea
          className="w-full resize-y rounded-md border border-border bg-muted px-2.5 py-[7px] font-mono text-[11px] text-foreground outline-none min-h-[70px] focus:border-primary"
          value={sj}
          onChange={(e) => onSj(e.target.value)}
          placeholder='{"date":"2026-04-11","total_hours":7.2,"stages":{"core":2.8,"deep":1.1,"rem":1.9,"awake":1.4},"heart_rate_avg":58}'
        />
        {se ? (
          <div
            className="mt-1.5 rounded-md border px-3 py-2 text-xs"
            style={{
              background: "color-mix(in oklch, var(--status-danger) 12%, transparent)",
              borderColor: "var(--status-danger)",
              color: "var(--status-danger)",
            }}
          >
            {se}
          </div>
        ) : null}
        <button
          type="button"
          className="mt-2 w-full cursor-pointer rounded-md border bg-primary px-3.5 py-[7px] text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onImport}
        >
          Import sleep data
        </button>
      </div>
      <SleepScoreTrend sleep={sleep} />
      <div className="mb-1.5 mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        Sleep history ({sleep.length} nights)
      </div>
      {sleep.length ? (
        [...sleep].reverse().map((e) => {
          const sc = sleepScore(e);
          return (
            <div key={e.id} className="mb-2 rounded-[10px] border border-border bg-card px-3 py-2">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[13px] font-medium">{e.date}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {e.totalHours}h total
                    {e.heartRate != null ? ` · ${e.heartRate} bpm avg` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-right">
                    <div className="text-xl font-medium">{sc}</div>
                    <div className="mt-0.5">
                      <SleepBadge score={sc} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border-none bg-transparent px-[7px] py-[3px] text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${e.date}`}
                    onClick={() => onRemove(e.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
              <SleepStageBar e={e} />
              <div className="mt-2">
                <div className="mb-0.5 flex justify-between text-[11px]">
                  <span>Sleep score</span>
                  <span>{sc}/100</span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-[3px] bg-muted">
                  <div
                    className="h-full rounded-[3px]"
                    style={{
                      width: `${sc}%`,
                      background:
                        sc >= 80 ? "var(--status-success)" : sc >= 60 ? "var(--status-warning)" : "var(--status-danger)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No sleep data yet
        </div>
      )}
    </div>
  );
}
