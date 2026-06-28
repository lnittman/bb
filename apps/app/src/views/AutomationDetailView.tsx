import { useCallback, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PERSONAL_PROJECT_ID } from "@bb/domain";
import type { Automation, AutomationRun } from "@bb/server-contract";
import { Button } from "@/components/ui/button.js";
import {
  ConfirmDeleteDialog,
  ConfirmDeleteDialogContent,
} from "@/components/dialogs/ConfirmDeleteDialog.js";
import { EmptyStatePanel } from "@/components/ui/empty-state.js";
import { Icon } from "@/components/ui/icon.js";
import { LIST_HOVER_TRANSITION } from "@/components/ui/motion.js";
import { PageShell } from "@/components/ui/page-shell.js";
import { Pill } from "@/components/ui/pill.js";
import { useDialogState } from "@/hooks/useDialogState";
import {
  useAutomationDetail,
  useAutomationRuns,
  useDeleteAutomation,
  usePauseAutomation,
  useResumeAutomation,
  useRunAutomation,
} from "@/hooks/queries/automation-queries";
import {
  formatCronCadence,
  formatScheduleStatusLabel,
} from "@/lib/format-schedule";
import { getAutomationsRoutePath, getThreadRoutePath } from "@/lib/route-paths";
import { cn } from "@/lib/utils";

const RUN_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatRunTimestamp(timestamp: number): string {
  return RUN_TIME_FORMATTER.format(new Date(timestamp));
}

function formatRunDuration(run: AutomationRun): string | null {
  if (run.finishedAt === null) {
    return null;
  }
  const seconds = (run.finishedAt - run.startedAt) / 1000;
  if (seconds < 0) {
    return null;
  }
  return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
}

/** A succeeded script run that produced no surfaced output reads as "silent". */
function isSilentRun(run: AutomationRun): boolean {
  return (
    run.status === "succeeded" &&
    run.runMode === "script" &&
    (run.output === null || run.output.trim().length === 0)
  );
}

interface RunStatusLabel {
  label: string;
  tone: "ok" | "fail" | "muted";
}

function getRunStatusLabel(run: AutomationRun): RunStatusLabel {
  switch (run.status) {
    case "running":
      return { label: "Running", tone: "muted" };
    case "failed":
      return { label: "Failed", tone: "fail" };
    case "skipped":
      return { label: "Skipped", tone: "muted" };
    case "succeeded":
      return isSilentRun(run)
        ? { label: "Succeeded · silent", tone: "muted" }
        : { label: "Succeeded", tone: "ok" };
    default: {
      const _exhaustive: never = run.status;
      return _exhaustive;
    }
  }
}

const RUN_STATUS_TONE_CLASS: Record<RunStatusLabel["tone"], string> = {
  ok: "text-foreground",
  fail: "text-destructive",
  muted: "text-muted-foreground",
};

const RUN_STATUS_DOT_CLASS: Record<RunStatusLabel["tone"], string> = {
  ok: "bg-foreground",
  fail: "bg-destructive",
  muted: "bg-muted-foreground/50",
};

function describeEnvironment(automation: Automation): string {
  const { environment } = automation;
  if (environment.type === "reuse") {
    return "Reuses an existing environment";
  }
  switch (environment.workspace.type) {
    case "personal":
      return "Personal workspace";
    case "managed-worktree":
      return "Managed worktree";
    case "unmanaged":
      return environment.workspace.path
        ? `Workspace: ${environment.workspace.path}`
        : "Unmanaged workspace";
    default: {
      const _exhaustive: never = environment.workspace;
      return _exhaustive;
    }
  }
}

function describeExecution(automation: Automation): string {
  const { execution } = automation;
  if (execution.mode === "agent") {
    return `Agent · ${execution.providerId}/${execution.model} · ${execution.permissionMode}`;
  }
  const interpreter = execution.interpreter ?? "bash";
  const target = execution.scriptFile ?? "inline script";
  const timeoutSeconds = Math.round(execution.timeoutMs / 1000);
  return `Script · ${interpreter} ${target} · ${timeoutSeconds}s timeout`;
}

function describeProject(projectId: string): string {
  return projectId === PERSONAL_PROJECT_ID ? "Personal" : projectId;
}

interface ConfigRowProps {
  label: string;
  children: ReactNode;
}

function ConfigRow({ label, children }: ConfigRowProps) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

interface RunRowProps {
  run: AutomationRun;
  projectId: string;
}

