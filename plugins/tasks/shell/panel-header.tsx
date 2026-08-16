import type { PluginNavPanelProps } from "@get-bb/plugin-sdk/app";
import { Button } from "@bb/shared-ui/button";
import { Icon } from "@bb/shared-ui/icon";
import { cn } from "@bb/shared-ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bb/shared-ui/tooltip";
import {
  dispatchTasksChromeCommand,
  useTasksChromeState,
} from "./chrome-store.js";
import { TaskPager } from "./pager.js";
import { TasksRefreshProvider } from "./refresh.js";
import { parseTasksRoute, useTasksNavigation } from "./routes.js";
import { ViewToggle } from "./view-toggle.js";

export const REFRESH_TASKS_LABEL = "Refresh tasks";

/**
 * The Tasks controls in the host's shared title bar (`headerContent`), next
 * to the host-rendered breadcrumbs: on a task, Back and the sibling pager; on
 * a project, the List/Board switch; everywhere, refresh, New task where a task
 * can be created, and the sidebar toggle. Anchored to the window edge like the
 * app's own panel toggle, so nothing here moves when the Tasks sidebar opens.
 * State comes from the shell through the chrome store; commands go back the
 * same way (the two render in separate trees). The pager owns its own query,
 * so it gets its own refresh provider.
 */
export function TasksPanelHeader({ subPath }: PluginNavPanelProps) {
  const route = parseTasksRoute(subPath);
  const navigation = useTasksNavigation();
  const { sidebarCollapsed, isRefreshing, pager, boardUsable, bound } =
    useTasksChromeState();
  const canCreateTask = route.kind !== "task" && route.kind !== "manage";
  const sidebarLabel = sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  return (
    <TooltipProvider delayDuration={300}>
      <TasksRefreshProvider>
        <div className="flex shrink-0 items-center gap-1">
          {route.kind === "task" ? (
            <>
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 max-md:pointer-coarse:size-9"
                    aria-label="Back (Esc)"
                    disabled={!bound}
                    onClick={() => dispatchTasksChromeCommand("back")}
                  >
                    <Icon name="ChevronLeft" className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Back (Esc)</TooltipContent>
              </Tooltip>
              {pager !== null ? (
                <TaskPager
                  taskKey={route.taskKey}
                  projectId={pager.projectId}
                  onNavigate={navigation.go}
                />
              ) : null}
            </>
          ) : null}
          {route.kind === "project" && boardUsable ? (
            // The shell hides the switch when its main pane cannot fit the
            // board (BOARD_MIN_WIDTH); the container rule covers the same
            // phone widths before the shell has measured, so nothing pops.
            <span className="hidden @md/page-header:block">
              <ViewToggle
                view={route.view}
                onChange={(view) => navigation.go({ ...route, view })}
              />
            </span>
          ) : null}
          {/* Refresh sits immediately left of the primary New task action.
              Fixed geometry while in flight so the title bar does not shift. */}
          <Tooltip disableHoverableContent>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground active:bg-state-active active:text-foreground max-md:pointer-coarse:size-9"
                aria-label={REFRESH_TASKS_LABEL}
                aria-busy={isRefreshing}
                disabled={!bound || isRefreshing}
                onClick={() => {
                  if (!isRefreshing) dispatchTasksChromeCommand("refresh");
                }}
              >
                <Icon
                  name="RotateCcw"
                  className={cn("size-3.5", isRefreshing && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{REFRESH_TASKS_LABEL}</TooltipContent>
          </Tooltip>
          {canCreateTask ? (
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1.5 max-md:pointer-coarse:h-9"
              aria-label="New task"
              disabled={!bound}
              onClick={() => dispatchTasksChromeCommand("newTask")}
            >
              <Icon name="Plus" className="size-3.5" />
              {/* The label needs real width: size against the host header row
                  (a named container), not the viewport — a regular-viewport
                  split pane can be narrower than a compact window. */}
              <span className="hidden @lg/page-header:inline">New task</span>
            </Button>
          ) : null}
          <Tooltip disableHoverableContent>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 max-md:pointer-coarse:size-9"
                aria-label={sidebarLabel}
                aria-expanded={!sidebarCollapsed}
                disabled={!bound}
                onClick={() => dispatchTasksChromeCommand("toggleSidebar")}
              >
                <Icon name="PanelRight" className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{sidebarLabel}</TooltipContent>
          </Tooltip>
        </div>
      </TasksRefreshProvider>
    </TooltipProvider>
  );
}
