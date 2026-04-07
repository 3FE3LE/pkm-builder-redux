import { test, assert } from "vitest";

import {
  applyMovePowerModifiers,
  getMovePowerModifiers,
  getWeatherAdjustedMove,
  getHiddenPowerResult,
  normalizeMoveLookupName,
  resolveMovePower,
  resolveMoveType,
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
      priority: null,
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

test("resolves move type from overrides, hidden power ivs, and remote data", () => {
  const docs = {
    moveReplacements: [],
    moveTypeChanges: [],
    moveTypeOverrides: [{ move: "Weather Ball", from: "Normal", to: "Fire" }],
    moveDetails: [],
    typeChanges: [],
    itemLocations: [],
    itemHighlights: [],
    gifts: [],
    trades: [],
    wildAreas: [],
    pokemonProfiles: [],
    evolutionChanges: [],
  };

  assert.equal(resolveMoveType(docs, "Weather Ball", { type: "Normal", damageClass: "special" }), "Fire");
  assert.equal(
    resolveMoveType(docs, "Hidden Power", { type: "Normal", damageClass: "special" }, { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }),
    "Dark",
  );
  assert.equal(
    resolveMoveType({ ...docs, moveTypeOverrides: [] }, "Flamethrower", { type: "fire", damageClass: "special" }),
    "Fire",
  );
  assert.equal(resolveMoveType({ ...docs, moveTypeOverrides: [] }, "Splash"), undefined);
});

test("resolves move power from hidden power ivs, remote data, and missing moves", () => {
  assert.equal(
    resolveMovePower("Hidden Power", { power: 60 }, { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }),
    70,
  );
  assert.equal(resolveMovePower("Surf", { power: 95 }), 95);
  assert.equal(resolveMovePower("Splash"), null);
});

test("returns no power modifiers for status or power-free moves", () => {
  assert.deepEqual(
    getMovePowerModifiers({
      move: { name: "Swords Dance", type: "Normal", damageClass: "status", power: null },
      itemName: "Muscle Band",
      abilityName: "Technician",
    }),
    [],
  );
});

test("collects item, weather, and ability power modifiers across supported cases", () => {
  const elementalPunch = getMovePowerModifiers({
    move: {
      name: "Fire Punch",
      type: "Fire",
      damageClass: "physical",
      power: 60,
      description: "May burn the target.",
    },
    itemName: "Charcoal",
    abilityName: "Iron Fist",
    weather: "sun",
  });
  assert.deepEqual(
    elementalPunch.map((entry) => entry.label),
    ["Fire +20%", "Fire +50%", "punch +20%"],
  );

  const rainFirePenalty = getMovePowerModifiers({
    move: { name: "Flamethrower", type: "Fire", damageClass: "special", power: 95 },
    itemName: "Wise Glasses",
    weather: "rain",
  });
  assert.deepEqual(
    rainFirePenalty.map((entry) => entry.label),
    ["special +10%", "Fire -50%"],
  );

  const boostedByText = getMovePowerModifiers({
    move: { name: "Surf", type: "Water", damageClass: "special", power: 95 },
    itemName: "Sea Incense",
    itemEffect: "Boosts the damage of Water-type moves by 20%.",
    abilityName: "Torrent",
    abilityEffect: "Boosts Water-type moves by 20%.",
    weather: "rain",
  });
  assert.deepEqual(
    boostedByText.map((entry) => entry.label),
    ["Water +50%", "Water +20%", "Water +20%"],
  );

  const chainAbilities = getMovePowerModifiers({
    move: {
      name: "Water Pulse",
      type: "Water",
      damageClass: "special",
      power: 60,
      description: "May confuse the target.",
    },
    abilityName: "Mega Launcher",
  });
  assert.deepEqual(chainAbilities.map((entry) => entry.label), ["pulse +50%"]);
});

test("recognizes technician, strong jaw, reckless, and sheer force style boosts", () => {
  assert.deepEqual(
    getMovePowerModifiers({
      move: { name: "Bullet Seed", type: "Grass", damageClass: "physical", power: 25 },
      abilityName: "Technician",
    }).map((entry) => entry.label),
    ["weak move +50%"],
  );

  assert.deepEqual(
    getMovePowerModifiers({
      move: { name: "Crunch", type: "Dark", damageClass: "physical", power: 80 },
      abilityName: "Strong Jaw",
    }).map((entry) => entry.label),
    ["jaw +50%"],
  );

  assert.deepEqual(
    getMovePowerModifiers({
      move: {
        name: "Double-Edge",
        type: "Normal",
        damageClass: "physical",
        power: 120,
        description: "A tackle that also hurts the user by recoil.",
      },
      abilityName: "Reckless",
      abilityEffect: "Boosts recoil and crash moves.",
    }).map((entry) => entry.label),
    ["recoil +20%"],
  );

  assert.deepEqual(
    getMovePowerModifiers({
      move: {
        name: "Rock Slide",
        type: "Rock",
        damageClass: "physical",
        power: 75,
        description: "May cause the target to flinch.",
      },
      abilityName: "Sheer Force",
    }).map((entry) => entry.label),
    ["secondary effect +30%"],
  );
});

test("applies multiplicative power modifiers and preserves nullish values", () => {
  assert.equal(applyMovePowerModifiers(100, [{ multiplier: 1.2 }, { multiplier: 1.5 }]), 180);
  assert.equal(applyMovePowerModifiers(null, [{ multiplier: 2 }]), null);
  assert.equal(applyMovePowerModifiers(undefined, [{ multiplier: 2 }]), null);
  assert.equal(applyMovePowerModifiers(0, [{ multiplier: 2 }]), 0);
});
