import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { toString as cronstrueToString } from "cronstrue";
import {
  createAutomationRequestSchema,
  type CreateAutomationRequest,
  type SidebarBootstrapResponse,
  type SystemExecutionOptionsResponse,
} from "@bb/server-contract";
import type {
  AvailableModel,
  PermissionMode,
  ProjectSource,
  ProviderInfo,
  ReasoningLevel,
  ThreadListEntry,
} from "@bb/domain";
import {
  findLocalPathProjectSourceForHost,
  PERSONAL_PROJECT_ID,
} from "@bb/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabPill } from "@/components/ui/tab-pill";
import { EnvironmentPickerUI } from "@/components/pickers/EnvironmentPicker";
import { PermissionModePicker } from "@/components/pickers/PermissionModePicker";
import { ProjectSelector } from "@/components/pickers/ProjectSelector";
import { WorktreePicker } from "@/components/pickers/WorktreePicker";
import type { ReuseThreadOption } from "@/components/pickers/WorktreePicker";
import {
  encodeHostValue,
  encodeReuseValue,
  parseEnvironmentValue,
} from "@/components/pickers/environment-picker-value";
import {
  OPTION_BASE_CLASS_NAME,
  OPTION_MUTED_CLASS_NAME,
  type PickerOption,
} from "@/components/pickers/OptionPicker";
import { ModelReasoningPicker } from "@/components/pickers/ModelReasoningPicker";
import {
  buildAutomationCron,
  cadenceUsesTime,
  formatCronCadence,
  validateScheduleTime,
  type AutomationScheduleCadence,
} from "@/lib/format-schedule";
import { getProviderIconInfo } from "@/lib/provider-icon";
import { getThreadDisplayTitle } from "@/lib/thread-title";
import { formatModelLabel } from "@/hooks/useThreadCreationOptions";
import { LIST_HOVER_TRANSITION } from "@/components/ui/motion";
import { useCreateAutomation } from "@/hooks/queries/automation-queries";
import { useSidebarNavigation } from "@/hooks/queries/sidebar-navigation-query";
import { usePrimaryHost } from "@/hooks/queries/host-queries";
import { useSystemExecutionOptions } from "@/hooks/queries/system-queries";
import { useHostDaemon } from "@/hooks/useHostDaemon";
import { useScrollOverflowState } from "@/components/thread/timeline/useScrollOverflowState";
import { cn } from "@/lib/utils";

export interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

type AutomationEnvironment = CreateAutomationRequest["environment"];

type FieldKey =
  | "name"
  | "instructions"
  | "project"
  | "cron"
  | "timezone"
  | "environment"
  | "time"
  | "provider"
  | "model";

interface ProjectOption {
  id: string;
  name: string;
  sources: readonly ProjectSource[];
  threads: readonly ThreadListEntry[];
}

interface ScheduleCadenceOption {
  id: AutomationScheduleCadence;
  label: string;
  compactLabel?: string;
  title: string;
}

interface ValidationResult {
  name: string | null;
  instructions: string | null;
  project: string | null;
  cron: string | null;
  timezone: string | null;
  environment: string | null;
  time: string | null;
  provider: string | null;
  model: string | null;
}

const SCHEDULE_CADENCES: readonly ScheduleCadenceOption[] = [
  { id: "hourly", label: "Hourly", title: "Hourly" },
  { id: "daily", label: "Daily", title: "Daily" },
  {
    id: "weekdays",
    label: "Weekdays",
    compactLabel: "M-F",
    title: "Weekdays",
  },
  { id: "weekly", label: "Weekly", title: "Weekly" },
  { id: "custom", label: "Custom", compactLabel: "Cron", title: "Custom" },
];

const DEFAULT_SCHEDULE_CADENCE: AutomationScheduleCadence = "daily";
const DEFAULT_SCHEDULE_TIME = "09:00";
const DEFAULT_CUSTOM_CRON = "0 9 * * *";
const DEFAULT_PERMISSION_MODE: PermissionMode = "readonly";
const FALLBACK_TIMEZONE = "UTC";
const DEFAULT_SUPPORTED_PERMISSION_MODES: readonly PermissionMode[] = [
  "full",
  "workspace-write",
  "readonly",
];

const PERMISSION_MODE_OPTIONS: readonly PickerOption<PermissionMode>[] = [
  { value: "readonly", label: "Default" },
  { value: "workspace-write", label: "Workspace Write" },
  { value: "full", label: "Full Access", tone: "warning" },
];

