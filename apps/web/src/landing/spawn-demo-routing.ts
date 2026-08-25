export const SPAWN_CAUSE_IDS = ["cli", "telegram", "cron"] as const;
export const HERO_THREAD_IDS = [
  "sidebar-search",
  "prompt-controls",
  "diff-toolbar",
] as const;

export type SpawnCauseId = (typeof SPAWN_CAUSE_IDS)[number];
export type HeroThreadId = (typeof HERO_THREAD_IDS)[number];

export type LandingSearch = Readonly<{
  spawn?: SpawnCauseId;
  thread?: HeroThreadId;
}>;

export function parseSpawnCauseId(value: unknown): SpawnCauseId | null {
  for (const id of SPAWN_CAUSE_IDS) {
    if (value === id) return id;
  }
  return null;
}

export function parseHeroThreadId(value: unknown): HeroThreadId | null {
  for (const id of HERO_THREAD_IDS) {
    if (value === id) return id;
  }
  return null;
}

export function validateLandingSearch(
  search: Record<string, unknown>,
): LandingSearch {
  const spawn = parseSpawnCauseId(search.spawn);
  const thread = parseHeroThreadId(search.thread);
  return {
    ...(spawn === null ? {} : { spawn }),
    ...(thread === null ? {} : { thread }),
  };
}

export function spawnDemoTargetId(id: SpawnCauseId): string {
  return `spawn-${id}`;
}

export function spawnDemoHref(id: SpawnCauseId): string {
  return `/?spawn=${id}#${spawnDemoTargetId(id)}`;
}

export function heroDemoTargetId(id: HeroThreadId): string {
  return `hero-thread-${id}`;
}

export function heroDemoHref(id: HeroThreadId): string {
  return `/?thread=${id}#${heroDemoTargetId(id)}`;
}
