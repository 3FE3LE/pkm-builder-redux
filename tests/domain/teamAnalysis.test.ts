import { describe, expect, it } from "vitest";

import { resolvePokemonProfile } from "../../lib/teamAnalysis";

describe("resolvePokemonProfile ability resolution", () => {
  it("uses the current species abilities instead of merging another phase abilities", () => {
    const docs = {
      pokemonProfiles: [],
      typeChanges: [],
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
      pokemonProfiles: [
        {
          species: "Lucario",
          abilities: ["Inner Focus", "Justified"],
        },
      ],
      typeChanges: [],
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
});
