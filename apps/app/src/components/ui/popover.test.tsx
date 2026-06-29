// @vitest-environment jsdom

import type { HTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompactViewportOverrideProvider } from "./hooks/use-compact-viewport";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

vi.mock("./drawer.js", async () => {
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

afterEach(() => {
  cleanup();
});

describe("PopoverContent mobile drawer", () => {
  it("keeps fixed drawer height on the shell and scroll behavior on the body", () => {
    render(
      <CompactViewportOverrideProvider isCompactViewport={true}>
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent
            data-testid="popover-body"
            className="p-0"
            mobileClassName="h-[65dvh] max-h-[65dvh]"
          >
            <div>Row</div>
          </PopoverContent>
        </Popover>
      </CompactViewportOverrideProvider>,
    );

    const drawerContent = screen.getByTestId("drawer-content");
    expect(drawerContent.className).toContain("h-[65dvh]");
    expect(drawerContent.className).toContain("max-h-[65dvh]");

    const popoverBody = screen.getByTestId("popover-body");
    expect(popoverBody.className).toContain("flex-1");
    expect(popoverBody.className).toContain("min-h-0");
    expect(popoverBody.className).toContain("overflow-y-auto");
    expect(popoverBody.className).toContain(
      "pb-[max(1rem,env(safe-area-inset-bottom))]",
    );
  });
});
