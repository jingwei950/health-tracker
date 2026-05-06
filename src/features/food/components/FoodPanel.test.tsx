import { Timestamp } from "firebase/firestore";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { defaultGoals } from "@/lib/health-track/constants";
import { FoodPanel } from "./FoodPanel";
import type { NutritionLog } from "@/types/health.types";

const emptyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, burn: 0 };

const mockSearch = vi.fn();
const mockReset  = vi.fn();

vi.mock("@/hooks/useNutritionSearch", () => ({
  useNutritionSearch: vi.fn(() => ({
    state:  "idle",
    result: null,
    error:  null,
    search: mockSearch,
    reset:  mockReset,
  })),
}));

describe("FoodPanel", () => {
  it("calls search when Search is clicked", async () => {
    const user = userEvent.setup();
    render(
      <FoodPanel
        goals={defaultGoals}
        food={[]}
        t={emptyTotals}
        onLog={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  it("shows food log entries", () => {
    const entry: NutritionLog = {
      id:          "abc123",
      foodName:    "Kaya Toast",
      mealType:    "breakfast",
      servingSize: 140,
      servingUnit: "g",
      servings:    1,
      calories:    320,
      protein:     8,
      carbs:       42,
      fat:         14,
      source:      "HPB Singapore",
      dataVerified: true,
      estimated:   false,
      logSource:   "search",
      date:        "2026-05-02",
      loggedAt:    Timestamp.now(),
    };
    render(
      <FoodPanel
        goals={defaultGoals}
        food={[entry]}
        t={emptyTotals}
        onLog={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Kaya Toast")).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument();
  });
});
