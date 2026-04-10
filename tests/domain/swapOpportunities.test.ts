import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  buildDecisionDeltas: vi.fn(),
  inferProjectedLevel: vi.fn(() => 24),
  projectCandidateMember: vi.fn(),
  buildTeamRoleSnapshot: vi.fn(),
}));

vi.mock("../../lib/domain/decisionDelta", () => ({
  buildDecisionDeltas: mocked.buildDecisionDeltas,
  inferProjectedLevel: mocked.inferProjectedLevel,
  projectCandidateMember: mocked.projectCandidateMember,
}));

vi.mock("../../lib/domain/roleAnalysis", () => ({
  buildTeamRoleSnapshot: mocked.buildTeamRoleSnapshot,
}));

import { buildSwapOpportunities } from "../../lib/domain/swapOpportunities";
import type { RecommendationFilters } from "../../lib/builder";
import type { ParsedDocs } from "../../lib/docsSchema";
import type { RunEncounterDefinition } from "../../lib/runEncounters";
import type { RemotePokemon, ResolvedTeamMember } from "../../lib/teamAnalysis";

const BASE_FILTERS: RecommendationFilters = {
  excludeLegendaries: false,
  excludePseudoLegendaries: false,
  excludeUniquePokemon: false,
  excludeOtherStarters: false,
  excludeExactTypeDuplicates: false,
  preferReduxUpgrades: false,
};

const NEXT_ENCOUNTER: RunEncounterDefinition = {
  id: "roxie",
  order: 5,
  label: "Roxie",
  category: "gym",
  affiliation: "unova-league",
  team: ["Wingull", "Woobat"],
  mode: "challenge",
  mandatory: true,
  levelCap: 21,
  documentation: "documented",
};

const BASE_DOCS: ParsedDocs = {
  moveReplacements: [],
  moveTypeChanges: [],
  moveTypeOverrides: [],
  moveDetails: [],
  typeChanges: [],
  itemLocations: [],
  itemHighlights: [],
  gifts: [],
  trades: [],
  wildAreas: [],
  pokemonProfiles: [],
  evolutionChanges: [],
};

