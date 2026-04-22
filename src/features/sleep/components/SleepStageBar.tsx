"use client";

import type { SleepEntry } from "@/lib/health-track/types";

const cs: Record<string, string> = {
  deep: "var(--chart-5)",
  core: "var(--chart-3)",
  rem: "var(--chart-1)",
  awake: "var(--muted-foreground)",
};

export function SleepStageBar({ e }: { e: SleepEntry }) {
  const segs = Object.entries(e.stages).map(([k, v]) => (
    <div
      key={k}
      style={{
        width: `${((v as number) / e.totalHours) * 100}%`,
        background: cs[k] ?? "var(--muted)",
        height: "100%",
      }}
    />
  ));
  const legend = Object.entries(e.stages).map(([k, v]) => (
    <span key={k}>
      <span
        className="mr-0.5 inline-block size-[7px] rounded-[2px] align-middle"
        style={{ background: cs[k] ?? "var(--muted)" }}
      />
      {k} {v as number}h{" "}
    </span>
  ));
  return (
    <>
      <div className="my-1.5 flex h-3 overflow-hidden rounded-md">{segs}</div>
      <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
        {legend}
      </div>
    </>
  );
}
