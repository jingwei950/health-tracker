"use client";

import { PieChart, Pie } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const BANDS = [
  { name: "underweight", value: 8.5, fill: "#60a5fa" }, // 10–18.5
  { name: "healthy", value: 6.5, fill: "#34d399" }, // 18.5–25
  { name: "overweight", value: 5, fill: "#fbbf24" }, // 25–30
  { name: "obese", value: 10, fill: "#f87171" }, // 30–40
] as const;

const chartConfig = {
  underweight: { label: "Underweight", color: "#60a5fa" },
  healthy: { label: "Healthy", color: "#34d399" },
  overweight: { label: "Overweight", color: "#fbbf24" },
  obese: { label: "Obese", color: "#f87171" },
} satisfies ChartConfig;

export function BmiGauge({ bmi: b }: { bmi: number }) {
  const norm = Math.max(0, Math.min(30, b - 10)); // 0–30 range
  const needle = [
    { value: norm, fill: "transparent" },
    { value: 0.5, fill: "var(--foreground)" }, // wedge tip
    { value: 30 - norm - 0.5, fill: "transparent" },
  ];

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto h-[120px] w-full max-w-[240px]"
    >
      <PieChart>
        {/* Outer band ring */}
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
        {/* Needle wedge */}
        <Pie
          data={needle}
          cx="50%"
          cy="100%"
          startAngle={180}
          endAngle={0}
          innerRadius={0}
          outerRadius={50}
          dataKey="value"
          stroke="none"
          isAnimationActive={false}
        />
      </PieChart>
    </ChartContainer>
  );
}
