import {
  ArrowDown01Icon,
  ArrowDownDoubleIcon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowMoveDownLeftIcon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  ArrowUpDoubleIcon,
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
  LayoutTwoColumnIcon,
  LayoutTwoRowIcon,
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
  TextWrapIcon,
  TimeScheduleIcon,
  ToolboxIcon,
  UserAdd01Icon,
  WorkflowCircle03Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

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
import vscodeIcon from "../assets/vscode.png";
import { RELEASE_META, parseChangelog } from "../landing/changelog";
import {
  DiscordLink,
  DownloadLink,
  SubscribeCard,
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


/* ── CTAs ─────────────────────────────────────────────────────────── */

// The browser install path, rendered as an outline button whose body is the
// run command. Clicking anywhere copies it (there's no hosted URL to open —
// the command starts bb locally and opens it in the browser).
function RunCommandButton({ placement }: { placement: CtaPlacement }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copy = async () => {
    // Confirm the write before claiming it. The clipboard rejects in an
    // insecure context or when permission is denied, and neither the label
    // nor the metric may report a copy that did not happen.
    try {
      await navigator.clipboard.writeText(CLI_COMMAND);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 4000);
      return;
    }
    trackLandingEvent({
      name: "landing_cli_command_copied",
      properties: { placement, command: CLI_COMMAND },
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        copyFailed
          ? `Couldn't copy. Select and copy ${CLI_COMMAND}`
          : copied
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

/**
 * The install, as a card with an inset panel.
 *
 * Two layers, from the reference: an outer card carrying a quiet header row —
 * a label on the left, the platforms on the right — and an inner panel holding
 * the offer and the two ways to take it. The single-layer version read as a
 * grey slab because one flat ground at 6% is not a card on a near-black page;
 * nesting is what makes it one.
 *
 * The inner panel takes `--bg` rather than the reference's light literal. That
 * file is drawn for a light page, where a near-white inset reads as paper on a
 * dark mount; dropped unchanged into this one it would be a lit block in the
 * middle of the hero. `--bg` is the app-surface token, so the nesting reads
 * the same way in both themes.
 *
 * Both halves keep their behaviour: the command copies on click and reports
 * `landing_cli_command_copied`, and the download carries its placement, so the
 * hero and the closer stay separable in the click-through data.
 */
function InstallOptions({ placement }: { placement: CtaPlacement }) {
  return (
    <div className="install-card">
      <div className="install-head">
        <span className="install-head-label">Install</span>
        <span className="install-head-meta">macOS · Windows · Linux</span>
      </div>
      <div className="install-panel">
        <div className="install-actions">
          <DownloadLink
            placement={placement}
            className="btn btn-primary btn-install"
          >
            Download for macOS
          </DownloadLink>
          <RunCommandButton placement={placement} />
        </div>
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
// The Automations plugin's nav-panel row carries TimeSchedule (its manifest
// icon), not Clock — apps/app/src/components/plugin/PluginNavSidebarItems is
// host chrome but the Automations row comes from the plugin's navPanel slot
// (builtin-plugins/automations/dist/app.js: icon: "TimeSchedule").
const TimeScheduleGlyph = ({ className }: IconProps) => (
  <HugeiconsIcon icon={TimeScheduleIcon} className={className} />
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
const CollapseAllIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ArrowUpDoubleIcon} className={className} />
);
const ExpandAllIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={ArrowDownDoubleIcon} className={className} />
);
const WrapIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={TextWrapIcon} className={className} />
);
const StackedDiffIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={LayoutTwoRowIcon} className={className} />
);
const SplitDiffIcon = ({ className }: IconProps) => (
  <HugeiconsIcon icon={LayoutTwoColumnIcon} className={className} />
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
type DiffRow = { t: "add" | "del" | "ctx"; text: string };
type Step =
  | { kind: "user"; text: string }
  | { kind: "step"; text: ReactNode; detail?: readonly DiffRow[] }
  | { kind: "say"; text: ReactNode }
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

// A finite timeline fixture. The app receives ordered timeline rows from the
// server; the landing preview renders that final result directly and never
// fabricates activity after hydration.
const HERO_THREADS: MockThread[] = [
  {
    id: "sidebar-search",
    title: "Fix sidebar search",
    status: "running",
    branch: "main",
    change: { files: 0, add: 0, del: 0 },
    transcript: [
      { kind: "user", text: "Make sidebar search usable from the keyboard." },
      { kind: "step", text: "Read ProjectList.tsx" },
      {
        kind: "say",
        text: "The search control can become a focused input in the existing row.",
      },
      {
        kind: "step",
        text: "Edited ProjectList.tsx",
        detail: [
          { t: "ctx", text: "const [query, setQuery] = useState(\"\");" },
          { t: "del", text: "return threads;" },
          { t: "add", text: "if (!query) return threads;" },
          { t: "add", text: "return threads.filter((thread) =>" },
          { t: "add", text: "  thread.title.toLowerCase().includes(query)," },
          { t: "add", text: ");" },
        ],
      },
      {
        kind: "say",
        text: "Search now filters the visible threads without changing their order.",
      },
    ],
  },
  {
    id: "prompt-controls",
    title: "Wire prompt controls",
    status: "done",
    branch: "main",
    change: { files: 0, add: 0, del: 0 },
    transcript: [
      { kind: "user", text: "Match the app's prompt controls." },
      { kind: "step", text: "Read PromptBoxInternal.tsx" },
      {
        kind: "say",
        text: "The model, attachment, voice, and expand controls are wired.",
      },
    ],
  },
  {
    id: "diff-toolbar",
    title: "Review the diff toolbar",
    status: "waiting",
    branch: "main",
    change: { files: 0, add: 0, del: 0 },
    transcript: [
      { kind: "user", text: "Make the diff panel match the app toolbar." },
      { kind: "step", text: "Read GitDiffToolbar.tsx" },
      {
        kind: "say",
        text: "The panel needs the app's view controls and separate gutters.",
      },
    ],
    ask: {
      question: "Which diff layout should stay selected?",
      options: [
        {
          label: "Stacked",
          description: "Show each change across the full panel width.",
        },
        {
          label: "Split",
          description: "Place old and new changes in separate columns.",
        },
      ],
      selected: 0,
    },
  },
];

function ThreadStatus({ status }: { status: Status }) {
  return (
    <span className="tstatus" aria-hidden>
      {status === "running" ? <Spinner className="trun" /> : null}
      {status === "done" ? <CircleCheckIcon className="tdone" /> : null}
      {status === "waiting" ? <MessageQuestionGlyph className="twait" /> : null}
    </span>
  );
}

/** The conversation pane mirrors the server-provided timeline at rest. */
function ThreadFeed({ thread }: { thread: MockThread }) {
/**
 * A transcript step, with the app's own disclosure behaviour.
 *
 * apps/app/src/components/ui/disclosure.tsx renders an expandable row as a real
 * `<button type="button" aria-expanded>` — no role, no <details> — with the
 * chevron hidden until the row is hovered or focused and rotated 90deg when
 * open. The body animates on a 0fr/1fr grid over 200ms ease-out while its
 * contents translate the last pixel into place. Rows the app cannot expand
 * (a plain "Read …") render as a div with no button and no ARIA at all.
 */
function TranscriptStep({
  step,
}: {
  step: { kind: "step"; text: ReactNode; detail?: readonly DiffRow[] };
}) {
  const [open, setOpen] = useState(false);
  const label = typeof step.text === "string" ? step.text : "";

  if (!step.detail) {
    return (
      <div className="msg-step">
        <TranscriptStepGlyph text={label} />
        {step.text}
      </div>
    );
  }

  return (
    <div className="msg-step-panel">
      <button
        type="button"
        className="msg-step msg-step-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <TranscriptStepGlyph text={label} />
        <span className="msg-step-title">{step.text}</span>
        <ChevronRight
          className={open ? "msg-step-chev is-open" : "msg-step-chev"}
        />
      </button>
      <div className={open ? "msg-step-body is-open" : "msg-step-body"}>
        <div className="msg-step-body-inner">
          <div className="msg-step-diff">
            {step.detail.map((row, i) => (
              <div key={`${row.t}-${i}`} className={`msg-dl msg-dl-${row.t}`}>
                <span className="msg-dl-sign">
                  {row.t === "add" ? "+" : row.t === "del" ? "-" : " "}
                </span>
                <span className="msg-dl-text">{row.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  const items = [...thread.transcript, ...(thread.stream ?? [])];
  return (
    <div className="feed">
      {items.map((step, index) => {
        const id = `${step.kind}-${index}`;
        if (step.kind === "user") {
          return (
            <div key={id} className="msg-user">
              {step.text}
            </div>
          );
        }
        if (step.kind === "step") {
          return <TranscriptStep key={id} step={step} />;
        }
        if (step.kind === "spawn") {
          return (
            <div key={id} className="msg-step">
              <GitBranchIcon className="step-chev" />
              {step.text}
            </div>
          );
        }
        return (
          <div key={id} className="msg-say">
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
type DiffGutter = { oldNo: number | null; newNo: number | null };
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
  const [expanded, setExpanded] = useState(false);
  const [model, setModel] = useState<ComposerModel>("opus-5");

  return (
    <div className={isNew ? "composer composer-new" : "composer"}>
      <form
        className={expanded ? "composer-box composer-expanded" : "composer-box"}
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="composer-top">
          <textarea
            className="composer-input"
            rows={expanded ? 5 : 1}
            placeholder={
              isNew
                ? "Ask anything. @ to mention files or folders"
                : "Ask for a follow-up. @ to mention files, folders, sections, or threads"
            }
            aria-label={isNew ? "Start a new thread" : "Message this thread"}
          />
          <button
            type="button"
            className="cb-expand"
            aria-label={
              expanded ? "Make prompt box smaller" : "Make prompt box larger"
            }
            aria-pressed={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <Maximize2 className="cb-expand-ic" />
          </button>
        </div>
        <div className="composer-row">
          <DemoPicker
            className="model"
            label="Model"
            drop="up"
            leading={<ClaudeIcon className="model-ic" />}
            value={model}
            onChange={(next) => setModel(next as ComposerModel)}
            options={(Object.keys(COMPOSER_MODELS) as ComposerModel[]).map(
              (id) => ({ value: id, label: COMPOSER_MODELS[id] }),
            )}
          />
          <span className="composer-actions">
            <span className="composer-action" aria-hidden="true">
              <Paperclip className="composer-clip" />
            </span>
            <span className="composer-action" aria-hidden="true">
              <MicIcon className="composer-clip" />
            </span>
            <span className="send-btn" aria-hidden="true">
              <SendIcon className="send-ic" />
            </span>
          </span>
        </div>
      </form>
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
function numberDiff(lines: DiffLine[], start = 1) {
  let oldNo = start;
  let newNo = start;
  return lines.map((line) => {
    let gutter: DiffGutter;
    if (line.t === "del") {
      gutter = { oldNo, newNo: null };
      oldNo += 1;
      return { ...line, gutter };
    }
    if (line.t === "add") {
      gutter = { oldNo: null, newNo };
      newNo += 1;
      return { ...line, gutter };
    }
    gutter = { oldNo, newNo };
    oldNo += 1;
    newNo += 1;
    return { ...line, gutter };
  });
}

function DiffPanel({ onClose }: { onClose: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [viewMode, setViewMode] = useState<"stacked" | "split">("stacked");

  return (
    <aside className="diff-panel" aria-label="Changes">
      <div className="diff-head">
        <button type="button" className="diff-tab" aria-pressed="true">
          <FileDiffIcon className="diff-ic" />
          Diff
        </button>
        <button
          type="button"
          className="diff-close"
          aria-label="Hide changes"
          onClick={onClose}
        >
          <PanelRightIcon className="ri" />
        </button>
      </div>
      <div className="diff-toolbar" aria-label="Diff controls">
        <span className="diff-scope" aria-hidden="true">
          All changes
          <ChevronDown className="diff-scope-chev" />
        </span>
        <span className="diff-summary">
          1 file{" "}
          <span className="diff-summary-add">
            +{DIFF_LINES.filter((line) => line.t === "add").length}
          </span>{" "}
          <span className="diff-summary-del">
            &minus;{DIFF_LINES.filter((line) => line.t === "del").length}
          </span>
        </span>
        <button
          type="button"
          aria-label={collapsed ? "Expand all files" : "Collapse all files"}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? (
            <ExpandAllIcon className="diff-control-ic" />
          ) : (
            <CollapseAllIcon className="diff-control-ic" />
          )}
        </button>
        <button
          type="button"
          className={wrap ? "active" : undefined}
          aria-label={wrap ? "Disable diff line wrap" : "Wrap diff lines"}
          aria-pressed={wrap}
          onClick={() => setWrap((value) => !value)}
        >
          <WrapIcon className="diff-control-ic" />
        </button>
        <span
          className="diff-view-group"
          role="tablist"
          aria-label="Diff view mode"
        >
          <button
            type="button"
            className={viewMode === "stacked" ? "active" : undefined}
            aria-label="Stacked diff view"
            aria-pressed={viewMode === "stacked"}
            onClick={() => setViewMode("stacked")}
          >
            <StackedDiffIcon className="diff-control-ic" />
          </button>
          <button
            type="button"
            className={viewMode === "split" ? "active" : undefined}
            aria-label="Split diff view"
            aria-pressed={viewMode === "split"}
            onClick={() => setViewMode("split")}
          >
            <SplitDiffIcon className="diff-control-ic" />
          </button>
        </span>
      </div>
      <button
        type="button"
        className="diff-file"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
      >
        <ChevronDown
          className={
            collapsed
              ? "diff-file-disclosure collapsed"
              : "diff-file-disclosure"
          }
        />
        <FolderGitIcon className="diff-file-ic" />
        promo.test.ts
      </button>
      {!collapsed ? (
        <div
          className={wrap ? "diff-body wrap" : "diff-body"}
          data-view={viewMode}
        >
          {numberDiff(DIFF_LINES).map((line, i) => (
            <div key={`${line.t}-${i}`} className={`dl dl-${line.t}`}>
              <span
                className="dl-gutter"
                aria-label={`Old line ${line.gutter.oldNo ?? "none"}, new line ${line.gutter.newNo ?? "none"}`}
              >
                <span className="dl-no" aria-hidden="true">
                  {line.gutter.oldNo ?? ""}
                </span>
                <span className="dl-no" aria-hidden="true">
                  {line.gutter.newNo ?? ""}
                </span>
              </span>
              <span className="dl-sign">
                {line.t === "add" ? "+" : line.t === "del" ? "-" : " "}
              </span>
              <span className="dl-text">{line.text || " "}</span>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

type HeroView = "thread" | "new" | "extensions" | "automations";

const DEFAULT_SIDEBAR_NAV = [
  { id: "extensions", label: "Extensions", Icon: ToolboxGlyph },
  { id: "automations", label: "Automations", Icon: TimeScheduleGlyph },
] as const;

function HeroAppMock() {
  const [activeId, setActiveId] = useState(HERO_THREADS[0].id);
  const [view, setView] = useState<HeroView>("thread");
  const [diffOpen, setDiffOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>(
    {},
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const thread =
    HERO_THREADS.find((candidate) => candidate.id === activeId) ??
    HERO_THREADS[0];
  const threadTitle = titleOverrides[thread.id] ?? thread.title;
  const visibleThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return HERO_THREADS;
    return HERO_THREADS.filter((candidate) =>
      (titleOverrides[candidate.id] ?? candidate.title)
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, titleOverrides]);

  const openThread = (id: string) => {
    setActiveId(id);
    setView("thread");
    setEditingTitle(false);
    setMoreOpen(false);
  };

  const startRename = () => {
    setTitleDraft(threadTitle);
    setEditingTitle(true);
    setMoreOpen(false);
  };

  const moreRef = useRef<HTMLSpanElement>(null);
  const editorRef = useRef<HTMLSpanElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLFormElement>(null);

  useDismiss(moreOpen, () => setMoreOpen(false), moreRef);
  useDismiss(editorOpen, () => setEditorOpen(false), editorRef);
  useDismiss(
    searchOpen,
    () => {
      setQuery("");
      setSearchOpen(false);
    },
    searchRef,
  );

  const saveTitle = () => {
    const nextTitle = titleDraft.trim();
    if (nextTitle) {
      setTitleOverrides((current) => ({
        ...current,
        [thread.id]: nextTitle,
      }));
    }
    setEditingTitle(false);
  };

  return (
    <section className="mockup-wrap hero-stage">
      <div
        className={sidebarOpen ? "mock" : "mock sidebar-closed"}
        aria-label="Interactive preview of the bb app"
      >
        <div className="mock-bar">
          <div className="bar-left">
            <button
              type="button"
              className="bar-menu"
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-expanded={sidebarOpen}
              aria-controls="hero-sidebar"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <PanelIcon className="ri bar-ic" />
            </button>
            <span className="bar-nav">
              <button type="button" aria-label="Go back" disabled>
                <ChevronLeft className="ri" />
              </button>
              <button type="button" aria-label="Go forward" disabled>
                <ChevronRight className="ri" />
              </button>
            </span>
          </div>
          <div className="bar-main">
            {view === "extensions" || view === "automations" ? (
              <span className="bar-title">
                {view === "extensions" ? "Extensions" : "Automations"}
              </span>
            ) : null}
            {view === "thread" ? (
              <>
                {editingTitle ? (
                  <form
                    className="bar-title-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveTitle();
                    }}
                  >
                    <input
                      value={titleDraft}
                      aria-label="Thread title"
                      autoFocus
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setEditingTitle(false);
                        }
                      }}
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    className="bar-title bar-title-button"
                    onClick={startRename}
                  >
                    {threadTitle}
                  </button>
                )}
                <span className="bar-menu-wrap" ref={moreRef}>
                  <button
                    type="button"
                    className="bar-kebab"
                    aria-label="Thread actions"
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((open) => !open)}
                  >
                    <Ellipsis className="ri" />
                  </button>
                  {moreOpen ? (
                    <span className="bar-popover" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={startRename}
                      >
                        Rename thread
                      </button>
                    </span>
                  ) : null}
                </span>
                <span className="bar-actions">
                  <span className="editor-menu-wrap" ref={editorRef}>
                    <button
                      type="button"
                      className="editor-btn"
                      aria-label="Open in editor"
                      aria-haspopup="menu"
                      aria-expanded={editorOpen}
                      onClick={() => setEditorOpen((open) => !open)}
                    >
                      <img src={vscodeIcon} alt="" className="editor-ic" />
                      <ChevronDown className="chev-xs" />
                    </button>
                    {editorOpen ? (
                      <span className="bar-popover editor-popover" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => setEditorOpen(false)}
                        >
                          VS Code
                        </button>
                      </span>
                    ) : null}
                  </span>
                  <button type="button" className="commit-btn" disabled>
                    Commit
                  </button>
                  {!diffOpen ? (
                    <button
                      type="button"
                      className="bar-toggle"
                      aria-label="Show changes"
                      aria-pressed="false"
                      onClick={() => setDiffOpen(true)}
                    >
                      <PanelRightIcon className="ri" />
                    </button>
                  ) : null}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="mock-body">
          <aside id="hero-sidebar" className="side" hidden={!sidebarOpen}>
            {searchOpen ? (
              <form
                className="side-search-form"
                role="search"
                ref={searchRef}
                onSubmit={(event) => event.preventDefault()}
              >
                <SearchGlyph className="sa-ic" />
                <input
                  value={query}
                  aria-label="Search threads"
                  placeholder="Search threads"
                  autoFocus
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button
                  type="button"
                  aria-label="Close thread search"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </form>
            ) : (
              <div className="side-row-new">
                <button
                  type="button"
                  className={
                    view === "new" ? "side-act active-act" : "side-act"
                  }
                  aria-pressed={view === "new"}
                  onClick={() => setView("new")}
                >
                  <NewThreadIcon className="sa-ic" />
                  New thread
                </button>
                <button
                  type="button"
                  className="side-search"
                  aria-label="Search threads"
                  onClick={() => setSearchOpen(true)}
                >
                  <SearchGlyph className="sa-ic" />
                </button>
              </div>
            )}
            {DEFAULT_SIDEBAR_NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={view === id ? "side-act active-act" : "side-act"}
                aria-pressed={view === id}
                onClick={() => setView(id)}
              >
                <Icon className="sa-ic" />
                {label}
              </button>
            ))}
            <div className="side-label">bb</div>
            <ul className="threads">
              {visibleThreads.map((candidate) => {
                const isActive = view === "thread" && candidate.id === activeId;
                return (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      className={isActive ? "trow active" : "trow"}
                      aria-pressed={isActive}
                      onClick={() => openThread(candidate.id)}
                    >
                      <span className="trow-title">
                        {titleOverrides[candidate.id] ?? candidate.title}
                      </span>
                      <ThreadStatus status={candidate.status} />
                    </button>
                  </li>
                );
              })}
              {visibleThreads.length === 0 ? (
                <li className="side-empty">No matching threads</li>
              ) : null}
            </ul>
            <div className="side-foot" aria-hidden="true">
              <GearIcon className="sa-ic" />
            </div>
          </aside>

          {view === "thread" ? (
            <div className="main">
              <ThreadFeed key={thread.id} thread={thread} />
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
              {view === "extensions" ? (
                <ExtensionsPanelMock />
              ) : (
                <AutomationsPanelMock />
              )}
            </div>
          )}

          {view === "thread" && diffOpen ? (
            <DiffPanel onClose={() => setDiffOpen(false)} />
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
                    <DemoPicker
                      className="ext-category"
                      label="Category"
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      options={[
                        { value: "", label: "Category" },
                        ...PLUGIN_CATEGORIES_FROM_REGISTRY.map((category) => ({
                          value: category,
                          label: category,
                        })),
                      ]}
                    />
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

type TranscriptLine = { kind: "step" | "say" | "you"; text: string };

/**
 * Close a transient surface the way the app's own menus close.
 *
 * Radix (and so every DropdownMenu, picker and popover in bb) dismisses on an
 * outside `pointerdown` and on Escape. Listening on pointerdown rather than
 * click matters: it means the surface is already gone by the time the control
 * under the pointer receives its own event, which is what makes a menu feel
 * dismissed rather than toggled.
 */
function useDismiss(
  open: boolean,
  onDismiss: () => void,
  ref: RefObject<HTMLElement | null>,
) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (node && !node.contains(event.target as Node)) {
        dismiss.current();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss.current();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, ref]);
}

type ComposerModel = "opus-5" | "opus-4-8";

/** The two models the mock offers, labelled as the app labels them. */
const COMPOSER_MODELS: Record<ComposerModel, string> = {
  "opus-5": "Opus 5 (1M)",
  "opus-4-8": "Opus 4.8 (1M)",
};

/**
 * The app's picker, as one control.
 *
 * A native `<select>` makes the OS paint its own popup — on macOS a system
 * shadow and a system-blue highlight — on top of a recreation of bb, which is
 * the one place OS chrome cannot appear. `appearance: none` reaches the closed
 * control only. bb's own pickers are a button with a chevron over a menu the
 * app draws, so this is that: dismissing on outside pointerdown and Escape
 * through the same primitive every other menu here uses.
 */
function DemoPicker({
  value,
  options,
  onChange,
  label,
  className,
  drop = "down",
  leading,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (next: string) => void;
  label: string;
  className?: string;
  drop?: "up" | "down";
  leading?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useDismiss(open, () => setOpen(false), ref);
  const current = options.find((option) => option.value === value);

  return (
    <span className={className ? `picker ${className}` : "picker"} ref={ref}>
      <button
        type="button"
        className="picker-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        {leading}
        <span className="picker-value">{current?.label ?? label}</span>
        <ChevronDown className="picker-chev" />
      </button>
      {open ? (
        <span className={drop === "up" ? "picker-menu is-up" : "picker-menu"} role="menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <HugeiconsIcon
                icon={Tick02Icon}
                className="picker-tick"
                data-on={option.value === value}
                aria-hidden
              />
              {option.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

function DemoSpinner() {
  return <HugeiconsIcon icon={Loading03Icon} className="dm-spin" aria-hidden />;
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

function TranscriptStepGlyph({ text }: { text: string }) {
  if (/^(Read|Opened)/.test(text)) {
    return (
      <HugeiconsIcon icon={File01Icon} className="gang-step-ic" aria-hidden />
    );
  }
  if (/^(Explored|Searched)/.test(text)) {
    return (
      <HugeiconsIcon icon={Search01Icon} className="gang-step-ic" aria-hidden />
    );
  }
  if (/^(Added|Defined|Edited|Wrote)/.test(text)) {
    return (
      <HugeiconsIcon icon={Edit04Icon} className="gang-step-ic" aria-hidden />
    );
  }
  if (/^(Reported|Spawned)/.test(text)) {
    return (
      <HugeiconsIcon
        icon={UserAdd01Icon}
        className="gang-step-ic"
        aria-hidden
      />
    );
  }
  return <TerminalGlyph className="gang-step-ic" />;
}

function TranscriptLineView({ line }: { line: TranscriptLine }) {
  if (line.kind === "you") {
    return <p className="gang-you">{line.text}</p>;
  }
  if (line.kind === "say") {
    return <p className="gang-say">{line.text}</p>;
  }
  return (
    <p className="gang-step">
      <TranscriptStepGlyph text={line.text} />
      <span>{line.text}</span>
    </p>
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
      { kind: "step", text: "Explored the testing documentation" },
      {
        kind: "say",
        text: "The Testing section never named the risky part. Spawning a thread to find the real edge cases.",
      },
      { kind: "step", text: "Spawned a subagent" },
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
      { kind: "step", text: "Explored the checkout flow" },
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
      { kind: "step", text: "Explored the cart integration" },
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
        text: "The suite passes, but nothing covers stacked codes. That is the gap.",
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
  // Threads you have opened stay read. The dot is unread state, not a
  // stand-in for "not currently selected".
  const [read, setRead] = useState<ReadonlySet<string>>(
    () => new Set(["parent"]),
  );
  const all = [...SUB_THREADS, ...SUB_API_THREADS];
  const open = all.find((t) => t.id === openId) ?? all[0];
  const row = (t: (typeof all)[number]) => (
    <a
      key={t.id}
      href={`#subagent-${t.id}`}
      className={
        (t.kind === "child" ? "sub-row sub-child" : "sub-row") +
        (t.kind === "quiet" ? " sub-quiet" : "") +
        (openId === t.id ? " is-open" : "")
      }
      aria-current={openId === t.id ? "page" : undefined}
      aria-label={`Open ${t.title}`}
      onClick={(event) => {
        event.preventDefault();
        setOpenId(t.id);
        setRead((current) => new Set(current).add(t.id));
      }}
    >
      <span className="sub-title">{t.title}</span>
      {read.has(t.id) ? null : <i className="sub-dot" />}
    </a>
  );
  return (
    <div
      className="sub-demo"
      role="group"
      aria-label="Subagent threads and the selected conversation"
    >
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
      <div className="sub-main" id={`subagent-${open.id}`} aria-live="polite">
        <span className="sub-main-title">{open.title}</span>
        {open.lines.map((line) => (
          <TranscriptLineView key={line.text} line={line} />
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

// One hunk of applyPromo.ts, numbered like the real Changes panel: the
// deleted line keeps its old number; the replacement lines take over.
type ReviewLine = {
  sign: " " | "+" | "-";
  no: string;
  text: string;
};

type ReviewFile = {
  id: "source" | "test";
  name: string;
  lines: readonly ReviewLine[];
  hasContext: boolean;
};

const REVIEW_LINES = [
  { sign: " ", no: "21", text: "export function applyPromo(cart, code) {" },
  { sign: "-", no: "22", text: "  const percent = PERCENT_CODES[code] ?? 0;" },
  { sign: "+", no: "22", text: "  const percent = Object.hasOwn(" },
  { sign: "+", no: "23", text: "    PERCENT_CODES, code," },
  { sign: "+", no: "24", text: "  ) ? PERCENT_CODES[code] : 0;" },
  {
    sign: " ",
    no: "25",
    text: "  const subtotal = cart.items.reduce(sum, 0);",
  },
  { sign: " ", no: "26", text: "  return round(subtotal * (1 - percent));" },
  { sign: " ", no: "27", text: "}" },
] as const satisfies readonly ReviewLine[];

const REVIEW_TEST_LINES = [
  { sign: "+", no: "12", text: 'it("rejects prototype keys", () => {' },
  {
    sign: "+",
    no: "13",
    text: '  expect(applyPromo(cart, "toString")).toBe(100);',
  },
  { sign: "+", no: "14", text: "});" },
  { sign: "+", no: "15", text: "" },
] as const satisfies readonly ReviewLine[];

const REVIEW_FILES: readonly ReviewFile[] = [
  {
    id: "source",
    name: "applyPromo.ts",
    lines: REVIEW_LINES,
    hasContext: true,
  },
  {
    id: "test",
    name: "promo.test.ts",
    lines: REVIEW_TEST_LINES,
    hasContext: false,
  },
];

function ReviewDemo() {
  const [selection, setSelection] = useState("all");
  const [collapsed, setCollapsed] = useState({ source: false, test: true });
  const [showContext, setShowContext] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [displayMode, setDisplayMode] = useState<"unified" | "split">(
    "unified",
  );
  const allCollapsed = collapsed.source && collapsed.test;
  const totals = REVIEW_FILES.flatMap((file) => file.lines).reduce(
    (count, line) => ({
      additions: count.additions + (line.sign === "+" ? 1 : 0),
      deletions: count.deletions + (line.sign === "-" ? 1 : 0),
    }),
    { additions: 0, deletions: 0 },
  );

  const renderLines = (lines: readonly ReviewLine[]) =>
    lines.map((line, index) => (
      <p
        key={`${line.no}-${line.sign}-${index}`}
        className={
          "review-line" +
          (line.sign === "+" ? " is-add" : line.sign === "-" ? " is-del" : "")
        }
      >
        <span className="review-no">{line.no}</span>
        <span className="review-sign">{line.sign}</span>
        <span>{line.text || " "}</span>
      </p>
    ));

  const renderHunk = (lines: readonly ReviewLine[], hasContext: boolean) => {
    const visibleLines =
      hasContext && !showContext
        ? lines.filter((line) => line.sign !== " ")
        : lines;
    if (displayMode === "unified") return renderLines(visibleLines);
    return (
      <div className="review-split">
        <div>
          {renderLines(visibleLines.filter((line) => line.sign !== "+"))}
        </div>
        <div>
          {renderLines(visibleLines.filter((line) => line.sign !== "-"))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="review-demo"
      role="group"
      aria-label="Changes panel"
      data-wrap={wrapLines ? "wrap" : "scroll"}
    >
      <div className="review-head">
        <DemoPicker
          className="review-scope"
          label="Diff selection"
          value={selection}
          onChange={setSelection}
          options={[
            { value: "all", label: "All changes" },
            { value: "uncommitted", label: "Uncommitted changes" },
          ]}
        />
        <span className="review-count">
          {REVIEW_FILES.length} files
          <em className="review-add">+{totals.additions}</em>
          <em className="review-del">-{totals.deletions}</em>
        </span>
        <div className="review-actions">
          <button
            type="button"
            className="review-tool"
            aria-label={
              allCollapsed ? "Expand all files" : "Collapse all files"
            }
            onClick={() =>
              setCollapsed(
                allCollapsed
                  ? { source: false, test: false }
                  : { source: true, test: true },
              )
            }
          >
            <HugeiconsIcon
              icon={allCollapsed ? ArrowDownDoubleIcon : ArrowUpDoubleIcon}
              className="review-tool-ic"
              aria-hidden
            />
          </button>
          <button
            type="button"
            className="review-tool"
            aria-label={
              wrapLines ? "Disable diff line wrap" : "Wrap diff lines"
            }
            aria-pressed={wrapLines}
            onClick={() => setWrapLines((current) => !current)}
          >
            <HugeiconsIcon
              icon={TextWrapIcon}
              className="review-tool-ic"
              aria-hidden
            />
          </button>
          <div
            className="review-view-modes"
            role="tablist"
            aria-label="Diff view mode"
          >
            <button
              type="button"
              className="review-tool"
              aria-label="Stacked diff view"
              aria-pressed={displayMode === "unified"}
              onClick={() => setDisplayMode("unified")}
            >
              <HugeiconsIcon
                icon={LayoutTwoRowIcon}
                className="review-tool-ic"
                aria-hidden
              />
            </button>
            <button
              type="button"
              className="review-tool"
              aria-label="Split diff view"
              aria-pressed={displayMode === "split"}
              onClick={() => setDisplayMode("split")}
            >
              <HugeiconsIcon
                icon={LayoutTwoColumnIcon}
                className="review-tool-ic"
                aria-hidden
              />
            </button>
          </div>
          <button type="button" className="review-commit" disabled>
            Commit
          </button>
        </div>
      </div>
      {REVIEW_FILES.map((file, index) => {
        const isCollapsed = collapsed[file.id];
        const stats = file.lines.reduce(
          (count, line) => ({
            additions: count.additions + (line.sign === "+" ? 1 : 0),
            deletions: count.deletions + (line.sign === "-" ? 1 : 0),
          }),
          { additions: 0, deletions: 0 },
        );
        return (
          <div
            key={file.id}
            className={
              index === 0 ? "review-file-card" : "review-file-card review-file2"
            }
          >
            <button
              type="button"
              className="review-file-head"
              aria-expanded={!isCollapsed}
              onClick={() =>
                setCollapsed((current) => ({
                  ...current,
                  [file.id]: !current[file.id],
                }))
              }
            >
              {isCollapsed ? (
                <ChevronRight className="review-chev" />
              ) : (
                <ChevronDown className="review-chev" />
              )}
              <span className="review-file">{file.name}</span>
              <span className="review-count">
                {stats.additions > 0 ? (
                  <em className="review-add">+{stats.additions}</em>
                ) : null}
                {stats.deletions > 0 ? (
                  <em className="review-del">-{stats.deletions}</em>
                ) : null}
              </span>
            </button>
            {isCollapsed ? null : (
              <>
                {file.hasContext ? (
                  <button
                    type="button"
                    className="review-fold"
                    aria-expanded={showContext}
                    onClick={() => setShowContext((current) => !current)}
                  >
                    {showContext ? (
                      <ChevronDown className="review-chev" />
                    ) : (
                      <ChevronRight className="review-chev" />
                    )}
                    {showContext
                      ? "Hide unmodified lines"
                      : "Show unmodified lines"}
                  </button>
                ) : null}
                <div className="review-hunk">
                  {renderHunk(file.lines, file.hasContext)}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Signal bars and a battery. Not from the icon set — these are phone
 *  hardware chrome, not product iconography. */


/* bb's own question, on a phone. The thread paused for a decision and it
 * reached you where you are — tapping an option answers it and the agent
 * carries on, which is the claim the desktop ask card made, minus the
 * assumption that you were sitting in front of it. */
function AskPhone() {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : ASK_OPTIONS[picked];
  return (
    <div className="ap">
      {/* The interrupt card and nothing around it. The thread header, the
          provider avatar and the client chrome were a chat app drawn around
          the one component that carries the idea — bb stopping to ask a real
          question. The two lines above the card stay, because without them
          the question has nowhere to have come from. */}
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

/* ────────────────────────────────────────────────
 * PHONE
 *
 * A real device frame with live DOM behind its aperture: the bezel, rails
 * and buttons are one SVG overlay, and the screen is a flex column holding
 * the status bar, the app, and the home indicator. Nothing here claims bb
 * ships a native app — what runs on these screens is Telegram, and bb's own
 * question arriving where you are.
 * ──────────────────────────────────────────────── */

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
      {/* Bubbles only. The title bar, the wallpaper and the message field were
          a Telegram client drawn around three messages — chrome standing in
          for the thing itself. What matters is that you text a request in
          plain language and a thread comes back, and the bubbles carry all of
          that on their own. */}
      <div className="tg-msgs">
          <div className="tg-msg tg-out" style={{ animationDelay: "0.3s" }}>
            <span className="tg-bubble">
              spawn a thread: audit our promo code coverage
              <span className="tg-time">9:41</span>
            </span>
          </div>
          {/* Telegram shows the bot typing while it works. The indicator and
              the reply it becomes are stacked in one grid cell rather than
              being two rows, so the handoff is a cross-fade in place. An
              earlier version collapsed the indicator's height on a keyframe,
              which reflowed everything under it — the reply visibly dropped
              and then snapped back once the animation ended. */}
          <div className="tg-swap">
            <div className="tg-msg tg-in tg-typing" aria-hidden>
              <span className="tg-bubble">
                <span className="tg-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </span>
            </div>
            <div className="tg-msg tg-in" style={{ animationDelay: "1.9s" }}>
              <span className="tg-bubble">
                On it. Spawning a worker thread.
                <span className="tg-cmd mono">bb thread spawn</span>
              </span>
            </div>
          </div>
          <div className="tg-msg tg-in" style={{ animationDelay: "2.9s" }}>
            <div className="tg-thread">
              <div className="tg-thread-top">
                <span aria-hidden="true" className="bb-mark tg-thread-mark" />
                <span className="tg-thread-eyebrow">Worker thread</span>
                <span className="tg-stat" aria-hidden>
                  <span
                    className="tg-stat-spawn"
                    style={{ animationDelay: "4s" }}
                  >
                    <Spinner className="tg-spin" />
                    spawning
                  </span>
                  <span
                    className="tg-stat-run"
                    style={{ animationDelay: "4s" }}
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
  );
}

const BUILD_PROMPT = "Add Tasks as a built-in plugin";

const BUILD_NEW_THREAD = {
  id: "new",
  project: "storefront",
  title: "New thread",
  lines: [] as readonly TranscriptLine[],
} as const;

const BUILD_THREADS = [
  {
    id: "build",
    project: "storefront",
    title: BUILD_PROMPT,
    lines: [
      { kind: "you", text: BUILD_PROMPT },
      { kind: "step", text: "Read plugins/tasks/package.json" },
      { kind: "step", text: "Opened the Tasks app entry" },
      { kind: "step", text: "Opened the Tasks server entry" },
      {
        kind: "say",
        text: "The manifest points to separate app, server, and skills entries. The app registers the Tasks panel, a Task thread action, and task cards.",
      },
      {
        kind: "say",
        text: "The server separately registers the bb tasks CLI, delegation, mentions, lifecycle, and RPC. Tasks is open in the sidebar.",
      },
    ] satisfies readonly TranscriptLine[],
  },
  {
    id: "audit",
    project: "storefront",
    title: "Audit promo code coverage",
    lines: [
      { kind: "step", text: "Read promo.test.ts" },
      {
        kind: "say",
        text: "The suite covers percent and fixed codes, but not a second code on an already-discounted cart.",
      },
    ] satisfies readonly TranscriptLine[],
  },
  {
    id: "trace",
    project: "storefront",
    title: "Trace order checkout flow",
    lines: [
      { kind: "step", text: "Explored the checkout flow" },
      {
        kind: "say",
        text: "The checkout path resolves the cart, applies the promo, then creates the order.",
      },
    ] satisfies readonly TranscriptLine[],
  },
  {
    id: "cart",
    project: "storefront",
    title: "Summarize checkout cart integration",
    lines: [
      { kind: "step", text: "Explored the cart integration" },
      {
        kind: "say",
        text: "The cart owns totals; checkout posts the resolved values.",
      },
    ] satisfies readonly TranscriptLine[],
  },
  {
    id: "release",
    project: "storefront",
    title: "Cut the 1.4 release notes",
    lines: [
      { kind: "step", text: "Read CHANGELOG.md" },
      {
        kind: "say",
        text: "The release notes now lead with checkout reliability and the promo fix.",
      },
    ] satisfies readonly TranscriptLine[],
  },
  {
    id: "validation",
    project: "checkout-api",
    title: "Describe order endpoint validation",
    lines: [
      { kind: "step", text: "Read routes/orders.ts" },
      {
        kind: "say",
        text: "The endpoint validates the request before it writes the order.",
      },
    ] satisfies readonly TranscriptLine[],
  },
  {
    id: "route",
    project: "checkout-api",
    title: "Summarize service route",
    lines: [
      { kind: "step", text: "Read the route" },
      {
        kind: "say",
        text: "One POST validates the cart and returns the created order.",
      },
    ] satisfies readonly TranscriptLine[],
  },
] as const;

type BuildPanelKey = "extensions" | "automations" | "tasks";

const BUILD_PANEL_ROWS = {
  extensions: [
    { id: "plugins-browse", meta: "Plugins", title: "Browse plugins" },
    { id: "plugins-installed", meta: "Plugins", title: "Installed plugins" },
    { id: "skills-browse", meta: "Skills", title: "Browse skills" },
    { id: "skills-library", meta: "Skills", title: "My skills" },
  ],
  automations: [
    { id: "automations-installed", meta: "Automations", title: "Installed" },
    { id: "automations-browse", meta: "Automations", title: "Browse" },
  ],
  tasks: [
    { id: "task-audit", meta: "Todo", title: "Audit promo code coverage" },
    {
      id: "task-checkout",
      meta: "In Progress",
      title: "Trace order checkout flow",
    },
    {
      id: "task-release",
      meta: "In Review",
      title: "Cut the 1.4 release notes",
    },
  ],
} as const;

const BUILD_PANEL_DESCRIPTIONS: Record<BuildPanelKey, string | null> = {
  extensions: null,
  automations: "Schedule recurring and one-shot agent or script work.",
  tasks:
    "Plan and track work in BB, delegate tasks to agents, and keep task context connected to worker threads.",
};

function BuildDemo() {
  const [railOpen, setRailOpen] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState("build");
  const [activePanel, setActivePanel] = useState<BuildPanelKey>("tasks");
  const [selectedPanelRow, setSelectedPanelRow] = useState("task-audit");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const buildSearchRef = useRef<HTMLInputElement>(null);

  useDismiss(
    searchOpen,
    () => {
      setQuery("");
      setSearchOpen(false);
    },
    buildSearchRef,
  );
  const activeThread =
    activeThreadId === BUILD_NEW_THREAD.id
      ? BUILD_NEW_THREAD
      : (BUILD_THREADS.find((thread) => thread.id === activeThreadId) ??
        BUILD_THREADS[0]);
  const filteredThreads = BUILD_THREADS.filter((thread) =>
    thread.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const panelRows = BUILD_PANEL_ROWS[activePanel];
  const panelDescription = BUILD_PANEL_DESCRIPTIONS[activePanel];

  return (
    <div
      className="build-demo"
      role="group"
      aria-label="A bb thread beside the built-in Tasks plugin"
    >
      <div className="dwin-bar">
        <button
          type="button"
          className="dwin-rail-toggle"
          aria-label={railOpen ? "Hide sidebar" : "Show sidebar"}
          aria-expanded={railOpen}
          aria-controls="build-rail"
          onClick={() => setRailOpen((open) => !open)}
        >
          <PanelIcon className="ri bar-ic" />
        </button>
        <span className="dwin-title">{activeThread.title}</span>
        <span className="gang-commit" aria-hidden="true">
          Commit
          <ChevronDown className="gang-commit-chev" />
        </span>
      </div>
      <div className={railOpen ? "gang-body" : "gang-body rail-closed"}>
        <div className="gang-side" id="build-rail" hidden={!railOpen}>
          <div className="side-row-new">
            <button
              type="button"
              className={
                activeThread.id === BUILD_NEW_THREAD.id
                  ? "side-act active-act"
                  : "side-act"
              }
              aria-pressed={activeThread.id === BUILD_NEW_THREAD.id}
              onClick={() => setActiveThreadId(BUILD_NEW_THREAD.id)}
            >
              <NewThreadIcon className="sa-ic" />
              New thread
            </button>
            <button
              type="button"
              className="side-search"
              aria-label="Search threads"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((current) => !current)}
            >
              <SearchGlyph className="sa-ic" />
            </button>
          </div>
          {searchOpen ? (
            <input
              className="build-search"
              aria-label="Search threads"
              value={query}
              ref={buildSearchRef}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search threads"
            />
          ) : null}
          <button
            type="button"
            className={
              activePanel === "extensions" ? "side-act active-act" : "side-act"
            }
            aria-pressed={activePanel === "extensions"}
            onClick={() => {
              setActivePanel("extensions");
              setSelectedPanelRow("plugins-browse");
            }}
          >
            <ToolboxGlyph className="sa-ic" />
            Extensions
          </button>
          <button
            type="button"
            className={
              activePanel === "automations" ? "side-act active-act" : "side-act"
            }
            aria-pressed={activePanel === "automations"}
            onClick={() => {
              setActivePanel("automations");
              setSelectedPanelRow("automations-installed");
            }}
          >
            <ClockIcon className="sa-ic" />
            Automations
          </button>
          <button
            type="button"
            className={
              activePanel === "tasks" ? "side-act active-act" : "side-act"
            }
            aria-pressed={activePanel === "tasks"}
            onClick={() => {
              setActivePanel("tasks");
              setSelectedPanelRow("task-audit");
            }}
          >
            <ChecklistGlyph className="sa-ic" />
            Tasks
          </button>
          {["storefront", "checkout-api"].map((project) => {
            const projectThreads = filteredThreads.filter(
              (thread) => thread.project === project,
            );
            if (projectThreads.length === 0) return null;
            return (
              <div className="build-thread-group" key={project}>
                <span className="sub-group gang-gap">{project}</span>
                {projectThreads.map((thread) => (
                  <a
                    key={thread.id}
                    href={`#build-${thread.id}`}
                    className={
                      activeThread.id === thread.id
                        ? "sub-row gang-row is-open"
                        : "sub-row gang-row"
                    }
                    aria-current={
                      activeThread.id === thread.id ? "page" : undefined
                    }
                    aria-label={`Open ${thread.title}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveThreadId(thread.id);
                    }}
                  >
                    <span className="sub-title">{thread.title}</span>
                    {activeThread.id === thread.id ? null : (
                      <i className="sub-dot" aria-hidden />
                    )}
                  </a>
                ))}
              </div>
            );
          })}
        </div>
        <div className="gang-thread" id={`build-${activeThread.id}`}>
          <div className="gang-feed" aria-live="polite">
            {activeThread.lines.map((line) => (
              <TranscriptLineView key={line.text} line={line} />
            ))}
          </div>
          <div className="gang-pr" aria-hidden>
            <GitMergeIcon className="gang-pr-ic" />
            <span className="gang-pr-strong">Uncommitted changes</span>
          </div>
          <div className="gang-composer">
            <label className="sr-only" htmlFor="build-follow-up">
              Ask a follow-up
            </label>
            <input id="build-follow-up" placeholder="Ask a follow-up" />
            <button
              type="button"
              className="gang-send"
              aria-label="Send"
              disabled
            >
              <SendIcon className="gang-send-ic" />
            </button>
          </div>
          <div className="gang-ctx" aria-hidden>
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
          </div>
        </div>
        <div
          className="build-panel"
          role="region"
          aria-label={`${activePanel} panel`}
        >
          <div className="build-panel-bar">
            {activePanel === "tasks" ? (
              <ChecklistGlyph className="build-panel-ic" />
            ) : activePanel === "automations" ? (
              <ClockIcon className="build-panel-ic" />
            ) : (
              <ToolboxGlyph className="build-panel-ic" />
            )}
            <span className="build-panel-title">
              {activePanel === "tasks"
                ? "Tasks"
                : activePanel === "automations"
                  ? "Automations"
                  : "Extensions"}
            </span>
            <span className="build-panel-actions" aria-hidden>
              <HugeiconsIcon
                icon={ArrowExpand01Icon}
                className="build-panel-ic"
              />
              <HugeiconsIcon
                icon={SidebarRightIcon}
                className="build-panel-ic"
              />
            </span>
          </div>
          <ul className="build-queue">
            {panelRows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="build-queue-row"
                  aria-pressed={selectedPanelRow === row.id}
                  onClick={() => setSelectedPanelRow(row.id)}
                >
                  <span className="build-queue-ask">{row.meta}</span>
                  <span className="build-queue-title">{row.title}</span>
                </button>
              </li>
            ))}
          </ul>
          {panelDescription ? (
            <p className="build-queue-foot">{panelDescription}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type GangProvider =
  | "claude"
  | "codex"
  | "cursor"
  | "pi"
  | "opencode"
  | "grok"
  | "omp"
  | "hermes";

/** The eight providers the section already claims, as the app labels them. */
const GANG_PROVIDER_META: Record<
  GangProvider,
  { Icon: (props: { className?: string }) => ReactNode; label: string }
> = {
  claude: { Icon: ClaudeIcon, label: "Claude Code" },
  codex: { Icon: OpenAiIcon, label: "Codex" },
  cursor: { Icon: CursorIcon, label: "Cursor" },
  pi: { Icon: PiIcon, label: "Pi" },
  opencode: { Icon: OpencodeIcon, label: "OpenCode" },
  grok: { Icon: GrokIcon, label: "Grok" },
  omp: { Icon: OmpIcon, label: "omp" },
  hermes: { Icon: HermesAgentIcon, label: "Hermes" },
};

type GangThread = {
  id: string;
  project: "storefront" | "checkout-api" | "mobile";
  title: string;
  branch: string;
  depth?: 1;
  status: "done" | "running" | "waiting";
  provider: GangProvider;
  lines: readonly TranscriptLine[];
};

const GANG_THREADS: readonly GangThread[] = [
  {
    id: "audit-promo",
    project: "storefront",
    title: "Audit promo code coverage",
    branch: "bb/audit-promo-coverage",
    status: "done",
    provider: "claude",
    lines: [
      { kind: "step", text: "Read promo.ts, cart.ts, checkout.ts" },
      {
        kind: "say",
        text: "The suite covers percent and fixed codes, but not a second code on an already-discounted cart.",
      },
      { kind: "step", text: "Explored the promo call sites" },
      {
        kind: "say",
        text: "PERCENT_CODES also needs an own-property check so a prototype key cannot become a discount rate.",
      },
      { kind: "step", text: "Edited promo.test.ts" },
      {
        kind: "say",
        text: "The promo suite passes with stacked-code, prototype-key, empty-cart, and rounding coverage.",
      },
    ],
  },
  {
    id: "trace-checkout",
    project: "storefront",
    title: "Trace order checkout flow",
    branch: "bb/trace-order-checkout",
    status: "done",
    provider: "codex",
    lines: [
      { kind: "step", text: "Read checkout.ts, cart.ts, tax.ts" },
      {
        kind: "say",
        text: "Cart totals resolve before promo codes apply, so the discount sees a settled subtotal.",
      },
      { kind: "step", text: "Spawned a subagent" },
      {
        kind: "say",
        text: "The order is cart, then promo, then tax. Express checkout is the only path that assembles its own total.",
      },
    ],
  },
  {
    id: "confirm-totals",
    project: "storefront",
    title: "Confirm the checkout totals",
    branch: "bb/confirm-checkout-totals",
    depth: 1,
    status: "running",
    provider: "pi",
    lines: [
      { kind: "step", text: "Read express-checkout.ts" },
      {
        kind: "say",
        text: "Express checkout applies promo after tax. I am tracing the shared total before reporting back.",
      },
    ],
  },
  {
    id: "promo-impact",
    project: "storefront",
    title: "Explain promo checkout impact",
    branch: "bb/explain-promo-impact",
    status: "waiting",
    provider: "cursor",
    lines: [
      { kind: "step", text: "Read checkout.ts" },
      {
        kind: "say",
        text: "Should the explanation include express checkout, or stay with the standard cart path?",
      },
    ],
  },
  {
    id: "cart-integration",
    project: "storefront",
    title: "Summarize checkout cart integration",
    branch: "bb/summarize-cart-integration",
    status: "done",
    provider: "opencode",
    lines: [
      { kind: "step", text: "Explored the cart integration" },
      {
        kind: "say",
        text: "The cart owns totals; checkout posts the resolved values and reads the order back for confirmation.",
      },
    ],
  },
  {
    id: "release-notes",
    project: "storefront",
    title: "Cut the 1.4 release notes",
    branch: "bb/release-notes",
    status: "done",
    provider: "grok",
    lines: [
      { kind: "step", text: "Read CHANGELOG.md" },
      {
        kind: "say",
        text: "The release notes now lead with checkout reliability and the promo fix.",
      },
    ],
  },
  {
    id: "service-route",
    project: "checkout-api",
    title: "Summarize service route",
    branch: "bb/summarize-service-route",
    status: "done",
    provider: "omp",
    lines: [
      { kind: "step", text: "Read routes/orders.ts" },
      {
        kind: "say",
        text: "One POST owns validation, idempotency, the write, and webhook fan-out.",
      },
      { kind: "step", text: "Wrote docs/orders-route.md" },
      {
        kind: "say",
        text: "The summary calls out the idempotency key lifetime and each failure boundary.",
      },
    ],
  },
  {
    id: "endpoint-validation",
    project: "checkout-api",
    title: "Describe order endpoint validation",
    branch: "bb/order-validation",
    status: "done",
    provider: "hermes",
    lines: [
      { kind: "step", text: "Read the order schema" },
      {
        kind: "say",
        text: "The route rejects an empty cart before it writes and validates each line before pricing.",
      },
    ],
  },
  {
    id: "order-errors",
    project: "checkout-api",
    title: "Explain orders error handling",
    branch: "bb/order-errors",
    status: "done",
    provider: "claude",
    lines: [
      { kind: "step", text: "Read the error branches" },
      {
        kind: "say",
        text: "Validation errors return before the write; downstream failures share the route's guarded operation.",
      },
    ],
  },
  {
    id: "readme",
    project: "mobile",
    title: "Suggest README improvement",
    branch: "bb/readme-improvement",
    status: "running",
    provider: "codex",
    lines: [
      { kind: "step", text: "Read README.md" },
      {
        kind: "say",
        text: "The setup guide names the command but not the expected first screen. I am adding that checkpoint.",
      },
    ],
  },
  {
    id: "package-scripts",
    project: "mobile",
    title: "Explain package scripts",
    branch: "bb/explain-package-scripts",
    status: "done",
    provider: "pi",
    lines: [
      { kind: "step", text: "Read package.json" },
      {
        kind: "say",
        text: "The scripts separate local development, verification, and the release build.",
      },
    ],
  },
];

function GangDemo() {
  const [railOpen, setRailOpen] = useState(true);
  const [openId, setOpenId] = useState("trace-checkout");
  const open =
    GANG_THREADS.find((thread) => thread.id === openId) ?? GANG_THREADS[0];
  const OpenProviderIcon = GANG_PROVIDER_META[open.provider].Icon;

  const renderThreadRow = (thread: GangThread) => {
    const control = (
      <a
        key={thread.id}
        href={`#gang-${thread.id}`}
        className={
          "sub-row gang-row" +
          (thread.depth ? " gang-kid" : "") +
          (open.id === thread.id ? " is-open" : "")
        }
        aria-current={open.id === thread.id ? "page" : undefined}
        aria-label={`Open ${thread.title}`}
        onClick={(event) => {
          event.preventDefault();
          setOpenId(thread.id);
        }}
      >
        <span className="sub-title">{thread.title}</span>
        {open.id === thread.id ? null : thread.status === "waiting" ? (
          <HugeiconsIcon
            icon={MessageQuestionIcon}
            className="gang-wait"
            aria-hidden
          />
        ) : thread.status === "running" ? (
          <DemoSpinner />
        ) : (
          <i className="sub-dot" aria-hidden />
        )}
      </a>
    );
    if (!thread.depth) return control;
    return (
      <div className="sub-kids" key={thread.id}>
        <i className="sub-guide" aria-hidden />
        {control}
      </div>
    );
  };

  return (
    <div
      className="gang-demo"
      role="group"
      aria-label="A bb window with one thread open and others running"
    >
      <div className="dwin-bar">
        <button
          type="button"
          className="dwin-rail-toggle"
          aria-label={railOpen ? "Hide sidebar" : "Show sidebar"}
          aria-expanded={railOpen}
          aria-controls="gang-rail"
          onClick={() => setRailOpen((open) => !open)}
        >
          <PanelIcon className="ri bar-ic" />
        </button>
        <span className="dwin-title">{open.title}</span>
        <span className="gang-commit" aria-hidden="true">
          Commit
          <ChevronDown className="gang-commit-chev" />
        </span>
      </div>
      <div className={railOpen ? "gang-body" : "gang-body rail-closed"}>
        <div className="gang-side" id="gang-rail" hidden={!railOpen}>
          <div className="sub-top" aria-hidden>
            <span className="sub-newthread">
              <NewThreadIcon className="sub-top-ic" />
              New thread
            </span>
            <SearchGlyph className="sub-top-ic sub-search" />
          </div>
          {(["storefront", "checkout-api", "mobile"] as const).map(
            (project) => (
              <div className="gang-project" key={project}>
                <span className="sub-group">{project}</span>
                {GANG_THREADS.filter(
                  (thread) => thread.project === project,
                ).map(renderThreadRow)}
              </div>
            ),
          )}
        </div>
        <div className="gang-thread" id={`gang-${open.id}`}>
          <div className="gang-feed" aria-live="polite">
            {open.lines.map((line) => (
              <TranscriptLineView key={line.text} line={line} />
            ))}
          </div>
          <div className="gang-pr" aria-hidden>
            <GitMergeIcon className="gang-pr-ic" />
            <span className="gang-pr-strong">Uncommitted changes</span>
          </div>
          <div className="gang-composer">
            <label className="sr-only" htmlFor="gang-follow-up">
              Ask a follow-up
            </label>
            <input
              id="gang-follow-up"
              placeholder="Ask a follow-up"
              readOnly
              tabIndex={-1}
              aria-hidden
            />
            <button
              type="button"
              className="gang-send"
              aria-label="Send"
              disabled
            >
              <SendIcon className="gang-send-ic" />
            </button>
          </div>
          <div className="gang-ctx" aria-hidden>
            <span className="gang-ctx-item">
              <OpenProviderIcon className="gang-ctx-ic" />
              {GANG_PROVIDER_META[open.provider].label}
              <ChevronDown className="gang-commit-chev" />
            </span>
            <span className="gang-ctx-item">
              <FolderGitIcon className="gang-ctx-ic" />
              Worktree
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
  // Reading a thread clears its dot for good. The dot is unread state, not a
  // stand-in for "not currently selected".
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set());
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
                onClick={() => {
                  setPicked(c.id);
                  setRead((current) => new Set(current).add(c.id));
                }}
              >
                <Glyph className="gang-pv" />
                <span className="sub-title">
                  {st >= 3 ? c.title : "New thread"}
                </span>
                {st >= 4 ? (
                  read.has(c.id) ? null : (
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
/**
 * The merged-PR feed, and the page's most direct piece of evidence.
 *
 * The headline claims the IDE builds itself. This is where that stops being a
 * claim: each row marked `agent` is a pull request whose body carries the
 * "AGENT GENERATED" line the repo requires of agent-created PRs — the same tag
 * the aggregate count in the stats block is computed from, so the feed and the
 * stat are derived from one query and cannot disagree.
 *
 * It scrolls. The list is rendered twice and the track translated by exactly
 * half its height, so the second copy arrives where the first began and the
 * loop has no seam; the duplicate is `aria-hidden` so a screen reader is not
 * read eighteen pull requests twice. It pauses on hover, because every row is
 * a link and a moving target is a hostile one. Under reduced motion the track
 * stops and the mask lifts, which leaves the full static list — the same thing
 * a prerender and a screenshot get.
 */
function PRFeed() {
  const rows = (duplicate: boolean) =>
    PR_FEED.map((pr) => {
      const url =
        CONTRIBUTOR_AVATARS[`../assets/contributors/${pr.login}.webp`];
      return (
        <li key={`${duplicate ? "b" : "a"}-${pr.number}`}>
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            tabIndex={duplicate ? -1 : undefined}
          >
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
    });

  return (
    <div className="pr-feed rail" aria-label="Recently merged pull requests">
      <div className="pr-feed-clip">
        <div className="pr-feed-track">
          <ul>{rows(false)}</ul>
          <ul aria-hidden>{rows(true)}</ul>
        </div>
      </div>
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

/**
 * The closer's three plates.
 *
 * Supplied as finished artwork rather than derived from bb's tokens, so they
 * are reproduced verbatim — stroke values included. They are drawn for a
 * near-black ground with light strokes, which is why `--cg-plate` is a fixed
 * dark literal in both themes rather than a step off `--canvas`: give this art
 * a light ground and its depth ordering inverts. Same reasoning as
 * `--tg-card`, which holds Telegram's own surface colour for the same reason.
 */
const PlateLocal = () => (
  <svg viewBox="0 0 280 280" className="cg-plate" aria-hidden focusable="false">
    <defs>
      <filter id="cgLocalGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#08090A" />
      </filter>
      <filter id="cgLocalDrop" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#08090A" floodOpacity="0.6" />
      </filter>
    </defs>
    <path d="M134.2 80.9 A13 13 0 0 1 145.8 80.9 L224.5 120.2 A6.3 6.3 0 0 1 228 125.9 L228 198.1 A6.3 6.3 0 0 1 224.5 203.8 L145.8 243.1 A13 13 0 0 1 134.2 243.1 L55.5 203.8 A6.3 6.3 0 0 1 52 198.1 L52 125.9 A6.3 6.3 0 0 1 55.5 120.2 L134.2 80.9 Z" fill="none" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" />
    <path d="M54 123 L134.1 163 A13.2 13.2 0 0 0 145.9 163 L226 123" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" />
    <path d="M60 202L140 162" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" opacity="0.9" />
    <path d="M140 162L220 202" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" opacity="0.9" />
    <g filter="url(#cgLocalGlow)">
      <path d="M137.2 134.4 A6.2 6.2 0 0 1 142.8 134.4 L180.3 153.2 A3 3 0 0 1 182 155.9 L182 198.1 A3 3 0 0 1 180.3 200.8 L142.8 219.6 A6.2 6.2 0 0 1 137.2 219.6 L99.7 200.8 A3 3 0 0 1 98 198.1 L98 155.9 A3 3 0 0 1 99.7 153.2 L137.2 134.4 Z" fill="#08090A" stroke="#D0D6E0" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M100 155 L137.2 173.6 A6.3 6.3 0 0 0 142.8 173.6 L180 155" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" />
    </g>
    <g filter="url(#cgLocalDrop)">
      <path d="M134.2 36.9 A13 13 0 0 1 145.8 36.9 L225.2 76.6 A5 5 0 0 1 228 81.1 L228 86.9 A5 5 0 0 1 225.2 91.4 L145.8 131.1 A13 13 0 0 1 134.2 131.1 L54.8 91.4 A5 5 0 0 1 52 86.9 L52 81.1 A5 5 0 0 1 54.8 76.6 L134.2 36.9 Z" fill="#08090A" stroke="#D0D6E0" strokeWidth="0.5" strokeLinecap="round" />
    </g>
    <path d="M54 79 L134.1 119 A13.2 13.2 0 0 0 145.9 119 L226 79" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" />
    <path d="M52 83v22" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1 3" />
    <path d="M228 83v22" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1 3" />
    <path d="M140 139v22" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1 3" />
  </svg>
);

const PlateStack = () => (
  <svg viewBox="0 0 280 280" className="cg-plate" aria-hidden focusable="false">
    <defs>
      <filter id="cgStackGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#08090A" />
      </filter>
    </defs>
    <g transform="translate(6 18)">
      <path d="M40 81L40 200" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1 3" opacity="0.6" />
      <path d="M36.5 81L43.5 81" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
      <path d="M36.5 200L43.5 200" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
      <path d="M134.7 151.6 A11.8 11.8 0 0 1 145.3 151.6 L217.4 187.7 A4.6 4.6 0 0 1 220 191.9 L220 197.1 A4.6 4.6 0 0 1 217.4 201.3 L145.3 237.4 A11.8 11.8 0 0 1 134.7 237.4 L62.6 201.3 A4.6 4.6 0 0 1 60 197.1 L60 191.9 A4.6 4.6 0 0 1 62.6 187.7 L134.7 151.6 Z" fill="#08090A" stroke="#4A4A52" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M62 190 L134.6 226.3 A12 12 0 0 0 145.4 226.3 L218 190" fill="none" stroke="#26262A" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M134.7 133.6 A11.8 11.8 0 0 1 145.3 133.6 L217.4 169.7 A4.6 4.6 0 0 1 220 173.9 L220 179.1 A4.6 4.6 0 0 1 217.4 183.3 L145.3 219.4 A11.8 11.8 0 0 1 134.7 219.4 L62.6 183.3 A4.6 4.6 0 0 1 60 179.1 L60 173.9 A4.6 4.6 0 0 1 62.6 169.7 L134.7 133.6 Z" fill="#08090A" stroke="#4A4A52" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M62 172 L134.6 208.3 A12 12 0 0 0 145.4 208.3 L218 172" fill="none" stroke="#26262A" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M134.7 115.6 A11.8 11.8 0 0 1 145.3 115.6 L217.4 151.7 A4.6 4.6 0 0 1 220 155.9 L220 161.1 A4.6 4.6 0 0 1 217.4 165.3 L145.3 201.4 A11.8 11.8 0 0 1 134.7 201.4 L62.6 165.3 A4.6 4.6 0 0 1 60 161.1 L60 155.9 A4.6 4.6 0 0 1 62.6 151.7 L134.7 115.6 Z" fill="#08090A" stroke="#4A4A52" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M62 154 L134.6 190.3 A12 12 0 0 0 145.4 190.3 L218 154" fill="none" stroke="#26262A" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M134.7 97.6 A11.8 11.8 0 0 1 145.3 97.6 L217.4 133.7 A4.6 4.6 0 0 1 220 137.9 L220 143.1 A4.6 4.6 0 0 1 217.4 147.3 L145.3 183.4 A11.8 11.8 0 0 1 134.7 183.4 L62.6 147.3 A4.6 4.6 0 0 1 60 143.1 L60 137.9 A4.6 4.6 0 0 1 62.6 133.7 L134.7 97.6 Z" fill="#08090A" stroke="#4A4A52" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M62 136 L134.6 172.3 A12 12 0 0 0 145.4 172.3 L218 136" fill="none" stroke="#26262A" strokeWidth="0.5" strokeLinecap="round" />
      <g filter="url(#cgStackGlow)">
        <path d="M134.7 79.6 A11.8 11.8 0 0 1 145.3 79.6 L217.4 115.7 A4.6 4.6 0 0 1 220 119.9 L220 125.1 A4.6 4.6 0 0 1 217.4 129.3 L145.3 165.4 A11.8 11.8 0 0 1 134.7 165.4 L62.6 129.3 A4.6 4.6 0 0 1 60 125.1 L60 119.9 A4.6 4.6 0 0 1 62.6 115.7 L134.7 79.6 Z" fill="#08090A" stroke="#D0D6E0" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M62 118 L134.6 154.3 A12 12 0 0 0 145.4 154.3 L218 118" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" />
      </g>
      <g filter="url(#cgStackGlow)">
        <path d="M134.7 61.6 A11.8 11.8 0 0 1 145.3 61.6 L217.4 97.7 A4.6 4.6 0 0 1 220 101.9 L220 107.1 A4.6 4.6 0 0 1 217.4 111.3 L145.3 147.4 A11.8 11.8 0 0 1 134.7 147.4 L62.6 111.3 A4.6 4.6 0 0 1 60 107.1 L60 101.9 A4.6 4.6 0 0 1 62.6 97.7 L134.7 61.6 Z" fill="#08090A" stroke="#D0D6E0" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M62 100 L134.6 136.3 A12 12 0 0 0 145.4 136.3 L218 100" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" />
      </g>
      <g filter="url(#cgStackGlow)">
        <path d="M134.7 43.6 A11.8 11.8 0 0 1 145.3 43.6 L217.4 79.7 A4.6 4.6 0 0 1 220 83.9 L220 89.1 A4.6 4.6 0 0 1 217.4 93.3 L145.3 129.4 A11.8 11.8 0 0 1 134.7 129.4 L62.6 93.3 A4.6 4.6 0 0 1 60 89.1 L60 83.9 A4.6 4.6 0 0 1 62.6 79.7 L134.7 43.6 Z" fill="#08090A" stroke="#D0D6E0" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M62 82 L134.6 118.3 A12 12 0 0 0 145.4 118.3 L218 82" fill="none" stroke="#2E2E32" strokeWidth="0.5" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

const PlateFleet = () => (
  <svg viewBox="0 0 280 280" className="cg-plate" aria-hidden focusable="false">
    <defs>
      <filter id="cgFleetGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#08090A" />
      </filter>
    </defs>
    <g transform="translate(5 -3)">
      <path d="M22 84.6 A9 9 0 0 1 35 76.5 L101 109.5 A9 9 0 0 1 106 117.6 L106 157.4 A9 9 0 0 1 93 165.5 L27 132.5 A9 9 0 0 1 22 124.4 L22 84.6 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.28" />
      <path d="M41 70.1 A9 9 0 0 1 54 62 L120 95 A9 9 0 0 1 125 103.1 L125 166.9 A9 9 0 0 1 112 175 L46 142 A9 9 0 0 1 41 133.9 L41 70.1 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.41" />
      <path d="M60 57.6 A9 9 0 0 1 73 49.5 L139 82.5 A9 9 0 0 1 144 90.6 L144 176.4 A9 9 0 0 1 131 184.5 L65 151.5 A9 9 0 0 1 60 143.4 L60 57.6 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.55" />
      <path d="M79 49.1 A9 9 0 0 1 92 41 L158 74 A9 9 0 0 1 163 82.1 L163 185.9 A9 9 0 0 1 150 194 L84 161 A9 9 0 0 1 79 152.9 L79 49.1 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
      <g filter="url(#cgFleetGlow)">
        <path d="M98 50.6 A9 9 0 0 1 111 42.5 L177 75.5 A9 9 0 0 1 182 83.6 L182 195.4 A9 9 0 0 1 169 203.5 L103 170.5 A9 9 0 0 1 98 162.4 L98 50.6 Z" fill="#08090A" stroke="#D0D6E0" strokeWidth="0.5" strokeLinecap="round" />
      </g>
      <path d="M117 66.1 A9 9 0 0 1 130 58 L196 91 A9 9 0 0 1 201 99.1 L201 204.9 A9 9 0 0 1 188 213 L122 180 A9 9 0 0 1 117 171.9 L117 66.1 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
      <path d="M136 91.6 A9 9 0 0 1 149 83.5 L215 116.5 A9 9 0 0 1 220 124.6 L220 214.4 A9 9 0 0 1 207 222.5 L141 189.5 A9 9 0 0 1 136 181.4 L136 91.6 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.55" />
      <path d="M155 123.1 A9 9 0 0 1 168 115 L234 148 A9 9 0 0 1 239 156.1 L239 223.9 A9 9 0 0 1 226 232 L160 199 A9 9 0 0 1 155 190.9 L155 123.1 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.41" />
      <path d="M174 156.6 A9 9 0 0 1 187 148.5 L253 181.5 A9 9 0 0 1 258 189.6 L258 233.4 A9 9 0 0 1 245 241.5 L179 208.5 A9 9 0 0 1 174 200.4 L174 156.6 Z" fill="#08090A" stroke="#62666D" strokeWidth="0.5" strokeLinecap="round" opacity="0.28" />
      <path d="M12 141L184 227" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1 3" opacity="0.55" />
      <path d="M12 137L12 145" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" opacity="0.55" />
      <path d="M184 223L184 231" fill="none" stroke="#3E3E44" strokeWidth="0.5" strokeLinecap="round" opacity="0.55" />
    </g>
  </svg>
);

/**
 * The closer's three plates.
 *
 * Currently unrendered — the call site in `LandingPage` is commented out.
 * Kept whole rather than deleted because the artwork was supplied for it and
 * the composition is finished; restoring it is one line.
 *
 * The plates are that supplied artwork, reproduced verbatim. They are drawn
 * with light strokes over near-black fills, so their box takes `--bg` and the
 * plates invert in light mode — give this art a light ground untouched and
 * its depth ordering falls apart.
 */
function CloserPlates() {
  return (
        <div className="cg-shell rail">
          <div className="cg-card">
            <div className="cg-panel">
              <PlateLocal />
            </div>
            <h3>Stays on your machine</h3>
            <p>
              Local-first by default. Agents work in real worktrees beside the
              code, and nothing leaves until you push it.
            </p>
          </div>

          <div className="cg-card">
            <div className="cg-panel">
              <PlateStack />
            </div>
            <h3>Every thread compounds</h3>
            <p>
              Runs, files, and the decisions you made stack into context the
              next agent picks up without being told twice.
            </p>
          </div>

          <div className="cg-card">
            <div className="cg-panel">
              <PlateFleet />
            </div>
            <h3>A fleet from one prompt</h3>
            <p>
              Claude, Codex, Cursor and Pi fan out in parallel, in one mission
              control.
            </p>
          </div>
        </div>
  );
}

function LandingPage() {
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
        <p className="section-lead">
          Mission control for coding agents. Claude Code, Codex, Cursor, and Pi
          run in one place, each in its own thread, in an IDE they can rebuild.
        </p>
        <InstallOptions placement="hero" />

        <ul className="hero-economics">
          {["Free", "MIT", "Local-first", "No subscriptions"].map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>

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
          <h2>More than a chat</h2>
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
            {/* No device frame. The bezel was drawn furniture wrapped around
                the only part anyone reads, and it cost the conversation half
                its width to say "this is a phone" — which the content already
                says, being a chat. */}
            <div className="bento-component bento-chat">
              <AgentChat />
            </div>
          </li>
          <li className="bento-phone">
            <h3>Answer from anywhere</h3>
            <p>The question finds you instead of waiting at your desk.</p>
            <div className="bento-component bento-chat">
              <AskPhone />
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
      <div className="closer-room rail">
        <section className="closer">
          <h2 className="sec-title">Put your agents to work</h2>
          <p className="section-lead">
            Free, open source, and local-first. Install in under a minute.
          </p>
          <InstallOptions placement="closer" />

          {/* Shelved, not deleted: <CloserPlates /> */}
        </section>
      </div>

      {/* Outside the room, below it, on the same width. The room is the offer;
          the signup is a separate thing you may also do. */}
      <div className="closer-subscribe">
        <SubscribeCard placement="footer" title="Keep up with the build" />
      </div>

      <SiteFooter />
      </div>
    </div>
  );
}
