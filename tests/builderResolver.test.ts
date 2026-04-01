import { describe, expect, it } from "vitest";

import { buildNameIndex, resolveEditableMember, type BuilderResolverContext } from "../lib/builderResolver";
import type { EditableMember } from "../lib/builderStore";
import type { ParsedDocs } from "../lib/docsSchema";
import type { RemoteAbility, RemoteItem, RemoteMove, RemotePokemon } from "../lib/teamAnalysis";

function createDocs(): ParsedDocs {
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
  };
}

function createEditable(overrides: Partial<EditableMember> = {}): EditableMember {
  return {
    id: "member-1",
    species: "",
    nickname: "",
    locked: false,
    shiny: false,
    level: 20,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ...overrides,
  };
}

describe("builderResolver", () => {
  it("builds a normalized name index", () => {
    const index = buildNameIndex([
      { name: "Mr. Mime", kind: "mime" },
      { name: "Farfetch’d", kind: "duck" },
    ]);

    expect(index["mr-mime"]).toEqual({ name: "Mr. Mime", kind: "mime" });
    expect(index["farfetchd"]).toEqual({ name: "Farfetch’d", kind: "duck" });
  });

  it("falls back cleanly when the species cannot be resolved", () => {
    const context: BuilderResolverContext = {
      docs: createDocs(),
      abilitiesByName: {},
      itemsByName: {},
      movesByName: {},
      pokemonByName: {},
      weather: "clear",
    };

    const resolved = resolveEditableMember(
      createEditable({
        id: "unknown-slot",
        species: "MissingNo",
        nickname: "Glitch",
      }),
      context,
    );

    expect(resolved).toEqual(
      expect.objectContaining({
        key: "unknown-slot",
        species: "MissingNo",
        supportsGender: true,
        resolvedTypes: [],
        abilities: [],
        moves: [],
        itemDetails: null,
        abilityDetails: null,
        summaryStats: undefined,
        effectiveStats: undefined,
      }),
    );
  });

  it("hydrates learnsets and resolves stats, weather, and hidden power data", () => {
    const bellsprout: RemotePokemon = {
      id: 69,
      name: "Bellsprout",
      types: ["Grass", "Poison"],
      category: "Flower Pokemon",
      height: 0.7,
      weight: 4,
      flavorText: "Prefers hot and humid places.",
      stats: { hp: 50, atk: 75, def: 35, spa: 70, spd: 30, spe: 40, bst: 300 },
      abilities: ["Chlorophyll"],
      nextEvolutions: ["Weepinbell"],
      learnsets: {
        levelUp: [
          { level: 1, move: "Vine Whip" },
          { level: 1, move: "Hidden Power" },
          { level: 1, move: "Weather Ball" },
        ],
        machines: [],
      },
    };
    const movesByName: Record<string, RemoteMove> = {
      "vine-whip": { name: "Vine Whip", type: "Grass", damageClass: "physical", power: 45, accuracy: 100, pp: 25 },
      "hidden-power": { name: "Hidden Power", type: "Normal", damageClass: "special", power: 60, accuracy: 100, pp: 15 },
      "weather-ball": { name: "Weather Ball", type: "Normal", damageClass: "special", power: 50, accuracy: 100, pp: 10 },
    };
    const itemsByName: Record<string, RemoteItem> = {
      eviolite: { name: "Eviolite", effect: "Raises Defense and Special Defense." },
    };
    const abilitiesByName: Record<string, RemoteAbility> = {
      chlorophyll: { name: "Chlorophyll", effect: "Doubles Speed during strong sunlight." },
    };

    const context: BuilderResolverContext = {
      docs: createDocs(),
      abilitiesByName,
      itemsByName,
      movesByName,
      pokemonByName: { bellsprout },
      weather: "sun",
    };

    const resolved = resolveEditableMember(
      createEditable({
        id: "bellsprout-1",
        species: "Bellsprout",
        shiny: true,
        level: 20,
        gender: "female",
        nature: "Timid",
        ability: "Chlorophyll",
        item: "Eviolite",
        moves: ["Vine Whip", "Hidden Power", "Weather Ball"],
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      }),
      context,
    );

    expect(resolved.supportsGender).toBe(true);
    expect(resolved.category).toBe("Flower Pokemon");
    expect(resolved.height).toBe(0.7);
    expect(resolved.weight).toBe(4);
    expect(resolved.flavorText).toBe("Prefers hot and humid places.");
    expect(resolved.itemDetails?.name).toBe("Eviolite");
    expect(resolved.abilityDetails?.name).toBe("Chlorophyll");
    expect(resolved.natureEffect).toEqual({ up: "spe", down: "atk" });
    expect(resolved.nextEvolutions).toEqual(["Weepinbell"]);
    expect(resolved.learnsets?.levelUp.every((entry) => entry.details)).toBe(true);
    expect(resolved.statModifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stat: "def", multiplier: 1.5 }),
        expect.objectContaining({ stat: "spd", multiplier: 1.5 }),
        expect.objectContaining({ stat: "spe", multiplier: 2 }),
      ]),
    );

    const vineWhip = resolved.moves.find((move) => move.name === "Vine Whip");
    const hiddenPower = resolved.moves.find((move) => move.name === "Hidden Power");
    const weatherBall = resolved.moves.find((move) => move.name === "Weather Ball");

    expect(vineWhip).toEqual(
      expect.objectContaining({
        type: "Grass",
        hasStab: true,
        damageClass: "physical",
        power: 45,
        adjustedPower: 45,
      }),
    );
    expect(hiddenPower).toEqual(
      expect.objectContaining({
        type: "Dark",
        hasStab: false,
        damageClass: "special",
        power: 70,
        adjustedPower: 70,
      }),
    );
    expect(weatherBall).toEqual(
      expect.objectContaining({
        type: "Fire",
        hasStab: false,
        power: 100,
        adjustedPower: 150,
      }),
    );
  });

  it("applies move power modifiers from item, ability, and weather in resolved moves", () => {
    const monferno: RemotePokemon = {
      id: 391,
      name: "Monferno",
      types: ["Fire", "Fighting"],
      stats: { hp: 64, atk: 78, def: 52, spa: 78, spd: 52, spe: 81, bst: 405 },
      abilities: ["Iron Fist"],
      nextEvolutions: ["Infernape"],
      learnsets: {
        levelUp: [{ level: 1, move: "Fire Punch" }],
        machines: [],
      },
    };

    const context: BuilderResolverContext = {
      docs: createDocs(),
      abilitiesByName: {
        "iron-fist": { name: "Iron Fist", effect: "Boosts punching moves." },
      },
      itemsByName: {
        charcoal: { name: "Charcoal", effect: "Boosts the damage of Fire-type moves by 20%." },
      },
      movesByName: {
        "fire-punch": {
          name: "Fire Punch",
          type: "Fire",
          damageClass: "physical",
          power: 75,
          accuracy: 100,
          description: "May burn the target.",
        },
      },
      pokemonByName: { monferno },
      weather: "sun",
    };

    const resolved = resolveEditableMember(
      createEditable({
        id: "monferno-1",
        species: "Monferno",
        ability: "Iron Fist",
        item: "Charcoal",
        moves: ["Fire Punch"],
      }),
      context,
    );

    expect(resolved.moves).toHaveLength(1);
    expect(resolved.moves[0]).toEqual(
      expect.objectContaining({
        name: "Fire Punch",
        type: "Fire",
        hasStab: true,
        power: 75,
        adjustedPower: 194,
      }),
    );
    expect((resolved.moves[0]?.powerModifiers ?? []).map((entry) => entry.label)).toEqual([
      "Fire +20%",
      "Fire +50%",
      "Fire +20%",
      "punch +20%",
    ]);
  });

  it("returns the base pokemon untouched, tolerates missing machine arrays, and hydrates machine move details", () => {
    const staryu: RemotePokemon = {
      id: 120,
      name: "Staryu",
      types: ["Water"],
      stats: { hp: 30, atk: 45, def: 55, spa: 70, spd: 55, spe: 85, bst: 340 },
      abilities: ["Illuminate"],
      nextEvolutions: ["Starmie"],
    };
    const porygon: RemotePokemon = {
      id: 137,
      name: "Porygon",
      types: ["Normal"],
      stats: { hp: 65, atk: 60, def: 70, spa: 85, spd: 75, spe: 40, bst: 395 },
      abilities: ["Trace"],
      nextEvolutions: ["Porygon2"],
      learnsets: {
        levelUp: [{ level: 1, move: "Tackle" }],
        machines: undefined as never,
      },
    };
    const magnemite: RemotePokemon = {
      id: 81,
      name: "Magnemite",
      types: ["Electric", "Steel"],
      stats: { hp: 25, atk: 35, def: 70, spa: 95, spd: 55, spe: 45, bst: 325 },
      abilities: ["Magnet Pull"],
      nextEvolutions: ["Magneton"],
      learnsets: {
        levelUp: [],
        machines: [{ source: "TM24", move: "Thunderbolt", tab: "tm" }],
      },
    };

    const context: BuilderResolverContext = {
      docs: createDocs(),
      abilitiesByName: {},
      itemsByName: {},
      movesByName: {
        tackle: {
          name: "Tackle",
          type: "Normal",
          damageClass: "physical",
          power: 40,
          accuracy: 100,
          pp: 35,
        },
        thunderbolt: {
          name: "Thunderbolt",
          type: "Electric",
          damageClass: "special",
          power: 90,
          accuracy: 100,
          pp: 15,
        },
      },
      pokemonByName: {
        staryu,
        porygon,
        magnemite,
      },
      weather: "clear",
    };

    const withoutLearnsets = resolveEditableMember(
      createEditable({
        id: "staryu-1",
        species: "Staryu",
      }),
      context,
    );
    const missingMachines = resolveEditableMember(
      createEditable({
        id: "porygon-1",
        species: "Porygon",
        moves: ["Tackle"],
      }),
      context,
    );
    const hydratedMachines = resolveEditableMember(
      createEditable({
        id: "magnemite-1",
        species: "Magnemite",
        moves: ["Thunderbolt"],
      }),
      context,
    );

    expect(withoutLearnsets.learnsets).toBeUndefined();
    expect(withoutLearnsets.moves).toEqual([]);
    expect(missingMachines.learnsets?.levelUp[0]?.details).toEqual(
      expect.objectContaining({ name: "Tackle" }),
    );
    expect(missingMachines.learnsets?.machines).toEqual([]);
    expect(hydratedMachines.learnsets?.machines[0]?.details).toEqual(
      expect.objectContaining({ name: "Thunderbolt", power: 90 }),
    );
    expect(hydratedMachines.moves[0]).toEqual(
      expect.objectContaining({
        name: "Thunderbolt",
        type: "Electric",
        power: 90,
        adjustedPower: 90,
      }),
    );
  });

  it("preserves existing learnset details and tolerates unresolved moves from learnsets or move lookup", () => {
    const castform: RemotePokemon = {
      id: 351,
      name: "Castform",
      types: ["Normal"],
      stats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70, bst: 420 },
      abilities: ["Forecast"],
      nextEvolutions: [],
      learnsets: {
        levelUp: [
          {
            level: 1,
            move: "Tackle",
            details: {
              name: "Tackle",
              type: "Normal",
              damageClass: "physical",
              power: 40,
              accuracy: 100,
              pp: 35,
            },
          },
        ],
        machines: [
          { source: "TM00", move: "Mystery Beam", tab: "tm" },
        ],
      },
    };

    const context: BuilderResolverContext = {
      docs: createDocs(),
      abilitiesByName: {},
      itemsByName: {},
      movesByName: {},
      pokemonByName: { castform },
      weather: "clear",
    };

    const resolved = resolveEditableMember(
      createEditable({
        id: "castform-1",
        species: "Castform",
        moves: ["Tackle", "Mystery Beam", "Unknown Pulse"],
      }),
      context,
    );

    expect(resolved.learnsets?.levelUp[0]?.details).toEqual(
      expect.objectContaining({ name: "Tackle", power: 40 }),
    );
    expect(resolved.learnsets?.machines[0]?.details).toBeNull();
    expect(resolved.moves).toEqual([
      expect.objectContaining({
        name: "Tackle",
        type: "Normal",
        hasStab: true,
        power: 40,
        adjustedPower: 40,
      }),
      expect.objectContaining({
        name: "Mystery Beam",
        type: undefined,
        damageClass: undefined,
        accuracy: undefined,
        power: null,
        adjustedPower: null,
        hasStab: false,
      }),
      expect.objectContaining({
        name: "Unknown Pulse",
        type: undefined,
        damageClass: undefined,
        accuracy: undefined,
        power: null,
        adjustedPower: null,
        hasStab: false,
      }),
    ]);
  });
});
