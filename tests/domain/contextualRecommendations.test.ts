import { test, assert, vi } from "vitest";

import { buildAreaSources } from "../../lib/builder";
import { buildCaptureRecommendations } from "../../lib/domain/contextualRecommendations";
import type { ParsedDocs } from "../../lib/docsSchema";
import type { RecommendationFilters } from "../../lib/builder";
import { getContextualSourceAreas, type RunEncounterDefinition } from "../../lib/runEncounters";
import type { RemotePokemon, ResolvedTeamMember } from "../../lib/teamAnalysis";
import type { WorldData } from "../../lib/worldDataSchema";

const BASE_FILTERS: RecommendationFilters = {
  excludeLegendaries: false,
  excludePseudoLegendaries: false,
  excludeUniquePokemon: false,
  excludeOtherStarters: false,
  excludeExactTypeDuplicates: false,
};

const NEXT_ENCOUNTER: RunEncounterDefinition = {
  id: "roxanne",
  order: 5,
  label: "Roxanne",
  category: "hoenn",
  affiliation: "hoenn-leaders",
  team: ["Lileep"],
  mode: "challenge",
  mandatory: false,
  levelCap: 13,
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
  gifts: [
    {
      name: "Charmander",
      location: "Floccesy Ranch",
      level: "10",
      notes: [],
    },
    {
      name: "Mareep",
      location: "Floccesy Ranch",
      level: "10",
      notes: [],
    },
    {
      name: "Bellsprout",
      location: "Floccesy Ranch",
      level: "10",
      notes: [],
    },
    {
      name: "Beldum",
      location: "Floccesy Ranch",
      level: "10",
      notes: [],
    },
  ],
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
    learnsets: {
      levelUp: [
        { level: 1, move: "Vine Whip" },
      ],
      machines: [],
    },
  },
  servine: {
    id: 496,
    name: "Servine",
    types: ["Grass"],
    abilities: ["Overgrow"],
    nextEvolutions: ["Serperior"],
    stats: { hp: 60, atk: 60, def: 75, spa: 60, spd: 75, spe: 83, bst: 413 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Leaf Tornado" },
      ],
      machines: [],
    },
  },
  serperior: {
    id: 497,
    name: "Serperior",
    types: ["Grass", "Dragon"],
    abilities: ["Contrary"],
    nextEvolutions: [],
    stats: { hp: 75, atk: 75, def: 95, spa: 75, spd: 95, spe: 113, bst: 528 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Leaf Storm" },
      ],
      machines: [],
    },
  },
  charmander: {
    id: 4,
    name: "Charmander",
    types: ["Fire"],
    abilities: ["Blaze"],
    nextEvolutions: ["Charmeleon"],
    stats: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65, bst: 309 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Ember" },
      ],
      machines: [],
    },
  },
  charmeleon: {
    id: 5,
    name: "Charmeleon",
    types: ["Fire"],
    abilities: ["Blaze"],
    nextEvolutions: ["Charizard"],
    stats: { hp: 58, atk: 64, def: 58, spa: 80, spd: 65, spe: 80, bst: 405 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Flame Burst" },
      ],
      machines: [],
    },
  },
  charizard: {
    id: 6,
    name: "Charizard",
    types: ["Fire", "Dragon"],
    abilities: ["Blaze"],
    nextEvolutions: [],
    stats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100, bst: 534 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Flamethrower" },
      ],
      machines: [],
    },
  },
  mareep: {
    id: 179,
    name: "Mareep",
    types: ["Electric"],
    abilities: ["Static"],
    nextEvolutions: [],
    stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35, bst: 280 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Thunder Shock" },
      ],
      machines: [],
    },
  },
  bellsprout: {
    id: 69,
    name: "Bellsprout",
    types: ["Grass"],
    abilities: ["Chlorophyll"],
    nextEvolutions: [],
    stats: { hp: 50, atk: 75, def: 35, spa: 70, spd: 30, spe: 40, bst: 300 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Vine Whip" },
      ],
      machines: [],
    },
  },
  teddiursa: {
    id: 216,
    name: "Teddiursa",
    types: ["Normal", "Ground"],
    abilities: ["Pickup"],
    nextEvolutions: [],
    stats: { hp: 60, atk: 80, def: 50, spa: 50, spd: 50, spe: 40, bst: 330 },
    learnsets: {
      levelUp: [{ level: 1, move: "Scratch" }],
      machines: [],
    },
  },
  audino: {
    id: 531,
    name: "Audino",
    types: ["Normal", "Fairy"],
    abilities: ["Regenerator"],
    nextEvolutions: [],
    stats: { hp: 103, atk: 60, def: 86, spa: 60, spd: 86, spe: 50, bst: 445 },
    learnsets: {
      levelUp: [{ level: 1, move: "Disarming Voice" }],
      machines: [],
    },
  },
  castform: {
    id: 351,
    name: "Castform",
    types: ["Normal", "Fairy"],
    abilities: ["Forecast"],
    nextEvolutions: [],
    stats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70, bst: 420 },
    learnsets: {
      levelUp: [{ level: 1, move: "Tackle" }],
      machines: [],
    },
  },
  beldum: {
    id: 374,
    name: "Beldum",
    types: ["Steel", "Psychic"],
    abilities: ["Clear Body"],
    nextEvolutions: [],
    stats: { hp: 40, atk: 55, def: 80, spa: 35, spd: 60, spe: 30, bst: 300 },
    learnsets: {
      levelUp: [{ level: 1, move: "Tackle" }],
      machines: [],
    },
  },
};

