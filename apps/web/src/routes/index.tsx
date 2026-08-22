import {
  ArrowDown01Icon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowMoveDownLeftIcon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  AttachmentIcon,
  BrainIcon,
  BrowserIcon,
  BubbleChatAddIcon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Edit04Icon,
  ElectricPlugsIcon,
  File01Icon,
  FolderGitTwoIcon,
  FolderIcon as HiFolderIcon,
  GitBranchIcon as HiGitBranchIcon,
  GithubIcon,
  GitMergeIcon as HiGitMergeIcon,
  LaptopIcon as HiLaptopIcon,
  Loading03Icon,
  LockIcon,
  MessageAdd02Icon,
  MessageQuestionIcon,
  Mic02Icon,
  MoreHorizontalIcon,
  PlusMinusSquare01Icon,
  PlusSignIcon,
  RefreshIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  SidebarLeftIcon,
  SidebarRightIcon,
  SmartPhone01Icon,
  Tick02Icon,
  ToolboxIcon,
  WorkflowCircle03Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
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
import bbStickerRiso from "../assets/stickers/bb-riso.webp";
import phoneBezel from "../assets/phone-bezel.svg";
import vscodeIcon from "../assets/vscode.png";
import { RELEASE_META, parseChangelog } from "../landing/changelog";
import {
  DiscordLink,
  DownloadLink,
  EmailSignup,
  GitHubLink,
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
      aria-label={
        copied
          ? "Install command copied"
          : `Copy browser install command: ${CLI_COMMAND}`
      }
    >
      <span className="cmd-dollar">$</span>
      <span className="cmd-text">{CLI_COMMAND}</span>
      <span className="cmd-copy">
        <span className="cmd-swap">
          <CopyGlyph className={copied ? "cmd-glyph-out" : "cmd-glyph-in"} />
          <CheckGlyph className={copied ? "cmd-glyph-in" : "cmd-glyph-out"} />
        </span>
      </span>
      {/* The checkmark is the sighted confirmation; this is its equivalent.
          A label change alone is not reliably announced mid-interaction. */}
      <span className="sr-only" aria-live="polite">
        {copied ? "Install command copied." : ""}
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
const PlusGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={PlusSignIcon} className={className} />
);
const RefreshGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={RefreshIcon} className={className} />
);

type BoardTaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";
type BoardTaskPriority = "urgent" | "high" | "medium" | "low" | "none";

