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
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabPill } from "@/components/ui/tab-pill";
import { PermissionModePicker } from "@/components/pickers/PermissionModePicker";
import { WorktreePicker } from "@/components/pickers/WorktreePicker";
import type { ReuseThreadOption } from "@/components/pickers/WorktreePicker";
import {
  encodeHostValue,
  encodeReuseValue,
  parseEnvironmentValue,
  REUSE_VALUE_WITHOUT_ENVIRONMENT,
} from "@/components/pickers/environment-picker-value";
import {
  OPTION_BASE_CLASS_NAME,
  OPTION_INTERACTIVE_CLASS_NAME,
  OPTION_MUTED_CLASS_NAME,
  OPTION_TRIGGER_CONTENT_CLASS_NAME,
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
  title: string;
}

type WorktreeMode = "local" | "worktree" | "reuse";

interface WorktreeModeOption {
  value: WorktreeMode;
  label: string;
  description: string;
  icon: IconName;
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
  { id: "manual", label: "Manual", title: "Manual" },
  { id: "hourly", label: "Hourly", title: "Hourly" },
  { id: "daily", label: "Daily", title: "Daily" },
  { id: "weekdays", label: "Weekdays", title: "Weekdays" },
  { id: "weekly", label: "Weekly", title: "Weekly" },
  { id: "custom", label: "Custom", title: "Custom" },
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

const WORKTREE_MODE_OPTIONS: readonly WorktreeModeOption[] = [
  {
    value: "local",
    label: "Use project folder",
    description: "Run in the selected folder.",
    icon: "Folder",
  },
  {
    value: "worktree",
    label: "New worktree",
    description: "Create an isolated worktree for each run.",
    icon: "GitBranch",
  },
  {
    value: "reuse",
    label: "Existing worktree",
    description: "Reuse a worktree already known to this project.",
    icon: "GitBranch",
  },
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

const FIELD_ERROR_CLASS_NAME = "min-h-4 text-xs leading-4 text-destructive";
const MODEL_ONLY_REASONING_VALUE: ReasoningLevel = "medium";
const EMPTY_REASONING_OPTIONS: readonly PickerOption<ReasoningLevel>[] = [];
const EMPTY_PROVIDERS: readonly ProviderInfo[] = [];
const EMPTY_MODELS: readonly AvailableModel[] = [];

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

function getWorktreeMode(
  parsedEnvironment: ReturnType<typeof parseEnvironmentValue>,
): WorktreeMode {
  if (parsedEnvironment?.type === "reuse") {
    return "reuse";
  }
  if (
    parsedEnvironment?.type === "host" &&
    parsedEnvironment.mode === "worktree"
  ) {
    return "worktree";
  }
  return "local";
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
  return (
    <p id={id} aria-live="polite" className={FIELD_ERROR_CLASS_NAME}>
      {message ?? ""}
    </p>
  );
}

function ProjectFolderPicker({
  projects,
  value,
  onChange,
  disabled,
}: {
  projects: readonly ProjectOption[];
  value: string;
  onChange: (projectId: string) => void;
  disabled?: boolean;
}) {
  const selectedProject = projects.find((project) => project.id === value);
  const selectedLabel = selectedProject?.name ?? "No folder";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Select folder"
          disabled={disabled}
          className={cn(
            OPTION_BASE_CLASS_NAME,
            OPTION_INTERACTIVE_CLASS_NAME,
            OPTION_MUTED_CLASS_NAME,
            LIST_HOVER_TRANSITION,
            "h-7 max-w-full",
          )}
        >
          <span className={OPTION_TRIGGER_CONTENT_CLASS_NAME}>
            <Icon name="Folder" className="size-3.5 shrink-0" aria-hidden />
            <span className="shrink-0">Select folder</span>
            <span
              className="min-w-0 truncate text-subtle-foreground"
              title={selectedLabel}
            >
              {selectedLabel}
            </span>
          </span>
          <Icon
            name="ChevronDown"
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56"
        mobileTitle="Select folder"
      >
        <DropdownMenuLabel>Folder</DropdownMenuLabel>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => onChange(project.id)}
            className={LIST_HOVER_TRANSITION}
          >
            <Icon
              name="Folder"
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            <span className="min-w-0 truncate">{project.name}</span>
            <Icon
              name="Check"
              className={cn(
                "ml-auto size-4 shrink-0",
                project.id === value ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorktreeModeMenu({
  value,
  onChange,
  disabled,
  reuseDisabled,
}: {
  value: WorktreeMode;
  onChange: (value: WorktreeMode) => void;
  disabled?: boolean;
  reuseDisabled: boolean;
}) {
  const active = value !== "local";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Worktree mode"
          aria-pressed={active}
          disabled={disabled}
          className={cn(
            OPTION_BASE_CLASS_NAME,
            OPTION_INTERACTIVE_CLASS_NAME,
            LIST_HOVER_TRANSITION,
            "h-7 shrink-0",
            active
              ? "bg-state-active text-foreground hover:bg-state-active"
              : OPTION_MUTED_CLASS_NAME,
          )}
        >
          <span className={OPTION_TRIGGER_CONTENT_CLASS_NAME}>
            <Icon name="GitBranch" className="size-3.5 shrink-0" aria-hidden />
            <span>Worktree</span>
          </span>
          <Icon
            name="ChevronDown"
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" mobileTitle="Worktree">
        <DropdownMenuLabel>Worktree</DropdownMenuLabel>
        {WORKTREE_MODE_OPTIONS.map((option) => {
          const disabledOption = option.value === "reuse" && reuseDisabled;
          return (
            <DropdownMenuItem
              key={option.value}
              disabled={disabledOption}
              onSelect={() => {
                if (!disabledOption) {
                  onChange(option.value);
                }
              }}
              className={cn(
                "flex items-start justify-between gap-3 whitespace-normal",
                LIST_HOVER_TRANSITION,
              )}
            >
              <span className="flex min-w-0 items-start gap-2">
                <Icon
                  name={option.icon}
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-xs">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {disabledOption
                      ? "No worktrees in this project yet."
                      : option.description}
                  </span>
                </span>
              </span>
              <Icon
                name="Check"
                className={cn(
                  "size-4 shrink-0",
                  option.value === value ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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
  const nameErrorId = `${nameId}-error`;
  const instructionsErrorId = `${instructionsId}-error`;
  const permissionsErrorId = `${instructionsId}-permissions-error`;
  const scheduleTimeErrorId = `${scheduleTimeId}-error`;
  const cronErrorId = `${cronId}-error`;
  const timezoneErrorId = `${timezoneId}-error`;
  const modelErrorId = `${modelControlId}-error`;
  const cronInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const sidebarNavigation = useSidebarNavigation({ enabled: open });
  const primaryHost = usePrimaryHost({ enabled: open });
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
  const worktreeMode = getWorktreeMode(parsedEnvironment);
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
  const cadenceLabel = useMemo(() => {
    if (scheduleCadence === "manual") {
      return "Runs only when started manually.";
    }
    return formatCronCadence(cron);
  }, [cron, scheduleCadence]);
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

  const markTouched = useCallback((field: FieldKey) => {
    setTouched((current) => {
      const next = new Set(current);
      next.add(field);
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
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

  const handleWorktreeModeChange = useCallback(
    (nextMode: WorktreeMode) => {
      const hostId = primaryHost?.id ?? null;
      if (nextMode === "reuse") {
        setEnvironmentValue(REUSE_VALUE_WITHOUT_ENVIRONMENT);
      } else {
        if (!hostId) {
          return;
        }
        setEnvironmentValue(encodeHostValue(hostId, nextMode));
      }
      markTouched("environment");
      setServerError(null);
    },
    [markTouched, primaryHost?.id],
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
        enabled: scheduleCadence !== "manual",
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
      scheduleCadence,
      timezone,
    ],
  );

  const showError = useCallback(
    (field: FieldKey) => touched.has(field) && validation[field] !== null,
    [touched, validation],
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
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-3xl gap-5 overflow-hidden">
        <DialogHeader>
          <DialogTitle>New automation</DialogTitle>
          <DialogDescription>
            Schedule a bb automation directly, without routing creation through
            chat.
          </DialogDescription>
        </DialogHeader>
        <form className="grid min-h-0 gap-4" onSubmit={handleSubmit}>
          <div className="grid max-h-[min(72vh,42rem)] gap-5 overflow-x-hidden overflow-y-auto pr-1">
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
                onChange={(event) => {
                  setName(event.target.value);
                  setServerError(null);
                }}
                onBlur={() => markTouched("name")}
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
                  onChange={(event) => {
                    setInstructions(event.target.value);
                    setServerError(null);
                  }}
                  onBlur={() => markTouched("instructions")}
                  aria-invalid={showError("instructions")}
                  aria-describedby={`${instructionsErrorId} ${permissionsErrorId}`}
                  className="min-h-32 resize-y rounded-b-none border-0 focus-visible:ring-0"
                  placeholder="Summarize the latest project updates and call out blockers."
                />
                <div className="grid gap-1.5 border-t border-border bg-surface-recessed px-2 py-1.5">
                  <div className="flex min-h-7 items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon
                        name="Lock"
                        className="size-3.5 shrink-0"
                        aria-hidden
                      />
                      <span className="truncate">Ask permissions</span>
                    </span>
                    <div className="flex shrink-0 items-center">
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
                  <div className="flex min-h-7 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                      <ProjectFolderPicker
                        projects={projectOptions}
                        value={projectId}
                        onChange={handleProjectChange}
                        disabled={sidebarNavigation.isLoading}
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
                    <WorktreeModeMenu
                      value={worktreeMode}
                      onChange={handleWorktreeModeChange}
                      disabled={!primaryHost}
                      reuseDisabled={reuseThreadOptions.length === 0}
                    />
                  </div>
                </div>
              </div>
              <FieldError
                id={instructionsErrorId}
                message={
                  showError("instructions") ? validation.instructions : null
                }
              />
              <FieldError id={permissionsErrorId} message={permissionsError} />
            </div>

            <section className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium">Schedule</h3>
                  <p className="text-xs text-muted-foreground">
                    {cadenceLabel}
                  </p>
                </div>
                <div
                  className="flex flex-wrap items-center gap-1"
                  role="group"
                  aria-label="Schedule cadence"
                >
                  {SCHEDULE_CADENCES.map((cadence) => (
                    <TabPill
                      key={cadence.id}
                      label={cadence.label}
                      title={cadence.title}
                      isActive={scheduleCadence === cadence.id}
                      onSelect={() => handleCadenceSelect(cadence.id)}
                      closeAction={null}
                      labelMaxWidthClass="max-w-none"
                    />
                  ))}
                </div>
              </div>
              {showScheduleControls ? (
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
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
                        onChange={(event) => {
                          setScheduleTime(event.target.value);
                          setServerError(null);
                        }}
                        onBlur={() => markTouched("time")}
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
                        onChange={(event) => {
                          setCustomCron(event.target.value);
                          setServerError(null);
                        }}
                        onBlur={() => markTouched("cron")}
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
                        onBlur={() => markTouched("timezone")}
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
                </div>
              ) : null}
            </section>

            <section className="grid gap-3">
              <div>
                <h3 className="text-sm font-medium">Model</h3>
                <p className="text-xs text-muted-foreground">
                  Provider and model for the agent run.
                </p>
              </div>
              <div
                aria-describedby={modelErrorId}
                className="flex min-h-8 flex-wrap items-center gap-2"
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
                    modelLoadError={executionOptions?.modelLoadError ?? null}
                    onModelChange={handleModelChange}
                    formatModelLabel={formatModelLabel}
                    reasoningValue={MODEL_ONLY_REASONING_VALUE}
                    reasoningOptions={EMPTY_REASONING_OPTIONS}
                    onReasoningChange={() => undefined}
                    fastModeEnabled={false}
                    onFastModeChange={() => undefined}
                    showFastModeToggle={false}
                    muted={false}
                    modal={false}
                    ariaLabel="Provider and model"
                  />
                ) : (
                  <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    No providers available
                  </span>
                )}
              </div>
              <FieldError id={modelErrorId} message={modelSelectionError} />
            </section>
          </div>

          <p
            role={serverError ? "alert" : undefined}
            className="min-h-5 text-sm leading-5 text-destructive"
          >
            {serverError ?? ""}
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createAutomation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {createAutomation.isPending ? "Creating..." : "Create automation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
