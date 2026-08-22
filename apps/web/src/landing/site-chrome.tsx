import {
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { DASHBOARD_PATH } from "../lib/connect-return-to";
import {
  DARK_SCHEME_QUERY,
  THEME_STORAGE_KEY,
  type ThemePreference,
  applyThemePreference,
  readThemePreference,
  setThemePreference,
} from "../lib/theme";
import { DiscordLink, DownloadLink, GitHubLink, XLink } from "./cta";

type SiteNavPage = "blog" | "changelog";

/* ── Theme ─────────────────────────────────────────────────────────
   The preference model itself lives in lib/theme.ts, shared with the
   pre-paint script in __root.tsx so there is one implementation of the rule.
   This file only owns the control. */

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: IconSvgElement;
}> = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "System", icon: ComputerIcon },
];

// A three-way segmented switch: Light / Dark / System, side by side, with
// the active segment carrying a filled thumb. It replaces a button-plus-menu
// because the choice is three items — a dropdown to reveal three glyphs
// costs a click and a dismissal for nothing — and because it lives in the
// footer now, where a popover would open off the bottom of the page.
//
// All three segments render on the server with no active state; the effect
// below fills one in after mount. SSR output is therefore preference-
// independent and hydration cannot mismatch.
function ThemeSwitch() {
  const [preference, setPreference] = useState<ThemePreference | null>(null);

  // Follow the OS while the preference is "system" (live, not just at load),
  // and pick up a choice made in another tab.
  useEffect(() => {
    const media = matchMedia(DARK_SCHEME_QUERY);
    const sync = () => {
      const next = readThemePreference();
      setPreference(next);
      applyThemePreference(next);
    };
    // THEME_INIT normally does this pre-paint, but it gives up when storage
    // access throws, which would otherwise leave the page light while this
    // control reported "System".
    sync();
    const onScheme = () => {
      if (readThemePreference() === "system") applyThemePreference("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) sync();
    };
    media.addEventListener("change", onScheme);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onScheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // A same-tab write fires no storage event, so this tab's copy is set here.
  const choose = (next: ThemePreference) => {
    setThemePreference(next);
    setPreference(next);
  };

  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={
            preference === option.value ? "theme-seg on" : "theme-seg"
          }
          aria-pressed={preference === option.value}
          title={option.label}
          onClick={() => choose(option.value)}
        >
          <HugeiconsIcon icon={option.icon} className="theme-seg-ic" />
          <span className="sr-only">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export function SiteNav({ current }: { current?: SiteNavPage }) {
  return (
    <nav className="nav">
      {/* One element; landing.css picks the asset off html.dark, so only the
          variant in use is ever downloaded (see .bb-mark). */}
      {/* On the landing page itself this is already home, so it returns to
          the top instead of reloading the document. Everywhere else it is a
          plain link, so middle-click and open-in-new-tab still work. */}
      <a
        className="logo"
        href="/"
        aria-label="bb"
        onClick={(event) => {
          if (
            current !== undefined ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.button !== 0
          ) {
            return;
          }
          event.preventDefault();
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
          });
        }}
      >
        <span className="bb-mark logo-mark" />
      </a>
      <div className="nav-links">
        <a
          className={current === "blog" ? "nav-current" : undefined}
          href="/blog"
        >
          Blog
        </a>
        <a
          className={current === "changelog" ? "nav-current" : undefined}
          href="/changelog"
        >
          Changelog
        </a>
        <GitHubLink placement="nav">GitHub</GitHubLink>
        <a href={DASHBOARD_PATH}>Sign in</a>
        {/* Theme control sits before the CTA so the nav ends on the primary
            action. */}
          <DownloadLink placement="nav" className="btn btn-primary btn-sm">
          Download for macOS
        </DownloadLink>
      </div>
    </nav>
  );
}

/**
 * Seven links used to sit on one line separated by middots, which made the
 * footer a run-on sentence and gave every link a 17px-tall hit area — under
 * any touch target worth the name. Grouping them into named columns is what
 * lets each one become a real 28px row, and the group headings tell a reader
 * scanning for "privacy" or "discord" where to look instead of making them
 * read the whole string.
 *
 * The type is monospace and uppercase here and nowhere else on the page. The
 * footer is the one place that is pure index — no argument, no product, just
 * addresses — and giving it a different voice from the body copy above marks
 * the end of the page more clearly than a rule would.
 */
function FooterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="footer-group">
      <h2>{title}</h2>
      <ul>{children}</ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-top">
      <nav className="footer-groups" aria-label="Footer">
        <FooterGroup title="Product">
          <li>
            <DownloadLink placement="footer">Download</DownloadLink>
          </li>
          <li>
            <a href="/changelog">Changelog</a>
          </li>
        </FooterGroup>
        <FooterGroup title="Community">
          <li>
            <GitHubLink placement="footer">GitHub</GitHubLink>
          </li>
          <li>
            <XLink placement="footer">X</XLink>
          </li>
          <li>
            <DiscordLink placement="footer">Discord</DiscordLink>
          </li>
        </FooterGroup>
        <FooterGroup title="More">
          <li>
            <a href="/blog">Blog</a>
          </li>
          <li>
            <a href="/privacy">Privacy</a>
          </li>
        </FooterGroup>
      </nav>
        {/* bb-icon-dark.png rather than bb-icon.png: the light file has the
            rounded app-icon tile painted into the artwork, the dark one is the
            bare letterform. It is used as a mask rather than an image, so the
            mark takes the theme's own ink instead of shipping a second file
            and instead of being a cream glyph that vanishes on white. */}
        <span className="footer-mark" aria-hidden />
      </div>
      <div className="footer-base">
        <span>bb is free and open source (MIT)</span>
        <ThemeSwitch />
      </div>
    </footer>
  );
}
