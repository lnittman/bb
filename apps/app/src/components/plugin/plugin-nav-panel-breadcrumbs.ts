import type {
  PluginNavPanelBreadcrumbSegment,
  PluginNavPanelRegistration,
} from "@get-bb/plugin-sdk";
import type { AppBreadcrumbSegment } from "@/components/layout/AppBreadcrumbs";
import { getPluginPanelRoutePath } from "@/lib/route-paths";

/** Deep trails stop reading as a place; the resolver is not trusted to cap. */
export const PLUGIN_NAV_PANEL_BREADCRUMB_MAX_SEGMENTS = 6;

interface ResolveArgs {
  pluginId: string;
  /** The panel's registered route segment (`PluginNavPanelRegistration.path`). */
  panelPath: string;
  subPath: string;
  resolver: NonNullable<PluginNavPanelRegistration["experimental_breadcrumbs"]>;
  /** Loaded label published for this route; replaces the final segment. */
  routeLabel: string | null;
}

/**
 * A segment `subPath` is panel-relative: `/`-separated segments the host
 * encodes one by one, `""` meaning the panel root. `.` and `..` survive
 * encoding and the browser would resolve them out of the panel, so a
 * destination that contains them is not inside the panel and is malformed.
 */
function isContainedSubPath(subPath: string): boolean {
  return subPath
    .split("/")
    .every((segment) => segment !== "." && segment !== "..");
}

/**
 * Copies one plugin-provided segment into host-owned plain data, or returns
 * null when it is not a segment. Runs inside the resolver boundary: property
 * reads on plugin objects can throw just like the resolver can.
 */
function copySegment(value: unknown): PluginNavPanelBreadcrumbSegment | null {
  if (typeof value !== "object" || value === null) return null;
  const { label, subPath } = value as { label?: unknown; subPath?: unknown };
  if (typeof label !== "string" || label.trim().length === 0) return null;
  if (subPath === undefined) return { label };
  if (typeof subPath !== "string" || !isContainedSubPath(subPath)) return null;
  return { label, subPath };
}

/**
 * Runs a nav panel's `experimental_breadcrumbs` resolver against the current
 * route and turns its plain data into host breadcrumbs. Plugin code runs in
 * host chrome here, so everything that touches plugin values (the call, the
 * array walk, every property read) sits inside one boundary and the result is
 * copied into host-owned data before use: a throw anywhere, a non-array, an
 * empty array, a malformed segment, a destination that leaves the panel, or an
 * over-long trail yields null and the caller falls back to the panel icon and
 * title. Ancestor segments link to their panel-relative `subPath` (the host
 * builds and encodes the route); the final segment is the current place and
 * stays passive, showing the loaded label when the panel has published a
 * non-blank one.
 */
export function resolvePluginNavPanelBreadcrumbs({
  pluginId,
  panelPath,
  subPath,
  resolver,
  routeLabel,
}: ResolveArgs): AppBreadcrumbSegment[] | null {
  let segments: PluginNavPanelBreadcrumbSegment[];
  try {
    const raw: unknown = resolver({ subPath });
    if (!Array.isArray(raw)) return null;
    // Empty is the resolver's own "no trail here"; anything else that fails
    // to copy is malformed.
    if (raw.length === 0) return null;
    if (raw.length > PLUGIN_NAV_PANEL_BREADCRUMB_MAX_SEGMENTS) {
      warn(
        pluginId,
        `returned ${raw.length} segments (max ${PLUGIN_NAV_PANEL_BREADCRUMB_MAX_SEGMENTS})`,
      );
      return null;
    }
    segments = [];
    for (const value of raw) {
      const segment = copySegment(value);
      if (segment === null) {
        warn(pluginId, "returned a segment the host cannot render");
        return null;
      }
      segments.push(segment);
    }
  } catch (error) {
    warn(
      pluginId,
      `threw: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
  const loadedLabel =
    routeLabel !== null && routeLabel.trim().length > 0 ? routeLabel : null;
  const last = segments.length - 1;
  return segments.map((segment, index) => {
    if (index === last) {
      return { label: loadedLabel ?? segment.label };
    }
    if (segment.subPath === undefined) return { label: segment.label };
    return {
      label: segment.label,
      to: getPluginPanelRoutePath({
        pluginId,
        path: panelPath,
        subPath: segment.subPath,
      }),
    };
  });
}

function warn(pluginId: string, detail: string): void {
  console.warn(
    `[plugin:${pluginId}] experimental_breadcrumbs ${detail}; falling back to the panel title`,
  );
}
