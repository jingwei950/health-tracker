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
}: {
  tab: TabId;
  onOpenGoals: () => void;
}) {
  return (
    <div className="hidden md:flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <div className="flex items-baseline gap-2.5">
        <span className="text-base font-semibold text-foreground">{TAB_LABELS[tab]}</span>
        <span className="text-xs text-muted-foreground">{DATE_STR}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenGoals}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3.5 py-1.5 text-xs font-medium text-card-foreground cursor-pointer hover:bg-muted transition-colors"
        >
          <Target className="size-3.5" strokeWidth={2} />
          Goals
        </button>
      </div>
    </div>
  );
}
