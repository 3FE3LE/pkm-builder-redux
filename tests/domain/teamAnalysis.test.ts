import { describe, expect, it } from "vitest";

import { resolvePokemonProfile, supportsPokemonGender } from "../../lib/teamAnalysis";

describe("resolvePokemonProfile ability resolution", () => {
  it("marks known genderless species correctly", () => {
    expect(supportsPokemonGender("Magnemite")).toBe(false);
    expect(supportsPokemonGender("Lucario")).toBe(true);
    expect(supportsPokemonGender("")).toBe(false);
  });

  it("uses the current species abilities instead of merging another phase abilities", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const remote = {
      id: 448,
      name: "Lucario",
      types: ["Fighting", "Steel"],
      stats: { hp: 70, atk: 110, def: 70, spa: 115, spd: 70, spe: 90, bst: 525 },
      abilities: ["Steadfast", "Inner Focus", "Justified"],
      nextEvolutions: [],
    };

    const resolved = resolvePokemonProfile(docs, "Lucario", remote);

    expect(resolved?.abilities).toEqual(["Steadfast", "Inner Focus", "Justified"]);
    expect(resolved?.abilities).not.toContain("Prankster");
  });

  it("prefers explicit doc ability overrides for the current species", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [
        {
          species: "Lucario",
          abilities: ["Inner Focus", "Justified"],
        },
      ],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const remote = {
      id: 448,
      name: "Lucario",
      types: ["Fighting", "Steel"],
      stats: { hp: 70, atk: 110, def: 70, spa: 115, spd: 70, spe: 90, bst: 525 },
      abilities: ["Steadfast", "Inner Focus", "Justified"],
      nextEvolutions: [],
    };

    const resolved = resolvePokemonProfile(docs, "Lucario", remote);

    expect(resolved?.abilities).toEqual(["Inner Focus", "Justified"]);
  });

  it("returns undefined for blank species names", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    expect(resolvePokemonProfile(docs, "   ")).toBeUndefined();
  });

  it("builds a resolved profile from docs, type changes, remote evolutions, and shiny sprites", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [
        {
          dex: 1,
          species: "Bulbasaur",
          stats: { hp: 46, atk: 49, def: 49, spa: 65, spd: 65, spe: 45, bst: 319 },
        },
      ],
      typeChanges: [
        {
          dex: "001",
          pokemon: "Bulbasaur",
          oldType: "Grass/Poison",
          newType: "Grass/Fairy",
          justification: "redux",
        },
      ],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const remote = {
      id: 1,
      name: "Bulbasaur",
      types: ["Grass", "Poison"],
      category: "Seed Pokemon",
      height: 0.7,
      weight: 6.9,
      flavorText: "A strange seed was planted on its back at birth.",
      stats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45, bst: 318 },
      abilities: ["Overgrow"],
      nextEvolutions: ["Ivysaur"],
      evolutionDetails: [
        {
          target: "ivysaur",
          minLevel: 16,
          gender: 1,
          timeOfDay: "night",
          location: "lostlorn-forest",
        },
      ],
      learnsets: {
        levelUp: [{ level: 1, move: "Tackle" }],
        machines: [],
      },
    };

    const resolved = resolvePokemonProfile(docs, "Bulbasaur", remote, true);

    expect(resolved).toEqual(
      expect.objectContaining({
        key: "bulbasaur",
        species: "Bulbasaur",
        shiny: true,
        supportsGender: true,
        dexNumber: 1,
        category: "Seed Pokemon",
        height: 0.7,
        weight: 6.9,
        flavorText: "A strange seed was planted on its back at birth.",
        resolvedTypes: ["Grass", "Fairy"],
        resolvedStats: { hp: 46, atk: 49, def: 49, spa: 65, spd: 65, spe: 45, bst: 319 },
        abilities: ["Overgrow"],
        nextEvolutions: ["Ivysaur"],
        learnsets: remote.learnsets,
      }),
    );
    expect(resolved?.spriteUrl).toContain("/shiny/1.png");
    expect(resolved?.animatedSpriteUrl).toContain("/animated/shiny/1.gif");
    expect(resolved?.evolutionHints).toEqual([
      {
        target: "Ivysaur",
        method: "Lv 16 · Female · Night · Lostlorn Forest",
        summary: "Ivysaur evolves via Lv 16 · Female · Night · Lostlorn Forest.",
      },
    ]);
  });

  it("prefers documented evolution hints and builds documented evolution details", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [
        {
          dex: 133,
          species: "Eevee",
          target: "Espeon",
          method: "Friendship",
          summary: "Eevee evolves into Espeon by friendship.",
        },
        {
          dex: 133,
          species: "Eevee",
          target: "Umbreon",
          method: "Moon Shard",
          summary: "Eevee evolves into Umbreon with Moon Shard.",
        },
      ],
    } as never;

    const remote = {
      id: 133,
      name: "Eevee",
      types: ["Normal"],
      stats: { hp: 55, atk: 55, def: 50, spa: 45, spd: 65, spe: 55, bst: 325 },
      abilities: ["Run Away", "Adaptability"],
      nextEvolutions: ["Vaporeon"],
      evolutionDetails: [
        {
          target: "vaporeon",
          item: "Water Stone",
        },
      ],
    };

    const resolved = resolvePokemonProfile(docs, "Eevee", remote);

    expect(resolved?.nextEvolutions).toEqual(["Espeon", "Umbreon"]);
    expect(resolved?.evolutionDetails).toEqual([
      expect.objectContaining({
        target: "Espeon",
        trigger: "level-up",
        minHappiness: 220,
      }),
      expect.objectContaining({
        target: "Umbreon",
        trigger: "use-item",
        item: "Moon Shard",
      }),
    ]);
    expect(resolved?.evolutionHints).toEqual([
      {
        target: "Espeon",
        method: "Friendship",
        summary: "Eevee evolves into Espeon by friendship.",
      },
      {
        target: "Umbreon",
        method: "Moon Shard",
        summary: "Eevee evolves into Umbreon with Moon Shard.",
      },
      {
        target: "Vaporeon",
        method: "Water Stone",
        summary: "Vaporeon evolves via Water Stone.",
      },
    ]);
  });

  it("adds fallback hints for next evolutions without documented or canonical detail", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const remote = {
      id: 172,
      name: "Pichu",
      types: ["Electric"],
      stats: { hp: 20, atk: 40, def: 15, spa: 35, spd: 35, spe: 60, bst: 205 },
      abilities: ["Static"],
      nextEvolutions: ["Pikachu"],
      evolutionDetails: [],
    };

    const resolved = resolvePokemonProfile(docs, "Pichu", remote);

    expect(resolved?.evolutionHints).toEqual([
      {
        target: "Pikachu",
        method: "",
        summary: "Pikachu is the next evolution.",
      },
    ]);
  });

  it("builds documented evolution details for move and party-based methods", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [
        {
          dex: 221,
          species: "Piloswine",
          target: "Mamoswine",
          method: "Move: Ancient Power",
          summary: "Piloswine evolves into Mamoswine by learning Ancient Power.",
        },
        {
          dex: 588,
          species: "Karrablast",
          target: "Escavalier",
          method: "Party: Shelmet",
          summary: "Karrablast evolves into Escavalier alongside Shelmet.",
        },
      ],
    } as never;

    const piloswine = resolvePokemonProfile(docs, "Piloswine", {
      id: 221,
      name: "Piloswine",
      types: ["Ice", "Ground"],
      stats: { hp: 100, atk: 100, def: 80, spa: 60, spd: 60, spe: 50, bst: 450 },
      abilities: ["Oblivious"],
      nextEvolutions: [],
    });
    const karrablast = resolvePokemonProfile(docs, "Karrablast", {
      id: 588,
      name: "Karrablast",
      types: ["Bug"],
      stats: { hp: 50, atk: 75, def: 45, spa: 40, spd: 45, spe: 60, bst: 315 },
      abilities: ["Swarm"],
      nextEvolutions: [],
    });

    expect(piloswine?.evolutionDetails).toEqual([
      expect.objectContaining({
        target: "Mamoswine",
        trigger: "level-up",
        knownMove: "Ancient Power",
      }),
    ]);
    expect(karrablast?.evolutionDetails).toEqual([
      expect.objectContaining({
        target: "Escavalier",
        trigger: "level-up",
        partySpecies: "Shelmet",
      }),
    ]);
  });

  it("builds documented evolution details for level and normal methods", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [
        {
          dex: 180,
          species: "Flaaffy",
          target: "Ampharos",
          method: "Lv 30",
          summary: "Flaaffy evolves into Ampharos at level 30.",
        },
        {
          dex: 75,
          species: "Graveler",
          target: "Golem",
          method: "Normal Method",
          summary: "Graveler evolves into Golem by its normal method.",
        },
      ],
    } as never;

    const flaaffy = resolvePokemonProfile(docs, "Flaaffy", {
      id: 180,
      name: "Flaaffy",
      types: ["Electric"],
      stats: { hp: 70, atk: 55, def: 55, spa: 80, spd: 60, spe: 45, bst: 365 },
      abilities: ["Static"],
      nextEvolutions: [],
    });
    const graveler = resolvePokemonProfile(docs, "Graveler", {
      id: 75,
      name: "Graveler",
      types: ["Rock", "Ground"],
      stats: { hp: 55, atk: 95, def: 115, spa: 45, spd: 45, spe: 35, bst: 390 },
      abilities: ["Rock Head"],
      nextEvolutions: [],
    });

    expect(flaaffy?.evolutionDetails).toEqual([
      expect.objectContaining({
        target: "Ampharos",
        trigger: "level-up",
        minLevel: 30,
      }),
    ]);
    expect(graveler?.evolutionDetails).toEqual([
      expect.objectContaining({
        target: "Golem",
        trigger: "level-up",
        minLevel: null,
      }),
    ]);
  });

  it("falls back to formatted species names even without remote data", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const resolved = resolvePokemonProfile(docs, "mr mime", undefined, false);

    expect(resolved).toEqual(
      expect.objectContaining({
        key: "mr-mime",
        species: "Mr Mime",
        supportsGender: true,
        dexNumber: undefined,
        resolvedTypes: [],
        resolvedStats: undefined,
        abilities: [],
        nextEvolutions: [],
        evolutionDetails: [],
        evolutionHints: [],
      }),
    );
    expect(resolved?.spriteUrl).toBeUndefined();
    expect(resolved?.animatedSpriteUrl).toBeUndefined();
  });

  it("prefers profile types over type changes and remote data", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [
        {
          dex: 479,
          species: "Rotom",
          types: ["Electric", "Ghost"],
          abilities: ["Levitate"],
        },
      ],
      typeChanges: [
        {
          dex: "479",
          pokemon: "Rotom",
          oldType: "Electric/Ghost",
          newType: "Electric/Fire",
          justification: "alt form style",
        },
      ],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const remote = {
      id: 479,
      name: "Rotom",
      types: ["Electric"],
      stats: { hp: 50, atk: 50, def: 77, spa: 95, spd: 77, spe: 91, bst: 440 },
      abilities: ["Levitate"],
      nextEvolutions: [],
    };

    const resolved = resolvePokemonProfile(docs, "Rotom", remote);

    expect(resolved?.resolvedTypes).toEqual(["Electric", "Ghost"]);
    expect(resolved?.abilities).toEqual(["Levitate"]);
  });

  it("formats canonical trade and special evolution hints when docs do not override them", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const remote = {
      id: 356,
      name: "Dusclops",
      types: ["Ghost"],
      stats: { hp: 40, atk: 70, def: 130, spa: 60, spd: 130, spe: 25, bst: 455 },
      abilities: ["Pressure"],
      nextEvolutions: ["Dusknoir", "Mysterymon", "Tradeonlymon"],
      evolutionDetails: [
        {
          target: "dusknoir",
          trigger: "trade",
          heldItem: "Reaper Cloth",
        },
        {
          target: "mysterymon",
          trigger: "unknown",
        },
        {
          target: "tradeonlymon",
          trigger: "trade",
        },
      ],
    };

    const resolved = resolvePokemonProfile(docs, "Dusclops", remote);

    expect(resolved?.evolutionHints).toEqual([
      {
        target: "Dusknoir",
        method: "Trade + Reaper Cloth",
        summary: "Dusknoir evolves via Trade + Reaper Cloth.",
      },
      {
        target: "Mysterymon",
        method: "Special",
        summary: "Mysterymon evolves via Special.",
      },
      {
        target: "Tradeonlymon",
        method: "Trade",
        summary: "Tradeonlymon evolves via Trade.",
      },
    ]);
  });

  it("formats full canonical evolution requirements, fallback methods, and short locations", () => {
    const docs = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      moveDetails: [],
      pokemonProfiles: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      evolutionChanges: [],
    } as never;

    const remote = {
      id: 999,
      name: "Testmon",
      types: ["Normal"],
      stats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80, bst: 480 },
      abilities: ["Trace"],
      nextEvolutions: [
        "Tradeform",
        "Holdform",
        "Requirementmon",
        "Balanceform",
        "Defenseform",
        "Useitemmon",
        "Levelupmon",
      ],
      evolutionDetails: [
        {
          target: "tradeform",
          trigger: "trade",
          tradeSpecies: "Shelmet",
        },
        {
          target: "holdform",
          heldItem: "Razor Fang",
        },
        {
          target: "requirementmon",
          minHappiness: 220,
          minBeauty: 170,
          minAffection: 2,
          knownMove: "Rollout",
          knownMoveType: "Fairy",
          partySpecies: "Remoraid",
          partyType: "Dark",
          relativePhysicalStats: 1,
          gender: 2,
          timeOfDay: "dusk",
          location: "mt-moon",
          needsOverworldRain: true,
          turnUpsideDown: true,
        },
        {
          target: "balanceform",
          relativePhysicalStats: 0,
        },
        {
          target: "defenseform",
          relativePhysicalStats: -1,
        },
        {
          target: "useitemmon",
          trigger: "use-item",
        },
        {
          target: "levelupmon",
          trigger: "level-up",
        },
      ],
    };

    const resolved = resolvePokemonProfile(docs, "Testmon", remote);

    expect(resolved?.evolutionHints).toEqual([
      {
        target: "Tradeform",
        method: "Trade for Shelmet",
        summary: "Tradeform evolves via Trade for Shelmet.",
      },
      {
        target: "Holdform",
        method: "Hold Razor Fang",
        summary: "Holdform evolves via Hold Razor Fang.",
      },
      {
        target: "Requirementmon",
        method:
          "Friendship · Beauty 170 · Affection 2 · Move: Rollout · Know Fairy move · Party: Remoraid · Party Dark · Atk > Def · Male · Dusk · MT Moon · Rain · Upside-down",
        summary:
          "Requirementmon evolves via Friendship · Beauty 170 · Affection 2 · Move: Rollout · Know Fairy move · Party: Remoraid · Party Dark · Atk > Def · Male · Dusk · MT Moon · Rain · Upside-down.",
      },
      {
        target: "Balanceform",
        method: "Atk = Def",
        summary: "Balanceform evolves via Atk = Def.",
      },
      {
        target: "Defenseform",
        method: "Atk < Def",
        summary: "Defenseform evolves via Atk < Def.",
      },
      {
        target: "Useitemmon",
        method: "Use item",
        summary: "Useitemmon evolves via Use item.",
      },
      {
        target: "Levelupmon",
        method: "Level up",
        summary: "Levelupmon evolves via Level up.",
      },
    ]);
  });
});
