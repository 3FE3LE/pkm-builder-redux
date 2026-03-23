import test from "node:test";
import assert from "node:assert/strict";

import {
  getWeatherAdjustedMove,
  getHiddenPowerResult,
  normalizeMoveLookupName,
} from "../../lib/domain/moves";

test("normalizes legacy move aliases like Faint Attack", () => {
  assert.equal(normalizeMoveLookupName("Faint Attack"), "feint-attack");
  assert.equal(normalizeMoveLookupName("Twinneedle"), "twineedle");
});

test("calculates Hidden Power for zero IV spread", () => {
  assert.deepEqual(
    getHiddenPowerResult({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }),
    { type: "Fighting", power: 30 },
  );
});

test("calculates Hidden Power for perfect IV spread", () => {
  assert.deepEqual(
    getHiddenPowerResult({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }),
    { type: "Dark", power: 70 },
  );
});

test("weather ball changes type and power with weather", () => {
  assert.deepEqual(
    getWeatherAdjustedMove(
      { name: "Weather Ball", type: "Normal", power: 50, accuracy: 100, damageClass: "special" },
      "rain",
    ),
    {
      name: "Weather Ball",
      type: "Water",
      power: 100,
      accuracy: 100,
      damageClass: "special",
    },
  );
});

test("solar beam is weakened outside of sun", () => {
  assert.equal(
    getWeatherAdjustedMove(
      { name: "Solar Beam", type: "Grass", power: 120, accuracy: 100, damageClass: "special" },
      "rain",
    ).power,
    60,
  );
});

test("weather adjusts accuracy for thunder style moves", () => {
  assert.equal(
    getWeatherAdjustedMove(
      { name: "Thunder", type: "Electric", power: 110, accuracy: 70, damageClass: "special" },
      "rain",
    ).accuracy,
    100,
  );
  assert.equal(
    getWeatherAdjustedMove(
      { name: "Thunder", type: "Electric", power: 110, accuracy: 70, damageClass: "special" },
      "sun",
    ).accuracy,
    50,
  );
});

test("hail gives blizzard perfect accuracy", () => {
  assert.equal(
    getWeatherAdjustedMove(
      { name: "Blizzard", type: "Ice", power: 110, accuracy: 70, damageClass: "special" },
      "hail",
    ).accuracy,
    100,
  );
});
