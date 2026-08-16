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
import { parseTasksRoute } from "./routes.js";

export const REFRESH_TASKS_LABEL = "Refresh tasks";

/**
 * The Tasks controls in the host's shared title bar: refresh, New task, and
 * the sidebar toggle. Anchored to the header's trailing edge like the app's
 * own panel toggle, so they stay put when the Tasks sidebar opens or closes;
 * the plugin's own row below keeps the view breadcrumb, pager, and view
 * switch. State comes from the shell through the chrome store; commands go
 * back the same way (the two render in separate trees).
 */
export function TasksPanelHeader({ subPath }: PluginNavPanelProps) {
  const route = parseTasksRoute(subPath);
  const { sidebarCollapsed, isRefreshing, bound } = useTasksChromeState();
  const canCreateTask = route.kind !== "task" && route.kind !== "manage";
  const sidebarLabel = sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex shrink-0 items-center gap-1">
        {/* Refresh sits immediately left of the primary New task action and
            wears the same clothes as the GitHub plugin's header refresh: a
            labeled outline button where the header row is wide enough,
            icon-only below (the accessible name stays), no tooltip. The label
            never changes while in flight, so the title bar does not shift;
            the icon spins instead. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 shrink-0 gap-1.5 px-0 @lg/page-header:w-auto @lg/page-header:px-2.5 max-md:pointer-coarse:h-9 max-md:pointer-coarse:w-9"
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
          <span className="hidden @lg/page-header:inline">Refresh</span>
        </Button>
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
    </TooltipProvider>
  );
}
