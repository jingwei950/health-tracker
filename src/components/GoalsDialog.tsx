"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import type { Goals } from "@/lib/health-track/types";

export function GoalsDialog({
  open,
  onOpenChange,
  goals,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  goals: Goals;
  onSave: (g: Goals) => void;
}) {
  const [draft, setDraft] = useState(goals);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-[300px] sm:max-w-[300px]">
        <DialogHeader>
          <DialogTitle>Daily goals</DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5">
          {(
            [
              ["calories", "Calories (kcal)"],
              ["protein", "Protein (g)"],
              ["carbs", "Carbs (g)"],
              ["fat", "Fat (g)"],
            ] as const
          ).map(([k, lbl]) => (
            <div key={k}>
              <Label htmlFor={`g-${k}`} className="text-xs text-muted-foreground">
                {lbl}
              </Label>
              <input
                id={`g-${k}`}
                type="number"
                min={0}
                className="mt-1 w-full rounded-md border border-input bg-muted px-2.5 py-[7px] text-[13px] text-foreground outline-none transition-colors focus:border-primary"
                value={draft[k]}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [k]: Number.parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter className="mt-3 border-0 bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const next: Goals = { ...draft };
              (["calories", "protein", "carbs", "fat"] as const).forEach((key) => {
                if (next[key] <= 0) next[key] = goals[key];
              });
              onSave(next);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
