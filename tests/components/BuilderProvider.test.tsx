import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  BuilderProvider,
  useTeamAnalysis,
  useTeamCatalogs,
  useTeamCompare,
  useTeamEvolution,
  useTeamMovePicker,
  useTeamOnboarding,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";

const mockedUseBuilderController = vi.fn();

vi.mock("@/components/BuilderController", () => ({
  useBuilderController: (...args: unknown[]) => mockedUseBuilderController(...args),
}));

describe("BuilderProvider", () => {
  it("provides all controller slices through context hooks", () => {
    const controller = {
      session: { run: { id: "run-1" } },
      catalogs: { speciesOptions: ["Lucario"] },
      onboarding: { selection: "Snivy" },
      team: { currentTeam: [{ id: "member-1" }] },
      analysis: { nextEncounter: { id: "route-4" } },
      compare: { members: [] },
      movePicker: { tab: "levelUp" },
      evolution: { state: { memberId: "member-1" } },
    };
    const data = {
      docs: { trainers: [] },
      speciesOptions: [],
      speciesCatalog: [],
      moveIndex: {},
      pokemonIndex: {},
      abilityCatalog: [],
      itemCatalog: [],
    } as any;

    mockedUseBuilderController.mockReturnValue(controller);

    function wrapper({ children }: { children: ReactNode }) {
      return <BuilderProvider {...data}>{children}</BuilderProvider>;
    }

    expect(renderHook(() => useTeamSession(), { wrapper }).result.current).toBe(controller.session);
    expect(renderHook(() => useTeamCatalogs(), { wrapper }).result.current).toBe(controller.catalogs);
    expect(renderHook(() => useTeamOnboarding(), { wrapper }).result.current).toBe(controller.onboarding);
    expect(renderHook(() => useTeamRoster(), { wrapper }).result.current).toBe(controller.team);
    expect(renderHook(() => useTeamAnalysis(), { wrapper }).result.current).toBe(controller.analysis);
    expect(renderHook(() => useTeamCompare(), { wrapper }).result.current).toBe(controller.compare);
    expect(renderHook(() => useTeamMovePicker(), { wrapper }).result.current).toBe(controller.movePicker);
    expect(renderHook(() => useTeamEvolution(), { wrapper }).result.current).toBe(controller.evolution);
    expect(mockedUseBuilderController).toHaveBeenCalledWith(data);
  });

  it("throws when a context hook is used outside the provider", () => {
    expect(() => renderHook(() => useTeamSession())).toThrow("useTeamSession must be used within BuilderProvider");
    expect(() => renderHook(() => useTeamCatalogs())).toThrow("useTeamCatalogs must be used within BuilderProvider");
    expect(() => renderHook(() => useTeamOnboarding())).toThrow("useTeamOnboarding must be used within BuilderProvider");
    expect(() => renderHook(() => useTeamRoster())).toThrow("useTeamRoster must be used within BuilderProvider");
    expect(() => renderHook(() => useTeamAnalysis())).toThrow("useTeamAnalysis must be used within BuilderProvider");
    expect(() => renderHook(() => useTeamCompare())).toThrow("useTeamCompare must be used within BuilderProvider");
    expect(() => renderHook(() => useTeamMovePicker())).toThrow("useTeamMovePicker must be used within BuilderProvider");
    expect(() => renderHook(() => useTeamEvolution())).toThrow("useTeamEvolution must be used within BuilderProvider");
  });
});