const POKEMON_INDEX: Record<string, RemotePokemon> = {
  snivy: {
    id: 495,
    name: "Snivy",
    types: ["Grass"],
    abilities: ["Overgrow"],
    nextEvolutions: ["Servine"],
    stats: { hp: 45, atk: 45, def: 55, spa: 45, spd: 55, spe: 63, bst: 308 },
  },
  servine: {
    id: 496,
    name: "Servine",
    types: ["Grass"],
    abilities: ["Overgrow"],
    nextEvolutions: ["Serperior"],
    stats: { hp: 60, atk: 60, def: 75, spa: 60, spd: 75, spe: 83, bst: 413 },
  },
  serperior: {
    id: 497,
    name: "Serperior",
    types: ["Grass", "Dragon"],
    abilities: ["Contrary"],
    nextEvolutions: [],
    stats: { hp: 75, atk: 75, def: 95, spa: 75, spd: 95, spe: 113, bst: 528 },
  },
  bellsprout: {
    id: 69,
    name: "Bellsprout",
    types: ["Grass", "Poison"],
    abilities: ["Chlorophyll"],
    nextEvolutions: [],
    stats: { hp: 50, atk: 75, def: 35, spa: 70, spd: 30, spe: 40, bst: 300 },
  },
  teddiursa: {
    id: 216,
    name: "Teddiursa",
    types: ["Normal", "Ground"],
    abilities: ["Pickup"],
    nextEvolutions: [],
    stats: { hp: 60, atk: 80, def: 50, spa: 50, spd: 50, spe: 40, bst: 330 },
  },
  mareep: {
    id: 179,
    name: "Mareep",
    types: ["Electric"],
    abilities: ["Static"],
    nextEvolutions: [],
    stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35, bst: 280 },
  },
  audino: {
    id: 531,
    name: "Audino",
    types: ["Normal", "Fairy"],
    abilities: ["Regenerator"],
    nextEvolutions: [],
    stats: { hp: 103, atk: 60, def: 86, spa: 60, spd: 86, spe: 50, bst: 445 },
  },
  wingull: {
    id: 278,
    name: "Wingull",
    types: ["Water", "Flying"],
    abilities: ["Keen Eye"],
    nextEvolutions: [],
    stats: { hp: 40, atk: 30, def: 30, spa: 55, spd: 30, spe: 85, bst: 270 },
  },
  woobat: {
    id: 527,
    name: "Woobat",
    types: ["Psychic", "Flying"],
    abilities: ["Unaware"],
    nextEvolutions: [],
    stats: { hp: 55, atk: 45, def: 43, spa: 55, spd: 43, spe: 72, bst: 313 },
  },
  charmander: {
    id: 4,
    name: "Charmander",
    types: ["Fire"],
    abilities: ["Blaze"],
    nextEvolutions: ["Charmeleon"],
    stats: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65, bst: 309 },
  },
  charmeleon: {
    id: 5,
    name: "Charmeleon",
    types: ["Fire"],
    abilities: ["Blaze"],
    nextEvolutions: ["Charizard"],
    stats: { hp: 58, atk: 64, def: 58, spa: 80, spd: 65, spe: 80, bst: 405 },
  },
  charizard: {
    id: 6,
    name: "Charizard",
    types: ["Fire", "Dragon"],
    abilities: ["Blaze"],
    nextEvolutions: [],
    stats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100, bst: 534 },
  },
  larvlet: {
    id: 1002,
    name: "Larvlet",
    types: ["Bug"],
    abilities: ["Swarm"],
    nextEvolutions: ["Larvlord"],
    stats: { hp: 50, atk: 55, def: 45, spa: 40, spd: 45, spe: 50, bst: 285 },
  },
  larvlord: {
    id: 1003,
    name: "Larvlord",
    types: ["Fire", "Dark"],
    abilities: ["Flash Fire"],
    nextEvolutions: [],
    stats: { hp: 75, atk: 90, def: 70, spa: 60, spd: 70, spe: 85, bst: 450 },
  },
  ivydrake: {
    id: 999,
    name: "Ivydrake",
    types: ["Grass", "Dragon"],
    abilities: ["Overgrow"],
    nextEvolutions: [],
    stats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70, bst: 420 },
  },
};

function buildMember(species: string, overrides: Partial<ResolvedTeamMember & { locked?: boolean }> = {}) {
  const pokemon = POKEMON_INDEX[species.toLowerCase()];
  if (!pokemon) {
    throw new Error(`Missing fixture for ${species}`);
  }

  return {
    key: `${species}-key`,
    species,
    supportsGender: true,
    resolvedTypes: pokemon.types,
    resolvedStats: pokemon.stats,
    summaryStats: pokemon.stats,
    effectiveStats: pokemon.stats,
    abilities: pokemon.abilities,
    moves: [],
    ...overrides,
  } as ResolvedTeamMember & { locked?: boolean };
}

