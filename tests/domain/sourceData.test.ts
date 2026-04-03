import { describe, expect, it } from "vitest";

import {
  entryMatchesSpecies,
  extractEncounterSpecies,
  extractGiftSpecies,
  giftMatchesSpecies,
  parseItemLocationDetail,
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
});
