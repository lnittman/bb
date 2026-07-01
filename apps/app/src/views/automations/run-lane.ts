import type { CSSProperties } from "react";
import type { AutomationRun } from "@bb/server-contract";

/**
 * Geometry + identity helpers for the automations monitor "clip-lane": a
 * time-proportional strip that places each run at its real fire-time so cadence
 * rhythm, gaps, and failures read at a glance. Kept DOM-free so the placement
 * math is unit-tested directly (see run-lane.test.ts); the React layer only
 * consumes plain numbers and inline styles.
 */

/** Rolling window the lane spans by default: the last 7 days up to `now`. */
export const RUN_LANE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The lane reserves a sliver of track to the right of `now` for the ghosted
 * next fire, so the "now" hairline never sits flush against the edge and an
 * upcoming run has somewhere to render. Expressed as a fraction of the full
 * track (0-1); the visible window occupies the remaining `1 - gutter`.
 */
export const RUN_LANE_NEXT_GUTTER = 0.12;

/** Outcome bucket a run-clip is tinted by. Silent successes recede to muted. */
export type RunLaneTone = "ok" | "fail" | "running" | "skipped" | "muted";

export interface RunLaneClip {
  run: AutomationRun;
  /** Horizontal position as a percentage (0-100) across the full lane track. */
  leftPercent: number;
  tone: RunLaneTone;
}

export interface RunLaneModel {
  clips: RunLaneClip[];
  /** Window bounds in epoch ms; `endMs` is `now`. */
  startMs: number;
  endMs: number;
  /** `now` position as a percentage (0-100); sits before the next-fire gutter. */
  nowPercent: number;
  /**
   * Ghosted next fire as a percentage (0-100), or null when there is no future
   * fire (or the window has zero span).
   */
  nextPercent: number | null;
  /** Total runs the model received. */
  runCount: number;
}

export interface RunLaneStatusCounts {
  failed: number;
  running: number;
  skipped: number;
  silent: number;
  succeeded: number;
}

/** A succeeded script run that surfaced no output reads as "silent" — muted. */
function isSilentRun(run: AutomationRun): boolean {
  return (
    run.status === "succeeded" &&
    run.runMode === "script" &&
    (run.output === null || run.output.trim().length === 0)
  );
}

export function runLaneTone(run: AutomationRun): RunLaneTone {
  switch (run.status) {
    case "failed":
      return "fail";
    case "succeeded":
      return isSilentRun(run) ? "muted" : "ok";
    case "running":
      return "running";
    case "skipped":
      return "skipped";
    default: {
      const _exhaustive: never = run.status;
      return _exhaustive;
    }
  }
}

export function countRunLaneStatuses(
  runs: readonly AutomationRun[],
): RunLaneStatusCounts {
  return runs.reduce<RunLaneStatusCounts>(
    (counts, run) => {
      switch (run.status) {
        case "failed":
          counts.failed += 1;
          break;
        case "running":
          counts.running += 1;
          break;
        case "skipped":
          counts.skipped += 1;
          break;
        case "succeeded":
          if (isSilentRun(run)) {
            counts.silent += 1;
          } else {
            counts.succeeded += 1;
          }
          break;
        default: {
          const _exhaustive: never = run.status;
          return _exhaustive;
        }
      }
      return counts;
    },
    { failed: 0, running: 0, skipped: 0, silent: 0, succeeded: 0 },
  );
}

export function formatRunLaneStatusSummary(
  counts: RunLaneStatusCounts,
): string {
  const parts: Array<[number, string]> = [
    [counts.failed, "failed"],
    [counts.running, "running"],
    [counts.skipped, "skipped"],
    [counts.silent, "silent"],
    [counts.succeeded, "succeeded"],
  ];
  return parts
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(" · ");
}

function clampPercent(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

interface BuildRunLaneArgs {
  runs: readonly AutomationRun[];
  nextRunAt: number | null;
  now: number;
  windowMs?: number;
}

/**
 * Place runs (by real fire-time) and the ghosted next fire onto a single lane.
 *
 * The track is `[now - windowMs, now]` (the window) followed by a small gutter
 * that holds the next scheduled fire. Runs older than the window clamp to the
 * left edge so a long-lived loop still shows its recent cadence without losing
 * older activity entirely. Clips are ordered left-to-right (oldest first) for
 * stable rendering.
 */
export function buildRunLane({
  runs,
  nextRunAt,
  now,
  windowMs = RUN_LANE_WINDOW_MS,
}: BuildRunLaneArgs): RunLaneModel {
  const startMs = now - windowMs;
  const span = now - startMs;
  const nowPercent = clampPercent((1 - RUN_LANE_NEXT_GUTTER) * 100);

  const toWindowPercent = (timestamp: number): number => {
    if (span <= 0) {
      return nowPercent;
    }
    const ratio = (timestamp - startMs) / span;
    return clampPercent(ratio * nowPercent);
  };

  const clips: RunLaneClip[] = runs
    .map((run) => ({
      run,
      leftPercent: toWindowPercent(run.startedAt),
      tone: runLaneTone(run),
    }))
    .sort((a, b) => a.run.startedAt - b.run.startedAt);

  let nextPercent: number | null = null;
  if (nextRunAt !== null && nextRunAt > now && span > 0) {
    // Map the future fire across the reserved gutter, capped at the far edge so
    // a fire far beyond the window still shows as a ghost at the very end.
    const overshoot = (nextRunAt - now) / span; // fraction of a window past now
    const gutterRatio = Math.min(overshoot / RUN_LANE_NEXT_GUTTER, 1);
    nextPercent = clampPercent(
      nowPercent + gutterRatio * RUN_LANE_NEXT_GUTTER * 100,
    );
  }

  return {
    clips,
    startMs,
    endMs: now,
    nowPercent,
    nextPercent,
    runCount: runs.length,
  };
}

/**
 * Sanctioned chromatic theme tokens the project tint is drawn from. Every entry
 * is a palette-defined token, so a project's identity color tracks a custom
 * palette (Nord, Dracula, …) instead of stranding a fixed swatch, and no
 * literal color is introduced. Order is stable so a project keeps its tint.
 */
const PROJECT_TINT_TOKENS = [
  "--file-accent",
  "--success",
  "--attention",
  "--pr-merged",
  "--warning",
  "--diff-added",
] as const;

/**
 * Stable index into {@link PROJECT_TINT_TOKENS} for a project id. A small
 * multiply-rolling hash spreads adjacent ids apart so neighboring projects
 * rarely collide on the same tint.
 */
export function projectTintTokenIndex(projectId: string): number {
  let hash = 0;
  for (let index = 0; index < projectId.length; index += 1) {
    hash = (hash * 31 + projectId.charCodeAt(index)) & 0xffff;
  }
  return hash % PROJECT_TINT_TOKENS.length;
}

/**
 * Project identity tint as a CSS custom property, resolved to one of the
 * sanctioned chromatic tokens. Consumers apply it at whisper opacity so the
 * cadence stays calm; the raw token is never shown at full strength.
 */
export function projectTintStyle(projectId: string): CSSProperties {
  const token = PROJECT_TINT_TOKENS[projectTintTokenIndex(projectId)];
  return { "--loop-tint": `var(${token})` } as CSSProperties;
}
