import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const landingDirectory = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(landingDirectory, "landing.css"), "utf8");
const primitiveSource = readFileSync(
  join(landingDirectory, "demo-app-primitives.tsx"),
  "utf8",
);
const routeSource = readFileSync(
  join(landingDirectory, "../routes/index.tsx"),
  "utf8",
);

const CANONICAL_START = "/* demo-app-primitives: start */";
const CANONICAL_END = "/* demo-app-primitives: end */";

function canonicalCss(): string {
  const start = css.indexOf(CANONICAL_START);
  const end = css.indexOf(CANONICAL_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Missing the marked demo-app-primitives CSS block");
  }
  return css.slice(start, end + CANONICAL_END.length);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleBody(source: string, selector: string): string {
  const match = source.match(
    new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "s"),
  );
  const body = match?.[1];
  if (body === undefined) {
    throw new Error(`Missing CSS rule for ${selector}`);
  }
  return body;
}

function tokenValue(name: string): string {
  const value = css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1];
  if (value === undefined) {
    throw new Error(`Missing --${name}`);
  }
  return value.trim();
}

function demoFunctionSource(functionName: string, endMarker: string): string {
  const start = routeSource.indexOf(`function ${functionName}()`);
  const end = routeSource.indexOf(endMarker, start);
  if (start === -1 || end === -1) {
    throw new Error(`Could not isolate ${functionName} source`);
  }
  return routeSource.slice(start, end);
}

