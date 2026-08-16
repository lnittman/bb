import { describe, expect, it } from "vitest";
import { resolveTasksBreadcrumbs } from "./breadcrumbs.js";
import { tasksRouteToSubPath } from "./routes.js";

describe("resolveTasksBreadcrumbs", () => {
  it("names every route under a linked Tasks root", () => {
    const cases: Array<[string, string]> = [
      ["", "All tasks"],
      [tasksRouteToSubPath({ kind: "all" }), "All tasks"],
      [tasksRouteToSubPath({ kind: "active" }), "Active"],
      [tasksRouteToSubPath({ kind: "manage" }), "Manage"],
      [
        tasksRouteToSubPath({
          kind: "project",
          projectId: "01H",
          view: "board",
        }),
        "Project",
      ],
      [tasksRouteToSubPath({ kind: "task", taskKey: "TSK-4" }), "TSK-4"],
    ];
    for (const [subPath, current] of cases) {
      expect(resolveTasksBreadcrumbs({ subPath })).toEqual([
        { label: "Tasks", subPath: "" },
        { label: current },
      ]);
    }
  });
});
