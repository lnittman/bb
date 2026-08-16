import { useSyncExternalStore } from "react";
import { loadSidebarCollapsed } from "./sidebar-preference.js";

/**
 * The shell's title-bar controls (refresh, New task, sidebar toggle) render in
 * the host's shared header via `headerContent`, which is a separate React tree
 * from the panel body. This store is the seam between them: the shell owns the
 * state and publishes what the controls need to draw; the controls dispatch
 * commands the shell has bound. Module-level because both trees mount inside
 * the same plugin bundle and the host mounts at most one instance of a given
 * nav panel per window (split panes deduplicate plugin panels by plugin id and
 * panel path); if concurrent instances ever become possible, key this state by
 * a host-provided panel instance identity instead.
 */
export interface TasksChromeState {
  /** Effective sidebar state, including the narrow-container auto-collapse. */
  sidebarCollapsed: boolean;
  /** True while a manual or reconnect refresh still has fetches in flight. */
  isRefreshing: boolean;
  /**
   * On a task route, the browse scope the pager steps through: the list or
   * board the user came from (`projectId` null = All tasks), or the task's own
   * project on a deep link. null while unknown, in which case no pager shows.
   */
  pager: { projectId: string | null } | null;
  /**
   * False while the shell's main pane (the panel minus its own sidebar) is too
   * narrow for the board, in which case project routes render the list
   * whatever the URL says. The title bar hides the List/Board switch to
   * match, so it never offers a view the shell will refuse. The shell measures
   * this; until it binds, the header falls back to its own container rule.
   */
  boardUsable: boolean;
  /**
   * True while a shell has its commands bound. The header renders in its own
   * boundary, so it can outlive a crashed or unmounted body; while nothing
   * owns the commands the controls disable instead of silently doing nothing.
   */
  bound: boolean;
}

export interface TasksChromeCommands {
  toggleSidebar: () => void;
  refresh: () => void;
  newTask: () => void;
  /** Leave a task for the list or board browsed before it (Esc does the same). */
  back: () => void;
}

const listeners = new Set<() => void>();
let state: TasksChromeState = {
  sidebarCollapsed: loadSidebarCollapsed(),
  isRefreshing: false,
  pager: null,
  boardUsable: true,
  bound: false,
};
let commands: TasksChromeCommands | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

export function publishTasksChromeState(
  next: Omit<TasksChromeState, "bound">,
): void {
  if (
    next.sidebarCollapsed === state.sidebarCollapsed &&
    next.isRefreshing === state.isRefreshing &&
    next.pager?.projectId === state.pager?.projectId &&
    (next.pager === null) === (state.pager === null) &&
    next.boardUsable === state.boardUsable
  ) {
    return;
  }
  state = { ...state, ...next };
  emit();
}

function setBound(bound: boolean): void {
  if (state.bound === bound) return;
  state = { ...state, bound };
  emit();
}

/** The mounted shell binds its handlers; unbinding on unmount makes the
 * controls inert rather than reaching a stale shell. */
export function bindTasksChromeCommands(next: TasksChromeCommands): () => void {
  commands = next;
  setBound(true);
  return () => {
    if (commands !== next) return;
    commands = null;
    setBound(false);
  };
}

export function dispatchTasksChromeCommand(
  command: keyof TasksChromeCommands,
): void {
  commands?.[command]();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): TasksChromeState {
  return state;
}

export function useTasksChromeState(): TasksChromeState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Test-only. */
export function resetTasksChromeStoreForTest(): void {
  state = {
    sidebarCollapsed: loadSidebarCollapsed(),
    isRefreshing: false,
    pager: null,
    boardUsable: true,
    bound: false,
  };
  commands = null;
  emit();
}
