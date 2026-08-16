import { createContext, useSyncExternalStore } from "react";

/**
 * Identifies the nav panel a mounted plugin subtree belongs to and the route
 * it is rendering. Provided by the host around a nav panel's component so
 * `experimental_useNavPanelRouteLabel` can scope its value without the panel
 * plumbing props; absent everywhere else, which is how the hook rejects
 * callers outside a nav panel.
 */
export interface PluginNavPanelMount {
  pluginId: string;
  panelId: string;
  subPath: string;
}

export const PluginNavPanelMountContext =
  createContext<PluginNavPanelMount | null>(null);

/**
 * The loaded label a nav panel published for one of its routes, keyed by
 * panel and subPath. The title bar's breadcrumbs read it to replace their
 * final segment; the publisher clears it on unmount, crash, or route change.
 * A key holds one value: the latest publisher wins, so a panel must publish
 * from exactly one place per route.
 */
const labels = new Map<string, string>();
const listeners = new Set<() => void>();

function keyOf(mount: PluginNavPanelMount): string {
  return `${mount.pluginId}/${mount.panelId}/${mount.subPath}`;
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function setPluginNavPanelRouteLabel(
  mount: PluginNavPanelMount,
  label: string | null,
): void {
  const key = keyOf(mount);
  if (label === null) {
    if (!labels.delete(key)) return;
  } else {
    if (labels.get(key) === label) return;
    labels.set(key, label);
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePluginNavPanelRouteLabel(
  mount: PluginNavPanelMount | null,
): string | null {
  const key = mount === null ? null : keyOf(mount);
  return useSyncExternalStore(
    subscribe,
    () => (key === null ? null : (labels.get(key) ?? null)),
    () => null,
  );
}

/** Test-only. */
export function resetPluginNavPanelRouteLabelsForTest(): void {
  labels.clear();
  emit();
}
