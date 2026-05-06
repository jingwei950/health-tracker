"use client";

import type { WeekDayBar } from "@/lib/health-track/week-calories";

type Props = {
  week: WeekDayBar[];
  goal: number;
};

export function WeekCalorieChart({ week, goal }: Props) {
  const positives = week.filter((d) => d.cal > 0).map((d) => d.cal);
  const max = Math.max(...positives, goal, 1);

  let bestIdx = -1;
  let bestCal = 0;
  week.forEach((d, i) => {
    if (d.cal > bestCal) {
      bestCal = d.cal;
      bestIdx = i;
    }
  });

  const avg =
    positives.length > 0
      ? Math.round(
          week.filter((d) => d.cal > 0).reduce((s, d) => s + d.cal, 0) /
            positives.length,
        )
      : 0;

  return (
    <div>
      <div className="flex h-[72px] items-end gap-1.5">
        {week.map(({ dayLabel, cal, isToday }, i) => {
          const h = cal ? Math.round((cal / max) * 64) : 3;
          const over = cal > goal;
          const barColor =
            cal === 0
              ? "var(--border)"
              : isToday
                ? "var(--primary)"
                : over
                  ? "var(--status-warning)"
                  : `color-mix(in oklch, var(--primary) 40%, transparent)`;
          return (
            <div
              key={`${dayLabel}-${i}`}
              className="flex flex-1 flex-col items-center gap-0.5"
            >
              {cal > 0 ? (
                <div
                  className={`text-[8px] leading-none ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}
                >
                  {(cal / 1000).toFixed(1)}k
                </div>
              ) : null}
              <div
                className="w-full rounded-t-[3px] transition-[height]"
                style={{ height: h, background: barColor }}
              />
              <span
                className={`text-[9px] ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}
              >
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="h-px w-4 border-t-[1.5px] border-dashed border-muted-foreground" />
        <span className="text-[9px] text-muted-foreground">
          Goal {goal.toLocaleString()} kcal
        </span>
      </div>
      <div className="mt-3 flex justify-between border-t border-border pt-2.5">
        <div>
          <div className="text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
            Avg / day
          </div>
          <div className="mt-0.5 text-base font-bold text-primary">
            {avg.toLocaleString()}
          </div>
          <div className="text-[9px] text-muted-foreground">kcal</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
            Best day
          </div>
          <div className="mt-0.5 text-base font-bold text-[var(--status-warning)]">
            {bestIdx >= 0 ? week[bestIdx].cal.toLocaleString() : "—"}
          </div>
          <div className="text-[9px] text-muted-foreground">
            {bestIdx >= 0
              ? new Date(`${week[bestIdx].iso}T12:00:00`).toLocaleDateString(
                  "en-SG",
                  { weekday: "long" },
                )
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
