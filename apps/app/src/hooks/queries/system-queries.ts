import { useQuery } from "@tanstack/react-query";
import {
  listBuiltInAgentProviderInfos,
  listClaudeCodeFallbackModels,
} from "@bb/agent-providers";
import { toRecord } from "@bb/core-ui";
import { permissionModeValues, type PermissionMode } from "@bb/domain";
import type {
  SystemCliSkillsStatusResponse,
  SystemConfigResponse,
  SystemExecutionOptionsResponse,
  OnboardingAgentOverview,
  SystemVersionResponse,
} from "@bb/server-contract";
import type {
  DiscoverReposResult,
  ProviderCliStatusResponse,
} from "@bb/host-daemon-contract";
import type { ProviderUsageResponse } from "@bb/host-daemon-contract";
import { BbHttpError, sdk } from "@/lib/sdk";
import {
  modelCatalogCacheKey,
  readCachedModelCatalog,
  writeCachedModelCatalog,
} from "@/lib/model-catalog-cache";
import {
  providerListCacheKey,
  readCachedProviderList,
  writeCachedProviderList,
} from "@/lib/provider-list-cache";
import { useSystemRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  hostProviderCliStatusQueryKey,
  systemCliSkillsQueryKey,
  onboardingAgentsQueryKey,
  onboardingReposQueryKey,
  systemConfigQueryKey,
  systemExecutionOptionsQueryKey,
  systemUsageLimitsQueryKey,
  systemVersionQueryKey,
} from "./query-keys";
import { requireEnabledQueryArg } from "./query-helpers";
import {
  FOCUS_OWNED_LIVE_QUERY_POLICY,
  SERVER_SESSION_QUERY_POLICY,
  SESSION_STATIC_QUERY_POLICY,
} from "./query-policies";

export interface UseSystemExecutionOptionsArgs {
  enabled?: boolean;
  environmentId?: string;
  hostId?: string;
  providerId?: string;
}

export interface UseOnboardingAgentsOptions extends QueryOptions {
  environmentId?: string;
  hostId?: string;
  poll?: boolean;
}

interface QueryOptions {
  enabled?: boolean;
}

const SYSTEM_EXECUTION_OPTIONS_RETRY_DELAY_MS = 250;
const SYSTEM_EXECUTION_OPTIONS_RETRY_COUNT = 1;
const CLAUDE_CODE_PROVIDER_ID = "claude-code";

// Model probes run on the host (Claude's spawns a CLI process; every provider
// pays a round trip), so waiting for one leaves the composer with no model list
// for seconds on each full load. Render the last catalog this routing actually
// reported immediately and let the authoritative rows replace it when the probe
// lands: its ids match what the fresh probe will return, so a selection made
// during the preload window survives instead of snapping back to a default.
//
// On a cold cache only Claude Code has curated aliases to fall back on; other
// providers wait for the probe, exactly as before.
//
// The provider list rides along from its own last-known cache: the live list
// carries the host's custom and installed ACP agents, so replaying only the
// built-in providers would select the first built-in one for a beat whenever
// the remembered provider is not built in. If the remembered provider is not
// in the list we can replay, there is no honest provisional frame and the
// composer waits, as it did before.
//
// Callers must gate model recovery on `isPlaceholderData` either way: a cached
// catalog can be stale, so absence from this list is not evidence that a stored
// model was retired.
//
// The placeholder's permission ceiling is the most restrictive mode. Consumers
// ignore the ceiling while data is provisional, so the value is never used —
// but a replay must fail safe if a future reader forgets that gate.
const PLACEHOLDER_PERMISSION_CEILING: PermissionMode = permissionModeValues[0];

function placeholderExecutionOptions({
  cacheKey,
  providerCacheKey,
  providersCacheKey,
  providerId,
}: {
  cacheKey: string;
  providerCacheKey: string | null;
  providersCacheKey: string;
  providerId: string | null;
}): SystemExecutionOptionsResponse | undefined {
  // The routed key is exact; the provider key holds the latest verified
  // catalog for the provider from any routing. A composer can mount before its
  // environment is known (a thread page still loading), so its first key may
  // never have been fetched to completion — the provider's latest catalog is a
  // fine provisional stand-in for that frame.
  const cached =
    readCachedModelCatalog(cacheKey) ??
    (providerCacheKey === null
      ? null
      : readCachedModelCatalog(providerCacheKey));
  if (cached === null && providerId !== CLAUDE_CODE_PROVIDER_ID) {
    return undefined;
  }
  const remembered = readCachedProviderList(providersCacheKey);
  const providers =
    remembered !== null && remembered.length > 0
      ? remembered
      : listBuiltInAgentProviderInfos();
  if (
    providerId !== null &&
    !providers.some((provider) => provider.id === providerId)
  ) {
    return undefined;
  }
  return {
    providers,
    models: cached?.models ?? listClaudeCodeFallbackModels(),
    selectedOnlyModels: cached?.selectedOnlyModels ?? [],
    permissionCeiling: PLACEHOLDER_PERMISSION_CEILING,
    modelLoadError: null,
  };
}

function isAbortLikeError(error: unknown): boolean {
  return toRecord(error)?.name === "AbortError";
}

function shouldRetrySystemExecutionOptions(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= SYSTEM_EXECUTION_OPTIONS_RETRY_COUNT) {
    return false;
  }

  if (isAbortLikeError(error)) {
    return false;
  }

  if (error instanceof BbHttpError) {
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }

  return true;
}

