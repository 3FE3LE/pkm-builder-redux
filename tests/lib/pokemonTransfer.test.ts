import { describe, expect, it } from "vitest";

import { buildPokemonShareUrl, exportPokemonToHash, importPokemonFromHash } from "@/lib/pokemonTransfer";
import type { EditableMember } from "@/lib/builderStore";

describe("pokemonTransfer", () => {
  it("exports and imports a pokemon while preserving editable data", () => {
    const member: EditableMember = {
      id: "member-1",
      species: "Lucario",
      nickname: "Anubis",
      locked: false,
      shiny: true,
      level: 48,
      gender: "male",
      nature: "Jolly",
      ability: "Inner Focus",
      item: "Life Orb",
      moves: ["Close Combat", "Extreme Speed", "Crunch", "Swords Dance"],
      ivs: { hp: 31, atk: 31, def: 20, spa: 0, spd: 18, spe: 31 },
      evs: { hp: 0, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 },
    };
    const hash = exportPokemonToHash(member);
    const shareUrl = buildPokemonShareUrl(member);

    const imported = importPokemonFromHash(hash);
    const importedFromShareUrl = importPokemonFromHash(shareUrl);

    expect(hash.startsWith("PKMRDX3.")).toBe(true);
    expect(shareUrl).toContain("/team/share/");
    expect(shareUrl.length).toBeLessThan(220);

    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    expect(importedFromShareUrl.ok).toBe(true);

    expect(imported.member.id).not.toBe("member-1");
    expect(imported.member).toEqual(
      expect.objectContaining({
        species: "Lucario",
        nickname: "Anubis",
        shiny: true,
        level: 48,
        gender: "male",
        nature: "Jolly",
        ability: "Inner Focus",
        item: "Life Orb",
        moves: ["Close Combat", "Extreme Speed", "Crunch", "Swords Dance"],
        ivs: { hp: 31, atk: 31, def: 20, spa: 0, spd: 18, spe: 31 },
        evs: { hp: 0, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 },
      }),
    );
  });

  it("rejects invalid transfer hashes", () => {
    const imported = importPokemonFromHash("bad-hash");

    expect(imported.ok).toBe(false);
    if (imported.ok) {
      return;
    }
    expect(imported.error).toContain("inválido");
  });
});
