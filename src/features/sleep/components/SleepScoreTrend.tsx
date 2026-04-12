"use client";

import { sleepScore } from "@/lib/health-track/nutrition";
import type { SleepEntry } from "@/lib/health-track/types";

export function SleepScoreTrend({ sleep }: { sleep: SleepEntry[] }) {
  const arr = sleep.slice(-7);
  if (arr.length < 2) return null;
  const bw = 28;
  const gap = 6;
  const h = 72;
  const tot = arr.length * (bw + gap) - gap;
  const ox = (220 - tot) / 2;
  const bars = arr.map((e, i) => {
    const sc = sleepScore(e);
    const bh = Math.round((sc / 100) * 54);
    const x = ox + i * (bw + gap);
    const y = h - 10 - bh;
    const c = sc >= 80 ? "#34d399" : sc >= 60 ? "#fbbf24" : "#f87171";
    return (
      <g key={e.id}>
        <rect
          x={x}
          y={y}
          width={bw}
          height={bh}
          rx={3}
          fill={c}
          opacity={0.85}
        />
        <text
          x={x + bw / 2}
          y={h - 1}
          textAnchor="middle"
          fontSize={7}
          fill="var(--muted-foreground)"
        >
          {e.date.slice(5)}
        </text>
        <text
          x={x + bw / 2}
          y={y - 2}
          textAnchor="middle"
          fontSize={8}
          fill={c}
        >
          {sc}
        </text>
      </g>
    );
  });
  return (
    <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        7-day sleep score trend
      </div>
      <svg viewBox={`0 0 220 ${h}`} width="100%" className="block">
        {bars}
      </svg>
    </div>
  );
}
