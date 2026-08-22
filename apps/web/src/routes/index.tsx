import {
  ArrowDown01Icon,
  ArrowDownDoubleIcon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowMoveDownLeftIcon,
  ArrowRight01Icon,
  ArrowUpDoubleIcon,
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
  LayoutTwoColumnIcon,
  LayoutTwoRowIcon,
  Loading03Icon,
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
  Tick02Icon,
  TextWrapIcon,
  TimeScheduleIcon,
  ToolboxIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

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
import phoneBezel from "../assets/phone-bezel.svg";
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

// The Tasks board's per-column status glyphs, matching the real board:
// a dashed circle for Backlog, a hollow circle for Todo, and a half-filled
// dial for In Progress. Drawn by hand at the Hugeicons stroke weight
// (the free set has no equivalents).
const BacklogStateGlyph = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle
      cx="12"
      cy="12"
      r="8.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="0.5 5.4"
    />
  </svg>
);
const TodoStateGlyph = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const DoingStateGlyph = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 6.5a5.5 5.5 0 0 1 0 11Z" fill="currentColor" stroke="none" />
  </svg>
);

/** The priority bar-chart glyph every real task card carries. */
const PriorityGlyph = ({ level }: { level: 1 | 2 | 3 }) => (
  <svg className="board-pri" viewBox="0 0 13 10" aria-hidden>
    <rect x="0" y="6" width="3" height="4" rx="1" />
    <rect x="5" y="3" width="3" height="7" rx="1" opacity={level >= 2 ? 1 : 0.35} />
    <rect x="10" y="0" width="3" height="10" rx="1" opacity={level >= 3 ? 1 : 0.35} />
  </svg>
);

