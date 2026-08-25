import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Cross-package parity guard.
 *
 * The landing demos mirror the real app's sidebar. Those structural values —
 * row height and the selected / hover tints — live in the app's own theme
 * (`apps/app/src/components/ui/theme.css`) and are copied, by value, into the
 * demo tokens in `landing.css`. A copy silently drifts: change the app's dark
 * selected tint and the demos keep the old one until someone re-measures.
 *
 * This test reads BOTH files and asserts the demo tokens still track the app's.
 * When the app changes one of these values, this fails in CI and forces the
 * demo to be re-synced — the demos stay 1:1 without being coupled at runtime.
 *
 * The guard covers only the token-derivable structural layer (heights, tints).
 * Conversation content and chrome text are curated fixtures by design and are
 * intentionally NOT asserted here.
 */

const landingDirectory = dirname(fileURLToPath(import.meta.url));
const demoCss = readFileSync(join(landingDirectory, "landing.css"), "utf8");

const APP_THEME_PATH = join(
  landingDirectory,
  "../../../app/src/components/ui/theme.css",
);
const appThemeCss = readFileSync(APP_THEME_PATH, "utf8");

/** The ink share (first percentage) of every `color-mix` a token is defined with. */
function inkPercentages(css: string, token: string): number[] {
  const re = new RegExp(
    `--${token}:\\s*color-mix\\([^;]*?(\\d+(?:\\.\\d+)?)%`,
    "g",
  );
  const out: number[] = [];
  for (let m = re.exec(css); m !== null; m = re.exec(css)) {
    out.push(Number.parseFloat(m[1]));
  }
  return out;
}

/** A `<n>rem` or `<n>px` token value, normalised to px (1rem = 16px). */
function lengthPx(css: string, token: string): number {
  const match = css.match(new RegExp(`--${token}:\\s*([\\d.]+)(rem|px)\\s*;`));
  if (match === null) {
    throw new Error(`Missing length token --${token}`);
  }
  const value = Number.parseFloat(match[1]);
  return match[2] === "rem" ? value * 16 : value;
}

describe("demo sidebar tracks the app's real values", () => {
  it("row height matches --bb-sidebar-row-height (h-7)", () => {
    // App: --bb-sidebar-row-height: 1.75rem (28px), the sidebar's h-7 rows.
    expect(lengthPx(demoCss, "thread-row-h")).toBe(
      lengthPx(appThemeCss, "bb-sidebar-row-height"),
    );
  });

  it("coarse-pointer row height matches --bb-sidebar-row-height-coarse", () => {
    expect(lengthPx(demoCss, "thread-row-h-coarse")).toBe(
      lengthPx(appThemeCss, "bb-sidebar-row-height-coarse"),
    );
  });

  it("selected tint tracks the app's --state-active in both themes", () => {
    const appPercentages = inkPercentages(appThemeCss, "state-active");
    const demoPercentages = inkPercentages(demoCss, "state-active");

    // The app defines it per theme; the demo must too (a light and a dark step).
    expect(new Set(demoPercentages).size).toBeGreaterThanOrEqual(2);
    // Every tint the demo uses must be one the app actually uses — so a demo
    // frozen on the light value while the app moved the dark one fails here.
    for (const percentage of demoPercentages) {
      expect(appPercentages).toContain(percentage);
    }
  });

  it("hover tint tracks the app's --sidebar-accent in both themes", () => {
    const appPercentages = inkPercentages(appThemeCss, "sidebar-accent");
    const demoPercentages = inkPercentages(demoCss, "sidebar-accent");

    expect(new Set(demoPercentages).size).toBeGreaterThanOrEqual(2);
    for (const percentage of demoPercentages) {
      expect(appPercentages).toContain(percentage);
    }
  });
});