const MOVE_INDEX = {
  ember: { name: "Ember", type: "Fire", damageClass: "special", power: 40, accuracy: 100 },
  "flame-burst": { name: "Flame Burst", type: "Fire", damageClass: "special", power: 70, accuracy: 100 },
  flamethrower: { name: "Flamethrower", type: "Fire", damageClass: "special", power: 90, accuracy: 100 },
  "thunder-shock": { name: "Thunder Shock", type: "Electric", damageClass: "special", power: 40, accuracy: 100 },
  "vine-whip": { name: "Vine Whip", type: "Grass", damageClass: "physical", power: 45, accuracy: 100 },
  "leaf-tornado": { name: "Leaf Tornado", type: "Grass", damageClass: "special", power: 65, accuracy: 90 },
  "leaf-storm": { name: "Leaf Storm", type: "Grass", damageClass: "special", power: 130, accuracy: 90 },
  scratch: { name: "Scratch", type: "Normal", damageClass: "physical", power: 40, accuracy: 100 },
  "disarming-voice": { name: "Disarming Voice", type: "Fairy", damageClass: "special", power: 40, accuracy: 100 },
  tackle: { name: "Tackle", type: "Normal", damageClass: "physical", power: 40, accuracy: 100 },
};

function buildResolvedMember(species: string, locked: boolean, types: string[]): ResolvedTeamMember & { locked?: boolean } {
  const pokemon = POKEMON_INDEX[species.toLowerCase()];
  if (!pokemon) {
    throw new Error(`Missing pokemon fixture for ${species}`);
  }

  return {
    key: `${species}-key`,
    species,
    supportsGender: true,
    locked,
    resolvedTypes: types,
    resolvedStats: pokemon.stats,
    summaryStats: pokemon.stats,
    effectiveStats: pokemon.stats,
    abilities: pokemon.abilities,
    moves: [],
  };
}

test("respects excludeOtherStarters for contextual captures", () => {
  const recommendations = buildCaptureRecommendations({
    docs: BASE_DOCS,
    team: [],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: {
      ...BASE_FILTERS,
      excludeOtherStarters: true,
    },
  });

  assert.ok(!recommendations.some((entry) => entry.species === "Charmander"));
  assert.ok(recommendations.some((entry) => entry.species === "Mareep"));
});

test("blocks candidates that overlap with the locked starter line final types", () => {
  const recommendations = buildCaptureRecommendations({
    docs: BASE_DOCS,
    team: [
      buildResolvedMember("Snivy", true, ["Grass"]),
    ],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });

  assert.ok(!recommendations.some((entry) => entry.species === "Charmander"));
  assert.ok(recommendations.some((entry) => entry.species === "Mareep"));
});