const FALLBACK_TIMEZONE_OPTIONS: readonly string[] = [
  "UTC",
  "America/New_York",
  "America/Detroit",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Athens",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const FIELD_ERROR_CLASS_NAME = "text-xs leading-4 text-destructive";
const MODEL_ONLY_REASONING_VALUE: ReasoningLevel = "medium";
const EMPTY_REASONING_OPTIONS: readonly PickerOption<ReasoningLevel>[] = [];
const EMPTY_PROVIDERS: readonly ProviderInfo[] = [];
const EMPTY_MODELS: readonly AvailableModel[] = [];
const CREATE_AUTOMATION_SCROLL_FADE_SIZE = "2rem";

interface CreateAutomationScrollMaskState {
  aboveOverflow: boolean;
  belowOverflow: boolean;
}

const EMPTY_SCROLL_MASK_STATE: CreateAutomationScrollMaskState = {
  aboveOverflow: false,
  belowOverflow: false,
};

interface CreateAutomationScrollMaskStyle {
  maskImage: string;
  WebkitMaskImage: string;
  maskMode: "alpha";
}

export function buildCreateAutomationScrollMaskStyle({
  aboveOverflow,
  belowOverflow,
}: CreateAutomationScrollMaskState):
  | CreateAutomationScrollMaskStyle
  | undefined {
  if (!aboveOverflow && !belowOverflow) {
    return undefined;
  }
  const topEdge = aboveOverflow
    ? `transparent 0, black ${CREATE_AUTOMATION_SCROLL_FADE_SIZE}`
    : "black 0";
  const bottomEdge = belowOverflow
    ? `black calc(100% - ${CREATE_AUTOMATION_SCROLL_FADE_SIZE}), transparent 100%`
    : "black 100%";
  const maskImage = `linear-gradient(to bottom, ${topEdge}, ${bottomEdge})`;

  return {
    maskImage,
    WebkitMaskImage: maskImage,
    maskMode: "alpha",
  };
}

function getDefaultTimezone(): string {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? FALLBACK_TIMEZONE;
  return isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE;
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(
      new Date(0),
    );
    return true;
  } catch {
    return false;
  }
}

function getSupportedTimezones(): string[] {
  const intlWithTimezones = Intl as typeof Intl & {
    supportedValuesOf?: (input: "timeZone") => string[];
  };
  const supportedTimezones = intlWithTimezones.supportedValuesOf?.("timeZone");
  if (supportedTimezones && supportedTimezones.length > 0) {
    return supportedTimezones;
  }
  return [...FALLBACK_TIMEZONE_OPTIONS];
}

function getTimezoneOptions(timezone: string): PickerOption<string>[] {
  const timezones = new Set([
    ...getSupportedTimezones(),
    timezone,
    FALLBACK_TIMEZONE,
  ]);
  return Array.from(timezones)
    .filter((value) => value.trim().length > 0 && isValidTimezone(value))
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ value, label: value }));
}

function validateCronExpression(cron: string): string | null {
  const trimmed = cron.trim();
  if (!trimmed) {
    return "Cron expression is required.";
  }
  if (trimmed.split(/\s+/u).length !== 5) {
    return "Use a standard 5-field cron expression.";
  }
  try {
    cronstrueToString(trimmed, { verbose: false });
    return null;
  } catch {
    return "Enter a valid cron expression.";
  }
}

function validateForm(args: {
  name: string;
  instructions: string;
  projectId: string;
  cron: string;
  scheduleCadence: AutomationScheduleCadence;
  scheduleTime: string;
  timezone: string;
  environment: AutomationEnvironment | null;
  providerId: string;
  model: string;
}): ValidationResult {
  return {
    name: args.name.trim() ? null : "Name is required.",
    instructions: args.instructions.trim()
      ? null
      : "Instructions are required.",
    project: args.projectId ? null : "Project is required.",
    cron: validateCronExpression(args.cron),
    environment: args.environment ? null : "Folder or worktree is required.",
    time: cadenceUsesTime(args.scheduleCadence)
      ? validateScheduleTime(args.scheduleTime)
      : null,
    timezone: !args.timezone.trim()
      ? "Timezone is required."
      : isValidTimezone(args.timezone.trim())
        ? null
        : "Enter a valid IANA timezone.",
    provider: args.providerId ? null : "Provider is required.",
    model: args.model ? null : "Model is required.",
  };
}

function hasValidationErrors(validation: ValidationResult): boolean {
  return Object.values(validation).some((message) => message !== null);
}

function getSubmitBlockedReason(validation: ValidationResult): string | null {
  const missingBasics = [
    validation.name ? "name" : null,
    validation.instructions ? "instructions" : null,
  ].filter((value): value is string => value !== null);
  if (missingBasics.length === 2) {
    return "Add a name and instructions to create.";
  }
  if (validation.name) {
    return "Add a name to create.";
  }
  if (validation.instructions) {
    return "Add instructions to create.";
  }
  if (validation.provider || validation.model) {
    return "Choose a provider and model to create.";
  }
  if (validation.project || validation.environment) {
    return "Choose a project and environment to create.";
  }
  if (validation.time || validation.cron) {
    return "Fix the schedule before creating.";
  }
  if (validation.timezone) {
    return "Choose a valid timezone to create.";
  }
  return null;
}

function getProjectOptions(
  data: SidebarBootstrapResponse | undefined,
): ProjectOption[] {
  if (!data) {
    return [];
  }
  return [
    {
      id: data.personalProject.id,
      name: data.personalProject.name,
      sources: data.personalProject.sources,
      threads: data.personalProject.threads,
    },
    ...data.projects.map((project) => ({
      id: project.id,
      name: project.name,
      sources: project.sources,
      threads: project.threads,
    })),
  ];
}

function getInitialProjectId(args: {
  defaultProjectId: string | undefined;
  projectOptions: readonly ProjectOption[];
}): string {
  if (
    args.defaultProjectId &&
    args.projectOptions.some((project) => project.id === args.defaultProjectId)
  ) {
    return args.defaultProjectId;
  }
  return (
    args.projectOptions[0]?.id ?? args.defaultProjectId ?? PERSONAL_PROJECT_ID
  );
}

function isWorktreeThread(thread: ThreadListEntry): boolean {
  if (thread.environmentId === null) {
    return false;
  }
  return (
    thread.environmentWorkspaceDisplayKind === "managed-worktree" ||
    thread.environmentWorkspaceDisplayKind === "unmanaged-worktree"
  );
}

