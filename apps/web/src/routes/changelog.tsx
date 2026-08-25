import {
  BrainIcon,
  BubbleChatAddIcon,
  CheckListIcon,
  File01Icon,
  Mail01Icon,
  TimeScheduleIcon,
  ToolboxIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect } from "react";
import type { ReactNode } from "react";

import changelogMd from "../../../../CHANGELOG.md?raw";
import { initAnalytics } from "../landing/analytics";
import type { Release, ReleaseBlock } from "../landing/changelog";
import { RELEASE_META, parseChangelog } from "../landing/changelog";
import { ChangelogInline } from "../landing/changelog-inline";
import {
  type DemoIcon,
  DemoSidebarActionRow,
  type DemoThread,
  type DemoThreadProject,
  DemoThreadRail,
  DemoThreadScene,
} from "../landing/demo-app-primitives";
import {
  focusSubscribeEmail,
  SUBSCRIBE_EMAIL_ID,
  SubscribeCard,
} from "../landing/cta";
import { SiteFooter, SiteNav } from "../landing/site-chrome";
import { unfurlMeta } from "../landing/site";
import interWoff2 from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import landingCss from "../landing/landing.css?url";
import changelogCss from "../landing/changelog.css?url";

const PAGE_TITLE = "Changelog — bb";
const PAGE_DESCRIPTION =
  "New features, improvements, and fixes in every bb release.";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      ...unfurlMeta(PAGE_TITLE, PAGE_DESCRIPTION, "/changelog"),
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
      { rel: "stylesheet", href: changelogCss },
    ],
  }),
  component: ChangelogRoute,
});

function ChangelogRoute() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return <ChangelogPage />;
}

const RELEASES = parseChangelog(changelogMd);

/** "0.0.30" → "0-0-30", a fragment id that survives URL parsing. */
function anchorId(version: string): string {
  return version.replaceAll(".", "-");
}

/* ── Release media ────────────────────────────────────────────────────
   A hand-built visual per marquee release, in place of a screenshot: a
   floating slice of the app sidebar, reusing the hero mock's classes from
   landing.css so it matches the real app (and the homepage) exactly. */

/** Hugeicons need an `icon` prop; the primitive wants a plain component. */
function glyph(icon: IconSvgElement): DemoIcon {
  return function Glyph({ className }: { className?: string }) {
    return <HugeiconsIcon icon={icon} className={className} />;
  };
}

const BY_MACHINE_THREADS: readonly DemoThread[] = [
  {
    id: "special-case",
    title: "Special Case Handling",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "working", label: "Running" },
    attentionRevision: 0,
    initialReadThroughRevision: 0,
    interaction: "scenery",
  },
  {
    id: "desloppify",
    title: "Desloppify High-Priority Worker",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "idle" },
    attentionRevision: 0,
    initialReadThroughRevision: 0,
    interaction: "scenery",
  },
  {
    id: "first-principles",
    title: "First-principles codebase simplification",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "idle" },
    attentionRevision: 0,
    initialReadThroughRevision: 0,
    interaction: "scenery",
  },
  {
    id: "design-changelog",
    title: "Design Changelog Page",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "idle" },
    attentionRevision: 0,
    initialReadThroughRevision: 0,
    // The selected row links to this release's own anchor: a real in-page
    // target, so the anchor the primitive renders is genuinely navigable.
    interaction: "openable",
    href: "#0-0-30",
  },
];

/* Machines are the app's project-level grouping here, so each becomes a
   32px project row over its 28px threads, with the child nested under its
   parent at the rail's real indent. */
const BY_MACHINE_PROJECTS: readonly DemoThreadProject[] = [
  {
    id: "air",
    label: "Sawyer\u2019s MacBook Air",
    rows: [
      { threadId: "special-case", children: [] },
      {
        threadId: "desloppify",
        children: [{ threadId: "first-principles", children: [] }],
      },
    ],
  },
  {
    id: "pro",
    label: "Sawyer\u2019s MacBook Pro",
    rows: [{ threadId: "design-changelog", children: [] }],
  },
];

function ByMachineSidebar() {
  return (
    <div className="feature-media">
      <div className="media-stage">
        <DemoThreadScene
          threads={BY_MACHINE_THREADS}
          selectedId="design-changelog"
          onSelectedIdChange={() => {}}
        >
          <div
            className="sidebar-card"
            role="group"
            aria-label="bb sidebar grouped by machine, with threads running on two computers"
          >
            <DemoThreadRail
              ariaLabel="Threads by machine"
              header={null}
              projects={BY_MACHINE_PROJECTS}
            />
          </div>
        </DemoThreadScene>
      </div>
    </div>
  );
}

/* 0.35.0: plugin pages became flat sidebar rows, and Automations split out
   from Extensions. Both are named in that release's own notes. */
const PLUGIN_PAGES: readonly { label: string; Icon: DemoIcon }[] = [
  { label: "Extensions", Icon: glyph(ToolboxIcon) },
  { label: "Automations", Icon: glyph(TimeScheduleIcon) },
  { label: "Tasks", Icon: glyph(CheckListIcon) },
  { label: "Memory", Icon: glyph(BrainIcon) },
  { label: "Docs", Icon: glyph(File01Icon) },
  { label: "Side chat", Icon: glyph(BubbleChatAddIcon) },
];

