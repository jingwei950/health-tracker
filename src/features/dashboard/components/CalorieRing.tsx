"use client";

type Props = {
  consumed: number;
  burned: number;
  goal: number;
};

/** Dual-ring calorie summary (reference HTML CalRing). */
export function CalorieRing({ consumed, burned, goal }: Props) {
  const net = consumed - burned;
  const pct = Math.min(1, goal > 0 ? consumed / goal : 0);
  const burnPct = Math.min(1, goal > 0 ? burned / goal : 0);
  const r = 62;
  const cx = 70;
  const cy = 70;
  const sw = 9;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const innerR = r - sw - 4;
  const innerCirc = 2 * Math.PI * innerR;
  const burnDash = burnPct * innerCirc;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width={140} height={140} viewBox="0 0 140 140" aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--card2)"
            strokeWidth={sw}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-500"
          />
          <circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill="none"
            stroke="var(--card2)"
            strokeWidth={sw - 2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill="none"
            stroke="var(--status-danger)"
            strokeWidth={sw - 2}
            strokeDasharray={`${burnDash} ${innerCirc}`}
            strokeDashoffset={innerCirc * 0.25}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-500"
          />
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fontSize={26}
            fontWeight={700}
            fill="var(--foreground)"
            className="font-sans"
          >
            {consumed.toLocaleString()}
          </text>
          <text
            x={cx}
            y={cy + 6}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted-foreground)"
            letterSpacing="0.08em"
            className="font-sans"
          >
            CONSUMED
          </text>
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={net > goal ? "var(--status-warning)" : "var(--status-success)"}
            className="font-sans"
          >
            {net.toLocaleString()} net
          </text>
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
            Goal
          </div>
          <div className="text-xl font-bold text-foreground">
            {goal.toLocaleString()}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">kcal</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-[2px] bg-[var(--card2)]">
            <div
              className="h-full rounded-[2px] bg-primary transition-[width]"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(pct * 100)}% of goal</span>
            <span>{Math.max(0, goal - consumed).toLocaleString()} left</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div
            className="flex min-w-0 flex-1 flex-col rounded-md border-l-[3px] border-[var(--status-danger)] bg-[var(--card2)] px-2.5 py-2"
          >
            <div className="text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
              Burned
            </div>
            <div className="mt-0.5 text-base font-bold text-[var(--status-danger)]">
              {burned}
            </div>
            <div className="text-[9px] text-muted-foreground">kcal</div>
          </div>
          <div
            className="flex min-w-0 flex-1 flex-col rounded-md border-l-[3px] border-[var(--status-success)] bg-[var(--card2)] px-2.5 py-2"
          >
            <div className="text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
              Remaining
            </div>
            <div className="mt-0.5 text-base font-bold text-[var(--status-success)]">
              {Math.max(0, goal - consumed)}
            </div>
            <div className="text-[9px] text-muted-foreground">kcal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
