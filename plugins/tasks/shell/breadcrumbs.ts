import type {
  PluginNavPanelBreadcrumbSegment,
  PluginNavPanelProps,
} from "@get-bb/plugin-sdk";
import { parseTasksRoute } from "./routes.js";

const ROOT: PluginNavPanelBreadcrumbSegment = { label: "Tasks", subPath: "" };

/**
 * The title-bar breadcrumbs for a Tasks route (`experimental_breadcrumbs`).
 * Pure: derived from the subPath alone. Project and task routes name a
 * placeholder here; the mounted views replace the final segment with the
 * loaded project name or task title through `experimental_useNavPanelRouteLabel`.
 */
export function resolveTasksBreadcrumbs({
  subPath,
}: Readonly<PluginNavPanelProps>): readonly PluginNavPanelBreadcrumbSegment[] {
  const route = parseTasksRoute(subPath);
  switch (route.kind) {
    case "all":
      return [ROOT, { label: "All tasks" }];
    case "active":
      return [ROOT, { label: "Active" }];
    case "manage":
      return [ROOT, { label: "Manage" }];
    case "project":
      return [ROOT, { label: "Project" }];
    case "task":
      return [ROOT, { label: route.taskKey }];
  }
}
