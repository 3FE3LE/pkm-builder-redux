import { test, assert } from "vitest";

import { buildCoverageSummary, buildDefensiveSections, getStatModifiers } from "../../lib/domain/battle";
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
});
