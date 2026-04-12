import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { defaultGoals } from "@/lib/health-track/constants";
import { FoodPanel } from "./FoodPanel";

const emptyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, burn: 0 };

describe("FoodPanel", () => {
  it("calls onSearch when Search is clicked", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(
      <FoodPanel
        goals={defaultGoals}
        food={[]}
        t={emptyTotals}
        foodQuery="chicken rice"
        onFoodQueryChange={() => {}}
        foodResult={null}
        foodLoading={false}
        foodError={null}
        onSearch={onSearch}
        onDiscard={() => {}}
        onAdd={() => {}}
        onRemove={() => {}}
        onRetry={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("shows search result and Add to log when provided", async () => {
    const onAdd = vi.fn();
    render(
      <FoodPanel
        goals={defaultGoals}
        food={[]}
        t={emptyTotals}
        foodQuery=""
        onFoodQueryChange={() => {}}
        foodResult={{
          food_name: "Chicken Rice",
          serving_size: "1 plate",
          calories: 600,
          protein_g: 30,
          carbs_g: 70,
          fat_g: 15,
          fibre_g: 2,
          sugar_g: 3,
          source_url: "https://example.com",
          source_name: "HPB",
        }}
        foodLoading={false}
        foodError={null}
        onSearch={() => {}}
        onDiscard={() => {}}
        onAdd={onAdd}
        onRemove={() => {}}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("Chicken Rice")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add to log/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
