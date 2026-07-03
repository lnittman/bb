#!/usr/bin/env bash
set -euo pipefail

ROOT="${FABLE_SIDECAR_ROOT:-/Users/luke/.bb-dev/fable-sidecar-source}"
DOCS="$ROOT/fable-sprint-20260701"
PROGRAMS="$ROOT/programs"
OUT="${FABLE_SIDECAR_OUT:-$ROOT/SIDECAR-CURRENT.md}"

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

display_path() {
  local path="$1"
  if [[ "$path" == "$ROOT/"* ]]; then
    printf '%s\n' "${path#$ROOT/}"
  else
    printf '%s\n' "$path"
  fi
}

latest_file_for_dir() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0

  find "$dir" -maxdepth 1 -type f ! -name '.*' -print 2>/dev/null |
    while IFS= read -r file; do
      printf '%s\t%s\n' "$(stat -f %m "$file")" "$file"
    done |
    sort -nr |
    head -n 1 |
    cut -f 2-
}

file_freshness() {
  local file="$1"
  if [[ -n "$file" && -f "$file" ]]; then
    stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S %Z" "$file"
  else
    printf 'missing\n'
  fi
}

first_status_line() {
  local file="$1"
  local line
  [[ -f "$file" ]] || return 0

  line="$(grep -Eim1 '(^|[[:space:]])(status|state|posture|blocker|next)([[:space:]:-]|$)' "$file" || true)"
  [[ -n "$line" ]] || return 0

  printf '%s\n' "$line" |
    sed -E 's/^[#*[:space:]-]+//; s/[[:space:]]+/ /g' |
    cut -c 1-220
}

digest_section() {
  local file="$1"
  local heading="$2"
  [[ -f "$file" ]] || return 0

  awk -v heading="$heading" '
    $0 ~ "^##[[:space:]]+" heading {
      in_section = 1
      next
    }
    in_section && /^##[[:space:]]+/ {
      exit
    }
    in_section {
      print
    }
  ' "$file" | sed -n '1,40p'
}

active_lanes_excerpt() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  awk '
    /^Generated:/ || /^Source-of-truth precedence/ {
      print
      next
    }
    /^\| lane \|/ {
      in_table = 1
      rows = 0
      print
      next
    }
    in_table && /^\| ---/ {
      print
      next
    }
    in_table && /^\|/ {
      if (rows < 24) {
        line = $0
        if (length(line) > 260) {
          line = substr(line, 1, 257) "..."
        }
        print line
        rows++
      }
      next
    }
    in_table && rows >= 24 {
      exit
    }
  ' "$file"
}

latest_digest_glance() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  grep -E '^(# Conductor Digest|Source-of-truth precedence|Since:|ACTIVE-LANES regenerated:)' "$file" || true
  printf '\nSections:\n'
  grep -E '^## ' "$file" | sed 's/^## /- /' || true
  printf '\nNew escalations:\n'
  digest_section "$file" "new escalations" | sed -n '1,12p'
}

program_card() {
  local slug="$1"
  local label="$2"
  local doc="$DOCS/programs/$slug.md"
  local artifact_dir="$PROGRAMS/$slug"
  local latest_artifact
  local latest_status
  local escalation_path="$artifact_dir/escalations.md"

  latest_artifact="$(latest_file_for_dir "$artifact_dir")"
  latest_status="$(first_status_line "$doc")"

  printf '### %s\n' "$label"
  printf -- '- Status: %s\n' "${latest_status:-source doc present; inspect for full state}"
  if [[ -s "$escalation_path" ]]; then
    printf -- '- Blocker: see `%s`\n' "$(display_path "$escalation_path")"
  else
    printf -- '- Blocker: none recorded in `%s`\n' "$(display_path "$escalation_path")"
  fi
  if [[ -n "$latest_artifact" ]]; then
    printf -- '- Next/proof: `%s`\n' "$(display_path "$latest_artifact")"
    printf -- '- Freshness: %s\n' "$(file_freshness "$latest_artifact")"
  else
    printf -- '- Next/proof: no direct artifact files found in `%s`\n' "$(display_path "$artifact_dir")"
    printf -- '- Freshness: missing\n'
  fi
  printf '\n'
}

mkdir -p "$(dirname "$OUT")"

latest_digest="$(ls -t "$PROGRAMS"/conductor-digests/digest-*.md 2>/dev/null | head -n 1 || true)"
active_lanes="$PROGRAMS/ACTIVE-LANES.md"
conductor="$DOCS/CONDUCTOR.md"

{
  printf '# Fable Sidecar Current State\n\n'
  printf -- '- Generated: %s\n' "$(timestamp)"
  printf -- '- Mode: bb sidecar only; Fable remains unaware of bb.\n'
  printf -- '- Model policy: bb chat/automation surfaces should use DeepSeek, Kimi 2.7, or GLM only; no Codex or GPT.\n'
  printf -- '- Source root: `%s`\n' "$ROOT"
  printf -- '- Active lanes: `%s` (%s)\n' "$(display_path "$active_lanes")" "$(file_freshness "$active_lanes")"
  if [[ -n "$latest_digest" ]]; then
    printf -- '- Latest digest: `%s` (%s)\n' "$(display_path "$latest_digest")" "$(file_freshness "$latest_digest")"
  else
    printf -- '- Latest digest: missing\n'
  fi
  printf -- '- Conductor: `%s` (%s)\n\n' "$(display_path "$conductor")" "$(file_freshness "$conductor")"

  printf '## Active Lanes Needing Luke\n\n'
  if [[ -f "$active_lanes" ]]; then
    active_lanes_excerpt "$active_lanes"
  else
    printf 'No ACTIVE-LANES file available.\n'
  fi
  printf '\n\n'

  printf '## Next Glance\n\n'
  if [[ -n "$latest_digest" ]]; then
    latest_digest_glance "$latest_digest"
  else
    printf 'No digest available.\n'
  fi
  printf '\n\n'

  printf '## Mirror Cards\n\n'
  program_card "abbie-ship" "Abbie Ship"
  program_card "atoi" "Atoi"
  program_card "cohesion" "Cohesion"
  program_card "luke" "Luke"
  program_card "factory" "Factory"
  program_card "kumori" "Kumori"
  program_card "saya" "Saya"
  program_card "standard" "Standard"
} > "$OUT"

printf '%s\n' "$OUT"
