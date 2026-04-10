import type { ItemEffect } from "./types";
import { normalize } from "./types";

const ITEM_EFFECT_MAP: Record<string, ItemEffect[]> = {
  // ── Choice Items ──
  "choice band": [{ kind: "choiceLock", stat: "atk", factor: 1.5 }],
  "choice specs": [{ kind: "choiceLock", stat: "spa", factor: 1.5 }],
  "choice scarf": [{ kind: "choiceLock", stat: "spe", factor: 1.5 }],

  // ── Life Orb ──
  "life orb": [{ kind: "lifeOrb" }],

  // ── Eviolite ──
  "eviolite": [{ kind: "eviolite" }],

  // ── Leftovers ──
  "leftovers": [{ kind: "leftovers" }],
  "black sludge": [{ kind: "leftovers" }],

  // ── Focus Sash ──
  "focus sash": [{ kind: "focusSash" }],

  // ── Status Orbs ──
  "flame orb": [{ kind: "statusOrb", inflicts: "burn" }],
  "toxic orb": [{ kind: "statusOrb", inflicts: "toxic" }],

  // ── Assault Vest ──
  "assault vest": [{ kind: "assaultVest" }],

  // ── Heavy-Duty Boots ──
  "heavy duty boots": [{ kind: "heavyDutyBoots" }],

  // ── Berry Heals ──
  "sitrus berry": [{ kind: "berryHeal" }],

  // ── Type-Boosting Items ──
  "charcoal": [{ kind: "typeBoost", type: "Fire", factor: 1.2 }],
  "mystic water": [{ kind: "typeBoost", type: "Water", factor: 1.2 }],
  "miracle seed": [{ kind: "typeBoost", type: "Grass", factor: 1.2 }],
  "magnet": [{ kind: "typeBoost", type: "Electric", factor: 1.2 }],
  "never melt ice": [{ kind: "typeBoost", type: "Ice", factor: 1.2 }],
  "black belt": [{ kind: "typeBoost", type: "Fighting", factor: 1.2 }],
  "poison barb": [{ kind: "typeBoost", type: "Poison", factor: 1.2 }],
  "soft sand": [{ kind: "typeBoost", type: "Ground", factor: 1.2 }],
  "sharp beak": [{ kind: "typeBoost", type: "Flying", factor: 1.2 }],
  "twisted spoon": [{ kind: "typeBoost", type: "Psychic", factor: 1.2 }],
  "silver powder": [{ kind: "typeBoost", type: "Bug", factor: 1.2 }],
  "hard stone": [{ kind: "typeBoost", type: "Rock", factor: 1.2 }],
  "spell tag": [{ kind: "typeBoost", type: "Ghost", factor: 1.2 }],
  "dragon fang": [{ kind: "typeBoost", type: "Dragon", factor: 1.2 }],
  "black glasses": [{ kind: "typeBoost", type: "Dark", factor: 1.2 }],
  "metal coat": [{ kind: "typeBoost", type: "Steel", factor: 1.2 }],
  "silk scarf": [{ kind: "typeBoost", type: "Normal", factor: 1.2 }],

  // ── Plates (same function, slightly higher boost) ──
  "flame plate": [{ kind: "typeBoost", type: "Fire", factor: 1.2 }],
  "splash plate": [{ kind: "typeBoost", type: "Water", factor: 1.2 }],
  "meadow plate": [{ kind: "typeBoost", type: "Grass", factor: 1.2 }],
  "zap plate": [{ kind: "typeBoost", type: "Electric", factor: 1.2 }],
  "icicle plate": [{ kind: "typeBoost", type: "Ice", factor: 1.2 }],
  "fist plate": [{ kind: "typeBoost", type: "Fighting", factor: 1.2 }],
  "toxic plate": [{ kind: "typeBoost", type: "Poison", factor: 1.2 }],
  "earth plate": [{ kind: "typeBoost", type: "Ground", factor: 1.2 }],
  "sky plate": [{ kind: "typeBoost", type: "Flying", factor: 1.2 }],
  "mind plate": [{ kind: "typeBoost", type: "Psychic", factor: 1.2 }],
  "insect plate": [{ kind: "typeBoost", type: "Bug", factor: 1.2 }],
  "stone plate": [{ kind: "typeBoost", type: "Rock", factor: 1.2 }],
  "spooky plate": [{ kind: "typeBoost", type: "Ghost", factor: 1.2 }],
  "draco plate": [{ kind: "typeBoost", type: "Dragon", factor: 1.2 }],
  "dread plate": [{ kind: "typeBoost", type: "Dark", factor: 1.2 }],
  "iron plate": [{ kind: "typeBoost", type: "Steel", factor: 1.2 }],
  "pixie plate": [{ kind: "typeBoost", type: "Fairy", factor: 1.2 }],
};

export function resolveItemEffects(
  itemName: string | null | undefined,
): ItemEffect[] {
  if (!itemName) return [];
  return ITEM_EFFECT_MAP[normalize(itemName)] ?? [];
}
