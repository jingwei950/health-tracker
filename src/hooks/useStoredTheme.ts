"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type ThemeMode,
  readStoredTheme,
  writeStoredTheme,
} from "@/lib/theme-storage";

export function useStoredTheme(defaultTheme: ThemeMode = "dark") {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) setThemeState(stored);
  }, []);

  const setTheme = useCallback(
    (value: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
      setThemeState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        writeStoredTheme(next);
        return next;
      });
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
