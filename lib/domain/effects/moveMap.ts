import type { MoveEffect } from "./types";
import { normalize, toPowerBand } from "./types";

/**
 * Manual overrides for moves whose effects can't be inferred from damageClass + power alone.
 * ~120 entries covering utility, self-drop, priority, pivoting, hazards, recovery, etc.
 */
const MOVE_OVERRIDES: Record<string, MoveEffect[]> = {
  // ── Self-Drop Damage ──
  "leaf storm": [
    { kind: "selfDropDamage", category: "special", powerBand: 4, droppedStat: "spa", stages: -2 },
  ],
  "draco meteor": [
    { kind: "selfDropDamage", category: "special", powerBand: 4, droppedStat: "spa", stages: -2 },
  ],
  "overheat": [
    { kind: "selfDropDamage", category: "special", powerBand: 4, droppedStat: "spa", stages: -2 },
  ],
  "psycho boost": [
    { kind: "selfDropDamage", category: "special", powerBand: 4, droppedStat: "spa", stages: -2 },
  ],
  "superpower": [
    { kind: "selfDropDamage", category: "physical", powerBand: 4, droppedStat: "atk", stages: -1 },
  ],
  "close combat": [
    { kind: "selfDropDamage", category: "physical", powerBand: 4, droppedStat: "def", stages: -1 },
  ],
  "v create": [
    { kind: "selfDropDamage", category: "physical", powerBand: 5, droppedStat: "def", stages: -1 },
  ],

  // ── Status-Boosted Damage ──
  "facade": [
    { kind: "statusBoostedDamage", category: "physical", powerBand: 3 },
  ],

  // ── Recoil Damage ──
  "brave bird": [
    { kind: "recoilDamage", category: "physical", powerBand: 4 },
  ],
  "flare blitz": [
    { kind: "recoilDamage", category: "physical", powerBand: 4 },
  ],
  "head smash": [
    { kind: "recoilDamage", category: "physical", powerBand: 5 },
  ],
  "wild charge": [
    { kind: "recoilDamage", category: "physical", powerBand: 4 },
  ],
  "double edge": [
    { kind: "recoilDamage", category: "physical", powerBand: 4 },
  ],
  "wood hammer": [
    { kind: "recoilDamage", category: "physical", powerBand: 4 },
  ],
  "head charge": [
    { kind: "recoilDamage", category: "physical", powerBand: 4 },
  ],

  // ── Draining ──
  "giga drain": [
    { kind: "draining", category: "special", powerBand: 3, drainFraction: 0.5 },
  ],
  "drain punch": [
    { kind: "draining", category: "physical", powerBand: 3, drainFraction: 0.5 },
  ],
  "horn leech": [
    { kind: "draining", category: "physical", powerBand: 3, drainFraction: 0.5 },
  ],
  "leech life": [
    { kind: "draining", category: "physical", powerBand: 3, drainFraction: 0.5 },
  ],
  "absorb": [
    { kind: "draining", category: "special", powerBand: 1, drainFraction: 0.5 },
  ],
  "mega drain": [
    { kind: "draining", category: "special", powerBand: 2, drainFraction: 0.5 },
  ],
  "oblivion wing": [
    { kind: "draining", category: "special", powerBand: 3, drainFraction: 0.75 },
  ],
  "parabolic charge": [
    { kind: "draining", category: "special", powerBand: 3, drainFraction: 0.5 },
  ],

  // ── Priority ──
  "bullet punch": [{ kind: "priority", value: 1, category: "physical" }],
  "mach punch": [{ kind: "priority", value: 1, category: "physical" }],
  "aqua jet": [{ kind: "priority", value: 1, category: "physical" }],
  "ice shard": [{ kind: "priority", value: 1, category: "physical" }],
  "shadow sneak": [{ kind: "priority", value: 1, category: "physical" }],
  "sucker punch": [{ kind: "priority", value: 1, category: "physical" }],
  "quick attack": [{ kind: "priority", value: 1, category: "physical" }],
  "extreme speed": [{ kind: "priority", value: 2, category: "physical" }],
  "vacuum wave": [{ kind: "priority", value: 1, category: "special" }],
  "fake out": [{ kind: "priority", value: 3, category: "physical" }],

  // ── Pivoting ──
  "u turn": [{ kind: "pivot", category: "physical" }],
  "volt switch": [{ kind: "pivot", category: "special" }],
  "flip turn": [{ kind: "pivot", category: "physical" }],
  "baton pass": [{ kind: "pivot" }],
  "parting shot": [{ kind: "pivot" }],
  "teleport": [{ kind: "pivot" }],

  // ── Recovery ──
  "roost": [{ kind: "recovery", fraction: 0.5 }],
  "recover": [{ kind: "recovery", fraction: 0.5 }],
  "soft boiled": [{ kind: "recovery", fraction: 0.5 }],
  "slack off": [{ kind: "recovery", fraction: 0.5 }],
  "synthesis": [{ kind: "recovery", fraction: 0.5 }],
  "morning sun": [{ kind: "recovery", fraction: 0.5 }],
  "moonlight": [{ kind: "recovery", fraction: 0.5 }],
  "wish": [{ kind: "recovery", fraction: 0.5 }],
  "milk drink": [{ kind: "recovery", fraction: 0.5 }],

  // ── Hazards ──
  "stealth rock": [{ kind: "hazard", layer: "stealthRock" }],
  "spikes": [{ kind: "hazard", layer: "spikes" }],
  "toxic spikes": [{ kind: "hazard", layer: "toxicSpikes" }],
  "sticky web": [{ kind: "hazard", layer: "stickyWeb" }],

  // ── Hazard Removal ──
  "rapid spin": [{ kind: "hazardRemoval" }],
  "defog": [{ kind: "hazardRemoval" }],

  // ── Status ──
  "thunder wave": [
    { kind: "speedControl", method: "paralysis" },
    { kind: "status", inflicts: "paralysis" },
  ],
  "will o wisp": [{ kind: "status", inflicts: "burn" }],
  "toxic": [{ kind: "status", inflicts: "toxic" }],
  "spore": [{ kind: "status", inflicts: "sleep" }],
  "sleep powder": [{ kind: "status", inflicts: "sleep" }],
  "hypnosis": [{ kind: "status", inflicts: "sleep" }],
  "sing": [{ kind: "status", inflicts: "sleep" }],
  "lovely kiss": [{ kind: "status", inflicts: "sleep" }],
  "glare": [{ kind: "status", inflicts: "paralysis" }],
  "stun spore": [
    { kind: "speedControl", method: "paralysis" },
    { kind: "status", inflicts: "paralysis" },
  ],
  "nuzzle": [
    { kind: "speedControl", method: "paralysis" },
    { kind: "status", inflicts: "paralysis" },
  ],
  "yawn": [{ kind: "status", inflicts: "sleep" }],

  // ── Speed Control ──
  "tailwind": [{ kind: "speedControl", method: "tailwind" }],
  "icy wind": [{ kind: "speedControl", method: "drop" }],
  "electroweb": [{ kind: "speedControl", method: "drop" }],
  "bulldoze": [{ kind: "speedControl", method: "drop" }],
  "rock tomb": [{ kind: "speedControl", method: "drop" }],

  // ── Protection ──
  "protect": [{ kind: "protection" }],
  "detect": [{ kind: "protection" }],
  "king s shield": [{ kind: "protection" }],
  "baneful bunker": [{ kind: "protection" }],
  "spiky shield": [{ kind: "protection" }],

  // ── Screens ──
  "reflect": [{ kind: "screen", defense: "physical" }],
  "light screen": [{ kind: "screen", defense: "special" }],
  "aurora veil": [{ kind: "screen", defense: "both" }],

  // ── Anti-Setup ──
  "taunt": [{ kind: "antiSetup", method: "taunt" }],
  "encore": [{ kind: "antiSetup", method: "encore" }],
  "haze": [{ kind: "antiSetup", method: "haze" }],
  "whirlwind": [{ kind: "antiSetup", method: "whirlwind" }],
  "roar": [{ kind: "antiSetup", method: "whirlwind" }],
  "dragon tail": [{ kind: "antiSetup", method: "whirlwind" }],
  "circle throw": [{ kind: "antiSetup", method: "whirlwind" }],

  // ── Setup (boosts) ──
  "swords dance": [{ kind: "setup", stat: "atk", stages: 2 }],
  "nasty plot": [{ kind: "setup", stat: "spa", stages: 2 }],
  "dragon dance": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "quiver dance": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "calm mind": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "bulk up": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "coil": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "shell smash": [{ kind: "setup", stat: "multiple", stages: 2 }],
  "shift gear": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "agility": [{ kind: "setup", stat: "spe", stages: 2 }],
  "rock polish": [{ kind: "setup", stat: "spe", stages: 2 }],
  "autotomize": [{ kind: "setup", stat: "spe", stages: 2 }],
  "iron defense": [{ kind: "setup", stat: "def", stages: 2 }],
  "acid armor": [{ kind: "setup", stat: "def", stages: 2 }],
  "amnesia": [{ kind: "setup", stat: "spd", stages: 2 }],
  "growth": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "work up": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "curse": [{ kind: "setup", stat: "multiple", stages: 1 }],
  "belly drum": [{ kind: "setup", stat: "atk", stages: 6 }],
  "tail glow": [{ kind: "setup", stat: "spa", stages: 3 }],
  "cotton guard": [{ kind: "setup", stat: "def", stages: 3 }],

  // ── Trapping ──
  "mean look": [{ kind: "trapping" }],
  "block": [{ kind: "trapping" }],
  "fire spin": [{ kind: "trapping" }],
  "whirlpool": [{ kind: "trapping" }],
  "wrap": [{ kind: "trapping" }],
  "bind": [{ kind: "trapping" }],
  "magma storm": [{ kind: "trapping" }],

  // ── Multi-Hit ──
  "bullet seed": [{ kind: "multiHit", category: "physical", hitsRange: [2, 5] }],
  "rock blast": [{ kind: "multiHit", category: "physical", hitsRange: [2, 5] }],
  "icicle spear": [{ kind: "multiHit", category: "physical", hitsRange: [2, 5] }],
  "pin missile": [{ kind: "multiHit", category: "physical", hitsRange: [2, 5] }],
  "tail slap": [{ kind: "multiHit", category: "physical", hitsRange: [2, 5] }],
  "scale shot": [{ kind: "multiHit", category: "physical", hitsRange: [2, 5] }],
};

/**
 * Resolve move effects for a single move.
 * Checks manual overrides first, then auto-classifies from move data.
 */
export function resolveMoveEffects(
  moveName: string,
  moveData?: { damageClass?: string | null; power?: number | null } | null,
): MoveEffect[] {
  const normalized = normalize(moveName);
  const override = MOVE_OVERRIDES[normalized];
  if (override) return override;

  if (!moveData) return [];

  const { damageClass, power } = moveData;
  if (
    (damageClass === "physical" || damageClass === "special") &&
    power != null &&
    power > 0
  ) {
    return [{ kind: "damage", category: damageClass, powerBand: toPowerBand(power) }];
  }

  return [];
}

/**
 * Resolve all move effects for a Pokémon's moveset.
 * Deduplicates by kind to avoid inflated synergy matches.
 */
export function resolveAllMoveEffects(
  moves: { name: string; damageClass?: string | null; power?: number | null }[],
): MoveEffect[] {
  const allEffects: MoveEffect[] = [];
  for (const move of moves) {
    const effects = resolveMoveEffects(move.name, move);
    allEffects.push(...effects);
  }
  return allEffects;
}
