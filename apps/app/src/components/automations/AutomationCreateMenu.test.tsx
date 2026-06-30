// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CREATE_LOOP_PROMPT } from "@/components/promptbox/PromptBoxActionsMenu";
import { AutomationCreateMenu } from "./AutomationCreateMenu";

vi.mock("./CreateAutomationDialog", () => ({
  CreateAutomationDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="New automation">
        <button type="button" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
    ) : null,
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <div
      data-testid="location"
      data-pathname={location.pathname}
      data-state={JSON.stringify(location.state)}
    />
  );
}

function renderMenu() {
  render(
    <MemoryRouter initialEntries={["/automations"]}>
      <AutomationCreateMenu defaultProjectId="proj_bb" />
      <LocationProbe />
    </MemoryRouter>,
  );
}

async function openCreateMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: "Create" }), {
    button: 0,
  });
  return screen.findByRole("menuitem", { name: "Create via chat" });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AutomationCreateMenu", () => {
  it("offers chat and manual creation options", async () => {
    renderMenu();

    await openCreateMenu();

    expect(
      screen.getByRole("menuitem", { name: "Create via chat" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("menuitem", { name: "Create manually" }),
    ).not.toBeNull();
  });

  it("navigates chat creation to the preloaded loop composer", async () => {
    renderMenu();

    await openCreateMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Create via chat" }));

    const location = screen.getByTestId("location");
    expect(location.getAttribute("data-pathname")).toBe("/");
    expect(JSON.parse(location.getAttribute("data-state") ?? "{}")).toEqual({
      focusPrompt: true,
      initialPrompt: CREATE_LOOP_PROMPT,
    });
  });

  it("opens the manual create dialog", async () => {
    renderMenu();

    await openCreateMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Create manually" }));

    expect(
      screen.getByRole("dialog", { name: "New automation" }),
    ).not.toBeNull();
  });
});
