import { beforeEach, describe, expect, it, vi } from "vitest";

const getAll = vi.fn();
const getSupportedThinkingLevels = vi.fn();
const hasAuth = vi.fn();
const createAuthStorage = vi.fn(() => ({ hasAuth }));
const createModelRegistry = vi.fn(() => ({ getAll }));

vi.mock("@mariozechner/pi-ai", () => ({
  getSupportedThinkingLevels,
}));

vi.mock("@mariozechner/pi-coding-agent", () => ({
  AuthStorage: {
    create: createAuthStorage,
  },
  ModelRegistry: {
    create: createModelRegistry,
  },
}));

import { listPiBridgeModels } from "../model-list.js";

describe("pi bridge model list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds available models from the Pi SDK and auth storage", async () => {
    hasAuth.mockImplementation((provider: string) => provider !== "openai");
    getAll.mockReturnValue([
      {
        id: "claude-sonnet-4",
        input: ["text", "image"],
        name: "Claude Sonnet 4",
        provider: "anthropic",
        reasoning: true,
      },
      {
        id: "codex-mini",
        input: ["text"],
        name: "Codex Mini",
        provider: "openai",
        reasoning: true,
      },
    ]);
    getSupportedThinkingLevels.mockImplementation(
      (model: { provider: string }) =>
        model.provider === "anthropic"
          ? ["low", "medium", "high", "xhigh"]
          : ["low", "medium", "high"],
    );

    await expect(listPiBridgeModels()).resolves.toEqual({
      models: [
        {
          id: "anthropic/claude-sonnet-4",
          model: "anthropic/claude-sonnet-4",
          displayName: "Claude Sonnet 4",
          description: "Anthropic reasoning, multimodal model via Pi",
          supportedReasoningEfforts: [
            { reasoningEffort: "low", description: "Low reasoning effort" },
            {
              reasoningEffort: "medium",
              description: "Medium reasoning effort",
            },
            { reasoningEffort: "high", description: "High reasoning effort" },
            {
              reasoningEffort: "xhigh",
              description: "Extra high reasoning effort",
            },
          ],
          defaultReasoningEffort: "medium",
          isDefault: true,
        },
      ],
      selectedOnlyModels: [],
    });
  });

  it("surfaces current Kimi K2.7 Code models from the Pi registry", async () => {
    hasAuth.mockReturnValue(true);
    getAll.mockReturnValue([
      {
        id: "k2p7",
        input: ["text", "image"],
        name: "Kimi K2.7 Code",
        provider: "kimi-coding",
        reasoning: true,
      },
      {
        id: "moonshotai/kimi-k2.7-code",
        input: ["text", "image"],
        name: "Kimi K2.7 Code",
        provider: "vercel-ai-gateway",
        reasoning: true,
      },
    ]);
    getSupportedThinkingLevels.mockReturnValue(["low", "medium", "high"]);

    await expect(listPiBridgeModels()).resolves.toMatchObject({
      models: [
        {
          id: "kimi-coding/k2p7",
          model: "kimi-coding/k2p7",
          displayName: "Kimi K2.7 Code",
          supportedReasoningEfforts: [
            expect.objectContaining({ reasoningEffort: "low" }),
            expect.objectContaining({ reasoningEffort: "medium" }),
            expect.objectContaining({ reasoningEffort: "high" }),
          ],
        },
        {
          id: "moonshotai/kimi-k2.7-code",
          model: "moonshotai/kimi-k2.7-code",
          displayName: "Kimi K2.7 Code",
        },
      ],
    });
  });

  it("marks the pi-mono default openai-codex model as default when available", async () => {
    hasAuth.mockReturnValue(true);
    getAll.mockReturnValue([
      {
        id: "gpt-5.5",
        input: ["text", "image"],
        name: "GPT-5.5",
        provider: "openai-codex",
        reasoning: true,
      },
      {
        id: "gpt-5.1",
        input: ["text"],
        name: "GPT-5.1",
        provider: "openai-codex",
        reasoning: true,
      },
    ]);
    getSupportedThinkingLevels.mockReturnValue(["low", "medium", "high"]);

    await expect(listPiBridgeModels()).resolves.toEqual({
      models: [
        {
          id: "openai-codex/gpt-5.5",
          model: "openai-codex/gpt-5.5",
          displayName: "GPT-5.5",
          description: "Openai-codex reasoning, multimodal model via Pi",
          supportedReasoningEfforts: [
            { reasoningEffort: "low", description: "Low reasoning effort" },
            {
              reasoningEffort: "medium",
              description: "Medium reasoning effort",
            },
            { reasoningEffort: "high", description: "High reasoning effort" },
          ],
          defaultReasoningEffort: "medium",
          isDefault: true,
        },
        {
          id: "openai-codex/gpt-5.1",
          model: "openai-codex/gpt-5.1",
          displayName: "GPT-5.1",
          description: "Openai-codex reasoning model via Pi",
          supportedReasoningEfforts: [
            { reasoningEffort: "low", description: "Low reasoning effort" },
            {
              reasoningEffort: "medium",
              description: "Medium reasoning effort",
            },
            { reasoningEffort: "high", description: "High reasoning effort" },
          ],
          defaultReasoningEffort: "medium",
          isDefault: false,
        },
      ],
      selectedOnlyModels: [],
    });
  });
});
