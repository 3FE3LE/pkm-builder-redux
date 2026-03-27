import { test, assert } from "vitest";

import { calculateEffectiveStats } from "../../lib/domain/battle";
import { getRepresentativeIv, inferIvForObservedStat } from "../../lib/domain/ivCalculator";

const MANTINE = {
  hp: 85,
  atk: 40,
  def: 70,
  spa: 80,
  spd: 140,
  spe: 70,
  bst: 485,
} as const;

test("finds an exact IV when the observed stat maps to a single value", () => {
  const observed = calculateEffectiveStats(MANTINE, 75, "Timid", { spe: 31 }, {}).spe;
  const result = inferIvForObservedStat({
    baseStats: MANTINE,
    level: 75,
    nature: "Timid",
    stat: "spe",
    observed,
  });

  assert.equal(result.exactIv, 31);
  assert.deepEqual(result.candidates, [31]);
});

test("returns an IV range when multiple IVs collapse to the same observed stat", () => {
  const observed = calculateEffectiveStats(MANTINE, 5, "Serious", { atk: 7 }, {}).atk;
  const result = inferIvForObservedStat({
    baseStats: MANTINE,
    level: 5,
    nature: "Serious",
    stat: "atk",
    observed,
  });

  assert.equal(result.exactIv, null);
  assert.ok((result.minIv ?? -1) <= 7);
  assert.ok((result.maxIv ?? -1) >= 7);
  assert.ok(result.candidates.length > 1);
});

test("returns no candidates when the observed value is outside the legal range", () => {
  const result = inferIvForObservedStat({
    baseStats: MANTINE,
    level: 5,
    nature: "Serious",
    stat: "spd",
    observed: 999,
  });

  assert.equal(result.exactIv, null);
  assert.deepEqual(result.candidates, []);
  assert.equal(result.minIv, null);
  assert.equal(result.maxIv, null);
});

test("returns an exact IV directly as the representative value", () => {
  const result = inferIvForObservedStat({
    baseStats: MANTINE,
    level: 75,
    nature: "Timid",
    stat: "spe",
    observed: calculateEffectiveStats(MANTINE, 75, "Timid", { spe: 31 }, {}).spe,
  });

  assert.equal(getRepresentativeIv(result), 31);
});

test("returns the midpoint of an inferred range when the IV is ambiguous", () => {
  const result = inferIvForObservedStat({
    baseStats: MANTINE,
    level: 5,
    nature: "Serious",
    stat: "atk",
    observed: calculateEffectiveStats(MANTINE, 5, "Serious", { atk: 7 }, {}).atk,
  });

  assert.equal(
    getRepresentativeIv(result),
    Math.round(((result.minIv ?? 0) + (result.maxIv ?? 0)) / 2),
  );
});

test("returns zero as the representative value when no IV candidate exists", () => {
  const result = inferIvForObservedStat({
    baseStats: MANTINE,
    level: 5,
    nature: "Serious",
    stat: "spd",
    observed: 999,
  });

  assert.equal(getRepresentativeIv(result), 0);
});
