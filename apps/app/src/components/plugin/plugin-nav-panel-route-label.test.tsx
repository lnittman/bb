// @vitest-environment jsdom
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNavPanelRouteLabel } from "@/lib/plugin-nav-panel-route-label-hook";
import {
  PluginNavPanelMountContext,
  resetPluginNavPanelRouteLabelsForTest,
  usePluginNavPanelRouteLabel,
} from "./plugin-nav-panel-route-label";
import {
  PluginSlotMount,
  resetAllCrashedPluginSlotsForTest,
} from "./PluginSlotMount";
import { PluginContext } from "./plugin-context";

const MOUNT = { pluginId: "tasks", panelId: "tasks", subPath: "task/TSK-4" };

function Publisher({ label }: { label: string | null | undefined }) {
  useNavPanelRouteLabel(label);
  return null;
}

afterEach(() => {
  cleanup();
  resetPluginNavPanelRouteLabelsForTest();
  resetAllCrashedPluginSlotsForTest();
});

describe("nav panel route label", () => {
  it("publishes for its own panel and subPath, follows updates, and clears on unmount", () => {
    const reader = renderHook(() => usePluginNavPanelRouteLabel(MOUNT));
    const other = renderHook(() =>
      usePluginNavPanelRouteLabel({ ...MOUNT, subPath: "all" }),
    );
    const publisher = render(
      <PluginNavPanelMountContext.Provider value={MOUNT}>
        <Publisher label="TSK-4 · Fix reconnect handling" />
      </PluginNavPanelMountContext.Provider>,
    );
    expect(reader.result.current).toBe("TSK-4 · Fix reconnect handling");
    expect(other.result.current).toBeNull();

    publisher.rerender(
      <PluginNavPanelMountContext.Provider value={MOUNT}>
        <Publisher label={undefined} />
      </PluginNavPanelMountContext.Provider>,
    );
    expect(reader.result.current).toBeNull();

    publisher.rerender(
      <PluginNavPanelMountContext.Provider value={MOUNT}>
        <Publisher label="TSK-4 · Renamed" />
      </PluginNavPanelMountContext.Provider>,
    );
    expect(reader.result.current).toBe("TSK-4 · Renamed");
    publisher.unmount();
    expect(reader.result.current).toBeNull();
  });

  it("clears the label the moment the publishing slot crashes", () => {
    let explode = false;
    function Crashable() {
      useNavPanelRouteLabel("TSK-4 · Live");
      if (explode) throw new Error("slot exploded");
      return null;
    }
    const reader = renderHook(() => usePluginNavPanelRouteLabel(MOUNT));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const view = render(
      <PluginContext.Provider value="tasks">
        <PluginSlotMount pluginId="tasks" slotKind="navPanel" slotId="tasks">
          <PluginNavPanelMountContext.Provider value={MOUNT}>
            <Crashable />
          </PluginNavPanelMountContext.Provider>
        </PluginSlotMount>
      </PluginContext.Provider>,
    );
    expect(reader.result.current).toBe("TSK-4 · Live");
    explode = true;
    act(() => {
      view.rerender(
        <PluginContext.Provider value="tasks">
          <PluginSlotMount pluginId="tasks" slotKind="navPanel" slotId="tasks">
            <PluginNavPanelMountContext.Provider value={{ ...MOUNT }}>
              <Crashable />
            </PluginNavPanelMountContext.Provider>
          </PluginSlotMount>
        </PluginContext.Provider>,
      );
    });
    expect(reader.result.current).toBeNull();
    errorSpy.mockRestore();
  });

  it("refuses to run outside a nav panel", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Publisher label="x" />)).toThrow(
      /only be used inside a navPanel component/,
    );
    errorSpy.mockRestore();
  });
});
