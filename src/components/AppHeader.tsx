"use client";

import { Flame, LogOut, Moon, Sun, Target } from "lucide-react";

export function AppHeader({
  onOpenGoals,
  theme,
  onToggleTheme,
  onLogout,
}: {
  onOpenGoals: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="md:hidden flex items-center justify-between border-b border-border bg-card px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-[15px] font-medium text-foreground">
        <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] bg-primary">
          <Flame className="size-[13px] text-primary-foreground" strokeWidth={2.5} />
        </div>
        HealthTrack SG
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="flex size-[30px] cursor-pointer items-center justify-center rounded-md border border-border bg-transparent text-card-foreground hover:bg-muted"
          title="Goals"
          onClick={onOpenGoals}
        >
          <Target className="size-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="flex size-[30px] cursor-pointer items-center justify-center rounded-md border border-border bg-transparent text-card-foreground hover:bg-muted"
          title="Toggle theme"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? (
            <Moon className="size-[13px]" strokeWidth={2} />
          ) : (
            <Sun className="size-[13px]" strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          className="flex size-[30px] cursor-pointer items-center justify-center rounded-md border border-border bg-transparent text-card-foreground hover:bg-muted"
          title="Sign out"
          onClick={onLogout}
        >
          <LogOut className="size-[13px]" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
