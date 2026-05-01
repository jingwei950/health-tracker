"use client";

import { NAV_ITEMS } from "@/lib/health-track/nav-config";
import type { TabId } from "@/lib/health-track/types";

export function BottomNav({
  tab,
  onTab,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
}) {
  return (
    <nav className="md:hidden flex h-[58px] shrink-0 items-stretch bg-card border-t border-border">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className="flex flex-1 flex-col items-center justify-center gap-[3px] border-none bg-transparent cursor-pointer"
            style={{
              color: active ? "var(--primary)" : "var(--muted-foreground)",
              borderTop: active ? "2px solid var(--primary)" : "2px solid transparent",
              paddingTop: 2,
            }}
          >
            <Icon className="size-[18px]" strokeWidth={2} />
            <span className="text-[9px] font-medium tracking-[0.02em]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