test("excludes exact type duplicates when the filter is enabled", () => {
  const recommendations = buildCaptureRecommendations({
    docs: BASE_DOCS,
    team: [
      buildResolvedMember("Snivy", false, ["Grass"]),
    ],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: {
      ...BASE_FILTERS,
      excludeExactTypeDuplicates: true,
    },
  });

  assert.ok(!recommendations.some((entry) => entry.species === "Bellsprout"));
  assert.ok(recommendations.some((entry) => entry.species === "Mareep"));
});

test("respects excludePseudoLegendaries for contextual captures", () => {
  const recommendations = buildCaptureRecommendations({
    docs: BASE_DOCS,
    team: [],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: {
      ...BASE_FILTERS,
      excludePseudoLegendaries: true,
    },
  });

  assert.ok(!recommendations.some((entry) => entry.species === "Beldum"));
  assert.ok(recommendations.some((entry) => entry.species === "Mareep"));
});

test("excludes candidates that share any type with a locked member when duplicate-type filter is enabled", () => {
  const docs: ParsedDocs = {
    ...BASE_DOCS,
    gifts: [
      {
        name: "Audino",
        location: "Floccesy Ranch",
        level: "10",
        notes: [],
      },
      {
        name: "Mareep",
        location: "Floccesy Ranch",
        level: "10",
        notes: [],
      },
    ],
  };

  const recommendations = buildCaptureRecommendations({
    docs,
    team: [
      buildResolvedMember("Teddiursa", true, ["Normal", "Ground"]),
    ],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: {
      ...BASE_FILTERS,
      excludeExactTypeDuplicates: true,
    },
  });

  assert.ok(!recommendations.some((entry) => entry.species === "Audino"));
  assert.ok(recommendations.some((entry) => entry.species === "Mareep"));
});

test("uses Castelia sources when the next encounter is Burgh", () => {
  assert.deepEqual(getContextualSourceAreas(8), [
    "Castelia City",
    "Castelia Sewers",
    "Relic Passage - Castelia",
    "Route 4",
  ]);
});

test("filters checkpoint source cards by locked-type exclusions", () => {
  const docsWithWorldData = {
    ...BASE_DOCS,
    worldData: {
      gifts: [],
      trades: [],
      items: [],
      wildAreas: [
        {
          area: "Castelia Sewers",
          methods: [
            {
              method: "Grass",
              encounters: [
                { species: "Audino", level: "20" },
                { species: "Castform", level: "20" },
                { species: "Mareep", level: "20" },
              ],
            },
          ],
        },
      ],
    } satisfies WorldData,
  } as ParsedDocs & { worldData: WorldData };

  const sources = buildAreaSources(
    docsWithWorldData,
    ["Castelia Sewers"],
    "snivy",
    {
      ...BASE_FILTERS,
      excludeExactTypeDuplicates: true,
    },
    {
      team: [
        buildResolvedMember("Teddiursa", true, ["Normal", "Ground"]),
      ],
      pokemonByName: POKEMON_INDEX,
    },
  );

  assert.deepEqual(sources[0]?.encounters, ["Mareep (Grass)"]);
});

test("returns no contextual captures when there is no next encounter or the team is already full", () => {
  assert.deepEqual(
    buildCaptureRecommendations({
      docs: BASE_DOCS,
      team: [],
      nextEncounter: null,
      pokemonByName: POKEMON_INDEX,
      moveIndex: MOVE_INDEX,
      starter: "snivy",
      filters: BASE_FILTERS,
    }),
    [],
  );

  assert.deepEqual(
    buildCaptureRecommendations({
      docs: BASE_DOCS,
      team: [
        buildResolvedMember("Snivy", false, ["Grass"]),
        buildResolvedMember("Mareep", false, ["Electric"]),
        buildResolvedMember("Bellsprout", false, ["Grass"]),
        buildResolvedMember("Teddiursa", false, ["Normal", "Ground"]),
        buildResolvedMember("Audino", false, ["Normal", "Fairy"]),
        buildResolvedMember("Castform", false, ["Normal", "Fairy"]),
      ],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: MOVE_INDEX,
      starter: "snivy",
      filters: BASE_FILTERS,
    }),
    [],
  );
});

