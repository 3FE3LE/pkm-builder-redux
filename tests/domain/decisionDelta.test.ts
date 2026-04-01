import { test, assert } from "vitest";

import {
  buildDecisionDeltas,
  inferProjectedLevel,
  projectCandidateMember,
} from "../../lib/domain/decisionDelta";

test("prefers adding a candidate that patches current coverage and speed", () => {
  const deltas = buildDecisionDeltas({
    checkpointId: "castelia",
    team: [
      {
        species: "Servine",
        level: 28,
        resolvedTypes: ["Grass"],
        effectiveStats: {
          hp: 70,
          atk: 58,
          def: 62,
          spa: 64,
          spd: 62,
          spe: 63,
          bst: 379,
        },
        summaryStats: {
          hp: 70,
          atk: 58,
          def: 62,
          spa: 64,
          spd: 62,
          spe: 63,
          bst: 379,
        },
        resolvedStats: {
          hp: 60,
          atk: 60,
          def: 75,
          spa: 60,
          spd: 75,
          spe: 83,
          bst: 413,
        },
        moves: [
          { name: "Leaf Blade", type: "Grass", damageClass: "physical", power: 90, adjustedPower: 90, hasStab: true, accuracy: 100 },
          { name: "Wrap", type: "Normal", damageClass: "physical", power: 15, adjustedPower: 15, accuracy: 90 },
        ],
      },
    ],
    candidates: [
      {
        id: "sandile-castelia",
        species: "Sandile",
        source: "Wild",
        role: "electric immunity",
        canonicalRole: "wallbreaker",
        roleLabel: "wallbreaker",
        teamFitNote: "Cubre un hueco real del equipo.",
        roleReason: "Aporta una pieza ofensiva distinta.",
        reason: "Parchea Elesa y mejora el tempo del midgame.",
        area: "Route 4",
      },
    ],
    pokemonByName: {
      sandile: {
        id: 551,
        name: "Sandile",
        types: ["Ground", "Dark"],
        stats: {
          hp: 50,
          atk: 72,
          def: 35,
          spa: 35,
          spd: 35,
          spe: 65,
          bst: 292,
        },
        learnsets: {
          levelUp: [
            { level: 1, move: "Bite" },
            { level: 1, move: "Sand Tomb" },
            { level: 16, move: "Bulldoze" },
            { level: 28, move: "Crunch" },
          ],
        },
      },
    },
    moveIndex: {
      bite: { name: "Bite", type: "Dark", damageClass: "physical", power: 60, accuracy: 100 },
      "sand-tomb": { name: "Sand Tomb", type: "Ground", damageClass: "physical", power: 35, accuracy: 85 },
      bulldoze: { name: "Bulldoze", type: "Ground", damageClass: "physical", power: 60, accuracy: 100 },
      crunch: { name: "Crunch", type: "Dark", damageClass: "physical", power: 80, accuracy: 100 },
    },
  });

  assert.equal(deltas.length, 1);
  assert.equal(deltas[0]?.action, "add");
  assert.equal(deltas[0]?.species, "Sandile");
  assert.ok((deltas[0]?.riskDelta ?? 0) >= 0);
  assert.ok((deltas[0]?.projectedMoves ?? []).includes("Bulldoze"));
});

test("returns a skip delta when every replace option is locked", () => {
  const deltas = buildDecisionDeltas({
    checkpointId: "castelia",
    team: Array.from({ length: 6 }, (_, index) => ({
      species: `Locked-${index + 1}`,
      locked: true,
      level: 28,
      resolvedTypes: ["Normal"],
      effectiveStats: {
        hp: 70,
        atk: 60,
        def: 60,
        spa: 60,
        spd: 60,
        spe: 60,
        bst: 370,
      },
      summaryStats: {
        hp: 70,
        atk: 60,
        def: 60,
        spa: 60,
        spd: 60,
        spe: 60,
        bst: 370,
      },
      resolvedStats: {
        hp: 60,
        atk: 60,
        def: 60,
        spa: 60,
        spd: 60,
        spe: 60,
        bst: 360,
      },
      moves: [],
    })),
    candidates: [
      {
        id: "mareep-gift",
        species: "Mareep",
        source: "Gift",
        role: "bulkyPivot",
        canonicalRole: "bulkyPivot",
        roleLabel: "pivot",
        teamFitNote: "Puede entrar fácil.",
        roleReason: "Aporta velocidad y pivoting.",
        reason: "Buen parche temporal.",
        area: "Floccesy Ranch",
      },
    ],
    pokemonByName: {
      mareep: {
        id: 179,
        name: "Mareep",
        types: ["Electric"],
        stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35, bst: 280 },
        learnsets: {
          levelUp: [{ level: 1, move: "Thunder Shock" }],
        },
      },
    },
    moveIndex: {
      "thunder-shock": {
        name: "Thunder Shock",
        type: "Electric",
        damageClass: "special",
        power: 40,
        accuracy: 100,
      },
    },
  });

  assert.equal(deltas[0]?.action, "skip");
  assert.equal(deltas[0]?.riskDelta, -999);
  assert.deepEqual(deltas[0]?.losses, ["Todos los slots elegibles estan locked."]);
});

