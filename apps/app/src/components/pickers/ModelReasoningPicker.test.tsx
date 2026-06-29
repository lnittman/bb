// @vitest-environment jsdom

import type { HTMLAttributes, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AvailableModel, ReasoningLevel } from "@bb/domain";
import type { SystemExecutionOptionsResponse } from "@bb/server-contract";
import { afterEach, describe, expect, it, vi } from "vitest";
import { systemExecutionOptionsQueryKey } from "@/hooks/queries/query-keys";
import { createQueryClientTestHarness } from "@/test/queryClientTestHarness";
import { CompactViewportOverrideProvider } from "@/components/ui/hooks/use-compact-viewport";
import { ModelReasoningPicker } from "./ModelReasoningPicker";
import type { PickerOption } from "./OptionPicker";

vi.mock("@/components/ui/drawer.js", async () => {
  const React = await import("react");

  const Drawer = ({ children }: { children: ReactNode }) =>
    React.createElement("div", { "data-testid": "drawer" }, children);
  const DrawerContent = React.forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) =>
    React.createElement(
      "div",
      { ...props, ref, "data-testid": "drawer-content" },
      children,
    ),
  );
  DrawerContent.displayName = "MockDrawerContent";
  const DrawerTitle = ({
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) =>
    React.createElement("h2", props, children);

  return { Drawer, DrawerContent, DrawerTitle };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getSystemExecutionOptions: vi.fn(),
  };
});

const providerOptions: readonly PickerOption<string>[] = [
  { value: "codex", label: "Codex" },
  { value: "claude-code", label: "Claude Code" },
  { value: "pi", label: "Pi" },
];

const codexModels: readonly PickerOption<string>[] = [
  { value: "gpt-5.5", label: "GPT-5.5" },
];

const reasoningOptions: readonly PickerOption<ReasoningLevel>[] = [
  { value: "medium", label: "Medium" },
];

function availableModel({
  value,
  label,
  isDefault = false,
}: {
  value: string;
  label: string;
  isDefault?: boolean;
}): AvailableModel {
  return {
    id: value,
    model: value,
    displayName: label,
    description: "",
    supportedReasoningEfforts: [
      { reasoningEffort: "medium", description: "Medium" },
    ],
    defaultReasoningEffort: "medium",
    isDefault,
  };
}

function executionOptions({
  models,
  selectedOnlyModels = [],
}: {
  models: AvailableModel[];
  selectedOnlyModels?: AvailableModel[];
}): SystemExecutionOptionsResponse {
  return {
    providers: [],
    models,
    selectedOnlyModels,
    modelLoadError: null,
  };
}

function renderPicker({
  onSelectedProviderChange = vi.fn(),
  onModelChange = vi.fn(),
  moreModelOptions = [],
  defaultOpen = false,
  isCompactViewport,
}: {
  onSelectedProviderChange?: (value: string) => void;
  onModelChange?: (value: string) => void;
  moreModelOptions?: readonly PickerOption<string>[];
  defaultOpen?: boolean;
  isCompactViewport?: boolean;
} = {}) {
  const { queryClient, wrapper } = createQueryClientTestHarness();
  queryClient.setQueryData(
    systemExecutionOptionsQueryKey({
      environmentId: null,
      providerId: "claude-code",
    }),
    executionOptions({
      models: [
        availableModel({
          value: "claude-opus-4-7",
          label: "Claude Opus 4.7",
          isDefault: true,
        }),
      ],
    }),
  );
  queryClient.setQueryData(
    systemExecutionOptionsQueryKey({
      environmentId: null,
      providerId: "pi",
    }),
    executionOptions({
      models: [
        availableModel({
          value: "kimi-k2",
          label: "Kimi K2",
          isDefault: true,
        }),
      ],
    }),
  );

  const picker = (
    <ModelReasoningPicker
      providerOptions={providerOptions}
      selectedProviderId="codex"
      onSelectedProviderChange={onSelectedProviderChange}
      hasMultipleProviders
      modelValue="gpt-5.5"
      modelOptions={codexModels}
      moreModelOptions={moreModelOptions}
      onModelChange={onModelChange}
      reasoningValue="medium"
      reasoningOptions={reasoningOptions}
      onReasoningChange={vi.fn()}
      fastModeEnabled={false}
      onFastModeChange={vi.fn()}
      showFastModeToggle={false}
      defaultOpen={defaultOpen}
      modal={false}
    />
  );

  render(
    isCompactViewport === undefined ? (
      picker
    ) : (
      <CompactViewportOverrideProvider isCompactViewport={isCompactViewport}>
        {picker}
      </CompactViewportOverrideProvider>
    ),
    { wrapper },
  );

  return { onSelectedProviderChange, onModelChange };
}

