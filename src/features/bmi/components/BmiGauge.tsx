"use client";

import { PieChart, Pie } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/Chart";

const BANDS = [
  { name: "underweight", value: 8.5, fill: "var(--status-info)" }, // 10–18.5
  { name: "healthy", value: 6.5, fill: "var(--status-success)" }, // 18.5–25
  { name: "overweight", value: 5, fill: "var(--status-warning)" }, // 25–30
  { name: "obese", value: 10, fill: "var(--status-danger)" }, // 30–40
] as const;

const chartConfig = {
  underweight: { label: "Underweight", color: "var(--status-info)" },
  healthy: { label: "Healthy", color: "var(--status-success)" },
  overweight: { label: "Overweight", color: "var(--status-warning)" },
  obese: { label: "Obese", color: "var(--status-danger)" },
} satisfies ChartConfig;

/** Semicircle maps BMI offset norm (0–30) to angle θ ∈ [π, 0] — tip points into the band arc. */
function needlePoints(norm: number): string {
  const cx = 120;
  const cy = 120;
  const θ = Math.PI - (norm / 30) * Math.PI;
  const R_tip = 52;
  const R_shaft = 14;
  /** Half-width of the base near the pivot (narrower = sleeker shaft). */
  const halfW = 2;

  const ux = Math.cos(θ);
  const uy = -Math.sin(θ);
  const px = Math.sin(θ);
  const py = Math.cos(θ);

  const Tx = cx + R_tip * ux;
  const Ty = cy + R_tip * uy;
  const Sx = cx + R_shaft * ux;
  const Sy = cy + R_shaft * uy;

  const B1x = Sx + halfW * px;
  const B1y = Sy + halfW * py;
  const B2x = Sx - halfW * px;
  const B2y = Sy - halfW * py;

  return `${B1x},${B1y} ${Tx},${Ty} ${B2x},${B2y}`;
}

export function BmiGauge({ bmi: b }: { bmi: number }) {
  const norm = Math.max(0, Math.min(30, b - 10)); // 0–30 range

  return (
    <div className="relative mx-auto h-[120px] w-full max-w-[240px]">
      <ChartContainer
        config={chartConfig}
        className="mx-auto h-[120px] w-full max-w-[240px]"
      >
        <PieChart>
          <Pie
            data={BANDS}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={55}
            outerRadius={88}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          />
        </PieChart>
      </ChartContainer>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 240 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points={needlePoints(norm)}
          className="fill-foreground"
          stroke="none"
        />
      </svg>
    </div>
  );
}
