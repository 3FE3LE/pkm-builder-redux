import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  hydrated: true,
  setEvolutionConstraint: vi.fn(),
  setRecommendationFilter: vi.fn(),
  setBattleWeather: vi.fn(),
  setTheme: vi.fn(),
  resetRun: vi.fn(),
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamSession: () => ({
    hydrated: mocked.hydrated,
    evolutionConstraints: { trade: false },
    recommendationFilters: { excludeTrades: false },
    battleWeather: "rain",
    theme: "dark",
    actions: {
      setEvolutionConstraint: mocked.setEvolutionConstraint,
      setRecommendationFilter: mocked.setRecommendationFilter,
      setBattleWeather: mocked.setBattleWeather,
      setTheme: mocked.setTheme,
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

vi.mock("@/components/team/settings/PreferencesSection", () => ({
  PreferencesSection: (props: Record<string, any>) => (
    <div>
      <div>{`prefs-${props.battleWeather}`}</div>
      <div>{`theme-${props.theme}`}</div>
      <button type="button" onClick={() => props.onToggleEvolutionConstraint("trade", true)}>
        toggle-evolution
      </button>
      <button type="button" onClick={() => props.onToggleRecommendationFilter("excludeTrades", true)}>
        toggle-filter
      </button>
      <button type="button" onClick={() => props.onSetBattleWeather("sun")}>
        set-weather
      </button>
      <button type="button" onClick={() => props.onSetTheme("light")}>
        set-theme
      </button>
      <button type="button" onClick={() => props.onResetRun()}>
        reset-run
      </button>
    </div>
  ),
}));

import { SettingsScreen } from "@/components/team/screens/SettingsScreen";

describe("SettingsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.hydrated = true;
  });

  it("shows loading while the session hydrates", () => {
    mocked.hydrated = false;

    render(<SettingsScreen />);

    expect(screen.getByText("loading-screen")).toBeTruthy();
  });

  it("renders preferences and wires the settings actions", async () => {
    const user = userEvent.setup();

    render(<SettingsScreen />);

    expect(screen.getByText("Preferencias del builder")).toBeTruthy();
    expect(screen.getByText("prefs-rain")).toBeTruthy();
    expect(screen.getByText("theme-dark")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "toggle-evolution" }));
    expect(mocked.setEvolutionConstraint).toHaveBeenCalledWith("trade", true);

    await user.click(screen.getByRole("button", { name: "toggle-filter" }));
    expect(mocked.setRecommendationFilter).toHaveBeenCalledWith("excludeTrades", true);

    await user.click(screen.getByRole("button", { name: "set-weather" }));
    expect(mocked.setBattleWeather).toHaveBeenCalledWith("sun");

    await user.click(screen.getByRole("button", { name: "set-theme" }));
    expect(mocked.setTheme).toHaveBeenCalledWith("light");

    await user.click(screen.getByRole("button", { name: "reset-run" }));
    expect(mocked.resetRun).toHaveBeenCalled();
  });
});
