import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { AutomationRun } from "@bb/server-contract";
import { describe, expect, it } from "vitest";
import { RunLane } from "./RunLane";

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

function renderLane(props: Partial<Parameters<typeof RunLane>[0]>): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <RunLane
        runs={props.runs ?? [makeRun()]}
        nextRunAt={props.nextRunAt ?? null}
        projectId={props.projectId ?? "proj_bb"}
        now={props.now ?? NOW}
      />
    </MemoryRouter>,
  );
}

describe("RunLane", () => {
  it("renders the lane container, a now marker, and window edge labels", () => {
    const markup = renderLane({ runs: [makeRun()] });
    expect(markup).toContain('data-run-lane=""');
    expect(markup).toContain('data-run-lane-count=""');
    expect(markup).toContain("1 run plotted");
    // The "now" hairline and the trailing "Now" edge label both appear.
    expect(markup).toContain(">Now<");
  });

  it("positions each run at its real fire-time (not stacked at the origin)", () => {
    // Two runs at different offsets must land at different left percentages.
    const markup = renderLane({
      runs: [
        makeRun({ id: "a", startedAt: NOW - 6 * DAY }),
        makeRun({ id: "b", startedAt: NOW - DAY }),
      ],
    });
    const lefts = [...markup.matchAll(/left:\s*([\d.]+)%/g)].map((m) => m[1]);
    // now marker + two clips => at least three positioned elements.
    expect(lefts.length).toBeGreaterThanOrEqual(3);
    const unique = new Set(lefts);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("keeps an agent run's link to its thread on the clip", () => {
    const markup = renderLane({
      runs: [
        makeRun({
          id: "run_agent",
          runMode: "agent",
          threadId: "thr_run",
          output: null,
          exitCode: null,
        }),
      ],
    });
    expect(markup).toContain('href="/projects/proj_bb/threads/thr_run"');
  });

  it("keeps non-link run clips decorative for accessibility output", () => {
    const markup = renderLane({ runs: [makeRun()] });
    expect(markup).not.toContain('role="img"');
    expect(markup).toContain('aria-hidden="true"');
  });

  it("renders a ghosted next fire when one is upcoming", () => {
    const markup = renderLane({
      runs: [makeRun()],
      nextRunAt: NOW + DAY,
    });
    expect(markup).toContain('data-run-lane-next=""');
  });

  it("caps dense histories and summarizes all statuses", () => {
    const runs = Array.from({ length: 110 }, (_, index) =>
      makeRun({
        id: `run_${index}`,
        startedAt: NOW - (110 - index) * 1000,
        status: index === 0 ? "failed" : "succeeded",
      }),
    );
    const markup = renderLane({ runs });

    expect(markup).toContain("Showing latest 96 of 110");
    expect(markup).toContain("1 failed · 109 succeeded");
  });

  it("omits the next-fire ghost when there is none", () => {
    const markup = renderLane({ runs: [makeRun()], nextRunAt: null });
    expect(markup).not.toContain('data-run-lane-next=""');
  });

  it("carries the project tint via the --loop-tint custom property", () => {
    const markup = renderLane({ runs: [makeRun()], projectId: "proj_bb" });
    expect(markup).toContain("--loop-tint:var(--");
  });

  it("renders the sparse single-run case without error", () => {
    const markup = renderLane({ runs: [makeRun({ id: "only" })] });
    expect(markup).toContain('data-run-lane=""');
  });
});