test("returns no contextual captures when no candidate source resolves to a known pokemon", () => {
  const docs: ParsedDocs = {
    ...BASE_DOCS,
    gifts: [
      {
        name: "Mystery Egg",
        location: "Floccesy Ranch",
        level: "10",
        notes: ["Contains something unknown."],
      },
    ],
  };

  const recommendations = buildCaptureRecommendations({
    docs,
    team: [],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });

  assert.deepEqual(recommendations, []);
});

test("returns no contextual captures when a known candidate cannot be projected", () => {
  const recommendations = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      gifts: [
        {
          name: "Statlessmon",
          location: "Floccesy Ranch",
          level: "10",
          notes: [],
        },
      ],
    },
    team: [],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: {
      ...POKEMON_INDEX,
      statlessmon: {
        id: 1001,
        name: "Statlessmon",
        types: ["Normal"],
        abilities: ["Run Away"],
        nextEvolutions: [],
      } as RemotePokemon,
    },
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });

  assert.deepEqual(recommendations, []);
});

test("prefers gift over trade and wild sources for the same species and can extract species from gift notes", () => {
  const docs: ParsedDocs = {
    ...BASE_DOCS,
    gifts: [
      {
        name: "Mystery Egg",
        location: "Floccesy Ranch",
        level: "10",
        notes: ["This gift contains Mareep."],
      },
    ],
    trades: [
      {
        name: "Mareep Trade",
        location: "Floccesy Ranch",
        requested: "a Snivy",
        received: "Mareep",
        traits: [],
      },
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

  const recommendations = buildCaptureRecommendations({
    docs,
    team: [],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });

  const mareep = recommendations.find((entry) => entry.species === "Mareep");
  assert.ok(mareep);
  assert.equal(mareep?.source, "Gift");
  assert.equal(mareep?.area, "Floccesy Ranch");
});

test("can still recommend very weak projected candidates when they are the only valid source", () => {
  const recommendations = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      gifts: [
        {
          name: "Missingmon",
          location: "Route 19",
          level: "5",
          notes: [],
        },
      ],
    },
    team: [],
    nextEncounter: {
      ...NEXT_ENCOUNTER,
      order: 2,
      label: "Cheren",
    },
    pokemonByName: {
      ...POKEMON_INDEX,
      missingmon: {
        id: 999,
        name: "Missingmon",
        types: [],
        abilities: [],
        nextEvolutions: [],
        stats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1, bst: 6 },
      },
    },
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });

  assert.equal(recommendations[0]?.species, "Missingmon");
  assert.equal(recommendations[0]?.source, "Gift");
});

test("allows exact-type duplicates when the duplicate filter is disabled", () => {
  const recommendations = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      gifts: [
        {
          name: "Bellsprout",
          location: "Route 19",
          level: "5",
          notes: [],
        },
      ],
    },
    team: [
      buildResolvedMember("Snivy", false, ["Grass"]),
    ],
    nextEncounter: {
      ...NEXT_ENCOUNTER,
      order: 2,
      label: "Cheren",
    },
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: {
      ...BASE_FILTERS,
      excludeExactTypeDuplicates: false,
    },
  });

  const bellsprout = recommendations.find((entry) => entry.species === "Bellsprout");
  assert.ok(bellsprout);
  assert.equal(bellsprout?.delta.action, "add");
});

test("maps opening, virbank, and castelia checkpoints for contextual captures", () => {
  const opening = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      gifts: [{ name: "Mareep", location: "Route 19", level: "5", notes: [] }],
    },
    team: [],
    nextEncounter: { ...NEXT_ENCOUNTER, order: 2 },
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });
  const virbank = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      gifts: [{ name: "Mareep", location: "Virbank City", level: "15", notes: [] }],
    },
    team: [],
    nextEncounter: { ...NEXT_ENCOUNTER, order: 7 },
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });
  const castelia = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      gifts: [{ name: "Mareep", location: "Route 4", level: "18", notes: [] }],
    },
    team: [],
    nextEncounter: { ...NEXT_ENCOUNTER, order: 12 },
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });

  assert.ok(opening.some((entry) => entry.species === "Mareep"));
  assert.ok(virbank.some((entry) => entry.species === "Mareep"));
  assert.ok(castelia.some((entry) => entry.species === "Mareep"));
});

