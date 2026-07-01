// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { QueryClient } from "@tanstack/react-query";
import {
  PERSONAL_PROJECT_ID,
  type AvailableModel,
  type Host,
  type ProviderInfo,
  type ThreadListEntry,
} from "@bb/domain";
import type {
  Automation,
  CreateAutomationRequest,
  SidebarBootstrapResponse,
  SystemExecutionOptionsResponse,
} from "@bb/server-contract";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  automationsQueryKey,
  hostsQueryKey,
  systemExecutionOptionsQueryKey,
} from "@/hooks/queries/query-keys";
import { CompactViewportOverrideProvider } from "@/components/ui/hooks/use-compact-viewport";
import { sidebarNavigationQueryKey } from "@/hooks/queries/sidebar-navigation-query";
import { createQueryClientTestHarness } from "@/test/queryClientTestHarness";
import {
  buildCreateAutomationScrollMaskStyle,
  CreateAutomationDialog,
} from "./CreateAutomationDialog";

const postAutomation = vi.hoisted(() => vi.fn<() => Promise<Response>>());

vi.mock("@/lib/api-server", () => ({
  apiClient: {
    projects: {
      ":id": {
        automations: {
          $post: postAutomation,
        },
      },
    },
  },
  toRelativeUrl: (url: URL) => `${url.pathname}${url.search}`,
}));

const provider: ProviderInfo = {
  id: "codex",
  displayName: "Codex",
  available: true,
  composerActions: [],
  capabilities: {
    supportsArchive: true,
    supportsRename: true,
    supportsServiceTier: false,
    supportsUserQuestion: true,
    supportsFork: true,
    supportedPermissionModes: ["full", "workspace-write", "readonly"],
  },
};

const model: AvailableModel = {
  id: "gpt-5.5",
  model: "gpt-5.5",
  displayName: "GPT-5.5",
  description: "",
  supportedReasoningEfforts: [
    { reasoningEffort: "medium", description: "Medium" },
  ],
  defaultReasoningEffort: "medium",
  isDefault: true,
};

const host: Host = {
  id: "host_local",
  name: "Local",
  type: "persistent",
  status: "connected",
  lastSeenAt: 0,
  createdAt: 0,
  updatedAt: 0,
};

function makeWorktreeThread(
  overrides: Partial<ThreadListEntry> = {},
): ThreadListEntry {
  return {
    id: "thr_worktree",
    projectId: "proj_bb",
    environmentId: "env_reuse",
    providerId: "codex",
    title: "Existing worktree thread",
    titleFallback: "Existing worktree thread",
    folderId: null,
    status: "idle",
    parentThreadId: null,
    sourceThreadId: null,
    originKind: null,
    childOrigin: null,
    archivedAt: null,
    pinnedAt: null,
    deletedAt: null,
    lastReadAt: null,
    latestAttentionAt: 10,
    createdAt: 0,
    updatedAt: 10,
    runtime: {
      displayStatus: "idle",
      hostReconnectGraceExpiresAt: null,
    },
    activity: { activeWorkflowCount: 0 },
    pinSortKey: null,
    hasPendingInteraction: false,
    environmentHostId: host.id,
    environmentName: "Reuse lane",
    environmentBranchName: "reuse/test",
    environmentWorkspaceDisplayKind: "managed-worktree",
    ...overrides,
  };
}

function makeSidebarNavigation(
  threads: readonly ThreadListEntry[] = [],
): SidebarBootstrapResponse {
  return {
    folders: [],
    personalProject: {
      id: PERSONAL_PROJECT_ID,
      kind: "personal",
      name: "Personal",
      createdAt: 0,
      updatedAt: 0,
      sources: [],
      threads: [],
      defaultExecutionOptions: null,
    },
    projects: [
      {
        id: "proj_bb",
        kind: "standard",
        name: "bb",
        createdAt: 0,
        updatedAt: 0,
        sources: [
          {
            id: "src_bb",
            projectId: "proj_bb",
            type: "local_path",
            hostId: host.id,
            path: "/repo/bb",
            isDefault: true,
            createdAt: 0,
            updatedAt: 0,
          },
        ],
        threads: [...threads],
        defaultExecutionOptions: null,
      },
    ],
  };
}

