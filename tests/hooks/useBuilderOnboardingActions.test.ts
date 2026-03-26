import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { starters } from "@/lib/builder";
import { useBuilderOnboardingActions } from "@/hooks/useBuilderOnboardingActions";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

function createDeps() {
  return {
    store: {
      beginRun: vi.fn(),
    },
    ui: {
      onboardingModalStarter: null as keyof typeof starters | null,
      onboardingNickname: "",
      setOnboardingModalStarter: vi.fn(),
      setOnboardingNickname: vi.fn(),
      setOnboardingSelection: vi.fn(),
      resetOnboardingState: vi.fn(),
    },
  };
}

describe("useBuilderOnboardingActions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    replace.mockReset();
  });

  it("opens the starter confirm modal and clears nickname draft", () => {
    const deps = createDeps();
    const { result } = renderHook(() => useBuilderOnboardingActions(deps as never));

    act(() => {
      result.current.openStarterConfirm("snivy");
    });

    expect(deps.ui.setOnboardingModalStarter).toHaveBeenCalledWith("snivy");
    expect(deps.ui.setOnboardingNickname).toHaveBeenCalledWith("");
  });

  it("cancels the starter confirm modal", () => {
    const deps = createDeps();
    const { result } = renderHook(() => useBuilderOnboardingActions(deps as never));

    act(() => {
      result.current.cancelStarterConfirm();
    });

    expect(deps.ui.setOnboardingModalStarter).toHaveBeenCalledWith(null);
    expect(deps.ui.setOnboardingNickname).toHaveBeenCalledWith("");
  });

  it("does nothing when confirming without a selected starter", () => {
    const deps = createDeps();
    const { result } = renderHook(() => useBuilderOnboardingActions(deps as never));

    act(() => {
      result.current.confirmStarterSelection();
    });

    expect(deps.ui.setOnboardingSelection).not.toHaveBeenCalled();
    expect(deps.store.beginRun).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("starts the run after the transition delay and navigates to /team", () => {
    const deps = createDeps();
    deps.ui.onboardingModalStarter = "tepig";
    deps.ui.onboardingNickname = "Blaze";

    const { result } = renderHook(() => useBuilderOnboardingActions(deps as never));

    act(() => {
      result.current.confirmStarterSelection();
    });

    expect(deps.ui.setOnboardingSelection).toHaveBeenCalledWith("tepig");
    expect(deps.store.beginRun).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(deps.store.beginRun).toHaveBeenCalledWith(
      "tepig",
      starters.tepig.species,
      "Blaze",
    );
    expect(deps.ui.resetOnboardingState).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/team");
  });
});
