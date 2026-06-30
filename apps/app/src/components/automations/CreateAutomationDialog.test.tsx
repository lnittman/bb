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
import { sidebarNavigationQueryKey } from "@/hooks/queries/sidebar-navigation-query";
import { createQueryClientTestHarness } from "@/test/queryClientTestHarness";
import { CreateAutomationDialog } from "./CreateAutomationDialog";

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

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Daily digest" },
  });
  fireEvent.change(screen.getByLabelText("Instructions"), {
    target: { value: "Summarize updates." },
  });
  fireEvent.change(screen.getByLabelText("Timezone"), {
    target: { value: "America/New_York" },
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
}: {
  onOpenChange?: (open: boolean) => void;
  sidebarNavigation?: SidebarBootstrapResponse;
} = {}) {
  const { queryClient, wrapper } = createQueryClientTestHarness();
  seedQueries(queryClient, sidebarNavigation);
  render(
    <CreateAutomationDialog
      open
      onOpenChange={onOpenChange}
      defaultProjectId="proj_bb"
    />,
    { wrapper },
  );
  return { queryClient, onOpenChange };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateAutomationDialog", () => {
  it("validates required fields before allowing submit", async () => {
    renderDialog();

    fireEvent.blur(screen.getByLabelText("Name"));
    fireEvent.blur(screen.getByLabelText("Instructions"));

    expect(await screen.findByText("Name is required.")).not.toBeNull();
    expect(screen.getByText("Instructions are required.")).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Create automation" })
        .getAttribute("disabled"),
    ).not.toBeNull();
    expect(postAutomation).not.toHaveBeenCalled();
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

    fillRequiredFields();
    await submitForm();

    const expectedPayload = {
      name: "Daily digest",
      enabled: true,
      trigger: {
        triggerType: "schedule",
        cron: "0 9 * * *",
        timezone: "America/New_York",
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
    fillRequiredFields();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Environment" }), {
      button: 0,
    });
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Existing worktree" }),
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
      label: "Manual",
      enabled: false,
      cron: "0 9 * * *",
    },
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
      fillRequiredFields();

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
                timezone: "America/New_York",
              },
            }),
          }),
        );
      });
    },
  );
});
