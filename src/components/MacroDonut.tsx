"use client";

import { arcPath, macroCaloriesFromMacros } from "@/lib/health-track/nutrition";
import type { MacroTotals } from "@/lib/health-track/nutrition";

const cx = 44;
const cy = 44;
const r = 33;

export function MacroDonut({ t }: { t: MacroTotals }) {
  const tk = macroCaloriesFromMacros(t);
  if (!tk) {
    return (
      <div className="text-xs text-muted-foreground">
        Log food to see breakdown
      </div>
    );
  }
  const segs = [
    { k: t.protein * 4, c: "var(--chart-1)", l: `P ${t.protein}g` },
    { k: t.carbs * 4, c: "var(--chart-3)", l: `C ${t.carbs}g` },
    { k: t.fat * 9, c: "var(--chart-5)", l: `F ${t.fat}g` },
  ];
  let a = -90;
  const arcs = segs
    .filter((s) => s.k > 0)
    .map((s) => {
      const sw = (s.k / tk) * 360;
      const p = arcPath(cx, cy, r, a, a + sw);
      a += sw;
      return (
        <path
          key={s.l}
          d={p}
          fill="none"
          stroke={s.c}
          strokeWidth={9}
          strokeLinecap="butt"
        />
      );
    });
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 88 88"
        width={72}
        height={72}
        className="shrink-0"
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={9}
        />
        {arcs}
        <text
          x={cx}
          y={cy - 3}
          textAnchor="middle"
          fontSize={10}
          fontWeight={500}
          fill="var(--foreground)"
        >
          {Math.round(tk)}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize={7}
          fill="var(--muted-foreground)"
        >
          kcal
        </text>
      </svg>
      <div className="text-xs leading-relaxed">
        {segs.map((s) => (
          <div key={s.l} style={{ color: s.c }}>
            {s.l}
          </div>
        ))}
      </div>
    </div>
  );
}
