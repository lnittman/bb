// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { PERSONAL_PROJECT_ID } from "@bb/domain";
import type { Automation } from "@bb/server-contract";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  AutomationsOverview,
  type AutomationRowActions,
} from "./AutomationsView";

function makeAutomation(overrides: Partial<Automation> = {}): Automation {
  return {
    id: "auto_test",
    projectId: PERSONAL_PROJECT_ID,
    name: "Daily standup digest",
    enabled: true,
    trigger: {
      triggerType: "schedule",
      cron: "0 9 * * 1-5",
      timezone: "America/Los_Angeles",
    },
    execution: {
      mode: "agent",
      prompt: "Summarize updates.",
      providerId: "codex",
      model: "gpt-5",
      permissionMode: "readonly",
    },
    environment: { type: "host", workspace: { type: "personal" } },
    autoArchive: false,
    origin: "human",
    createdByThreadId: null,
    nextRunAt: 1_700_003_600_000,
    lastRunAt: null,
    runCount: 0,
    lastRunStatus: null,
    lastRunThreadId: null,
    lastError: null,
    createdAt: 0,
    updatedAt: 100,
    ...overrides,
  };
}

describe("AutomationsOverview interactions", () => {
  afterEach(cleanup);

  it("closes the row actions menu after selecting delete", async () => {
    const automation = makeAutomation();
    const actions: AutomationRowActions = {
      onPause: vi.fn(),
      onResume: vi.fn(),
      onRun: vi.fn(),
      onDelete: vi.fn(),
    };

    render(
      <MemoryRouter>
        <AutomationsOverview
          entries={[
            {
              automation,
              project: { id: PERSONAL_PROJECT_ID, name: "Personal" },
            },
          ]}
          isLoading={false}
          hasInitialLoadError={false}
          actions={actions}
          onCreateAutomation={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Daily standup digest actions" }),
      { button: 0 },
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(actions.onDelete).toHaveBeenCalledWith({
      automation,
      project: { id: PERSONAL_PROJECT_ID, name: "Personal" },
    });
    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: "Delete" })).toBeNull();
    });
  });

  it("switches the automation list between active and paused tabs", () => {
    const activeAutomation = makeAutomation({
      id: "auto_active",
      name: "Active radar",
    });
    const pausedAutomation = makeAutomation({
      id: "auto_paused",
      name: "Paused digest",
      enabled: false,
      nextRunAt: null,
    });

    render(
      <MemoryRouter>
        <AutomationsOverview
          entries={[
            {
              automation: activeAutomation,
              project: { id: PERSONAL_PROJECT_ID, name: "Personal" },
            },
            {
              automation: pausedAutomation,
              project: { id: PERSONAL_PROJECT_ID, name: "Personal" },
            },
          ]}
          isLoading={false}
          hasInitialLoadError={false}
          actions={{
            onPause: vi.fn(),
            onResume: vi.fn(),
            onRun: vi.fn(),
            onDelete: vi.fn(),
          }}
          onCreateAutomation={vi.fn()}
        />
      </MemoryRouter>,
    );

    const activeTab = screen.getByRole("tab", { name: "Active 1" });
    const pausedTab = screen.getByRole("tab", { name: "Paused 1" });
    expect(activeTab.getAttribute("aria-selected")).toBe("true");
    expect(pausedTab.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByText("Active radar")).not.toBeNull();
    expect(screen.queryByText("Paused digest")).toBeNull();

    fireEvent.click(pausedTab);

    expect(activeTab.getAttribute("aria-selected")).toBe("false");
    expect(pausedTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByText("Active radar")).toBeNull();
    expect(screen.getByText("Paused digest")).not.toBeNull();
  });

  it("filters gallery templates by text and active category", async () => {
    render(
      <MemoryRouter>
        <AutomationsOverview
          entries={[]}
          isLoading={false}
          hasInitialLoadError={false}
          actions={{
            onPause: vi.fn(),
            onResume: vi.fn(),
            onRun: vi.fn(),
            onDelete: vi.fn(),
          }}
          onCreateAutomation={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /view all/i }));

    const dialog = await screen.findByRole("dialog", {
      name: "Loop templates",
    });
    const gallery = within(dialog);
    const filterInput = gallery.getByRole("searchbox", {
      name: "Filter loop templates",
    });
    expect(
      gallery.getByRole("button", { name: "All" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(gallery.getByRole("button", { name: "Maintenance" })).not.toBeNull();
    expect(gallery.getByRole("button", { name: "Digests" })).not.toBeNull();
    expect(gallery.getByText("Release notes draft")).not.toBeNull();

    fireEvent.change(filterInput, { target: { value: "release" } });

    expect(gallery.getByText("Release notes draft")).not.toBeNull();
    expect(gallery.queryByText("Daily dependency audit")).toBeNull();

    fireEvent.click(gallery.getByRole("button", { name: "Maintenance" }));

    expect(gallery.getByText("No templates match this filter.")).not.toBeNull();
    expect(gallery.queryByText("Release notes draft")).toBeNull();
  });
});
