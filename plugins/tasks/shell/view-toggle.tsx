import { cn } from "@bb/shared-ui/lib/utils";
import type { TaskViewMode } from "./routes.js";

/** List / Board switch for a project route. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: TaskViewMode;
  onChange: (view: TaskViewMode) => void;
}) {
  const segment = (mode: TaskViewMode, label: string) => (
    <button
      type="button"
      onClick={() => onChange(mode)}
      aria-pressed={view === mode}
      className={cn(
        "rounded-sm px-2.5 py-0.5 text-xs max-md:pointer-coarse:py-1.5",
        view === mode
          ? "bg-background text-foreground shadow-2xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center rounded-md bg-muted p-0.5">
      {segment("list", "List")}
      {segment("board", "Board")}
    </div>
  );
}
