import { test, assert } from "vitest";

import { buildTeamRoleSnapshot } from "../../lib/domain/roleAnalysis";

test("assigns a viable support-oriented role from stats and nature even with minimal kit", () => {
  const snapshot = buildTeamRoleSnapshot([
    {
      species: "Budew",
      nature: "Calm",
      natureEffect: { up: "spd", down: "atk" },
      ability: "Natural Cure",
      effectiveStats: {
        hp: 21,
        atk: 9,
        def: 11,
        spa: 13,
        spd: 16,
        spe: 10,
        bst: 80,
      },
      summaryStats: {
        hp: 21,
        atk: 9,
        def: 11,
        spa: 13,
        spd: 16,
        spe: 10,
        bst: 80,
      },
      resolvedStats: {
        hp: 40,
        atk: 30,
        def: 35,
        spa: 50,
        spd: 70,
        spe: 55,
        bst: 280,
      },
      moves: [],
    },
  ]);

  assert.equal(snapshot.members.length, 1);
  const budew = snapshot.members[0]!;

  assert.notEqual(budew.naturalRole, "wallbreaker");
  assert.ok(budew.roleScores.support >= 2);
  assert.ok(budew.roleScores.defensiveGlue >= 2);
  assert.ok(["support", "defensiveGlue", "bulkyPivot"].includes(budew.recommendedRole));
});
