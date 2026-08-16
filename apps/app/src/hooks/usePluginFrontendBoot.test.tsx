// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resetPluginFrontendBootStateForTest,
  usePluginFrontendsSettled,
} from "../lib/plugin-frontend-boot-state";
import {
  PLUGIN_FRONTEND_SETTLE_FLOOR_MS,
  usePluginFrontendBoot,
} from "./usePluginFrontendBoot";

// System config never resolves in this test: the boot must not wait forever.
vi.mock("./queries/system-queries", () => ({
  useSystemConfig: () => ({ data: undefined }),
}));
vi.mock("../lib/plugin-frontend-lazy", () => ({
  bootPluginFrontends: vi.fn(async () => {}),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  resetPluginFrontendBootStateForTest();
});

describe("usePluginFrontendBoot", () => {
  it("settles after the floor even when system config never resolves", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => {
      usePluginFrontendBoot();
      return usePluginFrontendsSettled();
    });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(PLUGIN_FRONTEND_SETTLE_FLOOR_MS - 1));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });
});
