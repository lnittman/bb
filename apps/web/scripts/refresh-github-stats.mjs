// Refreshes src/landing/github-stats.json from the GitHub API.
//
// The landing page renders these numbers from the checked-in JSON so builds
// stay hermetic — no network at build time, no rate-limit flakes in CI.
// Run this at authoring time and commit the diff:
//
//   node scripts/refresh-github-stats.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REPO = "get-bb/bb";
const OUT = fileURLToPath(
  new URL("../src/landing/github-stats.json", import.meta.url),
);

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} failed: ${res.status}`);
  }
  return res;
}

const repo = await (await api(`/repos/${REPO}`)).json();

// Contributor count via the pagination trick: ask for one contributor per
// page and read the last page number off the Link header.
const contributorsRes = await api(
  `/repos/${REPO}/contributors?per_page=1&anon=false`,
);
const link = contributorsRes.headers.get("link") ?? "";
const lastPage = /[?&]page=(\d+)>; rel="last"/.exec(link)?.[1];
if (!lastPage) {
  throw new Error("Could not read contributor count from Link header");
}

const stats = {
  stars: repo.stargazers_count,
  contributors: Number(lastPage),
  fetchedAt: new Date().toISOString().slice(0, 10),
};
writeFileSync(OUT, `${JSON.stringify(stats, null, 2)}\n`);
console.log("Wrote", OUT, stats);
