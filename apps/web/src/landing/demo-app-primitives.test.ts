import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";

import {
  createDemoThreadReadState,
  DemoSelectedThread,
  DemoThreadRail,
  DemoThreadScene,
  demoThreadReadReducer,
  resolveDemoThreadStatus,
} from "./demo-app-primitives";
import type {
  DemoGlyphProps,
  DemoThread,
  DemoThreadProject,
  DemoThreadReadState,
} from "./demo-app-primitives";

const FixtureIcon = ({ className }: { className?: string }) =>
  createElement("svg", { className, "data-fixture-icon": "" });

const FINAL_SPAWN_SOURCE = "Spawned by Automations · every night at 02:00";

const CONTRACT_THREADS = [
  {
    id: "unread-a",
    title: "Unread thread A",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "idle" },
    attentionRevision: 1,
    initialReadThroughRevision: 0,
    interaction: "openable",
    href: "#unread-a",
  },
  {
    id: "unread-b",
    title: "Unread thread B",
    tone: "normal",
    leading: { kind: "glyph", Icon: FixtureIcon, size: 14, label: null },
    activity: { kind: "idle" },
    attentionRevision: 2,
    initialReadThroughRevision: 0,
    interaction: "openable",
    href: "#unread-b",
  },
  {
    id: "quiet-openable",
    title: "Quiet but openable",
    tone: "quiet",
    leading: { kind: "none" },
    activity: { kind: "idle" },
    attentionRevision: 0,
    initialReadThroughRevision: 0,
    interaction: "openable",
    href: "#quiet-openable",
  },
  {
    id: "working",
    title: "Working thread",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "working", label: "Working" },
    attentionRevision: 3,
    initialReadThroughRevision: 0,
    interaction: "openable",
    href: "#working",
  },
  {
    id: "needs-input",
    title: "Needs input thread",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "needs-input", label: "Waiting for you" },
    attentionRevision: 3,
    initialReadThroughRevision: 0,
    interaction: "openable",
    href: "#needs-input",
  },
  {
    id: "scenery",
    title: "Background scenery thread",
    tone: "quiet",
    leading: {
      kind: "avatar",
      src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      alt: "Fixture agent",
    },
    activity: { kind: "idle" },
    attentionRevision: 1,
    initialReadThroughRevision: 0,
    interaction: "scenery",
  },
  {
    id: "spawn-final",
    title: "Nightly dependency sweep",
    tone: "normal",
    leading: { kind: "none" },
    activity: { kind: "idle" },
    attentionRevision: 1,
    initialReadThroughRevision: 0,
    interaction: "openable",
    href: "#spawn-final",
  },
] as const satisfies readonly DemoThread[];

const CONTRACT_PROJECTS = [
  {
    id: "storefront",
    label: "storefront",
    rows: [
      {
        threadId: "unread-a",
        children: [{ threadId: "unread-b", children: [] }],
      },
      { threadId: "quiet-openable", children: [] },
      { threadId: "working", children: [] },
      { threadId: "needs-input", children: [] },
      { threadId: "scenery", children: [] },
    ],
  },
  {
    id: "automations",
    label: "automations",
    rows: [{ threadId: "spawn-final", children: [] }],
  },
] as const satisfies readonly DemoThreadProject[];

function readThrough(
  state: DemoThreadReadState,
  threadId: string,
): number {
  const revision = state.get(threadId);
  if (revision === undefined) {
    throw new Error(`Missing read-through fixture for ${threadId}`);
  }
  return revision;
}

function thread(threadId: string): DemoThread {
  const match = CONTRACT_THREADS.find((candidate) => candidate.id === threadId);
  if (!match) {
    throw new Error(`Missing thread fixture ${threadId}`);
  }
  return match;
}

