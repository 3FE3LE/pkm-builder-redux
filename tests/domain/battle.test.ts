import { test, assert } from "vitest";

import {
  applyStatModifiers,
  buildAverageStats,
  buildCoverageSummary,
  buildDefensiveSections,
  calculateEffectiveStats,
  getNatureEffect,
  getStatModifiers,
} from "../../lib/domain/battle";
import { applyMovePowerModifiers, getMovePowerModifiers } from "../../lib/domain/moves";

test("ignores status moves when building coverage", () => {
  const coverage = buildCoverageSummary([
    {
      moves: [
        { type: "Ghost", damageClass: "status" },
        { type: "Fire", damageClass: "special" },
      ],
      resolvedTypes: ["Fire"],
    },
  ]);

  const steelCoverage = coverage.find((entry) => entry.defenseType === "Steel");
  const ghostCoverage = coverage.find((entry) => entry.defenseType === "Ghost");

  assert.equal(steelCoverage?.multiplier, 2);
  assert.equal(ghostCoverage?.multiplier, 1);
});

test("does not apply field-dependent ability boosts in neutral summaries", () => {
  const modifiers = getStatModifiers({
    abilityName: "Swift Swim",
    abilityEffect: "Doubles Speed in rain.",
  });

  assert.deepEqual(modifiers, []);
});

test("can opt into field-dependent ability boosts when context is known", () => {
  const modifiers = getStatModifiers({
    abilityName: "Swift Swim",
    abilityEffect: "Doubles Speed in rain.",
    weather: "rain",
  });

  assert.deepEqual(modifiers, [
    {
      source: "Swift Swim",
      stat: "spe",
      multiplier: 2,
      label: "Spe x2 rain",
    },
  ]);
});

test("applies the sandstorm special defense boost to rock types", () => {
  const modifiers = getStatModifiers({
    weather: "sand",
    resolvedTypes: ["Rock", "Ground"],
  });

  assert.deepEqual(modifiers, [
    {
      source: "Sandstorm",
      stat: "spd",
      multiplier: 1.5,
      label: "SpD +50% rock",
    },
  ]);
});

test("boosts fire moves under sun and suppresses them under rain", () => {
  const sunBoost = getMovePowerModifiers({
    move: { name: "Flamethrower", type: "Fire", damageClass: "special", power: 95 },
    weather: "sun",
  });
  const rainPenalty = getMovePowerModifiers({
    move: { name: "Flamethrower", type: "Fire", damageClass: "special", power: 95 },
    weather: "rain",
  });

  assert.equal(applyMovePowerModifiers(95, sunBoost), 143);
  assert.equal(applyMovePowerModifiers(95, rainPenalty), 48);
});

test("boosts water moves under rain and suppresses them under sun", () => {
  const rainBoost = getMovePowerModifiers({
    move: { name: "Surf", type: "Water", damageClass: "special", power: 95 },
    weather: "rain",
  });
  const sunPenalty = getMovePowerModifiers({
    move: { name: "Surf", type: "Water", damageClass: "special", power: 95 },
    weather: "sun",
  });

  assert.equal(applyMovePowerModifiers(95, rainBoost), 143);
  assert.equal(applyMovePowerModifiers(95, sunPenalty), 48);
});

test("builds defensive sections using net resistance minus weakness balance", () => {
  const sections = buildDefensiveSections([
    { resolvedTypes: ["Grass"], moves: [] },
    { resolvedTypes: ["Bug"], moves: [] },
    { resolvedTypes: ["Steel"], moves: [] },
    { resolvedTypes: ["Dragon"], moves: [] },
  ]);

  const fireWeak = sections.netWeak.find((entry) => entry.attackType === "Fire");

  assert.deepEqual(fireWeak, {
    attackType: "Fire",
    count: 2,
    severe: false,
  });
  assert.equal(sections.netResist.find((entry) => entry.attackType === "Fire"), undefined);
  assert.deepEqual(sections.netImmune.find((entry) => entry.attackType === "Poison"), {
    attackType: "Poison",
    count: 1,
  });
});