/** Exact status artwork from plugins/tasks/views/board/icons.tsx. */
function BoardStatusGlyph({ status }: { status: BoardTaskStatus }) {
  let artwork: ReactNode;
  switch (status) {
    case "backlog":
      artwork = (
        <circle
          cx="7"
          cy="7"
          r="5.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="1.8 2"
        />
      );
      break;
    case "todo":
      artwork = (
        <circle
          cx="7"
          cy="7"
          r="5.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      );
      break;
    case "in_progress":
      artwork = (
        <>
          <circle
            cx="7"
            cy="7"
            r="5.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M7 7 L7 2.4 A4.6 4.6 0 0 1 11.2 9.5 Z" fill="currentColor" />
        </>
      );
      break;
    case "in_review":
      artwork = (
        <>
          <circle
            cx="7"
            cy="7"
            r="5.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M7 7 L7 2.4 A4.6 4.6 0 1 1 6.99 2.4 Z" fill="currentColor" />
        </>
      );
      break;
    case "done":
      artwork = (
        <>
          <circle cx="7" cy="7" r="6" fill="currentColor" />
          <path
            d="M4.4 7.2 l1.8 1.8 3.4-3.8"
            stroke="var(--canvas)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
      break;
  }
  return (
    <svg
      className={`board-state board-state-${status}`}
      viewBox="0 0 14 14"
      aria-hidden="true"
    >
      {artwork}
    </svg>
  );
}

const PRIORITY_LIT_BARS: Record<
  Exclude<BoardTaskPriority, "urgent">,
  number
> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

/** Exact priority artwork from plugins/tasks/views/board/icons.tsx. */
function PriorityGlyph({ priority }: { priority: BoardTaskPriority }) {
  if (priority === "urgent") {
    return (
      <svg
        className="board-pri board-pri-urgent"
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <rect width="14" height="14" rx="3" />
        <path
          d="M7 3.2v4.4"
          stroke="var(--canvas)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="7" cy="10.6" r="1.1" fill="var(--canvas)" />
      </svg>
    );
  }
  const lit = PRIORITY_LIT_BARS[priority];
  const bars = [
    { x: 1.5, height: 5 },
    { x: 5.5, height: 8 },
    { x: 9.5, height: 11 },
  ];
  return (
    <svg className="board-pri" viewBox="0 0 14 14" aria-hidden="true">
      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={13 - bar.height}
          width="3"
          height={bar.height}
          rx="1"
          className={index < lit ? "board-pri-lit" : "board-pri-muted"}
        />
      ))}
    </svg>
  );
}

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
  /** Work a running thread streams in after its transcript has played. */
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
        // A row that arrives while you watch eases up as it lands. Rows that
        // were already there when the thread opened simply are there — the
        // app does not replay its own history.
        const style: CSSProperties | undefined = live
          ? { animation: "c-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }
          : undefined;
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
/** Unified-diff line numbers, the way the app's GitDiffCard computes them: a
 *  deletion carries its old number, an addition its new one, and context
 *  carries both because they agree. The hero panel was the only diff on this
 *  page — or in the product — drawn without a gutter, while the review demo
 *  twelve hundred lines below drew one. */
function numberDiff(lines: DiffLine[], start = 12) {
  let oldNo = start;
  let newNo = start;
  return lines.map((line) => {
    if (line.t === "del") return { ...line, no: oldNo++ };
    if (line.t === "add") return { ...line, no: newNo++ };
    const no = newNo;
    oldNo += 1;
    newNo += 1;
    return { ...line, no };
  });
}

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
        {numberDiff(DIFF_LINES).map((line, i) => (
          <div key={i} className={`dl dl-${line.t}`}>
            <span className="dl-no">{line.no}</span>
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
 *      0ms   the window is simply there, the way the app opens
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
  // Open from the first byte. The Changes pane is the hero's strongest
  // evidence — it is the frame where bb is reviewing code rather than
  // chatting — and it used to join on a timer after mount, which meant it
  // existed in neither the prerendered HTML nor any capture taken before
  // the timer fired. CSS decides where it is too narrow to show; the
  // toggle stays live for anyone who wants it out of the way.
  const [diffOpen, setDiffOpen] = useState(true);
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
        aria-label="Interactive preview of the bb app"
      >
        <div className="mock-bar">
          <div className="bar-left">
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
                  <li key={candidate.id}>
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

function TasksPanelMock() {
  return <TasksBoardDemo />;
}

type BuiltinPlugin = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

// Derived from every package.json under
// packages/bb-app/server/dist/builtin-plugins/ in the source checkout.
const BUILTIN_PLUGINS_FROM_MANIFESTS: readonly BuiltinPlugin[] = [
  {
    id: "ask-user-question",
    name: "Ask User Question",
    description:
      "Let any provider ask the user a multiple-choice question, the way Claude Code's AskUserQuestion does natively.",
    icon: "MessageQuestion",
  },
  {
    id: "automations",
    name: "Automations",
    description: "Schedule recurring and one-shot agent or script work.",
    icon: "Clock",
  },
  {
    id: "connect",
    name: "Remote access",
    description:
      "Remote access via getbb.app — this bb becomes reachable at https://<handle>.getbb.app. Disable to cut off all remote access.",
    icon: "Smartphone",
  },
  {
    id: "custom-instructions",
    name: "Custom instructions",
    description:
      "Add persistent custom instructions to agent tasks on this bb host.",
    icon: "EditFile",
  },
  {
    id: "simple-notes",
    name: "Docs",
    description:
      "Create and edit Markdown documents across local and connected-host vaults.",
    icon: "FileText",
  },
  {
    id: "github",
    name: "GitHub",
    description:
      "Browse GitHub issues and pull requests in BB, then send them to agents.",
    icon: "Github",
  },
  {
    id: "inline-vis",
    name: "Inline visualizations",
    description:
      "Render workspace HTML visualizations inline in assistant messages.",
    icon: "AppWindow",
  },
  {
    id: "memory",
    name: "Memory",
    description:
      "Provider-independent durable memory for agents. We recommend disabling provider-native memory when using this plugin.",
    icon: "Brain",
  },
  {
    id: "provider-retry",
    name: "Provider retry",
    description:
      "Continue turns after Codex and Claude Code subscription limits reset.",
    icon: "ArrowReloadHorizontal",
  },
  {
    id: "secrets",
    name: "Secrets",
    description:
      "Securely request credentials from a user and reconcile them into dotenv files.",
    icon: "Lock",
  },
  {
    id: "side-chat",
    name: "Side chat",
    description:
      "Reply to messages in hidden side-chat forks rendered in a thread panel.",
    icon: "SideChat",
  },
  {
    id: "tasks",
    name: "Tasks",
    description:
      "Plan and track work in BB, delegate tasks to agents, and keep task context connected to worker threads.",
    icon: "ListTodo",
  },
  {
    id: "workflows",
    name: "Workflows",
    description: "Run durable, provider-independent agent workflows.",
    icon: "Workflow",
  },
];

// Installation and initial switch state come from
// apps/server/src/services/plugins/builtin-registry.ts. Official plugins stay
// in Browse until installed; builtins reconcile onto a fresh host.
const AUTO_INSTALLED_PLUGIN_IDS_FROM_REGISTRY = new Set([
  "ask-user-question",
  "automations",
  "connect",
  "custom-instructions",
  "inline-vis",
  "provider-retry",
  "secrets",
  "side-chat",
  "workflows",
]);
const DEFAULT_ENABLED_PLUGIN_IDS_FROM_REGISTRY = new Set([
  "automations",
  "connect",
  "custom-instructions",
  "inline-vis",
  "secrets",
  "side-chat",
]);
const PLUGIN_CATEGORIES_FROM_REGISTRY = [
  "Workflow management",
  "Agent interaction",
  "Context & knowledge",
  "Developer tools",
  "Host access",
  "Interface",
] as const;
const PLUGIN_CATEGORY_BY_ID_FROM_REGISTRY: Readonly<Record<string, string>> = {
  "ask-user-question": "Agent interaction",
  automations: "Workflow management",
  connect: "Host access",
  "custom-instructions": "Context & knowledge",
  "inline-vis": "Interface",
  "provider-retry": "Agent interaction",
  secrets: "Developer tools",
  "side-chat": "Agent interaction",
  workflows: "Workflow management",
  github: "Developer tools",
  "simple-notes": "Context & knowledge",
  memory: "Context & knowledge",
  tasks: "Workflow management",
};

const BUILTIN_PLUGIN_ICON_MAP: Readonly<Record<string, IconSvgElement>> = {
  AppWindow: BrowserIcon,
  ArrowReloadHorizontal: ArrowReloadHorizontalIcon,
  Brain: BrainIcon,
  Clock: Clock01Icon,
  EditFile: Edit04Icon,
  FileText: File01Icon,
  Github: GithubIcon,
  ListTodo: CheckListIcon,
  Lock: LockIcon,
  MessageQuestion: MessageQuestionIcon,
  SideChat: MessageAdd02Icon,
  Smartphone: SmartPhone01Icon,
  Workflow: WorkflowCircle03Icon,
};

function BuiltinPluginGlyph({ plugin }: { plugin: BuiltinPlugin }) {
  return (
    <HugeiconsIcon
      icon={BUILTIN_PLUGIN_ICON_MAP[plugin.icon] ?? ZapIcon}
      className="ext-plugin-icon"
      aria-hidden="true"
    />
  );
}

type ExtensionsPage =
  | "plugins-browse"
  | "plugins-installed"
  | "skills-browse"
  | "skills-library";

const EXTENSIONS_PAGE_COPY: Record<
  ExtensionsPage,
  { title: string; description: string }
> = {
  "plugins-browse": {
    title: "Browse plugins",
    description:
      "Plugins add app surfaces, commands, services, schedules, and skills to bb. Install an official plugin, or describe your own and build it from a prompt.",
  },
  "plugins-installed": {
    title: "Installed plugins",
    description:
      "The plugins installed on this bb host. Turn one on or off, apply updates, or open it for settings and details.",
  },
  "skills-browse": {
    title: "Browse skills",
    description:
      "Trending agent skills from skills.sh. Install one and every agent you use in bb can run it.",
  },
  "skills-library": {
    title: "My skills",
    description:
      "The skills on this bb host — yours, your providers', and those bundled with plugins. They work with every agent you use in bb.",
  },
};

function ExtensionsPanelMock() {
  const [page, setPage] = useState<ExtensionsPage>("plugins-browse");
  const [query, setQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [enabledPluginIds, setEnabledPluginIds] = useState(
    () => new Set(DEFAULT_ENABLED_PLUGIN_IDS_FROM_REGISTRY),
  );
  const pageCopy = EXTENSIONS_PAGE_COPY[page];
  const selectedPlugin =
    BUILTIN_PLUGINS_FROM_MANIFESTS.find(
      (plugin) => plugin.id === selectedPluginId,
    ) ?? null;
  const visiblePlugins = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const collection =
      page === "plugins-installed"
        ? BUILTIN_PLUGINS_FROM_MANIFESTS.filter((plugin) =>
            AUTO_INSTALLED_PLUGIN_IDS_FROM_REGISTRY.has(plugin.id),
          )
        : BUILTIN_PLUGINS_FROM_MANIFESTS;
    return [...collection]
      .filter(
        (plugin) =>
          (page !== "plugins-browse" ||
            categoryFilter === "" ||
            PLUGIN_CATEGORY_BY_ID_FROM_REGISTRY[plugin.id] ===
              categoryFilter) &&
          (normalizedQuery === "" ||
            `${plugin.name} ${plugin.description}`
              .toLocaleLowerCase()
              .includes(normalizedQuery)),
      )
      .sort((left, right) => {
        const order = left.name.localeCompare(right.name);
        return sortDirection === "asc" ? order : -order;
      });
  }, [categoryFilter, page, query, sortDirection]);

  const navigate = (nextPage: ExtensionsPage) => {
    setPage(nextPage);
    setQuery("");
    setCategoryFilter("");
    setSelectedPluginId(null);
  };
  const togglePlugin = (pluginId: string) => {
    setEnabledPluginIds((current) => {
      const next = new Set(current);
      if (next.has(pluginId)) next.delete(pluginId);
      else next.add(pluginId);
      return next;
    });
  };

  return (
    <section className="ext-panel" aria-label="Extensions">
      <nav className="ext-sidebar" aria-label="Extensions collections">
        <div className="ext-nav-group">
          <span className="ext-nav-label">Plugins</span>
          <button
            type="button"
            className={
              page === "plugins-browse" ? "ext-nav-row active" : "ext-nav-row"
            }
            aria-current={page === "plugins-browse" ? "page" : undefined}
            onClick={() => navigate("plugins-browse")}
          >
            <HugeiconsIcon icon={ElectricPlugsIcon} aria-hidden="true" />
            Browse plugins
          </button>
          <button
            type="button"
            className={
              page === "plugins-installed"
                ? "ext-nav-row active"
                : "ext-nav-row"
            }
            aria-current={page === "plugins-installed" ? "page" : undefined}
            onClick={() => navigate("plugins-installed")}
          >
            <HugeiconsIcon icon={CheckListIcon} aria-hidden="true" />
            Installed plugins
          </button>
        </div>
        <div className="ext-nav-group">
          <span className="ext-nav-label">Skills</span>
          <button
            type="button"
            className={
              page === "skills-browse" ? "ext-nav-row active" : "ext-nav-row"
            }
            aria-current={page === "skills-browse" ? "page" : undefined}
            onClick={() => navigate("skills-browse")}
          >
            <HugeiconsIcon icon={ZapIcon} aria-hidden="true" />
            Browse skills
          </button>
          <button
            type="button"
            className={
              page === "skills-library" ? "ext-nav-row active" : "ext-nav-row"
            }
            aria-current={page === "skills-library" ? "page" : undefined}
            onClick={() => navigate("skills-library")}
          >
            <HugeiconsIcon icon={HiFolderIcon} aria-hidden="true" />
            My skills
          </button>
        </div>
      </nav>
      <div className="ext-content">
        {selectedPlugin ? (
          <div className="ext-detail">
            <button
              type="button"
              className="ext-back"
              onClick={() => setSelectedPluginId(null)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              {pageCopy.title}
            </button>
            <BuiltinPluginGlyph plugin={selectedPlugin} />
            <h2>{selectedPlugin.name}</h2>
            <p>{selectedPlugin.description}</p>
            <span className="ext-publisher">BB Official</span>
            {page === "plugins-installed" ? (
              <button
                type="button"
                className="ext-switch-row"
                role="switch"
                aria-checked={enabledPluginIds.has(selectedPlugin.id)}
                onClick={() => togglePlugin(selectedPlugin.id)}
              >
                Enabled
                <i className="ext-switch" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <header className="ext-heading">
              <p>{pageCopy.description}</p>
            </header>
            {page.startsWith("plugins-") ? (
              <>
                <div
                  className={
                    page === "plugins-browse"
                      ? "ext-toolbar ext-toolbar-browse"
                      : "ext-toolbar"
                  }
                >
                  <label className="ext-search">
                    <SearchGlyph className="ext-search-icon" />
                    <span className="sr-only">
                      {page === "plugins-installed"
                        ? "Search installed plugins"
                        : "Search plugins"}
                    </span>
                    <input
                      type="search"
                      value={query}
                      placeholder={
                        page === "plugins-installed"
                          ? "Search installed plugins"
                          : "Search plugins"
                      }
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  {page === "plugins-browse" ? (
                    <select
                      className="ext-tool ext-category"
                      aria-label="Category"
                      value={categoryFilter}
                      onChange={(event) =>
                        setCategoryFilter(event.target.value)
                      }
                    >
                      <option value="">Category</option>
                      {PLUGIN_CATEGORIES_FROM_REGISTRY.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      className="ext-tool"
                      aria-pressed={officialOnly}
                      onClick={() => setOfficialOnly((current) => !current)}
                    >
                      Type · BB Official
                    </button>
                  )}
                  <button
                    type="button"
                    className="ext-tool"
                    aria-label={`Plugin name, ${sortDirection === "asc" ? "ascending" : "descending"}`}
                    onClick={() =>
                      setSortDirection((current) =>
                        current === "asc" ? "desc" : "asc",
                      )
                    }
                  >
                    Plugin name
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      aria-hidden="true"
                      className={
                        sortDirection === "desc" ? "ext-sort desc" : "ext-sort"
                      }
                    />
                  </button>
                </div>
                {visiblePlugins.length === 0 ? (
                  <div className="ext-empty">No plugins match “{query}”</div>
                ) : page === "plugins-installed" ? (
                  <div className="ext-list">
                    {visiblePlugins.map((plugin) => (
                      <div key={plugin.id} className="ext-row">
                        <button
                          type="button"
                          className="ext-row-open"
                          onClick={() => setSelectedPluginId(plugin.id)}
                        >
                          <BuiltinPluginGlyph plugin={plugin} />
                          <span className="ext-row-copy">
                            <strong>{plugin.name}</strong>
                            <span>{plugin.description}</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="ext-switch-button"
                          role="switch"
                          aria-label={`${plugin.name} enabled`}
                          aria-checked={enabledPluginIds.has(plugin.id)}
                          onClick={() => togglePlugin(plugin.id)}
                        >
                          <i className="ext-switch" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ext-grid">
                    {visiblePlugins.map((plugin) => (
                      <button
                        key={plugin.id}
                        type="button"
                        className="ext-card"
                        onClick={() => setSelectedPluginId(plugin.id)}
                      >
                        <BuiltinPluginGlyph plugin={plugin} />
                        <strong>{plugin.name}</strong>
                        <span>{plugin.description}</span>
                        <em>BB Official</em>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="ext-empty ext-skills-empty">
                <HugeiconsIcon icon={ZapIcon} aria-hidden="true" />
                {page === "skills-library"
                  ? "No skills in your library."
                  : "No skills.sh resources available."}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

const CREATE_AUTOMATION_PROMPT_FROM_SOURCE = "Create a new bb automation to ";
const AUTOMATION_CREATE_TEMPLATES_FROM_SOURCE = [
  {
    label: "CI failure triage",
    description:
      "runs every weekday morning, checks failed main-branch CI, and opens fixer threads only for new failures",
    prompt: `${CREATE_AUTOMATION_PROMPT_FROM_SOURCE}runs every weekday morning, checks failed main-branch CI, and opens fixer threads only for new failures.`,
  },
  {
    label: "Dependency drift",
    description:
      "checks weekly for stale dependencies and opens an update thread when risk is low",
    prompt: `${CREATE_AUTOMATION_PROMPT_FROM_SOURCE}checks weekly for stale dependencies and opens an update thread when risk is low.`,
  },
  {
    label: "Release readiness",
    description:
      "checks the release branch hourly, summarizes blocking checks, and alerts only when the status changes",
    prompt: `${CREATE_AUTOMATION_PROMPT_FROM_SOURCE}checks the release branch hourly, summarizes blocking checks, and alerts only when the status changes.`,
  },
  {
    label: "Stale worktrees",
    description:
      "checks daily for stale worktrees and opens cleanup threads only after they exceed the team's retention window",
    prompt: `${CREATE_AUTOMATION_PROMPT_FROM_SOURCE}checks daily for stale worktrees and opens cleanup threads only after they exceed the team's retention window.`,
  },
] as const;

function AutomationsPanelMock() {
  const [mode, setMode] = useState<"installed" | "browse">("browse");
  const [installedQuery, setInstalledQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">(
    "all",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  return (
    <section className="auto-panel" aria-label="Automations">
      <header className="auto-heading">
        <div>
          <p>
            Manage scheduled bb work across projects and folders. Automations
            run recurring or one-time tasks without manual prompting.
          </p>
        </div>
        <button
          type="button"
          className="auto-new"
          onClick={() => {
            setMode("browse");
          }}
        >
          <PlusGlyph />
          New automation
        </button>
      </header>
      <div className="auto-modes" aria-label="Automation collection">
        <button
          type="button"
          className={mode === "installed" ? "active" : undefined}
          aria-pressed={mode === "installed"}
          onClick={() => {
            setMode("installed");
          }}
        >
          Installed
        </button>
        <button
          type="button"
          className={mode === "browse" ? "active" : undefined}
          aria-pressed={mode === "browse"}
          onClick={() => setMode("browse")}
        >
          Browse
        </button>
      </div>
      {mode === "browse" ? (
        <div className="auto-grid">
          {AUTOMATION_CREATE_TEMPLATES_FROM_SOURCE.map((candidate) => (
            <article key={candidate.label} className="auto-card">
              <h3>{candidate.label}</h3>
              <button
                type="button"
                className="auto-card-use"
                aria-label={`Use template: ${candidate.label}`}
                title="Use template"
              >
                <HugeiconsIcon icon={BubbleChatAddIcon} aria-hidden="true" />
              </button>
              <p>{candidate.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="auto-installed">
          <div className="auto-toolbar">
            <label className="auto-search">
              <SearchGlyph />
              <span className="sr-only">Search automations</span>
              <input
                type="search"
                placeholder="Search automations"
                value={installedQuery}
                onChange={(event) => setInstalledQuery(event.target.value)}
              />
            </label>
            <button type="button" disabled>
              Projects
            </button>
            <button
              type="button"
              aria-label={`Status filter: ${statusFilter}`}
              onClick={() =>
                setStatusFilter((current) =>
                  current === "all"
                    ? "active"
                    : current === "active"
                      ? "paused"
                      : "all",
                )
              }
            >
              Status
              {statusFilter === "all"
                ? ""
                : ` · ${statusFilter === "active" ? "Active" : "Paused"}`}
            </button>
            <button
              type="button"
              aria-label={`Automation name, ${sortDirection === "asc" ? "ascending" : "descending"}`}
              onClick={() =>
                setSortDirection((current) =>
                  current === "asc" ? "desc" : "asc",
                )
              }
            >
              Automation name
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                aria-hidden="true"
                className={
                  sortDirection === "desc" ? "auto-sort desc" : "auto-sort"
                }
              />
            </button>
          </div>
          <div className="auto-empty">No automations installed.</div>
        </div>
      )}
    </section>
  );
}

/* ────────────────────────────────────────────────
 * SUBAGENTS STORYBOARD (loops while in view)
 *
 *      0ms   parent row working (spinner); the rail rests around it
 *    900ms   child row slides in, nested, working
 *   3200ms   child completes; "reported back" lands under it
 *   4000ms   parent absorbs the report, completes
 *  11500ms   loop restarts (the rail rests settled ~65% of the loop)
 *   rest     both settled — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const SUB_BEATS = [900, 3200, 4000];
const SUB_RESET = 11500;

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

/** The real sidebar's quiet rows end in a small unread dot. */
function QuietRow({ title }: { title: string }) {
  return (
    <div className="sub-row sub-quiet">
      <span className="sub-title">{title}</span>
      <i className="sub-dot" />
    </div>
  );
}

/* Every row in the rail opens, exactly as it does in the app. The demo
 * rests on the finished spawn — parent, nested child, report — and the
 * visitor browses it. (The pane used to hold skeleton bars; a real
 * transcript per thread is both truer and worth touching.) */
const SUB_THREADS = [
  {
    id: "parent",
    title: "Expand README testing documentation",
    kind: "parent",
    lines: [
      { kind: "step", text: "Explored 2 files" },
      {
        kind: "say",
        text: "The Testing section never named the risky part. Spawning a thread to find the real edge cases.",
      },
      { kind: "step", text: "Spawned 1 subagent" },
      {
        kind: "say",
        text: "Rewrote the section around its report. Committed.",
      },
    ],
  },
  {
    id: "child",
    title: "Identify missing promo edge cases",
    kind: "child",
    lines: [
      { kind: "step", text: "Read promo.test.ts" },
      {
        kind: "say",
        text: "Two gaps: codes that collide with object prototype keys, and empty carts.",
      },
      { kind: "step", text: "Reported to parent" },
    ],
  },
  {
    id: "trace",
    title: "Trace order checkout flow",
    kind: "quiet",
    lines: [
      { kind: "step", text: "Explored 4 files" },
      {
        kind: "say",
        text: "Cart to promo to order. The confirmation reads the order, never the cart.",
      },
    ],
  },
  {
    id: "cart",
    title: "Summarize checkout cart integration",
    kind: "quiet",
    lines: [
      { kind: "step", text: "Explored 3 files" },
      {
        kind: "say",
        text: "The cart owns totals; checkout only posts them. One source of truth.",
      },
    ],
  },
  {
    id: "coverage",
    title: "Audit promo test coverage gaps",
    kind: "quiet",
    lines: [
      { kind: "step", text: "Ran the suite" },
      {
        kind: "say",
        text: "24 passing, but nothing covers stacked codes. That is the gap.",
      },
    ],
  },
] as const;

const SUB_API_THREADS = [
  {
    id: "errors",
    title: "Explain orders error handling",
    kind: "quiet",
    lines: [
      { kind: "step", text: "Read src/routes/orders.ts" },
      {
        kind: "say",
        text: "An empty cart 400s before anything is written. Nothing else is guarded yet.",
      },
    ],
  },
  {
    id: "route",
    title: "Summarize service route",
    kind: "quiet",
    lines: [
      { kind: "step", text: "Read the route" },
      {
        kind: "say",
        text: "One POST. It validates, then returns the created order.",
      },
    ],
  },
] as const;

function SubagentsDemo() {
  const [openId, setOpenId] = useState("parent");
  const all = [...SUB_THREADS, ...SUB_API_THREADS];
  const open = all.find((t) => t.id === openId) ?? all[0];
  const row = (t: (typeof all)[number]) => (
    <button
      key={t.id}
      type="button"
      className={
        (t.kind === "child" ? "sub-row sub-child in" : "sub-row") +
        (t.kind === "quiet" ? " sub-quiet" : "") +
        (openId === t.id ? " is-open" : "")
      }
      aria-pressed={openId === t.id}
      onClick={() => withViewTransition(() => setOpenId(t.id))}
    >
      <span className="sub-title">{t.title}</span>
      {openId === t.id ? null : <i className="sub-dot" />}
    </button>
  );
  return (
    <div className="sub-demo">
      <div className="sub-rail">
        <div className="sub-top" aria-hidden>
          <span className="sub-newthread">
            <NewThreadIcon className="sub-top-ic" />
            New thread
          </span>
          <SearchGlyph className="sub-top-ic sub-search" />
        </div>
        <span className="sub-group" aria-hidden>
          storefront
        </span>
        {row(SUB_THREADS[0])}
        {/* The app draws one hairline down the whole child group, not a stub
            per row, and children are set apart by indent alone. */}
        <div className="sub-kids">
          <i className="sub-guide" aria-hidden />
          {row(SUB_THREADS[1])}
        </div>
        {SUB_THREADS.slice(2).map(row)}
        <span className="sub-group sub-gap" aria-hidden>
          checkout-api
        </span>
        {SUB_API_THREADS.map(row)}
      </div>
      {/* Picking a thread replaces the pane wholesale, so it is the state
          change that most wants a morph — the technique the retired board
          toggle used to carry. */}
      <div className="sub-main" style={{ viewTransitionName: "sub-pane" }}>
        <span className="sub-main-title">{open.title}</span>
        {open.lines.map((l) => (
          <p
            key={l.text}
            className={l.kind === "step" ? "gang-step in" : "gang-say in"}
          >
            {l.text}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * ASK STORYBOARD (loops while in view)
 *
 *      0ms   question card resting, no selection
 *   1100ms   highlight lands on "Single code per cart"
 *   2100ms   radio fills — selected
 *   2900ms   Submit arms (primary)
 *   3800ms   submit presses; the card answers and the follow-up work
 *            streams in past the frame's dissolve
 *  12800ms   loop restarts (the card rests answered ~70% of the loop)
 *   rest     answered — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const ASK_BEATS = [1100, 2100, 2900, 3800];
const ASK_RESET = 12800;

// The real AskUserQuestion card: option label + a one-line consequence,
// a keyboard-shortcut numeral per row, and a trailing "Other…".
const ASK_OPTIONS = [
  {
    label: "Single code per cart",
    desc: "A new code replaces the applied one. Simplest to reason about.",
    outcome:
      "Enforcing one code per cart. The newest code replaces the one already applied, and the stacking branch comes out of the engine.",
  },
  {
    label: "Allow stacking",
    desc: "Codes combine, with precedence rules and discount guards.",
    outcome:
      "Stacking it is. Codes combine in precedence order, with a floor guard so a cart can never discount past zero.",
  },
  {
    label: "Depends on the campaign",
    desc: "Stackability becomes a per-code attribute the engine enforces.",
    outcome:
      "Making stackability a per-code attribute. The engine checks compatibility at apply time instead of guessing.",
  },
  { label: "Other…", desc: "", outcome: "Say the word and I will take that route instead." },
] as const;

/* The Ask card does not perform. It waits — which is what the product
 * does — and answers to the visitor. Resting state IS the question, so
 * prerender, no-JS and reduced motion all show a real, complete card. */
function AskDemo() {
  const [picked, setPicked] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const chosen = ASK_OPTIONS[picked ?? 0];
  return (
    <div className="ask-demo">
      <p className="ask-wait" aria-hidden>
        <MessageQuestionGlyph className="ask-wait-ic" />
        <span>
          Waiting for <strong>answer</strong>
        </span>
        <span className="ask-wait-q">
          Should the promo engine support stacking codes…
        </span>
      </p>
      {sent ? (
        <div className="ask-card">
          <div className="ask-answered">
            <DemoCheck />
            <span>
              Answered — <strong>{chosen.label}</strong>
            </span>
          </div>
          <p className="ask-after" style={{ animationDelay: "0.12s" }}>
            {chosen.outcome}
          </p>
          <p className="ask-step" style={{ animationDelay: "0.26s" }}>
            Edited applyPromo.ts
          </p>
          <p className="ask-step" style={{ animationDelay: "0.4s" }}>
            Added 4 tests
          </p>
          <p className="ask-step" style={{ animationDelay: "0.54s" }}>
            Ran 24 tests
          </p>
          <p className="ask-after" style={{ animationDelay: "0.68s" }}>
            All green. The promo engine follows your call.
          </p>
        </div>
      ) : (
        <div className="ask-card">
          <p className="ask-q">
            Should the promo engine support stacking codes, or one per cart?
          </p>
          <ul>
            {ASK_OPTIONS.map((opt, i) => (
              <li key={opt.label}>
                <button
                  type="button"
                  className={picked === i ? "ask-opt selected" : "ask-opt"}
                  aria-pressed={picked === i}
                  onClick={() => setPicked(i)}
                >
                  <i className="ask-radio" />
                  <span className="ask-text">
                    <span className="ask-label">{opt.label}</span>
                    {opt.desc ? (
                      <span className="ask-desc">{opt.desc}</span>
                    ) : null}
                  </span>
                  <span className="ask-num">{i + 1}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="ask-foot">
            <span>Cancel</span>
            <button
              type="button"
              className={picked !== null ? "ask-submit armed" : "ask-submit"}
              disabled={picked === null}
              onClick={() => setSent(true)}
            >
              Submit answer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const BOARD_STATUS_LABELS: Record<BoardTaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

// The five always-visible statuses from plugins/tasks/views/board/drop-position.ts.
const BOARD_STATUSES_FROM_SOURCE: readonly BoardTaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

type SeededTask = {
  key: string;
  title: string;
  description: string | null;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  parentKey: string | null;
  labels: readonly string[];
  subDone: number;
  subTotal: number;
};

// Auditable fixture from plugins/tasks/cli/seed.ts. The board excludes the
// parented TASKS-3 card, matching fetchBoard in views/board/index.tsx.
const TASKS_PLUGIN_SEED_FROM_SOURCE: readonly SeededTask[] = [
  {
    key: "TASKS-1",
    title: "Polish the task detail panel",
    description: "Finish the detail view and verify markdown rendering.",
    status: "in_progress",
    priority: "urgent",
    parentKey: null,
    labels: ["UX"],
    subDone: 0,
    subTotal: 1,
  },
  {
    key: "TASKS-2",
    title: "Add CLI smoke coverage",
    description: "Cover the canonical create, list, show, and update flow.",
    status: "in_review",
    priority: "high",
    parentKey: null,
    labels: ["Backend"],
    subDone: 0,
    subTotal: 0,
  },
  {
    key: "TASKS-3",
    title: "Document project linking",
    description: null,
    status: "todo",
    priority: "medium",
    parentKey: "TASKS-1",
    labels: ["Backend", "UX"],
    subDone: 0,
    subTotal: 0,
  },
  {
    key: "TASKS-4",
    title: "Archive the old prototype notes",
    description: null,
    status: "done",
    priority: "low",
    parentKey: null,
    labels: [],
    subDone: 0,
    subTotal: 0,
  },
];

const BOARD_COLUMNS_FROM_SOURCE = BOARD_STATUSES_FROM_SOURCE.map((status) => ({
  status,
  name: BOARD_STATUS_LABELS[status],
  cards: TASKS_PLUGIN_SEED_FROM_SOURCE.filter(
    (task) => task.parentKey === null && task.status === status,
  ),
}));

type BoardDraft =
  | { kind: "task"; status: BoardTaskStatus }
  | { kind: "project" }
  | { kind: "preset" };

/* The board rests in a real, complete state and answers the visitor: the
 * List/Board control is a real control, and cards respond to the pointer.
 * Nothing animates on its own — a task board that deals itself is a
 * screensaver, not a product. */
/** Runs a state change inside a view transition when the browser has one.
 *  Everything the transition needs is declarative — matching
 *  `view-transition-name`s across the two states — so where the API is
 *  missing, or motion is not wanted, this is just the state change and the
 *  swap is instant. */
function withViewTransition(change: () => void) {
  const start = (
    document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    }
  ).startViewTransition;
  if (
    typeof start !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    change();
    return;
  }
  start.call(document, change);
}

function TasksBoardDemo() {
  const [view, setView] = useState<"board" | "list">("board");
  const [scope, setScope] = useState<"project" | "all" | "active">("project");
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<BoardDraft | null>(null);
  const [refreshRevision, setRefreshRevision] = useState(0);
  const selectedTask =
    TASKS_PLUGIN_SEED_FROM_SOURCE.find(
      (task) => task.key === selectedTaskKey,
    ) ?? null;
  const listed = scope === "active" ? [] : TASKS_PLUGIN_SEED_FROM_SOURCE;

  const navigateScope = (nextScope: "project" | "all" | "active") => {
    setScope(nextScope);
    setSelectedTaskKey(null);
    setDraft(null);
    setView(nextScope === "project" ? "board" : "list");
  };

  return (
    <section className="board-demo" aria-label="Tasks">
      <div className="board-chrome" aria-hidden>
        <ChecklistGlyph className="board-chrome-ic" />
        <span className="board-chrome-title">Tasks</span>
        <PanelRightIcon className="board-chrome-ic board-chrome-panel" />
      </div>
      <div className="board-bar">
        <button
          type="button"
          className="board-project"
          onClick={() => navigateScope("project")}
        >
          {scope === "project" ? <i className="board-proj-dot" /> : null}
          {scope === "project"
            ? "Tasks Plugin"
            : scope === "all"
              ? "All tasks"
              : "Active"}
        </button>
        {scope === "project" ? (
          <span className="board-seg">
            {(["list", "board"] as const).map((nextView) => (
              <button
                key={nextView}
                type="button"
                className={view === nextView ? "on" : undefined}
                aria-pressed={view === nextView}
                onClick={() => setView(nextView)}
              >
                {nextView === "list" ? "List" : "Board"}
              </button>
            ))}
          </span>
        ) : null}
        <button
          type="button"
          className="board-refresh"
          aria-label="Refresh tasks"
          onClick={() => setRefreshRevision((revision) => revision + 1)}
        >
          <RefreshGlyph />
        </button>
        <span className="sr-only" aria-live="polite">
          {refreshRevision > 0 ? "Tasks refreshed" : ""}
        </span>
        <button
          type="button"
          className="board-new"
          onClick={() => setDraft({ kind: "task", status: "todo" })}
        >
          <PlusGlyph className="board-new-ic" />
          New task
        </button>
      </div>
      <div className="board-main">
        {scope === "project" && view === "board" ? (
          <>
            <div className="board-cols">
              {BOARD_COLUMNS_FROM_SOURCE.map((col) => (
                <div key={col.name} className="board-col">
                  <div className="board-col-head">
                    <BoardStatusGlyph status={col.status} />
                    <span>{col.name}</span>
                    <em>{col.cards.length}</em>
                    <button
                      type="button"
                      className="board-col-add"
                      aria-label={`New ${col.name} task`}
                      onClick={() =>
                        setDraft({ kind: "task", status: col.status })
                      }
                    >
                      <PlusGlyph />
                    </button>
                  </div>
                  <div className="board-col-cards">
                    {col.cards.map((card) => (
                      <button
                        key={card.key}
                        type="button"
                        className={
                          selectedTaskKey === card.key
                            ? "board-card selected"
                            : "board-card"
                        }
                        onClick={() => setSelectedTaskKey(card.key)}
                      >
                        <span className="board-id">{card.key}</span>
                        <span className="board-card-title">{card.title}</span>
                        <span className="board-card-meta">
                          <PriorityGlyph priority={card.priority} />
                          {card.labels.map((label) => (
                            <span key={label} className="board-label">
                              <i
                                className={`board-label-dot board-label-${label.toLocaleLowerCase()}`}
                                aria-hidden="true"
                              />
                              {label}
                            </span>
                          ))}
                          {card.subTotal > 0 ? (
                            <span className="board-subtasks">
                              <HugeiconsIcon
                                icon={HiGitBranchIcon}
                                aria-hidden="true"
                              />
                              {card.subDone}/{card.subTotal}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="board-mobile-list">
              {TASKS_PLUGIN_SEED_FROM_SOURCE.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  className={
                    card.parentKey === null
                      ? "board-lrow"
                      : "board-lrow board-lrow-child"
                  }
                  onClick={() => setSelectedTaskKey(card.key)}
                >
                  <BoardStatusGlyph status={card.status} />
                  <span className="board-lid">{card.key}</span>
                  <span className="board-ltitle">{card.title}</span>
                  <PriorityGlyph priority={card.priority} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="board-list">
            {scope === "active" ? (
              <div className="board-empty">
                <HugeiconsIcon icon={ZapIcon} aria-hidden="true" />
                <strong>No agents working right now</strong>
                <span>
                  Dispatch a task to an agent preset and it will show up here
                  while it runs.
                </span>
              </div>
            ) : (
              listed.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  className={
                    card.parentKey === null
                      ? "board-lrow"
                      : "board-lrow board-lrow-child"
                  }
                  onClick={() => setSelectedTaskKey(card.key)}
                >
                  <BoardStatusGlyph status={card.status} />
                  <span className="board-lid">{card.key}</span>
                  <span className="board-ltitle">{card.title}</span>
                  <PriorityGlyph priority={card.priority} />
                </button>
              ))
            )}
          </div>
        )}
        <aside className="board-rail" aria-label="Tasks navigation">
          {selectedTask ? (
            <div className="board-detail">
              <button
                type="button"
                className="board-detail-back"
                onClick={() => setSelectedTaskKey(null)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
                Back
              </button>
              <span className="board-detail-key">{selectedTask.key}</span>
              <strong>{selectedTask.title}</strong>
              {selectedTask.description ? (
                <p>{selectedTask.description}</p>
              ) : null}
              <span className="board-detail-prop">
                <BoardStatusGlyph status={selectedTask.status} />
                {BOARD_STATUS_LABELS[selectedTask.status]}
              </span>
              <span className="board-detail-prop">
                <PriorityGlyph priority={selectedTask.priority} />
                {selectedTask.priority === "none"
                  ? "No priority"
                  : `${selectedTask.priority[0]!.toUpperCase()}${selectedTask.priority.slice(1)}`}
              </span>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={scope === "all" ? "brail-row active" : "brail-row"}
                aria-current={scope === "all" ? "page" : undefined}
                onClick={() => navigateScope("all")}
              >
                <strong>All tasks</strong>
                <em>{TASKS_PLUGIN_SEED_FROM_SOURCE.length}</em>
              </button>
              <button
                type="button"
                className={
                  scope === "active" ? "brail-row active" : "brail-row"
                }
                aria-current={scope === "active" ? "page" : undefined}
                onClick={() => navigateScope("active")}
              >
                <strong>Active</strong>
                <em>0</em>
              </button>
              <span className="brail-label">Projects</span>
              <button
                type="button"
                className={
                  scope === "project" ? "brail-row active" : "brail-row"
                }
                aria-current={scope === "project" ? "page" : undefined}
                onClick={() => navigateScope("project")}
              >
                <i className="board-proj-dot" />
                <strong>Tasks Plugin</strong>
                <em>{TASKS_PLUGIN_SEED_FROM_SOURCE.length}</em>
              </button>
              <button
                type="button"
                className="brail-row brail-ghost"
                onClick={() => setDraft({ kind: "project" })}
              >
                <PlusGlyph className="brail-ic" />
                New project
              </button>
              <span className="brail-label">Agent presets</span>
              <span className="brail-note">No presets yet.</span>
              <button
                type="button"
                className="brail-row brail-ghost"
                onClick={() => setDraft({ kind: "preset" })}
              >
                <PlusGlyph className="brail-ic" />
                New preset
              </button>
            </>
          )}
        </aside>
      </div>
      {draft ? (
        <form
          className="board-draft"
          role="dialog"
          aria-modal={false}
          aria-labelledby="board-draft-title"
          onSubmit={(event) => event.preventDefault()}
        >
          <h3 id="board-draft-title">
            {draft.kind === "task"
              ? "New task · Tasks Plugin"
              : draft.kind === "project"
                ? "New project"
                : "New preset"}
          </h3>
          {draft.kind === "task" ? (
            <>
              <input
                autoFocus
                aria-label="Task title"
                placeholder="Task title"
              />
              <textarea
                aria-label="Description"
                placeholder="Description — rich text, round-trips as markdown for agents"
              />
              <span className="board-draft-status">
                <BoardStatusGlyph status={draft.status} />
                {BOARD_STATUS_LABELS[draft.status]}
              </span>
            </>
          ) : draft.kind === "project" ? (
            <>
              <p>Projects group tasks under a shared key prefix.</p>
              <label>
                Name
                <input autoFocus placeholder="e.g. Tasks Plugin" />
              </label>
              <label>
                Prefix
                <input placeholder="TSK" />
              </label>
            </>
          ) : (
            <>
              <p>
                Presets pick the provider, model, and guardrails for dispatched
                threads.
              </p>
              <label>
                Name
                <input autoFocus placeholder="e.g. Sonnet · high" />
              </label>
            </>
          )}
          <div className="board-draft-actions">
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="submit" disabled>
              {draft.kind === "task"
                ? "Create task"
                : draft.kind === "project"
                  ? "Create project"
                  : "Create preset"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

/* ────────────────────────────────────────────────
 * REVIEW STORYBOARD (loops while in view)
 *
 *      0ms   the changes header and the file card, no hunk
 *    400ms   diff lines land, 70ms apart, gutter bars with them
 *   2400ms   the second file card arrives below
 *   3400ms   Commit arms
 *  10000ms   loop restarts (the diff rests armed ~65% of the loop)
 *   rest     full diff, armed — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const REVIEW_BEATS = [400, 2400, 3400];
const REVIEW_RESET = 10000;

// One hunk of applyPromo.ts, numbered like the real Changes panel: the
// deleted line keeps its old number; the replacement lines take over.
const REVIEW_LINES = [
  { sign: " ", no: "21", text: "export function applyPromo(cart, code) {" },
  { sign: "-", no: "22", text: "  const percent = PERCENT_CODES[code] ?? 0;" },
  { sign: "+", no: "22", text: "  const percent = Object.hasOwn(" },
  { sign: "+", no: "23", text: "    PERCENT_CODES, code," },
  { sign: "+", no: "24", text: "  ) ? PERCENT_CODES[code] : 0;" },
  { sign: " ", no: "25", text: "  const subtotal = cart.items.reduce(sum, 0);" },
  { sign: " ", no: "26", text: "  return round(subtotal * (1 - percent));" },
  { sign: " ", no: "27", text: "}" },
] as const;

function ReviewDemo() {
  const { ref, stage } = useLoopStage(REVIEW_BEATS, REVIEW_RESET);
  const settled = stage >= REVIEW_BEATS.length;
  const landed = stage >= 1 || settled;
  return (
    <div className="review-demo" ref={ref} aria-hidden>
      <div className="review-head">
        <span className="review-scope">
          All changes
          <ChevronDown className="review-chev" />
        </span>
        <span className="review-count">
          2 files,
          <em className="review-add">+7</em>
          <em className="review-del">-1</em>
        </span>
        <span
          className={
            stage >= 3 || settled ? "review-commit armed" : "review-commit"
          }
        >
          Commit
        </span>
      </div>
      <div className="review-file-card">
        <div className="review-file-head">
          <ChevronDown className="review-chev" />
          <span className="review-file">applyPromo.ts</span>
          <span className="review-count">
            <em className="review-add">+3</em>
            <em className="review-del">-1</em>
          </span>
        </div>
        <div className="review-fold">
          <ChevronDown className="review-chev review-fold-chev" />
          20 unmodified lines
        </div>
        <div className="review-hunk">
          {REVIEW_LINES.map((l, i) => (
            <p
              key={`${l.no}-${l.sign}`}
              className={
                (landed ? "review-line in" : "review-line") +
                (l.sign === "+" ? " is-add" : l.sign === "-" ? " is-del" : "")
              }
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <span className="review-no">{l.no}</span>
              <span className="review-sign">{l.sign}</span>
              {l.text}
            </p>
          ))}
        </div>
      </div>
      <div
        className={
          stage >= 2 || settled
            ? "review-file-card review-file2 in"
            : "review-file-card review-file2"
        }
      >
        <div className="review-file-head">
          <ChevronRight className="review-chev" />
          <span className="review-file">promo.test.ts</span>
          <span className="review-count">
            <em className="review-add">+4</em>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Signal bars and a battery. Not from the icon set — these are phone
 *  hardware chrome, not product iconography. */
const SignalGlyph = () => (
  <svg viewBox="0 0 16 12" fill="currentColor" aria-hidden>
    <rect x="0" y="8" width="2.6" height="4" rx="0.8" />
    <rect x="4.2" y="5.5" width="2.6" height="6.5" rx="0.8" />
    <rect x="8.4" y="3" width="2.6" height="9" rx="0.8" />
    <rect x="12.6" y="0.5" width="2.6" height="11.5" rx="0.8" />
  </svg>
);

const BatteryGlyph = () => (
  <svg viewBox="0 0 20 12" fill="none" aria-hidden>
    <rect
      x="0.6"
      y="1.4"
      width="15.6"
      height="9.2"
      rx="2.6"
      stroke="currentColor"
      strokeOpacity="0.5"
      strokeWidth="1.1"
    />
    <rect x="2.3" y="3.1" width="11" height="5.8" rx="1.4" fill="currentColor" />
    <path
      d="M18 4.6v2.8c.9-.3 1.4-.8 1.4-1.4S18.9 4.9 18 4.6Z"
      fill="currentColor"
      fillOpacity="0.5"
    />
  </svg>
);

/* bb's own question, on a phone. The thread paused for a decision and it
 * reached you where you are — tapping an option answers it and the agent
 * carries on, which is the claim the desktop ask card made, minus the
 * assumption that you were sitting in front of it. */
function AskPhone() {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : ASK_OPTIONS[picked];
  return (
    <div className="ap">
      <div className="ap-bar">
        <span className="ap-back" aria-hidden>
          <ChevronLeft className="ap-back-ic" />
        </span>
        <span className="ap-head">
          <span className="ap-thread">Audit promo code coverage</span>
          <span className="ap-proj">storefront</span>
        </span>
        <span className="ap-av" aria-hidden>
          <OpenAiIcon className="ap-av-ic" />
        </span>
      </div>
      <div className="ap-body">
        {/* What the thread was doing when it stopped, so the question has
            somewhere to have come from. */}
        <p className="ap-step">Edited promo.test.ts</p>
        <p className="ap-say">
          Four cases added. Before I pin the behaviour I need one decision.
        </p>
        <div className="ap-card">
          <span className={chosen ? "ap-wait answered" : "ap-wait"}>
            {chosen ? (
              <CheckIcon className="ap-wait-ic" />
            ) : (
              <HugeiconsIcon
                icon={MessageQuestionIcon}
                className="ap-wait-ic"
              />
            )}
            {chosen ? "Answered" : "Waiting for you"}
          </span>
          <p className="ap-q">
            Should the promo engine support stacking codes, or one per cart?
          </p>
          {/* Answering resolves the interrupt in place, dropping the options
              it no longer needs. It also keeps the reply above the card's
              lower edge — the device is clipped by the bento card, and a
              payoff below that line is a payoff nobody sees. */}
          <div className="ap-opts">
            {ASK_OPTIONS.slice(0, 3).map((o, i) =>
              chosen && picked !== i ? null : (
                <button
                  key={o.label}
                  type="button"
                  className={picked === i ? "ap-opt on" : "ap-opt"}
                  aria-pressed={picked === i}
                  onClick={() => setPicked(i)}
                >
                  <i className="ap-radio" />
                  <span className="ap-label">{o.label}</span>
                </button>
              ),
            )}
          </div>
          {chosen ? <p className="ap-reply">{chosen.outcome}</p> : null}
        </div>
        {chosen ? null : (
          <p className="ap-hint">Tap an answer and the thread carries on.</p>
        )}
      </div>
    </div>
  );
}

/* The mark at the end of the page is a button, and pressing it cycles the
 * bb wordmark through a set of stickers made by running the real icon
 * through Kumori. It always starts on the real mark and one more press
 * returns to it, so the page's own identity is what a visitor sees unless
 * they go looking. Nothing depends on it: no copy refers to it, and a
 * reader who never clicks loses nothing. */
// One sticker, not four. The holo, felt and clay passes read as a different
// universe from a page built out of hairlines and flat tokens; the risograph
// is flat and printed and belongs. A cycle of one is just a toggle, which is
// enough of an easter egg until there are more that earn their place.
const BB_STICKERS = [{ src: bbStickerRiso, name: "risograph" }] as const;

function CloserMark() {
  const [index, setIndex] = useState(0);
  const [popping, setPopping] = useState(false);
  const sticker = index === 0 ? null : BB_STICKERS[index - 1];

  const next = () => {
    setIndex((i) => (i + 1) % (BB_STICKERS.length + 1));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPopping(true);
    window.setTimeout(() => setPopping(false), 420);
  };

  return (
    <button
      type="button"
      className={popping ? "closer-mark-btn pop" : "closer-mark-btn"}
      onClick={next}
      aria-label={
        sticker
          ? `bb, as a ${sticker.name} sticker. Press for the next one.`
          : "bb. Press to see it as a sticker."
      }
    >
      <img
        src={sticker ? sticker.src : bbIconLarge}
        alt=""
        className="closer-mark"
        width={72}
        height={72}
        draggable={false}
      />
    </button>
  );
}

/* ────────────────────────────────────────────────
 * PHONE
 *
 * A real device frame with live DOM behind its aperture: the bezel, rails
 * and buttons are one SVG overlay, and the screen is a flex column holding
 * the status bar, the app, and the home indicator. Nothing here claims bb
 * ships a native app — what runs on these screens is Telegram, and bb's own
 * question arriving where you are.
 * ──────────────────────────────────────────────── */
function Phone({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="phone" role="img" aria-label={label}>
      <div className="phone-screen">
        <div className="phone-status" aria-hidden>
          <span>9:41</span>
          <span className="phone-status-right">
            <SignalGlyph />
            <BatteryGlyph />
          </span>
        </div>
        <div className="phone-app">{children}</div>
        <span className="phone-home" aria-hidden />
      </div>
      <span className="phone-island" aria-hidden />
      <img src={phoneBezel} alt="" className="phone-bezel" aria-hidden />
    </div>
  );
}

/* A Telegram chat with your own bb: the `connect` plugin puts this machine at
 * <handle>.getbb.app, so anything that can reach an HTTPS endpoint can call
 * `bb thread spawn`. You text a request, bb acks with the command it ran, and
 * a thread card lands and goes spawning → running. The shell stays put; the
 * messages arrive once and stay.
 *
 * The bot is bb, not an agent. Hermes is a real ACP provider
 * (known-acp-agents.ts: `hermes acp`) that can run a thread once it exists —
 * which is why it appears in the agent rail and not in this title bar. */
function AgentChat() {
  // The card ends on the live thread rather than on a "done" message: a
  // fourth bubble pushed the conversation past the edge the bento clips at,
  // so the payoff would have been written and never seen.
  return (
    <div className="tg">
      <div className="tg-bar">
        <ChevronLeft className="tg-back" />
        <span className="tg-contact">
          <span className="tg-name">bb</span>
          <span className="tg-sub">bot</span>
        </span>
        <span className="tg-av" aria-hidden>
          <span className="bb-mark tg-av-mark" />
        </span>
      </div>
      <div className="tg-feed">
        <div className="tg-msgs">
          <div className="tg-msg tg-out" style={{ animationDelay: "0.3s" }}>
            <span className="tg-bubble">
              spawn a thread: audit our promo code coverage
              <span className="tg-time">9:41</span>
            </span>
          </div>
          <div className="tg-msg tg-in" style={{ animationDelay: "1.4s" }}>
            <span className="tg-bubble">
              On it. Spawning a worker thread.
              <span className="tg-cmd mono">bb thread spawn</span>
            </span>
          </div>
          <div className="tg-msg tg-in" style={{ animationDelay: "2.4s" }}>
            <div className="tg-thread">
              <div className="tg-thread-top">
                <span aria-hidden="true" className="bb-mark tg-thread-mark" />
                <span className="tg-thread-eyebrow">Worker thread</span>
                <span className="tg-stat" aria-hidden>
                  <span
                    className="tg-stat-spawn"
                    style={{ animationDelay: "3.5s" }}
                  >
                    <Spinner className="tg-spin" />
                    spawning
                  </span>
                  <span
                    className="tg-stat-run"
                    style={{ animationDelay: "3.5s" }}
                  >
                    <span className="tg-rdot" />
                    running
                  </span>
                </span>
              </div>
              <div className="tg-thread-title">Audit promo code coverage</div>
              <div className="tg-thread-branch mono">bb/audit-promo-coverage</div>
            </div>
          </div>
        </div>
      </div>
      <div className="tg-input">
        <Paperclip className="tg-attach" />
        <span className="tg-field">Message</span>
        <span className="tg-send" aria-hidden>
          <PaperPlane className="tg-send-ic" />
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * BUILD STORYBOARD (loops while in view)
 *
 * One window, because that is where this actually happens: you are in a
 * thread, and the thing the agent builds shows up in the sidebar beside
 * you. The old version split the story across two floating cards with a
 * skeleton panel hanging off the frame, which read as a mock of bb rather
 * than bb.
 *
 *      0ms   a thread titled "New thread", nothing in the pane
 *    300ms   the title morphs into the ask; the agent starts working
 *  0.8-2.8s  five build steps land, one every 500ms
 *   3400ms   the Review queue panel appears in the sidebar nav
 *   4000ms   the panel itself opens beside the thread
 *   4600ms   the thread reports back and the branch chip fills in
 *  12000ms   loop restarts
 *
 * The build runs briskly and then holds: complete for roughly two thirds of
 * the loop, so a capture taken at random is far more likely to show the
 * finished argument than a half-built one.
 *   rest     everything present — also the reduced-motion state
 *
 * The panel opens in the third column rather than replacing the thread, so
 * the resting frame holds the whole argument at once: what was asked, what
 * the agent did, the nav row it added, and the working panel behind it. The
 * section used to say "the panel is live in your sidebar" and then show a
 * label — evidence that a string was inserted, not that software was built.
 * ──────────────────────────────────────────────── */
const BUILD_BEATS = [300, 800, 1300, 1800, 2300, 2800, 3400, 4000, 4600];
const BUILD_RESET = 12000;
const BUILD_PROMPT = "Add a review queue panel";

const BUILD_STEPS = [
  { kind: "step", text: "Read the plugin API" },
  { kind: "step", text: "Scaffolded the plugin" },
  { kind: "step", text: "Registered the CLI" },
  { kind: "step", text: "Wrote the skill" },
  { kind: "step", text: "Added it to the sidebar" },
] as const;

/** What the built panel is for: every thread that stopped to ask you
 *  something, in one list. */
const BUILD_QUEUE = [
  { title: "Audit promo code coverage", ask: "Stack or replace?" },
  { title: "Port pricing to TypeScript", ask: "Strict null checks?" },
  { title: "Trace order checkout flow", ask: "Include tax lines?" },
  { title: "Add Apple Pay to checkout", ask: "Sandbox or live keys?" },
  { title: "Retire the legacy cart cookie", ask: "Migrate or drop sessions?" },
  { title: "Split the order confirmation", ask: "One email or two?" },
] as const;

function BuildDemo() {
  const { ref, stage } = useLoopStage(BUILD_BEATS, BUILD_RESET);
  const settled = stage >= BUILD_BEATS.length;
  const asked = stage >= 1 || settled;
  const steps = settled ? BUILD_STEPS.length : Math.max(0, stage - 1);
  const navOn = stage >= 7 || settled;
  const panelOn = stage >= 8 || settled;
  const done = stage >= 9 || settled;
  return (
    <div className="build-demo" ref={ref} aria-hidden>
      <div className="dwin-bar">
        <span className="dwin-title">
          {asked ? BUILD_PROMPT : "New thread"}
        </span>
        <span className={done ? "gang-commit armed" : "gang-commit"}>
          Commit
          <ChevronDown className="gang-commit-chev" />
        </span>
      </div>
      <div className="gang-body">
        <div className="gang-side">
          <div className="side-row-new">
            <span className="side-act">
              <NewThreadIcon className="sa-ic" />
              New thread
            </span>
            <span className="side-search">
              <SearchGlyph className="sa-ic" />
            </span>
          </div>
          <span className="side-act">
            <ToolboxGlyph className="sa-ic" />
            Extensions
          </span>
          <span className="side-act">
            <ClockIcon className="sa-ic" />
            Automations
          </span>
          <span className="side-act">
            <ChecklistGlyph className="sa-ic" />
            Tasks
          </span>
          {/* The payoff: a plugin that adds a panel adds a nav row, and the
              row arrives while you are still reading the thread that asked
              for it. Space is reserved so the section never grows. */}
          {navOn ? (
            <span
              className={
                panelOn
                  ? "side-act build-nav active-act"
                  : "side-act build-nav"
              }
            >
              <PanelIcon className="sa-ic" />
              Review queue
            </span>
          ) : null}
          <span className="sub-group gang-gap">storefront</span>
          <div className="sub-row gang-row is-open">
            <ClaudeIcon className="gang-pv" />
            <span className="sub-title">
              {asked ? BUILD_PROMPT : "New thread"}
            </span>
            {done ? null : <DemoSpinner />}
          </div>
          <div className="sub-row gang-row">
            <OpenAiIcon className="gang-pv" />
            <span className="sub-title">Audit promo code coverage</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row">
            <CursorIcon className="gang-pv" />
            <span className="sub-title">Trace order checkout flow</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row">
            <GrokIcon className="gang-pv" />
            <span className="sub-title">Summarize checkout cart integration</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row">
            <PiIcon className="gang-pv" />
            <span className="sub-title">Cut the 1.4 release notes</span>
            <i className="sub-dot" />
          </div>
          <span className="sub-group gang-gap">checkout-api</span>
          <div className="sub-row gang-row">
            <OmpIcon className="gang-pv" />
            <span className="sub-title">Describe order endpoint validation</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row">
            <OpencodeIcon className="gang-pv" />
            <span className="sub-title">Summarize service route</span>
            <i className="sub-dot" />
          </div>
        </div>
        <div className="gang-thread">
          <div className="gang-feed">
            {/* A thread opens with what you asked for. It is the whole
                premise of the section, so the pane says it out loud
                instead of leaving the title to carry it. */}
            <p className={asked ? "gang-you in" : "gang-you out"}>
              {BUILD_PROMPT}
            </p>
            {BUILD_STEPS.map((s, i) => (
              <p
                key={s.text}
                className={steps > i ? "gang-step in" : "gang-step out"}
              >
                {s.text}
              </p>
            ))}
            <p className={done ? "gang-say in" : "gang-say out"}>
              One manifest registers three surfaces: a panel that renders the
              queue, a <code>bb review</code> command that prints the same list
              to a shell, and a skill so any agent here checks it before asking
              you something twice.
            </p>
            <p className={done ? "gang-say in" : "gang-say out"}>
              The panel is live in your sidebar. bb building bb.
            </p>
          </div>
          <div className="gang-pr">
            <GitMergeIcon className="gang-pr-ic" />
            <span className="gang-pr-strong">Uncommitted</span>
            <span className="gang-pr-dim">· 6 files,</span>
            <em className="review-add">+214</em>
            <em className="review-del">-3</em>
            <ChevronDown className="gang-commit-chev" />
          </div>
          <div className="gang-composer">
            <span className="gang-ph">Ask a follow-up</span>
            <span className="gang-send">
              <SendIcon className="gang-send-ic" />
            </span>
          </div>
          <div className="gang-ctx">
            <span className="gang-ctx-item">
              <ClaudeIcon className="gang-ctx-ic" />
              Opus 4.8
              <ChevronDown className="gang-commit-chev" />
            </span>
            <span className="gang-ctx-item">
              <FolderGitIcon className="gang-ctx-ic" />
              Worktree
              <ChevronDown className="gang-commit-chev" />
            </span>
            <span className="gang-ctx-item gang-ctx-branch">
              <GitBranchIcon className="gang-ctx-ic" />
              bb/review-queue-panel
            </span>
            {done ? null : <Spinner className="gang-ctx-spin" />}
          </div>
        </div>
        {/* The plugin, running. Its column is in the grid from the first
            frame — only the contents move — so opening it costs the section
            no height and reflows nothing. */}
        <div className={panelOn ? "build-panel in" : "build-panel"}>
          <div className="build-panel-bar">
            <PanelIcon className="build-panel-ic" />
            Review queue
          </div>
          <ul className="build-queue">
            {BUILD_QUEUE.map((q) => (
              <li key={q.title}>
                <HugeiconsIcon
                  icon={MessageQuestionIcon}
                  className="build-queue-ic"
                />
                <span className="build-queue-body">
                  <span className="build-queue-title">{q.title}</span>
                  <span className="build-queue-ask">{q.ask}</span>
                </span>
              </li>
            ))}
          </ul>
          <span className="build-queue-foot">
            {BUILD_QUEUE.length} threads waiting on you
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
 * GANG STORYBOARD (loops while in view)
 *
 *      0ms   four threads working across three projects
 *    700ms   the read lands in the open transcript
 *   1350ms   the finding lands
 *   2000ms   the gap is named; the claude thread completes, its child
 *            appears nested
 *   2650ms   the edit lands; the pi thread completes
 *   3300ms   the suite starts
 *   3950ms   "Ran 32 tests" lands
 *   4600ms   the suite passes; the open codex thread completes last,
 *            on screen
 *  12000ms   loop restarts
 *
 * The settled office used to hold only ~40% of the loop, so most captures
 * caught a half-finished room. The work now runs at the same pace it reads
 * at and then rests: settled for roughly two thirds.
 *   rest     everything settled — also the reduced-motion state
 * ──────────────────────────────────────────────── */
/* Opening a rail row shows that agent's own thread. Without this the
 * section asserts eight agents and only ever proves one — every row led to
 * the same transcript. Only the finished threads carry one; the ones still
 * working stay as status, which is what the app shows too. */
const GANG_THREADS: Record<
  string,
  { branch: string; files: string; add: string; del: string; lines: readonly { kind: string; text: string }[] }
> = {
  "trace-order-checkout-flow": {
    branch: "bb/trace-order-checkout",
    files: "3 files",
    add: "+61",
    del: "-4",
    lines: [
      { kind: "step", text: "Read checkout.ts, cart.ts, tax.ts" },
      {
        kind: "say",
        text: "Cart totals resolve before promo codes apply, so the discount always sees a settled subtotal rather than a running one.",
      },
      { kind: "step", text: "Spawned 1 subagent" },
      {
        kind: "say",
        text: "Confirm the checkout totals came back clean: express checkout is the only path that builds its own total, and it calls promo after tax.",
      },
      {
        kind: "say",
        text: "Traced. The order is cart, then promo, then tax, and I left a comment at the one call site that could reorder them.",
      },
    ],
  },
  "summarize-service-route": {
    branch: "bb/summarize-service-route",
    files: "1 file",
    add: "+24",
    del: "0",
    lines: [
      { kind: "step", text: "Read routes/orders.ts" },
      {
        kind: "say",
        text: "One POST handler doing four jobs: validation, idempotency, the write, and the webhook fan-out. Each has its own failure mode and they share one try block.",
      },
      { kind: "step", text: "Wrote docs/orders-route.md" },
      {
        kind: "say",
        text: "Summarised, with the idempotency key's lifetime called out — it is the part that surprises people reading this route for the first time.",
      },
    ],
  },
};

const GANG_BEATS = [700, 1350, 2000, 2650, 3300, 3950, 4600];
const GANG_RESET = 12000;

const GANG_STEPS = [
  { kind: "step", text: "Read promo.ts, cart.ts, checkout.ts" },
  {
    kind: "say",
    text: "applyPromo handles percent and fixed codes, and the suite covers both. What nothing exercises is two codes on the same cart — the branch where a second code lands on an already-discounted subtotal.",
  },
  { kind: "step", text: "Explored 3 files" },
  {
    kind: "say",
    text: "There is a second gap underneath it. PERCENT_CODES is read with a bare index, so a code that collides with a prototype key returns a function instead of a rate and the subtotal comes back NaN.",
  },
  { kind: "step", text: "Edited promo.test.ts" },
  {
    kind: "say",
    text: "Added four cases: two codes on one cart, a code that collides with a prototype key, an empty cart, and a rounding boundary at a half cent.",
  },
  { kind: "step", text: "Ran 32 tests" },
  {
    kind: "say",
    text: "All 32 passing. Promo coverage holds, and the prototype-key path is pinned so it cannot regress quietly.",
  },
] as const;

/* Each demo tells its story once, the first time it scrolls into view, and
   then stays in the state the story ended in. It used to loop forever, which
   made the page restless and meant the surface was never yours — something
   was always about to overwrite it.
 
   The rest state is the complete state: `stage` starts at beats.length, the
   run steps 0 -> beats.length, and the final beat lands back where it began.
   That is what makes the no-JS, reduced-motion and single-screenshot renders
   correct for free rather than as a special case, and it is what lets the
   demo become an operable surface once the animation is done. */
function useLoopStage(beats: number[], resetAt: number) {
  void resetAt;
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(beats.length);
  const timers = useRef<number[]>([]);
  const played = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (played.current || !entry?.isIntersecting) return;
        played.current = true;
        observer.disconnect();
        setStage(0);
        timers.current = beats.map((at, i) =>
          window.setTimeout(() => setStage(i + 1), at),
        );
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, stage };
}

function GangDemo() {
  const { ref, stage } = useLoopStage(GANG_BEATS, GANG_RESET);
  const settled = stage >= GANG_BEATS.length;
  const shown = settled ? GANG_STEPS.length : Math.min(stage + 1, GANG_STEPS.length);
  // null = the codex thread the loop is playing; a key opens that agent's own.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = openKey ? GANG_THREADS[openKey] : null;
  return (
    /* Not aria-hidden. Three of the thread rows here are real buttons that
       swap the pane, and they were sitting inside a hidden root — reachable
       by keyboard, announced as nothing. A surface with working controls has
       to be a surface, so the window is a labelled group and the parts of it
       that are only scenery are hidden individually below. */
    <div
      className="gang-demo"
      ref={ref}
      role="group"
      aria-label="A bb window with one thread open and others running"
    >
      <div className="dwin-bar">
        <span className="dwin-title">
          {openKey === "trace-order-checkout-flow"
            ? "Trace order checkout flow"
            : openKey === "summarize-service-route"
              ? "Summarize service route"
              : "Audit promo code coverage"}
        </span>
        <span
          className={
            stage >= 7 || settled ? "gang-commit armed" : "gang-commit"
          }
        >
          Commit
          <ChevronDown className="gang-commit-chev" />
        </span>
      </div>
      <div className="gang-body">
      <div className="gang-side">
        <div className="sub-top" aria-hidden>
          <span className="sub-newthread">
            <NewThreadIcon className="sub-top-ic" />
            New thread
          </span>
          <SearchGlyph className="sub-top-ic sub-search" />
        </div>
        <span className="sub-group">storefront</span>
        {/* Explicit labels: the provider icons render a <title> and the icon
            components only forward className, so the computed name would be
            "OpenAIAudit promo code coverage". A control should say what
            pressing it does anyway. */}
        <button
          type="button"
          className={openKey ? "sub-row gang-row" : "sub-row gang-row is-open"}
          aria-pressed={!openKey}
          aria-label="Show the thread: Audit promo code coverage"
          onClick={() => withViewTransition(() => setOpenKey(null))}
        >
          <OpenAiIcon className="gang-pv" />
          <span className="sub-title">Audit promo code coverage</span>
          {stage >= 7 || settled ? null : <DemoSpinner />}
        </button>
        <button
          type="button"
          className={
            openKey === "trace-order-checkout-flow"
              ? "sub-row gang-row is-open"
              : "sub-row gang-row"
          }
          aria-pressed={openKey === "trace-order-checkout-flow"}
          aria-label="Show the thread: Trace order checkout flow"
          onClick={() =>
            withViewTransition(() => setOpenKey("trace-order-checkout-flow"))
          }
        >
          <ClaudeIcon className="gang-pv" />
          <span className="sub-title">Trace order checkout flow</span>
          {stage >= 4 || settled ? <i className="sub-dot" /> : <DemoSpinner />}
        </button>
        {/* One hairline for the whole child group, as the real rail draws it. */}
        <div className="sub-kids">
          <i className="sub-guide" aria-hidden />
          <div
            className={
              stage >= 3 || settled
                ? "sub-row gang-row gang-kid in"
                : "sub-row gang-row gang-kid"
            }
          >
            <ClaudeIcon className="gang-pv" />
            <span className="sub-title">Confirm the checkout totals</span>
            <DemoSpinner />
          </div>
        </div>
        <div className="sub-row gang-row">
          <CursorIcon className="gang-pv" />
          <span className="sub-title">Explain promo checkout impact</span>
          <HugeiconsIcon icon={MessageQuestionIcon} className="gang-wait" />
        </div>
        <div className="sub-row gang-row">
          <GrokIcon className="gang-pv" />
          <span className="sub-title">Summarize checkout cart integration</span>
          <i className="sub-dot" />
        </div>
        <div className="sub-row gang-row">
          <HermesAgentIcon className="gang-pv" />
          <span className="sub-title">Cut the 1.4 release notes</span>
          <i className="sub-dot" />
        </div>
        <span className="sub-group gang-gap">checkout-api</span>
        <button
          type="button"
          className={
            openKey === "summarize-service-route"
              ? "sub-row gang-row is-open"
              : "sub-row gang-row"
          }
          aria-pressed={openKey === "summarize-service-route"}
          aria-label="Show the thread: Summarize service route"
          onClick={() =>
            withViewTransition(() => setOpenKey("summarize-service-route"))
          }
        >
          <PiIcon className="gang-pv" />
          <span className="sub-title">Summarize service route</span>
          {stage >= 3 || settled ? <i className="sub-dot" /> : <DemoSpinner />}
        </button>
        <div className="sub-row gang-row">
          <OmpIcon className="gang-pv" />
          <span className="sub-title">Describe order endpoint validation</span>
          <i className="sub-dot" />
        </div>
        <div className="sub-row gang-row">
          <CursorIcon className="gang-pv" />
          <span className="sub-title">Explain orders error handling</span>
          <i className="sub-dot" />
        </div>
        <span className="sub-group gang-gap">mobile</span>
        <div className="sub-row gang-row">
          <OpencodeIcon className="gang-pv" />
          <span className="sub-title">Suggest README improvement</span>
          <DemoSpinner />
        </div>
        <div className="sub-row gang-row">
          <ClaudeIcon className="gang-pv" />
          <span className="sub-title">Explain package scripts</span>
          <i className="sub-dot" />
        </div>
      </div>
      <div className="gang-thread" style={{ viewTransitionName: "gang-pane" }}>
        <div className="gang-feed" key={openKey ?? "codex"}>
          {(open ? open.lines : GANG_STEPS.slice(0, shown)).map((s, i) => (
            <p
              key={s.text}
              className={s.kind === "step" ? "gang-step in" : "gang-say in"}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {s.text}
            </p>
          ))}
        </div>
        <div className="gang-pr" aria-hidden>
          <GitMergeIcon className="gang-pr-ic" />
          <span className="gang-pr-strong">Uncommitted</span>
          <span className="gang-pr-dim">· {open ? open.files : "2 files"},</span>
          <em className="review-add">{open ? open.add : "+38"}</em>
          <em className="review-del">{open ? open.del : "-2"}</em>
          <ChevronDown className="gang-commit-chev" />
        </div>
        <div className="gang-composer" aria-hidden>
          <span className="gang-ph">Ask a follow-up</span>
          <span className="gang-send">
            <SendIcon className="gang-send-ic" />
          </span>
        </div>
        <div className="gang-ctx" aria-hidden>
          <span className="gang-ctx-item">
            <OpenAiIcon className="gang-ctx-ic" />
            Codex
            <ChevronDown className="gang-commit-chev" />
          </span>
          <span className="gang-ctx-item">
            <FolderGitIcon className="gang-ctx-ic" />
            Worktree
            <ChevronDown className="gang-commit-chev" />
          </span>
          <span className="gang-ctx-item gang-ctx-branch">
            <GitBranchIcon className="gang-ctx-ic" />
            {open ? open.branch : "bb/audit-promo-coverage"}
          </span>
          {settled ? null : <Spinner className="gang-ctx-spin" />}
        </div>
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
// After the third cause settles, the whole machine holds its finished
// state for a beat before quietly resetting.
const SPAWN_RESET_MS = 3 * BEAT_MS + 3600;

// 52 characters — .spawn-cmd's 53ch cap and spawn-type's steps(52) are
// derived from this string; keep the three in lockstep.
const SPAWN_COMMAND = 'bb thread spawn --prompt "Trace order checkout flow"';

/* Each cause is a thread, and the thread carries where it came from — the
 * glyph the rail shows, the line the transcript opens with, and the branch
 * it works on. The old version floated the causes outside the window as
 * cards; inside, they are just threads, which is what they are. */
const SPAWN_CAUSES = [
  {
    id: "cli",
    title: "Trace order checkout flow",
    origin: "Spawned from your shell · bb thread spawn",
    branch: "bb/trace-order-checkout",
    diff: { files: "3 files", add: "+61", del: "-4" },
    lines: [
      { kind: "step", text: "Read checkout.ts" },
      {
        kind: "say",
        text: "Cart totals resolve before promo codes apply, so the discount always sees a settled subtotal rather than a running one.",
      },
      { kind: "step", text: "Read 3 files" },
      {
        kind: "say",
        text: "Tax reads the discounted subtotal, which means promo has to land first or the line comes out high. The ordering is load-bearing and nothing in the code says so.",
      },
      { kind: "step", text: "Read 2 call sites" },
      {
        kind: "say",
        text: "Only the express-checkout path builds its own total, and it calls promo after tax. That is the one place this can go wrong.",
      },
      {
        kind: "say",
        text: "Traced. The order is cart, then promo, then tax, and I left a comment at the call site that could reorder them.",
      },
    ],
  },
  {
    id: "telegram",
    title: "Audit promo code coverage",
    origin: "Spawned via Telegram",
    branch: "bb/audit-promo-coverage",
    diff: { files: "1 file", add: "+38", del: "-2" },
    lines: [
      { kind: "step", text: "Read promo.test.ts" },
      {
        kind: "say",
        text: "The promo engine has no test for stacked codes. Every existing case applies one code to a clean cart and stops there.",
      },
      { kind: "step", text: "Edited promo.test.ts" },
      {
        kind: "say",
        text: "Covered two codes on one cart, a code that collides with a prototype key, an empty cart, and a half-cent rounding boundary.",
      },
      { kind: "step", text: "Ran 32 tests" },
      {
        kind: "say",
        text: "The stacked-code case failed first time round: the second discount applied to the original subtotal instead of the discounted one.",
      },
      {
        kind: "say",
        text: "Added four cases. All 32 passing, and the prototype-key path is pinned.",
      },
    ],
  },
  {
    id: "cron",
    title: "Nightly dependency sweep",
    origin: "Spawned by Automations · every night at 02:00",
    branch: "bb/nightly-sweep",
    diff: { files: "14 files", add: "+126", del: "-118" },
    lines: [
      { kind: "step", text: "Read 14 package manifests" },
      {
        kind: "say",
        text: "Fourteen manifests read, seven behind. Six are minors that group cleanly into one bump; the seventh is vite, and a major goes on its own branch.",
      },
      {
        kind: "say",
        text: "The vite bump moves esbuild under it, which is the peer warning the install has been printing, so that one wants a real look before it merges.",
      },
      { kind: "step", text: "Opened 3 pull requests" },
      { kind: "step", text: "Ran the suite on each branch" },
      {
        kind: "say",
        text: "The grouped minors are green. The vite branch fails two Playwright specs that look like a dev-server timing change rather than a real break.",
      },
      {
        kind: "say",
        text: "Sweep done. Three PRs are up, and the vite one is draft until someone reads the esbuild note.",
      },
    ],
  },
] as const;

/** The app's own vocabulary for a background spawn: a terminal for a shell
 *  command, the sender for an agent, a clock for a schedule. */
const SPAWN_GLYPHS: Record<string, (p: IconProps) => ReactNode> = {
  cli: TerminalGlyph,
  telegram: PaperPlane,
  cron: ClockIcon,
};

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

/* One window. The three causes arrive as threads in the rail, each with the
 * glyph the app gives a background spawn, and the pane follows whichever
 * one just landed — or whichever one you click. */
function SpawnDemo() {
  const { ref, phase } = useSpawnMachine();
  const [picked, setPicked] = useState<string | null>(null);
  const cli = causeStage(phase, 0);
  const tg = causeStage(phase, 1);
  const cron = causeStage(phase, 2);
  const stages: Record<string, number> = { cli, telegram: tg, cron };
  // Newest arrival leads the pane until a visitor takes over by clicking.
  const arrived = [...SPAWN_CAUSES].filter((c) => stages[c.id] >= 3);
  const lead = arrived[arrived.length - 1] ?? SPAWN_CAUSES[2];
  const open = SPAWN_CAUSES.find((c) => c.id === picked) ?? lead;
  const rows = [SPAWN_CAUSES[2], SPAWN_CAUSES[1], SPAWN_CAUSES[0]];
  return (
    <div className="spawn-demo" ref={ref}>
      <div className="dwin-bar">
        <span className="dwin-title">{open.title}</span>
        <span className="gang-commit">
          Commit
          <ChevronDown className="gang-commit-chev" />
        </span>
      </div>
      <div className="gang-body">
        <div className="gang-side">
          <div className="sub-top" aria-hidden>
            <span className="sub-newthread">
              <NewThreadIcon className="sub-top-ic" />
              New thread
            </span>
            <SearchGlyph className="sub-top-ic sub-search" />
          </div>
          <span className="sub-group">storefront</span>
          {rows.map((c) => {
            const st = stages[c.id];
            const Glyph = SPAWN_GLYPHS[c.id];
            return (
              <button
                key={c.id}
                type="button"
                className={
                  (st >= 2 ? "sub-row gang-row spawn-new in" : "sub-row gang-row spawn-new") +
                  (open.id === c.id ? " is-open" : "")
                }
                aria-pressed={open.id === c.id}
                onClick={() => setPicked(c.id)}
              >
                <Glyph className="gang-pv" />
                <span className="sub-title">
                  {st >= 3 ? c.title : "New thread"}
                </span>
                {st >= 4 ? (
                  open.id === c.id ? null : (
                    <i className="sub-dot" />
                  )
                ) : st >= 2 ? (
                  <DemoSpinner />
                ) : null}
              </button>
            );
          })}
          <div className="sub-row gang-row sub-quiet">
            <ClaudeIcon className="gang-pv" />
            <span className="sub-title">Summarize checkout cart integration</span>
            <i className="sub-dot" />
          </div>
          <span className="sub-group gang-gap">checkout-api</span>
          <div className="sub-row gang-row sub-quiet">
            <PiIcon className="gang-pv" />
            <span className="sub-title">Describe order endpoint validation</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row sub-quiet">
            <OpencodeIcon className="gang-pv" />
            <span className="sub-title">Summarize service route</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row sub-quiet">
            <GrokIcon className="gang-pv" />
            <span className="sub-title">Explain orders error handling</span>
            <i className="sub-dot" />
          </div>
          <span className="sub-group gang-gap">mobile</span>
          <div className="sub-row gang-row sub-quiet">
            <OmpIcon className="gang-pv" />
            <span className="sub-title">Suggest README improvement</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row sub-quiet">
            <CursorIcon className="gang-pv" />
            <span className="sub-title">Explain package scripts</span>
            <i className="sub-dot" />
          </div>
          <div className="sub-row gang-row sub-quiet">
            <ClaudeIcon className="gang-pv" />
            <span className="sub-title">Summarize app purpose</span>
            <i className="sub-dot" />
          </div>
        </div>
        <div className="gang-thread">
          <div className="gang-feed" key={open.id}>
            <p className="gang-step in">{open.origin}</p>
            {open.lines.map((l) => (
              <p
                key={l.text}
                className={l.kind === "step" ? "gang-step in" : "gang-say in"}
              >
                {l.text}
              </p>
            ))}
          </div>
          <div className="gang-pr">
            <GitMergeIcon className="gang-pr-ic" />
            <span className="gang-pr-strong">Uncommitted</span>
            <span className="gang-pr-dim">· {open.diff.files},</span>
            <em className="review-add">{open.diff.add}</em>
            <em className="review-del">{open.diff.del}</em>
            <ChevronDown className="gang-commit-chev" />
          </div>
          <div className="gang-composer">
            <span className="gang-ph">Ask a follow-up</span>
            <span className="gang-send">
              <SendIcon className="gang-send-ic" />
            </span>
          </div>
          <div className="gang-ctx">
            <span className="gang-ctx-item">
              <ClaudeIcon className="gang-ctx-ic" />
              Opus 4.8
              <ChevronDown className="gang-commit-chev" />
            </span>
            <span className="gang-ctx-item gang-ctx-branch">
              <GitBranchIcon className="gang-ctx-ic" />
              {open.branch}
            </span>
          </div>
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
      <ul>
        {PR_FEED.map((pr) => {
          const url =
            CONTRIBUTOR_AVATARS[`../assets/contributors/${pr.login}.webp`];
          return (
            <li key={pr.number}>
              <a href={pr.url} target="_blank" rel="noreferrer">
                {url ? (
                  <img
                    src={url}
                    alt=""
                    width={22}
                    height={22}
                    loading="lazy"
                    decoding="async"
                  />
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
    </div>
  );
}

/** A stat numeral.
 *
 *  This used to roll up from zero with a character morph on first view. Two
 *  things were wrong with it. The numbers are the section's proof, and a
 *  proof that reads "0" for any window at all — even the one frame before
 *  the morph starts — is a false statement about the project. And morphing
 *  between numerals of different widths ("0" to "2,382") re-lays the glyphs
 *  mid-flight, which reads as a rendering fault rather than as motion.
 *
 *  The cards still enter; the numbers inside them just tell the truth from
 *  the first frame. */
function StatNumber({ value }: { value: string }) {
  return <strong>{value}</strong>;
}

function LandingPage() {
  useFitMock();
  return (
    <div className="wrap">
      <SiteNav />

      <header className="hero">
        <a className="updates-callout" href={LATEST_RELEASE_URL}>
          <span className="updates-label">New</span>
          <span className="updates-title">{LATEST_RELEASE_META.headline}</span>
          <ChevronRight className="updates-arrow" />
        </a>
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
          <h2>More than a chat window</h2>
          <div className="act-lead">
            <p>
              bb carries the work around the conversation: building,
              reviewing, delegating, and deciding.
            </p>
          </div>
        </div>
        <ul className="bento rail">
          <li>
            <h3>Subagents</h3>
            <p>A thread spawns another, then folds its report back in.</p>
            <div className="bento-window bento-component">
              <SubagentsDemo />
            </div>
          </li>
          <li>
            <h3>Review from the thread</h3>
            <p>Diffs, commits, and PRs beside the conversation.</p>
            <div className="bento-window bento-component">
              <ReviewDemo />
            </div>
          </li>
          {/* The bottom row leaves the desk. Both are true without a native
              app: one is a third-party chat app talking to your machine, the
              other is bb's own question reaching you wherever you are. */}
          <li className="bento-phone">
            <h3>Text it to work</h3>
            <p>Message the bot and a thread spawns on your machine.</p>
            <div className="bento-component">
              <Phone label="Texting the bb bot, which spawns a thread">
                <AgentChat />
              </Phone>
            </div>
          </li>
          <li className="bento-phone">
            <h3>Answer from anywhere</h3>
            <p>The question finds you instead of waiting at your desk.</p>
            <div className="bento-component">
              <Phone label="An agent's question, answered from a phone">
                <AskPhone />
              </Phone>
            </div>
          </li>
        </ul>
      </section>

      <section className="act slate">
        <div className="act-head rail">
          <h2>Ask for a feature, watch it appear</h2>
          <div className="act-lead">
            <p>
              Ask for a review queue. bb scaffolds the plugin, registers{" "}
              <code>bb review</code>, writes the skill, and adds the panel to
              your sidebar.
            </p>
            <p className="act-claim">
              The result is a normal plugin you can read, change, and commit.
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
          <h2>Anything can kick off work</h2>
          <div className="act-lead">
            <p>
              The CLI your agents use is open to any program you write: a
              shell script, a cron job, a bot in Telegram or Slack.
            </p>
            <p className="act-claim">
              Each can put an agent to work while you&rsquo;re away, and
              it&rsquo;s waiting in your sidebar when you are.
            </p>
          </div>
        </div>
        <div className="causal rail">
          <SpawnDemo />
        </div>
      </section>

      <section className="act open-act">
        <div className="act-head rail">
          <h2>Open source, end to end</h2>
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
        <CloserMark />
        <h2 className="sec-title">Put your agents to work</h2>
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