describe("demo app thread state", () => {
  it("keeps A and B read after A, B, A activation and only re-arms on new attention", () => {
    const a = thread("unread-a");
    const b = thread("unread-b");
    let state = createDemoThreadReadState([a, b], null);

    expect(resolveDemoThreadStatus(a, readThrough(state, a.id))).toBe("unread");
    expect(resolveDemoThreadStatus(b, readThrough(state, b.id))).toBe("unread");

    state = demoThreadReadReducer(state, {
      type: "mark-read",
      threadId: a.id,
      attentionRevision: a.attentionRevision,
    });
    state = demoThreadReadReducer(state, {
      type: "mark-read",
      threadId: b.id,
      attentionRevision: b.attentionRevision,
    });
    state = demoThreadReadReducer(state, {
      type: "mark-read",
      threadId: a.id,
      attentionRevision: a.attentionRevision,
    });

    expect(resolveDemoThreadStatus(a, readThrough(state, a.id))).toBe("none");
    expect(resolveDemoThreadStatus(b, readThrough(state, b.id))).toBe("none");

    const afterSelectionOnly = demoThreadReadReducer(state, {
      type: "reconcile",
      threads: [b, a],
    });
    expect(afterSelectionOnly).toBe(state);
    expect(resolveDemoThreadStatus(a, readThrough(state, a.id))).toBe("none");

    const revisedA: DemoThread = { ...a, attentionRevision: 2 };
    expect(resolveDemoThreadStatus(revisedA, readThrough(state, a.id))).toBe(
      "unread",
    );
  });

  it("resolves needs-input, working, unread, then none without selected state", () => {
    const needsInput = thread("needs-input");
    const working = thread("working");
    const unread = thread("unread-a");

    expect(resolveDemoThreadStatus(needsInput, 0)).toBe("needs-input");
    expect(resolveDemoThreadStatus(working, 0)).toBe("working");
    expect(resolveDemoThreadStatus(unread, 0)).toBe("unread");
    expect(resolveDemoThreadStatus(unread, unread.attentionRevision)).toBe(
      "none",
    );
    expectTypeOf(resolveDemoThreadStatus).parameters.toEqualTypeOf<
      [DemoThread, number]
    >();
  });

  it("keeps DemoGlyph at the 12, 14, and 16px vocabulary", () => {
    expectTypeOf<DemoGlyphProps["size"]>().toEqualTypeOf<12 | 14 | 16>();
  });
});

describe("demo app thread server markup", () => {
  it("renders complete linked, scenery, nested, activity, and selected content", () => {
    const markup = renderToStaticMarkup(
      createElement(
        DemoThreadScene,
        {
          threads: CONTRACT_THREADS,
          selectedId: "spawn-final",
          onSelectedIdChange: () => undefined,
          children: createElement(
            Fragment,
            null,
            createElement(DemoThreadRail, {
              ariaLabel: "Fixture thread rail",
              header: createElement("div", null, "New thread"),
              projects: CONTRACT_PROJECTS,
            }),
            createElement(DemoSelectedThread, {
              children: (selected) =>
                createElement(
                  "p",
                  { "data-selected-source": selected?.id ?? "none" },
                  selected?.id === "spawn-final" ? FINAL_SPAWN_SOURCE : "",
                ),
            }),
          ),
        },
      ),
    );

    for (const fixture of CONTRACT_THREADS) {
      expect(markup).toContain(fixture.title);
    }
    expect(markup).toContain(FINAL_SPAWN_SOURCE);
    expect(markup).toContain('href="#spawn-final"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('data-tone="quiet"');
    expect(markup).toContain('class="demo-thread-children"');
    expect(markup).toContain("--demo-thread-depth:1");
    expect(markup).toContain('data-status="working"');
    expect(markup).toContain('data-status="needs-input"');
    expect(markup).toContain('data-status="unread"');

    const sceneryTag = markup.match(
      /<div class="demo-thread-row"[^>]*data-interaction="scenery"[^>]*>/,
    )?.[0];
    expect(sceneryTag).toBeDefined();
    expect(sceneryTag).not.toContain("href=");
    expect(sceneryTag).not.toContain("tabindex=");
    expect(sceneryTag).not.toContain("onclick=");
    expect(sceneryTag).not.toContain("hover");

    const quietOpenableTag = markup.match(
      /<a class="demo-thread-row"[^>]*href="#quiet-openable"[^>]*>/,
    )?.[0];
    expect(quietOpenableTag).toContain('data-interaction="openable"');
    expect(quietOpenableTag).toContain('data-tone="quiet"');
  });
});
