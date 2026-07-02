import type { AvailableModel } from "@bb/domain";
import { buildPiAvailableModels } from "../model-list.js";

export async function listPiBridgeModels(): Promise<{
  models: AvailableModel[];
  selectedOnlyModels: AvailableModel[];
}> {
  const [piAiModule, piCodingAgentModule] = await Promise.all([
    import("@mariozechner/pi-ai"),
    import("@mariozechner/pi-coding-agent"),
  ]);

  const authStorage = piCodingAgentModule.AuthStorage.create();
  const modelRegistry = piCodingAgentModule.ModelRegistry.create(authStorage);
  const catalogModels = modelRegistry.getAll();
  const providers = Array.from(
    new Set(catalogModels.map((model) => model.provider)),
  );

  return buildPiAvailableModels({
    providers,
    getModels(provider: string) {
      return catalogModels
        .filter((model) => model.provider === provider)
        .map((model) => ({
          id: model.id,
          input: model.input,
          name: model.name,
          provider: model.provider,
          reasoning: model.reasoning,
          supportsXhigh: piAiModule
            .getSupportedThinkingLevels(model)
            .includes("xhigh"),
        }));
    },
    hasAuth(provider: string) {
      return authStorage.hasAuth(provider);
    },
  });
}
