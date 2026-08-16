import { useSyncExternalStore } from "react";
import { loadSidebarCollapsed } from "./sidebar-preference.js";

/**
 * The shell's title-bar controls (refresh, New task, sidebar toggle) render in
 * the host's shared header via `headerContent`, which is a separate React tree
 * from the panel body. This store is the seam between them: the shell owns the
 * state and publishes what the controls need to draw; the controls dispatch
 * commands the shell has bound. Module-level because a page hosts one Tasks
 * shell per panel and both trees mount inside the same plugin bundle.
 */
export interface TasksChromeState {
  /** Effective sidebar state, including the narrow-container auto-collapse. */
  sidebarCollapsed: boolean;
  /** True while a manual or reconnect refresh still has fetches in flight. */
  isRefreshing: boolean;
}

export interface TasksChromeCommands {
  toggleSidebar: () => void;
  refresh: () => void;
  newTask: () => void;
}

const listeners = new Set<() => void>();
let state: TasksChromeState = {
  sidebarCollapsed: loadSidebarCollapsed(),
  isRefreshing: false,
};
let commands: TasksChromeCommands | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

export function publishTasksChromeState(next: TasksChromeState): void {
  if (
    next.sidebarCollapsed === state.sidebarCollapsed &&
    next.isRefreshing === state.isRefreshing
  ) {
    return;
  }
  state = next;
  emit();
}

/** The mounted shell binds its handlers; unbinding on unmount makes the
 * controls inert rather than reaching a stale shell. */
export function bindTasksChromeCommands(next: TasksChromeCommands): () => void {
  commands = next;
  return () => {
    if (commands === next) commands = null;
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
  state = { sidebarCollapsed: loadSidebarCollapsed(), isRefreshing: false };
  commands = null;
  emit();
}