test("projects fallback moves when no move is available at the current level yet", () => {
  const projected = projectCandidateMember({
    species: "Axew",
    level: 5,
    uncoveredTypes: ["Dragon"],
    pokemonByName: {
      axew: {
        id: 610,
        name: "Axew",
        types: ["Dragon"],
        stats: { hp: 46, atk: 87, def: 60, spa: 30, spd: 40, spe: 57, bst: 320 },
        learnsets: {
          levelUp: [
            { level: 10, move: "Dragon Claw" },
            { level: 16, move: "Slash" },
          ],
        },
      },
    },
    moveIndex: {
      "dragon-claw": {
        name: "Dragon Claw",
        type: "Dragon",
        damageClass: "physical",
        power: 80,
        accuracy: 100,
      },
      slash: {
        name: "Slash",
        type: "Normal",
        damageClass: "physical",
        power: 70,
        accuracy: 100,
      },
    },
  });

  assert.equal(projected?.level, 5);
  assert.deepEqual(projected?.moves.map((move) => move.name), ["Slash", "Dragon Claw"]);
});

test("skips candidates that cannot be projected from the local dex data", () => {
  const deltas = buildDecisionDeltas({
    checkpointId: "castelia",
    team: [
      {
        species: "Servine",
        level: 28,
        resolvedTypes: ["Grass"],
        effectiveStats: {
          hp: 70,
          atk: 58,
          def: 62,
          spa: 64,
          spd: 62,
          spe: 63,
          bst: 379,
        },
        summaryStats: {
          hp: 70,
          atk: 58,
          def: 62,
          spa: 64,
          spd: 62,
          spe: 63,
          bst: 379,
        },
        resolvedStats: {
          hp: 60,
          atk: 60,
          def: 75,
          spa: 60,
          spd: 75,
          spe: 83,
          bst: 413,
        },
        moves: [],
      },
    ],
    candidates: [
      {
        id: "missing-mon",
        species: "Missingno",
        source: "Wild",
        role: "coverage",
        canonicalRole: "wallbreaker",
        roleLabel: "wallbreaker",
        teamFitNote: "No deberia llegar.",
        roleReason: "No existe en el indice.",
        reason: "Caso de datos incompletos.",
        area: "Test Route",
      },
    ],
    pokemonByName: {},
    moveIndex: {},
  });

  assert.deepEqual(deltas, []);
});

test("returns null when projectCandidateMember cannot resolve stats", () => {
  assert.equal(
    projectCandidateMember({
      species: "Missingno",
      level: 30,
      uncoveredTypes: ["Fire"],
      pokemonByName: {},
      moveIndex: {},
    }),
    null,
  );

  assert.equal(
    projectCandidateMember({
      species: "Brokenmon",
      level: 30,
      uncoveredTypes: ["Water"],
      pokemonByName: {
        brokenmon: {
          id: 999,
          name: "Brokenmon",
          types: ["Normal"],
        } as never,
      },
      moveIndex: {},
    }),
    null,
  );
});

