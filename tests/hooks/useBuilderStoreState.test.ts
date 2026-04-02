import { describe, expect, it, vi } from "vitest";

const mockedStore = vi.hoisted(() => {
  const state = {
    hydrated: true,
    run: {
      started: true,
      starter: "snivy",
      preferences: {
        evolutionConstraints: { level: true, gender: false, timeOfDay: true },
        recommendationFilters: { excludeLegendaries: true },
        battleWeather: "rain",
        theme: "light",
      },
      progress: {
        milestoneId: "virbank",
        completedEncounterIds: ["enc-1"],
        flags: { lighthouse: true },
      },
      roster: {
        pokemonLibrary: [{ id: "lib-1" }],
        compositions: [{ id: "main", name: "Main Team", memberIds: ["lib-1"] }],
        activeCompositionId: "main",
        pcBoxIds: ["pc-1"],
        currentTeam: [{ id: "lib-1" }],
        activeMemberId: "lib-1",
        editorMemberId: "lib-1",
      },
    },
    setBuilderStarted: vi.fn(),
    beginRun: vi.fn(),
    setMilestoneId: vi.fn(),
    setCurrentTeam: vi.fn(),
    updateMember: vi.fn(),
    createComposition: vi.fn(),
    renameComposition: vi.fn(),
    setActiveCompositionId: vi.fn(),
    addLibraryMemberToComposition: vi.fn(),
    saveMemberToPc: vi.fn(),
    moveMemberToPc: vi.fn(),
    releaseMember: vi.fn(),
    restoreMemberFromPc: vi.fn(),
    setActiveMemberId: vi.fn(),
    setEditorMemberId: vi.fn(),
    setEvolutionConstraint: vi.fn(),
    setRecommendationFilter: vi.fn(),
    setBattleWeather: vi.fn(),
    setTheme: vi.fn(),
    toggleEncounterCompleted: vi.fn(),
    resetRun: vi.fn(),
  };

  const useBuilderStore = vi.fn((selector: (storeState: any) => unknown) => selector(state));

  return { state, useBuilderStore };
});

vi.mock("@/lib/builderStore", () => ({
  useBuilderStore: mockedStore.useBuilderStore,
}));

import { useBuilderStoreState } from "@/hooks/useBuilderStoreState";

describe("useBuilderStoreState", () => {
  it("selects and exposes store slices plus action references", () => {
    const result = useBuilderStoreState();

    expect(result).toMatchObject({
      hydrated: true,
      run: mockedStore.state.run,
      builderStarted: true,
      starter: "snivy",
      evolutionConstraints: { level: true, gender: false, timeOfDay: true },
      recommendationFilters: { excludeLegendaries: true },
      battleWeather: "rain",
      theme: "light",
      milestoneId: "virbank",
      pokemonLibrary: [{ id: "lib-1" }],
      compositions: [{ id: "main", name: "Main Team", memberIds: ["lib-1"] }],
      activeCompositionId: "main",
      pcBoxIds: ["pc-1"],
      currentTeam: [{ id: "lib-1" }],
      activeMemberId: "lib-1",
      editorMemberId: "lib-1",
      completedEncounterIds: ["enc-1"],
      hackEvents: { lighthouse: true },
      setBuilderStarted: mockedStore.state.setBuilderStarted,
      beginRun: mockedStore.state.beginRun,
      setMilestoneId: mockedStore.state.setMilestoneId,
      setCurrentTeam: mockedStore.state.setCurrentTeam,
      updateMember: mockedStore.state.updateMember,
      createComposition: mockedStore.state.createComposition,
      renameComposition: mockedStore.state.renameComposition,
      setActiveCompositionId: mockedStore.state.setActiveCompositionId,
      addLibraryMemberToComposition: mockedStore.state.addLibraryMemberToComposition,
      saveMemberToPc: mockedStore.state.saveMemberToPc,
      moveMemberToPc: mockedStore.state.moveMemberToPc,
      releaseMember: mockedStore.state.releaseMember,
      restoreMemberFromPc: mockedStore.state.restoreMemberFromPc,
      setActiveMemberId: mockedStore.state.setActiveMemberId,
      setEditorMemberId: mockedStore.state.setEditorMemberId,
      setEvolutionConstraint: mockedStore.state.setEvolutionConstraint,
      setRecommendationFilter: mockedStore.state.setRecommendationFilter,
      setBattleWeather: mockedStore.state.setBattleWeather,
      setTheme: mockedStore.state.setTheme,
      toggleEncounterCompleted: mockedStore.state.toggleEncounterCompleted,
      resetRun: mockedStore.state.resetRun,
    });
    expect(mockedStore.useBuilderStore).toHaveBeenCalled();
  });
});
