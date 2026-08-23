export const SPAWN_CAUSE_IDS = ["cli", "telegram", "cron"] as const;

export type SpawnCauseId = (typeof SPAWN_CAUSE_IDS)[number];

export type LandingSearch = Readonly<{
  spawn?: SpawnCauseId;
}>;

export function parseSpawnCauseId(value: unknown): SpawnCauseId | null {
  for (const id of SPAWN_CAUSE_IDS) {
    if (value === id) return id;
  }
  return null;
}

export function validateLandingSearch(
  search: Record<string, unknown>,
): LandingSearch {
  const spawn = parseSpawnCauseId(search.spawn);
  return spawn === null ? {} : { spawn };
}

export function spawnDemoTargetId(id: SpawnCauseId): string {
  return `spawn-${id}`;
}

export function spawnDemoHref(id: SpawnCauseId): string {
  return `/?spawn=${id}#${spawnDemoTargetId(id)}`;
}