test("replaces the only unlocked slot when the team is already full", () => {
  const deltas = buildDecisionDeltas({
    checkpointId: "castelia",
    team: [
      {
        species: "Servine",
        locked: true,
        level: 30,
        resolvedTypes: ["Grass"],
        effectiveStats: { hp: 80, atk: 66, def: 70, spa: 74, spd: 70, spe: 74, bst: 434 },
        summaryStats: { hp: 80, atk: 66, def: 70, spa: 74, spd: 70, spe: 74, bst: 434 },
        resolvedStats: { hp: 60, atk: 60, def: 75, spa: 60, spd: 75, spe: 83, bst: 413 },
        moves: [{ name: "Leaf Blade", type: "Grass", damageClass: "physical", power: 90, adjustedPower: 90, hasStab: true, accuracy: 100 }],
      },
      {
        species: "Growlithe",
        locked: true,
        level: 30,
        resolvedTypes: ["Fire"],
        effectiveStats: { hp: 79, atk: 82, def: 52, spa: 62, spd: 56, spe: 74, bst: 405 },
        summaryStats: { hp: 79, atk: 82, def: 52, spa: 62, spd: 56, spe: 74, bst: 405 },
        resolvedStats: { hp: 55, atk: 70, def: 45, spa: 70, spd: 50, spe: 60, bst: 350 },
        moves: [{ name: "Flame Wheel", type: "Fire", damageClass: "physical", power: 60, adjustedPower: 90, hasStab: true, accuracy: 100 }],
      },
      {
        species: "Azumarill",
        locked: true,
        level: 30,
        resolvedTypes: ["Water", "Fairy"],
        effectiveStats: { hp: 110, atk: 62, def: 80, spa: 58, spd: 80, spe: 50, bst: 440 },
        summaryStats: { hp: 110, atk: 62, def: 80, spa: 58, spd: 80, spe: 50, bst: 440 },
        resolvedStats: { hp: 100, atk: 50, def: 80, spa: 60, spd: 80, spe: 50, bst: 420 },
        moves: [{ name: "Bubble Beam", type: "Water", damageClass: "special", power: 65, adjustedPower: 97.5, hasStab: true, accuracy: 100 }],
      },
      {
        species: "Magnemite",
        locked: true,
        level: 30,
        resolvedTypes: ["Electric", "Steel"],
        effectiveStats: { hp: 63, atk: 43, def: 94, spa: 100, spd: 70, spe: 56, bst: 426 },
        summaryStats: { hp: 63, atk: 43, def: 94, spa: 100, spd: 70, spe: 56, bst: 426 },
        resolvedStats: { hp: 25, atk: 35, def: 70, spa: 95, spd: 55, spe: 45, bst: 325 },
        moves: [{ name: "Electro Ball", type: "Electric", damageClass: "special", power: 80, adjustedPower: 120, hasStab: true, accuracy: 100 }],
      },
      {
        species: "Palpitoad",
        locked: true,
        level: 30,
        resolvedTypes: ["Water", "Ground"],
        effectiveStats: { hp: 88, atk: 70, def: 67, spa: 74, spd: 67, spe: 54, bst: 420 },
        summaryStats: { hp: 88, atk: 70, def: 67, spa: 74, spd: 67, spe: 54, bst: 420 },
        resolvedStats: { hp: 75, atk: 65, def: 55, spa: 65, spd: 55, spe: 69, bst: 384 },
        moves: [{ name: "Mud Shot", type: "Ground", damageClass: "special", power: 55, adjustedPower: 82.5, hasStab: true, accuracy: 95 }],
      },
      {
        species: "Sunkern",
        locked: false,
        level: 30,
        resolvedTypes: ["Grass"],
        effectiveStats: { hp: 56, atk: 34, def: 34, spa: 34, spd: 34, spe: 34, bst: 226 },
        summaryStats: { hp: 56, atk: 34, def: 34, spa: 34, spd: 34, spe: 34, bst: 226 },
        resolvedStats: { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30, bst: 180 },
        moves: [{ name: "Mega Drain", type: "Grass", damageClass: "special", power: 40, adjustedPower: 60, hasStab: true, accuracy: 100 }],
      },
    ],
    candidates: [
      {
        id: "drilbur-castelia",
        species: "Drilbur",
        source: "Wild",
        role: "ground speed control",
        canonicalRole: "cleaner",
        roleLabel: "cleaner",
        teamFitNote: "Mejora bastante el slot flojo.",
        roleReason: "Sube speed y castiga Electric.",
        reason: "Es una mejora clara sobre el filler actual.",
        area: "Relic Passage",
      },
    ],
    pokemonByName: {
      drilbur: {
        id: 529,
        name: "Drilbur",
        types: ["Ground"],
        stats: { hp: 60, atk: 85, def: 40, spa: 30, spd: 45, spe: 68, bst: 328 },
        learnsets: {
          levelUp: [
            { level: 1, move: "Mud-Slap" },
            { level: 8, move: "Rapid Spin" },
            { level: 15, move: "Rock Slide" },
            { level: 29, move: "Dig" },
          ],
        },
      },
    },
    moveIndex: {
      "mudslap": { name: "Mud-Slap", type: "Ground", damageClass: "special", power: 20, accuracy: 100 },
      "rapidspin": { name: "Rapid Spin", type: "Normal", damageClass: "physical", power: 50, accuracy: 100 },
      "rockslide": { name: "Rock Slide", type: "Rock", damageClass: "physical", power: 75, accuracy: 90 },
      dig: { name: "Dig", type: "Ground", damageClass: "physical", power: 80, accuracy: 100 },
    },
  });

  assert.equal(deltas.length, 1);
  assert.equal(deltas[0]?.action, "replace");
  assert.equal(deltas[0]?.replacedSlot, "Sunkern");
  assert.equal(deltas[0]?.species, "Drilbur");
  assert.ok((deltas[0]?.projectedMoves ?? []).includes("Dig"));
});

test("infers projected level from team average or checkpoint fallback", () => {
  assert.equal(
    inferProjectedLevel(
      [
        { species: "A", level: 12, resolvedTypes: [], moves: [] },
        { species: "B", level: 18, resolvedTypes: [], moves: [] },
      ],
      "opening",
    ),
    15,
  );

  assert.equal(inferProjectedLevel([], "league"), 78);
  assert.equal(inferProjectedLevel([], "unknown-checkpoint"), 20);
});
