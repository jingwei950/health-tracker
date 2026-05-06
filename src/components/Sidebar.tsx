"use client";

import {
  ChevronLeft,
  ChevronRight,
  Flame,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

import { NAV_ITEMS } from "@/lib/health-track/nav-config";
import type { TabId } from "@/lib/health-track/types";
import { cn } from "@/lib/utils";

export function Sidebar({
  tab,
  onTab,
  collapsed,
  onToggleCollapse,
  theme,
  onToggleTheme,
  onLogout,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 bg-sidebar border-r border-border overflow-hidden transition-[width] duration-200",
        "md:w-[54px]",
        collapsed ? "lg:w-[54px]" : "lg:w-[196px]",
      )}
    >
      <div className="flex min-h-[52px] items-center gap-2.5 border-b border-border px-3.5 py-3.5">
        <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] bg-primary">
          <Flame className="size-[13px] text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span
          className={cn(
            "whitespace-nowrap text-[13px] font-bold tracking-wide text-foreground",
            "md:hidden lg:block",
            collapsed && "lg:hidden",
          )}
        >
          HealthTrack SG
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-px p-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => onTab(id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-[5px] border-none px-2.5 py-2 text-left transition-colors",
                active
                  ? "bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] text-primary"
                  : "bg-transparent text-[var(--sub-foreground)] hover:bg-muted/60",
              )}
            >
              <Icon className="size-[15px] shrink-0" strokeWidth={2} />
              <span
                className={cn(
                  "flex-1 whitespace-nowrap text-xs",
                  active ? "font-semibold" : "font-normal",
                  "md:hidden lg:block",
                  collapsed && "lg:hidden",
                )}
              >
                {label}
              </span>
              {active && (
                <span
                  className={cn(
                    "size-[5px] shrink-0 rounded-full bg-primary",
                    "md:hidden lg:block",
                    collapsed && "lg:hidden",
                  )}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-px border-t border-border p-2">
        <button
          type="button"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          onClick={onToggleTheme}
          className="flex w-full cursor-pointer items-center gap-2 rounded-[5px] border-none bg-transparent px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted/60"
        >
          {theme === "dark" ? (
            <Sun className="size-[15px] shrink-0" strokeWidth={2} />
          ) : (
            <Moon className="size-[15px] shrink-0" strokeWidth={2} />
          )}
          <span
            className={cn(
              "whitespace-nowrap text-xs",
              "md:hidden lg:block",
              collapsed && "lg:hidden",
            )}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>

        <button
          type="button"
          title="Sign out"
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center gap-2 rounded-[5px] border-none bg-transparent px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted/60"
        >
          <LogOut className="size-[15px] shrink-0" strokeWidth={2} />
          <span
            className={cn(
              "whitespace-nowrap text-xs",
              "md:hidden lg:block",
              collapsed && "lg:hidden",
            )}
          >
            Sign out
          </span>
        </button>

        <button
          type="button"
          title={collapsed ? "Expand" : "Collapse"}
          onClick={onToggleCollapse}
          className="hidden cursor-pointer items-center gap-2 rounded-[5px] border-none bg-transparent px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted/60 lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="size-[15px] shrink-0" strokeWidth={2} />
          ) : (
            <ChevronLeft className="size-[15px] shrink-0" strokeWidth={2} />
          )}
          <span className={cn("text-xs", collapsed && "hidden")}>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
