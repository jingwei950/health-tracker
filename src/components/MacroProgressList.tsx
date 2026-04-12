"use client";

import {
  macroProgressRows,
  pct,
  type MacroTotals,
} from "@/lib/health-track/nutrition";
import type { Goals } from "@/lib/health-track/types";

export function MacroProgressList({
  t,
  goals,
}: {
  t: MacroTotals;
  goals: Goals;
}) {
  const rows = macroProgressRows(t, goals);
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="mb-2">
          <div className="mb-0.5 flex justify-between text-[11px] text-muted-foreground">
            <span>{row.label}</span>
            <span>
              {row.value}
              {row.unit} / {row.goal}
              {row.unit}
            </span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-[3px] bg-muted">
            <div
              className="h-full rounded-[3px] transition-[width] duration-300"
              style={{
                width: `${pct(row.value, row.goal)}%`,
                background: row.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