function RunRow({ run, projectId }: RunRowProps) {
  const status = getRunStatusLabel(run);
  const duration = formatRunDuration(run);
  const silent = isSilentRun(run);
  const threadPath =
    run.runMode === "agent" && run.threadId
      ? getThreadRoutePath({ projectId, threadId: run.threadId })
      : null;
  const showOutput =
    run.runMode === "script" &&
    (run.output !== null || run.error !== null || silent);

  return (
    <div className="overflow-hidden border-b border-border last:border-b-0">
      <div
        className={cn(
          "grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 text-sm",
          threadPath && "hover:bg-state-hover",
          threadPath && LIST_HOVER_TRANSITION,
        )}
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {formatRunTimestamp(run.startedAt)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {run.trigger === "manual" ? "Manual run" : "Scheduled run"}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <span
            className={cn(
              "inline-flex min-w-0 items-center gap-1.5 text-xs font-medium",
              RUN_STATUS_TONE_CLASS[status.tone],
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                RUN_STATUS_DOT_CLASS[status.tone],
              )}
            />
            <span className="truncate">{status.label}</span>
          </span>
          <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {duration ?? "running"}
          </span>
          {threadPath ? (
            <Link
              to={threadPath}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-state-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Open run thread"
            >
              <Icon name="ArrowRight" className="size-4" />
            </Link>
          ) : run.runMode === "script" && run.exitCode !== null ? (
            <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
              exit {run.exitCode}
            </span>
          ) : (
            <span className="size-7 shrink-0" aria-hidden="true" />
          )}
        </div>
      </div>
      {run.skipReason ? (
        <p className="border-t border-border-seam px-3 py-2 text-xs text-muted-foreground">
          {run.skipReason}
        </p>
      ) : null}
      {showOutput ? (
        <pre
          className={cn(
            "whitespace-pre-wrap border-t border-border-seam bg-surface-recessed px-3 py-2 font-mono text-xs leading-relaxed",
            run.error ? "text-destructive" : "text-foreground",
            silent && "italic text-subtle-foreground",
          )}
        >
          {run.error ??
            (silent
              ? "no output — silent gate, nothing surfaced"
              : (run.output ?? ""))}
        </pre>
      ) : null}
    </div>
  );
}

interface AutomationDetailContentProps {
  automation: Automation;
  runs: readonly AutomationRun[];
  runsLoading: boolean;
  runsError: boolean;
  onPause: () => void;
  onResume: () => void;
  onRun: () => void;
  onDelete: () => void;
  actionsPending: boolean;
}

/**
 * Presentational body of the automation detail page: header, config summary,
 * action row, and run history. Split from the data-fetching container so it
 * renders without query/provider context in tests and stories.
 */
export function AutomationDetailContent({
  automation,
  runs,
  runsLoading,
  runsError,
  onPause,
  onResume,
  onRun,
  onDelete,
  actionsPending,
}: AutomationDetailContentProps) {
  const scheduleStatus = formatScheduleStatusLabel({
    enabled: automation.enabled,
    nextRunAt: automation.nextRunAt,
  });

  return (
    <PageShell contentClassName="pt-4 md:pt-5">
      <div className="w-full space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-sm font-medium text-foreground">
                {automation.name}
              </h1>
              <Pill
                variant={automation.enabled ? "emphasis" : "outline"}
                size="sm"
                className={
                  automation.enabled ? undefined : "text-muted-foreground"
                }
              >
                {automation.enabled ? "Active" : "Paused"}
              </Pill>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">
                Project {describeProject(automation.projectId)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">
                {formatCronCadence(automation.trigger.cron)}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
          <div className="flex shrink-0 items-center gap-2">
            {automation.enabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Pause"
                disabled={actionsPending}
                onClick={onPause}
              >
                <Icon name="Pause" className="size-4" />
                Pause
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Resume"
                disabled={actionsPending}
                onClick={onResume}
              >
                <Icon name="Play" className="size-4" />
                Resume
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Run now"
              disabled={actionsPending}
              onClick={onRun}
            >
              <Icon name="Zap" className="size-4" />
              Run now
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              aria-label="Delete automation"
              disabled={actionsPending}
              onClick={onDelete}
            >
              <Icon name="Trash2" className="size-4" />
              Delete
            </Button>
          </div>
        </header>

        <section
          aria-labelledby="automation-config-heading"
          className="space-y-2"
        >
          <h2
            id="automation-config-heading"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Config
          </h2>
          <dl className="divide-y divide-border border-y border-border">
            <ConfigRow label="Schedule">
              <div className="space-y-0.5">
                <p className="truncate">
                  {formatCronCadence(automation.trigger.cron)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {automation.trigger.timezone} · {scheduleStatus}
                </p>
              </div>
            </ConfigRow>
            <ConfigRow label="Environment">
              <span className="break-words">
                {describeEnvironment(automation)}
              </span>
            </ConfigRow>
            <ConfigRow label="Execution">
              <span className="break-words">
                {describeExecution(automation)}
              </span>
            </ConfigRow>
            {automation.execution.mode === "agent" ? (
              <ConfigRow label="Prompt">
                <span className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {automation.execution.prompt}
                </span>
              </ConfigRow>
            ) : null}
          </dl>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-medium uppercase text-muted-foreground">
              Run history
            </h2>
            {runs.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {runs.length} {runs.length === 1 ? "run" : "runs"}
              </span>
            ) : null}
          </div>
          {runsError ? (
            <p className="text-sm text-destructive">Failed to load runs.</p>
          ) : runsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : runs.length === 0 ? (
            <EmptyStatePanel className="py-6">No runs yet.</EmptyStatePanel>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              {runs.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  projectId={automation.projectId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

export function AutomationDetailView() {
  const params = useParams<{ projectId: string; automationId: string }>();
  const projectId = params.projectId ?? "";
  const automationId = params.automationId ?? "";
  const navigate = useNavigate();

  const detailQuery = useAutomationDetail(projectId, automationId);
  const runsQuery = useAutomationRuns(projectId, automationId);
  const pauseAutomation = usePauseAutomation();
  const resumeAutomation = useResumeAutomation();
  const runAutomation = useRunAutomation();
  const deleteAutomation = useDeleteAutomation();
  const deleteDialog = useDialogState<true>();
  const { mutate: pauseMutate } = pauseAutomation;
  const { mutate: resumeMutate } = resumeAutomation;
  const { mutate: runMutate } = runAutomation;
  const { mutate: deleteMutate } = deleteAutomation;
  const { onClose: closeDeleteDialog, onOpen: openDeleteDialog } = deleteDialog;

  const handlePause = useCallback(() => {
    pauseMutate({ projectId, automationId });
  }, [pauseMutate, projectId, automationId]);
  const handleResume = useCallback(() => {
    resumeMutate({ projectId, automationId });
  }, [resumeMutate, projectId, automationId]);
  const handleRun = useCallback(() => {
    runMutate({ projectId, automationId });
  }, [runMutate, projectId, automationId]);
  const confirmDelete = useCallback(() => {
    deleteMutate(
      { projectId, automationId },
      {
        onSuccess: () => {
          closeDeleteDialog();
          navigate(getAutomationsRoutePath(), { replace: true });
        },
      },
    );
  }, [deleteMutate, projectId, automationId, closeDeleteDialog, navigate]);

  const automation = detailQuery.data;
  const hasDetailError = detailQuery.isError && automation === undefined;
  const isDetailLoading =
    detailQuery.isFetching && automation === undefined && !hasDetailError;

  if (isDetailLoading) {
    return (
      <PageShell contentClassName="pt-4 md:pt-5">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageShell>
    );
  }

  if (hasDetailError || !automation) {
    return (
      <PageShell contentClassName="pt-4 md:pt-5">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-sm text-destructive">Failed to load automation.</p>
        </div>
      </PageShell>
    );
  }

  const runs = runsQuery.data?.runs ?? [];
  const hasRunsError = runsQuery.isError && runsQuery.data === undefined;
  const isRunsLoading =
    runsQuery.isFetching && runsQuery.data === undefined && !hasRunsError;
  const actionsPending =
    pauseAutomation.isPending ||
    resumeAutomation.isPending ||
    runAutomation.isPending ||
    deleteAutomation.isPending;

  return (
    <>
      <AutomationDetailContent
        automation={automation}
        runs={runs}
        runsLoading={isRunsLoading}
        runsError={hasRunsError}
        onPause={handlePause}
        onResume={handleResume}
        onRun={handleRun}
        onDelete={() => {
          openDeleteDialog(true);
        }}
        actionsPending={actionsPending}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onOpenChange}
      >
        <ConfirmDeleteDialogContent
          title="Delete automation?"
          description={`"${automation.name}" and its run history will be permanently removed.`}
          confirmLabel="Delete"
          pending={deleteAutomation.isPending}
          onConfirm={confirmDelete}
          onCancel={closeDeleteDialog}
        />
      </ConfirmDeleteDialog>
    </>
  );
}