export function useSystemExecutionOptions(
  args: UseSystemExecutionOptionsArgs = {},
) {
  const environmentId = args.environmentId ?? null;
  const hostId = args.hostId ?? null;
  const providerId = args.providerId ?? null;
  const enabled = args.enabled ?? true;
  useSystemRealtimeSubscription({ enabled });
  const providersCacheKey = providerListCacheKey({ environmentId, hostId });
  const catalogCacheKey = modelCatalogCacheKey({
    environmentId,
    hostId,
    providerId,
  });
  const providerCatalogCacheKey =
    providerId === null
      ? null
      : modelCatalogCacheKey({ environmentId: null, hostId: null, providerId });

  return useQuery<SystemExecutionOptionsResponse>({
    queryKey: systemExecutionOptionsQueryKey({
      environmentId,
      hostId,
      providerId,
    }),
    queryFn: async ({ signal }) => {
      const response = await sdk.system.executionOptions({
        environmentId: args.environmentId,
        hostId: args.hostId,
        providerId: args.providerId,
        signal,
      });
      // The provider list is authoritative whether or not the model probe
      // succeeded. Only a verified catalog is worth remembering, though:
      // caching a provisional list would let the server's probe-failure
      // fallback masquerade as this routing's real models on the next cold
      // load.
      writeCachedProviderList(providersCacheKey, response.providers);
      if (response.modelLoadError === null) {
        const catalog = {
          models: response.models,
          selectedOnlyModels: response.selectedOnlyModels,
        };
        writeCachedModelCatalog(catalogCacheKey, catalog);
        if (providerCatalogCacheKey !== null) {
          writeCachedModelCatalog(providerCatalogCacheKey, catalog);
        }
      }
      return response;
    },
    enabled,
    staleTime: 60_000,
    retry: shouldRetrySystemExecutionOptions,
    retryDelay: SYSTEM_EXECUTION_OPTIONS_RETRY_DELAY_MS,
    placeholderData: () =>
      placeholderExecutionOptions({
        cacheKey: catalogCacheKey,
        providerCacheKey: providerCatalogCacheKey,
        providersCacheKey,
        providerId,
      }),
  });
}

export function useSystemConfig(options?: QueryOptions) {
  const enabled = options?.enabled ?? true;
  useSystemRealtimeSubscription({ enabled });

  return useQuery<SystemConfigResponse>({
    queryKey: systemConfigQueryKey(),
    queryFn: ({ signal }) => sdk.system.config({ signal }),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Per-machine install state of bb's built-in CLI skills. Each read asks every
 * enrolled machine's daemon, so it is fetched on demand (the settings section)
 * rather than kept fresh in the background.
 */
export function useCliSkillsStatus(options?: QueryOptions) {
  return useQuery<SystemCliSkillsStatusResponse>({
    queryKey: systemCliSkillsQueryKey(),
    queryFn: ({ signal }) => sdk.system.cliSkillsStatus({ signal }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useSystemVersion(options?: QueryOptions) {
  return useQuery<SystemVersionResponse>({
    queryKey: systemVersionQueryKey(),
    queryFn: ({ signal }) => sdk.system.version({ signal }),
    enabled: options?.enabled ?? true,
    ...SERVER_SESSION_QUERY_POLICY,
  });
}

export interface UseHostProviderCliStatusArgs {
  hostId: string | null;
  enabled?: boolean;
}

export function useHostProviderCliStatus({
  hostId,
  enabled,
}: UseHostProviderCliStatusArgs) {
  return useQuery<ProviderCliStatusResponse>({
    queryKey: hostProviderCliStatusQueryKey(hostId),
    queryFn: ({ signal }) =>
      sdk.hosts.providerCliStatus({
        hostId: requireEnabledQueryArg({
          value: hostId,
          hookName: "useHostProviderCliStatus",
          argName: "hostId",
        }),
        signal,
      }),
    enabled: (enabled ?? true) && hostId !== null,
    ...SESSION_STATIC_QUERY_POLICY,
  });
}

/**
 * Live agent state for onboarding. Polled while the step is open so installing
 * or signing in from a terminal updates the list without a manual refresh.
 */
export function useOnboardingAgents(options: UseOnboardingAgentsOptions = {}) {
  const environmentId = options.environmentId ?? null;
  const hostId = options.hostId ?? null;
  return useQuery<OnboardingAgentOverview>({
    queryKey: onboardingAgentsQueryKey({ environmentId, hostId }),
    queryFn: ({ signal }) =>
      sdk.system.onboardingAgents({
        environmentId: options.environmentId,
        hostId: options.hostId,
        signal,
      }),
    enabled: options.enabled ?? true,
    // Each read runs CLI health checks, known-agent checks, and up to three
    // provider usage requests, so this polls slowly and only while the agents
    // step is actually on screen. An explicit re-check covers the impatient
    // case. Other readers (the composer's provider default) want one answer.
    ...(options.poll === false
      ? { staleTime: 60_000 }
      : { refetchInterval: 15_000 }),
  });
}

/** Candidate projects on the host. Runs once when the projects step opens. */
export function useOnboardingRepos(options: QueryOptions = {}) {
  return useQuery<DiscoverReposResult>({
    queryKey: onboardingReposQueryKey(),
    queryFn: ({ signal }) => sdk.system.onboardingRepos({ signal }),
    enabled: options.enabled ?? true,
    staleTime: Infinity,
  });
}

export interface UseSystemUsageLimitsArgs extends QueryOptions {
  hostId?: string;
}

export function useSystemUsageLimits(args: UseSystemUsageLimitsArgs = {}) {
  const hostId = args.hostId ?? null;
  return useQuery<ProviderUsageResponse>({
    queryKey: systemUsageLimitsQueryKey(hostId),
    queryFn: ({ signal }) =>
      sdk.system.usageLimits({
        ...(args.hostId === undefined ? {} : { hostId: args.hostId }),
        signal,
      }),
    enabled: args.enabled ?? true,
    ...FOCUS_OWNED_LIVE_QUERY_POLICY,
  });
}
