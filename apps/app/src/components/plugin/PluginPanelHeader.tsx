import { Component, useMemo, type ReactNode } from "react";
import { AppBreadcrumbs } from "@/components/layout/AppBreadcrumbs";
import type { PluginNavPanelChrome } from "@/lib/plugin-nav-panel-chrome";
import type { PluginNavPanelSlot } from "@/lib/plugin-slots";
import { PluginIcon } from "./PluginIcon";
import { PluginContext } from "./plugin-context";
import { resolvePluginNavPanelBreadcrumbs } from "./plugin-nav-panel-breadcrumbs";
import { usePluginNavPanelRouteLabel } from "./plugin-nav-panel-route-label";

/**
 * The plugin navPanel slices of the shared app header (AppPageHeader via
 * AppLayout's AppHeader): plugin panels get the SAME chrome as
 * Settings — compact plugin icon + panel title in the header center, the
 * registration's optional `headerContent` component in the header actions.
 * PluginPanelView renders only the panel body.
 */

/**
 * Containment for `headerContent`: plugin code inside host chrome. A throw
 * hides the accessory (warn only) — never the header itself or the panel
 * body, whose own boundary latch stays untouched.
 */
class HeaderContentBoundary extends Component<
  { pluginId: string; children: ReactNode },
  { crashed: boolean }
> {
  override state = { crashed: false };

  static getDerivedStateFromError(): { crashed: boolean } {
    return { crashed: true };
  }

  override componentDidCatch(error: Error): void {
    console.warn(
      `[plugin:${this.props.pluginId}] navPanel headerContent crashed and is hidden: ${error.message}`,
    );
  }

  override render(): ReactNode {
    return this.state.crashed ? null : this.props.children;
  }
}

/**
 * Header center for a plugin panel route. Takes the panel's chrome so it can
 * paint from a live registration or from the chrome remembered before plugin
 * frontends have booted; when the live registration describes breadcrumbs
 * (`experimental_breadcrumbs`) for the current `subPath`, they replace the
 * icon + title, in the same treatment Automations uses. Wide headers show the
 * whole trail; narrow ones (a split pane, a compact window — measured against
 * the header row itself, not the viewport) collapse to the current place.
 */
export function PluginPanelHeaderCenter({
  chrome,
  panel = null,
  subPath = "",
  usesDesktopChrome = false,
}: {
  chrome: Pick<PluginNavPanelChrome, "pluginId" | "icon" | "title">;
  /** The live registration; null before plugin frontends have booted. */
  panel?: PluginNavPanelSlot | null;
  subPath?: string;
  usesDesktopChrome?: boolean;
}) {
  const resolver = panel?.experimental_breadcrumbs;
  const routeLabel = usePluginNavPanelRouteLabel(
    panel === null
      ? null
      : { pluginId: panel.pluginId, panelId: panel.id, subPath },
  );
  const breadcrumbs = useMemo(
    () =>
      panel === null || resolver === undefined
        ? null
        : resolvePluginNavPanelBreadcrumbs({
            pluginId: panel.pluginId,
            panelPath: panel.path,
            subPath,
            resolver,
            routeLabel,
          }),
    [panel, resolver, routeLabel, subPath],
  );
  if (breadcrumbs === null) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <PluginIcon
          pluginId={chrome.pluginId}
          icon={chrome.icon}
          className="text-muted-foreground"
        />
        <p className="truncate text-sm font-semibold">{chrome.title}</p>
      </div>
    );
  }
  const current = breadcrumbs[breadcrumbs.length - 1]!;
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <div className="hidden min-w-0 @md/page-header:block">
        <AppBreadcrumbs
          breadcrumbs={breadcrumbs}
          usesDesktopChrome={usesDesktopChrome}
        />
      </div>
      <div className="min-w-0 @md/page-header:hidden">
        <AppBreadcrumbs
          breadcrumbs={[current]}
          usesDesktopChrome={usesDesktopChrome}
        />
      </div>
    </div>
  );
}

/**
 * Header actions for a plugin panel route: the registration's
 * `headerContent`, in its own boundary. Every panel uses this shared title bar
 * while its component owns the full-bleed body below.
 */
export function PluginPanelHeaderActions({
  panel,
  subPath,
}: {
  panel: PluginNavPanelSlot;
  subPath: string;
}) {
  const HeaderContent = panel.headerContent;
  if (HeaderContent === undefined) return null;
  return (
    <HeaderContentBoundary
      // Generation in the key: a P3.4 reload remounts the accessory with
      // fresh error-boundary state.
      key={`${panel.pluginId}/${panel.id}/${panel.generation}`}
      pluginId={panel.pluginId}
    >
      <PluginContext.Provider value={panel.pluginId}>
        {/* data-bb-plugin-root: the accessory is plugin code, so the
            plugin's @scope'd stylesheet must apply here too. */}
        <div
          data-bb-plugin-root=""
          data-bb-plugin={panel.pluginId}
          className="flex shrink-0 items-center gap-2"
        >
          <HeaderContent subPath={subPath} />
        </div>
      </PluginContext.Provider>
    </HeaderContentBoundary>
  );
}
