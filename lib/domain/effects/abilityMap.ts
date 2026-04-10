import type { AbilityEffect } from "./types";
import { normalize } from "./types";

/**
 * Static map from normalized ability name → abstract effects.
 * Covers ~60 abilities relevant to competitive/nuzlocke evaluation.
 * Any ability not in this map is treated as having no scorable effect.
 */
export const ABILITY_EFFECT_MAP: Record<string, AbilityEffect[]> = {
  // ── Stat Inversion ──
  "contrary": [{ kind: "invertStatChanges" }],

  // ── Auto Speed ──
  "speed boost": [{ kind: "autoSpeedBoost" }],

  // ── Low-Power Amplification ──
  "technician": [{ kind: "lowPowerAmplify", threshold: 60 }],

  // ── Priority Status ──
  "prankster": [{ kind: "priorityOnStatus" }],

  // ── Offensive Multipliers ──
  "huge power": [{ kind: "offensiveMultiplier", stat: "atk", factor: 2 }],
  "pure power": [{ kind: "offensiveMultiplier", stat: "atk", factor: 2 }],

  // ── Status Power ──
  "guts": [{ kind: "statusPowerUp", stat: "atk" }],
  "quick feet": [{ kind: "statusPowerUp", stat: "atk" }],

  // ── Pivot Recovery ──
  "regenerator": [{ kind: "pivotRecovery", fraction: 1 / 3 }],

  // ── STAB Boost ──
  "adaptability": [{ kind: "adaptability" }],

  // ── Type Immunities ──
  "levitate": [{ kind: "immunity", immuneTo: ["Ground"] }],
  "lightning rod": [{ kind: "typeNullify", absorbType: "Electric", grants: "boost" }],
  "storm drain": [{ kind: "typeNullify", absorbType: "Water", grants: "boost" }],
  "sap sipper": [{ kind: "typeNullify", absorbType: "Grass", grants: "boost" }],
  "motor drive": [{ kind: "typeNullify", absorbType: "Electric", grants: "boost" }],

  // ── Type Absorption ──
  "flash fire": [{ kind: "typeNullify", absorbType: "Fire", grants: "boost" }],
  "water absorb": [{ kind: "typeNullify", absorbType: "Water", grants: "heal" }],
  "volt absorb": [{ kind: "typeNullify", absorbType: "Electric", grants: "heal" }],
  "dry skin": [
    { kind: "typeNullify", absorbType: "Water", grants: "heal" },
    { kind: "other", tag: "fire-weakness" },
  ],

  // ── Weather Setters ──
  "drought": [{ kind: "weatherSet", weather: "sun" }],
  "drizzle": [{ kind: "weatherSet", weather: "rain" }],
  "sand stream": [{ kind: "weatherSet", weather: "sand" }],
  "snow warning": [{ kind: "weatherSet", weather: "hail" }],

  // ── Weather Speed ──
  "swift swim": [{ kind: "weatherSpeed", weather: "rain" }],
  "chlorophyll": [{ kind: "weatherSpeed", weather: "sun" }],
  "sand rush": [{ kind: "weatherSpeed", weather: "sand" }],
  "slush rush": [{ kind: "weatherSpeed", weather: "hail" }],

  // ── Intimidate ──
  "intimidate": [{ kind: "intimidate" }],

  // ── Defensive Passives ──
  "magic guard": [{ kind: "magicGuard" }],
  "sturdy": [{ kind: "sturdy" }],
  "natural cure": [{ kind: "naturalCure" }],
  "multiscale": [{ kind: "multiscale" }],
  "magic bounce": [{ kind: "magicBounce" }],

  // ── Accuracy / Evasion ──
  "no guard": [{ kind: "noGuard" }],
  "compound eyes": [{ kind: "other", tag: "accuracy-boost" }],
  "hustle": [{ kind: "offensiveMultiplier", stat: "atk", factor: 1.5 }],

  // ── Ability Piercing ──
  "mold breaker": [{ kind: "moldBreaker" }],
  "teravolt": [{ kind: "moldBreaker" }],
  "turboblaze": [{ kind: "moldBreaker" }],

  // ── Download ──
  "download": [{ kind: "download" }],

  // ── Secondary Rate Boost ──
  "serene grace": [{ kind: "sereneGrace" }],

  // ── Sheer Force ──
  "sheer force": [{ kind: "sheerForce" }],

  // ── Contact Punish ──
  "rough skin": [{ kind: "contactPunish", effect: "damage" }],
  "iron barbs": [{ kind: "contactPunish", effect: "damage" }],
  "flame body": [{ kind: "contactPunish", effect: "burn" }],
  "static": [{ kind: "contactPunish", effect: "paralyze" }],
  "poison point": [{ kind: "contactPunish", effect: "poison" }],
  "effect spore": [{ kind: "contactPunish", effect: "paralyze" }],

  // ── Misc Competitive ──
  "marvel scale": [{ kind: "other", tag: "defense-on-status" }],
  "poison heal": [{ kind: "other", tag: "poison-recovery" }],
  "thick fat": [
    { kind: "immunity", immuneTo: [] },
    { kind: "other", tag: "fire-ice-resist" },
  ],
  "unaware": [{ kind: "other", tag: "ignore-boosts" }],
  "tinted lens": [{ kind: "other", tag: "resisted-boost" }],
};

/**
 * Resolve ability effects for a Pokémon.
 * Takes the active ability + full ability pool, returns effects for the best scorable ability.
 */
export function resolveAbilityEffects(
  ability: string | null | undefined,
  abilities: string[] | null | undefined,
): AbilityEffect[] {
  const pool = [ability, ...(abilities ?? [])]
    .filter((a): a is string => Boolean(a))
    .map(normalize);

  // Return effects from the first ability that has mapped effects.
  // This naturally picks the "best" ability since the active one is checked first.
  for (const name of pool) {
    const effects = ABILITY_EFFECT_MAP[name];
    if (effects) return effects;
  }

  return [];
}
