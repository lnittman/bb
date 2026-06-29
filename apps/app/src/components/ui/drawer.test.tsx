// @vitest-environment jsdom

import type { HTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DrawerContent } from "./drawer";

vi.mock("vaul", async () => {
  const React = await import("react");

  const Root = ({ children }: { children: ReactNode }) =>
    React.createElement("div", null, children);
  const Trigger = React.forwardRef<
    HTMLButtonElement,
    HTMLAttributes<HTMLButtonElement>
  >((props, ref) => React.createElement("button", { ...props, ref }));
  Trigger.displayName = "MockDrawerTrigger";
  const Portal = ({ children }: { children: ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  const Close = React.forwardRef<
    HTMLButtonElement,
    HTMLAttributes<HTMLButtonElement>
  >((props, ref) => React.createElement("button", { ...props, ref }));
  Close.displayName = "MockDrawerClose";
  const Overlay = React.forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
  >((props, ref) =>
    React.createElement("div", {
      ...props,
      ref,
      "data-testid": "drawer-overlay",
    }),
  );
  Overlay.displayName = "MockDrawerOverlay";
  const Content = React.forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) =>
    React.createElement(
      "div",
      { ...props, ref, "data-testid": "drawer-content" },
      children,
    ),
  );
  Content.displayName = "MockDrawerContent";
  const Handle = React.forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
  >(({ children, ...props }, ref) =>
    React.createElement(
      "div",
      { ...props, ref, "data-testid": "drawer-handle" },
      React.createElement("span", {
        "aria-hidden": "true",
        "data-vaul-handle-hitarea": "",
      }),
      children,
    ),
  );
  Handle.displayName = "MockDrawerHandle";
  const Title = React.forwardRef<
    HTMLHeadingElement,
    HTMLAttributes<HTMLHeadingElement>
  >((props, ref) => React.createElement("h2", { ...props, ref }));
  Title.displayName = "MockDrawerTitle";
  const Description = React.forwardRef<
    HTMLParagraphElement,
    HTMLAttributes<HTMLParagraphElement>
  >((props, ref) => React.createElement("p", { ...props, ref }));
  Description.displayName = "MockDrawerDescription";

  return {
    Drawer: {
      Root,
      Trigger,
      Portal,
      Close,
      Overlay,
      Content,
      Handle,
      Title,
      Description,
    },
  };
});

afterEach(() => {
  cleanup();
});

describe("DrawerContent", () => {
  it("keeps the handle visually compact while preserving a 44px hit area", () => {
    render(
      <DrawerContent>
        <div>Body</div>
      </DrawerContent>,
    );

    const handleClassName = screen.getByTestId("drawer-handle").className;
    expect(handleClassName).toContain("h-1");
    expect(handleClassName).toContain("w-10");
    expect(handleClassName).toContain("[&_[data-vaul-handle-hitarea]]:h-11");
    expect(handleClassName).toContain("[&_[data-vaul-handle-hitarea]]:w-16");
  });
});
