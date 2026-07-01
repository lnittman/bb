# Automation Detail 10/10 Interface Plan

## Goal

Bring the automation detail surface to a 10/10 bb contribution bar: quiet, precise, repeat-use oriented, aligned with the Codex scheduled-task reference, and strong enough for long/verbose automation output without turning the page into a log dump.

Council artifacts:

- Context: `/tmp/bb-automation-detail-council-20260701/context.md`
- Product IA lane: `/tmp/bb-automation-detail-council-20260701/outputs/01-product-ia.json`
- Visual layout lane: `/tmp/bb-automation-detail-council-20260701/outputs/02-visual-layout.json`
- Interaction/accessibility lane: `/tmp/bb-automation-detail-council-20260701/outputs/03-interaction-accessibility.json`
- Observability/output lane: `/tmp/bb-automation-detail-council-20260701/outputs/04-observability-output.json`
- System-fit lane: `/tmp/bb-automation-detail-council-20260701/outputs/05-system-fit.json`

## Council Verdict

The current interface is not optimal.

It is now safe from the worst failure mode, because raw run output no longer renders inline in the run row. But the surface still reads as a sparse centered settings page with a timeline attached, not as a polished scheduled-task operator surface. The optimal shape should answer these questions in the first few seconds:

- Is this automation healthy?
- When did it last run, and what happened?
- When will it run next?
- What action should I take now?
- Where is the full evidence if I need it?

## Target Interface

### Closed Desktop State

- Keep a restrained header with name, status, cadence, next run, and actions.
- Promote run health above static config, but do not let the timeline dominate.
- Treat run history as the primary work surface:
  - compact, table-aligned rows
  - whole row opens inspection
  - status, duration, exit/thread, and action columns align across rows
- Demote static config into a compact summary below health/history, or keep it visibly subordinate.
- Remove redundant `Inspect latest`; the latest row itself is the primary inspect target.

### Inspector Open State

- Main pane and inspector should feel intentionally paired, not like two unrelated columns.
- Inspector min width should be large enough for logs, around 30-33% instead of 26%.
- Inspector should emphasize result evidence:
  - status and timestamp
  - output/error/log surface
  - metadata footer for trigger, duration, exit, thread
- Avoid nested scroll traps. Prefer one panel scroll region, with logs integrated into that region.

### Compact State

- Header actions wrap cleanly or stack.
- Run rows stack into readable groups with stable hit areas.
- Inspector uses the existing drawer path, with full-height evidence and clean close behavior.

## Implementation Steps

### 1. Fix Run Row Interaction And Alignment

Files:

- `apps/app/src/views/AutomationDetailView.tsx`
- `apps/app/src/views/AutomationDetailView.interactions.test.tsx`

Steps:

- Make the whole run row the inspect trigger.
- Remove the trailing inspect icon button as the only target.
- Use `aria-expanded` plus `aria-controls`, not `aria-pressed`.
- Preserve the thread link as a distinct higher-z-index action when present.
- Replace the right-side flex cluster with explicit grid columns for status, duration, exit/thread, and any action slot.
- Remove `Inspect latest` from the run-history header once row-click is solid.

Exit criteria:

- Clicking or pressing Enter/Space on the row opens the inspector.
- Status and duration align vertically across rows with different states.
- Thread links remain independently clickable.
- There is no duplicate inspect affordance fighting the row action.

### 2. Rebalance Information Architecture

Files:

- `apps/app/src/views/AutomationDetailView.tsx`
- `apps/app/src/views/AutomationDetailView.test.tsx`

Steps:

- Consolidate schedule and next-run information into the header.
- Remove the redundant schedule config row.
- Move health/run history above static config, or otherwise make run health visually primary.
- Keep environment, execution, and prompt as compact supporting configuration.
- Ensure empty/no-run states still look intentional.

Exit criteria:

