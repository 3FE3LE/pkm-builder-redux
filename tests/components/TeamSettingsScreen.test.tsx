import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  hydrated: true,
  setEvolutionConstraint: vi.fn(),
  setRecommendationFilter: vi.fn(),
  setBattleWeather: vi.fn(),
  resetRun: vi.fn(),
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamSession: () => ({
    hydrated: mocked.hydrated,
    evolutionConstraints: { trade: false },
    recommendationFilters: { excludeTrades: false },
    battleWeather: "rain",
    actions: {
      setEvolutionConstraint: mocked.setEvolutionConstraint,
      setRecommendationFilter: mocked.setRecommendationFilter,
      setBattleWeather: mocked.setBattleWeather,
    },
  }),
  useTeamRoster: () => ({
    actions: {
      resetRun: mocked.resetRun,
    },
  }),
}));

vi.mock("@/components/team/LoadingScreen", () => ({
  LoadingScreen: () => <div>loading-screen</div>,
}));

vi.mock("@/components/team/LayoutSections", () => ({
  PreferencesSection: (props: Record<string, any>) => (
    <div>
      <div>{`prefs-${props.battleWeather}`}</div>
      <button type="button" onClick={() => props.onToggleEvolutionConstraint("trade", true)}>
        toggle-evolution
      </button>
      <button type="button" onClick={() => props.onToggleRecommendationFilter("excludeTrades", true)}>
        toggle-filter
      </button>
      <button type="button" onClick={() => props.onSetBattleWeather("sun")}>
        set-weather
      </button>
      <button type="button" onClick={() => props.onResetRun()}>
        reset-run
      </button>
    </div>
  ),
}));

import { TeamSettingsScreen } from "@/components/team/TeamSettingsScreen";

describe("TeamSettingsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.hydrated = true;
  });

  it("shows loading while the session hydrates", () => {
    mocked.hydrated = false;

    render(<TeamSettingsScreen />);

    expect(screen.getByText("loading-screen")).toBeTruthy();
  });

  it("renders preferences and wires the settings actions", async () => {
    const user = userEvent.setup();

    render(<TeamSettingsScreen />);

    expect(screen.getByText("Preferencias del builder")).toBeTruthy();
    expect(screen.getByText("prefs-rain")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "toggle-evolution" }));
    expect(mocked.setEvolutionConstraint).toHaveBeenCalledWith("trade", true);

    await user.click(screen.getByRole("button", { name: "toggle-filter" }));
    expect(mocked.setRecommendationFilter).toHaveBeenCalledWith("excludeTrades", true);

    await user.click(screen.getByRole("button", { name: "set-weather" }));
    expect(mocked.setBattleWeather).toHaveBeenCalledWith("sun");

    await user.click(screen.getByRole("button", { name: "reset-run" }));
    expect(mocked.resetRun).toHaveBeenCalled();
  });
});