function getModelListElement(): HTMLElement {
  const label = screen.getAllByText("Model").find((element) => {
    return (
      element instanceof HTMLElement && element.className.includes("sticky")
    );
  });

  if (
    !(label instanceof HTMLElement) ||
    !(label.parentElement instanceof HTMLElement)
  ) {
    throw new Error("Could not find the model list container");
  }

  return label.parentElement;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ModelReasoningPicker", () => {
  it("previews another provider's models without committing the provider", async () => {
    const { onSelectedProviderChange, onModelChange } = renderPicker();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Provider, model and reasoning",
      }),
    );
    expect(screen.getAllByText("5.5")).toHaveLength(2);

    fireEvent.click(screen.getByTitle("Claude Code"));

    expect(await screen.findByText("Opus 4.7")).not.toBeNull();
    expect(screen.getAllByText("5.5")).toHaveLength(1);
    expect(onSelectedProviderChange).not.toHaveBeenCalled();
    expect(onModelChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Opus 4.7"));

    expect(onSelectedProviderChange).toHaveBeenCalledWith("claude-code");
    expect(onModelChange).toHaveBeenCalledWith("claude-opus-4-7");
  });

  it("opens selected-only models in a desktop submenu", async () => {
    const { onModelChange } = renderPicker({
      moreModelOptions: [{ value: "gpt-5.2", label: "GPT-5.2" }],
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Provider, model and reasoning",
      }),
    );
    fireEvent.pointerEnter(screen.getByText("More models"));

    fireEvent.click(await screen.findByText("5.2"));

    expect(onModelChange).toHaveBeenCalledWith("gpt-5.2");
  });

  it("keeps the compact sheet height and model-list scroll area stable across provider tabs", async () => {
    renderPicker({ defaultOpen: true, isCompactViewport: true });

    const drawerContent = screen.getByTestId("drawer-content");
    expect(drawerContent.className).toContain("h-[65dvh]");
    expect(drawerContent.className).toContain("min-h-[22rem]");
    expect(drawerContent.className).toContain("max-h-[85dvh]");
    const drawerClassName = drawerContent.className;

    const modelList = getModelListElement();
    expect(modelList.className).toContain("flex-1");
    expect(modelList.className).toContain("min-h-0");
    expect(modelList.className).toContain("overflow-y-auto");
    expect(modelList.className).not.toContain("max-h-[min(250px");
    const modelListClassName = modelList.className;

    for (const providerLabel of ["Codex", "Claude Code", "Pi"]) {
      const tab = screen.getByTitle(providerLabel);
      expect(tab.className).toContain("max-md:pointer-coarse:h-11");
      expect(tab.className).toContain("max-md:pointer-coarse:w-11");
    }
    expect(screen.getByRole("button", { name: "5.5" }).className).toContain(
      "max-md:pointer-coarse:min-h-11",
    );

    fireEvent.click(screen.getByTitle("Claude Code"));

    expect(await screen.findByText("Opus 4.7")).not.toBeNull();
    expect(screen.getByTestId("drawer-content").className).toBe(
      drawerClassName,
    );
    expect(getModelListElement().className).toBe(modelListClassName);

    fireEvent.click(screen.getByTitle("Pi"));

    expect(await screen.findByText("Kimi K2")).not.toBeNull();
    expect(screen.getByTestId("drawer-content").className).toBe(
      drawerClassName,
    );
    expect(getModelListElement().className).toBe(modelListClassName);
  });

  it("keeps the desktop model list on the existing popover height cap", () => {
    renderPicker({ defaultOpen: true, isCompactViewport: false });

    const modelList = getModelListElement();
    expect(modelList.className).toContain("overflow-y-auto");
    expect(modelList.className).toContain(
      "max-h-[min(250px,var(--radix-popover-content-available-height,250px)-80px)]",
    );
    expect(modelList.className).not.toContain("flex-1");
    expect(screen.queryByTestId("drawer-content")).toBeNull();
  });
});
