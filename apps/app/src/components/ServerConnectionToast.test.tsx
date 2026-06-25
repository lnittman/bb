// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useServerConnectionState", () => ({
  useServerConnectionState: vi.fn(),
}));
vi.mock("@/components/ui/app-toast", () => ({
  appToast: { loading: vi.fn(), dismiss: vi.fn(), success: vi.fn() },
}));

import { ServerConnectionToast } from "./ServerConnectionToast";
import { useServerConnectionState } from "@/hooks/useServerConnectionState";
import { appToast } from "@/components/ui/app-toast";

const mockState = vi.mocked(useServerConnectionState);
const toast = vi.mocked(appToast);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("ServerConnectionToast", () => {
  it("shows one persistent loading toast after a sustained reconnect", () => {
    vi.useFakeTimers();
    mockState.mockReturnValue("reconnecting");
    render(<ServerConnectionToast />);

    // Debounced: nothing yet.
    expect(toast.loading).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(toast.loading).toHaveBeenCalledTimes(1);
    expect(toast.loading).toHaveBeenCalledWith("Reconnecting…", {
      id: "server-connection",
    });
  });

  it("dismisses and confirms once reconnected", () => {
    vi.useFakeTimers();
    mockState.mockReturnValue("reconnecting");
    const { rerender } = render(<ServerConnectionToast />);
    act(() => {
      vi.advanceTimersByTime(800);
    });

    mockState.mockReturnValue("connected");
    act(() => {
      rerender(<ServerConnectionToast />);
    });

    expect(toast.dismiss).toHaveBeenCalledWith("server-connection");
    expect(toast.success).toHaveBeenCalledWith("Reconnected", {
      duration: 2000,
    });
  });

  it("stays silent for a brief blip that recovers before the debounce", () => {
    vi.useFakeTimers();
    mockState.mockReturnValue("reconnecting");
    const { rerender } = render(<ServerConnectionToast />);

    // Recover before the debounce elapses. The state change flushes the effect
    // cleanup (clearing the pending timer) first; only then do we let time pass.
    mockState.mockReturnValue("connected");
    act(() => {
      rerender(<ServerConnectionToast />);
    });
    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(toast.loading).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
