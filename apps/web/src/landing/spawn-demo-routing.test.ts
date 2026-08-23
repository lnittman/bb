import { describe, expect, it } from "vitest";

import {
  SPAWN_CAUSE_IDS,
  spawnDemoHref,
  spawnDemoTargetId,
  validateLandingSearch,
} from "./spawn-demo-routing";

describe("Spawn demo links", () => {
  it.each(SPAWN_CAUSE_IDS)(
    "restores the %s thread from its independently resolvable href",
    (id) => {
      const href = spawnDemoHref(id);
      const url = new URL(href, "https://example.test");
      const search = validateLandingSearch({
        spawn: url.searchParams.get("spawn"),
      });

      expect(search.spawn).toBe(id);
      expect(url.hash).toBe(`#${spawnDemoTargetId(id)}`);
    },
  );

  it("omits unknown thread ids at the route boundary", () => {
    expect(validateLandingSearch({ spawn: "not-a-thread" })).toEqual({});
  });
});
