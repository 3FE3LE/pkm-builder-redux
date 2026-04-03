import { describe, expect, it } from "vitest";

import { buildSpriteUrls, formatName, normalizeName, toTitleCase } from "../../lib/domain/names";

describe("names utilities", () => {
  it("normalizes punctuation, spacing, and gender suffixes", () => {
    expect(normalizeName("  Farfetch’d  ")).toBe("farfetchd");
    expect(normalizeName("Nidoran♀")).toBe("nidoran-f");
    expect(normalizeName("Mr. Mime")).toBe("mr-mime");
  });

  it("formats dashed and spaced inputs into title case words", () => {
    expect(formatName("porygon-z")).toBe("Porygon Z");
    expect(formatName("  mime jr ")).toBe("Mime Jr");
    expect(toTitleCase("sERPERIOR")).toBe("Serperior");
  });

  it("builds special-case sprite urls for synthetic forms", () => {
    expect(buildSpriteUrls("Darmanitan-Zen", 555)).toEqual({
      spriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10017.png",
      animatedSpriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/10017.gif",
    });

    expect(buildSpriteUrls("Shaymin-Sky", 492)).toEqual({
      spriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10006.png",
      animatedSpriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/10006.gif",
    });
  });

  it("builds generation v static and animated sprite urls including shiny variants", () => {
    expect(buildSpriteUrls("Serperior", 497)).toEqual({
      spriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/497.png",
      animatedSpriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/497.gif",
    });

    expect(buildSpriteUrls("Serperior", 497, { shiny: true })).toEqual({
      spriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/shiny/497.png",
      animatedSpriteUrl:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/497.gif",
    });
  });

  it("returns undefined urls when there is no dex number", () => {
    expect(buildSpriteUrls("MissingNo")).toEqual({
      spriteUrl: undefined,
      animatedSpriteUrl: undefined,
    });
  });
});