function makeExecutionOptions(): SystemExecutionOptionsResponse {
  return {
    providers: [provider],
    models: [model],
    selectedOnlyModels: [],
    modelLoadError: null,
  };
}

function makeAutomation(overrides: Partial<Automation> = {}): Automation {
  return {
    id: "auto_new",
    projectId: "proj_bb",
    name: "Daily digest",
    enabled: true,
    trigger: {
      triggerType: "schedule",
      cron: "0 8 * * *",
      timezone: "America/New_York",
    },
    execution: {
      mode: "agent",
      prompt: "Summarize updates.",
      providerId: "codex",
      model: "gpt-5.5",
      permissionMode: "readonly",
    },
    environment: { type: "host", workspace: { type: "personal" } },
    autoArchive: false,
    origin: "human",
    createdByThreadId: null,
    nextRunAt: 1_800_000_000_000,
    lastRunAt: null,
    runCount: 0,
    lastRunStatus: null,
    lastRunThreadId: null,
    lastError: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function seedQueries(
  queryClient: QueryClient,
  sidebarNavigation: SidebarBootstrapResponse = makeSidebarNavigation(),
): void {
  const executionOptions = makeExecutionOptions();
  queryClient.setQueryData(hostsQueryKey(), [host]);
  queryClient.setQueryData(sidebarNavigationQueryKey(), sidebarNavigation);
  queryClient.setQueryData(
    systemExecutionOptionsQueryKey({ environmentId: null, providerId: null }),
    executionOptions,
  );
  queryClient.setQueryData(
    systemExecutionOptionsQueryKey({
      environmentId: null,
      providerId: "codex",
    }),
    executionOptions,
  );
}

function getExpectedDefaultTimezone(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(
      new Date(0),
    );
    return timezone;
  } catch {
    return "UTC";
  }
}

async function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Daily digest" },
  });
  fireEvent.change(screen.getByLabelText("Instructions"), {
    target: { value: "Summarize updates." },
  });
}

async function submitForm() {
  await waitFor(() => {
    expect(
      screen
        .getByRole("button", { name: "Create automation" })
        .getAttribute("disabled"),
    ).toBeNull();
  });
  fireEvent.click(screen.getByRole("button", { name: "Create automation" }));
}

