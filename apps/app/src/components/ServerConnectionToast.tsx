import { useEffect, useRef } from "react";
import { appToast } from "@/components/ui/app-toast";
import { useServerConnectionState } from "@/hooks/useServerConnectionState";

// Stable id so repeated calls update one toast instead of stacking.
const CONNECTION_TOAST_ID = "server-connection";
// Debounce: a fast initial connect or a brief blip shouldn't flash a toast; a
// disconnection that lingers past this is worth surfacing.
const SHOW_AFTER_MS = 750;

/**
 * Surfaces the live server (WebSocket) connection through the app's toast
 * system: a persistent "Reconnecting…" toast while the client is reconnecting,
 * dismissed with a brief "Reconnected" confirmation once the link is restored.
 * Reuses the shared `appToast` primitive (its `loading` tone is already a
 * persistent, spinner-led toast) rather than a bespoke surface. Renders nothing.
 *
 * This covers the client<->server link, which previously had no global signal;
 * a thread's own "host-reconnecting" runtime status is a separate concern.
 */
export function ServerConnectionToast() {
  const state = useServerConnectionState();
  const showedReconnecting = useRef(false);

  useEffect(() => {
    if (state === "reconnecting") {
      const timer = window.setTimeout(() => {
        showedReconnecting.current = true;
        appToast.loading("Reconnecting…", { id: CONNECTION_TOAST_ID });
      }, SHOW_AFTER_MS);
      return () => {
        window.clearTimeout(timer);
      };
    }

    if (state === "connected") {
      appToast.dismiss(CONNECTION_TOAST_ID);
      if (showedReconnecting.current) {
        showedReconnecting.current = false;
        appToast.success("Reconnected", { duration: 2000 });
      }
    }

    return undefined;
  }, [state]);

  return null;
}
