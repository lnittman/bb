export interface RootComposeAutomationDraftState {
  source: "create-via-chat";
}

export interface AutomationDraftRootComposeState {
  automationDraft: RootComposeAutomationDraftState;
  focusPrompt: true;
  initialPrompt: string;
  replacePrompt?: true;
}

export function buildAutomationDraftRootComposeState({
  initialPrompt,
  replacePrompt = false,
}: {
  initialPrompt: string;
  replacePrompt?: boolean;
}): AutomationDraftRootComposeState {
  return {
    automationDraft: { source: "create-via-chat" },
    focusPrompt: true,
    initialPrompt,
    ...(replacePrompt ? { replacePrompt: true } : {}),
  };
}

export function readAutomationDraftFromLocationState(
  state: unknown,
): RootComposeAutomationDraftState | null {
  if (!state || typeof state !== "object") return null;
  const candidate = (state as { automationDraft?: unknown }).automationDraft;
  if (!candidate || typeof candidate !== "object") return null;
  return (candidate as { source?: unknown }).source === "create-via-chat"
    ? { source: "create-via-chat" }
    : null;
}
