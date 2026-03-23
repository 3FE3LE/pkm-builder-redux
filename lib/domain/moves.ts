import type { BattleWeather } from "./battle";
import type { ParsedDocs } from "../docsSchema";
import { normalizeName, toTitleCase } from "./names";

export type StatKey = "atk" | "def" | "spa" | "spd" | "spe";
export type FullStatKey = "hp" | StatKey;
export type StatSpread = Record<FullStatKey, number>;

export type MoveLike = {
  name: string;
  type?: string | null;
  damageClass?: string | null;
  power?: number | null;
  accuracy?: number | null;
  description?: string;
};

export type RemoteMoveLike = {
  type: string;
  power?: number | null;
  damageClass: string;
};

const HIDDEN_POWER_TYPES = [
  "Fighting",
  "Flying",
  "Poison",
  "Ground",
  "Rock",
  "Bug",
  "Ghost",
  "Steel",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Psychic",
  "Ice",
  "Dragon",
  "Dark",
] as const;

const TYPE_BOOST_ITEMS: Record<string, string> = {
  Charcoal: "Fire",
  MysticWater: "Water",
  MiracleSeed: "Grass",
  Magnet: "Electric",
  NeverMeltIce: "Ice",
  BlackBelt: "Fighting",
  PoisonBarb: "Poison",
  SoftSand: "Ground",
  SharpBeak: "Flying",
  TwistedSpoon: "Psychic",
  SilverPowder: "Bug",
  HardStone: "Rock",
  SpellTag: "Ghost",
  DragonFang: "Dragon",
  BlackGlasses: "Dark",
  MetalCoat: "Steel",
  PixiePlate: "Fairy",
};

const MOVE_NAME_ALIASES: Record<string, string> = {
  "acid-armour": "acid-armor",
  autonomize: "autotomize",
  "faint-attack": "feint-attack",
  "hurricane-[*]": "hurricane",
  "ominous-mind": "ominous-wind",
  "sliver-wind": "silver-wind",
  twinneedle: "twineedle",
  "will-o-wiisp": "will-o-wisp",
};

export function normalizeMoveLookupName(input?: string | null) {
  const normalized = normalizeName(input);
  return MOVE_NAME_ALIASES[normalized] ?? normalized;
}

function compactCompare(input: string) {
  return normalizeName(input).replace(/-/g, "");
}

function isHiddenPowerMove(moveName: string) {
  return normalizeMoveLookupName(moveName) === "hidden-power";
}

function moveHasSecondaryEffect(move?: MoveLike | null) {
  if (!move?.description || !move.power || move.damageClass === "status") {
    return false;
  }
  const description = move.description.toLowerCase();
  return /(chance|may |lowers|raises|poison|burn|freeze|paraly|flinch|confus|recoil|recharg|drain)/.test(
    description,
  );
}

function isPunchMove(moveName: string) {
  return /punch/i.test(moveName);
}

function isMoveNamed(moveName: string, target: string) {
  return normalizeMoveLookupName(moveName) === normalizeMoveLookupName(target);
}

