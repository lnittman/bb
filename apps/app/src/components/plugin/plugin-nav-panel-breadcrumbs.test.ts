import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLUGIN_NAV_PANEL_BREADCRUMB_MAX_SEGMENTS,
  resolvePluginNavPanelBreadcrumbs,
} from "./plugin-nav-panel-breadcrumbs";

const base = {
  pluginId: "tasks",
  panelPath: "tasks",
  subPath: "task/TSK-4",
  routeLabel: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolvePluginNavPanelBreadcrumbs", () => {
  it("links ancestors to their panel-relative routes and keeps the final segment passive", () => {
    expect(
      resolvePluginNavPanelBreadcrumbs({
        ...base,
        resolver: () => [
          { label: "Tasks", subPath: "" },
          { label: "Sprint 9", subPath: "01H?view=board" },
          { label: "TSK-4", subPath: "task/TSK-4" },
        ],
      }),
    ).toEqual([
      { label: "Tasks", to: "/plugins/tasks/tasks" },
      { label: "Sprint 9", to: "/plugins/tasks/tasks/01H%3Fview%3Dboard" },
      { label: "TSK-4" },
    ]);
  });

  it("replaces only the final label with the published route label", () => {
    expect(
      resolvePluginNavPanelBreadcrumbs({
        ...base,
        routeLabel: "TSK-4 · Fix reconnect handling",
        resolver: () => [{ label: "Tasks", subPath: "" }, { label: "TSK-4" }],
      }),
    ).toEqual([
      { label: "Tasks", to: "/plugins/tasks/tasks" },
      { label: "TSK-4 · Fix reconnect handling" },
    ]);
  });

  it("ignores a blank published label and keeps the resolver's own", () => {
    for (const routeLabel of ["", "   "]) {
      expect(
        resolvePluginNavPanelBreadcrumbs({
          ...base,
          routeLabel,
          resolver: () => [{ label: "Tasks", subPath: "" }, { label: "TSK-4" }],
        }),
      ).toEqual([
        { label: "Tasks", to: "/plugins/tasks/tasks" },
        { label: "TSK-4" },
      ]);
    }
  });

  it("falls back to the panel title when the resolver throws, returns nothing, or returns malformed data", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const resolvers = [
      () => {
        throw new Error("boom");
      },
      () => [],
      () => "Tasks" as never,
      () => [{ label: "" }],
      () => [{ label: "Tasks", subPath: 3 }] as never,
      () =>
        Array.from(
          { length: PLUGIN_NAV_PANEL_BREADCRUMB_MAX_SEGMENTS + 1 },
          (_, index) => ({ label: `S${index}` }),
        ),
    ];
    for (const resolver of resolvers) {
      expect(
        resolvePluginNavPanelBreadcrumbs({ ...base, resolver }),
      ).toBeNull();
    }
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("experimental_breadcrumbs threw"),
    );
  });

  it("survives plugin values that throw when inspected", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const throwingGetter = {
      get label(): string {
        throw new Error("label getter");
      },
    };
    const hostileArray = new Proxy([{ label: "Tasks" }], {
      get(target, property, receiver) {
        if (property === "length") throw new Error("length trap");
        return Reflect.get(target, property, receiver);
      },
    });
    for (const resolver of [
      () => [throwingGetter] as never,
      () => hostileArray as never,
    ]) {
      expect(
        resolvePluginNavPanelBreadcrumbs({ ...base, resolver }),
      ).toBeNull();
    }
  });

  it("refuses destinations that would leave the panel", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const subPath of ["..", "../settings", "task/../../x", "./a"]) {
      expect(
        resolvePluginNavPanelBreadcrumbs({
          ...base,
          resolver: () => [{ label: "Up", subPath }, { label: "Here" }],
        }),
      ).toBeNull();
    }
    // Repeated slashes and empty segments collapse; query-like text stays a
    // single encoded segment.
    expect(
      resolvePluginNavPanelBreadcrumbs({
        ...base,
        resolver: () => [
          { label: "Root", subPath: "//" },
          { label: "Board", subPath: "01H?view=board" },
          { label: "Here" },
        ],
      }),
    ).toEqual([
      { label: "Root", to: "/plugins/tasks/tasks" },
      { label: "Board", to: "/plugins/tasks/tasks/01H%3Fview%3Dboard" },
      { label: "Here" },
    ]);
  });
});