function renderDialog({
  onOpenChange = vi.fn(),
  sidebarNavigation = makeSidebarNavigation(),
  isCompactViewport,
}: {
  onOpenChange?: (open: boolean) => void;
  sidebarNavigation?: SidebarBootstrapResponse;
  isCompactViewport?: boolean;
} = {}) {
  const { queryClient, wrapper } = createQueryClientTestHarness();
  seedQueries(queryClient, sidebarNavigation);
  const dialog = (
    <CreateAutomationDialog
      open
      onOpenChange={onOpenChange}
      defaultProjectId="proj_bb"
    />
  );
  render(
    isCompactViewport === undefined ? (
      dialog
    ) : (
      <CompactViewportOverrideProvider isCompactViewport={isCompactViewport}>
        {dialog}
      </CompactViewportOverrideProvider>
    ),
    { wrapper },
  );
  return { queryClient, onOpenChange };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateAutomationDialog", () => {
  it("builds edge-gated alpha mask styles for the scroll body", () => {
    expect(
      buildCreateAutomationScrollMaskStyle({
        aboveOverflow: false,
        belowOverflow: false,
      }),
    ).toBeUndefined();
    expect(
      buildCreateAutomationScrollMaskStyle({
        aboveOverflow: false,
        belowOverflow: true,
      }),
    ).toEqual({
      maskImage:
        "linear-gradient(to bottom, black 0, black calc(100% - 2rem), transparent 100%)",
      WebkitMaskImage:
        "linear-gradient(to bottom, black 0, black calc(100% - 2rem), transparent 100%)",
      maskMode: "alpha",
    });
    expect(
      buildCreateAutomationScrollMaskStyle({
        aboveOverflow: true,
        belowOverflow: false,
      })?.maskImage,
    ).toBe("linear-gradient(to bottom, transparent 0, black 2rem, black 100%)");
  });

  it("validates required fields before allowing submit", async () => {
    renderDialog();

    const nameInput = screen.getByLabelText("Name");
    const instructionsInput = screen.getByLabelText("Instructions");

    expect(screen.queryByText("Name is required.")).toBeNull();
    expect(screen.queryByText("Instructions are required.")).toBeNull();

    fireEvent.blur(nameInput);
    fireEvent.blur(instructionsInput);

    expect(screen.queryByText("Name is required.")).toBeNull();
    expect(screen.queryByText("Instructions are required.")).toBeNull();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Hourly" }));
    fireEvent.blur(nameInput);

    expect(screen.queryByText("Name is required.")).toBeNull();

    fireEvent.pointerDown(nameInput);
    fireEvent.blur(nameInput);
    fireEvent.pointerDown(instructionsInput);
    fireEvent.blur(instructionsInput);

    expect(await screen.findByText("Name is required.")).not.toBeNull();
    expect(screen.getByText("Instructions are required.")).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Create automation" })
        .getAttribute("disabled"),
    ).not.toBeNull();
    expect(postAutomation).not.toHaveBeenCalled();
  });

  it("shows untouched required errors after a submit attempt", async () => {
    renderDialog();

    const form = screen
      .getByRole("button", { name: "Create automation" })
      .closest("form");
    if (!form) {
      throw new Error("Create automation form was not rendered");
    }

    fireEvent.submit(form);

    expect(await screen.findByText("Name is required.")).not.toBeNull();
    expect(screen.getByText("Instructions are required.")).not.toBeNull();
    expect(postAutomation).not.toHaveBeenCalled();
  });

  it("renders the run-context footer, timezone dropdown, and model picker", async () => {
    renderDialog();

    expect(screen.queryByRole("heading", { name: "Permissions" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Model" })).toBeNull();
    expect(
      screen.queryByText("Provider and model for the agent run."),
    ).toBeNull();
    expect(screen.getByText("Ask permissions")).not.toBeNull();
    expect(
      (await screen.findByRole("button", { name: "Permission mode" }))
        .textContent,
    ).toContain("Default");
    expect(
      screen.getByRole("button", { name: "Project" }).textContent,
    ).toContain("bb");
    expect(screen.getByRole("button", { name: "Environment" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Timezone" })).not.toBeNull();
    const modelButton = await screen.findByRole("button", {
      name: "Provider and model",
    });
    expect(modelButton.textContent).toContain("5.5");
    expect(
      modelButton.closest("[data-create-automation-run-context-footer]"),
    ).not.toBeNull();
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton.className).toContain("border-input");
    expect(cancelButton.className).toContain("w-full");
  });

  it("keeps the schedule cadence row full-width on mobile and right-aligned on desktop", () => {
    renderDialog();

    const tabs = screen.getByRole("group", { name: "Schedule cadence" });
    const layout = tabs.closest("[data-create-automation-schedule-layout]");

    expect(layout).not.toBeNull();
    expect(layout?.className).toContain("grid gap-2.5");
    expect(layout?.className).toContain(
      "md:grid-cols-[minmax(8.5rem,12rem)_minmax(0,1fr)]",
    );
    expect(tabs.className).toContain("grid-cols-5");
    expect(tabs.className).toContain("[&>div]:w-full");
    expect(tabs.className).toContain("[&>div>button]:justify-center");
    expect(tabs.className).toContain("md:flex");
    expect(tabs.className).toContain("md:justify-end");
    expect(tabs.className).toContain("md:self-start");
    expect(screen.queryByRole("button", { name: "Manual" })).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Daily" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    const tabParent = tabs.parentElement;
    const tabsClassName = tabs.className;
    for (const cadence of ["Hourly", "Daily", "Weekdays", "Weekly", "Custom"]) {
      fireEvent.click(screen.getByRole("button", { name: cadence }));
      expect(tabs.parentElement).toBe(tabParent);
      expect(tabs.className).toBe(tabsClassName);
    }
  });

  it("pins desktop dialog height and lets the body own overflow", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog");
    const form = screen
      .getByRole("button", { name: "Create automation" })
      .closest("form");
    const scrollBody = dialog.querySelector(
      "[data-create-automation-scroll-body]",
    );

    expect(dialog.className).toContain("md:h-[min(85dvh,44rem)]");
    expect(dialog.className).toContain("md:w-[calc(100vw-3rem)]");
    expect(dialog.className).toContain("md:max-w-2xl");
    expect(dialog.className).toContain("grid-rows-[auto_minmax(0,1fr)]");
    expect(dialog.className).toContain("overflow-hidden");
    expect(form?.className).toContain("grid-rows-[minmax(0,1fr)_auto_auto]");
    expect(scrollBody?.className).toContain("overflow-y-auto");
    expect(scrollBody?.className).not.toContain("max-h");

    const dialogClassName = dialog.className;
    for (const cadence of ["Hourly", "Daily", "Weekdays", "Weekly", "Custom"]) {
      fireEvent.click(screen.getByRole("button", { name: cadence }));
      expect(dialog.className).toBe(dialogClassName);
    }
  });

  it("pins the compact drawer shell height while the inner content fills it", () => {
    renderDialog({ isCompactViewport: true });

    const dialog = screen.getByRole("dialog");
    const form = screen
      .getByRole("button", { name: "Create automation" })
      .closest("form");
    const innerContent = form?.parentElement;

    expect(dialog.className).toContain("h-[calc(100dvh-1rem)]");
    expect(dialog.className).toContain("max-h-[48rem]");
    expect(innerContent?.className).toContain("max-md:flex-1");
    expect(innerContent?.className).toContain("overflow-hidden");
  });

  it("keeps compact drawer chrome stable while schedule controls mount and unmount", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog");
    const form = screen
      .getByRole("button", { name: "Create automation" })
      .closest("form");
    const scrollBody = dialog.querySelector(
      "[data-create-automation-scroll-body]",
    );
    const tabs = screen.getByRole("group", { name: "Schedule cadence" });
    const stableClassNames = {
      dialog: dialog.className,
      form: form?.className,
      scrollBody: scrollBody?.className,
      tabs: tabs.className,
    };

    const initialControls = dialog.querySelector(
      "[data-create-automation-schedule-controls]",
    );
    expect(initialControls).not.toBeNull();
    expect(initialControls?.className).toContain("min-h-[8.25rem]");
    expect(initialControls?.className).toContain("md:min-h-0");

    fireEvent.click(screen.getByRole("button", { name: "Hourly" }));
    const reservedControls = dialog.querySelector(
      "[data-create-automation-schedule-controls]",
    );
    expect(reservedControls).not.toBeNull();
    expect(reservedControls?.getAttribute("data-state")).toBe("reserved");
    expect(reservedControls?.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Weekdays" }));
    const visibleControls = dialog.querySelector(
      "[data-create-automation-schedule-controls]",
    );
    expect(visibleControls).not.toBeNull();
    expect(visibleControls?.getAttribute("data-state")).toBe("visible");
    expect(visibleControls?.getAttribute("aria-hidden")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hourly" }));
    expect(dialog.className).toBe(stableClassNames.dialog);
    expect(form?.className).toBe(stableClassNames.form);
    expect(scrollBody?.className).toBe(stableClassNames.scrollBody);
    expect(tabs.className).toBe(stableClassNames.tabs);
  });

  it("keeps the form rhythm tight without an empty footer spacer", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog");
    const form = screen
      .getByRole("button", { name: "Create automation" })
      .closest("form");
    const scrollBody = dialog.querySelector(
      "[data-create-automation-scroll-body]",
    );

    expect(dialog.className).toContain("gap-4");
    expect(dialog.className).not.toContain("gap-5");
    expect(form?.className).toContain("gap-2.5");
    expect(scrollBody?.querySelector(".grid.gap-4")).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(dialog.querySelectorAll("[aria-live='polite']")).toHaveLength(0);
  });

  it("posts the typed create payload, closes, and invalidates the overview", async () => {
    postAutomation.mockResolvedValue(
      new Response(JSON.stringify(makeAutomation()), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );
    const onOpenChange = vi.fn();
    const { queryClient } = renderDialog({ onOpenChange });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await fillRequiredFields();
    await submitForm();

    const expectedPayload = {
      name: "Daily digest",
      enabled: true,
      trigger: {
        triggerType: "schedule",
        cron: "0 9 * * *",
        timezone: getExpectedDefaultTimezone(),
      },
      execution: {
        mode: "agent",
        prompt: "Summarize updates.",
        providerId: "codex",
        model: "gpt-5.5",
        permissionMode: "readonly",
      },
      environment: {
        type: "host",
        hostId: "host_local",
        workspace: { type: "unmanaged", path: null },
      },
      autoArchive: false,
      origin: "human",
    } satisfies CreateAutomationRequest;

    await waitFor(() => {
      expect(postAutomation).toHaveBeenCalledWith({
        param: { id: "proj_bb" },
        json: expectedPayload,
      });
    });
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: automationsQueryKey(),
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps an existing worktree selection and submits it", async () => {
    postAutomation.mockResolvedValue(
      new Response(JSON.stringify(makeAutomation()), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );
    renderDialog({
      sidebarNavigation: makeSidebarNavigation([makeWorktreeThread()]),
    });
    await fillRequiredFields();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Environment" }), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Existing worktree/u }),
    );

    const worktreeTrigger = await screen.findByRole("button", {
      name: "Worktree",
    });
    expect(worktreeTrigger.textContent).toContain("Pick a worktree");

    fireEvent.pointerDown(worktreeTrigger, { button: 0 });
    fireEvent.click(await screen.findByText("Reuse lane"));

    await waitFor(() => {
      expect(worktreeTrigger.textContent).toContain("Reuse lane");
    });
    await submitForm();

    await waitFor(() => {
      expect(postAutomation).toHaveBeenCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({
            environment: { type: "reuse", environmentId: "env_reuse" },
          }),
        }),
      );
    });
  });

  it.each([
    {
      label: "Hourly",
      enabled: true,
      cron: "0 * * * *",
    },
    {
      label: "Daily",
      enabled: true,
      cron: "45 13 * * *",
      time: "13:45",
    },
    {
      label: "Weekdays",
      enabled: true,
      cron: "30 14 * * 1-5",
      time: "14:30",
    },
    {
      label: "Weekly",
      enabled: true,
      cron: "15 7 * * 1",
      time: "07:15",
    },
    {
      label: "Custom",
      enabled: true,
      cron: "*/15 * * * *",
      customCron: "*/15 * * * *",
    },
  ])(
    "maps $label schedule selection to the create cron",
    async ({ label, enabled, cron, time, customCron }) => {
      postAutomation.mockResolvedValue(
        new Response(JSON.stringify(makeAutomation()), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );
      renderDialog();
      await fillRequiredFields();

      fireEvent.click(screen.getByRole("button", { name: label }));
      if (time) {
        fireEvent.change(screen.getByLabelText("At HH:MM"), {
          target: { value: time },
        });
      }
      if (customCron) {
        fireEvent.change(screen.getByLabelText("Cron expression"), {
          target: { value: customCron },
        });
      }

      await submitForm();

      await waitFor(() => {
        expect(postAutomation).toHaveBeenCalledWith(
          expect.objectContaining({
            json: expect.objectContaining({
              enabled,
              trigger: {
                triggerType: "schedule",
                cron,
                timezone: getExpectedDefaultTimezone(),
              },
            }),
          }),
        );
      });
    },
  );
});
