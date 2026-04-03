import { describe, expect, it } from "vitest";

import { resolvePokemonProfile } from "@/lib/teamAnalysis.profile";

describe("resolvePokemonProfile", () => {
  it("filters canonical next evolutions that are not present in the hack species catalog", () => {
    const resolved = resolvePokemonProfile(
      {
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
        pokemonProfiles: [
          { dex: 216, species: "Teddiursa" },
          { dex: 217, species: "Ursaring" },
        ],
        evolutionChanges: [],
      },
      "Ursaring",
      {
        id: 217,
        name: "Ursaring",
        types: ["Normal", "Ground"],
        abilities: ["Guts"],
        nextEvolutions: ["Ursaluna"],
        evolutionDetails: [
          {
            target: "Ursaluna",
            trigger: "use-item",
            minLevel: null,
            item: "Peat Block",
            heldItem: null,
            knownMove: null,
            knownMoveType: null,
            minHappiness: null,
            minBeauty: null,
            minAffection: null,
            partySpecies: null,
            partyType: null,
            tradeSpecies: null,
            timeOfDay: "full-moon",
            location: null,
            gender: null,
            relativePhysicalStats: null,
            needsOverworldRain: false,
            turnUpsideDown: false,
          },
        ],
      },
    );

    expect(resolved?.nextEvolutions).toEqual([]);
    expect(resolved?.evolutionDetails).toEqual([]);
  });
});