export function getHiddenPowerResult(ivs?: Partial<StatSpread>) {
  const spread = {
    hp: Math.max(0, Math.min(31, Math.round(ivs?.hp ?? 0))),
    atk: Math.max(0, Math.min(31, Math.round(ivs?.atk ?? 0))),
    def: Math.max(0, Math.min(31, Math.round(ivs?.def ?? 0))),
    spa: Math.max(0, Math.min(31, Math.round(ivs?.spa ?? 0))),
    spd: Math.max(0, Math.min(31, Math.round(ivs?.spd ?? 0))),
    spe: Math.max(0, Math.min(31, Math.round(ivs?.spe ?? 0))),
  };

  const typeBits = [
    spread.hp % 2,
    spread.atk % 2,
    spread.def % 2,
    spread.spe % 2,
    spread.spa % 2,
    spread.spd % 2,
  ];
  const typeValue = Math.floor(
    (typeBits[0] +
      typeBits[1] * 2 +
      typeBits[2] * 4 +
      typeBits[3] * 8 +
      typeBits[4] * 16 +
      typeBits[5] * 32) *
      15 /
      63,
  );

  const powerBits = [
    Math.floor((spread.hp % 4) / 2),
    Math.floor((spread.atk % 4) / 2),
    Math.floor((spread.def % 4) / 2),
    Math.floor((spread.spe % 4) / 2),
    Math.floor((spread.spa % 4) / 2),
    Math.floor((spread.spd % 4) / 2),
  ];
  const power =
    Math.floor(
      (powerBits[0] +
        powerBits[1] * 2 +
        powerBits[2] * 4 +
        powerBits[3] * 8 +
        powerBits[4] * 16 +
        powerBits[5] * 32) *
        40 /
        63,
    ) + 30;

  return {
    type: HIDDEN_POWER_TYPES[typeValue] ?? "Dark",
    power,
  };
}

export function resolveMoveType(
  docs: ParsedDocs,
  moveName: string,
  remote?: RemoteMoveLike,
  ivs?: Partial<StatSpread>,
) {
  const normalized = normalizeMoveLookupName(moveName);
  const override = docs.moveTypeOverrides.find(
    (entry) => normalizeMoveLookupName(entry.move) === normalized,
  );
  if (override) {
    return override.to;
  }
  if (isHiddenPowerMove(moveName)) {
    return getHiddenPowerResult(ivs).type;
  }
  return remote ? toTitleCase(remote.type) : undefined;
}

export function resolveMovePower(
  moveName: string,
  remote?: Pick<RemoteMoveLike, "power">,
  ivs?: Partial<StatSpread>,
) {
  if (isHiddenPowerMove(moveName)) {
    return getHiddenPowerResult(ivs).power;
  }
  return remote?.power ?? null;
}

export function getWeatherAdjustedMove(
  move: MoveLike,
  weather: BattleWeather = "clear",
) {
  const next = {
    ...move,
    power: move.power ?? null,
    accuracy: move.accuracy ?? null,
  };

  if (weather === "clear") {
    return next;
  }

  if (isMoveNamed(move.name, "Weather Ball")) {
    const weatherBallType =
      weather === "sun"
        ? "Fire"
        : weather === "rain"
          ? "Water"
          : weather === "sand"
            ? "Rock"
            : weather === "hail"
              ? "Ice"
              : move.type;

    return {
      ...next,
      type: weatherBallType,
      power: next.power ? next.power * 2 : next.power,
    };
  }

  if (
    weather !== "sun" &&
    (isMoveNamed(move.name, "Solar Beam") || isMoveNamed(move.name, "Solar Blade"))
  ) {
    return {
      ...next,
      power: next.power ? Math.round(next.power / 2) : next.power,
    };
  }

  if (
    weather === "rain" &&
    (isMoveNamed(move.name, "Thunder") || isMoveNamed(move.name, "Hurricane"))
  ) {
    return {
      ...next,
      accuracy: 100,
    };
  }

  if (weather === "hail" && isMoveNamed(move.name, "Blizzard")) {
    return {
      ...next,
      accuracy: 100,
    };
  }

  if (
    weather === "sun" &&
    (isMoveNamed(move.name, "Thunder") || isMoveNamed(move.name, "Hurricane"))
  ) {
    return {
      ...next,
      accuracy: 50,
    };
  }

  return next;
}

