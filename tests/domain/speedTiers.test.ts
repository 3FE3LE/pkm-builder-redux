import test from "node:test";
import assert from "node:assert/strict";

import { buildSpeedTierSnapshot } from "../../lib/domain/speedTiers";

test("builds a speed benchmark from the next checkpoint encounter", () => {
  const snapshot = buildSpeedTierSnapshot({
    checkpointId: "castelia",
    team: [
      {
        species: "Servine",
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
        moves: [{ name: "Leaf Blade" }],
      },
      {
        species: "Crobat",
        effectiveStats: {
          hp: 100,
          atk: 85,
          def: 80,
          spa: 70,
          spd: 80,
          spe: 130,
          bst: 545,
        },
        summaryStats: {
          hp: 100,
          atk: 85,
          def: 80,
          spa: 70,
          spd: 80,
          spe: 130,
          bst: 545,
        },
        resolvedStats: {
          hp: 85,
          atk: 90,
          def: 80,
          spa: 70,
          spd: 80,
          spe: 130,
          bst: 535,
        },
        moves: [{ name: "U-turn" }],
      },
    ],
    pokemonIndex: {
      emolga: { name: "Emolga", stats: { hp: 55, atk: 75, def: 60, spa: 75, spd: 60, spe: 103, bst: 428 } },
      lanturn: { name: "Lanturn", stats: { hp: 125, atk: 58, def: 58, spa: 76, spd: 76, spe: 67, bst: 460 } },
      electivire: { name: "Electivire", stats: { hp: 75, atk: 123, def: 67, spa: 95, spd: 85, spe: 95, bst: 540 } },
      raichu: { name: "Raichu", stats: { hp: 60, atk: 90, def: 55, spa: 90, spd: 80, spe: 110, bst: 485 } },
      stunfisk: { name: "Stunfisk", stats: { hp: 109, atk: 66, def: 84, spa: 81, spd: 99, spe: 32, bst: 471 } },
      zebstrika: { name: "Zebstrika", stats: { hp: 75, atk: 100, def: 63, spa: 80, spd: 63, spe: 116, bst: 497 } },
    },
    encounters: [
      {
        id: "elesa",
        order: 13,
        label: "Elesa",
        category: "gym",
        affiliation: "unova-league",
        team: ["Emolga", "Lanturn", "Electivire", "Raichu", "Stunfisk", "Zebstrika"],
        mode: "challenge",
        mandatory: true,
        levelCap: 38,
        documentation: "documented",
      },
    ],
  });

  assert.equal(snapshot.targetEncounterId, "elesa");
  assert.equal(snapshot.targetLabel, "Elesa");
  assert.ok(snapshot.benchmarkSpeed > 0);
  assert.equal(snapshot.memberMatchups[0]?.species, "Crobat");
  assert.ok(snapshot.outspeedCount >= 1);
});
