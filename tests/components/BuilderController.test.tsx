import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useBuilderController } from "@/components/BuilderController";

const mockedUseBuilderStoreState = vi.fn();
const mockedUseBuilderUiState = vi.fn();
const mockedUseBuilderDerivedData = vi.fn();
const mockedUseBuilderActions = vi.fn();
const mockedGetRunEncounterCatalog = vi.fn();

vi.mock("@/lib/builder", () => ({
  starters: ["Snivy", "Tepig", "Oshawott"],
}));

vi.mock("@/lib/runEncounters", () => ({
  getRunEncounterCatalog: (...args: unknown[]) => mockedGetRunEncounterCatalog(...args),
}));

vi.mock("@/hooks/useBuilderStoreState", () => ({
  useBuilderStoreState: () => mockedUseBuilderStoreState(),
}));

vi.mock("@/hooks/useBuilderUiState", () => ({
  useBuilderUiState: () => mockedUseBuilderUiState(),
}));

vi.mock("@/hooks/useBuilderDerivedData", () => ({
  useBuilderDerivedData: (...args: unknown[]) => mockedUseBuilderDerivedData(...args),
}));

vi.mock("@/hooks/useBuilderActions", () => ({
  useBuilderActions: (...args: unknown[]) => mockedUseBuilderActions(...args),
}));

