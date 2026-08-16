import { useEffect } from "react";
import { markPluginFrontendsSettled } from "../lib/plugin-frontend-boot-state";
import { bootPluginFrontends } from "../lib/plugin-frontend-lazy";
import { useSystemConfig } from "./queries/system-queries";

/**
 * Boot waits for system config; if that never resolves (backend down), plugin
 * routes would otherwise stay blank forever. After this long, treat the boot
 * as settled so a missing panel can say so — a later boot still registers
 * panels normally.
 */
export const PLUGIN_FRONTEND_SETTLE_FLOOR_MS = 15_000;

/**
 * Load plugin frontend bundles (plugin design §5.1) once per page load,
 * after system config resolves — the loading never delays first paint.
 * The server inventory already filters to running, loadable plugins.
 * After boot, the realtime
 * `plugins-changed` broadcast keeps bundles live via
 * schedulePluginFrontendReconcile (no page refresh needed).
 */
export function usePluginFrontendBoot(): void {
  const systemConfig = useSystemConfig();
  const resolved = systemConfig.data !== undefined;
  useEffect(() => {
    if (resolved) void bootPluginFrontends();
  }, [resolved]);
  useEffect(() => {
    const timeout = window.setTimeout(
      markPluginFrontendsSettled,
      PLUGIN_FRONTEND_SETTLE_FLOOR_MS,
    );
    return () => window.clearTimeout(timeout);
  }, []);
}
