import type { NutritionLog } from "@/types/health.types";

export type WeekDayBar = {
  dayLabel: string;
  cal: number;
  iso: string;
  isToday: boolean;
};

const MON_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday–Sunday week containing `anchor`; sums calories per day from logs. */
export function calendarWeekCalories(
  logs: NutritionLog[],
  anchor: Date = new Date(),
): WeekDayBar[] {
  const dow = anchor.getDay();
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(anchor.getDate() + offsetToMonday);
  const todayIso = isoLocal(anchor);

  const out: WeekDayBar[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = isoLocal(d);
    const cal = logs
      .filter((l) => l.date === iso)
      .reduce((s, l) => s + l.calories, 0);
    out.push({
      dayLabel: MON_LABELS[i],
      cal,
      iso,
      isToday: iso === todayIso,
    });
  }
  return out;
}
