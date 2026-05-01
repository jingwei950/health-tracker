"use client";

import { Activity, ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";

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
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 bg-card border-r border-border overflow-hidden transition-[width] duration-200",
        "md:w-[58px]",
        collapsed ? "lg:w-[58px]" : "lg:w-[200px]",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 border-b border-border min-h-[52px]">
        <div className="size-7 shrink-0 rounded-lg bg-primary flex items-center justify-center">
          <Activity className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span
          className={cn(
            "text-sm font-bold text-foreground whitespace-nowrap",
            "md:hidden lg:block",
            collapsed && "lg:hidden",
          )}
        >
          HealthTrack SG
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-[5px]">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => onTab(id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-[11px] py-[9px] rounded-lg border-none cursor-pointer transition-colors text-left",
                active
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              <span
                className={cn(
                  "text-[13px] whitespace-nowrap flex-1",
                  "md:hidden lg:block",
                  collapsed && "lg:hidden",
                )}
              >
                {label}
              </span>
              {active && (
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-primary-foreground shrink-0",
                    "md:hidden lg:block",
                    collapsed && "lg:hidden",
                  )}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-0.5 border-t border-border p-[5px]">
        {/* Theme toggle */}
        <button
          type="button"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          onClick={onToggleTheme}
          className="flex items-center gap-2.5 w-full px-[11px] py-[9px] rounded-lg border-none cursor-pointer bg-transparent text-muted-foreground hover:bg-muted transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="size-4 shrink-0" strokeWidth={2} />
          ) : (
            <Moon className="size-4 shrink-0" strokeWidth={2} />
          )}
          <span
            className={cn(
              "text-[13px] whitespace-nowrap",
              "md:hidden lg:block",
              collapsed && "lg:hidden",
            )}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          type="button"
          title={collapsed ? "Expand" : "Collapse"}
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center gap-2.5 w-full px-[11px] py-[9px] rounded-lg border-none cursor-pointer bg-transparent text-muted-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="size-4 shrink-0" strokeWidth={2} />
          ) : (
            <ChevronLeft className="size-4 shrink-0" strokeWidth={2} />
          )}
          <span className={cn("text-[13px]", collapsed && "hidden")}>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
