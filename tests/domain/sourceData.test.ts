import { describe, expect, it } from "vitest";

import {
  buildAcquisitionIndex,
  entryMatchesSpecies,
  extractEncounterSpecies,
  extractGiftSpecies,
  formatWildAcquisition,
  giftMatchesSpecies,
  parseEncounterRate,
  parseItemLocationDetail,
  shopDetailMatchesItem,
} from "@/lib/domain/sourceData";

const POKEMON_NAMES = [
  "Bulbasaur",
  "Charmander",
  "Squirtle",
  "Ursaring",
  "Graveler",
];

describe("sourceData", () => {
  it("extracts multiple species from bundle gifts and gift notes", () => {
    expect(
      extractGiftSpecies(
        "Bulbasaur, Charmander or Squirtle",
        ["Hidden Grottos can be used to obtain the other two Pokemon."],
        POKEMON_NAMES,
      ),
    ).toEqual(["Bulbasaur", "Charmander", "Squirtle"]);

    expect(
      giftMatchesSpecies(
        {
          name: "Kanto Starter Gift",
          notes: ["Bulbasaur, Charmander and Squirtle are all available here."],
        },
        "Bulbasaur",
        POKEMON_NAMES,
      ),
    ).toBe(true);
  });

  it("recovers species names from malformed two-column wild encounter strings", () => {
    const raw = "Graveler Lv. 59-62 20%                   Ursaring Lv. 60-65 40%";
    expect(extractEncounterSpecies(raw, POKEMON_NAMES)).toEqual(["Ursaring", "Graveler"]);
    expect(entryMatchesSpecies(raw, "Ursaring", POKEMON_NAMES)).toBe(true);
  });

  it("parses item replacement lines into replacement and original item context", () => {
    expect(parseItemLocationDetail("Sun Stone -> Ice Stone")).toEqual({
      original: "Sun Stone",
      replacement: "Ice Stone",
      display: "Reemplaza Sun Stone",
    });
  });

  it("matches item shop notes against explicit and grouped mart inventory", () => {
    expect(
      shopDetailMatchesItem(
        "Secondary Mart now sells Luxury Balls and Net Balls, as well as Aspear, Oran and Rawst Berries.",
        "Net Ball",
      ),
    ).toBe(true);
    expect(
      shopDetailMatchesItem(
        "Plasma Grunt now sells evolutionary stones, instead of incense.",
        "Fire Stone",
      ),
    ).toBe(true);
    expect(
      shopDetailMatchesItem(
        "Now sells: All evolutionary items.",
        "Electirizer",
      ),
    ).toBe(true);
  });

  it("parses encounter rates and keeps them in acquisition indexes", () => {
    const acquisitions = buildAcquisitionIndex(
      [
        {
          area: "Route 1",
          methods: [
            {
              method: "Grass",
              encounters: [{ species: "Bulbasaur", level: "4-5", rate: "20%" }],
            },
          ],
        },
      ],
      [],
      [],
      POKEMON_NAMES,
    );

    expect(parseEncounterRate("20%")).toBe(20);
    expect(acquisitions.wildBySpecies.get("bulbasaur")).toEqual([
      {
        area: "Route 1",
        method: "Grass",
        level: "4-5",
        rate: "20%",
        rateValue: 20,
      },
    ]);
    expect(
      formatWildAcquisition({
        area: "Route 1",
        method: "Grass",
        level: "4-5",
        rate: "20%",
        rateValue: 20,
      }),
    ).toBe("Route 1 · Grass · 20% · Lv 4-5");
  });
});
