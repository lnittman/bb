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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabPill } from "@/components/ui/tab-pill";
import { ProjectSelector } from "@/components/pickers/ProjectSelector";
import { PermissionModePicker } from "@/components/pickers/PermissionModePicker";
import { EnvironmentPickerUI } from "@/components/pickers/EnvironmentPicker";
import { WorktreePicker } from "@/components/pickers/WorktreePicker";
import type { ReuseThreadOption } from "@/components/pickers/WorktreePicker";
import {
  encodeHostValue,
  encodeReuseValue,
  parseEnvironmentValue,
} from "@/components/pickers/environment-picker-value";
import {
  OptionPicker,
  type PickerOption,
} from "@/components/pickers/OptionPicker";
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
import { useCreateAutomation } from "@/hooks/queries/automation-queries";
import { useSidebarNavigation } from "@/hooks/queries/sidebar-navigation-query";
import { usePrimaryHost } from "@/hooks/queries/host-queries";
import { useSystemExecutionOptions } from "@/hooks/queries/system-queries";
import { useHostDaemon } from "@/hooks/useHostDaemon";

export interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

type AutomationEnvironment = CreateAutomationRequest["environment"];

type FieldKey =
  | "name"
  | "instructions"
  | "cron"
  | "timezone"
  | "environment"
  | "time";

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

const EMPTY_PROVIDERS: readonly ProviderInfo[] = [];
const EMPTY_MODELS: readonly AvailableModel[] = [];

function getDefaultTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? FALLBACK_TIMEZONE;
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
  const cronInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
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
  const selectableModelOptions = useMemo((): PickerOption<string>[] => {
    const seen = new Set<string>();
    return [...modelOptions, ...moreModelOptions].filter((option) => {
      if (seen.has(option.value)) {
        return false;
      }
      seen.add(option.value);
      return true;
    });
  }, [modelOptions, moreModelOptions]);
  const cadenceLabel = useMemo(() => {
    if (scheduleCadence === "manual") {
      return "Runs only when started manually.";
    }
    return formatCronCadence(cron);
  }, [cron, scheduleCadence]);
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

  const handleProviderChange = useCallback((nextProviderId: string) => {
    setProviderId(nextProviderId);
    setModel("");
  }, []);

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
          "cron",
          "timezone",
          "environment",
          "time",
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
          <div className="grid max-h-[min(72vh,42rem)] gap-5 overflow-y-auto pr-1">
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
                placeholder="Daily standup digest"
              />
              {showError("name") ? (
                <p className="text-xs text-destructive">{validation.name}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor={instructionsId}
              >
                Instructions
              </label>
              <Textarea
                id={instructionsId}
                value={instructions}
                onChange={(event) => {
                  setInstructions(event.target.value);
                  setServerError(null);
                }}
                onBlur={() => markTouched("instructions")}
                aria-invalid={showError("instructions")}
                className="min-h-32 resize-y"
                placeholder="Summarize the latest project updates and call out blockers."
              />
              {showError("instructions") ? (
                <p className="text-xs text-destructive">
                  {validation.instructions}
                </p>
              ) : null}
            </div>

            <section className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium">Permissions</h3>
                  <p className="text-xs text-muted-foreground">
                    Ask permissions and choose where bb should work.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PermissionModePicker
                    value={permissionMode}
                    options={permissionOptions}
                    onChange={setPermissionMode}
                    supported={permissionOptions.length > 1}
                    muted={false}
                    modal={false}
                  />
                  {permissionOptions.length === 1 ? (
                    <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                      {getPermissionLabel(permissionMode)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectSelector
                  projects={projectOptions}
                  value={projectId || null}
                  onChange={(nextProjectId) => {
                    const nextId = nextProjectId ?? "";
                    const nextProject = projectOptions.find(
                      (project) => project.id === nextId,
                    );
                    setProjectId(nextId);
                    setEnvironmentValue(
                      getDefaultEnvironmentValue({
                        primaryHostId: primaryHost?.id ?? null,
                        project: nextProject,
                        projectId: nextId,
                      }),
                    );
                    setServerError(null);
                  }}
                  disabled={sidebarNavigation.isLoading}
                  className="min-w-44 justify-between"
                  modal={false}
                />
                <EnvironmentPickerUI
                  value={environmentValue}
                  onChange={(nextValue) => {
                    setEnvironmentValue(nextValue);
                    setServerError(null);
                  }}
                  sources={selectedProject?.sources ?? []}
                  host={primaryHost}
                  isLocal={isLocalDaemonHost(primaryHost?.id)}
                  reuseDisabled={reuseThreadOptions.length === 0}
                  muted={false}
                  modal={false}
                />
                {parsedEnvironment?.type === "reuse" ? (
                  <WorktreePicker
                    options={reuseThreadOptions}
                    value={selectedReuseEnvironmentId}
                    onChange={(environmentId) => {
                      setEnvironmentValue(encodeReuseValue(environmentId));
                      setServerError(null);
                    }}
                    muted={false}
                    modal={false}
                  />
                ) : null}
              </div>
              {validation.project ||
              (showError("environment") && validation.environment) ? (
                <p className="text-xs text-destructive">
                  {validation.project ?? validation.environment}
                </p>
              ) : null}
            </section>

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
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
                {cadenceUsesTime(scheduleCadence) ? (
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
                    />
                    {showError("time") ? (
                      <p className="text-xs text-destructive">
                        {validation.time}
                      </p>
                    ) : null}
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
                      spellCheck={false}
                    />
                    {showError("cron") ? (
                      <p className="text-xs text-destructive">
                        {validation.cron}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor={timezoneId}
                  >
                    Timezone
                  </label>
                  <Input
                    id={timezoneId}
                    value={timezone}
                    onChange={(event) => {
                      setTimezone(event.target.value);
                      setServerError(null);
                    }}
                    onBlur={() => markTouched("timezone")}
                    aria-invalid={showError("timezone")}
                    spellCheck={false}
                  />
                  {showError("timezone") ? (
                    <p className="text-xs text-destructive">
                      {validation.timezone}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="grid gap-3">
              <div>
                <h3 className="text-sm font-medium">Model</h3>
                <p className="text-xs text-muted-foreground">
                  Provider and model for the agent run.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {providerOptions.length > 0 ? (
                  <OptionPicker
                    label="Provider"
                    value={providerId}
                    options={providerOptions}
                    onChange={handleProviderChange}
                    muted={false}
                    modal={false}
                    contentClassName="max-w-72"
                  />
                ) : (
                  <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    {executionOptionsQuery.isLoading
                      ? "Loading providers..."
                      : "No providers available"}
                  </span>
                )}
                {selectableModelOptions.length > 0 && model ? (
                  <OptionPicker
                    label="Model"
                    value={model}
                    options={selectableModelOptions}
                    onChange={setModel}
                    muted={false}
                    modal={false}
                    contentClassName="max-w-80"
                  />
                ) : (
                  <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    {executionOptionsQuery.isLoading
                      ? "Loading models..."
                      : "No models available"}
                  </span>
                )}
              </div>
              {validation.provider || validation.model ? (
                <p className="text-xs text-destructive">
                  {validation.provider ?? validation.model}
                </p>
              ) : null}
            </section>
          </div>

          {serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

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
