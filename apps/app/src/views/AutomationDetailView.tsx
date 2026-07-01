import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelGroupHandle,
} from "react-resizable-panels";
import type { Automation, AutomationRun } from "@bb/server-contract";
import { Button } from "@/components/ui/button.js";
import {
  ConfirmDeleteDialog,
  ConfirmDeleteDialogContent,
} from "@/components/dialogs/ConfirmDeleteDialog.js";
import { EmptyStatePanel } from "@/components/ui/empty-state.js";
import { ExpandableLine } from "@/components/ui/expandable-line.js";
import { ResponsiveDrawerShell } from "@/components/ui/responsive-overlay.js";
import { useIsCompactViewport } from "@/components/ui/hooks/use-compact-viewport.js";
import { Icon } from "@/components/ui/icon.js";
import {
  PANEL_COLLAPSE_TRANSITION_CLASS,
  PANEL_RESIZE_HIT_AREA_MARGINS,
} from "@/components/secondary-panel/panelTransitionTokens";
import { useSecondaryPanelResize } from "@/components/secondary-panel/useSecondaryPanelResize";
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
import { RunLane } from "./automations/RunLane";

const AUTOMATION_DETAIL_MAX_WIDTH_CLASS = "max-w-[760px]";
const AUTOMATION_RUN_PANEL_MIN_SIZE_PERCENT = 26;
const AUTOMATION_RUN_PANEL_MAX_SIZE_PERCENT = 62;
const CLOSED_MAIN_PANEL_SIZE_PERCENT = 100;
const CLOSED_RUN_PANEL_SIZE_PERCENT = 0;
const RUN_PANEL_DRAWER_CONTENT_CLASS =
  "flex h-[92dvh] max-h-[92dvh] min-h-0 flex-col overflow-hidden";
const RUN_PANEL_DRAWER_BODY_CLASS =
  "flex h-full min-h-0 flex-1 flex-col overflow-hidden";
const ignorePanelWidthChange = () => {};

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
  isSelected: boolean;
  onInspect: (run: AutomationRun) => void;
}

