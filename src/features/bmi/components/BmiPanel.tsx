"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { bmi, bmiInfo, idealWeightRangeKg } from "@/lib/health-track/nutrition";
import type { BmiBand } from "@/lib/health-track/types";

import { BmiGauge } from "./BmiGauge";

const inpCls = "w-full rounded-md border border-border bg-muted px-2.5 py-[7px] text-[13px] text-foreground outline-none transition-colors focus:border-primary";
const btnPrimaryCls =
  "mt-2.5 w-full cursor-pointer rounded-md border border-transparent bg-primary px-3.5 py-[9px] text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

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

/** Remount when committed metrics change (e.g. Firestore) so draft strings stay in sync without effects. */
function BmiHeightWeightFields({
  heightCm,
  weightKg,
  onHeight,
  onWeight,
}: {
  heightCm: number | null;
  weightKg: number | null;
  onHeight: (h: number | null) => void;
  onWeight: (w: number | null) => void;
}) {
  const [hStr, setHStr] = useState(() => (heightCm === null ? "" : String(heightCm)));
  const [wStr, setWStr] = useState(() => (weightKg === null ? "" : String(weightKg)));

  const hasSaved = heightCm != null || weightKg != null;

  const saveMeasurements = () => {
    const ht = hStr.trim();
    const wt = wStr.trim();

    let hOut: number | null = null;
    if (ht !== "") {
      const hn = Number(ht);
      if (!Number.isFinite(hn) || hn < 100 || hn > 250) {
        setHStr(heightCm === null ? "" : String(heightCm));
        return;
      }
      hOut = hn;
    }

    let wOut: number | null = null;
    if (wt !== "") {
      const wn = Number(wt);
      if (!Number.isFinite(wn) || wn < 20 || wn > 300) {
        setWStr(weightKg === null ? "" : String(weightKg));
        return;
      }
      wOut = wn;
    }

    void onHeight(hOut);
    void onWeight(wOut);
  };

  return (
    <>
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
            value={hStr}
            onChange={(e) => setHStr(e.target.value)}
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
            value={wStr}
            onChange={(e) => setWStr(e.target.value)}
          />
        </div>
      </div>
      <button type="button" className={btnPrimaryCls} onClick={saveMeasurements}>
        {hasSaved ? "Update" : "Add"}
      </button>
    </>
  );
}

export function BmiPanel({
  weightKg,
  heightCm,
  onWeight,
  onHeight,
}: {
  weightKg: number | null;
  heightCm: number | null;
  onWeight: (w: number | null) => void;
  onHeight: (h: number | null) => void;
}) {
  const hasBoth =
    weightKg != null &&
    heightCm != null &&
    Number.isFinite(weightKg) &&
    Number.isFinite(heightCm);

  const b = hasBoth ? bmi(weightKg, heightCm) : 0;
  const bi = hasBoth ? bmiInfo(b) : null;
  const range = hasBoth ? idealWeightRangeKg(heightCm) : null;
  const imn = range ? Number.parseFloat(range.min) : 0;
  const imx = range ? Number.parseFloat(range.max) : 0;
  const wdiff =
    hasBoth && range
      ? weightKg < imn
        ? `${(imn - weightKg).toFixed(1)} kg to gain`
        : weightKg > imx
          ? `${(weightKg - imx).toFixed(1)} kg to lose`
          : "in range"
      : "";
  const wcls =
    hasBoth && range
      ? weightKg < imn
        ? "bb"
        : weightKg > imx
          ? "ba"
          : "bgg"
      : "bgg";

  const fieldsKey = `${heightCm ?? "∅"}-${weightKg ?? "∅"}`;

  return (
    <div className="p-3 md:p-5">
      <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Height &amp; weight
        </div>
        <BmiHeightWeightFields
          key={fieldsKey}
          heightCm={heightCm}
          weightKg={weightKg}
          onHeight={onHeight}
          onWeight={onWeight}
        />
      </div>
      {hasBoth && bi ? (
        <>
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
          {range ? (
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
          ) : null}
        </>
      ) : (
        <div className="mb-2.5 rounded-[10px] border border-border bg-card p-3 text-center text-xs text-muted-foreground">
          Enter height (100–250 cm) and weight (20–300 kg), then click Add or Update to save and see
          your BMI.
        </div>
      )}
    </div>
  );
}
