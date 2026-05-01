"use client";

import type { CSSProperties } from "react";
import { bmi, bmiInfo, idealWeightRangeKg } from "@/lib/health-track/nutrition";
import type { BmiBand } from "@/lib/health-track/types";

import { BmiGauge } from "./BmiGauge";

const inpCls = "w-full rounded-md border border-border bg-muted px-2.5 py-[7px] text-[13px] text-foreground outline-none transition-colors focus:border-primary";

function bandStyle(band: BmiBand): CSSProperties {
  const map: Record<BmiBand, string> = {
    bgg: "var(--status-success)",
    ba: "var(--status-warning)",
    bb: "var(--status-info)",
    br: "var(--status-danger)",
  };
  const c = map[band];
  return {
    background: `color-mix(in oklch, ${c} 12%, transparent)`,
    color: c,
  };
}

export function BmiPanel({
  weightKg,
  heightCm,
  onWeight,
  onHeight,
}: {
  weightKg: number;
  heightCm: number;
  onWeight: (w: number) => void;
  onHeight: (h: number) => void;
}) {
  const b = bmi(weightKg, heightCm);
  const bi = bmiInfo(b);
  const range = idealWeightRangeKg(heightCm);
  const imn = Number.parseFloat(range.min);
  const imx = Number.parseFloat(range.max);
  const wdiff =
    weightKg < imn
      ? `${(imn - weightKg).toFixed(1)} kg to gain`
      : weightKg > imx
        ? `${(weightKg - imx).toFixed(1)} kg to lose`
        : "in range";
  const wcls =
    weightKg < imn ? "bb" : weightKg > imx ? "ba" : "bgg";

  return (
    <div className="p-3 md:p-5">
      <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Height &amp; weight
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <div>
            <label className="mb-0.5 block text-xs text-muted-foreground">
              Height (cm)
            </label>
            <input
              className={inpCls}
              type="number"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => onHeight(Number(e.target.value) || 174)}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-muted-foreground">
              Weight (kg)
            </label>
            <input
              className={inpCls}
              type="number"
              min={20}
              max={300}
              step={0.1}
              value={weightKg}
              onChange={(e) => onWeight(Number(e.target.value) || 70)}
            />
          </div>
        </div>
      </div>
      <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3 text-center">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Your BMI
        </div>
        <div className="text-[44px] font-medium leading-none" style={{ color: bi.color }}>
          {b.toFixed(1)}
        </div>
        <div className="my-1.5">
          <span
            className="rounded-full px-2.5 py-1 text-[13px] font-medium"
            style={bandStyle(bi.band)}
          >
            {bi.label}
          </span>
        </div>
        <BmiGauge bmi={b} />
        <div
          className="mt-2.5 rounded-md border px-3 py-2 text-left text-xs"
          style={{
            background: "color-mix(in oklch, var(--status-info) 12%, transparent)",
            borderColor: "var(--status-info)",
            color: "var(--status-info)",
          }}
        >
          {bi.tooltip}
        </div>
      </div>
      <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Ideal weight range for {heightCm} cm
        </div>
        <div className="mb-1 text-xl font-medium" style={{ color: "var(--status-success)" }}>
          {range.min} – {range.max} kg
        </div>
        <div className="text-xs text-muted-foreground">
          BMI 18.5–24.9 healthy range
        </div>
        <div className="mt-2 text-[13px]">
          Current: <strong>{weightKg} kg</strong>{" "}
          <span
            className="ml-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={bandStyle(wcls as BmiBand)}
          >
            {wdiff}
          </span>
        </div>
      </div>
    </div>
  );
}
