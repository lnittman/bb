import {
  useCallback,
  useEffect,
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
import { CopyButton } from "@/components/ui/copy-button.js";
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
const AUTOMATION_RUN_INSPECTOR_ID = "automation-run-inspector";
const AUTOMATION_RUN_PANEL_MIN_SIZE_PERCENT = 32;
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

function getRunTriggerLabel(run: AutomationRun): string {
  return run.trigger === "manual" ? "Manual run" : "Scheduled run";
}

interface RunOutputEvidence {
  label: "Error" | "Output";
  text: string;
  isError: boolean;
  canCopy: boolean;
}

function getRunOutputEvidence(run: AutomationRun): RunOutputEvidence | null {
  if (run.error && run.error.trim().length > 0) {
    return {
      label: "Error",
      text: run.error,
      isError: true,
      canCopy: true,
    };
  }
  if (run.output && run.output.trim().length > 0) {
    return {
      label: "Output",
      text: run.output,
      isError: false,
      canCopy: true,
    };
  }
  if (isSilentRun(run)) {
    return {
      label: "Output",
      text: "No output surfaced for this successful script run.",
      isError: false,
      canCopy: false,
    };
  }
  return null;
}

function getFailedRunPreview(run: AutomationRun): string | null {
  if (run.status !== "failed") {
    return null;
  }
  const preview = (run.error ?? run.output ?? "").trim();
  if (!preview) {
    return null;
  }
  return preview.split(/\r?\n/u)[0] ?? null;
}

function getRunEvidenceSummary(run: AutomationRun, hasThread: boolean): string {
  if (run.status === "running") {
    return "The run is still in progress; evidence will update when it finishes.";
  }
  if (run.status === "skipped") {
    return "The scheduler skipped this run before execution.";
  }
  if (run.status === "failed") {
    return "The run failed; review the error output below before rerunning.";
  }
  if (hasThread) {
    return "The spawned thread is the primary evidence for this run.";
  }
  if (isSilentRun(run)) {
    return "The script succeeded without surfacing output.";
  }
  if (run.output && run.output.trim().length > 0) {
    return "The script succeeded and produced local output.";
  }
  return "No additional evidence was surfaced for this run.";
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
    <div data-automation-detail-config-row="" className="grid gap-1 py-2">
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
  registerButton: (runId: string, node: HTMLButtonElement | null) => void;
}

function RunRow({
  run,
  projectId,
  isSelected,
  onInspect,
  registerButton,
}: RunRowProps) {
  const status = getRunStatusLabel(run);
  const duration = formatRunDuration(run);
  const failedPreview = getFailedRunPreview(run);
  const threadPath =
    run.runMode === "agent" && run.threadId
      ? getThreadRoutePath({ projectId, threadId: run.threadId })
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-border last:border-b-0",
        isSelected && "bg-state-active",
      )}
    >
      <button
        ref={(node) => registerButton(run.id, node)}
        type="button"
        data-automation-run-row=""
        aria-expanded={isSelected}
        aria-controls={isSelected ? AUTOMATION_RUN_INSPECTOR_ID : undefined}
        onClick={() => onInspect(run)}
        className={cn(
          "grid min-h-12 w-full items-center gap-x-3 gap-y-1 px-3 py-2 text-left text-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
          !isSelected && "hover:bg-state-hover",
          threadPath && "pr-24",
          LIST_HOVER_TRANSITION,
        )}
      >
        <span className="sr-only">Inspect run</span>
        <div data-automation-run-primary="" className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {formatRunTimestamp(run.startedAt)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {getRunTriggerLabel(run)}
          </p>
          {failedPreview ? (
            <p className="mt-1 truncate text-xs text-destructive">
              {failedPreview}
            </p>
          ) : null}
        </div>
        <span
          data-automation-run-status=""
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
        <span
          data-automation-run-duration=""
          className="font-mono text-xs tabular-nums text-muted-foreground"
        >
          {duration ?? "running"}
        </span>
        <span
          data-automation-run-result=""
          className="font-mono text-xs text-muted-foreground"
        >
          {threadPath
            ? ""
            : run.runMode === "script" && run.exitCode !== null
              ? `exit ${run.exitCode}`
              : ""}
        </span>
      </button>
      {threadPath ? (
        <Link
          to={threadPath}
          data-automation-run-thread-link=""
          className="absolute right-3 top-1/2 z-10 inline-flex h-7 -translate-y-1/2 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-state-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span>Thread</span>
          <Icon name="ArrowRight" className="size-3.5" />
        </Link>
      ) : null}
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
    <div data-automation-run-detail-row="" className="grid gap-1 py-2">
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
  const threadPath =
    run.runMode === "agent" && run.threadId
      ? getThreadRoutePath({ projectId, threadId: run.threadId })
      : null;
  const outputEvidence = getRunOutputEvidence(run);
  const evidenceSummary = getRunEvidenceSummary(run, threadPath !== null);

  return (
    <aside
      id={AUTOMATION_RUN_INSPECTOR_ID}
      data-automation-run-inspector=""
      className="flex h-full min-h-0 flex-col bg-background"
    >
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
        <section aria-labelledby="automation-run-evidence-heading">
          <div className="rounded-md bg-surface-recessed px-3 py-2">
            <h3
              id="automation-run-evidence-heading"
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium",
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
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {evidenceSummary}
            </p>
            {threadPath ? (
              <Link
                to={threadPath}
                className="mt-2 inline-flex min-w-0 items-center gap-1.5 rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:bg-state-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span className="min-w-0 truncate">Open thread</span>
                <Icon name="ArrowRight" className="size-3.5 shrink-0" />
              </Link>
            ) : null}
          </div>

          {outputEvidence ? (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {outputEvidence.label}
                </p>
                {outputEvidence.canCopy ? (
                  <CopyButton
                    text={outputEvidence.text}
                    label={`Copy run ${outputEvidence.label.toLowerCase()}`}
                    successMessage="Run output copied"
                    errorMessage="Failed to copy run output"
                    className="size-7 rounded-md"
                    iconClassName="size-3.5"
                  />
                ) : null}
              </div>
              <pre
                className={cn(
                  "whitespace-pre-wrap break-words rounded-md bg-surface-recessed px-3 py-2 font-mono text-xs leading-relaxed",
                  outputEvidence.isError
                    ? "text-destructive"
                    : "text-foreground",
                  !outputEvidence.canCopy && "italic text-subtle-foreground",
                )}
              >
                {outputEvidence.text}
              </pre>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No output surfaced for this run.
            </p>
          )}
        </section>

        {run.skipReason ? (
          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {run.skipReason}
          </div>
        ) : null}

        <section aria-label="Run metadata" className="mt-4">
          <dl className="divide-y divide-border border-y border-border">
            <RunDetailItem label="Trigger">
              {getRunTriggerLabel(run)}
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
        </section>
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
  const runPanelWidthPercent = Math.min(
    Math.max(persistedWidthPercent, AUTOMATION_RUN_PANEL_MIN_SIZE_PERCENT),
    AUTOMATION_RUN_PANEL_MAX_SIZE_PERCENT,
  );

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
      CLOSED_MAIN_PANEL_SIZE_PERCENT - runPanelWidthPercent,
      runPanelWidthPercent,
    ]);
  }, [isRunPanelOpen, renderAsDrawer, runPanelWidthPercent]);

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
              ? CLOSED_MAIN_PANEL_SIZE_PERCENT - runPanelWidthPercent
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
              data-automation-detail-main=""
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
                  ? runPanelWidthPercent
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
  const latestRunStatus = latestRun ? getRunStatusLabel(latestRun) : null;
  const runRowButtonsRef = useRef(new Map<string, HTMLButtonElement>());
  const lastOpenedRunIdRef = useRef<string | null>(null);
  const registerRunRowButton = useCallback(
    (runId: string, node: HTMLButtonElement | null) => {
      if (node) {
        runRowButtonsRef.current.set(runId, node);
        return;
      }
      runRowButtonsRef.current.delete(runId);
    },
    [],
  );
  const restoreRunRowFocus = useCallback((runId: string | null) => {
    if (!runId) {
      return;
    }
    requestAnimationFrame(() => {
      runRowButtonsRef.current.get(runId)?.focus();
    });
  }, []);
  const handleInspectRun = useCallback((run: AutomationRun) => {
    lastOpenedRunIdRef.current = run.id;
    setSelectedRunId(run.id);
  }, []);
  const handleCloseRunPanel = useCallback(() => {
    const runId = lastOpenedRunIdRef.current;
    setSelectedRunId(null);
    restoreRunRowFocus(runId);
  }, [restoreRunRowFocus]);

  useEffect(() => {
    if (!selectedRun) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      handleCloseRunPanel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseRunPanel, selectedRun]);

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
          <header
            data-automation-detail-header=""
            className="flex flex-col gap-3"
          >
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
                <span aria-hidden="true">·</span>
                <span className="truncate">{automation.trigger.timezone}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{scheduleStatus}</span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
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
                {latestRun && latestRunStatus ? (
                  <span
                    className={cn(
                      "inline-flex min-w-0 items-center gap-1.5",
                      RUN_STATUS_TONE_CLASS[latestRunStatus.tone],
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        RUN_STATUS_DOT_CLASS[latestRunStatus.tone],
                      )}
                    />
                    <span className="truncate">
                      Last {latestRunStatus.label.toLowerCase()} ·{" "}
                      {formatRunTimestamp(latestRun.startedAt)}
                    </span>
                  </span>
                ) : (
                  <span>No runs yet</span>
                )}
              </div>
            </div>
            <div
              data-automation-detail-actions=""
              className="flex shrink-0 flex-wrap items-center gap-2"
            >
              {automation.enabled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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
                disabled={actionsPending}
                onClick={onDelete}
              >
                <Icon name="Trash2" className="size-4" />
                Delete
              </Button>
            </div>
          </header>

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
              <EmptyStatePanel className="py-6">
                No runs yet. The first result will appear after the next
                schedule or a manual run.
              </EmptyStatePanel>
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
                      registerButton={registerRunRowButton}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

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
        <div
          className={cn("mx-auto w-full", AUTOMATION_DETAIL_MAX_WIDTH_CLASS)}
        >
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageShell>
    );
  }

  if (hasDetailError || !automation) {
    return (
      <PageShell contentClassName="pt-4 md:pt-5">
        <div
          className={cn("mx-auto w-full", AUTOMATION_DETAIL_MAX_WIDTH_CLASS)}
        >
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
