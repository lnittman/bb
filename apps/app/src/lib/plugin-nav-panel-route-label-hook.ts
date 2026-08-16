import { useContext, useEffect, useMemo } from "react";
import {
  PluginNavPanelMountContext,
  setPluginNavPanelRouteLabel,
} from "@/components/plugin/plugin-nav-panel-route-label";
import { PluginSlotOwnershipContext } from "@/components/plugin/plugin-context";

/**
 * Host implementation of `experimental_useNavPanelRouteLabel` (plugin SDK).
 * Publishes the loaded label for the nav panel route the caller is mounted
 * under; the title bar's breadcrumbs replace their final segment with it. The
 * value follows the caller: it clears when the label goes nullish, when the
 * route (subPath) changes, when the caller unmounts, and — through the slot
 * ownership registry — the moment the slot crashes, before any passive
 * cleanup would run.
 */
export function useNavPanelRouteLabel(label: string | null | undefined): void {
  const mount = useContext(PluginNavPanelMountContext);
  if (mount === null) {
    throw new Error(
      "experimental_useNavPanelRouteLabel can only be used inside a navPanel component",
    );
  }
  const slotOwnershipRegistry = useContext(PluginSlotOwnershipContext);
  const owner = useMemo(() => Symbol("nav-panel-route-label"), []);
  const { pluginId, panelId, subPath } = mount;
  const normalized = label ?? null;
  useEffect(() => {
    const scope = { pluginId, panelId, subPath };
    const release = () => setPluginNavPanelRouteLabel(scope, null);
    slotOwnershipRegistry?.register(owner, release);
    setPluginNavPanelRouteLabel(scope, normalized);
    return () => {
      release();
      slotOwnershipRegistry?.unregister(owner);
    };
  }, [normalized, owner, panelId, pluginId, slotOwnershipRegistry, subPath]);
}