function PluginSidebar() {
  return (
    <div className="feature-media">
      <div className="media-stage">
        <div
          className="sidebar-card"
          role="group"
          aria-label="bb sidebar with plugin pages as flat rows, Automations separate from Extensions"
        >
          {PLUGIN_PAGES.map((page) => (
            <DemoSidebarActionRow
              key={page.label}
              label={page.label}
              Icon={page.Icon}
              selected={page.label === "Tasks"}
              onActivate={() => {}}
              trailing={null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* 0.0.31: "arrange up to eight chats side by side". Three panes is what fits
   the card; the release's own wording carries the number. */
function SplitPanes() {
  return (
    <div className="feature-media">
      <div className="media-stage">
        <div
          className="split-card"
          role="img"
          aria-label="Three bb threads arranged side by side in split view"
        >
          {["Trace order checkout flow", "Audit promo coverage", "Cut 1.4 notes"].map(
            (title, i) => (
              <div className={i === 0 ? "split-pane is-active" : "split-pane"} key={title}>
                <div className="split-pane-bar">
                  <span>{title}</span>
                </div>
                <div className="split-pane-body" aria-hidden>
                  {[92, 76, 84, 58].map((w, n) => (
                    <i key={n} style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/* 0.34.0: the cross-provider Ask User Question plugin — a real multiple-choice
   question with option previews, in place of asking in prose. */
function AskQuestionCard() {
  return (
    <div className="feature-media">
      <div className="media-stage">
        <div
          className="askq ask-card"
          role="img"
          aria-label="An agent asking a multiple-choice question with two options"
        >
          <div className="askq-q">Which diff layout should stay selected?</div>
          <div className="askq-opts">
            <div className="askq-opt">
              <span className="askq-radio" />
              <span className="askq-text">
                <span className="askq-label">Stacked</span>
                <span className="askq-desc">
                  Show each change across the full panel width.
                </span>
              </span>
            </div>
            <div className="askq-opt on">
              <span className="askq-radio" />
              <span className="askq-text">
                <span className="askq-label">Split</span>
                <span className="askq-desc">
                  Place old and new changes in separate columns.
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 0.38.0: the Extensions Page — plugins and skills browsable and installable
   from the sidebar. Names and the install affordance come from that release's
   own notes. */
function ExtensionsPage() {
  const rows = [
    { name: "Tasks", kind: "Plugin", state: "Installed" },
    { name: "GitHub", kind: "Plugin", state: "Install" },
    { name: "Memory", kind: "Plugin", state: "Install" },
    { name: "Code review", kind: "Skill", state: "Installed" },
  ];
  return (
    <div className="feature-media">
      <div className="media-stage">
        <div
          className="ext-card"
          role="img"
          aria-label="The Extensions page listing plugins and skills with install controls"
        >
          <div className="ext-card-bar">
            <span>Extensions</span>
          </div>
          <ul className="ext-card-list">
            {rows.map((row) => (
              <li key={row.name}>
                <span className="ext-card-name">{row.name}</span>
                <span className="ext-card-kind">{row.kind}</span>
                <span
                  className={
                    row.state === "Installed"
                      ? "ext-card-state is-on"
                      : "ext-card-state"
                  }
                >
                  {row.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const RELEASE_MEDIA: Record<string, ReactNode> = {
  "0.38.0": <ExtensionsPage />,
  "0.35.0": <PluginSidebar />,
  "0.34.0": <AskQuestionCard />,
  "0.0.31": <SplitPanes />,
  "0.0.30": <ByMachineSidebar />,
};

/* ── Page ─────────────────────────────────────────────────────────── */

function Blocks({ blocks }: { blocks: ReleaseBlock[] }) {
  return (
    <>
      {blocks.map((block, index) =>
        block.kind === "list" ? (
          <ul key={index}>
            {block.items.map((item) => (
              <li key={item}>
                <ChangelogInline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            <ChangelogInline text={block.text} />
          </p>
        ),
      )}
    </>
  );
}

function ReleaseEntry({ release }: { release: Release }) {
  const meta = RELEASE_META[release.version];
  const anchor = anchorId(release.version);
  return (
    <article className="release rail" id={anchor}>
      <div className="release-rail">
        <div className="rail-sticky">
          <a className="version" href={`#${anchor}`}>
            {release.version}
          </a>
          {meta ? <span className="release-date">{meta.date}</span> : null}
        </div>
      </div>
      <div className="release-body">
        <h2>{meta?.headline ?? release.version}</h2>
        {release.lede.map((block, index) =>
          block.kind === "paragraph" ? (
            <p key={index} className="lede">
              <ChangelogInline text={block.text} />
            </p>
          ) : null,
        )}
        {RELEASE_MEDIA[release.version]}
        {release.sections.map((section) => (
          <Fragment key={section.title}>
            <h3>
              {section.title}
              {section.title === "Experiments" ? (
                <span className="h-chip">Beta</span>
              ) : null}
            </h3>
            <Blocks blocks={section.blocks} />
          </Fragment>
        ))}
      </div>
    </article>
  );
}

function ChangelogPage() {
  return (
    <div className="wrap">
      <SiteNav current="changelog" />

      <header className="page-head rail">
        <h1>Changelog</h1>
        <p className="sub">{PAGE_DESCRIPTION}</p>
        <div className="meta-row">
          <a
            className="btn btn-ghost"
            href={`#${SUBSCRIBE_EMAIL_ID}`}
            onClick={focusSubscribeEmail}
          >
            <HugeiconsIcon icon={Mail01Icon} className="btn-ic" />
            Get release notes by email
          </a>
        </div>
      </header>

      {RELEASES.map((release) => (
        <ReleaseEntry key={release.version} release={release} />
      ))}

      <div className="page-subscribe">
        <SubscribeCard
          placement="footer"
          id="subscribe"
          title="Stay in the loop"
          description="Get release notes in your inbox. No spam."
        />
      </div>

      <SiteFooter />
    </div>
  );
}
