import * as React from "react";

import { Button } from "./button";
import { ResponsiveDrawerShell } from "./responsive-overlay";

export default {
  title: "ui/Responsive Overlay",
};

const activityRows = Array.from({ length: 28 }, (_, index) => ({
  id: `activity-${index + 1}`,
  title: `Activity ${String(index + 1).padStart(2, "0")}`,
  detail:
    index % 3 === 0
      ? "Longer row content wraps into a second line for review context."
      : "Compact row content.",
}));

export function FixedHeightMobileSheet() {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="min-h-[75dvh] bg-background p-6 text-foreground">
      <Button type="button" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <ResponsiveDrawerShell
        open={open}
        onOpenChange={setOpen}
        srLabel="Mobile sheet"
        contentClassName="h-[65dvh] max-h-[65dvh]"
        handleOnly
        repositionInputs={false}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border px-4 pb-3 pt-1">
            <div className="text-sm font-medium">Mobile sheet</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Review queue
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-1">
              {activityRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-md bg-state-hover px-3 py-2"
                >
                  <div className="text-sm font-medium">{row.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {row.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border px-4 py-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </ResponsiveDrawerShell>
    </div>
  );
}
