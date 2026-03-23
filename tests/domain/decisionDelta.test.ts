import test from "node:test";
import assert from "node:assert/strict";

import { buildDecisionDeltas } from "../../lib/domain/decisionDelta";

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
