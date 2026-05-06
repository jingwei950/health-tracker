"use client";

import type { Goals } from "@/lib/health-track/types";
import type { MacroTotals } from "@/lib/health-track/nutrition";

const macros = [
  { key: "protein" as const, name: "Protein", label: "P", color: "var(--chart-1)" },
  { key: "carbs" as const, name: "Carbs", label: "C", color: "var(--status-warning)" },
  { key: "fat" as const, name: "Fat", label: "F", color: "var(--status-danger)" },
];

type Props = {
  t: MacroTotals;
  goals: Goals;
};

export function DashboardMacroBars({ t, goals }: Props) {
  const rows = macros.map((m) => ({
    ...m,
    g: t[m.key],
    goal: goals[m.key],
  }));

  const totalG = rows.reduce((s, r) => s + r.g, 0) || 1;

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(({ name, label, color, g, goal }) => {
        const p = Math.round((g / goal) * 100);
        return (
          <div key={name}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="flex size-5 items-center justify-center rounded text-[9px] font-bold"
                  style={{
                    background: `color-mix(in oklch, ${color} 15%, transparent)`,
                    color,
                  }}
                >
                  {label}
                </div>
                <span className="text-xs text-[var(--sub-foreground)]">{name}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold" style={{ color }}>
                  {g}g
                </span>
                <span className="text-[10px] text-muted-foreground">/ {goal}g</span>
                <span className="min-w-[28px] text-right text-[10px] text-muted-foreground">
                  {p}%
                </span>
              </div>
            </div>
            <div className="h-[5px] overflow-hidden rounded-[2px] bg-[var(--card2)]">
              <div
                className="h-full rounded-[2px] transition-[width]"
                style={{
                  width: `${Math.min(100, p)}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="mt-3.5 flex h-1.5 gap-px overflow-hidden rounded-md">
        {rows.map(({ name, g, color }) => (
          <div
            key={name}
            className="min-w-0 flex-1 transition-[flex-grow]"
            style={{ flex: g / totalG, background: color }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-2.5">
        {rows.map(({ name, g, color }) => (
          <div key={name} className="flex items-center gap-1">
            <div
              className="size-1.5 rounded-[1px]"
              style={{ background: color }}
            />
            <span className="text-[9px] text-muted-foreground">
              {name.slice(0, 3)} {g}g
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
