import type { AutomationRun } from "@bb/server-contract";
import { describe, expect, it } from "vitest";
import {
  RUN_LANE_NEXT_GUTTER,
  RUN_LANE_WINDOW_MS,
  buildRunLane,
  countRunLaneStatuses,
  formatRunLaneStatusSummary,
  projectTintStyle,
  projectTintTokenIndex,
  runLaneTone,
} from "./run-lane";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function makeRun(overrides: Partial<AutomationRun> = {}): AutomationRun {
  return {
    id: "run_1",
    automationId: "auto_1",
    runMode: "script",
    threadId: null,
    status: "succeeded",
    trigger: "schedule",
    skipReason: null,
    error: null,
    output: "ok",
    exitCode: 0,
    scheduledFor: NOW - DAY,
    startedAt: NOW - DAY,
    finishedAt: NOW - DAY + 300,
    ...overrides,
  };
}

describe("runLaneTone", () => {
  it("maps succeeded-with-output to ok and failed to fail", () => {
    expect(runLaneTone(makeRun({ status: "succeeded", output: "x" }))).toBe(
      "ok",
    );
    expect(runLaneTone(makeRun({ status: "failed", output: null }))).toBe(
      "fail",
    );
  });

  it("recedes silent scripts while distinguishing running and skipped runs", () => {
    expect(
      runLaneTone(
        makeRun({ status: "succeeded", runMode: "script", output: null }),
      ),
    ).toBe("muted");
    expect(runLaneTone(makeRun({ status: "running", output: null }))).toBe(
      "running",
    );
    expect(runLaneTone(makeRun({ status: "skipped", output: null }))).toBe(
      "skipped",
    );
  });

  it("keeps agent successes ok even with no captured output", () => {
    expect(
      runLaneTone(
        makeRun({ status: "succeeded", runMode: "agent", output: null }),
      ),
    ).toBe("ok");
  });
});

describe("run lane status summary", () => {
  it("counts failed, running, skipped, silent, and succeeded outcomes", () => {
    const counts = countRunLaneStatuses([
      makeRun({ id: "ok", status: "succeeded", output: "ok" }),
      makeRun({ id: "silent", status: "succeeded", output: null }),
      makeRun({ id: "fail", status: "failed", output: null }),
      makeRun({ id: "running", status: "running", output: null }),
      makeRun({ id: "skipped", status: "skipped", output: null }),
    ]);

    expect(counts).toEqual({
      failed: 1,
      running: 1,
      skipped: 1,
      silent: 1,
      succeeded: 1,
    });
    expect(formatRunLaneStatusSummary(counts)).toBe(
      "1 failed · 1 running · 1 skipped · 1 silent · 1 succeeded",
    );
  });
});

describe("buildRunLane placement", () => {
  it("places a run at its real fire-time proportionally across the window", () => {
    // A run exactly halfway through the 7-day window lands at half of the
    // window's share of the track (which ends at nowPercent).
    const midRun = makeRun({ startedAt: NOW - RUN_LANE_WINDOW_MS / 2 });
    const model = buildRunLane({ runs: [midRun], nextRunAt: null, now: NOW });
    const expectedNow = (1 - RUN_LANE_NEXT_GUTTER) * 100;
    expect(model.nowPercent).toBeCloseTo(expectedNow, 5);
    expect(model.clips).toHaveLength(1);
    expect(model.clips[0].leftPercent).toBeCloseTo(expectedNow / 2, 5);
    expect(model.endMs).toBe(NOW);
    expect(model.startMs).toBe(NOW - RUN_LANE_WINDOW_MS);
  });

  it("clamps runs older than the window to the left edge instead of dropping them", () => {
    const ancient = makeRun({ id: "old", startedAt: NOW - 30 * DAY });
    const model = buildRunLane({ runs: [ancient], nextRunAt: null, now: NOW });
    expect(model.clips).toHaveLength(1);
    expect(model.clips[0].leftPercent).toBe(0);
    expect(model.runCount).toBe(1);
  });

  it("orders clips oldest-first regardless of input order", () => {
    const newer = makeRun({ id: "newer", startedAt: NOW - DAY });
    const older = makeRun({ id: "older", startedAt: NOW - 5 * DAY });
    const model = buildRunLane({
      runs: [newer, older],
      nextRunAt: null,
      now: NOW,
    });
    expect(model.clips.map((clip) => clip.run.id)).toEqual(["older", "newer"]);
  });

  it("handles the sparse cases (zero and one run) without error", () => {
    const empty = buildRunLane({ runs: [], nextRunAt: null, now: NOW });
    expect(empty.clips).toHaveLength(0);
    expect(empty.nextPercent).toBeNull();

    const single = buildRunLane({
      runs: [makeRun({ startedAt: NOW - DAY })],
      nextRunAt: null,
      now: NOW,
    });
    expect(single.clips).toHaveLength(1);
  });
});

describe("buildRunLane next-fire ghost", () => {
  it("ghosts a near-future fire inside the reserved gutter, past now", () => {
    const soon = NOW + RUN_LANE_WINDOW_MS * (RUN_LANE_NEXT_GUTTER / 2);
    const model = buildRunLane({ runs: [], nextRunAt: soon, now: NOW });
    expect(model.nextPercent).not.toBeNull();
    const next = model.nextPercent ?? 0;
    expect(next).toBeGreaterThan(model.nowPercent);
    expect(next).toBeLessThanOrEqual(100);
  });

  it("caps a far-future fire at the trailing edge of the track", () => {
    const farOff = NOW + 90 * DAY;
    const model = buildRunLane({ runs: [], nextRunAt: farOff, now: NOW });
    expect(model.nextPercent).toBeCloseTo(100, 5);
  });

  it("omits the ghost when there is no upcoming fire", () => {
    const past = buildRunLane({
      runs: [],
      nextRunAt: NOW - DAY,
      now: NOW,
    });
    expect(past.nextPercent).toBeNull();
    const none = buildRunLane({ runs: [], nextRunAt: null, now: NOW });
    expect(none.nextPercent).toBeNull();
  });
});

describe("project tint identity", () => {
  it("resolves to a sanctioned chromatic theme token, never a literal", () => {
    const style = projectTintStyle("proj_bb") as Record<string, string>;
    expect(style["--loop-tint"]).toMatch(/^var\(--[a-z-]+\)$/);
    // No raw oklch/hex literal leaks into the identity tint.
    expect(style["--loop-tint"]).not.toMatch(/oklch|#/);
  });

  it("is stable for a given project id and spread across ids", () => {
    expect(projectTintTokenIndex("proj_bb")).toBe(
      projectTintTokenIndex("proj_bb"),
    );
    const indices = new Set(
      ["proj_a", "proj_b", "proj_c", "proj_d"].map(projectTintTokenIndex),
    );
    // Distinct-enough ids should not all collapse onto one token.
    expect(indices.size).toBeGreaterThan(1);
  });
});
