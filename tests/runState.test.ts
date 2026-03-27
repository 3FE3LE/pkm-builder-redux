import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_MILESTONE_ID, createEmptyRunState, createStartedRunState } from "../lib/runState";

describe("runState", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("composition-id"),
    });
  });

  it("creates the default empty run state", () => {
    const state = createEmptyRunState();

    expect(state).toEqual({
      started: false,
      starter: "snivy",
      preferences: {
        evolutionConstraints: {
          level: true,
          gender: true,
          timeOfDay: true,
        },
        recommendationFilters: {
          excludeLegendaries: false,
          excludePseudoLegendaries: false,
          excludeUniquePokemon: false,
          excludeOtherStarters: false,
          excludeExactTypeDuplicates: false,
        },
        battleWeather: "clear",
      },
      roster: {
        pokemonLibrary: [],
        compositions: [{ id: "composition-id", name: "Main Team", memberIds: [] }],
        activeCompositionId: "composition-id",
        pcBoxIds: [],
        currentTeam: [],
        activeMemberId: null,
        editorMemberId: null,
      },
      progress: {
        mode: "challenge",
        milestoneId: DEFAULT_MILESTONE_ID,
        completedEncounterIds: [],
        completedMilestoneIds: [],
        claimedSources: {
          encounters: [],
          gifts: [],
          trades: [],
          items: [],
        },
        achievements: [],
        flags: {},
      },
    });
  });

  it("creates a started run state centered on the provided lead", () => {
    const lead = {
      id: "lead-1",
      species: "Snivy",
      nickname: "Snivy",
      locked: true,
      shiny: false,
      level: 5,
      gender: "female" as const,
      nature: "Timid",
      ability: "Overgrow",
      item: "",
      moves: ["Tackle", "Leer"],
      ivs: { hp: 31, atk: 20, def: 18, spa: 31, spd: 24, spe: 31 },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    };

    const state = createStartedRunState("snivy", lead);

    expect(state.started).toBe(true);
    expect(state.starter).toBe("snivy");
    expect(state.roster.pokemonLibrary).toEqual([lead]);
    expect(state.roster.currentTeam).toEqual([lead]);
    expect(state.roster.compositions).toEqual([
      { id: "composition-id", name: "Main Team", memberIds: ["lead-1"] },
    ]);
    expect(state.roster.activeCompositionId).toBe("composition-id");
    expect(state.roster.activeMemberId).toBe("lead-1");
    expect(state.roster.editorMemberId).toBe("lead-1");
    expect(state.progress.milestoneId).toBe(DEFAULT_MILESTONE_ID);
  });
});
