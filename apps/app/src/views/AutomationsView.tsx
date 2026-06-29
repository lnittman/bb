import { Fragment, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type {
  Automation,
  AutomationsOverviewResponse,
} from "@bb/server-contract";
import { Button } from "@/components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.js";
import {
  ConfirmDeleteDialog,
  ConfirmDeleteDialogContent,
} from "@/components/dialogs/ConfirmDeleteDialog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.js";
import { EmptyStatePanel } from "@/components/ui/empty-state.js";
import { Icon, type IconName } from "@/components/ui/icon.js";
import { LIST_HOVER_TRANSITION } from "@/components/ui/motion.js";
import { PageShell } from "@/components/ui/page-shell.js";
import { Pill } from "@/components/ui/pill.js";
import { useDialogState } from "@/hooks/useDialogState";
import {
  useAutomations,
  useDeleteAutomation,
  usePauseAutomation,
  useResumeAutomation,
  useRunAutomation,
} from "@/hooks/queries/automation-queries";
import {
  formatCronCadence,
  formatScheduleStatusLabel,
} from "@/lib/format-schedule";
import {
  getAutomationDetailRoutePath,
  getRootComposeRoutePath,
} from "@/lib/route-paths";
import { cn } from "@/lib/utils";

interface AutomationOverviewEntry {
  automation: Automation;
  project: { id: string; name: string };
}

interface AutomationStatusGroup {
  status: "active" | "paused";
  label: string;
  entries: AutomationOverviewEntry[];
}

type CreateAutomationHandler = (initialPrompt: string) => void;

interface AutomationStarterLoop {
  name: string;
  icon: IconName;
  description: string;
  schedule: string;
  prompt: string;
}

export const AUTOMATION_STARTER_LOOPS: readonly AutomationStarterLoop[] = [
  {
    name: "Daily dependency audit",
    icon: "Search",
    description: "Audit dependencies and write a summary.",
    schedule: "Daily 8am",
    prompt:
      "Create a new bb loop to audit dependencies every morning and write a summary.",
  },
  {
    name: "Weekday standup digest",
    icon: "MessageSquare",
    description: "Summarize overnight thread activity.",
    schedule: "Weekdays 9am",
    prompt:
      "Create a new bb loop to summarize overnight thread activity on weekday mornings.",
  },
  {
    name: "Scheduled check & alert",
    icon: "AlertCircle",
    description: "Run a check on a schedule and alert on change.",
    schedule: "Hourly",
    prompt:
      "Create a new bb loop to run a check on a schedule and alert me when something changes.",
  },
  {
    name: "Morning triage",
    icon: "ListTodo",
    description: "Surface and prioritize overnight activity.",
    schedule: "Weekdays 8am",
    prompt:
      "Create a new bb loop to surface and prioritize overnight activity each weekday morning.",
  },
  {
    name: "Release notes draft",
    icon: "FileText",
    description: "Draft release notes from recent changes.",
    schedule: "Fridays 5pm",
    prompt:
      "Create a new bb loop to draft release notes from recent changes every Friday afternoon.",
  },
  {
    name: "Stale work sweep",
    icon: "Archive",
    description: "Flag threads and branches gone quiet.",
    schedule: "Weekly",
    prompt:
      "Create a new bb loop to flag threads and branches that have gone quiet, weekly.",
  },
];

/** Per-row action callbacks, supplied by the container so the presentational
 * overview stays free of mutation hooks (and renderable in tests). */
export interface AutomationRowActions {
  onPause: (entry: AutomationOverviewEntry) => void;
  onResume: (entry: AutomationOverviewEntry) => void;
  onRun: (entry: AutomationOverviewEntry) => void;
  onDelete: (entry: AutomationOverviewEntry) => void;
}

interface AutomationRowProps {
  entry: AutomationOverviewEntry;
  actions: AutomationRowActions;
}

export interface AutomationsOverviewProps {
  entries: readonly AutomationOverviewEntry[];
  isLoading: boolean;
  hasInitialLoadError: boolean;
  actions: AutomationRowActions;
  onCreateAutomation: CreateAutomationHandler;
}

/**
 * Group automations into an insertion-ordered set of status groups: enabled
 * automations under "Active", disabled ones under "Paused". Empty groups are
 * omitted so the view only renders sections that have rows.
 */
function groupAutomationsByStatus(
  entries: readonly AutomationOverviewEntry[],
): AutomationStatusGroup[] {
  const active: AutomationOverviewEntry[] = [];
  const paused: AutomationOverviewEntry[] = [];
  for (const entry of entries) {
    if (entry.automation.enabled) {
      active.push(entry);
    } else {
      paused.push(entry);
    }
  }
  const groups: AutomationStatusGroup[] = [];
  if (active.length > 0) {
    groups.push({ status: "active", label: "Active", entries: active });
  }
  if (paused.length > 0) {
    groups.push({ status: "paused", label: "Paused", entries: paused });
  }
  return groups;
}

export interface AutomationRowMenuItem {
  key: "pause" | "resume" | "run" | "delete";
  label: string;
  destructive: boolean;
  run: () => void;
}

/**
 * Pure description of a row's action-menu items, keyed off the automation's
 * enabled state. Exported so tests assert the item set (Pause vs Resume, Run,
 * Delete) without mounting the portaled Radix menu, which `renderToStaticMarkup`
 * cannot capture.
 */
export function buildAutomationRowMenuItems(
  entry: AutomationOverviewEntry,
  actions: AutomationRowActions,
): AutomationRowMenuItem[] {
  const { automation } = entry;
  return [
    automation.enabled
      ? {
          key: "pause",
          label: "Pause",
          destructive: false,
          run: () => actions.onPause(entry),
        }
      : {
          key: "resume",
          label: "Resume",
          destructive: false,
          run: () => actions.onResume(entry),
        },
    {
      key: "run",
      label: "Run now",
      destructive: false,
      run: () => actions.onRun(entry),
    },
    {
      key: "delete",
      label: "Delete",
      destructive: true,
      run: () => actions.onDelete(entry),
    },
  ];
}

function AutomationRowActionItems({ entry, actions }: AutomationRowProps) {
  const items = buildAutomationRowMenuItems(entry, actions);
  return (
    <>
      {items.map((item) => (
        <Fragment key={item.key}>
          {item.key === "delete" ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem
            className={
              item.destructive
                ? "text-destructive focus:text-destructive"
                : undefined
            }
            onSelect={() => {
              item.run();
            }}
          >
            {item.label}
          </DropdownMenuItem>
        </Fragment>
      ))}
    </>
  );
}

interface LastRunStatusView {
  label: string;
  tone: "ok" | "fail" | "muted";
}

const LAST_RUN_TONE_CLASS: Record<
  LastRunStatusView["tone"],
  { dot: string; text: string }
> = {
  ok: { dot: "bg-foreground", text: "text-foreground" },
  fail: { dot: "bg-destructive", text: "text-destructive" },
  muted: { dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
};

function getLastRunStatusView(automation: Automation): LastRunStatusView {
  switch (automation.lastRunStatus) {
    case "succeeded":
      return { label: "Succeeded", tone: "ok" };
    case "failed":
      return { label: "Failed", tone: "fail" };
    case "running":
      return { label: "Running", tone: "muted" };
    case "skipped":
      return { label: "Skipped", tone: "muted" };
    case null:
      return { label: "No runs", tone: "muted" };
    default: {
      const _exhaustive: never = automation.lastRunStatus;
      return _exhaustive;
    }
  }
}

function AutomationRow({ entry, actions }: AutomationRowProps) {
  const { automation, project } = entry;
  const lastRun = getLastRunStatusView(automation);
  const lastRunTone = LAST_RUN_TONE_CLASS[lastRun.tone];
  const scheduleStatus = formatScheduleStatusLabel({
    enabled: automation.enabled,
    nextRunAt: automation.nextRunAt,
  });
  const cadence = formatCronCadence(automation.trigger.cron);

  return (
    <div
      className={cn(
        "group relative rounded-md text-sm hover:bg-state-hover",
        LIST_HOVER_TRANSITION,
      )}
    >
      <Link
        to={getAutomationDetailRoutePath({
          projectId: automation.projectId,
          automationId: automation.id,
        })}
        aria-label={`Open ${automation.name}`}
        className="absolute inset-0 rounded-md outline-none ring-ring focus-visible:ring-1"
      />
      <div className="pointer-events-none relative z-10 grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(9rem,0.8fr)_minmax(5.5rem,auto)_1.75rem]">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                automation.enabled ? "bg-success" : "bg-muted-foreground/50",
              )}
            />
            <span className="min-w-0 truncate font-medium text-foreground">
              {automation.name}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 pl-3.5 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">{project.name}</span>
            {automation.execution.mode === "script" ? (
              <Pill variant="outline" size="sm" className="shrink-0">
                Script
              </Pill>
            ) : null}
            {automation.origin === "agent" ? (
              <Pill variant="secondary" size="sm" className="shrink-0">
                API
              </Pill>
            ) : null}
          </div>
        </div>
        <div className="col-span-2 min-w-0 pl-3.5 text-xs text-muted-foreground sm:col-span-1 sm:pl-0">
          <p className="truncate text-foreground/85">{cadence}</p>
          <p className="truncate">{scheduleStatus}</p>
        </div>
        <div
          className={cn(
            "col-start-1 flex min-w-0 items-center gap-1.5 pl-3.5 text-xs font-medium sm:col-start-auto sm:pl-0",
            lastRunTone.text,
          )}
        >
          <span
            aria-hidden="true"
            className={cn("size-1.5 shrink-0 rounded-full", lastRunTone.dot)}
          />
          <span className="truncate">{lastRun.label}</span>
        </div>
        <div className="pointer-events-auto col-start-2 row-start-1 flex justify-end sm:col-start-auto sm:row-start-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 rounded-md p-0 text-muted-foreground data-[state=open]:bg-state-active data-[state=open]:text-foreground"
                aria-label={`${automation.name} actions`}
              >
                <Icon name="MoreHorizontal" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40"
              mobileTitle={`${automation.name} actions`}
            >
              <AutomationRowActionItems entry={entry} actions={actions} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

interface LoopTemplateCardProps {
  starter: AutomationStarterLoop;
  onSelect: CreateAutomationHandler;
}

function LoopTemplateCard({ starter, onSelect }: LoopTemplateCardProps) {
  return (
    <button
      type="button"
      title={starter.name}
      onClick={() => onSelect(starter.prompt)}
      className={cn(
        "flex cursor-pointer flex-col gap-2.5 rounded-md bg-muted/50 p-3 text-left",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        LIST_HOVER_TRANSITION,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
          <Icon name={starter.icon} className="size-4" />
        </span>
        <Pill variant="outline" className="shrink-0">
          {starter.schedule}
        </Pill>
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">
          {starter.name}
        </p>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {starter.description}
        </p>
      </div>
    </button>
  );
}

interface TemplatesSectionProps {
  onCreateAutomation: CreateAutomationHandler;
}

/** Curated starters shown inline; the full set lives in the gallery dialog. */
const INLINE_TEMPLATE_COUNT = 3;

/** Inline templates: a compact static row of tiles (visually distinct from the
 * automations list below) plus a right-aligned "View all" that opens the full
 * gallery — a responsive Dialog that renders as a vaul drawer on mobile. */
function TemplatesSection({ onCreateAutomation }: TemplatesSectionProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const inlineStarters = AUTOMATION_STARTER_LOOPS.slice(0, INLINE_TEMPLATE_COUNT);

  const handleGallerySelect = (prompt: string) => {
    setGalleryOpen(false);
    onCreateAutomation(prompt);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Templates</p>
        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                LIST_HOVER_TRANSITION,
              )}
            >
              View all
              <Icon name="ChevronRight" className="size-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Loop templates</DialogTitle>
              <DialogDescription>
                Start a scheduled loop from a template.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AUTOMATION_STARTER_LOOPS.map((starter) => (
                <LoopTemplateCard
                  key={starter.name}
                  starter={starter}
                  onSelect={handleGallerySelect}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {inlineStarters.map((starter) => (
          <LoopTemplateCard
            key={starter.name}
            starter={starter}
            onSelect={onCreateAutomation}
          />
        ))}
      </div>
    </section>
  );
}

export function AutomationsOverview({
  entries,
  isLoading,
  hasInitialLoadError,
  actions,
  onCreateAutomation,
}: AutomationsOverviewProps) {
  const groups = groupAutomationsByStatus(entries);
  const isEmpty = !isLoading && !hasInitialLoadError && entries.length === 0;

  return (
    <PageShell contentClassName="pt-4 md:pt-5">
      <div className="w-full space-y-6">
        {!isLoading && !hasInitialLoadError ? (
          <TemplatesSection onCreateAutomation={onCreateAutomation} />
        ) : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : hasInitialLoadError ? (
          <p className="text-sm text-destructive">
            Failed to load automations.
          </p>
        ) : isEmpty ? (
          <EmptyStatePanel className="px-4 py-6">
            <p className="mx-auto max-w-md text-balance text-sm text-foreground">
              Automations run a prompt on a schedule, spinning up an agent run in
              a project.
            </p>
          </EmptyStatePanel>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.status}>
                <p className="px-3 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="mt-1.5 space-y-1">
                  {group.entries.map((entry) => (
                    <AutomationRow
                      key={entry.automation.id}
                      entry={entry}
                      actions={actions}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

export function AutomationsView() {
  const automationsQuery = useAutomations();
  const navigate = useNavigate();
  const pauseAutomation = usePauseAutomation();
  const resumeAutomation = useResumeAutomation();
  const runAutomation = useRunAutomation();
  const deleteAutomation = useDeleteAutomation();
  const deleteDialog = useDialogState<AutomationOverviewEntry>();
  const { mutate: pauseMutate } = pauseAutomation;
  const { mutate: resumeMutate } = resumeAutomation;
  const { mutate: runMutate } = runAutomation;
  const { mutate: deleteMutate } = deleteAutomation;
  const { onClose: closeDeleteDialog, onOpen: openDeleteDialog } = deleteDialog;

  const data: AutomationsOverviewResponse | undefined = automationsQuery.data;
  const entries = data?.automations ?? [];
  const hasInitialLoadError = automationsQuery.isError && data === undefined;
  const isLoading =
    automationsQuery.isFetching && data === undefined && !hasInitialLoadError;

  const actions: AutomationRowActions = {
    onPause: useCallback(
      (entry: AutomationOverviewEntry) => {
        pauseMutate({
          projectId: entry.automation.projectId,
          automationId: entry.automation.id,
        });
      },
      [pauseMutate],
    ),
    onResume: useCallback(
      (entry: AutomationOverviewEntry) => {
        resumeMutate({
          projectId: entry.automation.projectId,
          automationId: entry.automation.id,
        });
      },
      [resumeMutate],
    ),
    onRun: useCallback(
      (entry: AutomationOverviewEntry) => {
        runMutate({
          projectId: entry.automation.projectId,
          automationId: entry.automation.id,
        });
      },
      [runMutate],
    ),
    onDelete: useCallback(
      (entry: AutomationOverviewEntry) => {
        openDeleteDialog(entry);
      },
      [openDeleteDialog],
    ),
  };

  const confirmDelete = useCallback(() => {
    const entry = deleteDialog.target;
    if (!entry) {
      return;
    }
    deleteMutate(
      {
        projectId: entry.automation.projectId,
        automationId: entry.automation.id,
      },
      { onSuccess: () => closeDeleteDialog() },
    );
  }, [closeDeleteDialog, deleteDialog.target, deleteMutate]);

  const handleCreateAutomation = useCallback(
    (initialPrompt: string) => {
      navigate(getRootComposeRoutePath(), {
        state: {
          focusPrompt: true,
          initialPrompt,
        },
      });
    },
    [navigate],
  );

  return (
    <>
      <AutomationsOverview
        entries={entries}
        isLoading={isLoading}
        hasInitialLoadError={hasInitialLoadError}
        actions={actions}
        onCreateAutomation={handleCreateAutomation}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onOpenChange}
      >
        <ConfirmDeleteDialogContent
          title="Delete automation?"
          description={
            deleteDialog.target
              ? `"${deleteDialog.target.automation.name}" and its run history will be permanently removed.`
              : ""
          }
          confirmLabel="Delete"
          pending={deleteAutomation.isPending}
          onConfirm={confirmDelete}
          onCancel={closeDeleteDialog}
        />
      </ConfirmDeleteDialog>
    </>
  );
}
