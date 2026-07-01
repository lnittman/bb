import { useState } from "react";
import { Link } from "react-router-dom";
import type { AutomationRun } from "@bb/server-contract";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.js";
import { getThreadRoutePath } from "@/lib/route-paths";
import { cn } from "@/lib/utils";
import {
  buildRunLane,
  countRunLaneStatuses,
  formatRunLaneStatusSummary,
  projectTintStyle,
  type RunLaneClip,
  type RunLaneTone,
} from "./run-lane";

const RUN_LANE_VISIBLE_CLIP_LIMIT = 96;

const CLIP_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const WINDOW_EDGE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function formatClipTime(timestamp: number): string {
  return CLIP_TIME_FORMATTER.format(new Date(timestamp));
}

/**
 * Outcome tint for a run-clip dot. `ok` and `fail` carry the status color;
 * `muted` (running, skipped, silent) recedes to a low-emphasis neutral so only
 * meaningful outcomes draw the eye. All derived from theme tokens.
 */
const CLIP_TONE_DOT_CLASS: Record<RunLaneTone, string> = {
  ok: "bg-success",
  fail: "bg-destructive",
  running: "bg-attention",
  skipped: "bg-warning",
  muted: "bg-muted-foreground/45",
};

const CLIP_TONE_LABEL: Record<RunLaneTone, string> = {
  ok: "Succeeded",
  fail: "Failed",
  running: "Running",
  skipped: "Skipped",
  muted: "No outcome",
};

function clipStatusLabel(run: AutomationRun, tone: RunLaneTone): string {
  if (run.status === "running") return "Running";
  if (run.status === "skipped") return "Skipped";
  if (tone === "muted" && run.status === "succeeded")
    return "Succeeded · silent";
  return CLIP_TONE_LABEL[tone];
}

interface RunClipDotProps {
  clip: RunLaneClip;
  projectId: string;
}

/**
 * A single run rendered as a small outcome-colored dot on the baseline, at its
 * real fire-time. Hover reveals the run's time + outcome; agent runs keep their
 * link to the spawned thread (the whole dot becomes the link), so the clip-lane
 * never loses the affordance the list row offered.
 */
function RunClipDot({ clip, projectId }: RunClipDotProps) {
  const { run, tone, leftPercent } = clip;
  const label = clipStatusLabel(run, tone);
  const time = formatClipTime(run.startedAt);
  const threadPath =
    run.runMode === "agent" && run.threadId
      ? getThreadRoutePath({ projectId, threadId: run.threadId })
      : null;

  // The hit target is a padded 5x5 square so a 1.5-unit dot stays easy to hover
  // and tab to; only the inner dot is painted. `-translate-x-1/2` centers the
  // target on the computed fire-time position.
  const targetClass =
    "absolute top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const dot = (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 rounded-full ring-2 ring-background",
        CLIP_TONE_DOT_CLASS[tone],
      )}
    />
  );
  const ariaLabel = `${label} · ${time}${threadPath ? " · open thread" : ""}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {threadPath ? (
          <Link
            to={threadPath}
            aria-label={ariaLabel}
            className={targetClass}
            style={{ left: `${leftPercent}%` }}
          >
            {dot}
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className={targetClass}
            style={{ left: `${leftPercent}%` }}
          >
            {dot}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-medium">{label}</span>
        <span className="text-primary-foreground/70"> · {time}</span>
        {threadPath ? (
          <span className="text-primary-foreground/70"> · open thread</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export interface RunLaneProps {
  runs: readonly AutomationRun[];
  nextRunAt: number | null;
  projectId: string;
  /** Injectable clock so the "now" marker is deterministic in tests/stories. */
  now?: number;
}

/**
 * Time-proportional run clip-lane (MINIMAL-CALM): a hairline baseline spanning
 * the last 7 days, each run a small outcome-colored dot at its real fire-time,
 * a hairline "now" marker, and a faint ghost for the next scheduled fire. Reads
 * cadence, gaps, and failures at a glance without any DAW-style chrome. The
 * project tint (inherited via `--loop-tint`) faintly washes the baseline so a
 * loop carries its project's identity.
 */
export function RunLane({ runs, nextRunAt, projectId, now }: RunLaneProps) {
  // Read the clock once at mount so the "now" marker stays put across re-renders
  // (a fresh Date.now() per render would let it drift). A caller may inject a
  // fixed `now` for deterministic tests/stories.
  const [mountedNow] = useState(() => now ?? Date.now());
  const model = buildRunLane({
    runs,
    nextRunAt,
    now: now ?? mountedNow,
  });
  const visibleClips =
    model.clips.length > RUN_LANE_VISIBLE_CLIP_LIMIT
      ? model.clips.slice(-RUN_LANE_VISIBLE_CLIP_LIMIT)
      : model.clips;
  const omittedClipCount = model.clips.length - visibleClips.length;
  const statusSummary = formatRunLaneStatusSummary(countRunLaneStatuses(runs));

  return (
    <TooltipProvider delayDuration={120}>
      <div
        data-run-lane=""
        className="space-y-1.5"
        style={projectTintStyle(projectId)}
      >
        <div className="relative h-6">
          {/* Baseline: a hairline washed by the project tint at whisper alpha. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--loop-tint)] opacity-15"
          />
          {/* "now" marker: a faint hairline rule at the window's trailing edge. */}
          <div
            aria-hidden="true"
            className="absolute top-1 bottom-1 w-px bg-foreground/25"
            style={{ left: `${model.nowPercent}%` }}
          />
          {/* Ghosted next fire: a hollow ring past "now" in the reserved gutter. */}
          {model.nextPercent !== null ? (
            <span
              aria-hidden="true"
              data-run-lane-next=""
              className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-muted-foreground/50"
              style={{ left: `${model.nextPercent}%` }}
            />
          ) : null}
          {visibleClips.map((clip) => (
            <RunClipDot key={clip.run.id} clip={clip} projectId={projectId} />
          ))}
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-2xs text-subtle-foreground">
          <span data-run-lane-count="" className="min-w-0 truncate">
            {omittedClipCount > 0
              ? `Showing latest ${visibleClips.length} of ${model.runCount}`
              : `${model.runCount} ${model.runCount === 1 ? "run" : "runs"} plotted`}
          </span>
          {statusSummary ? (
            <span data-run-lane-status-summary="" className="min-w-0 truncate">
              {statusSummary}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-2xs text-subtle-foreground tabular-nums">
          <span>{WINDOW_EDGE_FORMATTER.format(new Date(model.startMs))}</span>
          <span>Now</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
