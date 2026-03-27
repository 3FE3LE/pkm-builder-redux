import { describe, expect, it } from "vitest";

import { editableMemberSchema } from "@/lib/builderForm";

describe("builderForm", () => {
  it("rejects EV spreads whose total exceeds 510", () => {
    const result = editableMemberSchema.safeParse({
      id: "member-1",
      species: "Lucario",
      nickname: "Aura",
      locked: false,
      shiny: false,
      level: 42,
      gender: "male",
      nature: "Jolly",
      ability: "Inner Focus",
      item: "Leftovers",
      moves: ["Aura Sphere"],
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      evs: { hp: 252, atk: 252, def: 10, spa: 0, spd: 0, spe: 0 },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["evs"],
          message: "El total de EV no puede pasar de 510.",
        }),
      ]),
    );
  });
});
