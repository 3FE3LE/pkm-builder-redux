import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  hydrated: true,
  builderStarted: true,
  params: {} as { token?: string },
  searchParams: new URLSearchParams(),
  routerReplace: vi.fn(),
  saveMemberToPc: vi.fn(),
  setBuilderStarted: vi.fn(),
  importPokemonFromHash: vi.fn((_: string) => ({
    ok: true as const,
    member: { id: "imported-1", species: "Lucario" },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocked.routerReplace,
  }),
  useParams: () => mocked.params,
  useSearchParams: () => mocked.searchParams,
}));

vi.mock("@/lib/pokemonTransfer", () => ({
  importPokemonFromHash: (value: string) => mocked.importPokemonFromHash(value),
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamSession: () => ({
    hydrated: mocked.hydrated,
    builderStarted: mocked.builderStarted,
    actions: {
      setBuilderStarted: mocked.setBuilderStarted,
    },
  }),
  useTeamRoster: () => ({
    actions: {
      saveMemberToPc: mocked.saveMemberToPc,
    },
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

vi.mock("@/components/team/screens/TeamWorkspaceScreen", () => ({
  TeamWorkspaceScreen: () => <div>active-screen</div>,
}));

import { TeamWorkspace } from "@/components/team/screens/TeamWorkspace";

describe("TeamWorkspace", () => {
  beforeEach(() => {
    mocked.hydrated = true;
    mocked.builderStarted = true;
    mocked.params = {};
    mocked.searchParams = new URLSearchParams();
    mocked.routerReplace.mockReset();
    mocked.saveMemberToPc.mockReset();
    mocked.setBuilderStarted.mockReset();
    mocked.importPokemonFromHash.mockReset();
    mocked.importPokemonFromHash.mockReturnValue({
      ok: true,
      member: { id: "imported-1", species: "Lucario" },
    });
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

  it("auto-imports a shared token from the url and clears it", async () => {
    mocked.searchParams = new URLSearchParams("m=compact-token&tab=team");
    mocked.builderStarted = false;

    render(<TeamWorkspace />);

    await waitFor(() => {
      expect(mocked.importPokemonFromHash).toHaveBeenCalledWith("compact-token");
      expect(mocked.saveMemberToPc).toHaveBeenCalledWith(expect.objectContaining({ species: "Lucario" }));
      expect(mocked.setBuilderStarted).toHaveBeenCalledWith(true);
      expect(mocked.routerReplace).toHaveBeenCalledWith("/team?tab=team");
    });
  });

  it("auto-imports a shared token from the clean share route", async () => {
    mocked.params = { token: "route-token" };

    render(<TeamWorkspace />);

    await waitFor(() => {
      expect(mocked.importPokemonFromHash).toHaveBeenCalledWith("route-token");
      expect(mocked.saveMemberToPc).toHaveBeenCalledWith(expect.objectContaining({ species: "Lucario" }));
      expect(mocked.routerReplace).toHaveBeenCalledWith("/team");
    });
  });
});
