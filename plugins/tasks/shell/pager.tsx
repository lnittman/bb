import { useMemo } from "react";
import { Button } from "@bb/shared-ui/button";
import { Icon } from "@bb/shared-ui/icon";
import type { Task } from "../shared/contract.js";
import { groupTasksByStatus } from "../views/list/lib.js";
import { listAllTasks, useTasksQuery } from "./data.js";
import type { TasksRoute } from "./routes.js";

export interface PagerPosition {
  /** 1-based position of the task within its sibling list. */
  index: number;
  total: number;
  prevKey: string | null;
  nextKey: string | null;
}

/**
 * Position of `taskKey` within its sibling tasks, mirroring the list view's
 * visual order: canonical status groups, board position within each group
 * (the order `listTasks` returns). Sub-tasks aren't list rows, so a sub-task
 * (or unknown key) has no pager position.
 */
export function pagerPosition(
  tasks: readonly Task[],
  taskKey: string,
): PagerPosition | null {
  const ordered = groupTasksByStatus(tasks).flatMap((group) => group.tasks);
  const wanted = taskKey.toUpperCase();
  const index = ordered.findIndex((task) => task.key.toUpperCase() === wanted);
  if (index === -1) return null;
  return {
    index: index + 1,
    total: ordered.length,
    prevKey: ordered[index - 1]?.key ?? null,
    nextKey: ordered[index + 1]?.key ?? null,
  };
}

/**
 * Prev/next stepping through the task's siblings, rendered in the host title
 * bar beside the other Tasks controls.
 */
export function TaskPager({
  taskKey,
  projectId,
  onNavigate,
}: {
  taskKey: string;
  /** Scope from the list/board the user came from; null = All tasks. */
  projectId: string | null;
  onNavigate: (route: TasksRoute) => void;
}) {
  // Same query the list view issues (unfiltered): top-level tasks in the
  // browse scope. The pager ignores the list's transient filter state — it
  // steps through the full sibling list.
  const siblings = useTasksQuery(
    async (rpc) =>
      listAllTasks(rpc, {
        ...(projectId === null ? {} : { projectId }),
        parentTaskId: null,
      }),
    ["tasks:changed"],
    [projectId],
  );
  const position = useMemo(
    () => (siblings.data ? pagerPosition(siblings.data, taskKey) : null),
    [siblings.data, taskKey],
  );
  if (!position) return null;
  const step = (key: string | null) => {
    if (key !== null) onNavigate({ kind: "task", taskKey: key });
  };
  return (
    // The pager yields entirely on the narrowest headers, measured against the
    // header row (a split pane can be narrower than a compact window); the
    // in-page task content carries its own navigation there.
    <div className="hidden shrink-0 items-center gap-0.5 text-xs tabular-nums text-muted-foreground @sm/page-header:flex">
      {/* The position readout yields before the step buttons do. */}
      <span className="hidden px-1 @md/page-header:inline">
        {position.index} / {position.total}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 max-md:pointer-coarse:size-9"
        aria-label="Previous task"
        disabled={position.prevKey === null}
        onClick={() => step(position.prevKey)}
      >
        <Icon name="ChevronUp" className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 max-md:pointer-coarse:size-9"
        aria-label="Next task"
        disabled={position.nextKey === null}
        onClick={() => step(position.nextKey)}
      >
        <Icon name="ChevronDown" className="size-3.5" />
      </Button>
    </div>
  );
}