type Status = "running" | "done" | "waiting";
type Step =
  | { kind: "user"; text: string }
  | { kind: "step"; text: ReactNode }
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
      { kind: "step", text: "Edited ProjectList.tsx" },
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
          return (
            <div key={id} className="msg-step">
              <ChevronRight className="step-chev" />
              {step.text}
            </div>
          );
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
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [model, setModel] = useState("claude-opus-5[1m]");
  const [voiceActive, setVoiceActive] = useState(false);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  return (
    <div className={isNew ? "composer composer-new" : "composer"}>
      <form
        className={expanded ? "composer-box composer-expanded" : "composer-box"}
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          ref={attachmentInputRef}
          className="composer-file"
          type="file"
          multiple
          onChange={(event) =>
            setAttachmentName(event.currentTarget.files?.[0]?.name ?? null)
          }
        />
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
          <label className="model">
            <ClaudeIcon className="model-ic" />
            <span className="sr-only">Model</span>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              <option value="claude-opus-5[1m]">Opus 5 (1M)</option>
              <option value="claude-opus-4-8[1m]">Opus 4.8 (1M)</option>
            </select>
          </label>
          <span className="composer-actions">
            <button
              type="button"
              className="composer-action"
              aria-label="Attach files"
              onClick={() => attachmentInputRef.current?.click()}
            >
              <Paperclip className="composer-clip" />
            </button>
            <button
              type="button"
              className={
                voiceActive ? "composer-action active" : "composer-action"
              }
              aria-label={
                voiceActive ? "Stop voice input" : "Start voice input"
              }
              aria-pressed={voiceActive}
              onClick={() => setVoiceActive((value) => !value)}
            >
              <MicIcon className="composer-clip" />
            </button>
            <button
              type="submit"
              className="send-btn"
              aria-label="Send message"
              disabled
            >
              <SendIcon className="send-ic" />
            </button>
          </span>
        </div>
        {voiceActive ? (
          <span className="composer-status" role="status">
            Voice input active
          </span>
        ) : attachmentName ? (
          <span className="composer-status" role="status">
            {attachmentName}
          </span>
        ) : null}
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
        <select aria-label="Change set" defaultValue="all">
          <option value="all">All changes</option>
          <option value="uncommitted">Uncommitted changes</option>
        </select>
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
                <span className="bar-menu-wrap">
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
                  <span className="editor-menu-wrap">
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

/* ────────────────────────────────────────────────
 * TASKS BOARD STORYBOARD (loops while in view)
 *
 *      0ms   the chrome is up, the columns are empty
 *    300ms   cards land column by column, 90ms apart; the toolbar's
 *            refresh dial sweeps once while they arrive
 *   2600ms   SF-1 ticks over to done; the rail's Active count follows
 *   9000ms   loop restarts (the board rests settled ~70% of the loop)
 *   rest     full board — also the reduced-motion state
 * ──────────────────────────────────────────────── */
const BOARD_BEATS = [300, 2600];
const BOARD_RESET = 9000;

const BOARD_COLUMNS = [
  {
    name: "Backlog",
    state: "backlog",
    cards: [
      { id: "SF-6", title: "Cut the 1.4 release notes", pri: 1 },
      { id: "SF-9", title: "Retire the legacy cart cookie", pri: 1 },
      { id: "SF-11", title: "Audit checkout analytics", pri: 2 },
      { id: "SF-14", title: "Drop the unused address form", pri: 1 },
    ],
  },
  {
    name: "Todo",
    state: "todo",
    cards: [
      { id: "SF-3", title: "Add Apple Pay to checkout", pri: 3 },
      { id: "SF-4", title: "Write docs for the promo engine", pri: 2 },
      { id: "SF-7", title: "Handle expired promo codes", pri: 2 },
      { id: "SF-12", title: "Cover the empty-cart path", pri: 1 },
    ],
  },
  {
    name: "In Progress",
    state: "doing",
    cards: [
      { id: "SF-1", title: "Ship promo-code analytics", pri: 3 },
      { id: "SF-2", title: "Port pricing to TypeScript", pri: 2 },
      { id: "SF-8", title: "Split the order confirmation", pri: 2 },
      { id: "SF-13", title: "Trace the checkout funnel", pri: 1 },
    ],
  },
] as const;

function BoardColGlyph({ state }: { state: string }) {
  if (state === "backlog") {
    return <BacklogStateGlyph className="board-state" />;
  }
  if (state === "todo") {
    return <TodoStateGlyph className="board-state" />;
  }
  return <DoingStateGlyph className="board-state board-state-doing" />;
}

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
  const listed = BOARD_COLUMNS.flatMap((col) =>
    col.cards.map((card) => ({ ...card, col })),
  );
  return (
    <div className="board-demo">
      <div className="board-chrome" aria-hidden>
        <ChecklistGlyph className="board-chrome-ic" />
        <span className="board-chrome-title">Tasks</span>
        <PanelRightIcon className="board-chrome-ic board-chrome-panel" />
      </div>
      <div className="board-bar">
        <span className="board-project" aria-hidden>
          <i className="board-proj-dot" />
          storefront 1.4
        </span>
        <span className="board-seg">
          {(["list", "board"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={view === v ? "on" : undefined}
              aria-pressed={view === v}
              onClick={() => withViewTransition(() => setView(v))}
            >
              {v === "list" ? "List" : "Board"}
            </button>
          ))}
        </span>
        <RefreshGlyph className="board-refresh" />
        <span className="board-new" aria-hidden>
          <PlusGlyph className="board-new-ic" />
          New task
        </span>
      </div>
      <div className="board-main">
        {view === "board" ? (
          <div className="board-cols">
            {BOARD_COLUMNS.map((col) => (
              <div key={col.name} className="board-col">
                <span className="board-col-head" aria-hidden>
                  <BoardColGlyph state={col.state} />
                  {col.name}
                  <em>{col.cards.length}</em>
                  <PlusGlyph className="board-col-add" />
                </span>
                {/* The name is what ties this card to its row in the list
                    view. Same name on both sides, so the browser treats them
                    as one thing that moved rather than two that swapped. */}
                {col.cards.map((card) => (
                  <div
                    key={card.id}
                    className="board-card"
                    style={{ viewTransitionName: `task-${card.id}` }}
                  >
                    <span className="board-id">{card.id}</span>
                    <span className="board-card-title">{card.title}</span>
                    <PriorityGlyph level={card.pri} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="board-list">
            {listed.map((card) => (
              <div
                key={card.id}
                className="board-lrow"
                style={{ viewTransitionName: `task-${card.id}` }}
              >
                <BoardColGlyph state={card.col.state} />
                <span className="board-lid">{card.id}</span>
                <span className="board-ltitle">{card.title}</span>
                <PriorityGlyph level={card.pri} />
              </div>
            ))}
          </div>
        )}
        <aside className="board-rail" aria-hidden>
          <span className="brail-row">
            <strong>All tasks</strong>
            <em>12</em>
          </span>
          <span className="brail-row">
            <strong>Active</strong>
            <em>3</em>
          </span>
          <span className="brail-label">Projects</span>
          <span className="brail-row">
            <i className="board-proj-dot" />
            <strong>storefront 1.4</strong>
            <em>12</em>
          </span>
          <span className="brail-row brail-ghost">
            <PlusGlyph className="brail-ic" />
            New project
          </span>
          <span className="brail-label">Agent presets</span>
          <span className="brail-note">No presets yet.</span>
        </aside>
      </div>
    </div>
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
            {pr.agent ? (
              <span
                className="pr-agent"
                title="Written by an agent running in bb"
              >
                agent
              </span>
            ) : null}
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
            <StatNumber value={String(GITHUB_STATS.contributors)} />
            <span>Contributors</span>
          </li>
          <li>
            <StatNumber value={String(GITHUB_STATS.mergedLastMonth)} />
            <span>PRs merged last month</span>
          </li>
          {/* This replaced the fork count, which said nothing a reader could
              use. It is the page's headline restated as a measurement, and it
              sits beside the total on purpose: 436 of 721 needs no percentage
              because the two numbers are adjacent. Same source as the `agent`
              markers in the feed below — the "AGENT GENERATED" tag the repo
              requires — so the stat and the rows cannot disagree. */}
          <li>
            <StatNumber value={String(GITHUB_STATS.agentMergedLastMonth)} />
            <span>of those, written by agents</span>
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
        <h2 className="sec-title">Put your agents to work</h2>
        <p>Free, open source, and local-first. Install in under a minute.</p>
        <InstallOptions placement="closer" />
        <div className="closer-subscribe">
          <SubscribeCard placement="footer" title="Keep up with the build" />
        </div>
      </section>

      <SiteFooter />
      </div>
    </div>
  );
}
