import { describe, expect, it } from "vitest";

import {
  buildAreaSources,
  getRecommendation,
  isRecommendationSpeciesAllowed,
  normalizeRecommendationName,
  starters,
  type RecommendationFilters,
} from "../lib/builder";
import type { ParsedDocs } from "../lib/docsSchema";
import type { RemotePokemon, ResolvedTeamMember } from "../lib/teamAnalysis";

function createDocs(): ParsedDocs & {
  worldData: {
    gifts: Array<{ name: string; location: string; level: string; notes: string[] }>;
    trades: Array<{ name: string; location: string; requested: string; received: string; traits: string[] }>;
    items: Array<{ area: string; items: string[] }>;
    wildAreas: Array<{
      area: string;
      methods: Array<{
        method: string;
        encounters: Array<{ species: string; level: string; rate?: string | null }>;
      }>;
    }>;
  };
} {
  return {
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
    worldData: {
      gifts: [
        { name: "Eevee", location: "Castelia City", level: "20", notes: [] },
        { name: "Victini", location: "Castelia City", level: "20", notes: [] },
      ],
      trades: [
        {
          name: "Togepi Trade",
          location: "Castelia City",
          requested: "a Meowth",
          received: "Togepi",
          traits: [],
        },
      ],
      items: [
        {
          area: "Castelia City",
          items: ["Potion", "Berry Juice", "Rare Candy", "X Attack", "Repel", "Ether"],
        },
      ],
      wildAreas: [
        {
          area: "Castelia City",
          methods: [
            {
              method: "Grass",
              encounters: [
                { species: "Mareep", level: "12" },
                { species: "Pikachu", level: "12" },
                { species: "Dragonite", level: "12" },
                { species: "Mew", level: "12" },
                { species: "Riolu", level: "12" },
              ],
            },
            {
              method: "Surf",
              encounters: [
                { species: "Azumarill", level: "15" },
                { species: "Magnemite", level: "15" },
                { species: "Rotom", level: "15" },
                { species: "Eevee", level: "15" },
                { species: "Lucario", level: "15" },
              ],
            },
            {
              method: "Fish",
              encounters: [
                { species: "Tentacool", level: "10" },
              ],
            },
          ],
        },
      ],
    },
  };
}

function createFilters(overrides: Partial<RecommendationFilters> = {}): RecommendationFilters {
  return {
    excludeLegendaries: false,
    excludePseudoLegendaries: false,
    excludeUniquePokemon: false,
    excludeOtherStarters: false,
    excludeExactTypeDuplicates: false,
    ...overrides,
  };
}

function createResolvedMember(
  overrides: Partial<ResolvedTeamMember & { locked?: boolean }> = {},
): ResolvedTeamMember & { locked?: boolean } {
  return {
    key: "member-1",
    species: "Snivy",
    displayName: "Snivy",
    types: ["Grass"],
    resolvedTypes: ["Grass"],
    ability: "",
    abilities: [],
    item: "",
    moves: [],
    learnsets: undefined,
    nextEvolutions: [],
    evolutionDetails: [],
    supportsGender: true,
    sprites: {
      frontDefault: "",
      frontShiny: "",
      officialArtwork: "",
      officialArtworkShiny: "",
    },
    locked: true,
    ...overrides,
  } as ResolvedTeamMember & { locked?: boolean };
}

