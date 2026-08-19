import {
  ArrowDown01Icon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowMoveDownLeftIcon,
  ArrowRight01Icon,
  AttachmentIcon,
  BubbleChatAddIcon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  FolderGitTwoIcon,
  FolderIcon as HiFolderIcon,
  GitBranchIcon as HiGitBranchIcon,
  GitMergeIcon as HiGitMergeIcon,
  LaptopIcon as HiLaptopIcon,
  Loading03Icon,
  MessageQuestionIcon,
  Mic02Icon,
  MoreHorizontalIcon,
  PlusMinusSquare01Icon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  SidebarLeftIcon,
  SidebarRightIcon,
  Tick02Icon,
  ToolboxIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { TextMorph } from "torph/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import changelogMd from "../../../../CHANGELOG.md?raw";
import { initAnalytics, trackLandingEvent } from "../landing/analytics";
import GITHUB_STATS from "../landing/github-stats.json";
import PR_FEED from "../landing/pr-feed.json";

// Baked 64px contributor avatars (see scripts/refresh-github-stats.mjs's
// sibling flow) — build-time faces, no runtime GitHub calls.
const CONTRIBUTOR_AVATARS = import.meta.glob(
  "../assets/contributors/*.webp",
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;
import blackstoneLogo from "../assets/company-logos/blackstone.png";
import datadogLogo from "../assets/company-logos/datadog.svg";
import figmaLogo from "../assets/company-logos/figma.svg";
import metaLogo from "../assets/company-logos/meta.svg";
import moodysLogo from "../assets/company-logos/moodys.png";
import notionLogo from "../assets/company-logos/notion.png";
import ownerLogo from "../assets/company-logos/owner.png";
import pendoLogo from "../assets/company-logos/pendo.svg";
import renderLogo from "../assets/company-logos/render.svg";
import shortcutLogo from "../assets/company-logos/shortcut.svg";
import simileLogo from "../assets/company-logos/simile.svg";
import bbIconLarge from "../assets/bb-icon.png";
import hermesAvatar from "../assets/hermes-avatar.jpg";
import vscodeIcon from "../assets/vscode.png";
import { RELEASE_META, parseChangelog } from "../landing/changelog";
import {
  DiscordLink,
  DownloadLink,
  EmailSignup,
  GitHubLink,
  ProductHuntCallout,
} from "../landing/cta";
import { SiteFooter, SiteNav } from "../landing/site-chrome";
import {
  ClaudeIcon,
  CursorIcon,
  GrokIcon,
  HermesAgentIcon,
  OmpIcon,
  OpenAiIcon,
  OpencodeIcon,
  PiIcon,
} from "../landing/icons";
import type { CtaPlacement } from "../landing/site";
import {
  CLI_COMMAND,
  OG_DESCRIPTION,
  PRODUCT_HUNT_LAUNCH_ACTIVE,
  SITE_DESCRIPTION,
  SITE_TITLE,
  unfurlMeta,
} from "../landing/site";
import interWoff2 from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import landingCss from "../landing/landing.css?url";

const COMPANY_PROOF = [
  ["Meta", metaLogo],
  ["Figma", figmaLogo],
  ["Notion", notionLogo],
  ["Datadog", datadogLogo],
  ["Owner.com", ownerLogo],
  ["Pendo", pendoLogo],
  ["Blackstone", blackstoneLogo],
  ["Moody's", moodysLogo],
  ["Shortcut", shortcutLogo],
  ["Render", renderLogo],
  ["Simile", simileLogo],
] as const;

function CompanyProofLogos({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul className="company-proof-logos" aria-hidden={duplicate || undefined}>
      {COMPANY_PROOF.map(([name, logo]) => (
        <li key={name} className="company-proof-company">
          <img src={logo} alt={duplicate ? "" : name} width={20} height={20} />
          <span aria-hidden="true">{name}</span>
        </li>
      ))}
    </ul>
  );
}

const [LATEST_RELEASE] = parseChangelog(changelogMd);
if (!LATEST_RELEASE) {
  throw new Error("CHANGELOG.md must contain at least one release");
}
const LATEST_RELEASE_META = RELEASE_META[LATEST_RELEASE.version];
if (!LATEST_RELEASE_META) {
  throw new Error(
    `Latest release ${LATEST_RELEASE.version} must have presentation metadata`,
  );
}
const LATEST_RELEASE_URL = `/changelog#${LATEST_RELEASE.version.replaceAll(".", "-")}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      // Unfurl title is just "bb": the card image already carries the
      // tagline, and platforms print the title right next to the image.
      ...unfurlMeta("bb", OG_DESCRIPTION, "/"),
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      {
        rel: "preload",
        href: interWoff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: landingCss },
    ],
  }),
  component: LandingRoute,
});

function LandingRoute() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return <LandingPage />;
}

// Filled (solid) variant of the Hugeicons apple — same silhouette as their
// stroke AppleIcon, but rendered as a fill so the macOS CTA reads as a solid
// glyph (the free icon set ships outline variants only).
const AppleSolidIcon: IconSvgElement = [
  [
    "path",
    {
      d: "M12 5.75C12 3.75 13.5 1.75 15.5 1.75C15.5 3.75 14 5.75 12 5.75Z",
      fill: "currentColor",
      key: "0",
    },
  ],
  [
    "path",
    {
      d: "M12.5 8.09001C11.9851 8.09001 11.5867 7.92646 11.1414 7.74368C10.5776 7.51225 9.93875 7.25 8.89334 7.25C7.02235 7.25 4 8.74945 4 12.7495C4 17.4016 7.10471 22.25 9.10471 22.25C9.77426 22.25 10.3775 21.9871 10.954 21.7359C11.4815 21.5059 11.9868 21.2857 12.5 21.2857C13.0132 21.2857 13.5185 21.5059 14.046 21.7359C14.6225 21.9871 15.2257 22.25 15.8953 22.25C17.2879 22.25 18.9573 19.8992 20 16.9008C18.3793 16.2202 17.338 14.618 17.338 12.75C17.338 11.121 18.2036 10.0398 19.5 9.25C18.5 7.75 17.0134 7.25 15.9447 7.25C14.8993 7.25 14.2604 7.51225 13.6966 7.74368C13.2514 7.92646 13.0149 8.09001 12.5 8.09001Z",
      fill: "currentColor",
      key: "1",
    },
  ],
];

/* ── CTAs ─────────────────────────────────────────────────────────── */

// The browser install path, rendered as an outline button whose body is the
// run command. Clicking anywhere copies it (there's no hosted URL to open —
// the command starts bb locally and opens it in the browser).
function RunCommandButton({ placement }: { placement: CtaPlacement }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    // Track and show feedback first; the clipboard write can reject (no user
    // activation, permissions) and must not swallow the event.
    trackLandingEvent({
      name: "landing_cli_command_copied",
      properties: { placement, command: CLI_COMMAND },
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    navigator.clipboard.writeText(CLI_COMMAND).catch(() => {});
  };
  return (
    <button
      type="button"
      className={
        copied
          ? "btn btn-ghost btn-install cmd-btn copied"
          : "btn btn-ghost btn-install cmd-btn"
      }
      onClick={copy}
      aria-label={`Copy browser install command: ${CLI_COMMAND}`}
    >
      <span className="cmd-dollar">$</span>
      <span className="cmd-text">{CLI_COMMAND}</span>
      <span className="cmd-copy">
        <span className="cmd-swap">
          <CopyGlyph className={copied ? "cmd-glyph-out" : "cmd-glyph-in"} />
          <CheckGlyph className={copied ? "cmd-glyph-in" : "cmd-glyph-out"} />
        </span>
      </span>
    </button>
  );
}

function InstallOptions({ placement }: { placement: CtaPlacement }) {
  return (
    <div className="install-options">
      <div className="install-actions">
        <span className="install-choice install-choice--mac">
          <DownloadLink
            placement={placement}
            className="btn btn-primary btn-install"
          >
            <HugeiconsIcon icon={AppleSolidIcon} className="btn-ic" />
            Download for macOS
          </DownloadLink>
          <span className="install-note">One-click, no terminal</span>
        </span>
        <span className="install-choice install-choice--cli">
          <RunCommandButton placement={placement} />
          <span className="install-note">
            Windows (via WSL), Linux &amp; remote machines
          </span>
        </span>
      </div>
    </div>
  );
}

/** The app mock plays its assembly entrance once, shortly after hydration.
 *  Rendering law: the finished mock is the resting DOM state — prerender, no-JS,
 *  reduced motion, and any capture taken before or after the entrance all show
 *  the complete app. The animation only ever adds motion on top; nothing is
 *  held invisible waiting for a scroll event. After the entrance the class
 *  swaps to `.constructed` so later re-renders (switching threads, opening the
 *  diff) don't replay it. */
function useConstructMock() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const mock = document.querySelector("[data-construct]");
    if (!mock || mock.classList.contains("constructed")) {
      return;
    }
    let settle = 0;
    const start = window.setTimeout(() => {
      mock.classList.add("constructing");
      settle = window.setTimeout(() => {
        mock.classList.remove("constructing");
        mock.classList.add("constructed");
      }, 1800);
    }, 150);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(settle);
    };
  }, []);
}

/** Scale the desktop app mock for narrow viewports. Below the mobile breakpoint
 *  the mock keeps its full desktop layout and is shrunk with `zoom` so a fixed
 *  left slice of the app (`--mock-visible-width`) fills the available width; the
 *  rest bleeds off the right edge, clipped by `.mockup-wrap`'s overflow. This
 *  stays legible instead of shrinking the whole app to fit. `--mock-visible-width`
 *  is defined only inside that breakpoint, so above it the variable is unset and
 *  the mock renders unscaled at its natural width. */
function useFitMock() {
  useEffect(() => {
    const mock = document.querySelector<HTMLElement>(".mock");
    const wrap = mock?.parentElement;
    if (!mock || !wrap) {
      return;
    }
    const fit = () => {
      const wrapStyle = getComputedStyle(wrap);
      const visibleWidth = Number.parseFloat(
        getComputedStyle(mock).getPropertyValue("--mock-visible-width"),
      );
      if (!visibleWidth) {
        // Desktop layout (variable unset above the breakpoint): no scaling.
        mock.style.removeProperty("--mock-scale");
        return;
      }
      // The card is inset by the wrap's side padding (its left gutter holds the
      // drop shadow), so its on-screen width is the content box — clientWidth
      // minus the padding — not clientWidth itself.
      const slice =
        wrap.clientWidth -
        Number.parseFloat(wrapStyle.paddingLeft) -
        Number.parseFloat(wrapStyle.paddingRight);
      mock.style.setProperty("--mock-scale", String(slice / visibleWidth));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);
}

/* ── Shared bits ──────────────────────────────────────────────────── */

const PROVIDER_ICONS = [
  ClaudeIcon,
  OpenAiIcon,
  CursorIcon,
  PiIcon,
  OpencodeIcon,
  GrokIcon,
  OmpIcon,
  HermesAgentIcon,
] as const;

/** How many provider logos stay visible on narrow screens before "+N more". */
const PROVIDER_ICONS_MOBILE_VISIBLE = 3;

function ProviderChips() {
  const extra = PROVIDER_ICONS.length - PROVIDER_ICONS_MOBILE_VISIBLE;
  return (
    <>
      {PROVIDER_ICONS.map((Icon, i) => (
        <Icon
          key={i}
          className={
            i >= PROVIDER_ICONS_MOBILE_VISIBLE ? "plogo plogo-more" : "plogo"
          }
        />
      ))}
      {extra > 0 ? (
        <span className="pmore" aria-label={`${extra} more providers`}>
          +{extra} more
        </span>
      ) : null}
    </>
  );
}

/* ── Hero: interactive bb app mock ────────────────────────────────── */
// A faithful recreation of the bb app: icon rail + thread sidebar + a markdown
// conversation + the real composer (PR/diff bar, model picker, worktree row).
// Clicking a thread in the sidebar swaps the conversation and composer.

type IconProps = { className?: string };

// Real bb app icons (Hugeicons), matched to the app's own Icon map in
// apps/app/src/components/ui/icon.tsx — same glyphs the desktop app renders.
const PanelIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={SidebarLeftIcon} className={className} />
);
const PanelRightIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={SidebarRightIcon} className={className} />
);
const ChevronLeft = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ArrowLeft01Icon} className={className} />
);
const ChevronRight = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ArrowRight01Icon} className={className} />
);
const ChevronDown = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ArrowDown01Icon} className={className} />
);
const Ellipsis = ({ className }: IconProps) => (
  <HugeiconsIcon icon={MoreHorizontalIcon} className={className} />
);
const NewThreadIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={BubbleChatAddIcon} className={className} />
);
const ClockIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={Clock01Icon} className={className} />
);
const SearchGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={Search01Icon} className={className} />
);
const ToolboxGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ToolboxIcon} className={className} />
);
const ChecklistGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={CheckListIcon} className={className} />
);
const GearIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={Settings01Icon} className={className} />
);
const CheckIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={Tick02Icon} className={className} />
);
// Sidebar thread-status glyphs, matching the real app's muted glyphs
// (CheckmarkCircle02 for done, MessageQuestion for needs-input).
const CircleCheckIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={CheckmarkCircle02Icon} className={className} />
);
const MessageQuestionGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={MessageQuestionIcon} className={className} />
);
const PaperPlane = ({ className }: IconProps) => (
  <HugeiconsIcon icon={SentIcon} className={className} />
);
const Paperclip = ({ className }: IconProps) => (
  <HugeiconsIcon icon={AttachmentIcon} className={className} />
);
const FolderIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={HiFolderIcon} className={className} />
);
const FolderGitIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={FolderGitTwoIcon} className={className} />
);
const GitBranchIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={HiGitBranchIcon} className={className} />
);
const GitMergeIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={HiGitMergeIcon} className={className} />
);
const Spinner = ({ className }: IconProps) => (
  <HugeiconsIcon icon={Loading03Icon} className={className} />
);
// Copy and check, drawn at the same stroke weight so they swap cleanly in
// place (see .cmd-swap).
const CopyGlyph = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="12" height="12" rx="3" />
    <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
  </svg>
);

const CheckGlyph = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12.8 9.4 17 19 7.2" />
  </svg>
);

// A shell prompt in a window, drawn to match the Hugeicons stroke weight the
// rest of the mock uses (the free set has no terminal glyph).
const TerminalGlyph = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2.5" y="4.5" width="19" height="15" rx="3.2" />
    <path d="M7.2 10 10 12.4l-2.8 2.4" />
    <path d="M12.8 15h4.2" />
  </svg>
);
const Maximize2 = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ArrowExpand01Icon} className={className} />
);
const MicIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={Mic02Icon} className={className} />
);
const SendIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ArrowMoveDownLeftIcon} className={className} />
);
const LaptopGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={HiLaptopIcon} className={className} />
);
const FileDiffIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={PlusMinusSquare01Icon} className={className} />
);

type Status = "running" | "done" | "waiting";
type Step =
  | { kind: "user"; text: string }
  | { kind: "step"; text: ReactNode }
  | { kind: "say"; text: ReactNode }
  // A "spawn" step prints a tool line in the feed and, the first time it
  // streams in, adds a nested child thread to the sidebar (like the real app).
  | { kind: "spawn"; text: ReactNode; child: MockThread };
type Ask = {
  question: string;
  options: { label: string; description: string }[];
  selected: number;
};
type MockThread = {
  id: string;
  title: string;
  status: Status;
  branch: string;
  pr?: number;
  change: { files: number; add: number; del: number };
  transcript: Step[];
  /** Endlessly-cycled work a running thread streams in after its transcript. */
  stream?: Step[];
  /** A pending AskUserQuestion that replaces the prompt box (like the app). */
  ask?: Ask;
};

// The subagent the Sentry thread spawns mid-run. It lands as a nested child row
// in the sidebar and, if opened, streams its own work like any running thread.
const SENTRY_SUBAGENT: MockThread = {
  id: "sentry-sub",
  title: "Reproduce the null cart",
  status: "running",
  branch: "bb/triage-sentry-spike",
  change: { files: 1, add: 14, del: 0 },
  transcript: [
    { kind: "user", text: "Reproduce the null cart in applyPromo." },
    { kind: "step", text: "Read src/checkout/applyPromo.ts" },
  ],
  stream: [
    { kind: "step", text: "Built an empty-cart fixture" },
    {
      kind: "say",
      text: (
        <>
          An active promo on an empty <code>cart</code> throws. Reproduced.
        </>
      ),
    },
    { kind: "step", text: "Wrote a failing test" },
    { kind: "say", text: "Handed the repro back to the parent thread." },
    { kind: "step", text: "Re-checked the stack trace" },
  ],
};

// Endless "work" each running thread streams in after its transcript. The pool
// loops, so a glance at the hero always shows tool calls and messages arriving.
const SENTRY_STREAM: Step[] = [
  { kind: "step", text: "Ran 48 tests" },
  {
    kind: "say",
    text: (
      <>
        All green. The null <code>cart</code> path is covered now.
      </>
    ),
  },
  {
    kind: "spawn",
    text: (
      <>
        Spawned a subagent: <strong>Reproduce the null cart</strong>
      </>
    ),
    child: SENTRY_SUBAGENT,
  },
  { kind: "step", text: "Edited promo.test.ts" },
  { kind: "say", text: "Added a case for an empty cart with an active promo." },
  { kind: "step", text: "Checked Sentry for new events" },
  { kind: "say", text: "No new occurrences in the last 10 minutes." },
  { kind: "step", text: "Read applyPromo.ts" },
  {
    kind: "say",
    text: (
      <>
        Tightening the type so <code>cart</code> can't be null at the call site.
      </>
    ),
  },
  { kind: "step", text: "Edited 2 files" },
  {
    kind: "say",
    text: "Pushed the guard and a follow-up. Re-running the suite.",
  },
];

const LIN482_STREAM: Step[] = [
  { kind: "step", text: "Ran 12 tests" },
  { kind: "say", text: "Debounce holds for 200ms. One call, asserted." },
  {
    kind: "step",
    text: (
      <>
        Edited <code>SearchBar.tsx</code>
      </>
    ),
  },
  { kind: "say", text: "Cancelling the timer on unmount so there's no leak." },
  { kind: "step", text: "Checked the other call sites" },
  {
    kind: "say",
    text: "Two more inputs could reuse this. Noted it on LIN-482.",
  },
  { kind: "step", text: "Edited 1 file" },
  { kind: "say", text: "Verifying the debounce once more." },
];

const CHIEF_STREAM: Step[] = [
  { kind: "step", text: "Swept 4 active threads" },
  {
    kind: "say",
    text: "Sentry triage is re-running tests; LIN-482 is verifying.",
  },
  { kind: "step", text: "Checked for blockers" },
  {
    kind: "say",
    text: (
      <>
        One thread is waiting on you: <code>Refactor the timeline cache</code>.
      </>
    ),
  },
  { kind: "step", text: "Spawned 1 worker" },
  {
    kind: "say",
    text: "Dispatched the review-panel follow-up. Nothing else needs you.",
  },
];

const HERO_THREADS: MockThread[] = [
  {
    id: "sentry",
    title: "Triage the Sentry spike",
    status: "running",
    branch: "bb/triage-sentry-spike",
    change: { files: 6, add: 124, del: 18 },
    stream: SENTRY_STREAM,
    transcript: [
      { kind: "user", text: "Triage the Sentry spike on checkout." },
      { kind: "step", text: "Explored 4 files" },
      {
        kind: "say",
        text: (
          <>
            The spike is one error. 92% of volume: a null <code>cart</code> in{" "}
            <code>applyPromo</code>.
          </>
        ),
      },
      { kind: "step", text: "Edited 2 files" },
      {
        kind: "say",
        text: (
          <>
            Guarded the null case and added a regression test in{" "}
            <code>promo.test.ts</code>. Re-running the suite.
          </>
        ),
      },
    ],
  },
  {
    id: "review-panel",
    title: "Add a review queue panel",
    status: "done",
    branch: "bb/review-queue-plugin",
    change: { files: 5, add: 214, del: 0 },
    transcript: [
      {
        kind: "user",
        text: "Add a review-queue panel: every thread waiting on me, one list.",
      },
      { kind: "step", text: "Scaffolded the plugin" },
      {
        kind: "say",
        text: "Built the panel: threads that are waiting on you, oldest first.",
      },
      { kind: "step", text: "Registered the CLI" },
      {
        kind: "say",
        text: (
          <>
            <code>bb review</code> lists the queue from any shell. Wrote the
            skill so every agent knows to use it.
          </>
        ),
      },
      {
        kind: "say",
        text: "The panel is live in your sidebar. bb building bb.",
      },
    ],
  },
  {
    id: "timeline",
    title: "Refactor the timeline cache",
    status: "waiting",
    branch: "bb/timeline-cache",
    change: { files: 3, add: 41, del: 67 },
    transcript: [
      {
        kind: "user",
        text: "Refactor the timeline cache to drop the duplicate fetch.",
      },
      { kind: "step", text: "Explored 3 files" },
      { kind: "say", text: "Found the duplicate fetch. Two ways to fix it." },
    ],
    ask: {
      question: "How should I dedupe the timeline fetch?",
      options: [
        {
          label: "Shared in-flight promise",
          description: "One request in flight; everyone awaits it. Simplest.",
        },
        {
          label: "Short TTL cache",
          description: "Cache the result for a few seconds, then refetch.",
        },
      ],
      selected: 0,
    },
  },
  {
    id: "lin482",
    title: "Start on LIN-482",
    status: "running",
    branch: "bb/lin-482-debounce-search",
    change: { files: 2, add: 33, del: 5 },
    stream: LIN482_STREAM,
    transcript: [
      { kind: "step", text: "Read LIN-482" },
      {
        kind: "say",
        text: (
          <>
            “Debounce the search input.” Adding a 200ms debounce in{" "}
            <code>SearchBar</code>.
          </>
        ),
      },
      { kind: "step", text: "Edited 1 file" },
      { kind: "say", text: "Added the debounce and a test. Verifying." },
    ],
  },
];

// The pinned dispatcher thread, kept out of "All Threads".
const CHIEF: MockThread = {
  id: "chief",
  title: "Chief",
  status: "running",
  branch: "bb/chief",
  change: { files: 1, add: 12, del: 0 },
  stream: CHIEF_STREAM,
  transcript: [
    { kind: "user", text: "Anything need me?" },
    { kind: "step", text: "Swept 4 active threads" },
    {
      kind: "say",
      text: (
        <>
          One thread is waiting on you: <code>Refactor the timeline cache</code>
          . Sentry triage and LIN-482 are running; the nightly changelog merged.
        </>
      ),
    },
    { kind: "step", text: "Spawned 2 workers" },
    {
      kind: "say",
      text: "I'll keep dispatching and ping you when something needs a call.",
    },
  ],
};

function ThreadStatus({ status }: { status: Status }) {
  return (
    <span className="tstatus" aria-hidden>
      {status === "running" ? <Spinner className="trun" /> : null}
      {status === "done" ? <CircleCheckIcon className="tdone" /> : null}
      {status === "waiting" ? <MessageQuestionGlyph className="twait" /> : null}
    </span>
  );
}

// Cadence + rolling-window size for a running thread's live feed. The window is
// generously larger than what fits, so the oldest rows are dropped well above
// the (clipped) top edge and never cause a visible jump.
const STREAM_INTERVAL_MS = 2200;
const STREAM_WINDOW = 16;

type FeedItem = { id: string; step: Step; live: boolean };

/** The conversation pane. A running thread streams tool calls and messages in
 *  endlessly after its seed transcript; everything else renders statically.
 *  The first time a `spawn` step streams in, it calls `onSpawn` so the sidebar
 *  can add the nested child thread. Reduced-motion and no-JS render the seed. */
function ThreadFeed({
  thread,
  onSpawn,
}: {
  thread: MockThread;
  onSpawn: (parentId: string, child: MockThread) => void;
}) {
  const isLive =
    thread.status === "running" && (thread.stream?.length ?? 0) > 0;
  const seedItems = useMemo<FeedItem[]>(
    () =>
      thread.transcript.map((step, i) => ({
        id: `seed-${i}`,
        step,
        live: false,
      })),
    [thread.transcript],
  );
  // ThreadFeed is keyed by thread id, so switching threads remounts it and
  // resets the stream — no in-effect reset needed.
  const [items, setItems] = useState<FeedItem[]>(seedItems);

  useEffect(() => {
    if (!isLive) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const pool = thread.stream ?? [];
    let cursor = 0;
    let serial = 0;
    const id = window.setInterval(() => {
      const step = pool[cursor % pool.length];
      cursor += 1;
      serial += 1;
      if (step.kind === "spawn") {
        onSpawn(thread.id, step.child);
      }
      setItems((prev) => {
        const next = [...prev, { id: `live-${serial}`, step, live: true }];
        return next.length > STREAM_WINDOW
          ? next.slice(next.length - STREAM_WINDOW)
          : next;
      });
    }, STREAM_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [thread.id, isLive, thread.stream, onSpawn]);

  return (
    <div className={isLive ? "feed feed-live" : "feed"}>
      {items.map(({ id, step, live }, index) => {
        // Live rows ease in as they arrive; seed rows keep the construct cascade.
        const style: CSSProperties = live
          ? { animation: "c-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }
          : { animationDelay: `${0.66 + index * 0.09}s` };
        if (step.kind === "user") {
          return (
            <div key={id} className="msg-user" style={style}>
              {step.text}
            </div>
          );
        }
        if (step.kind === "step") {
          return (
            <div key={id} className="msg-step" style={style}>
              <ChevronRight className="step-chev" />
              {step.text}
            </div>
          );
        }
        if (step.kind === "spawn") {
          return (
            <div key={id} className="msg-step msg-spawn" style={style}>
              <GitBranchIcon className="step-chev" />
              {step.text}
            </div>
          );
        }
        return (
          <div key={id} className="msg-say" style={style}>
            {step.text}
          </div>
        );
      })}
    </div>
  );
}

// The AskUserQuestion tool. Like the app, it REPLACES the prompt box: a
// recessed card in the composer slot with the prompt, single-select option
// rows, and Cancel / Submit answer actions.
function AskQuestion({ ask }: { ask: Ask }) {
  const [selected, setSelected] = useState(ask.selected);
  return (
    <div className="composer">
      <div className="askq">
        <div className="askq-q">{ask.question}</div>
        <div className="askq-opts">
          {ask.options.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              className={i === selected ? "askq-opt on" : "askq-opt"}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              <span className="askq-radio">
                {i === selected ? <CheckIcon className="askq-check" /> : null}
              </span>
              <span className="askq-text">
                <span className="askq-label">{opt.label}</span>
                <span className="askq-desc">{opt.description}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="askq-actions">
          <span className="askq-cancel">Cancel</span>
          <span className="askq-submit">Submit answer</span>
        </div>
      </div>
    </div>
  );
}

type DiffLine = { t: "ctx" | "add" | "del"; text: string };
const DIFF_LINES: DiffLine[] = [
  { t: "ctx", text: 'it("applies a valid promo", () => {' },
  { t: "ctx", text: "  const cart = makeCart([item]);" },
  { t: "del", text: '  expect(applyPromo(cart, "SAVE10"))' },
  { t: "add", text: '  expect(applyPromo(cart, "SAVE10").total)' },
  { t: "add", text: "    .toBeCloseTo(8.99);" },
  { t: "ctx", text: "});" },
  { t: "ctx", text: "" },
  { t: "add", text: 'it("ignores a null cart", () => {' },
  { t: "add", text: '  expect(() => applyPromo(null, "SAVE10"))' },
  { t: "add", text: "    .not.toThrow();" },
  { t: "add", text: "});" },
];

// The prompt box — used for follow-ups (with a thread) and the new-thread page
// (no thread). Carries the full button set: expand, model picker, attach, mic,
// send, plus the project / environment / branch / permission context row.
function Composer({ thread }: { thread?: MockThread }) {
  const isNew = !thread;
  return (
    <div className={isNew ? "composer composer-new" : "composer"}>
      {thread ? (
        <div className="pr-bar">
          <GitMergeIcon className="pr-ic" />
          <span className="pr-strong">
            {thread.pr ? `PR #${thread.pr}` : "Working tree"}
          </span>
          <span className="pr-dim">
            · {thread.pr ? "Merged" : "Uncommitted"} · {thread.change.files}{" "}
            {thread.change.files === 1 ? "file" : "files"},
          </span>
          <span className="pr-add">+{thread.change.add}</span>
          <span className="pr-del">-{thread.change.del}</span>
          <ChevronDown className="pr-ic pr-chev" />
        </div>
      ) : null}
      <div className="composer-box">
        <div className="composer-top">
          <textarea
            className="composer-input"
            rows={1}
            placeholder={
              isNew
                ? "Ask anything. @ to mention files or folders"
                : "Ask for a follow-up. @ to mention files, folders, sections, or threads"
            }
            aria-label={isNew ? "Start a new thread" : "Message this thread"}
          />
          <Maximize2 className="cb-expand" />
        </div>
        <div className="composer-row">
          <span className="model">
            <ClaudeIcon className="model-ic" />
            Opus 4.8 1M
            <ChevronDown className="chev-sm" />
          </span>
          <span className="composer-actions" aria-hidden>
            <Paperclip className="composer-clip" />
            <MicIcon className="composer-clip" />
            <span className="send-btn">
              <SendIcon className="send-ic" />
            </span>
          </span>
        </div>
      </div>
      <div className="context-row">
        <span className="ctx">
          <FolderIcon className="ctx-ic" />
          <span>{isNew ? "storefront" : "bb"}</span>
          <ChevronDown className="ctx-chev" />
        </span>
        <span className="ctx">
          {isNew ? (
            <LaptopGlyph className="ctx-ic" />
          ) : (
            <FolderGitIcon className="ctx-ic" />
          )}
          <span>{isNew ? "Work locally" : "Worktree"}</span>
          <ChevronDown className="ctx-chev" />
        </span>
        <span className="ctx">
          <GitBranchIcon className="ctx-ic" />
          <span className="ctx-branch">
            {isNew ? "Current (main)" : thread.branch}
          </span>
          <ChevronDown className="ctx-chev" />
        </span>
        <span className="ctx-perm">
          Full Access
          <ChevronDown className="ctx-chev" />
        </span>
        {thread && thread.status === "running" ? (
          <Spinner className="ctx-spin" />
        ) : null}
      </div>
    </div>
  );
}