test("normalizes stat calculation inputs and nature effects", () => {
  const baseStats = {
    hp: 80,
    atk: 100,
    def: 70,
    spa: 95,
    spd: 80,
    spe: 60,
    bst: 485,
  } as const;

  const stats = calculateEffectiveStats(
    baseStats,
    150,
    "Adamant",
    { hp: 40, atk: 31, def: -5, spa: 12.8, spd: 33, spe: 31 },
    { hp: -1, atk: 999, def: 3.7, spa: 0, spd: 252, spe: 260 },
  );

  assert.deepEqual(getNatureEffect("Adamant"), { up: "atk", down: "spa" });
  assert.equal(getNatureEffect("Unknown Nature").up, undefined);
  assert.equal(stats.hp > 0, true);
  assert.equal(stats.atk > stats.spa, true);
  assert.equal(stats.bst, stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe);
});

test("collects item and ability stat modifiers across weather and explicit effect text", () => {
  const modifiers = getStatModifiers({
    itemName: "Choice Specs",
    itemEffect: "Raises Special Attack.",
    abilityName: "Solar Power",
    abilityEffect: "Raises Special Attack in sunshine.",
    weather: "sun",
    resolvedTypes: ["Fire"],
  });

  assert.deepEqual(modifiers, [
    {
      source: "Choice Specs",
      stat: "spa",
      multiplier: 1.5,
      label: "SpA +50%",
    },
    {
      source: "Solar Power",
      stat: "spa",
      multiplier: 1.5,
      label: "SpA +50% sun",
    },
    {
      source: "Choice Specs",
      stat: "spa",
      multiplier: 1.5,
      label: "SPA +50%",
    },
  ]);
});

test("supports choice scarf, choice band, pure power, and sand rush modifiers", () => {
  assert.deepEqual(
    getStatModifiers({
      itemName: "Choice Scarf",
    }),
    [
      {
        source: "Choice Scarf",
        stat: "spe",
        multiplier: 1.5,
        label: "Spe +50%",
      },
    ],
  );

  assert.deepEqual(
    getStatModifiers({
      itemName: "Choice Band",
      abilityName: "Pure Power",
      weather: "sand",
      abilityEffect: "Doubles Speed in a sandstorm.",
    }),
    [
      {
        source: "Choice Band",
        stat: "atk",
        multiplier: 1.5,
        label: "Atk +50%",
      },
      {
        source: "Pure Power",
        stat: "atk",
        multiplier: 2,
        label: "Atk x2",
      },
      {
        source: "Pure Power",
        stat: "spe",
        multiplier: 2,
        label: "Spe x2 sand",
      },
    ],
  );
});

test("applies hp and non-hp stat modifiers and recalculates bst", () => {
  const updated = applyStatModifiers(
    {
      hp: 100,
      atk: 90,
      def: 80,
      spa: 70,
      spd: 60,
      spe: 50,
      bst: 450,
    },
    [
      { stat: "hp", multiplier: 1.2 },
      { stat: "atk", multiplier: 1.5 },
    ],
  );

  assert.deepEqual(updated, {
    hp: 120,
    atk: 135,
    def: 80,
    spa: 70,
    spd: 60,
    spe: 50,
    bst: 515,
  });
});

test("builds average stats from summary stats or resolved stats and returns undefined for empty teams", () => {
  assert.equal(buildAverageStats([]), undefined);

  const average = buildAverageStats([
    {
      resolvedTypes: ["Water"],
      moves: [],
      summaryStats: {
        hp: 100,
        atk: 80,
        def: 70,
        spa: 90,
        spd: 85,
        spe: 65,
        bst: 490,
      },
    },
    {
      resolvedTypes: ["Fire"],
      moves: [],
      resolvedStats: {
        hp: 80,
        atk: 100,
        def: 60,
        spa: 110,
        spd: 70,
        spe: 95,
        bst: 515,
      },
    },
  ]);

  assert.deepEqual(average, {
    hp: 90,
    atk: 90,
    def: 65,
    spa: 100,
    spd: 78,
    spe: 80,
    bst: 503,
  });
});
