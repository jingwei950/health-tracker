"use client";

import { NAV_ITEMS } from "@/lib/health-track/nav-config";
import type { TabId } from "@/lib/health-track/types";
import { cn } from "@/lib/utils";

export function BottomNav({
  tab,
  onTab,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
}) {
  return (
    <nav className="flex h-[58px] shrink-0 items-stretch border-t border-border bg-sidebar md:hidden">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={cn(
              "flex flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-none bg-transparent pt-0.5 transition-colors",
              active &&
                "bg-[color-mix(in_oklch,var(--primary)_10%,transparent)]",
            )}
            style={{
              color: active ? "var(--primary)" : "var(--sub-foreground)",
              borderTop: active ? "2px solid var(--primary)" : "2px solid transparent",
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