export function getMovePowerModifiers({
  move,
  itemName,
  itemEffect,
  abilityName,
  abilityEffect,
  weather = "clear",
}: {
  move: MoveLike;
  itemName?: string;
  itemEffect?: string;
  abilityName?: string;
  abilityEffect?: string;
  weather?: BattleWeather;
}) {
  if (!move.power || move.damageClass === "status") {
    return [];
  }

  const modifiers: { source: string; multiplier: number; label: string }[] = [];
  const normalizedItem = compactCompare(itemName ?? "");
  const normalizedAbility = compactCompare(abilityName ?? "");
  const normalizedType = compactCompare(move.type ?? "");
  const effectTextItem = (itemEffect ?? "").toLowerCase();
  const effectTextAbility = (abilityEffect ?? "").toLowerCase();

  if (normalizedItem === "wiseglasses" && move.damageClass === "special") {
    modifiers.push({ source: itemName!, multiplier: 1.1, label: "special +10%" });
  }

  if (normalizedItem === "muscleband" && move.damageClass === "physical") {
    modifiers.push({ source: itemName!, multiplier: 1.1, label: "physical +10%" });
  }

  const matchingTypeBoostEntry = Object.entries(TYPE_BOOST_ITEMS).find(
    ([itemKey, type]) =>
      normalizedItem === itemKey.toLowerCase() && normalizedType === type.toLowerCase(),
  );
  if (matchingTypeBoostEntry) {
    modifiers.push({ source: itemName!, multiplier: 1.2, label: `${move.type} +20%` });
  }

  if (weather === "sun") {
    if (normalizedType === "fire") {
      modifiers.push({ source: "Sun", multiplier: 1.5, label: "Fire +50%" });
    }
    if (normalizedType === "water") {
      modifiers.push({ source: "Sun", multiplier: 0.5, label: "Water -50%" });
    }
  }

  if (weather === "rain") {
    if (normalizedType === "water") {
      modifiers.push({ source: "Rain", multiplier: 1.5, label: "Water +50%" });
    }
    if (normalizedType === "fire") {
      modifiers.push({ source: "Rain", multiplier: 0.5, label: "Fire -50%" });
    }
  }

  if (
    /boosts?.+damage.+type moves? by 20%/i.test(itemEffect ?? "") &&
    move.type &&
    effectTextItem.includes(`${move.type.toLowerCase()}-type`)
  ) {
    modifiers.push({ source: itemName!, multiplier: 1.2, label: `${move.type} +20%` });
  }

  if (normalizedAbility === "ironfist" && isPunchMove(move.name)) {
    modifiers.push({ source: abilityName!, multiplier: 1.2, label: "punch +20%" });
  }

  if (normalizedAbility === "technician" && move.power <= 60) {
    modifiers.push({ source: abilityName!, multiplier: 1.5, label: "weak move +50%" });
  }

  if (normalizedAbility === "strongjaw" && /bite|fang|crunch/i.test(move.name)) {
    modifiers.push({ source: abilityName!, multiplier: 1.5, label: "jaw +50%" });
  }

  if (normalizedAbility === "megalauncher" && /pulse/i.test(move.name)) {
    modifiers.push({ source: abilityName!, multiplier: 1.5, label: "pulse +50%" });
  }

  if (
    normalizedAbility === "reckless" &&
    /(recoil|crash)/i.test(effectTextAbility + " " + (move.description ?? ""))
  ) {
    modifiers.push({ source: abilityName!, multiplier: 1.2, label: "recoil +20%" });
  }

  if (normalizedAbility === "sheerforce" && moveHasSecondaryEffect(move)) {
    modifiers.push({ source: abilityName!, multiplier: 1.3, label: "secondary effect +30%" });
  }

  if (
    normalizedAbility &&
    /(boosts? .+ moves? by 20%)/i.test(abilityEffect ?? "") &&
    move.type &&
    effectTextAbility.includes(`${move.type.toLowerCase()}-type`)
  ) {
    modifiers.push({ source: abilityName!, multiplier: 1.2, label: `${move.type} +20%` });
  }

  return modifiers;
}

export function applyMovePowerModifiers(
  basePower: number | null | undefined,
  modifiers: { multiplier: number }[],
) {
  if (!basePower) {
    return basePower ?? null;
  }
  return Math.round(modifiers.reduce((total, modifier) => total * modifier.multiplier, basePower));
}
