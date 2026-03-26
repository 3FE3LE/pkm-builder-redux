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
  } as never;
}

function createUi() {
  return {
    compareMembers: [
      { id: "c1", species: "", moves: [], locked: false },
      { id: "c2", species: "", moves: [], locked: false },
    ],
    movePickerState: null,
    localTime: { ready: true, period: "day", label: "12:00 PM" },
  } as never;
}

function createData() {
  return {
    docs: {},
    pokemonIndex: {},
    abilityCatalog: [],
    itemCatalog: [],
    moveIndex: {},
  } as never;
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
});