describe("buildSwapOpportunities", () => {
  beforeEach(() => {
    mocked.buildDecisionDeltas.mockReset();
    mocked.inferProjectedLevel.mockReset();
    mocked.inferProjectedLevel.mockReturnValue(24);
    mocked.projectCandidateMember.mockReset();
    mocked.buildTeamRoleSnapshot.mockReset();
    mocked.buildTeamRoleSnapshot.mockImplementation((team: Array<{ species: string }>) => ({
      members: team.map((member) => ({
        key: member.species,
        species: member.species,
        naturalRole: member.species === "Mareep" ? "support" : "bulkyPivot",
        recommendedRole: member.species === "Mareep" ? "support" : "bulkyPivot",
        matchedRoles: [],
        alternativeRoles: [],
        roleScores: {
          wallbreaker: 0,
          setupSweeper: 0,
          cleaner: 0,
          revengeKiller: 0,
          speedControl: 0,
          bulkyPivot: 0,
          support: 0,
          defensiveGlue: 0,
        },
        reasons: [],
        drivers: ["driver"],
      })),
      coveredRoles: [],
      missingRoles: [],
      redundantRoles: [],
      assignments: {
        wallbreaker: [],
        setupSweeper: [],
        cleaner: [],
        revengeKiller: [],
        speedControl: [],
        bulkyPivot: [],
        support: [],
        defensiveGlue: [],
      },
      compositionNotes: [],
    }));
  });

  it("returns an empty list when there is no next encounter or no active team", () => {
    expect(
      buildSwapOpportunities({
        docs: BASE_DOCS,
        team: [buildMember("Bellsprout")],
        nextEncounter: null,
        pokemonByName: POKEMON_INDEX,
        moveIndex: {},
        starter: "snivy",
        filters: BASE_FILTERS,
      }),
    ).toEqual([]);

    expect(
      buildSwapOpportunities({
        docs: BASE_DOCS,
        team: [],
        nextEncounter: NEXT_ENCOUNTER,
        pokemonByName: POKEMON_INDEX,
        moveIndex: {},
        starter: "snivy",
        filters: BASE_FILTERS,
      }),
    ).toEqual([]);
  });

  it("returns no opportunities when candidates are filtered out before delta generation", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: species === "Charmander" ? ["Fire", "Dragon"] : ["Electric"],
      moves: [],
    }));

    const docs: ParsedDocs = {
      ...BASE_DOCS,
      gifts: [
        { name: "Charmander", location: "Floccesy Ranch", level: "10", notes: [] },
      ],
    };

    const result = buildSwapOpportunities({
      docs,
      team: [
        buildMember("Snivy", { locked: true }),
        buildMember("Bellsprout"),
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: {
        ...BASE_FILTERS,
        excludeOtherStarters: true,
        excludeExactTypeDuplicates: true,
      },
    });

    expect(result).toEqual([]);
    expect(mocked.buildDecisionDeltas).not.toHaveBeenCalled();
  });

  it("filters off-starter species when excludeOtherStarters is enabled", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Fire"],
      moves: [],
    }));

    const docs: ParsedDocs = {
      ...BASE_DOCS,
      gifts: [{ name: "Charmander", location: "Floccesy Ranch", level: "10", notes: [] }],
    };

    const result = buildSwapOpportunities({
      docs,
      team: [buildMember("Teddiursa")],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: {
        ...BASE_FILTERS,
        excludeOtherStarters: true,
      },
    });

    expect(result).toEqual([]);
    expect(mocked.buildDecisionDeltas).not.toHaveBeenCalled();
  });

  it("filters candidates that overlap with a locked starter line or another locked member when duplicate filters are enabled", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => {
      if (species === "Bellsprout") {
        return {
          species: "Bellsprout",
          resolvedTypes: ["Grass", "Poison"],
          moves: [],
        };
      }

      if (species === "Woobat") {
        return {
          species: "Woobat",
          resolvedTypes: ["Psychic", "Flying"],
          moves: [],
        };
      }

      return null;
    });

    const starterLineDocs: ParsedDocs = {
      ...BASE_DOCS,
      gifts: [
        { name: "Bellsprout", location: "Floccesy Ranch", level: "10", notes: [] },
      ],
    };

    const lockedStarterResult = buildSwapOpportunities({
      docs: starterLineDocs,
      team: [
        buildMember("Snivy", { locked: true }),
        buildMember("Teddiursa"),
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(lockedStarterResult).toEqual([]);
    expect(mocked.buildDecisionDeltas).not.toHaveBeenCalled();

    const lockedDuplicateDocs: ParsedDocs = {
      ...BASE_DOCS,
      gifts: [
        { name: "Woobat", location: "Floccesy Ranch", level: "10", notes: [] },
      ],
    };

    const lockedDuplicateResult = buildSwapOpportunities({
      docs: lockedDuplicateDocs,
      team: [
        buildMember("Wingull", { locked: true }),
        buildMember("Teddiursa"),
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: {
        ...BASE_FILTERS,
        excludeExactTypeDuplicates: true,
      },
    });

    expect(lockedDuplicateResult).toEqual([]);
    expect(mocked.buildDecisionDeltas).not.toHaveBeenCalled();
  });

  it("prefers trade sources over wild ones and maps late encounters to the castelia checkpoint", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Electric"],
      moves: [{ name: "Thunder Shock", type: "Electric", damageClass: "special", power: 40 }],
    }));
    mocked.buildDecisionDeltas.mockReturnValue([]);

    buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        trades: [
          {
            name: "Static Trade",
            location: "Route 4",
            requested: "Snivy",
            received: "a Mareep.",
            traits: [],
          },
        ],
        wildAreas: [
          {
            area: "Route 4",
            methods: [
              {
                method: "Grass",
                encounters: [{ species: "Mareep", level: "18" }],
              },
            ],
          },
        ],
      },
      team: [buildMember("Teddiursa")],
      nextEncounter: {
        ...NEXT_ENCOUNTER,
        order: 12,
        label: "Elesa",
      },
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(mocked.inferProjectedLevel).toHaveBeenCalledWith(
      expect.any(Array),
      "castelia",
    );
    expect(mocked.buildDecisionDeltas).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpointId: "castelia",
        candidates: [
          expect.objectContaining({
            id: "trade-route-4-mareep",
            species: "Mareep",
            source: "Trade",
          }),
        ],
      }),
    );
  });

  it("maps early and midgame encounters to opening and virbank checkpoints", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Electric"],
      moves: [],
    }));
    mocked.buildDecisionDeltas.mockReturnValue([]);

    buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [
          { name: "Mareep", location: "Route 19", level: "10", notes: [] },
        ],
      },
      team: [buildMember("Teddiursa")],
      nextEncounter: {
        ...NEXT_ENCOUNTER,
        order: 2,
        label: "Cheren",
      },
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });
    expect(mocked.inferProjectedLevel).toHaveBeenLastCalledWith(expect.any(Array), "opening");

    buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [
          { name: "Mareep", location: "Virbank City", level: "10", notes: [] },
        ],
      },
      team: [buildMember("Teddiursa")],
      nextEncounter: {
        ...NEXT_ENCOUNTER,
        order: 7,
        label: "Burgh",
      },
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });
    expect(mocked.inferProjectedLevel).toHaveBeenLastCalledWith(expect.any(Array), "virbank");
  });

  it("returns no opportunities when candidate sources exist but projection fails or deltas do not map back to members", () => {
    mocked.projectCandidateMember.mockReturnValue(null);

    const docs: ParsedDocs = {
      ...BASE_DOCS,
      gifts: [
        { name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] },
      ],
    };

    expect(
      buildSwapOpportunities({
        docs,
        team: [buildMember("Teddiursa")],
        nextEncounter: NEXT_ENCOUNTER,
        pokemonByName: POKEMON_INDEX,
        moveIndex: {},
        starter: "snivy",
        filters: BASE_FILTERS,
      }),
    ).toEqual([]);
    expect(mocked.buildDecisionDeltas).not.toHaveBeenCalled();

    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Electric"],
      moves: [],
    }));
    mocked.buildDecisionDeltas.mockReturnValue([
      {
        id: "gift-floccesy-ranch-missing",
        species: "Mareep",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "breaker",
        canonicalRole: "wallbreaker",
        roleLabel: "breaker",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "MissingSlot",
        scoreDelta: 10,
        riskDelta: 4,
        projectedRisk: 6,
        offenseDelta: 1,
        defenseDelta: 1,
        speedDelta: 1,
        rolesDelta: 1,
        consistencyDelta: 1,
        gains: [],
        losses: [],
        projectedMoves: [],
      },
    ]);

    expect(
      buildSwapOpportunities({
        docs,
        team: [buildMember("Teddiursa", { locked: true })],
        nextEncounter: NEXT_ENCOUNTER,
        pokemonByName: POKEMON_INDEX,
        moveIndex: {},
        starter: "snivy",
        filters: BASE_FILTERS,
      }),
    ).toEqual([]);
  });

  it("falls back to wallbreaker metadata when role analysis returns no member snapshot", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Electric"],
      moves: [],
    }));
    mocked.buildTeamRoleSnapshot.mockReturnValue({
      members: [],
      coveredRoles: [],
      missingRoles: [],
      redundantRoles: [],
      assignments: {
        wallbreaker: [],
        setupSweeper: [],
        cleaner: [],
        revengeKiller: [],
        speedControl: [],
        bulkyPivot: [],
        support: [],
        defensiveGlue: [],
      },
      compositionNotes: [],
    });
    mocked.buildDecisionDeltas.mockReturnValue([]);

    buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [buildMember("Teddiursa")],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(mocked.buildDecisionDeltas).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: [
          expect.objectContaining({
            canonicalRole: "wallbreaker",
            roleReason: "Su perfil base encaja mejor para este tramo.",
          }),
        ],
      }),
    );
  });

  it("skips species already present on the team after sanitizing source names", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => {
      if (species === "Mareep") {
        return {
          species: "Mareep",
          resolvedTypes: ["Electric"],
          moves: [],
        };
      }

      return {
        species,
        resolvedTypes: ["Normal", "Ground"],
        moves: [],
      };
    });
    mocked.buildDecisionDeltas.mockReturnValue([]);

    buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "a Mareep.", location: "Floccesy Ranch", level: "10", notes: [] }],
        wildAreas: [
          {
            area: "Floccesy Ranch",
            methods: [
              {
                method: "Grass",
                encounters: [{ species: "a Teddiursa.", level: "10" }],
              },
            ],
          },
        ],
      },
      team: [buildMember("Teddiursa")],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(mocked.buildDecisionDeltas).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: [expect.objectContaining({ species: "Mareep" })],
      }),
    );
  });

  it("falls back to immediate line types when terminal evolution data is missing", () => {
    const pokemonIndexWithBrokenLine: Record<string, RemotePokemon> = {
      ...POKEMON_INDEX,
      protomon: {
        id: 1001,
        name: "Protomon",
        types: ["Ghost", "Poison"],
        abilities: ["Levitate"],
        nextEvolutions: ["Missingmon"],
        stats: { hp: 45, atk: 50, def: 45, spa: 65, spd: 50, spe: 55, bst: 310 },
      },
    };

    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Ghost", "Poison"],
      moves: [],
    }));

    const lockedGhostMember = {
      key: "shadelet-key",
      species: "Shadelet",
      supportsGender: true,
      resolvedTypes: ["Ghost", "Poison"],
      resolvedStats: { hp: 40, atk: 40, def: 40, spa: 40, spd: 40, spe: 40, bst: 240 },
      summaryStats: { hp: 40, atk: 40, def: 40, spa: 40, spd: 40, spe: 40, bst: 240 },
      effectiveStats: { hp: 40, atk: 40, def: 40, spa: 40, spd: 40, spe: 40, bst: 240 },
      abilities: ["Levitate"],
      moves: [],
      locked: true,
    } as ResolvedTeamMember & { locked: boolean };

    const result = buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Protomon", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [lockedGhostMember],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: pokemonIndexWithBrokenLine,
      moveIndex: {},
      starter: "snivy",
      filters: {
        ...BASE_FILTERS,
        excludeExactTypeDuplicates: true,
      },
    });

    expect(result).toEqual([]);
    expect(mocked.buildDecisionDeltas).not.toHaveBeenCalled();
  });

  it("uses terminal evolution types when a candidate line resolves successfully", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Bug"],
      moves: [],
    }));
    mocked.buildDecisionDeltas.mockReturnValue([]);

    const result = buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Larvlet", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [
        buildMember("Bellsprout", { locked: true, resolvedTypes: ["Fire", "Dark"] }),
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: {
        ...BASE_FILTERS,
        excludeExactTypeDuplicates: true,
      },
    });

    expect(result).toEqual([]);
    expect(mocked.buildDecisionDeltas).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: [expect.objectContaining({ species: "Larvlet" })],
      }),
    );
  });

  it("falls back to locked member resolved types when its species is missing from the pokemon index", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Fire", "Dark"],
      moves: [],
    }));

    const result = buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Charmander", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [
        {
          key: "unknown-lock",
          species: "Unknown Lock",
          supportsGender: true,
          resolvedTypes: ["Fire", "Dark"],
          resolvedStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 },
          summaryStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 },
          effectiveStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 },
          abilities: ["Pressure"],
          moves: [],
          locked: true,
        } as ResolvedTeamMember & { locked: boolean },
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: {
        ...BASE_FILTERS,
        excludeExactTypeDuplicates: true,
      },
    });

    expect(result).toEqual([]);
    expect(mocked.buildDecisionDeltas).not.toHaveBeenCalled();
  });

  it("builds grouped swap opportunities from prioritized candidate sources", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => {
      if (species === "Mareep") {
        return {
          species: "Mareep",
          resolvedTypes: ["Electric"],
          moves: [
            { name: "Thunder Shock", type: "Electric", damageClass: "special", power: 40 },
          ],
        };
      }

      if (species === "Audino") {
        return {
          species: "Audino",
          resolvedTypes: ["Normal", "Fairy"],
          moves: [
            { name: "Disarming Voice", type: "Fairy", damageClass: "special", power: 40 },
          ],
        };
      }

      return null;
    });

    mocked.buildDecisionDeltas.mockReturnValue([
      {
        id: "gift-floccesy-ranch-audino",
        species: "Audino",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "glue",
        canonicalRole: "bulkyPivot",
        roleLabel: "glue",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "Bellsprout",
        scoreDelta: 18,
        riskDelta: 4,
        projectedRisk: 9,
        offenseDelta: 1,
        defenseDelta: 3,
        speedDelta: 0,
        rolesDelta: 1,
        consistencyDelta: 2,
        gains: [],
        losses: [],
        projectedMoves: ["Disarming Voice"],
        duplicatePenalty: 0,
      },
      {
        id: "gift-floccesy-ranch-mareep",
        species: "Mareep",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "support",
        canonicalRole: "support",
        roleLabel: "support",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "Bellsprout",
        scoreDelta: 15,
        riskDelta: 6,
        projectedRisk: 7,
        offenseDelta: 2,
        defenseDelta: 4,
        speedDelta: 1,
        rolesDelta: 2,
        consistencyDelta: 1,
        gains: [],
        losses: [],
        projectedMoves: ["Thunder Shock"],
        duplicatePenalty: 0,
      },
      {
        id: "gift-floccesy-ranch-audino",
        species: "Audino",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "glue",
        canonicalRole: "bulkyPivot",
        roleLabel: "glue",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "Teddiursa",
        scoreDelta: 11,
        riskDelta: 5,
        projectedRisk: 8,
        offenseDelta: 1,
        defenseDelta: 2,
        speedDelta: 0,
        rolesDelta: 1,
        consistencyDelta: 1,
        gains: [],
        losses: [],
        projectedMoves: ["Disarming Voice"],
        duplicatePenalty: 0,
      },
      {
        id: "gift-floccesy-ranch-mareep",
        species: "Mareep",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "support",
        canonicalRole: "support",
        roleLabel: "support",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "skip",
        scoreDelta: 99,
        riskDelta: 99,
        projectedRisk: 1,
        offenseDelta: 0,
        defenseDelta: 0,
        speedDelta: 0,
        rolesDelta: 0,
        consistencyDelta: 0,
        gains: [],
        losses: [],
        projectedMoves: [],
      },
    ]);

    const docs: ParsedDocs = {
      ...BASE_DOCS,
      gifts: [
        { name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] },
        { name: "Mystery Egg", location: "Floccesy Ranch", level: "10", notes: ["Contains Audino"] },
      ],
      wildAreas: [
        {
          area: "Floccesy Ranch",
          methods: [
            {
              method: "Grass",
              encounters: [{ species: "Mareep", level: "10" }],
            },
          ],
        },
      ],
    };

    const result = buildSwapOpportunities({
      docs,
      team: [
        buildMember("Bellsprout", {
          moves: [{ name: "Vine Whip", type: "Grass", damageClass: "physical", power: 45 }],
        }),
        buildMember("Teddiursa", {
          moves: [{ name: "Scratch", type: "Normal", damageClass: "physical", power: 40 }],
        }),
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(mocked.buildDecisionDeltas).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpointId: "floccesy",
        candidates: expect.arrayContaining([
          expect.objectContaining({
            id: "gift-floccesy-ranch-mareep",
            species: "Mareep",
            source: "Gift",
          }),
          expect.objectContaining({
            id: "gift-floccesy-ranch-audino",
            species: "Audino",
            source: "Gift",
          }),
        ]),
      }),
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        candidateSpecies: "Mareep",
        source: "Gift",
        area: "Floccesy Ranch",
        replacedSpecies: "Bellsprout",
        candidateRole: "support",
        replacedRole: "bulky pivot",
        riskDelta: 6,
      }),
    );
    expect(result[0]?.attackUpsides).toContain("Flying");
    expect(result[0]?.defenseUpsides).toContain("Flying");

    expect(result[1]).toEqual(
      expect.objectContaining({
        candidateSpecies: "Audino",
        replacedSpecies: "Teddiursa",
      }),
    );
  });

  it("uses boss teams to derive encounter edges and ignores status or typeless moves", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => {
      if (species === "Mareep") {
        return {
          species: "Mareep",
          resolvedTypes: ["Electric"],
          moves: [
            { name: "Thunder Wave", type: "Electric", damageClass: "status", power: null },
            { name: "Mystery Pulse", damageClass: "special", power: 70 },
            { name: "Thunder Shock", type: "Electric", damageClass: "special", power: 40 },
          ],
        };
      }

      return null;
    });

    mocked.buildDecisionDeltas.mockReturnValue([
      {
        id: "gift-floccesy-ranch-mareep",
        species: "Mareep",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "support",
        canonicalRole: "support",
        roleLabel: "support",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "Teddiursa",
        scoreDelta: 12,
        riskDelta: 5,
        projectedRisk: 7,
        offenseDelta: 2,
        defenseDelta: 2,
        speedDelta: 1,
        rolesDelta: 1,
        consistencyDelta: 1,
        gains: [],
        losses: [],
        projectedMoves: ["Thunder Shock"],
        duplicatePenalty: 0,
      },
    ]);

    const result = buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [
        buildMember("Teddiursa", {
          moves: [
            { name: "Leer", damageClass: "status" },
            { name: "Scratch", type: "Normal", damageClass: "physical", power: 40 },
          ],
        }),
      ],
      nextEncounter: {
        ...NEXT_ENCOUNTER,
        team: undefined,
        bosses: [{ label: "Sky Duo", team: ["Wingull", "Woobat"] }],
      },
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.attackUpsides).toContain("Water");
    expect(result[0]?.defenseUpsides).toContain("Flying");
  });

  it("breaks grouped slot ties with scoreDelta when riskDelta is equal", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => {
      if (species === "Mareep") {
        return {
          species: "Mareep",
          resolvedTypes: ["Electric"],
          moves: [{ name: "Thunder Shock", type: "Electric", damageClass: "special", power: 40 }],
        };
      }

      if (species === "Audino") {
        return {
          species: "Audino",
          resolvedTypes: ["Normal", "Fairy"],
          moves: [{ name: "Disarming Voice", type: "Fairy", damageClass: "special", power: 40 }],
        };
      }

      return null;
    });

    mocked.buildDecisionDeltas.mockReturnValue([
      {
        id: "gift-floccesy-ranch-mareep",
        species: "Mareep",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "support",
        canonicalRole: "support",
        roleLabel: "support",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "Bellsprout",
        scoreDelta: 11,
        riskDelta: 4,
        projectedRisk: 7,
        offenseDelta: 1,
        defenseDelta: 2,
        speedDelta: 1,
        rolesDelta: 1,
        consistencyDelta: 1,
        gains: [],
        losses: [],
        projectedMoves: ["Thunder Shock"],
        duplicatePenalty: 0,
      },
      {
        id: "gift-floccesy-ranch-audino",
        species: "Audino",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "glue",
        canonicalRole: "bulkyPivot",
        roleLabel: "glue",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "Bellsprout",
        scoreDelta: 17,
        riskDelta: 4,
        projectedRisk: 7,
        offenseDelta: 1,
        defenseDelta: 2,
        speedDelta: 0,
        rolesDelta: 1,
        consistencyDelta: 1,
        gains: [],
        losses: [],
        projectedMoves: ["Disarming Voice"],
        duplicatePenalty: 0,
      },
    ]);

    const result = buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [
          { name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] },
          { name: "Audino", location: "Floccesy Ranch", level: "10", notes: [] },
        ],
      },
      team: [buildMember("Bellsprout")],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        candidateSpecies: "Audino",
        replacedSpecies: "Bellsprout",
        riskDelta: 4,
        scoreDelta: 17,
      }),
    );
  });

  it("applies exact type duplicate penalties for starter-line exact matches without hitting the locked guard", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Grass", "Dragon"],
      moves: [],
    }));
    mocked.buildDecisionDeltas.mockReturnValue([
      {
        id: "gift-floccesy-ranch-ivydrake",
        species: "Ivydrake",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "support",
        canonicalRole: "support",
        roleLabel: "support",
        teamFitNote: "fit",
        roleReason: "reason",
        area: "Floccesy Ranch",
        action: "replace",
        replacedSlot: "Teddiursa",
        scoreDelta: 10,
        riskDelta: 5,
        projectedRisk: 6,
        offenseDelta: 1,
        defenseDelta: 1,
        speedDelta: 1,
        rolesDelta: 1,
        consistencyDelta: 1,
        gains: [],
        losses: [],
        projectedMoves: [],
      },
    ]);

    buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Ivydrake", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [
        buildMember("Serperior"),
        buildMember("Teddiursa"),
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(mocked.buildDecisionDeltas).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: [
          expect.objectContaining({
            species: "Ivydrake",
            duplicatePenalty: 4,
          }),
        ],
      }),
    );
  });

  it("falls back to current member species key, canonical role and missing optional delta fields", () => {
    mocked.projectCandidateMember.mockImplementation(({ species }: { species: string }) => ({
      species,
      resolvedTypes: ["Electric"],
      moves: [
        { name: "Thunder Shock", type: "Electric", damageClass: "special", power: 40 },
      ],
    }));
    mocked.buildTeamRoleSnapshot.mockImplementation((team: Array<{ species: string }>) => ({
      members: team[0]?.species === "Mareep"
        ? []
        : [
            {
              key: team[0]?.species,
              species: team[0]?.species,
              naturalRole: "bulkyPivot",
              recommendedRole: "bulkyPivot",
              matchedRoles: [],
              alternativeRoles: [],
              roleScores: {
                wallbreaker: 0,
                setupSweeper: 0,
                cleaner: 0,
                revengeKiller: 0,
                speedControl: 0,
                bulkyPivot: 0,
                support: 0,
                defensiveGlue: 0,
              },
              reasons: [],
              drivers: ["driver"],
            },
          ],
      coveredRoles: [],
      missingRoles: [],
      redundantRoles: [],
      assignments: {
        wallbreaker: [],
        setupSweeper: [],
        cleaner: [],
        revengeKiller: [],
        speedControl: [],
        bulkyPivot: [],
        support: [],
        defensiveGlue: [],
      },
      compositionNotes: [],
    }));
    mocked.buildDecisionDeltas.mockReturnValue([
      {
        id: "gift-floccesy-ranch-mareep",
        species: "Mareep",
        source: "Gift",
        reason: "Gift disponible en Floccesy Ranch",
        role: "support",
        canonicalRole: "support",
        roleLabel: "support",
        teamFitNote: "fit",
        roleReason: "reason",
        action: "replace",
        replacedSlot: "Teddiursa",
        scoreDelta: 8,
        riskDelta: 3,
        projectedRisk: 4,
        offenseDelta: 1,
        defenseDelta: 2,
        speedDelta: 1,
        rolesDelta: 1,
        consistencyDelta: 0,
        gains: [],
        losses: [],
        projectedMoves: ["Thunder Shock"],
      },
    ]);

    const result = buildSwapOpportunities({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [buildMember("Teddiursa", { key: undefined, moves: [] })],
      nextEncounter: {
        ...NEXT_ENCOUNTER,
        team: [],
        bosses: [{ name: "Roxie", team: ["Wingull", "Woobat"] }] as never,
      },
      pokemonByName: POKEMON_INDEX,
      moveIndex: {},
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    expect(result[0]).toMatchObject({
      candidateRole: "support",
      area: "",
      replacedRole: "bulky pivot",
      duplicatePenalty: 0,
      replacedSpecies: "Teddiursa",
    });
    expect(result[0]?.attackUpsides).toContain("Flying");
    expect(result[0]?.defenseUpsides).toContain("Flying");
  });
});
