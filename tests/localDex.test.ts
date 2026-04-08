import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadActualLocalDex() {
  vi.resetModules();
  vi.doUnmock("node:fs");
  return import("../lib/localDex");
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("node:fs");
  vi.restoreAllMocks();
});

describe("localDex", () => {
  it("builds the fallback pokemon index from reference data and adds standard aliases", async () => {
    const { getLocalPokemonIndex } = await loadActualLocalDex();

    const pokemonIndex = getLocalPokemonIndex() as Record<string, any>;

    expect(pokemonIndex.bulbasaur.types).toEqual(["Grass", "Poison"]);
    expect(pokemonIndex.bulbasaur.abilities).toEqual([
      "Solar Power",
      "Overgrow",
      "Chlorophyll",
    ]);
    expect(pokemonIndex.bulbasaur.learnsets.levelUp[0]).toEqual({
      level: 1,
      move: "Ancient Power",
    });

    expect(pokemonIndex.darmanitan.types).toEqual(["Fire"]);
    expect(pokemonIndex["darmanitan-standard"]).toMatchObject({
      slug: "darmanitan-standard",
      name: "Darmanitan Standard",
    });
    expect(pokemonIndex.darmanitan).toMatchObject({
      slug: "darmanitan",
      name: "Darmanitan",
    });
    expect(pokemonIndex["darmanitan-zen"]).toMatchObject({
      dex: 555,
      slug: "darmanitan-zen",
      name: "Darmanitan-Zen",
      abilities: ["Zen Mode"],
    });
    expect(pokemonIndex.deoxys).toMatchObject({
      slug: "deoxys",
      name: "Deoxys",
    });
    expect(pokemonIndex["deoxys-attack"]).toMatchObject({
      dex: 386,
      slug: "deoxys-attack",
      name: "Deoxys-Attack",
      stats: { atk: 180, spe: 150 },
    });
    expect(pokemonIndex["shaymin-sky"]).toMatchObject({
      dex: 492,
      slug: "shaymin-sky",
      name: "Shaymin-Sky",
      types: ["Grass", "Flying"],
    });
    expect(pokemonIndex["kyurem-black"]).toMatchObject({
      dex: 646,
      slug: "kyurem-black",
      name: "Kyurem-Black",
      abilities: ["Teravolt"],
    });
    expect(pokemonIndex.kyurem).toMatchObject({
      dex: 646,
      slug: "kyurem",
      name: "Kyurem",
      types: ["Dragon", "Ice"],
      nextEvolutions: [],
    });
  });

  it("falls back to canonical indexes and sorts the derived species list", async () => {
    const {
      getLocalAbilityIndex,
      getLocalItemIndex,
      getLocalMoveIndex,
      getLocalSpeciesList,
    } = await loadActualLocalDex();

    const moveIndex = getLocalMoveIndex() as Record<string, any>;
    const itemIndex = getLocalItemIndex() as Record<string, any>;
    const abilityIndex = getLocalAbilityIndex() as Record<string, any>;
    const speciesList = getLocalSpeciesList();

    expect(moveIndex.absorb).toMatchObject({
      name: "Absorb",
      type: "Grass",
    });
    expect(moveIndex["sleep-talk"]).toMatchObject({
      name: "Sleep Talk",
      type: "Normal",
      damageClass: "status",
    });
    expect(moveIndex.snore).toMatchObject({
      name: "Snore",
      type: "Normal",
      damageClass: "special",
    });
    expect(itemIndex["oval-stone"]).toMatchObject({
      name: "Oval Stone",
      replacedBy: "Link Cable",
      cost: 2000,
    });
    expect(abilityIndex.adaptability).toMatchObject({
      name: "Adaptability",
    });

    expect(speciesList[0]).toMatchObject({
      dex: 1,
      slug: "bulbasaur",
    });
    expect(speciesList.some((entry) => entry.slug === "darmanitan-zen")).toBe(false);
    expect(speciesList.some((entry) => entry.slug === "darmanitan")).toBe(true);
    expect(speciesList.some((entry) => entry.slug === "deoxys")).toBe(true);
    expect(speciesList.some((entry) => entry.slug === "deoxys-attack")).toBe(false);
    expect(speciesList.some((entry) => entry.slug === "shaymin")).toBe(true);
    expect(speciesList.some((entry) => entry.slug === "shaymin-sky")).toBe(false);
    expect(speciesList.find((entry) => entry.slug === "pikachu")).toMatchObject({
      dex: 25,
      types: ["Electric"],
    });
  }, 10000);

  it("prefers local dex files and reuses the in-memory cache", async () => {
    const originalCwd = process.cwd();
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pkm-local-dex-"));
    const localDexDir = path.join(tempRoot, "data", "local-dex");

    mkdirSync(localDexDir, { recursive: true });

    const localPokemonIndex = {
      custommon: { name: "Custommon", types: ["Normal"] },
    };
    const localMoveIndex = {
      "custom-move": { name: "Custom Move", type: "Normal" },
    };
    const localItemIndex = {
      "custom-item": { name: "Custom Item" },
    };
    const localAbilityIndex = {
      "custom-ability": { name: "Custom Ability" },
    };
    const localSpeciesList = [
      { name: "Zed", slug: "zed", dex: 200, types: ["Dark"] },
      { name: "Alpha", slug: "alpha", dex: 1, types: ["Normal"] },
    ];

    for (const [fileName, data] of Object.entries({
      "pokemon-index.json": localPokemonIndex,
      "move-index.json": localMoveIndex,
      "item-index.json": localItemIndex,
      "ability-index.json": localAbilityIndex,
      "species-list.json": localSpeciesList,
    })) {
      writeFileSync(path.join(localDexDir, fileName), JSON.stringify(data));
    }

    try {
      process.chdir(tempRoot);

      const module = await import("../lib/localDex");

      const firstPokemonIndex = module.getLocalPokemonIndex();
      const firstMoveIndex = module.getLocalMoveIndex();
      const firstItemIndex = module.getLocalItemIndex();
      const firstAbilityIndex = module.getLocalAbilityIndex();
      const firstSpeciesList = module.getLocalSpeciesList();

      expect(firstPokemonIndex).toEqual(localPokemonIndex);
      expect(firstMoveIndex).toEqual(localMoveIndex);
      expect(firstItemIndex).toEqual(localItemIndex);
      expect(firstAbilityIndex).toEqual(localAbilityIndex);
      expect(firstSpeciesList).toEqual([
        { name: "Alpha", slug: "alpha", dex: 1, types: ["Normal"] },
        { name: "Zed", slug: "zed", dex: 200, types: ["Dark"] },
      ]);

      expect(module.getLocalPokemonIndex()).toBe(firstPokemonIndex);
      expect(module.getLocalMoveIndex()).toBe(firstMoveIndex);
      expect(module.getLocalItemIndex()).toBe(firstItemIndex);
      expect(module.getLocalAbilityIndex()).toBe(firstAbilityIndex);
      expect(module.getLocalSpeciesList()).toBe(firstSpeciesList);
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("adds override-only item and ability entries and falls back to empty data when a reference file is missing", async () => {
    const originalCwd = process.cwd();
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pkm-local-dex-reference-"));
    const referenceDir = path.join(tempRoot, "data", "reference");

    mkdirSync(referenceDir, { recursive: true });

    writeFileSync(
      path.join(referenceDir, "items-canonical.json"),
      JSON.stringify({
        leftovers: { name: "Leftovers", category: "Held Item" },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "item-redux-overrides.json"),
      JSON.stringify({
        leftovers: { cost: 2000 },
        "link-cable": { name: "Link Cable", category: "Held Item", cost: 3000 },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "abilities-canonical.json"),
      JSON.stringify({
        overgrow: { name: "Overgrow" },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "ability-redux-overrides.json"),
      JSON.stringify({
        overgrow: { effect: "Boosts Grass moves" },
        sharpness: { name: "Sharpness", effect: "Boosts slicing moves" },
      }),
    );

    try {
      process.chdir(tempRoot);

      const module = await import("../lib/localDex");

      expect(module.getLocalMoveIndex()).toEqual({});
      expect(module.getLocalItemIndex()).toMatchObject({
        leftovers: { name: "Leftovers", category: "Held Item", cost: 2000 },
        "link-cable": { name: "Link Cable", category: "Held Item", cost: 3000 },
      });
      expect(module.getLocalAbilityIndex()).toMatchObject({
        overgrow: { name: "Overgrow", effect: "Boosts Grass moves" },
        sharpness: { name: "Sharpness", effect: "Boosts slicing moves" },
      });
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("builds fallback indexes without species-list or synthetic forms and merges machine learnsets", async () => {
    const originalCwd = process.cwd();
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pkm-local-dex-build-"));
    const referenceDir = path.join(tempRoot, "data", "reference");

    mkdirSync(referenceDir, { recursive: true });

    writeFileSync(
      path.join(referenceDir, "pokemon-canonical-gen5.json"),
      JSON.stringify({
        "001": {
          id: 1,
          dex: 1,
          slug: "testmon-standard",
          name: "Testmon Standard",
          types: ["Normal"],
          abilities: ["Run Away"],
          stats: { hp: 45, atk: 45, def: 45, spa: 45, spd: 45, spe: 45, bst: 270 },
          nextEvolutions: [],
        },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "pokemon-redux-overrides-gen5.json"),
      JSON.stringify({
        "testmon-standard": {
          complete: {
            types: ["Normal", "Fairy"],
            abilities: ["Cute Charm"],
          },
          learnsets: {
            levelUp: [],
            machines: [
              { move: "Secret Power", source: "redux", tab: "tm" },
              { move: "Secret Power", source: "redux", tab: "tm" },
            ],
          },
        },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "pokemon-canonical-learnsets-gen5.json"),
      JSON.stringify({
        "testmon-standard": {
          levelUp: [{ level: 1, move: "Pound" }],
          machines: [
            { move: "Secret Power", source: "canon", tab: "tm" },
            { move: "Hidden Power", source: "canon", tab: "tm" },
          ],
        },
      }),
    );

    try {
      process.chdir(tempRoot);

      const module = await import("../lib/localDex");
      const pokemonIndex = module.getLocalPokemonIndex() as Record<string, any>;
      const speciesList = module.getLocalSpeciesList();

      expect(pokemonIndex["testmon-standard"]).toMatchObject({
        types: ["Normal", "Fairy"],
        abilities: ["Cute Charm"],
      });
      expect(pokemonIndex.testmon).toBe(pokemonIndex["testmon-standard"]);
      expect(pokemonIndex["testmon standard"]).toBeUndefined();
      expect(pokemonIndex["darmanitan-zen"]).toBeUndefined();
      expect(pokemonIndex["testmon-standard"].learnsets.levelUp).toEqual([{ level: 1, move: "Pound" }]);
      expect(pokemonIndex["testmon-standard"].learnsets.machines).toEqual([
        { move: "Secret Power", source: "canon", tab: "tm" },
        { move: "Hidden Power", source: "canon", tab: "tm" },
        { move: "Secret Power", source: "redux", tab: "tm" },
      ]);
      expect(speciesList).toEqual([
        { name: "Testmon", slug: "testmon", dex: 1, types: ["Normal", "Fairy"] },
      ]);
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("uses normalized local pokemon abilities in the dex list instead of raw override triples", async () => {
    const originalCwd = process.cwd();
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pkm-local-dex-list-"));
    const referenceDir = path.join(tempRoot, "data", "reference");
    const localDexDir = path.join(tempRoot, "data", "local-dex");

    mkdirSync(referenceDir, { recursive: true });
    mkdirSync(localDexDir, { recursive: true });

    writeFileSync(
      path.join(referenceDir, "pokemon-canonical-gen5.json"),
      JSON.stringify({
        "495": {
          id: 495,
          dex: 495,
          slug: "snivy",
          name: "Snivy",
          types: ["Grass"],
          abilities: ["Overgrow", "Contrary"],
          stats: { hp: 45, atk: 45, def: 55, spa: 45, spd: 55, spe: 63, bst: 308 },
        },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "pokemon-redux-overrides-gen5.json"),
      JSON.stringify({
        snivy: {
          complete: {
            abilities: ["Contrary", "Overgrow", "Contrary"],
          },
        },
      }),
    );
    writeFileSync(
      path.join(localDexDir, "species-list.json"),
      JSON.stringify([{ name: "Snivy", slug: "snivy", dex: 495, types: ["Grass"] }]),
    );
    writeFileSync(
      path.join(localDexDir, "pokemon-index.json"),
      JSON.stringify({
        snivy: {
          name: "Snivy",
          slug: "snivy",
          dex: 495,
          types: ["Grass"],
          abilities: ["Overgrow", "Contrary"],
          stats: { hp: 45, atk: 45, def: 55, spa: 45, spd: 55, spe: 63, bst: 308 },
        },
      }),
    );

    try {
      process.chdir(tempRoot);

      const module = await import("../lib/localDex");
      const dexList = module.getLocalDexList();
      const slots = module.getPokemonAbilitySlots("Snivy");

      expect(dexList).toEqual([
        expect.objectContaining({
          name: "Snivy",
          abilities: ["Overgrow", "Contrary"],
          hasAbilityChanges: false,
        }),
      ]);
      expect(slots).toEqual({
        regular: ["Contrary", "Overgrow"],
        hidden: ["Contrary"],
      });
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("prefers the generated dex-list artifact when it exists", async () => {
    const originalCwd = process.cwd();
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pkm-local-dex-generated-list-"));
    const referenceDir = path.join(tempRoot, "data", "reference");
    const localDexDir = path.join(tempRoot, "data", "local-dex");

    mkdirSync(referenceDir, { recursive: true });
    mkdirSync(localDexDir, { recursive: true });

    writeFileSync(
      path.join(referenceDir, "pokemon-canonical-gen5.json"),
      JSON.stringify({
        "006": {
          id: 6,
          dex: 6,
          slug: "charizard",
          name: "Charizard",
          types: ["Fire", "Flying"],
          abilities: ["Blaze", "Solar Power"],
          stats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100, bst: 534 },
        },
      }),
    );
    writeFileSync(
      path.join(localDexDir, "species-list.json"),
      JSON.stringify([{ name: "Charizard", slug: "charizard", dex: 6, types: ["Fire", "Dragon"] }]),
    );
    writeFileSync(
      path.join(localDexDir, "pokemon-index.json"),
      JSON.stringify({
        charizard: {
          name: "Charizard",
          slug: "charizard",
          dex: 6,
          types: ["Fire", "Flying"],
          abilities: ["Blaze", "Solar Power"],
          stats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100, bst: 534 },
        },
      }),
    );
    writeFileSync(
      path.join(localDexDir, "dex-list.json"),
      JSON.stringify([
        {
          dex: 6,
          name: "Charizard",
          slug: "charizard",
          types: ["Fire", "Dragon"],
          abilities: ["Blaze", "Tough Claws"],
          hasTypeChanges: true,
          hasStatChanges: true,
          hasAbilityChanges: true,
        },
      ]),
    );

    try {
      process.chdir(tempRoot);

      const module = await import("../lib/localDex");
      const dexList = module.getLocalDexList();

      expect(dexList).toEqual([
        {
          dex: 6,
          name: "Charizard",
          slug: "charizard",
          types: ["Fire", "Dragon"],
          abilities: ["Blaze", "Tough Claws"],
          hasTypeChanges: true,
          hasStatChanges: true,
          hasAbilityChanges: true,
        },
      ]);
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps redux-overridden battle data when local pokemon-index is stale", async () => {
    const originalCwd = process.cwd();
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pkm-local-dex-stale-pokemon-index-"));
    const referenceDir = path.join(tempRoot, "data", "reference");
    const localDexDir = path.join(tempRoot, "data", "local-dex");

    mkdirSync(referenceDir, { recursive: true });
    mkdirSync(localDexDir, { recursive: true });

    writeFileSync(
      path.join(referenceDir, "pokemon-canonical-gen5.json"),
      JSON.stringify({
        "362": {
          id: 362,
          dex: 362,
          slug: "glalie",
          name: "Glalie",
          types: ["Ice"],
          abilities: ["Inner Focus", "Ice Body", "Moody"],
          stats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80, bst: 480 },
          nextEvolutions: [],
          evolutionDetails: [],
        },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "pokemon-redux-overrides-gen5.json"),
      JSON.stringify({
        glalie: {
          complete: {
            types: ["Ice", "Rock"],
            abilities: ["Levitate", "-", "-"],
            stats: { hp: 80, atk: 110, def: 110, spa: 60, spd: 60, spe: 80, bst: 500 },
          },
        },
      }),
    );
    writeFileSync(
      path.join(referenceDir, "pokemon-canonical-learnsets-gen5.json"),
      JSON.stringify({
        glalie: {
          levelUp: [{ level: 1, move: "Powder Snow" }],
          machines: [],
        },
      }),
    );
    writeFileSync(
      path.join(localDexDir, "pokemon-index.json"),
      JSON.stringify({
        glalie: {
          id: 362,
          dex: 362,
          slug: "glalie",
          name: "Glalie",
          types: ["Ice"],
          abilities: ["Inner Focus", "Ice Body", "Moody"],
          stats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80, bst: 480 },
          nextEvolutions: [],
          evolutionDetails: [],
        },
      }),
    );

    try {
      process.chdir(tempRoot);

      const module = await import("../lib/localDex");
      const pokemonIndex = module.getLocalPokemonIndex() as Record<string, any>;

      expect(pokemonIndex.glalie.types).toEqual(["Ice", "Rock"]);
      expect(pokemonIndex.glalie.stats).toEqual({
        hp: 80,
        atk: 110,
        def: 110,
        spa: 60,
        spd: 60,
        spe: 80,
        bst: 500,
      });
    } finally {
      process.chdir(originalCwd);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