test("skips sanitized empty species and ignores species already present after sanitizing", () => {
  const recommendations = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      trades: [
        {
          name: "Broken trade",
          location: "Floccesy Ranch",
          requested: "anything",
          received: "a .",
          traits: [],
        },
        {
          name: "Repeat Mareep",
          location: "Floccesy Ranch",
          requested: "anything",
          received: "a Mareep.",
          traits: [],
        },
      ],
      gifts: [],
    },
    team: [buildResolvedMember("Mareep", false, ["Electric"])],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName: POKEMON_INDEX,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: BASE_FILTERS,
  });

  assert.ok(!recommendations.some((entry) => entry.species === "."));
  assert.ok(!recommendations.some((entry) => entry.species === "Mareep"));
});

test("falls back to resolved types when comparable type lookup hits missing or cyclic data", () => {
  const pokemonByName: Record<string, RemotePokemon> = {
    ...POKEMON_INDEX,
    cycmon: {
      id: 1000,
      name: "Cycmon",
      types: ["Bug"],
      abilities: ["Shed Skin"],
      nextEvolutions: ["Cycmon"],
      stats: { hp: 60, atk: 60, def: 60, spa: 60, spd: 60, spe: 60, bst: 360 },
      learnsets: {
        levelUp: [{ level: 1, move: "Tackle" }],
        machines: [],
      },
    },
  };

  const recommendations = buildCaptureRecommendations({
    docs: {
      ...BASE_DOCS,
      gifts: [
        {
          name: "Cycmon",
          location: "Floccesy Ranch",
          level: "10",
          notes: [],
        },
      ],
    },
    team: [
      {
        key: "unknown-key",
        species: "Unknownmon",
        supportsGender: true,
        locked: true,
        resolvedTypes: ["Ghost"],
        resolvedStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 },
        summaryStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 },
        effectiveStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 },
        abilities: ["Pressure"],
        moves: [],
      },
    ],
    nextEncounter: NEXT_ENCOUNTER,
    pokemonByName,
    moveIndex: MOVE_INDEX,
    starter: "snivy",
    filters: {
      ...BASE_FILTERS,
      excludeExactTypeDuplicates: true,
    },
  });

  const cycmon = recommendations.find((entry) => entry.species === "Cycmon");
  assert.ok(cycmon);
  assert.equal(cycmon?.candidateMember.resolvedTypes[0], "Bug");
});

test("drops add deltas that do not map back to a projected candidate member", async () => {
  vi.resetModules();
  vi.doMock("../../lib/domain/decisionDelta", async () => {
    const actual = await vi.importActual<typeof import("../../lib/domain/decisionDelta")>("../../lib/domain/decisionDelta");
    return {
      ...actual,
      buildDecisionDeltas: () => [
        {
          id: "ghost-id",
          species: "Mareep",
          source: "Gift",
          reason: "Gift disponible en Floccesy Ranch",
          role: "support",
          canonicalRole: "support",
          roleLabel: "support",
          teamFitNote: "fit",
          roleReason: "reason",
          area: "Floccesy Ranch",
          action: "add",
          scoreDelta: 5,
          riskDelta: 3,
          projectedRisk: 4,
          offenseDelta: 1,
          defenseDelta: 1,
          speedDelta: 1,
          rolesDelta: 1,
          consistencyDelta: 1,
          gains: [],
          losses: [],
          projectedMoves: ["Thunder Shock"],
        },
      ],
    };
  });

  try {
    const { buildCaptureRecommendations: buildCaptureRecommendationsWithMock } = await import("../../lib/domain/contextualRecommendations");

    const recommendations = buildCaptureRecommendationsWithMock({
      docs: {
        ...BASE_DOCS,
        gifts: [{ name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] }],
      },
      team: [],
      nextEncounter: NEXT_ENCOUNTER,
      pokemonByName: POKEMON_INDEX,
      moveIndex: MOVE_INDEX,
      starter: "snivy",
      filters: BASE_FILTERS,
    });

    assert.deepEqual(recommendations, []);
  } finally {
    vi.doUnmock("../../lib/domain/decisionDelta");
    vi.resetModules();
  }
});
