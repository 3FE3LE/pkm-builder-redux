import { beforeEach, describe, expect, it, vi } from "vitest";

let docsFixture: any;
let worldDataFixture: any;
let speciesListFixture: any[];
let moveIndexFixture: Record<string, any>;
let canonicalPokemonIndexFixture: Record<string, any>;
let pokemonIndexFixture: Record<string, any>;
let abilityIndexFixture: Record<string, any>;
let itemIndexFixture: Record<string, any>;

vi.mock("@/lib/docs", () => ({
  parseDocumentation: vi.fn(() => docsFixture),
}));

vi.mock("@/lib/worldData", () => ({
  getWorldData: vi.fn(() => worldDataFixture),
}));

vi.mock("@/lib/localDex", () => ({
  getLocalDexDataVersion: vi.fn(() => "test-version"),
  getLocalSpeciesList: vi.fn(() => speciesListFixture),
  getLocalMoveIndex: vi.fn(() => moveIndexFixture),
  getCanonicalPokemonIndex: vi.fn(() => canonicalPokemonIndexFixture),
  getLocalPokemonIndex: vi.fn(() => pokemonIndexFixture),
  getLocalAbilityIndex: vi.fn(() => abilityIndexFixture),
  getLocalItemIndex: vi.fn(() => itemIndexFixture),
}));

describe("builderPageData", () => {
  beforeEach(() => {
    docsFixture = {
      moveReplacements: [],
      moveTypeChanges: [],
      moveTypeOverrides: [],
      typeChanges: [],
      itemLocations: [],
      itemHighlights: [],
      gifts: [],
      trades: [],
      wildAreas: [],
      pokemonProfiles: [],
      evolutionChanges: [],
      moveDetails: [
        {
          move: "Flame Burst",
          changes: [
            { field: "power", from: "70", to: "90", tag: "(buff)" },
            { field: "pp", from: "15", to: "10" },
            { field: "effect", to: "Burn chance increased" },
          ],
        },
        {
          move: "Tailwind",
          changes: [{ field: "effect", to: "Now lasts 6 turns" }],
        },
      ],
    };
    worldDataFixture = {
      gifts: [{ name: "Eevee" }],
      trades: [{ wants: "Basculin" }],
      items: [{ area: "Virbank City" }],
      wildAreas: [{ area: "Route 20" }],
    };
    speciesListFixture = [
      { name: "Bulbasaur", slug: "bulbasaur", dex: 1, types: ["Grass", "Poison"] },
      { name: "Charmander", slug: "charmander", dex: 4, types: ["Fire"] },
    ];
    moveIndexFixture = {
      tackle: { name: "Tackle", type: "Normal" },
    };
    canonicalPokemonIndexFixture = {
      bulbasaur: {
        id: 1,
        name: "Bulbasaur",
        types: ["Grass", "Poison"],
      },
    };
    pokemonIndexFixture = {
      bulbasaur: {
        id: 1,
        name: "Bulbasaur",
        types: ["Grass", "Poison"],
        category: "Seed Pokemon",
        height: 0.7,
        weight: 6.9,
        flavorText: "A strange seed was planted on its back at birth.",
      },
    };
    abilityIndexFixture = {
      overgrow: { name: "Overgrow", effect: "Powers up Grass-type moves." },
      chlorophyll: { name: "Chlorophyll", effect: "Boosts Speed in sunshine." },
    };
    itemIndexFixture = {
      potion: { name: "Potion", effect: "Restores HP." },
      "rare-candy": { name: "Rare Candy", effect: "Raises a level." },
    };
  });

  it("assembles builder page data and sorts catalogs", async () => {
    const { getBuilderPageData } = await import("../lib/builderPageData");

    const data = getBuilderPageData();

    expect(data.docs.worldData).toEqual(worldDataFixture);
    expect(data.speciesCatalog).toEqual(speciesListFixture);
    expect(data.speciesOptions).toEqual(["Bulbasaur", "Charmander"]);
    expect(data.moveIndex).toEqual(moveIndexFixture);
    expect(data.canonicalPokemonIndex.bulbasaur).toEqual({
      id: 1,
      name: "Bulbasaur",
      types: ["Grass", "Poison"],
    });
    expect(data.pokemonIndex.bulbasaur).toEqual({
      id: 1,
      name: "Bulbasaur",
      types: ["Grass", "Poison"],
      category: "Seed Pokemon",
      height: 0.7,
      weight: 6.9,
      flavorText: "A strange seed was planted on its back at birth.",
    });
    expect(data.abilityCatalog.map((entry: { name: string }) => entry.name)).toEqual([
      "Chlorophyll",
      "Overgrow",
    ]);
    expect(data.itemCatalog.map((entry: { name: string }) => entry.name)).toEqual([
      "Potion",
      "Rare Candy",
    ]);
  });

});
