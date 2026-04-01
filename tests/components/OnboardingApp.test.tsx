import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  hydrated: true,
  builderStarted: false,
  redirect: vi.fn(),
  builderProviderProps: null as Record<string, unknown> | null,
}));

vi.mock("next/navigation", () => ({
  redirect: mocked.redirect,
}));

vi.mock("@/components/BuilderProvider", () => ({
  BuilderProvider: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => {
    mocked.builderProviderProps = props;
    return <div>{children}</div>;
  },
  useTeamSession: () => ({
    hydrated: mocked.hydrated,
    builderStarted: mocked.builderStarted,
  }),
}));

vi.mock("@/components/team/screens/LoadingState", () => ({
  LoadingState: () => <div>loading-screen</div>,
}));

vi.mock("@/components/onboarding/OnboardingScreen", () => ({
  OnboardingScreen: () => <div>onboarding-screen</div>,
}));

import { BuilderOnboarding } from "@/components/onboarding/OnboardingApp";

describe("BuilderOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.hydrated = true;
    mocked.builderStarted = false;
    mocked.builderProviderProps = null;
  });

  it("shows loading while hydration is pending", () => {
    mocked.hydrated = false;

    render(<BuilderOnboarding docs={{} as never} speciesOptions={[]} speciesCatalog={[]} moveIndex={{}} abilityCatalog={[]} itemCatalog={[]} pokemonIndex={{}} />);

    expect(screen.getByText("loading-screen")).toBeTruthy();
  });

  it("shows onboarding when the builder has not started", () => {
    render(<BuilderOnboarding docs={{} as never} speciesOptions={[]} speciesCatalog={[]} moveIndex={{}} abilityCatalog={[]} itemCatalog={[]} pokemonIndex={{}} />);

    expect(screen.getByText("onboarding-screen")).toBeTruthy();
    expect(mocked.builderProviderProps).toMatchObject({
      docs: {},
      speciesOptions: [],
      speciesCatalog: [],
      moveIndex: {},
      abilityCatalog: [],
      itemCatalog: [],
      pokemonIndex: {},
    });
  });

  it("redirects to team when the builder already started", async () => {
    mocked.builderStarted = true;

    render(<BuilderOnboarding docs={{} as never} speciesOptions={[]} speciesCatalog={[]} moveIndex={{}} abilityCatalog={[]} itemCatalog={[]} pokemonIndex={{}} />);

    await waitFor(() => {
      expect(mocked.redirect).toHaveBeenCalledWith("/team");
    });
  });
});
