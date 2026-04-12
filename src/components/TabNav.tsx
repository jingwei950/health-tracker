"use client";

import {
  Activity,
  BarChart3,
  LayoutGrid,
  Moon,
  Utensils,
} from "lucide-react";

import type { TabId } from "@/lib/health-track/types";

const tabs: { id: TabId; label: string; Icon: typeof LayoutGrid }[] = [
  { id: "db", label: "Dash", Icon: LayoutGrid },
  { id: "fd", label: "Eat", Icon: Utensils },
  { id: "ac", label: "Move", Icon: Activity },
  { id: "sl", label: "Sleep", Icon: Moon },
  { id: "bm", label: "BMI", Icon: BarChart3 },
];

export function TabNav({
  tab,
  onTab,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
}) {
  return (
    <nav className="-mx-px flex overflow-x-auto border-b border-border bg-card scrollbar-none">
      {tabs.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            data-t={id}
            className="flex min-w-[54px] flex-1 cursor-pointer flex-col items-center gap-0.5 whitespace-nowrap px-1.5 pb-2 pt-1.5 text-[11px] transition-colors"
            style={{
              color: active ? "var(--primary)" : "var(--muted-foreground)",
              borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
            }}
            onClick={() => onTab(id)}
          >
            <Icon className="size-3.5" strokeWidth={2} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
