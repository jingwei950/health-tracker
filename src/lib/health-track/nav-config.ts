import { Activity, BarChart3, LayoutGrid, Moon, Utensils } from "lucide-react";

import type { TabId } from "./types";

export const NAV_ITEMS: {
  id: TabId;
  label: string;
  Icon: typeof LayoutGrid;
}[] = [
  { id: "db", label: "Dashboard", Icon: LayoutGrid },
  { id: "fd", label: "Nutrition", Icon: Utensils },
  { id: "ac", label: "Activity", Icon: Activity },
  { id: "sl", label: "Sleep", Icon: Moon },
  { id: "bm", label: "BMI", Icon: BarChart3 },
];