function selectorsContaining(source: string, needle: RegExp): string[] {
  return [...source.matchAll(/([^{}]+)\{/g)]
    .map((match) => (match[1] ?? "").replace(/\/\*[\s\S]*?\*\//g, "").trim())
    .filter((selector) => needle.test(selector));
}

describe("demo app canonical CSS contract", () => {
  it("keeps every primitive selector in one marked block", () => {
    const canonical = canonicalCss();
    const outside = css.replace(canonical, "");
    const ownedSelectors = [
      ".demo-thread-row",
      ".demo-project-row",
      ".demo-sidebar-action-row",
      ".demo-window__chrome",
    ];

    for (const selector of ownedSelectors) {
      expect(canonical).toContain(selector);
      expect(outside).not.toContain(selector);
    }
  });

  it("sources 28/32/40/48px heights and 1/2/4px structure from tokens", () => {
    const canonical = canonicalCss();

    expect(tokenValue("thread-row-h")).toBe("28px");
    expect(tokenValue("row-h")).toBe("32px");
    expect(tokenValue("thread-row-h-coarse")).toBe("40px");
    expect(tokenValue("chrome-h")).toBe("48px");
    expect(tokenValue("thread-sibling-gap")).toBe("1px");
    expect(tokenValue("thread-branch-gap")).toBe("2px");
    expect(tokenValue("project-row-gap")).toBe("4px");
    expect(tokenValue("thread-depth-step")).toBe("24px");

    expect(ruleBody(canonical, ".demo-thread-row")).toContain(
      "height: var(--thread-row-h);",
    );
    expect(ruleBody(canonical, ".demo-project-row")).toContain(
      "height: var(--row-h);",
    );
    expect(ruleBody(canonical, ".demo-sidebar-action-row")).toContain(
      "height: var(--row-h);",
    );
    expect(ruleBody(canonical, ".demo-window__chrome")).toContain(
      "height: var(--chrome-h);",
    );
    expect(canonical).toMatch(
      /@media \(pointer: coarse\)\s*\{\s*\.demo-thread-row\s*\{[^}]*height:\s*var\(--thread-row-h-coarse\);/s,
    );
    expect(
      ruleBody(canonical, ".demo-thread-list,\n.demo-thread-children"),
    ).toContain("gap: var(--thread-sibling-gap);");
    expect(ruleBody(canonical, ".demo-thread-node")).toContain(
      "gap: var(--thread-branch-gap);",
    );
    expect(
      ruleBody(canonical, ".demo-thread-project + .demo-thread-project"),
    ).toContain("var(--project-row-gap)");

    for (const selector of [
      ".demo-thread-row",
      ".demo-project-row",
      ".demo-sidebar-action-row",
      ".demo-window__chrome",
    ]) {
      expect(ruleBody(canonical, selector)).not.toMatch(
        /(?:^|\n)\s*(?:min-)?height:\s*\d+(?:\.\d+)?px/,
      );
    }
  });

  it("has one unscoped selection rule and one openable-only hover rule", () => {
    const canonical = canonicalCss();
    const selectedRules = selectorsContaining(
      canonical,
      /\.demo-thread-row\[data-selected=["']true["']\]/,
    );
    const hoverRules = selectorsContaining(
      canonical,
      /a\.demo-thread-row\[data-selected=["']false["']\]:hover/,
    );

    expect(selectedRules).toHaveLength(1);
    expect(hoverRules).toHaveLength(1);
    const selectedSelector = selectedRules[0] ?? "";
    const hoverSelector = hoverRules[0] ?? "";
    expect(selectedSelector).not.toMatch(/(?:hero|build|gang|spawn|sub)/);
    expect(hoverSelector).not.toMatch(/(?:hero|build|gang|spawn|sub)/);
    expect(selectedSelector).not.toMatch(/^(?:a|button|div)\./);
    expect(selectedSelector).not.toContain(",");
    expect(hoverSelector).not.toContain(",");
    expect(ruleBody(canonical, selectedSelector)).toContain(
      "background: var(--state-active);",
    );
    expect(ruleBody(canonical, hoverSelector)).toContain(
      "background: var(--sidebar-accent);",
    );
  });

  it("pins the app palette and 12/14/16px glyph vocabulary", () => {
    const canonical = canonicalCss();

    expect(tokenValue("state-active")).toBe(
      "color-mix(in oklab, var(--ink) 11.8%, transparent)",
    );
    expect(tokenValue("sidebar-accent")).toBe(
      "color-mix(in oklch, var(--ink) 8%, var(--canvas))",
    );
    expect(tokenValue("glyph-sm")).toBe("12px");
    expect(tokenValue("glyph-md")).toBe("14px");
    expect(tokenValue("glyph-lg")).toBe("16px");
    expect(canonical.match(/\.demo-glyph\[data-size=/g)).toHaveLength(3);
    expect(primitiveSource).toContain(
      "export type DemoGlyphSize = 12 | 14 | 16;",
    );
    expect(primitiveSource).toMatch(
      /export type DemoGlyphProps = Readonly<\{[\s\S]*?size: 12 \| 14 \| 16;/,
    );
  });
});

describe("migrated demo source contract", () => {
  it.each([
    ["HeroAppMock", "function Band"],
    ["SubagentsDemo", "const ASK_BEATS"],
    ["BuildDemo", "type GangProvider"],
    ["GangDemo", "const BEAT_MS"],
    ["SpawnDemo", "/** The merged-PR feed"],
  ])(
    "keeps %s on the primitive instead of legacy row/status markup",
    (name, endMarker) => {
      const source = demoFunctionSource(name, endMarker);

      expect(source).toContain("<DemoThreadScene");
      expect(source).toContain("<DemoThreadRail");
      expect(source).toContain("<DemoSelectedThread");
      expect(source).not.toMatch(
        /\b(?:trow|sub-row|gang-row|is-open|spawn-new|sub-dot|gang-wait|gang-kid|sub-kids|sub-guide|sub-group|build-thread-group)\b/,
      );
      expect(source).not.toMatch(/<a\b/);
      if (name === "HeroAppMock") {
        expect(source).toContain("<DemoSidebarActionRow");
        expect(source).toContain("<DemoWindowChrome");
        expect(source).not.toContain('className="mock-bar"');
      }
      if (name === "SubagentsDemo") {
        expect(source).not.toMatch(/<button\b/);
      }
    },
  );

  it("keeps Hero search at the displayed-project boundary and non-thread views unselected", () => {
    const source = demoFunctionSource("HeroAppMock", "function Band");

    expect(source).toContain("threads={heroThreads}");
    expect(source).toContain("projects={visibleProjects}");
    expect(source).not.toMatch(/threads=\{visible/i);
    expect(source).toContain(
      'const selectedId = view === "thread" && !searchOpen ? activeId : null;',
    );
    expect(source).toContain("href: heroDemoHref(candidate.id)");
  });

  it("keeps Build search at the displayed-project boundary", () => {
    const source = demoFunctionSource("BuildDemo", "type GangProvider");

    expect(source).toContain("threads={BUILD_DEMO_THREADS}");
    expect(source).toContain("projects={filteredProjects}");
    expect(source).not.toMatch(/threads=\{filtered/i);
  });

  it("keeps Gang provider context and nested projects on the selected model", () => {
    const source = demoFunctionSource("GangDemo", "const BEAT_MS");

    expect(source).toContain("GANG_PROVIDER_META[open.provider]");
    expect(source).toContain("projects={GANG_PROJECTS}");
    expect(source).not.toContain("DemoSpinner");
    expect(source).not.toContain("MessageQuestionIcon");
  });

  it("does not regress the settled native-select removal", () => {
    const routeWithoutComments = routeSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(routeWithoutComments).not.toMatch(/<select\b/);
  });
});