// The diff / secondary panel that opens on the right.
function DiffPanel({
  thread,
  onClose,
}: {
  thread: MockThread;
  onClose: () => void;
}) {
  return (
    <aside className="diff-panel" aria-label="Changes">
      <div className="diff-head">
        <FileDiffIcon className="diff-ic" />
        <span className="diff-title">Changes</span>
        <span className="diff-stat pr-add">+{thread.change.add}</span>
        <span className="diff-stat pr-del">-{thread.change.del}</span>
        <button
          type="button"
          className="diff-close"
          aria-label="Hide changes"
          onClick={onClose}
        >
          <PanelRightIcon className="ri" />
        </button>
      </div>
      <div className="diff-file">
        <FolderGitIcon className="diff-file-ic" />
        promo.test.ts
      </div>
      <div className="diff-body">
        {DIFF_LINES.map((line, i) => (
          <div key={i} className={`dl dl-${line.t}`}>
            <span className="dl-sign">
              {line.t === "add" ? "+" : line.t === "del" ? "-" : " "}
            </span>
            <span className="dl-text">{line.text || " "}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ────────────────────────────────────────────────
 * HERO STORYBOARD
 *
 * Read top-to-bottom. Times are ms after the mock scrolls into view.
 *
 *      0ms   window frame draws (useConstructMock adds .constructing)
 *  ~200ms   title bar, sidebar rows, feed, composer cascade in
 *  1800ms   construct class swaps to .constructed
 *  2400ms   on wide screens the Changes pane slides in, completing
 *            the three-pane set piece; the active thread keeps
 *            streaming work so the hero never rests on a dead frame
 * ──────────────────────────────────────────────── */
const HERO_TIMING = {
  diffJoins: 1100, // ms until the Changes pane slides into the entrance
};
/** The set piece opens all three panes only where they fit. */
const HERO_DIFF_MIN_WIDTH = "(min-width: 1100px)";

function HeroAppMock() {
  const [activeId, setActiveId] = useState(HERO_THREADS[0].id);
  const [view, setView] = useState<
    "thread" | "new" | "extensions" | "automations" | "tasks"
  >("thread");
  const [diffOpen, setDiffOpen] = useState(false);
  // The pane joins after mount (never in prerendered HTML), so hydration
  // matches and the entrance reads as one sequence instead of a flash.
  useEffect(() => {
    if (!window.matchMedia(HERO_DIFF_MIN_WIDTH).matches) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDiffOpen(true);
      return;
    }
    const timer = window.setTimeout(
      () => setDiffOpen(true),
      HERO_TIMING.diffJoins,
    );
    return () => window.clearTimeout(timer);
  }, []);
  // Subagents a running thread spawns, keyed by parent id. They persist once
  // spawned and render as nested child rows in the sidebar.
  const [spawned, setSpawned] = useState<Record<string, MockThread[]>>({});
  const spawnedChildren = useMemo(
    () => Object.values(spawned).flat(),
    [spawned],
  );
  const thread =
    [CHIEF, ...HERO_THREADS, ...spawnedChildren].find(
      (candidate) => candidate.id === activeId,
    ) ?? HERO_THREADS[0];

  const openThread = (id: string) => {
    setActiveId(id);
    setView("thread");
  };

  const handleSpawn = useCallback((parentId: string, child: MockThread) => {
    setSpawned((prev) => {
      const kids = prev[parentId] ?? [];
      if (kids.some((existing) => existing.id === child.id)) {
        return prev;
      }
      return { ...prev, [parentId]: [...kids, child] };
    });
  }, []);

  return (
    <section className="mockup-wrap hero-stage">
      <div
        className="mock"
        data-construct
        aria-label="Interactive preview of the bb app"
      >
        <div className="mock-bar">
          <div className="bar-left">
            <span className="mock-dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="bar-menu" aria-hidden>
              <PanelIcon className="ri bar-ic" />
            </span>
            <span className="bar-nav" aria-hidden>
              <ChevronLeft className="ri" />
              <ChevronRight className="ri" />
            </span>
          </div>
          <div className="bar-main">
            {view === "extensions" || view === "automations" ||
            view === "tasks" ? (
              <span className="bar-title">
                {view === "extensions"
                  ? "Extensions"
                  : view === "automations"
                    ? "Automations"
                    : "Tasks"}
              </span>
            ) : null}
            {view === "thread" ? (
              <>
                <span className="bar-title">{thread.title}</span>
                <Ellipsis className="ri bar-kebab" />
                <span className="bar-actions">
                  <span className="editor-btn" aria-hidden>
                    <img src={vscodeIcon} alt="" className="editor-ic" />
                    <ChevronDown className="chev-xs" />
                  </span>
                  <span className="commit-btn" aria-hidden>
                    Commit
                  </span>
                  <button
                    type="button"
                    className={diffOpen ? "bar-toggle active" : "bar-toggle"}
                    aria-label={diffOpen ? "Hide changes" : "Show changes"}
                    aria-pressed={diffOpen}
                    onClick={() => setDiffOpen((open) => !open)}
                  >
                    <PanelRightIcon className="ri" />
                  </button>
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="mock-body">
          <aside className="side">
            <div className="side-row-new">
              <button
                type="button"
                className={view === "new" ? "side-act active-act" : "side-act"}
                aria-pressed={view === "new"}
                onClick={() => setView("new")}
              >
                <NewThreadIcon className="sa-ic" />
                New thread
              </button>
              <span className="side-search" aria-hidden>
                <SearchGlyph className="sa-ic" />
              </span>
            </div>
            {/* Plugin rows, exactly as today's sidebar orders them:
                Extensions, then each installed plugin's nav panel. */}
            <button
              type="button"
              className={
                view === "extensions" ? "side-act active-act" : "side-act"
              }
              aria-pressed={view === "extensions"}
              onClick={() => setView("extensions")}
            >
              <ToolboxGlyph className="sa-ic" />
              Extensions
            </button>
            <button
              type="button"
              className={
                view === "automations" ? "side-act active-act" : "side-act"
              }
              aria-pressed={view === "automations"}
              onClick={() => setView("automations")}
            >
              <ClockIcon className="sa-ic" />
              Automations
            </button>
            <button
              type="button"
              className={view === "tasks" ? "side-act active-act" : "side-act"}
              aria-pressed={view === "tasks"}
              onClick={() => setView("tasks")}
            >
              <ChecklistGlyph className="sa-ic" />
              Tasks
              <span className="side-chip" aria-hidden>
                3
              </span>
            </button>
            <div className="side-label">Pinned</div>
            <button
              type="button"
              className={
                view === "thread" && activeId === "chief"
                  ? "trow trow-pin active"
                  : "trow trow-pin"
              }
              aria-pressed={view === "thread" && activeId === "chief"}
              onClick={() => openThread("chief")}
            >
              <span className="trow-title">Chief</span>
            </button>
            <div className="side-label">bb</div>
            <ul className="threads">
              {HERO_THREADS.map((candidate, index) => {
                const isActive = view === "thread" && candidate.id === activeId;
                const kids = spawned[candidate.id] ?? [];
                return (
                  <li
                    key={candidate.id}
                    style={{ animationDelay: `${0.6 + index * 0.06}s` }}
                  >
                    <button
                      type="button"
                      className={isActive ? "trow active" : "trow"}
                      aria-pressed={isActive}
                      onClick={() => openThread(candidate.id)}
                    >
                      <span className="trow-title">{candidate.title}</span>
                      <ThreadStatus status={candidate.status} />
                    </button>
                    {kids.length > 0 ? (
                      <ul className="threads thread-kids">
                        {kids.map((kid) => {
                          const kidActive =
                            view === "thread" && kid.id === activeId;
                          return (
                            <li key={kid.id} className="kid-li">
                              <button
                                type="button"
                                className={
                                  kidActive
                                    ? "trow trow-kid active"
                                    : "trow trow-kid"
                                }
                                aria-pressed={kidActive}
                                onClick={() => openThread(kid.id)}
                              >
                                <span className="trow-title">{kid.title}</span>
                                <ThreadStatus status={kid.status} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="side-foot" aria-hidden>
              <GearIcon className="sa-ic" />
            </div>
          </aside>

          {view === "thread" ? (
            <div className="main">
              <ThreadFeed
                key={thread.id}
                thread={thread}
                onSpawn={handleSpawn}
              />
              {thread.ask ? (
                <AskQuestion ask={thread.ask} />
              ) : (
                <Composer thread={thread} />
              )}
            </div>
          ) : view === "new" ? (
            <div className="main main-new">
              <Composer />
            </div>
          ) : (
            <div className="main main-panel">
              {view === "tasks" ? (
                <TasksPanelMock />
              ) : view === "extensions" ? (
                <ExtensionsPanelMock />
              ) : (
                <AutomationsPanelMock />
              )}
            </div>
          )}

          {view === "thread" && diffOpen ? (
            <DiffPanel thread={thread} onClose={() => setDiffOpen(false)} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ── Band layout ──────────────────────────────────────────────────── */

function Band({
  title,
  flip,
  slate,
  visual,
  children,
}: {
  title: string;
  flip?: boolean;
  slate?: boolean;
  visual: ReactNode;
  children: ReactNode;
}) {
  const classes = ["band", flip && "band-flip", slate && "slate"]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={classes}>
      <div className="band-grid">
        <div className="band-copy">
          <h2>{title}</h2>
          {children}
        </div>
        <div className="band-visual">{visual}</div>
      </div>
    </section>
  );
}

/* ── Band visuals: real product captures ──────────────────────────── */

/** How much of a demo window must be on screen before its capture plays. */
const DEMO_PLAY_VISIBILITY = 0.35;




/* ── Page ─────────────────────────────────────────────────────────── */

/* ── Mock plugin panels: compact, believable states for the sidebar IA.
   Same storefront fiction as everything else on the page. ── */

const MOCK_TASKS = [
  { id: "SF-1", title: "Ship the promo-code analytics page", col: "In Progress" },
  { id: "SF-2", title: "Port the pricing script to TypeScript", col: "In Progress" },
  { id: "SF-3", title: "Add Apple Pay to the checkout sheet", col: "Todo" },
  { id: "SF-4", title: "Write docs for the promo engine", col: "Todo" },
  { id: "SF-5", title: "Triage the flaky checkout test", col: "Todo" },
  { id: "SF-6", title: "Cut the 1.4 release notes", col: "Backlog" },
];

function TasksPanelMock() {
  const cols = ["Backlog", "Todo", "In Progress"];
  return (
    <div className="ppanel" aria-hidden>
      <div className="ppanel-bar">
        <span className="ppanel-name">storefront 1.4</span>
        <span className="ppanel-cta">+ New task</span>
      </div>
      <div className="tboard">
        {cols.map((col) => (
          <div key={col} className="tcol">
            <span className="tcol-head">
              {col}
              <em>{MOCK_TASKS.filter((t) => t.col === col).length}</em>
            </span>
            {MOCK_TASKS.filter((t) => t.col === col).map((t) => (
              <div key={t.id} className="tcard">
                <span className="tcard-id">{t.id}</span>
                {t.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtensionsPanelMock() {
  const plugins = [
    ["Tasks", "Built from one prompt: a panel, a CLI, and a skill."],
    ["GitHub", "Issues and pull requests, in threads."],
    ["Agent memory", "What your agents learn, kept."],
    ["Remote access", "Reach bb from your phone."],
  ] as const;
  return (
    <div className="ppanel" aria-hidden>
      <div className="ppanel-bar">
        <span className="ppanel-name">Installed plugins</span>
        <span className="ppanel-cta">Create a plugin</span>
      </div>
      <div className="plist">
        {plugins.map(([name, blurb]) => (
          <div key={name} className="plist-row">
            <span className="plist-name">{name}</span>
            <span className="plist-blurb">{blurb}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationsPanelMock() {
  const autos = [
    ["Nightly changelog", "Every day · 02:00", "ok"],
    ["Dependency sweep", "Mondays · 06:00", "ok"],
    ["Flaky-test triage", "On CI failure", "paused"],
  ] as const;
  return (
    <div className="ppanel" aria-hidden>
      <div className="ppanel-bar">
        <span className="ppanel-name">Scheduled</span>
        <span className="ppanel-cta">+ New automation</span>
      </div>
      <div className="plist">
        {autos.map(([name, cadence, state]) => (
          <div key={name} className="plist-row">
            <span className="plist-name">{name}</span>
            <span className="plist-blurb">{cadence}</span>
            <span className={state === "ok" ? "auto-ok" : "auto-paused"}>
              {state === "ok" ? "On" : "Paused"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * SUBAGENTS STORYBOARD (plays once per view entry)
 *
 *     0ms   parent row working (spinner)
 *   900ms   child row slides in, nested, working
 *  3200ms   child completes (check)
 *  4000ms   parent absorbs the report, completes
 *  rest     both settled — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const SUB_TIMING = {
  childIn: 900,
  childDone: 3200,
  parentDone: 4000,
};

function useViewStage(stages: number[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(stages.length);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const el = ref.current;
    if (!el) return;
    let timers: number[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          setStage(0);
          timers = stages.map((at, i) =>
            window.setTimeout(() => setStage(i + 1), at),
          );
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, stage };
}

function DemoSpinner() {
  return (
    <HugeiconsIcon icon={Loading03Icon} className="dm-spin" aria-hidden />
  );
}

function DemoCheck() {
  return (
    <HugeiconsIcon
      icon={CheckmarkCircle02Icon}
      className="dm-check"
      aria-hidden
    />
  );
}

function SubagentsDemo() {
  const { ref, stage } = useViewStage([
    SUB_TIMING.childIn,
    SUB_TIMING.childDone,
    SUB_TIMING.parentDone,
  ]);
  return (
    <div className="sub-demo" ref={ref} aria-hidden>
      <span className="sub-group">storefront</span>
      <div className="sub-row">
        <span className="sub-title">Expand README testing documentation</span>
        {stage >= 3 ? <DemoCheck /> : <DemoSpinner />}
      </div>
      <div className={stage >= 1 ? "sub-row sub-child in" : "sub-row sub-child"}>
        <span className="sub-title">Identify missing promo edge cases</span>
        {stage >= 2 ? <DemoCheck /> : <DemoSpinner />}
      </div>
      <span className={stage >= 2 ? "sub-report in" : "sub-report"}>
        ↳ reported back to its parent
      </span>
      <div className="sub-row sub-quiet">
        <span className="sub-title">Trace order checkout flow</span>
      </div>
      <div className="sub-row sub-quiet">
        <span className="sub-title">Summarize checkout cart integration</span>
      </div>
      <div className="sub-row sub-quiet">
        <span className="sub-title">Audit promo test coverage gaps</span>
      </div>
      <div className="sub-row sub-quiet">
        <span className="sub-title">Explain promo code checkout impact</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * ASK STORYBOARD (plays once per view entry)
 *
 *     0ms   question card resting, no selection
 *  1100ms   highlight lands on "Single code per cart"
 *  2100ms   radio fills — selected
 *  2900ms   Submit arms (primary)
 *  3800ms   submit presses; the card answers
 *  rest     answered — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const ASK_TIMING = {
  highlight: 1100,
  select: 2100,
  arm: 2900,
  answer: 3800,
};

const ASK_OPTIONS = [
  "Single code per cart",
  "Allow stacking",
  "Depends on the campaign",
];

function AskDemo() {
  const { ref, stage } = useViewStage([
    ASK_TIMING.highlight,
    ASK_TIMING.select,
    ASK_TIMING.arm,
    ASK_TIMING.answer,
  ]);
  const answered = stage >= 4;
  return (
    <div className="ask-demo" ref={ref} aria-hidden>
      <p className="ask-q">
        Should the promo engine support stacking codes, or one per cart?
      </p>
      {answered ? (
        <>
          <div className="ask-answered">
            <DemoCheck />
            <span>
              Answered — <strong>Single code per cart</strong>
            </span>
          </div>
          <p className="ask-after">
            Enforcing one code per cart. The newest code replaces the one
            already applied, and the stacking branch comes out of the engine.
          </p>
          <p className="ask-step">Edited applyPromo.ts</p>
          <p className="ask-step">Added 4 tests</p>
        </>
      ) : (
        <>
          <ul>
            {ASK_OPTIONS.map((opt, i) => {
              const active = i === 0 && stage >= 1;
              const selected = i === 0 && stage >= 2;
              return (
                <li
                  key={opt}
                  className={
                    selected
                      ? "ask-opt selected"
                      : active
                        ? "ask-opt active"
                        : "ask-opt"
                  }
                >
                  <i className="ask-radio" />
                  {opt}
                </li>
              );
            })}
          </ul>
          <div className="ask-foot">
            <span>Cancel</span>
            <span className={stage >= 3 ? "ask-submit armed" : "ask-submit"}>
              Submit answer
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────
 * TASKS BOARD STORYBOARD (loops while in view)
 *
 *      0ms   the board's columns are empty
 *    300ms   cards land column by column, 90ms apart
 *   2600ms   the in-progress card ticks over to done
 *   6000ms   loop restarts
 *   rest     full board — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const BOARD_BEATS = [300, 2600];
const BOARD_RESET = 6000;

const BOARD_COLUMNS = [
  {
    name: "Backlog",
    cards: [
      { id: "SF-6", title: "Cut the 1.4 release notes" },
      { id: "SF-9", title: "Retire the legacy cart cookie" },
      { id: "SF-11", title: "Audit checkout analytics" },
      { id: "SF-14", title: "Drop the unused address form" },
    ],
  },
  {
    name: "Todo",
    cards: [
      { id: "SF-3", title: "Add Apple Pay to checkout" },
      { id: "SF-4", title: "Write docs for the promo engine" },
      { id: "SF-7", title: "Handle expired promo codes" },
      { id: "SF-12", title: "Cover the empty-cart path" },
    ],
  },
  {
    name: "In progress",
    cards: [
      { id: "SF-1", title: "Ship promo-code analytics" },
      { id: "SF-2", title: "Port pricing to TypeScript" },
      { id: "SF-8", title: "Split the order confirmation" },
      { id: "SF-13", title: "Trace the checkout funnel" },
    ],
  },
] as const;

function TasksBoardDemo() {
  const { ref, stage } = useLoopStage(BOARD_BEATS, BOARD_RESET);
  const settled = stage >= BOARD_BEATS.length;
  const landed = stage >= 1 || settled;
  let n = 0;
  return (
    <div className="board-demo" ref={ref} aria-hidden>
      <div className="board-bar">
        <span className="board-project">storefront 1.4</span>
        <span className="board-new">+ New task</span>
      </div>
      <div className="board-cols">
        {BOARD_COLUMNS.map((col) => (
          <div key={col.name} className="board-col">
            <span className="board-col-head">
              {col.name}
              <em>{col.cards.length}</em>
            </span>
            {col.cards.map((card) => {
              const delay = n++ * 90;
              return (
                <div
                  key={card.id}
                  className={landed ? "board-card in" : "board-card"}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <span className="board-id">
                    {card.id}
                    {card.id === "SF-1" && (stage >= 2 || settled) ? (
                      <DemoCheck />
                    ) : null}
                  </span>
                  {card.title}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * REVIEW STORYBOARD (loops while in view)
 *
 *      0ms   the diff header, no hunks
 *    400ms   diff lines land, 70ms apart
 *   2400ms   the working-tree bar arrives
 *   3400ms   Commit arms
 *   7000ms   loop restarts
 *   rest     full diff, armed — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const REVIEW_BEATS = [400, 2400, 3400];
const REVIEW_RESET = 7000;

const REVIEW_LINES = [
  { sign: " ", text: "export function applyPromo(cart, code) {" },
  { sign: "-", text: "  const percent = PERCENT_CODES[code] ?? 0;" },
  { sign: "+", text: "  const percent = Object.hasOwn(" },
  { sign: "+", text: "    PERCENT_CODES, code," },
  { sign: "+", text: "  ) ? PERCENT_CODES[code] : 0;" },
  { sign: " ", text: "  const subtotal = cart.items.reduce(sum, 0);" },
  { sign: " ", text: "  return round(subtotal * (1 - percent));" },
  { sign: " ", text: "}" },
  { sign: " ", text: "" },
  { sign: "+", text: "it(\"ignores an unknown code\", () => {" },
  { sign: "+", text: "  expect(applyPromo(cart, \"constructor\"))" },
  { sign: "+", text: "    .toBeCloseTo(subtotal);" },
  { sign: "+", text: "});" },
] as const;

function ReviewDemo() {
  const { ref, stage } = useLoopStage(REVIEW_BEATS, REVIEW_RESET);
  const settled = stage >= REVIEW_BEATS.length;
  const landed = stage >= 1 || settled;
  return (
    <div className="review-demo" ref={ref} aria-hidden>
      <div className="review-head">
        <span className="review-file">applyPromo.ts</span>
        <span className="review-count">
          <em className="review-add">+3</em>
          <em className="review-del">-1</em>
        </span>
      </div>
      <div className={stage >= 2 || settled ? "review-foot in" : "review-foot"}>
        <GitBranchIcon className="review-ic" />
        <span>Uncommitted · 1 file</span>
        <span className={stage >= 3 || settled ? "review-commit armed" : "review-commit"}>
          Commit
        </span>
      </div>
      <div className="review-hunk">
        {REVIEW_LINES.map((l, i) => (
          <p
            key={l.text}
            className={
              (landed ? "review-line in" : "review-line") +
              (l.sign === "+" ? " is-add" : l.sign === "-" ? " is-del" : "")
            }
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <span className="review-sign">{l.sign}</span>
            {l.text}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * BUILD STORYBOARD (loops while in view)
 *
 *      0ms   an empty prompt, caret blinking
 *    300ms   the request types itself
 *   2100ms   sent; the agent starts working
 *   2900ms   the panel surface lands
 *   3800ms   the command lands
 *   4700ms   the skill lands
 *   6200ms   the thread reports back
 *   9400ms   loop restarts
 *   rest     all three surfaces present — reduced-motion state
 * ──────────────────────────────────────────────── */
const BUILD_BEATS = [300, 2100, 2900, 3800, 4700, 6200];
const BUILD_RESET = 9400;
const BUILD_PROMPT = "Add a review queue panel";

const BUILD_SURFACES = [
  {
    kind: "Panel",
    name: "Review queue",
    detail: "In the sidebar, above Tasks",
    icon: PanelIcon,
  },
  {
    kind: "Command",
    name: "bb review",
    detail: "The same queue, from any shell",
    icon: TerminalGlyph,
  },
  {
    kind: "Skill",
    name: "review-queue",
    detail: "So every agent knows to use it",
    icon: ChecklistGlyph,
  },
] as const;

function BuildDemo() {
  const { ref, stage } = useLoopStage(BUILD_BEATS, BUILD_RESET);
  const settled = stage >= BUILD_BEATS.length;
  return (
    <div className="build-demo" ref={ref} aria-hidden>
      <div className="build-ask">
        <p className={stage >= 2 || settled ? "build-prompt sent" : "build-prompt"}>
          <span className={stage >= 1 && !settled ? "build-typed typing" : "build-typed"}>
            {BUILD_PROMPT}
          </span>
          <span className="build-caret" />
        </p>
        <div className="build-steps">
          <p className={stage >= 2 || settled ? "gang-step in" : "gang-step out"}>
            Scaffolded the plugin
          </p>
          <p className={stage >= 6 || settled ? "gang-say in" : "gang-say out"}>
            The panel is live in your sidebar. bb building bb.
          </p>
        </div>
      </div>
      <ul className="build-surfaces">
        {BUILD_SURFACES.map((s, i) => {
          const Icon = s.icon;
          const on = settled || stage >= i + 3;
          return (
            <li key={s.kind} className={on ? "build-surface in" : "build-surface"}>
              <Icon className="build-ic" />
              <div className="build-body">
                <span className="build-name">{s.name}</span>
                <span className="build-detail">{s.detail}</span>
              </div>
              <span className="build-kind">{s.kind}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * GANG STORYBOARD (loops while in view)
 *
 *      0ms   four threads working across three projects
 *   1500ms   a step lands in the open transcript
 *   3000ms   the codex thread finishes its edit
 *   4200ms   the claude thread completes; its child appears nested
 *   5600ms   the last step lands; the pi thread completes
 *   8600ms   loop restarts
 *   rest     everything settled — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const GANG_BEATS = [1500, 3000, 4200, 5600];
const GANG_RESET = 8600;

const GANG_STEPS = [
  { kind: "step", text: "Explored 3 files" },
  {
    kind: "say",
    text: "The promo engine has no test for stacked codes.",
  },
  { kind: "step", text: "Edited promo.test.ts" },
  { kind: "say", text: "Added four cases. Running the suite." },
] as const;

function useLoopStage(beats: number[], resetAt: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(beats.length);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const el = ref.current;
    if (!el) return;
    let timers: number[] = [];
    const run = () => {
      setStage(0);
      timers = beats.map((at, i) => window.setTimeout(() => setStage(i + 1), at));
      timers.push(window.setTimeout(run, resetAt));
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!timers.length) run();
        } else {
          timers.forEach(clearTimeout);
          timers = [];
          setStage(beats.length);
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, stage };
}

function GangDemo() {
  const { ref, stage } = useLoopStage(GANG_BEATS, GANG_RESET);
  const settled = stage >= GANG_BEATS.length;
  const shown = settled ? GANG_STEPS.length : Math.min(stage + 1, GANG_STEPS.length);
  return (
    <div className="gang-demo" ref={ref} aria-hidden>
      <div className="gang-side">
        <span className="sub-group">storefront</span>
        <div className="sub-row gang-row is-open">
          <OpenAiIcon className="gang-pv" />
          <span className="sub-title">Audit promo code coverage</span>
          {stage >= 2 || settled ? <DemoCheck /> : <DemoSpinner />}
        </div>
        <div className="sub-row gang-row">
          <ClaudeIcon className="gang-pv" />
          <span className="sub-title">Trace order checkout flow</span>
          {stage >= 3 || settled ? <DemoCheck /> : <DemoSpinner />}
        </div>
        <div
          className={
            stage >= 3 || settled ? "sub-row gang-row gang-kid in" : "sub-row gang-row gang-kid"
          }
        >
          <ClaudeIcon className="gang-pv" />
          <span className="sub-title">Confirm the checkout totals</span>
          <DemoSpinner />
        </div>
        <div className="sub-row gang-row">
          <CursorIcon className="gang-pv" />
          <span className="sub-title">Explain promo checkout impact</span>
          <HugeiconsIcon icon={MessageQuestionIcon} className="gang-wait" />
        </div>
        <span className="sub-group gang-gap">checkout-api</span>
        <div className="sub-row gang-row">
          <PiIcon className="gang-pv" />
          <span className="sub-title">Summarize service route</span>
          {stage >= 4 || settled ? <DemoCheck /> : <DemoSpinner />}
        </div>
        <span className="sub-group gang-gap">mobile</span>
        <div className="sub-row gang-row">
          <OpencodeIcon className="gang-pv" />
          <span className="sub-title">Suggest README improvement</span>
          <DemoSpinner />
        </div>
      </div>
      <div className="gang-thread">
        <div className="gang-head">
          <OpenAiIcon className="gang-pv" />
          <span className="gang-title">Audit promo code coverage</span>
          <span className="gang-badge">Codex</span>
        </div>
        <div className="gang-feed">
          {GANG_STEPS.slice(0, shown).map((s, i) => (
            <p
              key={s.text}
              className={s.kind === "step" ? "gang-step in" : "gang-say in"}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {s.text}
            </p>
          ))}
        </div>
        <div className="gang-tree">
          <FolderGitIcon className="gang-tree-ic" />
          Worktree · bb/audit-promo-coverage
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * SPAWN MACHINE (loops while in view; ~6.4s per cause)
 *
 * Three causes fire into one sidebar, one at a time:
 *   cause activates → (CLI types / message lands / schedule ticks)
 *   → its thread arrives, working → title morphs in → settles with a dot
 *   → the next cause takes over. After all three, a quiet reset.
 * Offscreen and reduced motion rest fully settled: every cause calm,
 * every thread present.
 * ──────────────────────────────────────────────── */
const BEAT_MS = 6400;
const BEAT = {
  fire: 1900, // CLI finishes typing / message read / schedule hits
  row: 2200,
  title: 2900,
  dot: 5000,
};
const SPAWN_RESET_MS = 3 * BEAT_MS + 1600;

const SPAWN_COMMAND = 'bb thread spawn --prompt "Trace one order to confirmation"';

const SPAWN_CAUSES = [
  { id: "cli", title: "Trace order checkout flow" },
  { id: "telegram", title: "Audit promo code coverage" },
  { id: "cron", title: "Nightly dependency sweep" },
] as const;

type SpawnPhase = { beat: number; t: number };

function useSpawnMachine() {
  const ref = useRef<HTMLDivElement>(null);
  const settledPhase: SpawnPhase = { beat: 3, t: 0 };
  const [phase, setPhase] = useState<SpawnPhase>(settledPhase);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const el = ref.current;
    if (!el) return;
    let timers: number[] = [];
    const schedule = () => {
      for (let beat = 0; beat < 3; beat++) {
        const base = beat * BEAT_MS;
        timers.push(
          window.setTimeout(() => setPhase({ beat, t: 0 }), base),
          window.setTimeout(() => setPhase({ beat, t: 1 }), base + BEAT.fire),
          window.setTimeout(() => setPhase({ beat, t: 2 }), base + BEAT.row),
          window.setTimeout(() => setPhase({ beat, t: 3 }), base + BEAT.title),
          window.setTimeout(() => setPhase({ beat, t: 4 }), base + BEAT.dot),
        );
      }
      timers.push(
        window.setTimeout(() => {
          timers = [];
          schedule();
        }, SPAWN_RESET_MS),
      );
    };
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
      setPhase({ beat: 3, t: 0 });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!timers.length) schedule();
        } else {
          stop();
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, phase };
}

/** Progress of cause `i` under the current phase: 0 = untouched, then
 *  1..4 through fire/row/title/dot; completed causes hold 4. */
function causeStage(phase: SpawnPhase, i: number) {
  if (phase.beat > i) return 4;
  if (phase.beat < i) return 0;
  return phase.t;
}

function SpawnDemo() {
  const { ref, phase } = useSpawnMachine();
  const cli = causeStage(phase, 0);
  const tg = causeStage(phase, 1);
  const cron = causeStage(phase, 2);
  const active = phase.beat < 3 ? phase.beat : -1;
  return (
    <div className="spawn-demo" ref={ref} aria-hidden>
      <div className="spawn-causes">
        <p
          className={`spawn-term spawn-cause${active === 0 ? " live" : ""}${
            cli >= 1 ? " sent" : ""
          }`}
        >
          <span className="term-ps">$</span>
          <span className={active === 0 ? "spawn-cmd typing" : "spawn-cmd"}>
            {SPAWN_COMMAND}
          </span>
          <span className="term-caret" />
        </p>
        <div className={`spawn-tg spawn-cause${active === 1 ? " live" : ""}`}>
          <img src={hermesAvatar} alt="" width={26} height={26} />
          <div className="tg-body">
            <span className="tg-from">
              Hermes <em>· via Telegram</em>
            </span>
            <span className="tg-msg">
              spawn a thread: audit our promo code coverage
            </span>
          </div>
          <span className="tg-time">{tg >= 1 ? "read" : "now"}</span>
        </div>
        <div className={`spawn-cron spawn-cause${active === 2 ? " live" : ""}`}>
          <HugeiconsIcon icon={Clock01Icon} className="cron-ic" />
          <div className="tg-body">
            <span className="tg-from">
              Automation <em>· every night</em>
            </span>
            <span className="tg-msg">Dependency sweep across storefront</span>
          </div>
          <span className="tg-time">{cron >= 1 ? "running" : "02:00"}</span>
        </div>
      </div>
      <div className="spawn-window">
        <span className="sub-group">storefront</span>
        {[
          { stage: cron, title: SPAWN_CAUSES[2].title },
          { stage: tg, title: SPAWN_CAUSES[1].title },
          { stage: cli, title: SPAWN_CAUSES[0].title },
        ].map((row) => (
          <div
            key={row.title}
            className={row.stage >= 2 ? "sub-row spawn-new in" : "sub-row spawn-new"}
          >
            <span className="sub-title">
              <TextMorph
                as="span"
                duration={520}
                ease="cubic-bezier(0.19, 1, 0.22, 1)"
              >
                {row.stage >= 3 ? row.title : "New thread"}
              </TextMorph>
            </span>
            {row.stage >= 4 ? (
              <i className="spawn-dot" />
            ) : row.stage >= 2 ? (
              <DemoSpinner />
            ) : null}
          </div>
        ))}
        <div className="sub-row sub-quiet">
          <span className="sub-title">Summarize checkout cart integration</span>
        </div>
        <span className="sub-group spawn-gap">checkout-api</span>
        <div className="sub-row sub-quiet">
          <span className="sub-title">Describe order endpoint validation</span>
        </div>
        <div className="sub-row sub-quiet">
          <span className="sub-title">Summarize service route</span>
        </div>
      </div>
    </div>
  );
}

/** The merged-PR feed: real recent merges (baked at authoring time),
 *  looping in a slow vertical marquee. Two copies of the list scroll as one
 *  track; reduced motion rests on the static list. */
function PRFeed() {
  return (
    <div className="pr-feed rail" aria-label="Recently merged pull requests">
      <div className="pr-feed-clip">
        <div className="pr-feed-track" aria-hidden={undefined}>
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined}>
            {PR_FEED.map((pr, i) => {
              const url =
                CONTRIBUTOR_AVATARS[`../assets/contributors/${pr.login}.webp`];
              return (
                <li key={`${copy}-${i}`}>
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={copy === 1 ? -1 : undefined}
                  >
                    {url ? (
                      <img src={url} alt="" width={22} height={22} />
                    ) : (
                      <span className="pr-avatar-fallback" aria-hidden>
                        {pr.login.slice(0, 1)}
                      </span>
                    )}
                    <span className="pr-title">{pr.title}</span>
                    <span className="pr-meta">
                      #{pr.number} · {pr.date}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ))}
        </div>
      </div>
    </div>
  );
}

/** A stat numeral that rolls to its value with a character morph (torph)
 *  the first time it scrolls into view. Prerendered HTML carries the real
 *  value; the roll starts from 0 only after hydration, and reduced motion
 *  never leaves the real value. */
function StatNumber({ value }: { value: string }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const el = ref.current;
    if (!el) return;
    // Already on screen (deep link, short page): keep the real value.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setText("0");
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setText(value);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(hold);
    };
    // Rendering law: a zeroed numeral is a false statement. The roll waits
    // for the reader, but never holds the real value hostage — after the
    // hold it reveals regardless, so any capture, crawler, or slow scroll
    // sees the truth.
    const hold = window.setTimeout(reveal, 5000);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) reveal();
    });
    // Fast programmatic scrolls can leapfrog the observer between frames;
    // a passive scroll check guarantees the roll still lands.
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) reveal();
    };
    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(hold);
    };
  }, [value]);
  return (
    <strong ref={ref}>
      <TextMorph
        as="span"
        duration={620}
        ease="cubic-bezier(0.19, 1, 0.22, 1)"
      >
        {text}
      </TextMorph>
    </strong>
  );
}

/** Transform-only entrance for the bento: cards settle up as the grid enters
 *  the viewport. Opacity never changes, so every render context shows full
 *  content — motion is pure enhancement. */
function useBentoSettle() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const bento = document.querySelector(".bento");
    if (!bento) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          bento.classList.add("bento-in");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    observer.observe(bento);
    return () => observer.disconnect();
  }, []);
}

function LandingPage() {
  useConstructMock();
  useFitMock();
  useBentoSettle();
  return (
    <div className="wrap">
      <SiteNav />

      <header className="hero">
        {PRODUCT_HUNT_LAUNCH_ACTIVE ? (
          <ProductHuntCallout placement="hero" />
        ) : (
          <a className="updates-callout" href={LATEST_RELEASE_URL}>
            <span className="updates-label">New</span>
            <span className="updates-title">
              {LATEST_RELEASE_META.headline}
            </span>
            <ChevronRight className="updates-arrow" />
          </a>
        )}
        <h1>The IDE that builds itself</h1>
        <p className="sub">
          Mission control for coding agents. Claude Code, Codex, Cursor, and
          Pi run in one place, each in its own thread, in an IDE they can
          rebuild.
        </p>

        <InstallOptions placement="hero" />

        <p className="hero-economics">
          Free · MIT · local-first · runs on the subscriptions you already pay
          for
        </p>

        <div className="providers">
          <span className="label">Works with</span>
          <ProviderChips />
        </div>
      </header>

      <div className="slate band-theater">
        <HeroAppMock />
        <section className="company-proof" aria-labelledby="company-proof-title">
          <h2 id="company-proof-title">Used by builders at</h2>
          <CompanyProofLogos />
        </section>
      </div>

      <section className="act">
        <div className="act-head rail">
          <h2>More than a chat window.</h2>
          <div className="act-lead">
            <p>
              bb carries the work around the conversation: building,
              reviewing, delegating, and deciding.
            </p>
          </div>
        </div>
        <ul className="bento rail">
          <li>
            <h3>Built from one prompt</h3>
            <p>
              An agent built the Tasks plugin: a panel, a CLI, and a skill.
            </p>
            <div className="bento-window bento-component">
              <TasksBoardDemo />
            </div>
          </li>
          <li>
            <h3>Review from the thread</h3>
            <p>
              Working-tree diffs, commits, and PRs sit beside the
              conversation.
            </p>
            <div className="bento-window bento-component">
              <ReviewDemo />
            </div>
          </li>
          <li>
            <h3>Subagents</h3>
            <p>
              Threads spawn threads, manage them, and take the report back.
            </p>
            <div className="bento-window bento-component">
              <SubagentsDemo />
            </div>
          </li>
          <li>
            <h3>Asks, not guesses</h3>
            <p>
              Agents pause with a real question when they need your call.
            </p>
            <div className="bento-window bento-component">
              <AskDemo />
            </div>
          </li>
        </ul>
      </section>

      <section className="act slate">
        <div className="act-head rail">
          <h2>Ask for a feature. Watch it appear.</h2>
          <div className="act-lead">
            <p>
              Almost anything in bb can be changed in a single prompt. Ask for a
              task tracker and one appears as a panel, a <code>bb tasks</code>{" "}
              command, and a skill.
            </p>
            <p className="act-claim">
              The Extensions page ships with bb: browse plugins others built, or
              describe your own.
            </p>
          </div>
        </div>
        <div className="rail">
          <BuildDemo />
        </div>
      </section>

      <section className="act">
        <div className="act-head rail">
          <h2>The gang&rsquo;s all here</h2>
          <div className="act-lead">
            <p>
              Claude Code, Codex, Cursor, Pi, OpenCode, Grok, omp, and Hermes
              each work in their own thread. Hand the task to whichever fits.
              They spawn and manage each other.
            </p>
            <p className="act-claim">
              No new subscription. Each agent runs on the one you already pay
              for, billed by the provider, not bb.
            </p>
            <div className="providers">
              <ProviderChips />
            </div>
          </div>
        </div>
        <div className="rail">
          <GangDemo />
        </div>
      </section>

      <section className="act slate">
        <div className="act-head rail">
          <h2>Anything can kick off work.</h2>
          <div className="act-lead">
            <p>
              The CLI your agents use is open to any program you write: a
              shell script, a cron job, a bot in Telegram or Slack. Each can
              put an agent to work while you&rsquo;re away, and it&rsquo;s
              waiting in your sidebar when you are.
            </p>
          </div>
        </div>
        <div className="causal rail">
          <SpawnDemo />
        </div>
      </section>

      <section className="act open-act">
        <div className="act-head rail">
          <h2>Open source, end to end.</h2>
          <div className="act-lead">
            <p>
              bb is MIT-licensed and built in the open. Fork it, customize the
              agents, tools, and UI, and ship your own build.
            </p>
          </div>
        </div>
        <ul className="stat-cards rail">
          <li>
            <StatNumber value={GITHUB_STATS.stars.toLocaleString("en-US")} />
            <span>Stars</span>
          </li>
          <li>
            <StatNumber value={String(GITHUB_STATS.forks)} />
            <span>Forks</span>
          </li>
          <li>
            <StatNumber value={String(GITHUB_STATS.contributors)} />
            <span>Contributors</span>
          </li>
          <li>
            <StatNumber value={String(GITHUB_STATS.mergedLastMonth)} />
            <span>PRs merged last month</span>
          </li>
        </ul>
        <PRFeed />
        <div className="open-cta">
          <GitHubLink placement="local" className="btn btn-ghost">
            View the source →
          </GitHubLink>
        </div>
      </section>

      <div className="slate band-close">
      <section className="closer">
        <img
          src={bbIconLarge}
          alt=""
          className="closer-mark"
          width={72}
          height={72}
        />
        <h2 className="sec-title">Put your agents to work.</h2>
        <p>Free, open source, and local-first. Install in under a minute.</p>
        <InstallOptions placement="closer" />
        <div className="closer-subscribe">
          <span>Product updates and what we&rsquo;re building next. No spam.</span>
          <EmailSignup placement="footer" />
        </div>
      </section>

      <SiteFooter />
      </div>
    </div>
  );
}
