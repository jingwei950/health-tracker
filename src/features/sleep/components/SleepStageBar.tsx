"use client";

import type { SleepEntry } from "@/lib/health-track/types";

const cs: Record<string, string> = {
  deep: "#1d4ed8",
  core: "#6366f1",
  rem: "#8b5cf6",
  awake: "#94a3b8",
};

export function SleepStageBar({ e }: { e: SleepEntry }) {
  const segs = Object.entries(e.stages).map(([k, v]) => (
    <div
      key={k}
      style={{
        width: `${((v as number) / e.totalHours) * 100}%`,
        background: cs[k] ?? "#888",
        height: "100%",
      }}
    />
  ));
  const legend = Object.entries(e.stages).map(([k, v]) => (
    <span key={k}>
      <span
        className="mr-0.5 inline-block size-[7px] rounded-[2px] align-middle"
        style={{ background: cs[k] ?? "#888" }}
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