function buildReuseThreadOptions(
  threads: readonly ThreadListEntry[],
): ReuseThreadOption[] {
  const threadsByEnvironmentId = new Map<string, ThreadListEntry[]>();
  const branchByEnvironmentId = new Map<string, string | null>();
  const nameByEnvironmentId = new Map<string, string | null>();
  for (const thread of threads) {
    if (!isWorktreeThread(thread) || thread.environmentId === null) {
      continue;
    }
    let bucket = threadsByEnvironmentId.get(thread.environmentId);
    if (!bucket) {
      bucket = [];
      threadsByEnvironmentId.set(thread.environmentId, bucket);
      branchByEnvironmentId.set(
        thread.environmentId,
        thread.environmentBranchName,
      );
      nameByEnvironmentId.set(thread.environmentId, thread.environmentName);
    }
    bucket.push(thread);
  }
  return Array.from(threadsByEnvironmentId.entries())
    .map(([environmentId, threadsInEnvironment]) => {
      threadsInEnvironment.sort(
        (left, right) => right.latestAttentionAt - left.latestAttentionAt,
      );
      return {
        environmentId,
        branchName: branchByEnvironmentId.get(environmentId) ?? null,
        name: nameByEnvironmentId.get(environmentId) ?? null,
        threads: threadsInEnvironment.map((thread) => ({
          id: thread.id,
          title: getThreadDisplayTitle(thread),
        })),
      };
    })
    .sort((left, right) => {
      const leftLabel = left.name ?? left.branchName;
      const rightLabel = right.name ?? right.branchName;
      if (leftLabel && rightLabel) {
        return leftLabel.localeCompare(rightLabel);
      }
      return left.environmentId.localeCompare(right.environmentId);
    });
}

function modelOptionsFromModels(
  models: readonly AvailableModel[],
): PickerOption<string>[] {
  return models.map((model) => ({
    value: model.model,
    label: formatModelLabel(model.displayName || model.model),
  }));
}

function getDefaultModel(
  models: readonly AvailableModel[],
): AvailableModel | null {
  return models.find((model) => model.isDefault) ?? models[0] ?? null;
}

function getPermissionLabel(value: PermissionMode): string {
  return (
    PERMISSION_MODE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

function getDefaultEnvironmentValue(args: {
  primaryHostId: string | null;
  project: ProjectOption | undefined;
  projectId: string;
}): string {
  if (!args.primaryHostId) {
    return "";
  }
  if (args.projectId === PERSONAL_PROJECT_ID) {
    return encodeHostValue(args.primaryHostId, "local");
  }
  const hasHostSource =
    args.project !== undefined &&
    findLocalPathProjectSourceForHost(
      args.project.sources,
      args.primaryHostId,
    ) !== undefined;
  return hasHostSource ? encodeHostValue(args.primaryHostId, "local") : "";
}

function buildAutomationEnvironment(args: {
  environmentValue: string;
  project: ProjectOption | undefined;
  projectId: string;
  reuseThreadOptions: readonly ReuseThreadOption[];
}): AutomationEnvironment | null {
  if (!args.projectId) {
    return null;
  }
  const parsedEnvironment = parseEnvironmentValue(args.environmentValue);
  if (!parsedEnvironment) {
    return null;
  }
  if (parsedEnvironment.type === "reuse") {
    if (
      parsedEnvironment.environmentId === null ||
      !args.reuseThreadOptions.some(
        (option) => option.environmentId === parsedEnvironment.environmentId,
      )
    ) {
      return null;
    }
    return { type: "reuse", environmentId: parsedEnvironment.environmentId };
  }
  if (args.projectId === PERSONAL_PROJECT_ID) {
    return {
      type: "host",
      hostId: parsedEnvironment.hostId,
      workspace: { type: "personal" },
    };
  }
  if (
    args.project === undefined ||
    findLocalPathProjectSourceForHost(
      args.project.sources,
      parsedEnvironment.hostId,
    ) === undefined
  ) {
    return null;
  }
  if (parsedEnvironment.mode === "worktree") {
    return {
      type: "host",
      hostId: parsedEnvironment.hostId,
      workspace: {
        type: "managed-worktree",
        baseBranch: { kind: "default" },
      },
    };
  }
  return {
    type: "host",
    hostId: parsedEnvironment.hostId,
    workspace: { type: "unmanaged", path: null },
  };
}

function buildCreateAutomationRequest(args: {
  name: string;
  cron: string;
  enabled: boolean;
  timezone: string;
  prompt: string;
  providerId: string;
  model: string;
  permissionMode: PermissionMode;
  environment: AutomationEnvironment;
}): CreateAutomationRequest | null {
  const input = {
    name: args.name.trim(),
    enabled: args.enabled,
    trigger: {
      triggerType: "schedule",
      cron: args.cron.trim(),
      timezone: args.timezone.trim(),
    },
    execution: {
      mode: "agent",
      prompt: args.prompt.trim(),
      providerId: args.providerId,
      model: args.model,
      permissionMode: args.permissionMode,
    },
    environment: args.environment,
    autoArchive: false,
    origin: "human",
  } satisfies CreateAutomationRequest;
  const parsed = createAutomationRequestSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} aria-live="polite" className={FIELD_ERROR_CLASS_NAME}>
      {message}
    </p>
  );
}

