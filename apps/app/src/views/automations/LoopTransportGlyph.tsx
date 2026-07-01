import { Icon } from "@/components/ui/icon.js";
import { cn } from "@/lib/utils";
import { projectTintStyle } from "./run-lane";

export interface LoopTransportGlyphProps {
  enabled: boolean;
  projectId: string;
  className?: string;
}

/**
 * Transport-language status glyph shared by the automations list and detail:
 * a small project-tinted "playing" triangle when the loop is enabled, a
 * "stopped" square when paused. Reframes the loop's enabled/paused state as
 * play/stop without touching the schedule controls or backend — pure
 * affordance, tinted by the project's identity color (via `--loop-tint`).
 */
export function LoopTransportGlyph({
  enabled,
  projectId,
  className,
}: LoopTransportGlyphProps) {
  return (
    <span
      aria-hidden="true"
      style={projectTintStyle(projectId)}
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center",
        enabled ? "text-[var(--loop-tint)]" : "text-muted-foreground/60",
        className,
      )}
    >
      <Icon name={enabled ? "Play" : "Square"} className="size-3" />
    </span>
  );
}