function RunRow({ run, projectId, isSelected, onInspect }: RunRowProps) {
  const status = getRunStatusLabel(run);
  const duration = formatRunDuration(run);
  const threadPath =
    run.runMode === "agent" && run.threadId
      ? getThreadRoutePath({ projectId, threadId: run.threadId })
      : null;

  return (
    <div
      className={cn(
        "overflow-hidden border-b border-border last:border-b-0",
        isSelected && "bg-state-active",
      )}
    >
      <div
        className={cn(
          "grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 text-sm",
          "hover:bg-state-hover",
          LIST_HOVER_TRANSITION,
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 rounded-md p-0 text-muted-foreground hover:text-foreground"
            aria-label={`Inspect ${formatRunTimestamp(run.startedAt)} run`}
            aria-pressed={isSelected}
            onClick={() => onInspect(run)}
          >
            <Icon name="PanelRight" className="size-4" />
          </Button>
        </div>
      </div>
      {run.skipReason ? (
        <p className="border-t border-border-seam px-3 py-2 text-xs text-muted-foreground">
          {run.skipReason}
        </p>
      ) : null}
    </div>
  );
}

interface RunDetailItemProps {
  label: string;
  children: ReactNode;
}

function RunDetailItem({ label, children }: RunDetailItemProps) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[6rem_minmax(0,1fr)]">
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

interface AutomationRunInspectorProps {
  run: AutomationRun;
  projectId: string;
  onClose: () => void;
}

function AutomationRunInspector({
  run,
  projectId,
  onClose,
}: AutomationRunInspectorProps) {
  const status = getRunStatusLabel(run);
  const duration = formatRunDuration(run);
  const silent = isSilentRun(run);
  const threadPath =
    run.runMode === "agent" && run.threadId
      ? getThreadRoutePath({ projectId, threadId: run.threadId })
      : null;
  const outputText =
    run.error ??
    (silent ? "no output - silent gate, nothing surfaced" : run.output);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-seam px-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-foreground">
            Run details
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {formatRunTimestamp(run.startedAt)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          aria-label="Close run details"
          onClick={onClose}
        >
          <Icon name="X" className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <dl className="divide-y divide-border">
          <RunDetailItem label="Status">
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
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
              {status.label}
            </span>
          </RunDetailItem>
          <RunDetailItem label="Trigger">
            {run.trigger === "manual" ? "Manual run" : "Scheduled run"}
          </RunDetailItem>
          <RunDetailItem label="Scheduled">
            {formatRunTimestamp(run.scheduledFor)}
          </RunDetailItem>
          <RunDetailItem label="Started">
            {formatRunTimestamp(run.startedAt)}
          </RunDetailItem>
          <RunDetailItem label="Duration">
            <span className="font-mono tabular-nums">
              {duration ?? "running"}
            </span>
          </RunDetailItem>
          <RunDetailItem label="Mode">
            {run.runMode === "agent" ? "Agent" : "Script"}
          </RunDetailItem>
          {threadPath ? (
            <RunDetailItem label="Thread">
              <Link
                to={threadPath}
                className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span className="min-w-0 truncate">{run.threadId}</span>
                <Icon name="ArrowRight" className="size-3.5 shrink-0" />
              </Link>
            </RunDetailItem>
          ) : null}
          {run.exitCode !== null ? (
            <RunDetailItem label="Exit">
              <span className="font-mono tabular-nums">{run.exitCode}</span>
            </RunDetailItem>
          ) : null}
        </dl>
        {run.skipReason ? (
          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {run.skipReason}
          </div>
        ) : null}
        {outputText ? (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {run.error ? "Error" : "Output"}
            </p>
            <pre
              className={cn(
                "max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-surface-recessed px-3 py-2 font-mono text-xs leading-relaxed",
                run.error ? "text-destructive" : "text-foreground",
                silent && "italic text-subtle-foreground",
              )}
            >
              {outputText}
            </pre>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            No output surfaced for this run.
          </p>
        )}
      </div>
    </aside>
  );
}

interface AutomationRunDetailsLayoutProps {
  children: ReactNode;
  selectedRun: AutomationRun | null;
  projectId: string;
  onClose: () => void;
}

function AutomationRunDetailsLayout({
  children,
  selectedRun,
  projectId,
  onClose,
}: AutomationRunDetailsLayoutProps) {
  const renderAsDrawer = useIsCompactViewport();
  const isRunPanelOpen = selectedRun !== null;
  const horizontalPanelGroupRef = useRef<ImperativePanelGroupHandle | null>(
    null,
  );
  const {
    handleSecondaryPanelDragging,
    handleSecondaryPanelResize,
    persistedWidthPercent,
    secondaryPanelRef,
    secondaryResizablePanelRef,
  } = useSecondaryPanelResize({
    isSecondaryPanelOpen: isRunPanelOpen && !renderAsDrawer,
    onPanelWidthChange: ignorePanelWidthChange,
  });

  useLayoutEffect(() => {
    const group = horizontalPanelGroupRef.current;
    if (group === null || renderAsDrawer) {
      return;
    }
    if (!isRunPanelOpen) {
      group.setLayout([
        CLOSED_MAIN_PANEL_SIZE_PERCENT,
        CLOSED_RUN_PANEL_SIZE_PERCENT,
      ]);
      return;
    }
    group.setLayout([
      CLOSED_MAIN_PANEL_SIZE_PERCENT - persistedWidthPercent,
      persistedWidthPercent,
    ]);
  }, [isRunPanelOpen, persistedWidthPercent, renderAsDrawer]);

  return (
    <div className="@container flex h-full min-h-0 w-full">
      <PanelGroup
        ref={horizontalPanelGroupRef}
        direction="horizontal"
        className="h-full min-w-0 flex-1"
        style={{ overflow: "clip" }}
      >
        <Panel
          id="automation-detail-main-panel"
          defaultSize={
            isRunPanelOpen && !renderAsDrawer
              ? CLOSED_MAIN_PANEL_SIZE_PERCENT - persistedWidthPercent
              : CLOSED_MAIN_PANEL_SIZE_PERCENT
          }
          minSize={30}
          order={1}
          className={cn(
            "min-w-0 overflow-clip transition-[flex-grow,flex-basis]",
            PANEL_COLLAPSE_TRANSITION_CLASS,
          )}
        >
          <div className="h-full min-h-0 overflow-y-auto">
            <div
              className={cn(
                "mx-auto w-full px-4 pb-4 pt-4 md:px-5 md:pt-5",
                AUTOMATION_DETAIL_MAX_WIDTH_CLASS,
              )}
            >
              {children}
            </div>
          </div>
        </Panel>
        {!renderAsDrawer ? (
          <>
            <PanelResizeHandle
              id="automation-run-details-panel-handle"
              disabled={!isRunPanelOpen}
              onDragging={handleSecondaryPanelDragging}
              hitAreaMargins={PANEL_RESIZE_HIT_AREA_MARGINS}
              className={cn(
                "group relative shrink-0 overflow-visible bg-transparent transition-[width,opacity,background-color] before:absolute before:inset-y-0 before:-left-1.5 before:-right-1.5 before:content-['']",
                PANEL_COLLAPSE_TRANSITION_CLASS,
                isRunPanelOpen
                  ? "w-0 cursor-col-resize opacity-100"
                  : "pointer-events-none w-0 opacity-0",
              )}
              aria-label="Resize automation run details"
            >
              <span className="pointer-events-none absolute inset-y-0 left-full z-10 w-px bg-transparent transition-colors group-hover:bg-accent-foreground/35" />
            </PanelResizeHandle>
            <Panel
              ref={secondaryResizablePanelRef}
              id="automation-run-details-panel"
              collapsible
              collapsedSize={CLOSED_RUN_PANEL_SIZE_PERCENT}
              defaultSize={
                isRunPanelOpen
                  ? persistedWidthPercent
                  : CLOSED_RUN_PANEL_SIZE_PERCENT
              }
              minSize={AUTOMATION_RUN_PANEL_MIN_SIZE_PERCENT}
              maxSize={AUTOMATION_RUN_PANEL_MAX_SIZE_PERCENT}
              onCollapse={onClose}
              onResize={handleSecondaryPanelResize}
              order={2}
              className={cn(
                "min-w-0 overflow-clip border-l border-border-seam-vertical bg-background transition-[flex-grow,flex-basis]",
                PANEL_COLLAPSE_TRANSITION_CLASS,
              )}
            >
              <div
                ref={(node) => {
                  if (node) {
                    secondaryPanelRef.current = node;
                  }
                }}
                aria-hidden={!isRunPanelOpen}
                inert={!isRunPanelOpen}
                className="h-full min-h-0"
              >
                {selectedRun ? (
                  <AutomationRunInspector
                    run={selectedRun}
                    projectId={projectId}
                    onClose={onClose}
                  />
                ) : null}
              </div>
            </Panel>
          </>
        ) : null}
      </PanelGroup>
      {renderAsDrawer ? (
        <ResponsiveDrawerShell
          open={isRunPanelOpen}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
          srLabel="Run details"
          contentClassName={RUN_PANEL_DRAWER_CONTENT_CLASS}
          handleOnly
          repositionInputs={false}
        >
          <div className={RUN_PANEL_DRAWER_BODY_CLASS}>
            {selectedRun ? (
              <AutomationRunInspector
                run={selectedRun}
                projectId={projectId}
                onClose={onClose}
              />
            ) : null}
          </div>
        </ResponsiveDrawerShell>
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
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const scheduleStatus = formatScheduleStatusLabel({
    enabled: automation.enabled,
    nextRunAt: automation.nextRunAt,
  });
  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? null,
    [runs, selectedRunId],
  );
  const latestRun = runs[0] ?? null;
  const handleInspectRun = useCallback((run: AutomationRun) => {
    setSelectedRunId(run.id);
  }, []);
  const handleCloseRunPanel = useCallback(() => {
    setSelectedRunId(null);
  }, []);

  return (
    <PageShell
      contentClassName="h-full min-h-0 max-w-none px-0 pb-0 pt-0"
      maxWidthClassName="max-w-none"
      scrollAreaClassName="overflow-hidden"
    >
      <AutomationRunDetailsLayout
        selectedRun={selectedRun}
        projectId={automation.projectId}
        onClose={handleCloseRunPanel}
      >
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
                  <ExpandableLine
                    fullText={automation.execution.prompt}
                    collapsedClassName="max-h-20 overflow-hidden whitespace-pre-wrap break-words"
                    className="text-xs text-muted-foreground"
                  >
                    {automation.execution.prompt}
                  </ExpandableLine>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {runs.length} {runs.length === 1 ? "run" : "runs"}
                  </span>
                  {latestRun ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => handleInspectRun(latestRun)}
                    >
                      <Icon name="PanelRight" className="size-3.5" />
                      Inspect latest
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {runsError ? (
              <p className="text-sm text-destructive">Failed to load runs.</p>
            ) : runsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : runs.length === 0 ? (
              <EmptyStatePanel className="py-6">No runs yet.</EmptyStatePanel>
            ) : (
              <div className="space-y-3">
                <RunLane
                  runs={runs}
                  nextRunAt={automation.nextRunAt}
                  projectId={automation.projectId}
                />
                <div className="overflow-hidden rounded-md border border-border">
                  {runs.map((run) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      projectId={automation.projectId}
                      isSelected={selectedRun?.id === run.id}
                      onInspect={handleInspectRun}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </AutomationRunDetailsLayout>
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