describe("BuilderController", () => {
  beforeEach(() => {
    mockedGetRunEncounterCatalog.mockReset();
    mockedUseBuilderStoreState.mockReset();
    mockedUseBuilderUiState.mockReset();
    mockedUseBuilderDerivedData.mockReset();
    mockedUseBuilderActions.mockReset();
  });

  it("composes controller slices from store, ui, derived data and actions", () => {
    const store = {
      run: { progress: { mode: "challenge" } },
      hydrated: true,
      builderStarted: true,
      starter: "Snivy",
      evolutionConstraints: { ivy: false },
      recommendationFilters: { exactType: true },
      battleWeather: "rain",
      theme: "light",
      milestoneId: "castelia",
      completedEncounterIds: ["route-1"],
      pokemonLibrary: [{ id: "lib-1" }],
      compositions: [{ id: "main" }],
      activeCompositionId: "main",
      pcBoxIds: ["pc-1"],
      currentTeam: [{ id: "member-1" }],
      activeMemberId: "member-1",
      editorMemberId: "member-1",
      toggleEncounterCompleted: vi.fn(),
      setEvolutionConstraint: vi.fn(),
      setRecommendationFilter: vi.fn(),
      setBattleWeather: vi.fn(),
      setTheme: vi.fn(),
      setMilestoneId: vi.fn(),
      updateMember: vi.fn(),
      createComposition: vi.fn(),
      renameComposition: vi.fn(),
      setActiveCompositionId: vi.fn(),
      addLibraryMemberToComposition: vi.fn(),
      saveMemberToPc: vi.fn(),
      moveMemberToPc: vi.fn(),
      restoreMemberFromPc: vi.fn(),
      resetRun: vi.fn(),
    };
    const ui = {
      onboardingSelection: "Snivy",
      onboardingModalStarter: "Snivy",
      onboardingNickname: "Leaf",
      editorMoveSelection: { memberId: "member-1", slotIndex: 1 },
      evolvingIds: { "member-1": true },
      sensors: ["sensor"],
      compareMembers: [{ id: "compare-a" }, { id: "compare-b" }],
      movePickerState: { memberId: "member-1", slotIndex: 2 },
      moveModalTab: "machines",
      expandedMoveKey: "flash-cannon",
      evolutionState: { memberId: "member-1", selectedNext: "Lucario" },
      setOnboardingNickname: vi.fn(),
      setEditorMoveSelection: vi.fn(),
      setMoveModalTab: vi.fn(),
      setExpandedMoveKey: vi.fn(),
    };
    const derived = {
      editorMember: { id: "member-1" },
      editorResolved: { species: "Lucario" },
      editorEvolutionEligibility: { eligible: true },
      localTime: "night",
      activeMember: { id: "member-1" },
      resolvedTeam: [{ species: "Lucario" }],
      averageStats: { hp: 90 },
      checkpointRisk: [{ boss: "Elesa" }],
      supportsContextualSwaps: true,
      contextualMilestoneId: "castelia",
      nextEncounter: { id: "route-4" },
      coveredCoverage: ["Steel"],
      uncoveredCoverage: ["Ground"],
      defensiveSections: [{ label: "Weaknesses" }],
      sourceCards: [{ title: "Route 4" }],
      moveRecommendations: [{ move: "Flash Cannon" }],
      swapOpportunities: [{ species: "Mareep" }],
      captureRecommendations: [{ species: "Sandile" }],
      resolvedCompareMembers: [{ species: "Lucario" }, { species: "Mareep" }],
      activeModalMember: { id: "member-1", species: "Lucario" },
    };
    const actions = {
      openStarterConfirm: vi.fn(),
      cancelStarterConfirm: vi.fn(),
      confirmStarterSelection: vi.fn(),
      returnToOnboarding: vi.fn(),
      handleDragEnd: vi.fn(),
      selectMember: vi.fn(),
      clearSelection: vi.fn(),
      editMember: vi.fn(),
      removeMember: vi.fn(),
      addMember: vi.fn(),
      addPreparedMember: vi.fn(),
      closeEditor: vi.fn(),
      openMovePickerForEditor: vi.fn(),
      openMovePickerForMember: vi.fn(),
      removeMoveFromEditor: vi.fn(),
      removeMoveFromEditorAt: vi.fn(),
      removeMoveAtForMember: vi.fn(),
      reorderMovesForEditor: vi.fn(),
      reorderMovesForMember: vi.fn(),
      requestEvolution: vi.fn(),
      requestEvolutionForMember: vi.fn(),
      updateCompareMember: vi.fn(),
      closeMovePicker: vi.fn(),
      pickMove: vi.fn(),
      selectEvolution: vi.fn(),
      cancelEvolution: vi.fn(),
      confirmEvolution: vi.fn(),
    };
    const data = {
      docs: { trainers: [] },
      speciesOptions: ["Lucario", "Mareep"],
      speciesCatalog: [{ name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] }],
      moveIndex: { "flash-cannon": { name: "Flash Cannon" } },
      pokemonIndex: { lucario: { name: "Lucario" } },
      abilityCatalog: [{ name: "Inner Focus" }],
      itemCatalog: [{ name: "Metal Coat", sprite: "/metal-coat.png" }],
    } as any;

    mockedUseBuilderStoreState.mockReturnValue(store);
    mockedUseBuilderUiState.mockReturnValue(ui);
    mockedUseBuilderDerivedData.mockReturnValue(derived);
    mockedUseBuilderActions.mockReturnValue(actions);
    mockedGetRunEncounterCatalog.mockReturnValue(["encounter-card"]);

    const { result } = renderHook(() => useBuilderController(data));

    expect(mockedUseBuilderDerivedData).toHaveBeenCalledWith(data, store, ui);
    expect(mockedUseBuilderActions).toHaveBeenCalledWith(data, store, ui, derived);

    expect(result.current.session).toEqual({
      run: store.run,
      hydrated: true,
      builderStarted: true,
      starter: "Snivy",
      evolutionConstraints: store.evolutionConstraints,
      recommendationFilters: store.recommendationFilters,
      battleWeather: "rain",
      theme: "light",
      milestoneId: "castelia",
      completedEncounterIds: ["route-1"],
      mode: "challenge",
      actions: {
        toggleEncounterCompleted: store.toggleEncounterCompleted,
        setEvolutionConstraint: store.setEvolutionConstraint,
        setRecommendationFilter: store.setRecommendationFilter,
        setBattleWeather: store.setBattleWeather,
        setTheme: store.setTheme,
      },
    });

    expect(result.current.catalogs.encounterCatalog).toEqual(["encounter-card"]);
    expect(mockedGetRunEncounterCatalog).toHaveBeenCalledWith("challenge");

    expect(result.current.onboarding).toEqual({
      selection: "Snivy",
      modalStarter: "Snivy",
      nickname: "Leaf",
      starters: ["Snivy", "Tepig", "Oshawott"],
      actions: {
        openStarterConfirm: actions.openStarterConfirm,
        cancelStarterConfirm: actions.cancelStarterConfirm,
        confirmStarterSelection: actions.confirmStarterSelection,
        setNickname: ui.setOnboardingNickname,
      },
    });

    expect(result.current.team.editorResolved).toBe(derived.editorResolved);
    expect(result.current.team.actions.requestEvolutionForMember).toBe(actions.requestEvolutionForMember);
    expect(result.current.analysis.swapOpportunities).toBe(derived.swapOpportunities);
    expect(result.current.compare.actions.updateMember).toBe(actions.updateCompareMember);
    expect(result.current.movePicker.activeMember).toBe(derived.activeModalMember);
    expect(result.current.movePicker.getSurfaceStyle("Fire").backgroundImage).toContain("var(--type-fire)");
    expect(result.current.evolution).toEqual({
      state: ui.evolutionState,
      actions: {
        select: actions.selectEvolution,
        close: actions.cancelEvolution,
        confirm: actions.confirmEvolution,
      },
    });
  });
});