describe("builder", () => {
  it("normalizes names and applies species filters", () => {
    const starterFamily = new Set(starters.snivy.stageSpecies.map(normalizeRecommendationName));

    expect(normalizeRecommendationName("Mr. Mime: Redux")).toBe("mr mime redux");
    expect(isRecommendationSpeciesAllowed("Zapdos", starterFamily, createFilters({ excludeLegendaries: true }), true)).toBe(false);
    expect(isRecommendationSpeciesAllowed("Hydreigon", starterFamily, createFilters({ excludePseudoLegendaries: true }), true)).toBe(false);
    expect(isRecommendationSpeciesAllowed("Mew", starterFamily, createFilters({ excludeUniquePokemon: true }), true)).toBe(false);
    expect(isRecommendationSpeciesAllowed("Charmander", starterFamily, createFilters({ excludeOtherStarters: true }), true)).toBe(false);
    expect(isRecommendationSpeciesAllowed("Servine", starterFamily, createFilters({ excludeOtherStarters: true }), true)).toBe(true);
    expect(isRecommendationSpeciesAllowed("   ", starterFamily, createFilters(), true)).toBe(true);
  });

  it("builds filtered area sources and trims the item list", () => {
    const docs = createDocs();

    const result = buildAreaSources(
      docs,
      ["Castelia City"],
      "snivy",
      createFilters({
        excludeLegendaries: true,
        excludePseudoLegendaries: true,
        excludeUniquePokemon: true,
      }),
    );

    expect(result).toEqual([
      {
        area: "Castelia City",
        encounters: [
          "Mareep (Grass)",
          "Pikachu (Grass)",
          "Azumarill (Surf)",
          "Magnemite (Surf)",
          "Rotom (Surf)",
          "Eevee (Surf)",
        ],
        gifts: ["Eevee"],
        trades: ["Togepi for a Meowth"],
        items: ["Potion", "Berry Juice", "Rare Candy", "X Attack", "Repel"],
      },
    ]);
  });

  it("excludes exact type duplicates using terminal evolutions and the locked starter line", () => {
    const docs = createDocs();
    const pokemonByName: Record<string, RemotePokemon> = {
      mareep: {
        id: 179,
        name: "Mareep",
        types: ["Electric"],
        stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35, bst: 280 },
        abilities: ["Static"],
        nextEvolutions: ["Ampharos"],
      },
      ampharos: {
        id: 181,
        name: "Ampharos",
        types: ["Electric", "Dragon"],
        stats: { hp: 90, atk: 75, def: 85, spa: 115, spd: 90, spe: 55, bst: 510 },
        abilities: ["Static"],
        nextEvolutions: [],
      },
      azumarill: {
        id: 184,
        name: "Azumarill",
        types: ["Water", "Fairy"],
        stats: { hp: 100, atk: 50, def: 80, spa: 60, spd: 80, spe: 50, bst: 420 },
        abilities: ["Huge Power"],
        nextEvolutions: [],
      },
      servine: {
        id: 496,
        name: "Servine",
        types: ["Grass"],
        stats: { hp: 60, atk: 60, def: 75, spa: 60, spd: 75, spe: 83, bst: 413 },
        abilities: ["Contrary"],
        nextEvolutions: ["Serperior"],
      },
      serperior: {
        id: 497,
        name: "Serperior",
        types: ["Grass", "Dragon"],
        stats: { hp: 75, atk: 75, def: 95, spa: 75, spd: 95, spe: 113, bst: 528 },
        abilities: ["Contrary"],
        nextEvolutions: [],
      },
      pikachu: {
        id: 25,
        name: "Pikachu",
        types: ["Electric"],
        stats: { hp: 35, atk: 55, def: 30, spa: 50, spd: 40, spe: 90, bst: 300 },
        abilities: ["Static"],
        nextEvolutions: [],
      },
      magnemite: {
        id: 81,
        name: "Magnemite",
        types: ["Electric", "Steel"],
        stats: { hp: 25, atk: 35, def: 70, spa: 95, spd: 55, spe: 45, bst: 325 },
        abilities: ["Magnet Pull"],
        nextEvolutions: [],
      },
      rotom: {
        id: 479,
        name: "Rotom",
        types: ["Electric", "Ghost"],
        stats: { hp: 50, atk: 50, def: 77, spa: 95, spd: 77, spe: 91, bst: 440 },
        abilities: ["Levitate"],
        nextEvolutions: [],
      },
      eevee: {
        id: 133,
        name: "Eevee",
        types: ["Normal"],
        stats: { hp: 55, atk: 55, def: 50, spa: 45, spd: 65, spe: 55, bst: 325 },
        abilities: ["Adaptability"],
        nextEvolutions: [],
      },
      togepi: {
        id: 175,
        name: "Togepi",
        types: ["Fairy"],
        stats: { hp: 35, atk: 20, def: 65, spa: 40, spd: 65, spe: 20, bst: 245 },
        abilities: ["Serene Grace"],
        nextEvolutions: [],
      },
      victini: {
        id: 494,
        name: "Victini",
        types: ["Psychic", "Fire"],
        stats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100, bst: 600 },
        abilities: ["Victory Star"],
        nextEvolutions: [],
      },
      riolu: {
        id: 447,
        name: "Riolu",
        types: ["Fighting"],
        stats: { hp: 40, atk: 70, def: 40, spa: 35, spd: 40, spe: 60, bst: 285 },
        abilities: ["Inner Focus"],
        nextEvolutions: [],
      },
      tentacool: {
        id: 72,
        name: "Tentacool",
        types: ["Water", "Poison"],
        stats: { hp: 40, atk: 40, def: 35, spa: 50, spd: 100, spe: 70, bst: 335 },
        abilities: ["Clear Body"],
        nextEvolutions: [],
      },
    };

    const result = buildAreaSources(
      docs,
      ["Castelia City"],
      "snivy",
      createFilters({ excludeExactTypeDuplicates: true }),
      {
        team: [
          createResolvedMember({ species: "Servine", resolvedTypes: ["Grass"], locked: true }),
          createResolvedMember({
            key: "member-2",
            species: "Azumarill",
            resolvedTypes: ["Water", "Fairy"],
            locked: true,
          }),
        ],
        pokemonByName,
      },
    );

    expect(result[0]).toEqual({
      area: "Castelia City",
      encounters: [
        "Pikachu (Grass)",
        "Dragonite (Grass)",
        "Mew (Grass)",
        "Magnemite (Surf)",
        "Rotom (Surf)",
        "Eevee (Surf)",
      ],
      gifts: ["Eevee", "Victini"],
      trades: [],
      items: ["Potion", "Berry Juice", "Rare Candy", "X Attack", "Repel"],
    });
  });

  it("builds recommendation notes using the current starter stage and milestone fallback", () => {
    const docs = createDocs();

    const result = getRecommendation(
      docs,
      "tepig",
      "missing-id",
      [
        {
          species: "Pignite",
          nickname: "",
          level: 24,
          gender: "male",
          nature: "Serious",
          ability: "Sheer Force",
          item: "",
          moves: [],
        },
      ],
      createFilters({ excludeUniquePokemon: true }),
    );

    expect(result.notes).toEqual([
      "Pignite funciona mejor si el resto del equipo cubre Water, Ground.",
      "En Antes de Cheren la prioridad es capturar base temprana y asegurar cobertura inicial.",
      "Revisa objetos redistribuidos en las zonas activas: Redux mueve power spikes muy temprano.",
    ]);
    expect(result.availableSources).toHaveLength(2);
    expect(result.availableSources[0].area).toBe("Aspertia City");
    expect(result.availableSources[1].area).toBe("Route 19");
  });
});
