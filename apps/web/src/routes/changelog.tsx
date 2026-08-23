import { Loading03Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect } from "react";
import type { ReactNode } from "react";

import changelogMd from "../../../../CHANGELOG.md?raw";
import { initAnalytics } from "../landing/analytics";
import type { Release, ReleaseBlock } from "../landing/changelog";
import { RELEASE_META, parseChangelog } from "../landing/changelog";
import { ChangelogInline } from "../landing/changelog-inline";
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

function ByMachineSidebar() {
  return (
    <div className="feature-media">
      <div className="media-stage">
        <div
          className="sidebar-card"
          role="img"
          aria-label="bb sidebar grouped by machine, with threads running on two computers"
        >
          <div className="side-label">Sawyer&rsquo;s MacBook Air</div>
          <ul className="threads">
            <li>
              <div className="trow">
                <span className="trow-title">Special Case Handling</span>
                <span className="tstatus" aria-hidden>
                  <HugeiconsIcon icon={Loading03Icon} className="trun" />
                </span>
              </div>
            </li>
            <li>
              <div className="trow">
                <span className="trow-title">Desloppify High-Priority Worker</span>
              </div>
              <ul className="threads thread-kids">
                <li>
                  <div className="trow trow-kid">
                    <span className="trow-title">
                      First-principles codebase simplification
                    </span>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
          <div className="side-label">Sawyer&rsquo;s MacBook Pro</div>
          <ul className="threads">
            <li>
              <div className="trow active">
                <span className="trow-title">Design Changelog Page</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* 0.35.0: plugin pages became flat sidebar rows, and Automations split out
   from Extensions. Both are named in that release's own notes. */
function PluginSidebar() {
  return (
    <div className="feature-media">
      <div className="media-stage">
        <div
          className="sidebar-card"
          role="img"
          aria-label="bb sidebar with plugin pages as flat rows, Automations separate from Extensions"
        >
          <ul className="threads">
            {[
              "Extensions",
              "Automations",
              "Tasks",
              "Memory",
              "Docs",
              "Side chat",
            ].map((page) => (
              <li key={page}>
                <div className={page === "Tasks" ? "trow active" : "trow"}>
                  <span className="trow-title">{page}</span>
                </div>
              </li>
            ))}
          </ul>
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
