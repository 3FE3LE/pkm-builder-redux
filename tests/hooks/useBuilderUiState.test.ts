import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@dnd-kit/core", () => ({
  PointerSensor: Symbol("PointerSensor"),
  useSensor: vi.fn((sensor, options) => ({ sensor, options })),
  useSensors: vi.fn((...sensors) => sensors),
}));

import { useBuilderUiState } from "@/hooks/useBuilderUiState";

describe("useBuilderUiState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("initializes local time from the current clock and refreshes it every minute", () => {
    vi.setSystemTime(new Date("2026-03-26T06:30:00"));
    const { result } = renderHook(() => useBuilderUiState());

    expect(result.current.localTime).toMatchObject({
      hour24: 6,
      period: "day",
      phase: "dawn",
      ready: true,
    });

    act(() => {
      vi.setSystemTime(new Date("2026-03-26T19:15:00"));
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.localTime).toMatchObject({
      hour24: 19,
      period: "night",
      phase: "dusk",
      ready: true,
    });
  });

  it("exposes onboarding reset and move picker setters", () => {
    vi.setSystemTime(new Date("2026-03-26T12:00:00"));
    const { result } = renderHook(() => useBuilderUiState());

    act(() => {
      result.current.setMovePickerState({ memberId: "abc", slotIndex: 2 });
      result.current.setOnboardingSelection("snivy");
      result.current.setOnboardingModalStarter("tepig");
      result.current.setOnboardingNickname("Blaze");
    });

    expect(result.current.movePickerState).toEqual({
      memberId: "abc",
      slotIndex: 2,
    });
    expect(result.current.onboardingSelection).toBe("snivy");
    expect(result.current.onboardingModalStarter).toBe("tepig");
    expect(result.current.onboardingNickname).toBe("Blaze");

    act(() => {
      result.current.resetOnboardingState();
    });

    expect(result.current.onboardingSelection).toBeNull();
    expect(result.current.onboardingModalStarter).toBeNull();
    expect(result.current.onboardingNickname).toBe("");
  });
});
