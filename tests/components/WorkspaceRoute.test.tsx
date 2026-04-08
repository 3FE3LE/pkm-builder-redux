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
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocked.routerReplace,
  }),
  useParams: () => mocked.params,
  useSearchParams: () => mocked.searchParams,
  redirect: mocked.redirect,
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

vi.mock("@/components/team/screens/LoadingState", () => ({
  LoadingState: () => <div>loading-screen</div>,
}));

vi.mock("@/components/team/screens/RouteGuardScreen", () => ({
  RouteGuardScreen: (props: { title: string; description: string; ctaHref: string; ctaLabel: string }) => (
    <div>
      <div>{props.title}</div>
      <div>{props.description}</div>
      <a href={props.ctaHref}>{props.ctaLabel}</a>
    </div>
  ),
}));

vi.mock("@/components/team/screens/WorkspaceScreen", () => ({
  WorkspaceScreen: () => <div>active-screen</div>,
}));

import { WorkspaceRoute } from "@/components/team/screens/WorkspaceRoute";

describe("WorkspaceRoute", () => {
  beforeEach(() => {
    mocked.hydrated = true;
    mocked.builderStarted = true;
    mocked.params = {};
    mocked.searchParams = new URLSearchParams();
    mocked.routerReplace.mockReset();
    mocked.saveMemberToPc.mockReset();
    mocked.setBuilderStarted.mockReset();
    mocked.importPokemonFromHash.mockReset();
    mocked.redirect.mockReset();
    mocked.importPokemonFromHash.mockReturnValue({
      ok: true,
      member: { id: "imported-1", species: "Lucario" },
    });
  });

  it("shows loading until the session hydrates", () => {
    mocked.hydrated = false;

    render(<WorkspaceRoute />);

    expect(screen.getByText("loading-screen")).toBeTruthy();
  });

  it("redirects when there is no active run", () => {
    mocked.builderStarted = false;

    render(<WorkspaceRoute />);

    expect(mocked.redirect).toHaveBeenCalledWith("/onboarding");
  });

  it("renders the active screen when the run is ready", () => {
    render(<WorkspaceRoute />);

    expect(screen.getByText("active-screen")).toBeTruthy();
  });

  it("auto-imports a shared token from the url and clears it", async () => {
    mocked.searchParams = new URLSearchParams("m=compact-token&tab=team");

    render(<WorkspaceRoute />);

    await waitFor(() => {
      expect(mocked.importPokemonFromHash).toHaveBeenCalledWith("compact-token");
      expect(mocked.saveMemberToPc).toHaveBeenCalledWith(expect.objectContaining({ species: "Lucario" }));
      expect(mocked.setBuilderStarted).not.toHaveBeenCalled();
      expect(mocked.routerReplace).toHaveBeenCalledWith("/team?tab=team");
    });
  });

  it("auto-imports a shared token from the clean share route", async () => {
    mocked.params = { token: "route-token" };

    render(<WorkspaceRoute />);

    await waitFor(() => {
      expect(mocked.importPokemonFromHash).toHaveBeenCalledWith("route-token");
      expect(mocked.saveMemberToPc).toHaveBeenCalledWith(expect.objectContaining({ species: "Lucario" }));
      expect(mocked.routerReplace).toHaveBeenCalledWith("/team");
    });
  });
});
