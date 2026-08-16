import { experimental_useNavPanelRouteLabel } from "@get-bb/plugin-sdk/app";

/**
 * Publishes the loaded label for the current Tasks route (project name, task
 * title) to the host title bar's breadcrumbs. Mount exactly one per route —
 * the host keeps the latest value and cannot arbitrate between publishers.
 */
export function NavPanelRouteLabel({
  label,
}: {
  label: string | null | undefined;
}) {
  experimental_useNavPanelRouteLabel(label);
  return null;
}
