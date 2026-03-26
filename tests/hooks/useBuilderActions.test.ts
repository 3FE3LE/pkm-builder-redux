import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => ({
  useBuilderTeamActions: vi.fn(() => ({ addMember: "team-action" })),
  useBuilderModalActions: vi.fn(() => ({ openMovePicker: "modal-action" })),
  useBuilderOnboardingActions: vi.fn(() => ({ confirmStarterSelection: "onboarding-action" })),
}));

vi.mock("@/hooks/useBuilderTeamActions", () => ({
  useBuilderTeamActions: mockedHooks.useBuilderTeamActions,
}));

vi.mock("@/hooks/useBuilderModalActions", () => ({
  useBuilderModalActions: mockedHooks.useBuilderModalActions,
}));

vi.mock("@/hooks/useBuilderOnboardingActions", () => ({
  useBuilderOnboardingActions: mockedHooks.useBuilderOnboardingActions,
}));

import { useBuilderActions } from "@/hooks/useBuilderActions";

describe("useBuilderActions", () => {
  it("merges the team, modal, and onboarding action groups", () => {
    const data = { foo: "data" };
    const store = { foo: "store" };
    const ui = { foo: "ui" };
    const derived = { foo: "derived" };

    const { result } = renderHook(() =>
      useBuilderActions(data as never, store as never, ui as never, derived as never),
    );

    expect(mockedHooks.useBuilderTeamActions).toHaveBeenCalledWith({ data, store, ui, derived });
    expect(mockedHooks.useBuilderModalActions).toHaveBeenCalledWith({ data, store, ui, derived });
    expect(mockedHooks.useBuilderOnboardingActions).toHaveBeenCalledWith({ data, store, ui, derived });
    expect(result.current).toEqual({
      addMember: "team-action",
      openMovePicker: "modal-action",
      confirmStarterSelection: "onboarding-action",
    });
  });
});
