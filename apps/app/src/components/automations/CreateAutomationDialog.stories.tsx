import { useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  PERSONAL_PROJECT_ID,
  type AvailableModel,
  type Host,
  type ProviderInfo,
  type ReasoningLevel,
} from "@bb/domain";
import type {
  SidebarBootstrapResponse,
  SystemExecutionOptionsResponse,
} from "@bb/server-contract";
import { Button } from "@/components/ui/button";
import {
  automationsQueryKey,
  hostsQueryKey,
  systemExecutionOptionsQueryKey,
} from "@/hooks/queries/query-keys";
import { sidebarNavigationQueryKey } from "@/hooks/queries/sidebar-navigation-query";
import type { PickerOption } from "@/components/pickers/OptionPicker";
import { CreateAutomationDialog } from "./CreateAutomationDialog";
import {
  PROJECT_IDS,
  PROJECT_NAMES,
  STORY_CLAUDE_CODE_MODELS,
  STORY_CLAUDE_REASONING,
  STORY_CODEX_MODELS,
  STORY_CODEX_REASONING,
  STORY_PI_MODELS,
  STORY_PROVIDER_OPTIONS,
  STORY_SERVICE_TIER_SUPPORT,
} from "../../../.ladle/story-fixtures";

export default {
  title: "Automations / Create Dialog",
};

const supportedPermissionModes = [
  "full",
  "workspace-write",
  "readonly",
] as const;

const storyHost: Host = {
  id: "host_story",
  name: "Story host",
  type: "persistent",
  status: "connected",
  lastSeenAt: 0,
  createdAt: 0,
  updatedAt: 0,
};

function makeProviderInfo(
  option: (typeof STORY_PROVIDER_OPTIONS)[number],
): ProviderInfo {
  return {
    id: option.value,
    displayName: option.label,
    available: true,
    composerActions: [],
    capabilities: {
      supportsArchive: true,
      supportsRename: true,
      supportsServiceTier: STORY_SERVICE_TIER_SUPPORT[option.value] ?? false,
      supportsUserQuestion: true,
      supportsFork: true,
      supportedPermissionModes: [...supportedPermissionModes],
    },
  };
}

function makeAvailableModels({
  models,
  reasoningOptions,
}: {
  models: readonly PickerOption<string>[];
  reasoningOptions: readonly PickerOption<ReasoningLevel>[];
}): AvailableModel[] {
  const defaultReasoningEffort =
    reasoningOptions.find((option) => option.value === "medium")?.value ??
    reasoningOptions[0]?.value ??
    "medium";
  const supportedReasoningEfforts = reasoningOptions.map((option) => ({
    reasoningEffort: option.value,
    description: option.label,
  }));
  return models.map((model, index) => ({
    id: model.value,
    model: model.value,
    displayName: model.label,
    description: "",
    supportedReasoningEfforts,
    defaultReasoningEffort,
    isDefault: index === 0,
  }));
}

function makeExecutionOptions(
  providers: readonly ProviderInfo[],
  models: readonly AvailableModel[],
): SystemExecutionOptionsResponse {
  return {
    providers: [...providers],
    models: [...models],
    selectedOnlyModels: [],
    modelLoadError: null,
  };
}

function makeSidebarNavigation(): SidebarBootstrapResponse {
  return {
    folders: [],
    personalProject: {
      id: PERSONAL_PROJECT_ID,
      kind: "personal",
      name: "Personal",
      createdAt: 0,
      updatedAt: 0,
      sources: [],
      threads: [],
      defaultExecutionOptions: null,
    },
    projects: [
      {
        id: PROJECT_IDS.bb,
        kind: "standard",
        name: PROJECT_NAMES.bb,
        createdAt: 0,
        updatedAt: 0,
        sources: [
          {
            id: "src_story_bb",
            projectId: PROJECT_IDS.bb,
            type: "local_path",
            hostId: storyHost.id,
            path: "/repo/bb",
            isDefault: true,
            createdAt: 0,
            updatedAt: 0,
          },
        ],
        threads: [],
        defaultExecutionOptions: null,
      },
    ],
  };
}

function createStoryQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        gcTime: Infinity,
        retry: false,
        staleTime: Infinity,
      },
    },
  });
  const providers = STORY_PROVIDER_OPTIONS.map(makeProviderInfo);
  const codexOptions = makeExecutionOptions(
    providers,
    makeAvailableModels({
      models: STORY_CODEX_MODELS,
      reasoningOptions: STORY_CODEX_REASONING,
    }),
  );
  const executionOptionsByProviderId: Record<
    string,
    SystemExecutionOptionsResponse
  > = {
    codex: codexOptions,
    "claude-code": makeExecutionOptions(
      providers,
      makeAvailableModels({
        models: STORY_CLAUDE_CODE_MODELS,
        reasoningOptions: STORY_CLAUDE_REASONING,
      }),
    ),
    pi: makeExecutionOptions(
      providers,
      makeAvailableModels({
        models: STORY_PI_MODELS,
        reasoningOptions: STORY_CODEX_REASONING,
      }),
    ),
  };

  queryClient.setQueryData(
    sidebarNavigationQueryKey(),
    makeSidebarNavigation(),
  );
  queryClient.setQueryData(hostsQueryKey(), [storyHost]);
  queryClient.setQueryData(automationsQueryKey(), { automations: [] });
  queryClient.setQueryData(
    systemExecutionOptionsQueryKey({ environmentId: null, providerId: null }),
    codexOptions,
  );
  for (const [providerId, executionOptions] of Object.entries(
    executionOptionsByProviderId,
  )) {
    queryClient.setQueryData(
      systemExecutionOptionsQueryKey({ environmentId: null, providerId }),
      executionOptions,
    );
  }
  return queryClient;
}

function StoryProvider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => createStoryQueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function Open() {
  const [open, setOpen] = useState(true);
  return (
    <StoryProvider>
      <div className="flex min-h-screen items-start justify-center bg-background p-8">
        <Button type="button" onClick={() => setOpen(true)}>
          New automation
        </Button>
        <CreateAutomationDialog
          open={open}
          onOpenChange={setOpen}
          defaultProjectId={PROJECT_IDS.bb}
        />
      </div>
    </StoryProvider>
  );
}
