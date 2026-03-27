import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  hydrated: true,
  builderStarted: true,
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamSession: () => ({
    hydrated: mocked.hydrated,
    builderStarted: mocked.builderStarted,
  }),
}));

vi.mock("@/components/team/LoadingScreen", () => ({
  LoadingScreen: () => <div>loading-screen</div>,
}));

vi.mock("@/components/team/RouteHintScreen", () => ({
  RouteHintScreen: (props: { title: string; description: string; ctaHref: string; ctaLabel: string }) => (
    <div>
      <div>{props.title}</div>
      <div>{props.description}</div>
      <a href={props.ctaHref}>{props.ctaLabel}</a>
    </div>
  ),
}));

vi.mock("@/components/team/ActiveScreen", () => ({
  ActiveScreen: () => <div>active-screen</div>,
}));

import { TeamWorkspace } from "@/components/team/TeamApp";

describe("TeamWorkspace", () => {
  beforeEach(() => {
    mocked.hydrated = true;
    mocked.builderStarted = true;
  });

  it("shows loading until the session hydrates", () => {
    mocked.hydrated = false;

    render(<TeamWorkspace />);

    expect(screen.getByText("loading-screen")).toBeTruthy();
  });

  it("shows the route hint when there is no active run", () => {
    mocked.builderStarted = false;

    render(<TeamWorkspace />);

    expect(screen.getByText("No hay run activo")).toBeTruthy();
    expect(
      screen.getByText("Primero necesitas elegir un inicial para crear el equipo."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir a onboarding" }).getAttribute("href")).toBe(
      "/onboarding",
    );
  });

  it("renders the active screen when the run is ready", () => {
    render(<TeamWorkspace />);

    expect(screen.getByText("active-screen")).toBeTruthy();
  });
});
