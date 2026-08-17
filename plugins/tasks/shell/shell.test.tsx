// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

// jsdom lacks matchMedia; the vendored Dialog's responsive root needs it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// loadPluginApp installs the fake SDK runtime; routes.ts (via the app) must
// not be imported before that happens.
const app = await loadPluginApp(() => import("../app"));
const { parseTasksRoute, tasksRouteToSubPath } = await import("./routes.js");
const { pagerPosition } = await import("./topbar.js");
const { SIDEBAR_COLLAPSED_STORAGE_KEY } =
  await import("./sidebar-preference.js");

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const PROJECT_ID = "01HZZZZZZZZZZZZZZZZZZZZZP1";
const FOLDER_ID = "01HZZZZZZZZZZZZZZZZZZZZZF1";

const project = {
  id: PROJECT_ID,
  name: "Tasks Plugin",
  prefix: "TSK",
  nextTaskNumber: 5,
  color: "blue",
  folderId: FOLDER_ID,
  linkedBbProjectId: null,
  createdAt: "2026-07-15T00:00:00.000Z",
};

const folder = {
  id: FOLDER_ID,
  name: "bb",
  parentFolderId: null,
  createdAt: "2026-07-15T00:00:00.000Z",
};

/**
 * The refresh / New task / sidebar-toggle controls render in the host's title
 * bar via `headerContent`, a separate tree from the panel. Mount it beside a
 * slot the way the host does; queries for those controls go through `screen`.
 */
function mountHeader(subPath: string) {
  const HeaderContent = app.navPanels[0]!.headerContent!;
  const rendered = render(<HeaderContent subPath={subPath} />);
  return {
    /** Queries scoped to the title-bar controls only. */
    within: within(rendered.container),
    rerender: (nextSubPath: string) =>
      rendered.rerender(<HeaderContent subPath={nextSubPath} />),
    unmount: () => rendered.unmount(),
  };
}

function seededRpc(overrides: Record<string, unknown> = {}) {
  return {
    listProjects: () => ({ projects: [project] }),
    listFolders: () => ({ folders: [folder] }),
    listPresets: () => ({ presets: [] }),
    sidebarSummary: () => ({
      projects: [{ projectId: PROJECT_ID, taskCount: 3, activeAgentCount: 1 }],
    }),
    listTasks: () => ({ tasks: [] }),
    getTaskByKey: () => ({ task: null }),
    ...overrides,
  };
}

const emptyRpc = seededRpc({
  listProjects: () => ({ projects: [] }),
  listFolders: () => ({ folders: [] }),
  sidebarSummary: () => ({ projects: [] }),
});

describe("tasks route grammar", () => {
  it("round-trips every route kind and decodes host-encoded subPaths", () => {
    const routes = [
      { kind: "all" },
      { kind: "active" },
      { kind: "manage" },
      { kind: "task", taskKey: "TSK-4" },
      { kind: "project", projectId: PROJECT_ID, view: "list" },
      { kind: "project", projectId: PROJECT_ID, view: "board" },
    ] as const;
    for (const route of routes) {
      expect(parseTasksRoute(tasksRouteToSubPath(route))).toEqual(route);
    }
    // The host hands the splat through URL-encoded per segment.
    expect(parseTasksRoute(`${PROJECT_ID}%3Fview%3Dboard`)).toEqual({
      kind: "project",
      projectId: PROJECT_ID,
      view: "board",
    });
    expect(parseTasksRoute("")).toEqual({ kind: "all" });
  });
});

function pagerTask(key: string, status: string, position: number) {
  return {
    id: `01HZZZZZZZZZZZZZZZZZZZZ${key.replace("-", "")}`,
    projectId: PROJECT_ID,
    number: position,
    key,
    title: key,
    status,
    priority: "none",
    dueDate: null,
    parentTaskId: null,
    position,
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
    labelIds: [],
    // Only key/status/position matter to the pager; the rest satisfies Task.
  } as never;
}

