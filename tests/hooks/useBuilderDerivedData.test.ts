import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/team";
let mockParams = new URLSearchParams();

const mocked = vi.hoisted(() => ({
  buildCoverageSummary: vi.fn(() => []),
  buildDefensiveSections: vi.fn(() => ({ netWeak: [], netResist: [] })),
  buildAverageStats: vi.fn(() => null),
  buildCheckpointRiskSnapshot: vi.fn(() => ({
    totalRisk: 0,
    offense: { score: 0, summary: "" },
    defense: { score: 0, summary: "" },
    speed: { score: 0, summary: "" },
    roles: { score: 0, summary: "" },
    consistency: { score: 0, summary: "" },
    notes: [],
    roleSnapshot: { members: [], coveredRoles: [], missingRoles: [], compositionNotes: [] },
  })),
  buildCaptureRecommendations: vi.fn(() => []),
  getMoveRecommendations: vi.fn(() => []),
  buildSwapOpportunities: vi.fn(() => []),
  buildEvolutionEligibility: vi.fn(() => []),
  buildAreaSources: vi.fn(() => []),
  resolveEditableMember: vi.fn(
    (member: { id: string; species: string; moves: string[]; locked?: boolean }) => ({
      key: member.id,
      species: member.species,
      moves: [],
      locked: member.locked ?? false,
      resolvedTypes: [],
      level: 5,
      spriteUrl: null,
      animatedSpriteUrl: null,
      nextEvolutions: [],
    }),
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => ({ get: (key: string) => mockParams.get(key) }),
}));

vi.mock("@/lib/domain/battle", () => ({
  buildCoverageSummary: mocked.buildCoverageSummary,
  buildDefensiveSections: mocked.buildDefensiveSections,
  buildAverageStats: mocked.buildAverageStats,
}));

vi.mock("@/lib/domain/checkpointScoring", () => ({
  buildCheckpointRiskSnapshot: mocked.buildCheckpointRiskSnapshot,
}));

vi.mock("@/lib/domain/contextualRecommendations", () => ({
  buildCaptureRecommendations: mocked.buildCaptureRecommendations,
}));

vi.mock("@/lib/domain/moveRecommendations", () => ({
  getMoveRecommendations: mocked.getMoveRecommendations,
}));

vi.mock("@/lib/domain/swapOpportunities", () => ({
  buildSwapOpportunities: mocked.buildSwapOpportunities,
}));

vi.mock("@/lib/domain/evolutionEligibility", () => ({
  buildEvolutionEligibility: mocked.buildEvolutionEligibility,
}));

vi.mock("@/lib/runEncounters", () => ({
  getRunEncounterCatalog: () => [],
  getNextRelevantEncounter: () => null,
  mapEncounterOrderToMilestoneId: () => "floccesy",
  getContextualSourceAreas: () => [],
}));

vi.mock("@/lib/builder", () => ({
  buildAreaSources: mocked.buildAreaSources,
}));

vi.mock("@/lib/builderResolver", () => ({
  buildNameIndex: () => ({}),
  resolveEditableMember: mocked.resolveEditableMember,
}));

import { useBuilderDerivedData } from "@/hooks/useBuilderDerivedData";

function createStore() {
  return {
    run: { progress: { mode: "challenge" } },
    currentTeam: [{ id: "a", species: "Snivy", moves: ["Tackle"], locked: false }],
    pokemonLibrary: [{ id: "a", species: "Snivy", moves: ["Tackle"], locked: false }],
    completedEncounterIds: [],
    milestoneId: "floccesy",
    battleWeather: "clear",
    editorMemberId: null,
    activeMemberId: "a",
    starter: "snivy",
    recommendationFilters: {
      excludeLegendaries: false,
      excludePseudoLegendaries: false,
      excludeUniquePokemon: false,
      excludeOtherStarters: false,
      excludeExactTypeDuplicates: false,
    },
    evolutionConstraints: { level: true, gender: true, timeOfDay: true },
  } as any;
}

function createUi() {
  return {
    compareMembers: [
      { id: "c1", species: "", moves: [], locked: false },
      { id: "c2", species: "", moves: [], locked: false },
    ],
    movePickerState: null,
    localTime: { ready: true, period: "day", label: "12:00 PM" },
  } as any;
}

function createData() {
  return {
    docs: {},
    pokemonIndex: {},
    abilityCatalog: [],
    itemCatalog: [],
    moveIndex: {},
  } as any;
}

describe("useBuilderDerivedData route gating", () => {
  beforeEach(() => {
    mockPathname = "/team";
    mockParams = new URLSearchParams();
    mocked.buildCoverageSummary.mockClear();
    mocked.buildDefensiveSections.mockClear();
    mocked.buildAverageStats.mockClear();
    mocked.buildCheckpointRiskSnapshot.mockClear();
    mocked.buildCaptureRecommendations.mockClear();
    mocked.getMoveRecommendations.mockClear();
    mocked.buildSwapOpportunities.mockClear();
    mocked.buildEvolutionEligibility.mockClear();
    mocked.buildAreaSources.mockClear();
    mocked.resolveEditableMember.mockClear();
  });

  it("skips team-only calculations on tools compositions route", () => {
    mockPathname = "/team/tools";
    mockParams = new URLSearchParams("tool=compositions");

    renderHook(() => useBuilderDerivedData(createData(), createStore(), createUi()));

    expect(mocked.buildCoverageSummary).not.toHaveBeenCalled();
    expect(mocked.buildCaptureRecommendations).not.toHaveBeenCalled();
    expect(mocked.buildSwapOpportunities).not.toHaveBeenCalled();
    expect(mocked.getMoveRecommendations).not.toHaveBeenCalled();
    expect(mocked.buildAreaSources).not.toHaveBeenCalled();
  });

  it("runs builder-route calculations but skips copilot-only ones on builder tab", () => {
    mockPathname = "/team";
    mockParams = new URLSearchParams("tab=builder");

    renderHook(() => useBuilderDerivedData(createData(), createStore(), createUi()));

    expect(mocked.buildCoverageSummary).toHaveBeenCalled();
    expect(mocked.buildCaptureRecommendations).toHaveBeenCalled();
    expect(mocked.getMoveRecommendations).toHaveBeenCalled();
    expect(mocked.buildSwapOpportunities).not.toHaveBeenCalled();
    expect(mocked.buildAreaSources).not.toHaveBeenCalled();
  });

  it("runs copilot-only calculations on copilot tab", () => {
    mockPathname = "/team";
    mockParams = new URLSearchParams("tab=copilot");

    renderHook(() => useBuilderDerivedData(createData(), createStore(), createUi()));

    expect(mocked.buildSwapOpportunities).toHaveBeenCalled();
    expect(mocked.buildAreaSources).toHaveBeenCalled();
  });

  it("resolves compare members on compare tab without running team-core coverage", () => {
    mockPathname = "/team/tools";
    mockParams = new URLSearchParams("tool=compare");
    mocked.buildCoverageSummary.mockReturnValue([
      { defenseType: "Fire", multiplier: 2, bucket: "x2" },
      { defenseType: "Water", multiplier: 1, bucket: "x1" },
    ] as any);

    const ui = createUi();
    ui.compareMembers = [
      { id: "c1", species: "Snivy", moves: ["Tackle"], locked: false },
      { id: "c2", species: "Riolu", moves: ["Force Palm"], locked: false },
    ] as never;

    const { result } = renderHook(() => useBuilderDerivedData(createData(), createStore(), ui));

    expect(mocked.resolveEditableMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1" }),
      expect.any(Object),
    );
    expect(mocked.resolveEditableMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c2" }),
      expect.any(Object),
    );
    expect(result.current.resolvedCompareMembers[0]).toEqual(expect.objectContaining({ key: "c1" }));
    expect(result.current.resolvedCompareMembers[1]).toEqual(expect.objectContaining({ key: "c2" }));
    expect(result.current.coveredCoverage).toEqual([]);
    expect(result.current.uncoveredCoverage).toEqual([]);
  });

  it("builds editor and active modal members from the pokemon library when those ids are present", () => {
    mockPathname = "/team";
    mockParams = new URLSearchParams("tab=builder");

    const store = createStore();
    store.editorMemberId = "a";
    store.pokemonLibrary = [
      { id: "a", species: "Snivy", moves: ["Tackle"], locked: true },
      { id: "b", species: "Riolu", moves: ["Force Palm"], locked: false },
    ] as never;

    const ui = createUi();
    ui.movePickerState = { memberId: "b", slotIndex: 1 } as never;

    const { result } = renderHook(() => useBuilderDerivedData(createData(), store, ui));

    expect(result.current.editorMember).toEqual(expect.objectContaining({ id: "a" }));
    expect(result.current.editorResolved).toEqual(expect.objectContaining({ key: "a", locked: true }));
    expect(result.current.activeModalMember).toEqual(expect.objectContaining({ key: "b", locked: false }));
    expect(mocked.buildEvolutionEligibility).toHaveBeenCalled();
  });

  it("filters empty copilot source cards and builds move recommendations from uncovered types", () => {
    mockPathname = "/team";
    mockParams = new URLSearchParams("tab=copilot");
    mocked.buildCoverageSummary.mockReturnValue([
      { defenseType: "Fire", multiplier: 2, bucket: "x2" },
      { defenseType: "Electric", multiplier: 1, bucket: "x1" },
      { defenseType: "Ice", multiplier: 0, bucket: "x0" },
    ] as any);
    mocked.buildAreaSources.mockReturnValue([
      { encounters: [], gifts: [], trades: [], items: [] },
      { encounters: [{ species: "Mareep" }], gifts: [], trades: [], items: [] },
    ] as any);

    const { result } = renderHook(() => useBuilderDerivedData(createData(), createStore(), createUi()));

    expect(result.current.sourceCards).toHaveLength(1);
    expect(result.current.sourceCards[0]).toEqual(
      expect.objectContaining({
        encounters: [{ species: "Mareep" }],
      }),
    );
    expect(mocked.getMoveRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        uncoveredTypes: ["Electric", "Ice"],
      }),
    );
  });

  it("builds move recommendations on builder tab using uncovered defense types", () => {
    mockPathname = "/team";
    mockParams = new URLSearchParams("tab=builder");
    mocked.buildCoverageSummary.mockReturnValue([
      { defenseType: "Ground", multiplier: 0.5, bucket: "x0.5" },
      { defenseType: "Flying", multiplier: 1, bucket: "x1" },
      { defenseType: "Grass", multiplier: 2, bucket: "x2" },
    ] as any);

    const { result } = renderHook(() => useBuilderDerivedData(createData(), createStore(), createUi()));

    expect(mocked.getMoveRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        member: expect.objectContaining({ key: "a" }),
        uncoveredTypes: ["Ground", "Flying"],
      }),
    );
    expect(result.current.activeMember).toEqual(expect.objectContaining({ key: "a" }));
  });
});
