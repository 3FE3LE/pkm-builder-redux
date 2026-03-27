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

test("detects offensive setup and speed-driven roles from moves, ability and item", () => {
  const snapshot = buildTeamRoleSnapshot([
    {
      key: "monferno-1",
      species: "Monferno",
      nature: "Jolly",
      natureEffect: { up: "spe", down: "spa" },
      ability: "Moxie",
      abilityDetails: { effect: "Boosts Attack after knocking out a foe." },
      item: "Choice Scarf",
      effectiveStats: {
        hp: 64,
        atk: 92,
        def: 52,
        spa: 60,
        spd: 52,
        spe: 101,
        bst: 421,
      },
      summaryStats: {
        hp: 64,
        atk: 92,
        def: 52,
        spa: 60,
        spd: 52,
        spe: 101,
        bst: 421,
      },
      resolvedStats: {
        hp: 64,
        atk: 78,
        def: 52,
        spa: 78,
        spd: 52,
        spe: 81,
        bst: 405,
      },
      moves: [
        { name: "Flare Blitz", damageClass: "physical", power: 120, adjustedPower: 120, hasStab: true },
        { name: "Mach Punch", damageClass: "physical", power: 40, adjustedPower: 40, hasStab: true },
        { name: "Swords Dance", damageClass: "status" },
        { name: "U-turn", damageClass: "physical", power: 70, adjustedPower: 70 },
      ],
    },
  ]);

  const monferno = snapshot.members[0]!;

  assert.equal(monferno.species, "Monferno");
  assert.ok(monferno.roleScores.wallbreaker >= 5);
  assert.ok(monferno.roleScores.setupSweeper >= 4);
  assert.ok(monferno.roleScores.cleaner >= 4);
  assert.ok(monferno.roleScores.revengeKiller >= 4);
  assert.ok(monferno.roleScores.speedControl >= 3);
  assert.ok(monferno.drivers.includes("naturaleza Jolly"));
  assert.ok(monferno.drivers.includes("habilidad Moxie"));
  assert.ok(monferno.drivers.includes("item Choice Scarf"));
  assert.ok(monferno.drivers.some((driver) => ["Flare Blitz", "Mach Punch", "Swords Dance"].includes(driver)));
  assert.ok(monferno.matchedRoles.length >= 2);
});

test("flags redundant composition and generates adaptation notes", () => {
  const snapshot = buildTeamRoleSnapshot([
    {
      species: "Chansey",
      nature: "Bold",
      natureEffect: { up: "def", down: "atk" },
      ability: "Natural Cure",
      item: "Eviolite",
      effectiveStats: {
        hp: 250,
        atk: 20,
        def: 40,
        spa: 35,
        spd: 105,
        spe: 50,
        bst: 500,
      },
      summaryStats: {
        hp: 250,
        atk: 20,
        def: 40,
        spa: 35,
        spd: 105,
        spe: 50,
        bst: 500,
      },
      resolvedStats: {
        hp: 250,
        atk: 5,
        def: 5,
        spa: 35,
        spd: 105,
        spe: 50,
        bst: 450,
      },
      moves: [
        { name: "Wish", damageClass: "status" },
        { name: "Protect", damageClass: "status" },
        { name: "Heal Bell", damageClass: "status" },
        { name: "Seismic Toss", damageClass: "physical", power: 100, adjustedPower: 100 },
      ],
    },
    {
      species: "Umbreon",
      nature: "Careful",
      natureEffect: { up: "spd", down: "spa" },
      ability: "Synchronize",
      item: "Leftovers",
      effectiveStats: {
        hp: 95,
        atk: 65,
        def: 110,
        spa: 50,
        spd: 130,
        spe: 65,
        bst: 515,
      },
      summaryStats: {
        hp: 95,
        atk: 65,
        def: 110,
        spa: 50,
        spd: 130,
        spe: 65,
        bst: 515,
      },
      resolvedStats: {
        hp: 95,
        atk: 65,
        def: 110,
        spa: 60,
        spd: 130,
        spe: 65,
        bst: 525,
      },
      moves: [
        { name: "Wish", damageClass: "status" },
        { name: "Protect", damageClass: "status" },
        { name: "Taunt", damageClass: "status" },
        { name: "Foul Play", damageClass: "physical", power: 95, adjustedPower: 95, hasStab: true },
      ],
    },
    {
      species: "Bronzong",
      nature: "Sassy",
      natureEffect: { up: "spd", down: "spe" },
      ability: "Levitate",
      item: "Leftovers",
      effectiveStats: {
        hp: 90,
        atk: 89,
        def: 116,
        spa: 79,
        spd: 116,
        spe: 33,
        bst: 523,
      },
      summaryStats: {
        hp: 90,
        atk: 89,
        def: 116,
        spa: 79,
        spd: 116,
        spe: 33,
        bst: 523,
      },
      resolvedStats: {
        hp: 67,
        atk: 89,
        def: 116,
        spa: 79,
        spd: 116,
        spe: 33,
        bst: 500,
      },
      moves: [
        { name: "Stealth Rock", damageClass: "status" },
        { name: "Reflect", damageClass: "status" },
        { name: "Gyro Ball", damageClass: "physical", power: 90, adjustedPower: 90, hasStab: true },
        { name: "Toxic", damageClass: "status" },
      ],
    },
  ]);

  assert.ok(snapshot.members.length === 3);
  assert.ok(snapshot.coveredRoles.length >= 2);
  assert.ok(snapshot.coveredRoles.some((role) => ["support", "defensiveGlue", "bulkyPivot"].includes(role)));
  assert.ok(snapshot.missingRoles.includes("wallbreaker"));
  assert.ok(snapshot.missingRoles.some((role) => ["speedControl", "cleaner", "revengeKiller"].includes(role)));
  assert.ok(snapshot.compositionNotes.some((note) => note.includes("Falta wallbreaker")));
  assert.ok(snapshot.compositionNotes.some((note) => note.includes("Falta")));
  assert.ok(snapshot.compositionNotes.length >= 2);
});