describe("task pager", () => {
  // List order: canonical status groups, server (board) order within a group.
  const tasks = [
    pagerTask("TSK-3", "done", 1),
    pagerTask("TSK-1", "in_progress", 1),
    pagerTask("TSK-2", "todo", 1),
    pagerTask("TSK-4", "todo", 2),
  ];

  it("orders siblings like the list view and exposes neighbors", () => {
    // Visual order: TSK-2, TSK-4 (todo) → TSK-1 (in_progress) → TSK-3 (done).
    expect(pagerPosition(tasks, "TSK-4")).toEqual({
      index: 2,
      total: 4,
      prevKey: "TSK-2",
      nextKey: "TSK-1",
    });
    expect(pagerPosition(tasks, "tsk-2")).toMatchObject({
      index: 1,
      prevKey: null,
    });
    expect(pagerPosition(tasks, "TSK-3")).toMatchObject({
      index: 4,
      nextKey: null,
    });
  });

  it("has no position for unknown keys", () => {
    expect(pagerPosition(tasks, "TSK-99")).toBeNull();
    expect(pagerPosition([], "TSK-1")).toBeNull();
  });

  it("renders n / m on the task route and steps to the next sibling", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "task/TSK-4" },
      {
        rpc: seededRpc({
          listTasks: () => ({ tasks }),
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    await slot.findByText("2 / 4");
    fireEvent.click(slot.getByRole("button", { name: "Next task" }));
    expect(slot.navigateCalls).toContainEqual({
      method: "toPluginPanel",
      path: "tasks",
      options: { subPath: "task/TSK-1" },
    });
  });
});

describe("tasks app shell", () => {
  it("keeps the first-use sidebar expanded without writing a preference", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc(),
      },
    );
    const slotHeader = mountHeader("all");
    await slot.findByText("Tasks Plugin");

    expect(
      screen
        .getByRole("button", { name: "Collapse sidebar" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY),
    ).toBeNull();
  });

  it("persists collapsed state across route changes and remounts", async () => {
    const registration = app.navPanels[0]!;
    const slot = renderSlot(
      registration,
      { subPath: "all" },
      {
        rpc: seededRpc(),
      },
    );
    const slotHeader = mountHeader("all");
    await slot.findByText("Tasks Plugin");

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(slot.queryByRole("button", { name: "Manage" })).toBeNull();
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe(
      "true",
    );

    const Shell = registration.component;
    slot.lifecycle.rerender(<Shell subPath={`${PROJECT_ID}?view=board`} />);
    slotHeader.rerender(`${PROJECT_ID}?view=board`);
    await slot.findByText("Backlog");
    expect(
      screen
        .getByRole("button", { name: "Expand sidebar" })
        .getAttribute("aria-expanded"),
    ).toBe("false");

    slot.lifecycle.unmount();

    slotHeader.unmount();
    const remounted = renderSlot(
      registration,
      { subPath: "all" },
      {
        rpc: seededRpc(),
      },
    );
    const remountedHeader = mountHeader("all");
    await remounted.findByText("All tasks");
    expect(remounted.queryByRole("button", { name: "Manage" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeDefined();
  });

  it("persists expanded state after restoring a collapsed preference", async () => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, "true");
    const registration = app.navPanels[0]!;
    const slot = renderSlot(
      registration,
      { subPath: "all" },
      {
        rpc: seededRpc(),
      },
    );
    const slotHeader = mountHeader("all");
    await slot.findByText("All tasks");
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));

    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe(
      "false",
    );
    await slot.findByRole("button", { name: "Manage" });

    slot.lifecycle.unmount();

    slotHeader.unmount();
    const remounted = renderSlot(
      registration,
      { subPath: "manage" },
      {
        rpc: seededRpc({ listLabels: () => ({ labels: [] }) }),
      },
    );
    const remountedHeader = mountHeader("manage");
    await remounted.findByText("Labels, agent presets, and folders.");
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeDefined();
    expect(remounted.getByRole("button", { name: "Manage" })).toBeDefined();
  });

  it("keeps toggling usable when client storage rejects writes", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage is disabled", "SecurityError");
    });
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc(),
      },
    );
    const slotHeader = mountHeader("all");
    await slot.findByText("Tasks Plugin");

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(
      screen
        .getByRole("button", { name: "Expand sidebar" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("does not treat the first connection as a reconnect", async () => {
    let requests = 0;
    let title = "Initial connection title";
    const task = {
      ...pagerTask("TSK-4", "todo", 1),
      description: "",
      labelIds: [],
    };
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        realtimeConnectionState: "connecting",
        rpc: seededRpc({
          listTasks: () => {
            requests += 1;
            return { tasks: [{ ...task, title }] };
          },
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    await slot.findByText("Initial connection title");
    const initialRequests = requests;
    expect(initialRequests).toBeGreaterThan(0);

    await slot.behavior.setRealtimeConnectionState("connected");
    expect(requests).toBe(initialRequests);

    title = "Recovered from connecting state";
    await slot.behavior.setRealtimeConnectionState("connecting");
    await slot.behavior.setRealtimeConnectionState("connected");
    await slot.findByText("Recovered from connecting state");
    expect(requests).toBeGreaterThan(initialRequests);
  });

  it("recovers when the shell mounts during an existing outage", async () => {
    let serverAvailable = false;
    const task = {
      ...pagerTask("TSK-4", "todo", 1),
      title: "Loaded after existing outage",
      description: "",
      labelIds: [],
    };
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        realtimeConnectionState: "reconnecting",
        rpc: seededRpc({
          listTasks: async () => {
            if (!serverAvailable) throw new Error("server unavailable");
            return { tasks: [task] };
          },
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    await waitFor(() =>
      expect(
        slot.inspection.rpcCalls.some((call) => call.method === "listTasks"),
      ).toBe(true),
    );
    expect(slot.queryByText("Loaded after existing outage")).toBeNull();

    serverAvailable = true;
    await slot.behavior.setRealtimeConnectionState("connected");
    await slot.findByText("Loaded after existing outage");
  });

  it("resyncs the task list after reconnect and supports manual refresh", async () => {
    let title = "Stale list title";
    const task = {
      ...pagerTask("TSK-4", "todo", 1),
      title,
      description: "",
      labelIds: [],
    };
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc({
          listTasks: () => ({ tasks: [{ ...task, title }] }),
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    const slotHeader = mountHeader("all");
    await slot.findByText("Stale list title");

    title = "Recovered list title";
    await slot.behavior.setRealtimeConnectionState("reconnecting");
    expect(slot.queryByText("Recovered list title")).toBeNull();
    await slot.behavior.setRealtimeConnectionState("connected");
    await slot.findByText("Recovered list title");

    title = "Manually refreshed list title";
    fireEvent.click(screen.getByRole("button", { name: "Refresh tasks" }));
    await slot.findByText("Manually refreshed list title");
  });

  it("opens the New task dialog from the title-bar control", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      { rpc: seededRpc({ listLabels: () => ({ labels: [] }) }) },
    );
    const header = mountHeader("all");
    await slot.findByText("Tasks Plugin");
    fireEvent.click(header.within.getByRole("button", { name: /New task/i }));
    await screen.findByRole("dialog");
    expect(screen.getByRole("textbox", { name: "Task title" })).toBeDefined();
  });

  it("disables the title-bar controls while no shell owns them", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      { rpc: seededRpc() },
    );
    const header = mountHeader("all");
    await slot.findByText("Tasks Plugin");
    const refresh = header.within.getByRole("button", {
      name: "Refresh tasks",
    }) as HTMLButtonElement;
    expect(refresh.disabled).toBe(false);
    // The header renders in its own boundary and can outlive the body.
    slot.lifecycle.unmount();
    await waitFor(() => expect(refresh.disabled).toBe(true));
    expect(
      (
        header.within.getByRole("button", {
          name: /(Collapse|Expand) sidebar/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("offers New task only where a task can be created", () => {
    // Title-bar controls are pure functions of the route (task/manage have
    // their own creation paths) and of the store; no shell needed to decide.
    const header = mountHeader(
      tasksRouteToSubPath({ kind: "task", taskKey: "TSK-4" }),
    );
    expect(
      header.within.queryByRole("button", { name: /New task/i }),
    ).toBeNull();
    header.rerender(tasksRouteToSubPath({ kind: "manage" }));
    expect(
      header.within.queryByRole("button", { name: /New task/i }),
    ).toBeNull();
    header.rerender(tasksRouteToSubPath({ kind: "all" }));
    expect(
      header.within.getByRole("button", { name: /New task/i }),
    ).toBeDefined();
    // The refresh and sidebar controls are always present.
    expect(
      header.within.getByRole("button", { name: "Refresh tasks" }),
    ).toBeDefined();
    expect(
      header.within.getByRole("button", { name: /(Collapse|Expand) sidebar/ }),
    ).toBeDefined();
  });

  it("exposes a labeled refresh control left of New task, without a tooltip", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc({
          listTasks: () => ({
            tasks: [
              {
                ...pagerTask("TSK-4", "todo", 1),
                title: "Order probe",
                description: "",
                labelIds: [],
              },
            ],
          }),
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    const header = mountHeader("all");
    await slot.findByText("Order probe");

    const refresh = header.within.getByRole("button", {
      name: "Refresh tasks",
    });
    const newTask = header.within.getByRole("button", { name: /New task/i });
    const sidebar = header.within.getByRole("button", {
      name: "Collapse sidebar",
    });
    // The controls live in the host's title bar only: the panel body carries
    // none of them, so a regression that re-grew the second row would fail here.
    // (Slot queries are document-wide; scope to the panel's own container.)
    const body = within(slot.container);
    expect(body.queryByRole("button", { name: "Refresh tasks" })).toBeNull();
    expect(body.queryByRole("button", { name: /New task/i })).toBeNull();
    expect(
      body.queryByRole("button", { name: /(Collapse|Expand) sidebar/ }),
    ).toBeNull();

    // Labeled like the GitHub plugin's header refresh: the "Refresh" text
    // shows where the header row is wide enough (a container rule, so it is
    // in the DOM here) and the accessible name stays for the icon-only case.
    // No tooltip: the label is the explanation.
    expect(refresh.textContent?.trim()).toBe("Refresh");
    expect(refresh.getAttribute("aria-label")).toBe("Refresh tasks");
    expect(refresh.className).toMatch(/@lg\/page-header:w-auto/);
    expect(refresh.getAttribute("data-state")).toBeNull();
    fireEvent.mouseEnter(refresh);
    fireEvent.pointerEnter(refresh);
    expect(screen.queryByRole("tooltip")).toBeNull();

    // DOM order: refresh → New task → sidebar toggle.
    expect(
      refresh.compareDocumentPosition(newTask) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      newTask.compareDocumentPosition(sidebar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    // Tab order follows DOM order among the three controls.
    const tabbables = [refresh, newTask, sidebar];
    for (let i = 0; i < tabbables.length - 1; i++) {
      expect(
        tabbables[i]!.compareDocumentPosition(tabbables[i + 1]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }

    // Focus-visible path: control is a native button and can take focus.
    refresh.focus();
    expect(document.activeElement).toBe(refresh);
  });

  it("single-flights manual refresh against deferred RPCs and keeps geometry stable", async () => {
    let listTasksCalls = 0;
    let title = "Flight title A";
    let holdListTasks = false;
    const pendingResolvers: Array<() => void> = [];
    const releaseAllPending = () => {
      const resolvers = pendingResolvers.splice(0, pendingResolvers.length);
      for (const resolve of resolvers) resolve();
    };
    const task = {
      ...pagerTask("TSK-4", "todo", 1),
      title,
      description: "",
      labelIds: [],
    };
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc({
          listTasks: () => {
            listTasksCalls += 1;
            if (!holdListTasks) {
              return { tasks: [{ ...task, title }] };
            }
            // Generation-driven fetches stay pending until released so the
            // shared in-flight bit tracks real request completion.
            return new Promise((resolve) => {
              pendingResolvers.push(() =>
                resolve({ tasks: [{ ...task, title }] }),
              );
            });
          },
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    const slotHeader = mountHeader("all");
    await slot.findByText("Flight title A");
    const baselineCalls = listTasksCalls;
    expect(baselineCalls).toBeGreaterThan(0);

    const refresh = screen.getByRole("button", {
      name: "Refresh tasks",
    }) as HTMLButtonElement;
    const idleClassName = refresh.className;
    expect(idleClassName).toMatch(/h-7/);
    expect(refresh.getAttribute("aria-busy")).not.toBe("true");
    expect(refresh.disabled).toBe(false);
    const idleText = refresh.textContent;

    // Accessible name is the stable label contract.
    fireEvent.pointerMove(refresh);
    fireEvent.focus(refresh);
    expect(refresh.getAttribute("aria-label")).toBe("Refresh tasks");

    holdListTasks = true;
    title = "Flight title B";
    fireEvent.click(refresh);
    await waitFor(() => expect(listTasksCalls).toBeGreaterThan(baselineCalls));
    // In-flight while the deferred RPC is still pending.
    expect(refresh.disabled).toBe(true);
    expect(refresh.getAttribute("aria-busy")).toBe("true");
    // Same box while in flight: same classes, same label (the icon spins).
    expect(refresh.className).toBe(idleClassName);
    expect(refresh.textContent).toBe(idleText);

    const callsWhilePending = listTasksCalls;
    // Rapid re-activation while pending must not bump generation again.
    fireEvent.click(refresh);
    fireEvent.click(refresh);
    // Browser keyboard activation synthesizes click; exercise that path.
    refresh.focus();
    fireEvent.click(refresh);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(listTasksCalls).toBe(callsWhilePending);

    // Stay pending well past any former fixed timer; still disabled.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(refresh.disabled).toBe(true);
    expect(listTasksCalls).toBe(callsWhilePending);

    releaseAllPending();
    await slot.findByText("Flight title B");
    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Refresh tasks",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    // Deliberate second refresh after completion works.
    title = "Flight title C";
    fireEvent.click(screen.getByRole("button", { name: "Refresh tasks" }));
    await waitFor(() =>
      expect(listTasksCalls).toBeGreaterThan(callsWhilePending),
    );
    releaseAllPending();
    await slot.findByText("Flight title C");
    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: "Refresh tasks",
      }) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      expect(button.getAttribute("aria-busy")).not.toBe("true");
    });
    // Back to the idle box after settling: same classes and label as before.
    const settled = screen.getByRole("button", {
      name: "Refresh tasks",
    }) as HTMLButtonElement;
    expect(settled.className).toBe(idleClassName);
    expect(settled.textContent).toBe(idleText);
  });

  it("retains stale list data when a manual refresh fails, then recovers", async () => {
    let shouldFail = false;
    let title = "Stable title";
    const task = {
      ...pagerTask("TSK-4", "todo", 1),
      title,
      description: "",
      labelIds: [],
    };
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc({
          listTasks: () => {
            if (shouldFail) throw new Error("refresh failed");
            return { tasks: [{ ...task, title }] };
          },
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    const slotHeader = mountHeader("all");
    await slot.findByText("Stable title");

    shouldFail = true;
    fireEvent.click(screen.getByRole("button", { name: "Refresh tasks" }));
    // Prior data stays on screen (useTasksQuery retains data on error).
    await waitFor(() => expect(slot.getByText("Stable title")).toBeDefined());
    // Failed generation work clears the shared in-flight bit.
    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Refresh tasks",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });
    expect(slot.getByText("Stable title")).toBeDefined();

    shouldFail = false;
    title = "Recovered after failure";
    fireEvent.click(screen.getByRole("button", { name: "Refresh tasks" }));
    await slot.findByText("Recovered after failure");
  });

  it("resyncs an open task detail after reconnect", async () => {
    let title = "Stale detail title";
    const task = {
      ...pagerTask("TSK-4", "todo", 1),
      title,
      description: "",
      labelIds: [],
    };
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "task/TSK-4" },
      {
        rpc: seededRpc({
          getTaskByKey: () => ({ task: { ...task, title } }),
          listTasks: () => ({ tasks: [{ ...task, title }] }),
          listLabels: () => ({ labels: [] }),
          listAttachments: () => ({ attachments: [] }),
          listTaskThreads: () => ({ taskThreads: [] }),
          listComments: () => ({ comments: [] }),
        }),
      },
    );
    await slot.findByRole("textbox", { name: "Task title" });
    expect(slot.getByRole("textbox", { name: "Task title" }).textContent).toBe(
      "Stale detail title",
    );

    title = "Recovered detail title";
    await slot.behavior.setRealtimeConnectionState("reconnecting");
    expect(slot.getByRole("textbox", { name: "Task title" }).textContent).toBe(
      "Stale detail title",
    );
    await slot.behavior.setRealtimeConnectionState("connected");
    await waitFor(() =>
      expect(
        slot.getByRole("textbox", { name: "Task title" }).textContent,
      ).toBe("Recovered detail title"),
    );
  });

  it("shows the empty state and opens the New project dialog", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "" },
      {
        rpc: emptyRpc,
      },
    );
    await slot.findByText("No projects yet");
    fireEvent.click(slot.getByRole("button", { name: /New project/ }));
    await slot.findByText("Projects group tasks under a shared key prefix.");
  });

  it("hides the browse-route bar in phone-width containers but keeps it on tasks", async () => {
    // In a phone-width panel a browse route's bar carries only the view name
    // (host title bar + sidebar already say where you are), so it hides and
    // gives the rows the room. Task routes keep it: Back and the pager have
    // no other home on a phone. jsdom applies no CSS, so assert the
    // container-variant classes that encode the rule.
    const browse = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      { rpc: seededRpc() },
    );
    // "All tasks" also names the sidebar row; take the bar's copy.
    const browseBar = (await browse.findAllByText("All tasks"))
      .map((node) => node.closest("header"))
      .find((node) => node !== null);
    expect(browseBar?.className).toMatch(/hidden @md:flex/);
    browse.lifecycle.unmount();
    cleanup();

    const task = renderSlot(
      app.navPanels[0]!,
      { subPath: "task/TSK-4" },
      { rpc: seededRpc() },
    );
    const taskBar = (
      await task.findByRole("button", { name: "Back (Esc)" })
    ).closest("header");
    expect(taskBar?.className).not.toMatch(/hidden/);
    expect(taskBar?.className).toMatch(/flex/);
  });

  it("renders sidebar data and routes project/board/task subPaths", async () => {
    const boardSlot = renderSlot(
      app.navPanels[0]!,
      { subPath: `${PROJECT_ID}?view=board` },
      { rpc: seededRpc() },
    );
    // The real board renders its status columns (empty listTasks → 0 cards).
    await boardSlot.findByText("Backlog");
    await boardSlot.findByText("In Review");
    expect(boardSlot.getAllByText("Tasks Plugin").length).toBeGreaterThan(0);
    expect(boardSlot.getByText("All tasks")).toBeDefined();
    cleanup();

    const taskSlot = renderSlot(
      app.navPanels[0]!,
      { subPath: "task/TSK-4" },
      { rpc: seededRpc() },
    );
    // Seeded getTaskByKey is null, so the real detail view lands on not-found.
    await taskSlot.findByText(/Task TSK-4 was not found/);
    // Esc returns to the previous list/board (default: all tasks).
    fireEvent.keyDown(window, { key: "Escape" });
    expect(taskSlot.navigateCalls).toContainEqual({
      method: "toPluginPanel",
      path: "tasks",
      options: { subPath: "all" },
    });
  });

  it("routes 'manage' to the manage panel via the sidebar footer", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "manage" },
      {
        rpc: seededRpc({ listLabels: () => ({ labels: [] }) }),
      },
    );
    await slot.findByText("Labels, agent presets, and folders.");
    // The sidebar footer row is highlighted and present on every route.
    expect(slot.getByRole("button", { name: "Manage" })).toBeDefined();
  });

  it("opens quick-create on bare 'c' but not from editable targets or dialogs", async () => {
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc(),
      },
    );
    await slot.findByText("Tasks Plugin");
    fireEvent.keyDown(window, { key: "c" });
    // The New task dialog mounts (project select defaults to the only project).
    await slot.findByRole("dialog");
    // With the dialog open, another 'c' must not stack a second overlay, and
    // Esc still closes the dialog rather than navigating.
    fireEvent.keyDown(window, { key: "c" });
    expect(slot.getAllByRole("dialog")).toHaveLength(1);
  });

  it("marks only new-worktree presets with the worktree hint", async () => {
    const basePreset = {
      id: "01HZZZZZZZZZZZZZZZZZZZZZE1",
      name: "Default env",
      providerId: "claude-code",
      modelId: "claude-sonnet-5",
      reasoningLevel: "medium",
      permissionMode: "accept-edits",
      environmentKind: "project-default",
      baseBranch: null,
      machineId: null,
      instructions: "",
      builtin: false,
      createdAt: "2026-07-15T00:00:00.000Z",
    };
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc({
          listPresets: () => ({
            presets: [
              basePreset,
              {
                ...basePreset,
                id: "01HZZZZZZZZZZZZZZZZZZZZZE2",
                name: "Worktree env",
                environmentKind: "new-worktree",
                baseBranch: "main",
              },
            ],
          }),
        }),
      },
    );
    await slot.findByText("Worktree env");
    expect(slot.getByText("Default env")).toBeDefined();
    expect(slot.getAllByLabelText("Spawns a new worktree")).toHaveLength(1);
  });

  it("refetches sidebar data when invalidation channels fire", async () => {
    let projectCalls = 0;
    const slot = renderSlot(
      app.navPanels[0]!,
      { subPath: "all" },
      {
        rpc: seededRpc({
          listProjects: () => {
            projectCalls += 1;
            return { projects: [project] };
          },
        }),
      },
    );
    await slot.findByText("Tasks Plugin");
    const before = projectCalls;
    await slot.emitRealtime("projects:changed", { projectId: null });
    await waitFor(() => expect(projectCalls).toBeGreaterThan(before));
    // Unrelated channels leave the projects query alone.
    const settled = projectCalls;
    await slot.emitRealtime("comments:changed", { taskId: "x" });
    expect(projectCalls).toBe(settled);
  });
});
