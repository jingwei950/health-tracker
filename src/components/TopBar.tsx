"use client";

import { Target } from "lucide-react";

import type { TabId } from "@/lib/health-track/types";

const TAB_LABELS: Record<TabId, string> = {
  db: "Dashboard",
  fd: "Nutrition",
  ac: "Activity",
  sl: "Sleep",
  bm: "BMI",
};

const DATE_STR = new Date().toLocaleDateString("en-SG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function TopBar({
  tab,
  onOpenGoals,
  userInitial,
}: {
  tab: TabId;
  onOpenGoals: () => void;
  /** First letter for avatar chip (e.g. from Firebase user). */
  userInitial?: string | null;
}) {
  const letter = (userInitial ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="hidden h-[52px] shrink-0 items-center justify-between border-b border-border bg-sidebar px-5 md:flex">
      <div className="flex items-baseline gap-2.5">
        <span className="text-[15px] font-semibold text-foreground">
          {TAB_LABELS[tab]}
        </span>
        <span className="text-[11px] text-muted-foreground">{DATE_STR}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenGoals}
          className="flex cursor-pointer items-center gap-1.5 rounded-[5px] border border-border bg-transparent px-3 py-[5px] text-[11px] font-medium text-[var(--sub-foreground)] transition-colors hover:border-primary hover:text-primary"
        >
          <Target className="size-3" strokeWidth={2} />
          Goals
        </button>
        <div
          className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          aria-hidden
        >
          {letter}
        </div>
      </div>
    </div>
  );
}
