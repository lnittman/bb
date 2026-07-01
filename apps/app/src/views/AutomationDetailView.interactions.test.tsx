// @vitest-environment jsdom

import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PERSONAL_PROJECT_ID } from "@bb/domain";
import type { Automation, AutomationRun } from "@bb/server-contract";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompactViewportOverrideProvider } from "@/components/ui/hooks/use-compact-viewport.js";
import { AutomationDetailContent } from "./AutomationDetailView";

interface PanelGroupHandle {
  setLayout: (layout: number[]) => void;
}

interface PanelGroupProps {
  children?: ReactNode;
}

interface PanelProps {
  children?: ReactNode;
}

const panelGroupState = vi.hoisted(() => ({
  setLayout: vi.fn(),
}));

vi.mock("react-resizable-panels", async () => {
  const React = await import("react");

  const PanelGroup = React.forwardRef<PanelGroupHandle, PanelGroupProps>(
    ({ children }, ref) => {
      React.useImperativeHandle(
        ref,
        () => ({ setLayout: panelGroupState.setLayout }),
        [],
      );
      return React.createElement(
        "div",
        { "data-testid": "automation-panel-group" },
        children,
      );
    },
  );
  PanelGroup.displayName = "MockPanelGroup";

  const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
    ({ children }, ref) =>
      React.createElement(
        "div",
        { ref, "data-testid": "automation-panel" },
        children,
      ),
  );
  Panel.displayName = "MockPanel";

  const PanelResizeHandle = ({ children }: PanelProps) =>
    React.createElement(
      "div",
      { "data-testid": "automation-panel-resize-handle" },
      children,
    );

  return { Panel, PanelGroup, PanelResizeHandle };
});

vi.mock("@/components/secondary-panel/useSecondaryPanelResize", async () => {
  const React = await import("react");

  return {
    useSecondaryPanelResize: () => ({
      handleSecondaryPanelDragging: vi.fn(),
      handleSecondaryPanelResize: vi.fn(),
      persistedWidthPercent: 42,
      secondaryPanelRef: React.createRef<HTMLElement>(),
      secondaryResizablePanelRef: React.createRef<unknown>(),
    }),
  };
});

function makeAutomation(overrides: Partial<Automation> = {}): Automation {
  return {
    id: "auto_watchdog",
    projectId: PERSONAL_PROJECT_ID,
    name: "Disk space watchdog",
    enabled: true,
    trigger: {
      triggerType: "schedule",
      cron: "*/15 * * * *",
      timezone: "America/New_York",
    },
    execution: {
      mode: "script",
      scriptFile: "disk.sh",
      interpreter: "bash",
      timeoutMs: 30_000,
    },
    environment: { type: "host", workspace: { type: "personal" } },
    autoArchive: false,
    origin: "agent",
    createdByThreadId: "thr_8x",
    nextRunAt: 1_700_003_600_000,
    lastRunAt: 1_700_000_000_000,
    runCount: 3,
    lastRunStatus: "succeeded",
    lastRunThreadId: null,
    lastError: null,
    createdAt: 0,
    updatedAt: 100,
    ...overrides,
  };
}

function makeRun(overrides: Partial<AutomationRun> = {}): AutomationRun {
  return {
    id: "run_1",
    automationId: "auto_watchdog",
    runMode: "script",
    threadId: null,
    status: "succeeded",
    trigger: "schedule",
    skipReason: null,
    error: null,
    output: "Disk at 92%",
    exitCode: 0,
    scheduledFor: 1_700_000_000_000,
    startedAt: 1_700_000_000_000,
    finishedAt: 1_700_000_000_300,
    ...overrides,
  };
}

const noop = () => {};

function renderContent(runs: readonly AutomationRun[]) {
  return render(
    <MemoryRouter>
      <CompactViewportOverrideProvider isCompactViewport={false}>
        <AutomationDetailContent
          automation={makeAutomation()}
          runs={runs}
          runsLoading={false}
          runsError={false}
          onPause={noop}
          onResume={noop}
          onRun={noop}
          onDelete={noop}
          actionsPending={false}
        />
      </CompactViewportOverrideProvider>
    </MemoryRouter>,
  );
}

describe("AutomationDetailContent run inspector", () => {
  afterEach(() => {
    cleanup();
    panelGroupState.setLayout.mockClear();
  });

  it("opens and closes a right-panel run inspector from the latest-run shortcut", () => {
    renderContent([makeRun()]);

    expect(screen.queryByRole("heading", { name: "Run details" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Inspect latest" }));

    expect(screen.getByRole("heading", { name: "Run details" })).not.toBeNull();
    expect(screen.getByText("Scheduled")).not.toBeNull();
    expect(screen.getByText("Exit")).not.toBeNull();
    expect(panelGroupState.setLayout).toHaveBeenLastCalledWith([58, 42]);

    fireEvent.click(screen.getByRole("button", { name: "Close run details" }));

    expect(screen.queryByRole("heading", { name: "Run details" })).toBeNull();
  });

  it("opens the selected row in the run inspector", () => {
    renderContent([
      makeRun({ id: "run_latest", output: "latest output" }),
      makeRun({
        id: "run_fail",
        status: "failed",
        output: null,
        error: "disk full",
        exitCode: 1,
        startedAt: 1_699_999_000_000,
      }),
    ]);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Inspect .* run/i })[1],
    );

    expect(screen.getByRole("heading", { name: "Run details" })).not.toBeNull();
    expect(screen.getByText("Error")).not.toBeNull();
    expect(screen.getAllByText("disk full").length).toBeGreaterThan(1);
  });
});