function TimezonePicker({
  id,
  value,
  options,
  invalid,
  describedBy,
  onChange,
  onBlur,
}: {
  id: string;
  value: string;
  options: readonly PickerOption<string>[];
  invalid: boolean;
  describedBy: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size="sm"
          aria-label="Timezone"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onBlur={onBlur}
          className="h-9 w-full justify-between px-3 font-normal"
        >
          <span className="min-w-0 truncate">{value}</span>
          <Icon
            name="ChevronDown"
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
        mobileTitle="Timezone"
      >
        <DropdownMenuLabel>Timezone</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
            className={LIST_HOVER_TRANSITION}
          >
            <span className="min-w-0 truncate">{option.label}</span>
            <Icon
              name="Check"
              className={cn(
                "ml-auto size-4 shrink-0",
                option.value === value ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CreateAutomationDialog({
  open,
  onOpenChange,
  defaultProjectId,
}: CreateAutomationDialogProps) {
  const nameId = useId();
  const instructionsId = useId();
  const cronId = useId();
  const scheduleTimeId = useId();
  const timezoneId = useId();
  const modelControlId = useId();
  const submitHintId = useId();
  const nameErrorId = `${nameId}-error`;
  const instructionsErrorId = `${instructionsId}-error`;
  const permissionsErrorId = `${instructionsId}-permissions-error`;
  const scheduleTimeErrorId = `${scheduleTimeId}-error`;
  const cronErrorId = `${cronId}-error`;
  const timezoneErrorId = `${timezoneId}-error`;
  const modelErrorId = `${modelControlId}-error`;
  const cronInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const hasDialogUserInteractionRef = useRef(false);
  const fieldsWithUserInteractionRef = useRef<Set<FieldKey>>(new Set());
  const sidebarNavigation = useSidebarNavigation({ enabled: open });
  const primaryHost = usePrimaryHost({ enabled: open });
  const { isLocalDaemonHost } = useHostDaemon();
  const projectOptions = useMemo(
    () => getProjectOptions(sidebarNavigation.data),
    [sidebarNavigation.data],
  );
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [scheduleCadence, setScheduleCadence] =
    useState<AutomationScheduleCadence>(DEFAULT_SCHEDULE_CADENCE);
  const [scheduleTime, setScheduleTime] = useState(DEFAULT_SCHEDULE_TIME);
  const [customCron, setCustomCron] = useState(DEFAULT_CUSTOM_CRON);
  const [timezone, setTimezone] = useState(getDefaultTimezone);
  const [environmentValue, setEnvironmentValue] = useState("");
  const [providerId, setProviderId] = useState("");
  const [model, setModel] = useState("");
  const [permissionMode, setPermissionMode] = useState<PermissionMode>(
    DEFAULT_PERMISSION_MODE,
  );
  const [touched, setTouched] = useState<ReadonlySet<FieldKey>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createAutomation = useCreateAutomation();
  const selectedProject = projectOptions.find(
    (project) => project.id === projectId,
  );
  const reuseThreadOptions = useMemo(
    () => buildReuseThreadOptions(selectedProject?.threads ?? []),
    [selectedProject?.threads],
  );
  const parsedEnvironment = useMemo(
    () => parseEnvironmentValue(environmentValue),
    [environmentValue],
  );
  const selectedReuseEnvironmentId =
    parsedEnvironment?.type === "reuse"
      ? parsedEnvironment.environmentId
      : null;
  const automationEnvironment = useMemo(
    () =>
      buildAutomationEnvironment({
        environmentValue,
        project: selectedProject,
        projectId,
        reuseThreadOptions,
      }),
    [environmentValue, projectId, reuseThreadOptions, selectedProject],
  );
  const cron = useMemo(
    () =>
      buildAutomationCron({
        cadence: scheduleCadence,
        customCron,
        time: scheduleTime,
      }),
    [customCron, scheduleCadence, scheduleTime],
  );

  const executionOptionsQuery = useSystemExecutionOptions({
    enabled: open,
    providerId: providerId || undefined,
  });
  const executionOptions: SystemExecutionOptionsResponse | undefined =
    executionOptionsQuery.data;
  const providers = executionOptions?.providers ?? EMPTY_PROVIDERS;
  const activeProvider = providers.find(
    (provider) => provider.id === providerId,
  );
  const supportedPermissionModes =
    activeProvider?.capabilities.supportedPermissionModes ??
    DEFAULT_SUPPORTED_PERMISSION_MODES;
  const permissionOptions = useMemo(
    () =>
      PERMISSION_MODE_OPTIONS.filter((option) =>
        supportedPermissionModes.includes(option.value),
      ),
    [supportedPermissionModes],
  );
  const providerOptions = useMemo(
    (): PickerOption<string>[] =>
      providers.map((provider) => ({
        value: provider.id,
        label: provider.displayName,
        icon: getProviderIconInfo(provider.id)?.icon,
      })),
    [providers],
  );
  const availableModels = executionOptions?.models ?? EMPTY_MODELS;
  const selectedOnlyModels =
    executionOptions?.selectedOnlyModels ?? EMPTY_MODELS;
  const modelOptions = useMemo(
    () => modelOptionsFromModels(availableModels),
    [availableModels],
  );
  const moreModelOptions = useMemo(
    () => modelOptionsFromModels(selectedOnlyModels),
    [selectedOnlyModels],
  );
  const timezoneOptions = useMemo(
    () => getTimezoneOptions(timezone),
    [timezone],
  );
  const cadenceLabel = useMemo(() => formatCronCadence(cron), [cron]);
  const showTimeControls = cadenceUsesTime(scheduleCadence);
  const showScheduleControls = showTimeControls || scheduleCadence === "custom";
  const validation = useMemo(
    () =>
      validateForm({
        name,
        instructions,
        projectId,
        cron,
        scheduleCadence,
        scheduleTime,
        timezone,
        environment: automationEnvironment,
        providerId,
        model,
      }),
    [
      automationEnvironment,
      cron,
      instructions,
      model,
      name,
      projectId,
      providerId,
      scheduleCadence,
      scheduleTime,
      timezone,
    ],
  );
  const isFormValid = !hasValidationErrors(validation);
  const canSubmit = isFormValid && !createAutomation.isPending;
  const submitHint =
    !createAutomation.isPending && !isFormValid
      ? getSubmitBlockedReason(validation)
      : null;
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );
  const {
    aboveOverflow,
    belowOverflow,
    bottomSentinelRef,
    scrollRef,
    topSentinelRef,
  } = useScrollOverflowState<HTMLDivElement>({
    measureOverflow: true,
  });
  const [measuredScrollOverflow, setMeasuredScrollOverflow] = useState(
    EMPTY_SCROLL_MASK_STATE,
  );
  // Dialog content is mounted only after opening, so this local pass wakes the
  // shared sentinel pattern up as soon as the scroll body exists.
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }
    const scroll = scrollElement;
    if (!scroll) {
      return;
    }

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const next = {
        aboveOverflow: scroll.scrollTop > 1,
        belowOverflow:
          scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight > 1,
      };
      setMeasuredScrollOverflow((previous) => {
        if (
          previous.aboveOverflow === next.aboveOverflow &&
          previous.belowOverflow === next.belowOverflow
        ) {
          return previous;
        }
        return next;
      });
    };
    const scheduleMeasure = () => {
      if (frame !== null) return;
      frame =
        typeof window.requestAnimationFrame === "function"
          ? window.requestAnimationFrame(measure)
          : window.setTimeout(measure, 0);
    };

    scheduleMeasure();
    scroll.addEventListener("scroll", scheduleMeasure, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleMeasure);
    resizeObserver?.observe(scroll);

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(scheduleMeasure);
    mutationObserver?.observe(scroll, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      if (frame !== null) {
        if (typeof window.cancelAnimationFrame === "function") {
          window.cancelAnimationFrame(frame);
        } else {
          window.clearTimeout(frame);
        }
      }
      scroll.removeEventListener("scroll", scheduleMeasure);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [open, scrollElement]);
  const handleScrollBodyRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      setScrollElement(node);
    },
    [scrollRef],
  );
  const scrollMaskStyle = buildCreateAutomationScrollMaskStyle({
    aboveOverflow: aboveOverflow || measuredScrollOverflow.aboveOverflow,
    belowOverflow: belowOverflow || measuredScrollOverflow.belowOverflow,
  });

  const markTouched = useCallback((field: FieldKey) => {
    setTouched((current) => {
      const next = new Set(current);
      next.add(field);
      return next;
    });
  }, []);
  const markFieldInteracted = useCallback((field: FieldKey) => {
    fieldsWithUserInteractionRef.current.add(field);
  }, []);
  const markFieldInteractedAfterDialogInteraction = useCallback(
    (field: FieldKey) => {
      if (!hasDialogUserInteractionRef.current) {
        return;
      }
      markFieldInteracted(field);
    },
    [markFieldInteracted],
  );
  const markTouchedAfterUserInteraction = useCallback(
    (field: FieldKey) => {
      if (!fieldsWithUserInteractionRef.current.has(field)) {
        return;
      }
      markTouched(field);
    },
    [markTouched],
  );

  const resetForm = useCallback(() => {
    hasDialogUserInteractionRef.current = false;
    fieldsWithUserInteractionRef.current.clear();
    setProjectId(getInitialProjectId({ defaultProjectId, projectOptions }));
    setName("");
    setInstructions("");
    setScheduleCadence(DEFAULT_SCHEDULE_CADENCE);
    setScheduleTime(DEFAULT_SCHEDULE_TIME);
    setCustomCron(DEFAULT_CUSTOM_CRON);
    setTimezone(getDefaultTimezone());
    setEnvironmentValue(
      getDefaultEnvironmentValue({
        primaryHostId: primaryHost?.id ?? null,
        project:
          projectOptions.find(
            (project) =>
              project.id ===
              getInitialProjectId({ defaultProjectId, projectOptions }),
          ) ?? undefined,
        projectId: getInitialProjectId({ defaultProjectId, projectOptions }),
      }),
    );
    setProviderId("");
    setModel("");
    setPermissionMode(DEFAULT_PERMISSION_MODE);
    setTouched(new Set());
    setHasSubmitted(false);
    setServerError(null);
  }, [defaultProjectId, primaryHost?.id, projectOptions]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      resetForm();
    }
    wasOpenRef.current = open;
  }, [open, resetForm]);

  useEffect(() => {
    if (!open || projectOptions.length === 0) {
      return;
    }
    if (!projectOptions.some((project) => project.id === projectId)) {
      setProjectId(getInitialProjectId({ defaultProjectId, projectOptions }));
    }
  }, [defaultProjectId, open, projectId, projectOptions]);

  useEffect(() => {
    if (!open || projectOptions.length === 0) {
      return;
    }
    const fallbackValue = getDefaultEnvironmentValue({
      primaryHostId: primaryHost?.id ?? null,
      project: selectedProject,
      projectId,
    });
    const isPendingReuseSelection =
      parsedEnvironment?.type === "reuse" &&
      parsedEnvironment.environmentId === null;
    if (
      !environmentValue ||
      (!isPendingReuseSelection && automationEnvironment === null)
    ) {
      setEnvironmentValue(fallbackValue);
    }
  }, [
    automationEnvironment,
    environmentValue,
    open,
    parsedEnvironment,
    primaryHost?.id,
    projectId,
    projectOptions.length,
    selectedProject,
  ]);

  useEffect(() => {
    if (!open || providers.length === 0) {
      return;
    }
    if (
      !providerId ||
      !providers.some((provider) => provider.id === providerId)
    ) {
      setProviderId(providers[0].id);
    }
  }, [open, providerId, providers]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const defaultModel = getDefaultModel(availableModels);
    if (!defaultModel) {
      setModel("");
      return;
    }
    if (
      !availableModels.some((availableModel) => availableModel.model === model)
    ) {
      setModel(defaultModel.model);
    }
  }, [availableModels, model, open]);

  useEffect(() => {
    if (supportedPermissionModes.includes(permissionMode)) {
      return;
    }
    const fallbackPermissionMode =
      supportedPermissionModes[0] ?? DEFAULT_PERMISSION_MODE;
    setPermissionMode(
      supportedPermissionModes.includes(DEFAULT_PERMISSION_MODE)
        ? DEFAULT_PERMISSION_MODE
        : fallbackPermissionMode,
    );
  }, [permissionMode, supportedPermissionModes]);

  const handleProviderChange = useCallback(
    (nextProviderId: string) => {
      setProviderId(nextProviderId);
      setModel("");
      markTouched("provider");
      setServerError(null);
    },
    [markTouched],
  );

  const handleModelChange = useCallback(
    (nextModel: string) => {
      setModel(nextModel);
      markTouched("model");
      setServerError(null);
    },
    [markTouched],
  );

  const handleProjectChange = useCallback(
    (nextProjectId: string) => {
      const nextProject = projectOptions.find(
        (project) => project.id === nextProjectId,
      );
      setProjectId(nextProjectId);
      setEnvironmentValue(
        getDefaultEnvironmentValue({
          primaryHostId: primaryHost?.id ?? null,
          project: nextProject,
          projectId: nextProjectId,
        }),
      );
      markTouched("project");
      markTouched("environment");
      setServerError(null);
    },
    [markTouched, primaryHost?.id, projectOptions],
  );

  const handleCadenceSelect = useCallback(
    (cadence: AutomationScheduleCadence) => {
      setScheduleCadence(cadence);
      setServerError(null);
      if (cadence === "custom") {
        requestAnimationFrame(() => cronInputRef.current?.focus());
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setHasSubmitted(true);
      setTouched(
        new Set([
          "name",
          "instructions",
          "project",
          "cron",
          "timezone",
          "environment",
          "time",
          "provider",
          "model",
        ]),
      );
      setServerError(null);
      if (!isFormValid) {
        return;
      }
      if (!automationEnvironment) {
        setServerError("Choose a folder or worktree for this automation.");
        return;
      }
      const payload = buildCreateAutomationRequest({
        name,
        cron,
        enabled: true,
        timezone,
        prompt: instructions,
        providerId,
        model,
        permissionMode,
        environment: automationEnvironment,
      });
      if (!payload) {
        setServerError("Automation request did not match the server contract.");
        return;
      }
      createAutomation.mutate(
        { projectId, payload },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
          onError: (error) => {
            setServerError(error.message);
          },
        },
      );
    },
    [
      automationEnvironment,
      createAutomation,
      cron,
      instructions,
      isFormValid,
      model,
      name,
      onOpenChange,
      permissionMode,
      projectId,
      providerId,
      timezone,
    ],
  );

  const showError = useCallback(
    (field: FieldKey) =>
      (touched.has(field) || hasSubmitted) && validation[field] !== null,
    [hasSubmitted, touched, validation],
  );
  const permissionsError = showError("project")
    ? validation.project
    : showError("environment")
      ? validation.environment
      : null;
  const modelSelectionError = showError("provider")
    ? validation.provider
    : showError("model")
      ? validation.model
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        mobileSize="full-height"
        className="min-h-0 max-md:flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden md:h-[min(85dvh,44rem)] md:w-[calc(100vw-3rem)] md:max-w-2xl md:gap-4"
        onKeyDownCapture={() => {
          hasDialogUserInteractionRef.current = true;
        }}
        onPointerDownCapture={() => {
          hasDialogUserInteractionRef.current = true;
        }}
      >
        <DialogHeader>
          <DialogTitle>New automation</DialogTitle>
          <DialogDescription>
            Schedule a bb automation directly, without routing creation through
            chat.
          </DialogDescription>
        </DialogHeader>
        <form
          data-create-automation-form=""
          className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto_auto] gap-2 md:gap-2.5"
          onSubmit={handleSubmit}
        >
          <div
            ref={handleScrollBodyRef}
            data-create-automation-scroll-body=""
            className="min-h-0 overflow-x-hidden overflow-y-auto pr-1"
            style={scrollMaskStyle}
          >
            <div
              ref={topSentinelRef}
              aria-hidden
              className="-mb-px h-px w-full opacity-0"
            />
            <div className="grid gap-3 md:gap-4">
              <div className="grid gap-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor={nameId}
                >
                  Name
                </label>
                <Input
                  id={nameId}
                  value={name}
                  onFocus={() =>
                    markFieldInteractedAfterDialogInteraction("name")
                  }
                  onPointerDown={() => markFieldInteracted("name")}
                  onKeyDown={() => markFieldInteracted("name")}
                  onChange={(event) => {
                    setName(event.target.value);
                    setServerError(null);
                  }}
                  onBlur={() => markTouchedAfterUserInteraction("name")}
                  aria-invalid={showError("name")}
                  aria-describedby={nameErrorId}
                  placeholder="Daily standup digest"
                />
                <FieldError
                  id={nameErrorId}
                  message={showError("name") ? validation.name : null}
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor={instructionsId}
                >
                  Instructions
                </label>
                <div className="rounded-md border border-input bg-transparent has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-ring">
                  <Textarea
                    id={instructionsId}
                    value={instructions}
                    onFocus={() =>
                      markFieldInteractedAfterDialogInteraction("instructions")
                    }
                    onPointerDown={() => markFieldInteracted("instructions")}
                    onKeyDown={() => markFieldInteracted("instructions")}
                    onChange={(event) => {
                      setInstructions(event.target.value);
                      setServerError(null);
                    }}
                    onBlur={() =>
                      markTouchedAfterUserInteraction("instructions")
                    }
                    aria-invalid={showError("instructions")}
                    aria-describedby={`${instructionsErrorId} ${permissionsErrorId}`}
                    className="min-h-24 resize-y rounded-b-none border-0 focus-visible:ring-0 md:min-h-32"
                    placeholder="Summarize the latest project updates and call out blockers."
                  />
                  <div
                    data-create-automation-run-context-footer=""
                    className="grid gap-1 border-t border-border bg-surface-recessed px-2 py-1 md:gap-1.5 md:py-1.5"
                  >
                    <div className="flex min-h-7 items-center justify-between gap-2 md:min-h-8">
                      <div
                        aria-describedby={modelErrorId}
                        className="flex min-w-0 flex-1 items-center gap-1"
                      >
                        {providerOptions.length > 0 ||
                        executionOptionsQuery.isLoading ? (
                          <ModelReasoningPicker
                            providerOptions={providerOptions}
                            selectedProviderId={providerId}
                            onSelectedProviderChange={handleProviderChange}
                            hasMultipleProviders={providerOptions.length > 1}
                            modelValue={model}
                            modelOptions={modelOptions}
                            moreModelOptions={moreModelOptions}
                            modelIsLoading={executionOptionsQuery.isLoading}
                            modelLoadFailed={executionOptionsQuery.isError}
                            modelLoadError={
                              executionOptions?.modelLoadError ?? null
                            }
                            onModelChange={handleModelChange}
                            formatModelLabel={formatModelLabel}
                            reasoningValue={MODEL_ONLY_REASONING_VALUE}
                            reasoningOptions={EMPTY_REASONING_OPTIONS}
                            onReasoningChange={() => undefined}
                            fastModeEnabled={false}
                            onFastModeChange={() => undefined}
                            showFastModeToggle={false}
                            muted
                            modal={false}
                            ariaLabel="Provider and model"
                          />
                        ) : (
                          <span
                            className={cn(
                              OPTION_BASE_CLASS_NAME,
                              OPTION_MUTED_CLASS_NAME,
                            )}
                          >
                            No providers available
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon
                            name="Lock"
                            className="size-3.5 shrink-0"
                            aria-hidden
                          />
                          <span className="truncate">Permissions</span>
                        </span>
                        <PermissionModePicker
                          value={permissionMode}
                          options={permissionOptions}
                          onChange={(nextMode) => {
                            setPermissionMode(nextMode);
                            setServerError(null);
                          }}
                          supported={permissionOptions.length > 1}
                          className="h-7"
                          modal={false}
                        />
                        {permissionOptions.length === 1 ? (
                          <span className="rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground">
                            {getPermissionLabel(permissionMode)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex min-h-7 items-center justify-between gap-2 md:min-h-8">
                      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                        <ProjectSelector
                          projects={projectOptions}
                          value={projectId}
                          onChange={(nextProjectId) => {
                            if (nextProjectId) {
                              handleProjectChange(nextProjectId);
                            }
                          }}
                          allowNoProject={false}
                          disabled={sidebarNavigation.isLoading}
                          className="shrink-0"
                          modal={false}
                        />
                        <EnvironmentPickerUI
                          value={environmentValue}
                          onChange={(nextValue) => {
                            setEnvironmentValue(nextValue);
                            markTouched("environment");
                            setServerError(null);
                          }}
                          sources={selectedProject?.sources ?? []}
                          host={primaryHost ?? null}
                          isLocal={
                            primaryHost
                              ? isLocalDaemonHost(primaryHost.id)
                              : true
                          }
                          reuseDisabled={reuseThreadOptions.length === 0}
                          className="shrink-0"
                          muted
                          modal={false}
                        />
                        {parsedEnvironment?.type === "reuse" ? (
                          <WorktreePicker
                            options={reuseThreadOptions}
                            value={selectedReuseEnvironmentId}
                            onChange={(environmentId) => {
                              setEnvironmentValue(
                                encodeReuseValue(environmentId),
                              );
                              markTouched("environment");
                              setServerError(null);
                            }}
                            muted
                            modal={false}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                <FieldError
                  id={instructionsErrorId}
                  message={
                    showError("instructions") ? validation.instructions : null
                  }
                />
                <FieldError
                  id={permissionsErrorId}
                  message={permissionsError}
                />
                <FieldError id={modelErrorId} message={modelSelectionError} />
              </div>

              <section className="grid gap-2.5">
                <div
                  data-create-automation-schedule-layout=""
                  className="grid gap-2.5 md:grid-cols-[minmax(8.5rem,12rem)_minmax(0,1fr)] md:items-start md:gap-3"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">Schedule</h3>
                    <p className="text-pretty text-xs text-muted-foreground">
                      {cadenceLabel}
                    </p>
                  </div>
                  <div
                    data-create-automation-schedule-tabs=""
                    className="grid min-w-0 grid-cols-5 items-center gap-1 [&>div>button]:w-full [&>div>button]:justify-center [&>div]:min-w-0 [&>div]:w-full md:flex md:flex-wrap md:justify-end md:self-start md:[&>div>button]:w-auto md:[&>div>button]:justify-start md:[&>div]:w-auto"
                    role="group"
                    aria-label="Schedule cadence"
                  >
                    {SCHEDULE_CADENCES.map((cadence) => (
                      <TabPill
                        key={cadence.id}
                        label={cadence.label}
                        compactLabel={cadence.compactLabel}
                        title={cadence.title}
                        isActive={scheduleCadence === cadence.id}
                        onSelect={() => handleCadenceSelect(cadence.id)}
                        closeAction={null}
                        labelMaxWidthClass="max-w-none"
                      />
                    ))}
                  </div>
                </div>
                <div
                  data-create-automation-schedule-controls=""
                  data-state={showScheduleControls ? "visible" : "summary"}
                  className="grid min-h-[8.25rem] content-start gap-3 md:min-h-0 md:grid-cols-[minmax(0,1fr)_14rem]"
                >
                  {showScheduleControls ? (
                    <>
                      {showTimeControls ? (
                        <div className="grid gap-2">
                          <label
                            className="text-xs font-medium text-muted-foreground"
                            htmlFor={scheduleTimeId}
                          >
                            At HH:MM
                          </label>
                          <Input
                            id={scheduleTimeId}
                            type="time"
                            value={scheduleTime}
                            onFocus={() =>
                              markFieldInteractedAfterDialogInteraction("time")
                            }
                            onPointerDown={() => markFieldInteracted("time")}
                            onKeyDown={() => markFieldInteracted("time")}
                            onChange={(event) => {
                              setScheduleTime(event.target.value);
                              setServerError(null);
                            }}
                            onBlur={() =>
                              markTouchedAfterUserInteraction("time")
                            }
                            aria-invalid={showError("time")}
                            aria-describedby={scheduleTimeErrorId}
                          />
                          <FieldError
                            id={scheduleTimeErrorId}
                            message={showError("time") ? validation.time : null}
                          />
                        </div>
                      ) : null}
                      {scheduleCadence === "custom" ? (
                        <div className="grid gap-2">
                          <label
                            className="text-xs font-medium text-muted-foreground"
                            htmlFor={cronId}
                          >
                            Cron expression
                          </label>
                          <Input
                            ref={cronInputRef}
                            id={cronId}
                            value={customCron}
                            onFocus={() =>
                              markFieldInteractedAfterDialogInteraction("cron")
                            }
                            onPointerDown={() => markFieldInteracted("cron")}
                            onKeyDown={() => markFieldInteracted("cron")}
                            onChange={(event) => {
                              setCustomCron(event.target.value);
                              setServerError(null);
                            }}
                            onBlur={() =>
                              markTouchedAfterUserInteraction("cron")
                            }
                            aria-invalid={showError("cron")}
                            aria-describedby={cronErrorId}
                            spellCheck={false}
                          />
                          <FieldError
                            id={cronErrorId}
                            message={showError("cron") ? validation.cron : null}
                          />
                        </div>
                      ) : null}
                      {showTimeControls ? (
                        <div className="grid gap-2">
                          <label
                            className="text-xs font-medium text-muted-foreground"
                            htmlFor={timezoneId}
                          >
                            Timezone
                          </label>
                          <TimezonePicker
                            id={timezoneId}
                            value={timezone}
                            options={timezoneOptions}
                            invalid={showError("timezone")}
                            describedBy={timezoneErrorId}
                            onBlur={() =>
                              markTouchedAfterUserInteraction("timezone")
                            }
                            onChange={(nextTimezone) => {
                              setTimezone(nextTimezone);
                              markTouched("timezone");
                              setServerError(null);
                            }}
                          />
                          <FieldError
                            id={timezoneErrorId}
                            message={
                              showError("timezone") ? validation.timezone : null
                            }
                          />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div
                      data-create-automation-hourly-summary=""
                      className="grid h-full min-h-0 gap-2 rounded-md border border-border bg-surface-recessed px-3 py-2.5 text-xs text-muted-foreground"
                    >
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="font-medium text-foreground">
                          Every hour
                        </span>
                        <span className="shrink-0 font-mono tabular-nums">
                          {cron}
                        </span>
                      </div>
                      <p className="text-pretty">
                        Runs at the top of each hour.
                      </p>
                      <div className="flex min-w-0 items-center justify-between gap-3 border-t border-border pt-2">
                        <span>Timezone</span>
                        <span className="min-w-0 truncate text-foreground">
                          {timezone}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div
              ref={bottomSentinelRef}
              aria-hidden
              className="-mt-px h-px w-full opacity-0"
            />
          </div>

          {serverError ? (
            <p role="alert" className="text-sm leading-5 text-destructive">
              {serverError}
            </p>
          ) : null}
          {submitHint ? (
            <p
              id={submitHintId}
              data-create-automation-submit-hint=""
              className="text-xs leading-4 text-muted-foreground"
            >
              {submitHint}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAutomation.isPending}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              aria-describedby={submitHint ? submitHintId : undefined}
              className="w-full md:w-auto"
            >
              {createAutomation.isPending ? "Creating..." : "Create automation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