- First viewport answers status, next run, last run, and available action before static execution details dominate.
- Static config no longer repeats the same cadence/next-run information.
- A no-run automation does not look broken or sparse.

### 3. Make Layout Container-Aware

Files:

- `apps/app/src/views/AutomationDetailView.tsx`

Steps:

- Use the same max-width constant for loading, error, and loaded states.
- Convert screen-breakpoint dictionary rows (`sm:`) to container-query behavior where the inspector can narrow the main pane.
- Add wrapping behavior for the header action group.
- Increase the run inspector minimum size to around 30-33%.

Exit criteria:

- Opening the inspector does not squeeze config rows into awkward horizontal layouts.
- Loading to loaded state has no width jump.
- Header actions do not overflow narrow viewports.

### 4. Upgrade Output Evidence Without Overbuilding

Files:

- `apps/app/src/views/AutomationDetailView.tsx`
- optional local-only helper inside the same file unless reuse is proven

Steps:

- Keep output in the inspector, never inline in normal successful rows.
- Add a compact inspector summary: successful, failed, skipped, silent, or agent-thread result.
- Add a copy-output action for script output.
- For long output, show a restrained log area with readable wrapping and a clear scroll model.
- For failed runs only, consider a one-line error preview in the row. Do not preview normal successful output.
- For agent runs, elevate the thread link as the primary evidence path.

Exit criteria:

- Successful noisy output stays out of the main page.
- Failed output is discoverable without turning every row into a log preview.
- Long output is readable and copyable in the inspector.
- No nested scroll trap makes pointer or keyboard use awkward.

### 5. Accessibility And Keyboard Finish

Files:

- `apps/app/src/views/AutomationDetailView.tsx`
- `apps/app/src/views/AutomationDetailView.interactions.test.tsx`

Steps:

- Remove redundant `aria-label` values from text buttons when visible text already names the control.
- Add Escape-to-close for the desktop inspector.
- Restore focus to the row that opened the inspector when it closes.
- Ensure selected/expanded state is announced consistently.
- Review RunLane semantics so it does not repeat noisy image text in Safari accessibility output.

Exit criteria:

- Buttons are announced once.
- Row opens via keyboard and exposes expanded/collapsed state.
- Escape closes the inspector.
- Focus returns to the originating row.
- Safari accessibility output is not polluted by duplicated timeline labels.

## Validation

Run focused gates:

```bash
PATH=/Users/luke/.nvm/versions/node/v22.22.0/bin:/Users/luke/Library/pnpm:$PATH corepack pnpm exec turbo run test --filter=@bb/app -- src/views/AutomationDetailView.test.tsx src/views/AutomationDetailView.interactions.test.tsx src/views/AutomationsView.test.tsx src/views/AutomationsView.interactions.test.tsx
PATH=/Users/luke/.nvm/versions/node/v22.22.0/bin:/Users/luke/Library/pnpm:$PATH corepack pnpm exec turbo run typecheck --filter=@bb/app
PATH=/Users/luke/.nvm/versions/node/v22.22.0/bin:/Users/luke/Library/pnpm:$PATH corepack pnpm exec turbo run lint --filter=@bb/app
```

Visual QA:

- Desktop closed route: `http://localhost:13030/automations/proj_36it3gm4pd/auto_riqybxymyg`
- Desktop inspector open on a verbose script run.
- Desktop medium/narrow with inspector open, verifying container-query reflow.
- Compact mobile viewport with drawer open.
- Safari accessibility capture of the closed page and inspector-open page.

Screenshots to capture:

- closed desktop detail
- inspector-open desktop detail
- compact drawer
- Safari AX/text capture for duplicate timeline/row output

## Do Not Do

- Do not create a generic shared log viewer unless a second caller exists.
- Do not turn the page into a dashboard.
- Do not inline successful output in run rows again.
- Do not add global state for selected runs.
- Do not use raw screen breakpoints where panel width is the actual constraint.

