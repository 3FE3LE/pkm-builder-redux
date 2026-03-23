export type MultiplierBucket = "x4" | "x2" | "x1" | "x0.5" | "x0.25" | "x0";

export const TYPE_ORDER = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
] as const;

export const TYPE_STYLES: Record<string, string> = {};

export const TYPE_COLORS: Record<string, string> = {
  Normal: "var(--type-normal)",
  Fire: "var(--type-fire)",
  Water: "var(--type-water)",
  Electric: "var(--type-electric)",
  Grass: "var(--type-grass)",
  Ice: "var(--type-ice)",
  Fighting: "var(--type-fighting)",
  Poison: "var(--type-poison)",
  Ground: "var(--type-ground)",
  Flying: "var(--type-flying)",
  Psychic: "var(--type-psychic)",
  Bug: "var(--type-bug)",
  Rock: "var(--type-rock)",
  Ghost: "var(--type-ghost)",
  Dragon: "var(--type-dragon)",
  Dark: "var(--type-dark)",
  Steel: "var(--type-steel)",
  Fairy: "var(--type-fairy)",
};

export const TYPE_TEXT_COLORS: Record<string, string> = {
  Normal: "var(--type-normal-text)",
  Fire: "var(--type-fire-text)",
  Water: "var(--type-water-text)",
  Electric: "var(--type-electric-text)",
  Grass: "var(--type-grass-text)",
  Ice: "var(--type-ice-text)",
  Fighting: "var(--type-fighting-text)",
  Poison: "var(--type-poison-text)",
  Ground: "var(--type-ground-text)",
  Flying: "var(--type-flying-text)",
  Psychic: "var(--type-psychic-text)",
  Bug: "var(--type-bug-text)",
  Rock: "var(--type-rock-text)",
  Ghost: "var(--type-ghost-text)",
  Dragon: "var(--type-dragon-text)",
  Dark: "var(--type-dark-text)",
  Steel: "var(--type-steel-text)",
  Fairy: "var(--type-fairy-text)",
};

const TYPE_TEXTURES: Record<string, string> = {
  Normal:
    "repeating-linear-gradient(135deg, hsl(0 0% 100% / 0.05) 0 5px, transparent 5px 11px), repeating-linear-gradient(45deg, hsl(0 0% 0% / 0.06) 0 1px, transparent 1px 9px)",
  Fire:
    "radial-gradient(48% 115% at 6% 118%, hsl(42 100% 92% / 0.28) 0 24%, transparent 25%), radial-gradient(42% 108% at 34% 116%, hsl(24 100% 74% / 0.24) 0 22%, transparent 23%), radial-gradient(46% 120% at 68% 118%, hsl(12 95% 60% / 0.22) 0 22%, transparent 23%), radial-gradient(38% 96% at 92% 114%, hsl(42 100% 88% / 0.2) 0 18%, transparent 19%), linear-gradient(160deg, transparent 0 26%, hsl(10 88% 24% / 0.16) 26% 34%, transparent 34% 100%)",
  Water:
    "radial-gradient(28% 34% at 10% 8%, hsl(0 0% 100% / 0.18) 0 16%, transparent 17%), radial-gradient(28% 34% at 34% 14%, hsl(0 0% 100% / 0.16) 0 16%, transparent 17%), radial-gradient(28% 34% at 58% 8%, hsl(0 0% 100% / 0.18) 0 16%, transparent 17%), radial-gradient(28% 34% at 82% 14%, hsl(0 0% 100% / 0.16) 0 16%, transparent 17%), radial-gradient(34% 42% at 22% 92%, hsl(210 72% 24% / 0.16) 0 18%, transparent 19%), radial-gradient(34% 42% at 70% 88%, hsl(210 72% 24% / 0.16) 0 18%, transparent 19%), repeating-linear-gradient(180deg, hsl(0 0% 100% / 0.08) 0 2px, transparent 2px 9px)",
  Electric:
    "repeating-linear-gradient(135deg, hsl(0 0% 100% / 0.15) 0 2px, transparent 2px 10px), linear-gradient(115deg, transparent 0 26%, hsl(48 100% 24% / 0.18) 26% 31%, transparent 31% 100%), linear-gradient(65deg, transparent 0 62%, hsl(0 0% 100% / 0.11) 62% 66%, transparent 66% 100%)",
  Grass:
    "repeating-linear-gradient(120deg, hsl(0 0% 100% / 0.08) 0 3px, transparent 3px 11px), linear-gradient(90deg, transparent 0 24%, hsl(115 45% 20% / 0.1) 24% 26%, transparent 26% 100%), linear-gradient(90deg, transparent 0 68%, hsl(115 45% 20% / 0.1) 68% 70%, transparent 70% 100%)",
  Ice:
    "radial-gradient(circle at 22% 28%, hsl(0 0% 100% / 0.18) 0 7%, transparent 7% 24%), radial-gradient(circle at 74% 36%, hsl(0 0% 100% / 0.1) 0 5%, transparent 5% 18%), repeating-linear-gradient(135deg, hsl(205 40% 24% / 0.1) 0 3px, transparent 3px 9px)",
  Fighting:
    "repeating-linear-gradient(135deg, hsl(0 0% 100% / 0.08) 0 4px, transparent 4px 10px), repeating-linear-gradient(90deg, hsl(0 60% 18% / 0.14) 0 2px, transparent 2px 8px), linear-gradient(0deg, transparent 0 72%, hsl(0 0% 100% / 0.08) 72% 76%, transparent 76% 100%)",
  Poison:
    "radial-gradient(circle at 20% 30%, hsl(0 0% 100% / 0.12) 0 7%, transparent 7% 24%), radial-gradient(circle at 70% 68%, hsl(285 40% 20% / 0.16) 0 8%, transparent 8% 28%), radial-gradient(circle at 42% 72%, hsl(0 0% 100% / 0.08) 0 5%, transparent 5% 18%)",
  Ground:
    "radial-gradient(44% 24% at 12% 72%, hsl(0 0% 100% / 0.12) 0 24%, transparent 25%), radial-gradient(42% 22% at 42% 64%, hsl(0 0% 100% / 0.1) 0 22%, transparent 23%), radial-gradient(48% 26% at 78% 74%, hsl(0 0% 100% / 0.11) 0 22%, transparent 23%), radial-gradient(54% 26% at 28% 92%, hsl(34 46% 22% / 0.16) 0 20%, transparent 21%), radial-gradient(56% 24% at 74% 90%, hsl(34 46% 22% / 0.16) 0 20%, transparent 21%), linear-gradient(174deg, transparent 0 34%, hsl(33 44% 18% / 0.14) 34% 38%, transparent 38% 100%)",
  Flying:
    "radial-gradient(56% 28% at 10% 20%, hsl(0 0% 100% / 0.18) 0 18%, transparent 19%), radial-gradient(64% 26% at 52% 34%, hsl(0 0% 100% / 0.14) 0 16%, transparent 17%), radial-gradient(52% 24% at 88% 18%, hsl(0 0% 100% / 0.16) 0 16%, transparent 17%), linear-gradient(148deg, transparent 0 28%, hsl(220 52% 28% / 0.12) 28% 34%, transparent 34% 100%), linear-gradient(18deg, transparent 0 48%, hsl(0 0% 100% / 0.08) 48% 54%, transparent 54% 100%)",
  Psychic:
    "radial-gradient(circle at 28% 32%, hsl(0 0% 100% / 0.16) 0 8%, transparent 8% 26%), radial-gradient(circle at 72% 62%, hsl(320 50% 22% / 0.12) 0 10%, transparent 10% 28%), repeating-linear-gradient(135deg, hsl(320 50% 22% / 0.1) 0 3px, transparent 3px 10px)",
  Bug:
    "repeating-linear-gradient(45deg, hsl(0 0% 100% / 0.08) 0 3px, transparent 3px 8px), repeating-linear-gradient(135deg, hsl(75 45% 20% / 0.12) 0 2px, transparent 2px 7px), linear-gradient(0deg, transparent 0 48%, hsl(75 45% 18% / 0.08) 48% 52%, transparent 52% 100%)",
  Rock:
    "radial-gradient(circle at 24% 30%, hsl(0 0% 100% / 0.09) 0 6%, transparent 6% 24%), radial-gradient(circle at 72% 66%, hsl(28 30% 18% / 0.16) 0 7%, transparent 7% 26%), repeating-linear-gradient(135deg, hsl(28 25% 16% / 0.08) 0 4px, transparent 4px 12px)",
  Ghost:
    "radial-gradient(circle at 50% 0%, hsl(0 0% 100% / 0.08) 0 18%, transparent 18% 40%), radial-gradient(circle at 20% 78%, hsl(255 40% 18% / 0.16) 0 10%, transparent 10% 26%), repeating-linear-gradient(135deg, hsl(255 40% 18% / 0.1) 0 4px, transparent 4px 12px)",
  Dragon:
    "repeating-linear-gradient(135deg, hsl(0 0% 100% / 0.08) 0 4px, transparent 4px 11px), repeating-linear-gradient(45deg, hsl(235 50% 18% / 0.14) 0 3px, transparent 3px 9px), linear-gradient(90deg, transparent 0 48%, hsl(0 0% 100% / 0.06) 48% 52%, transparent 52% 100%)",
  Dark:
    "repeating-linear-gradient(135deg, hsl(0 0% 100% / 0.05) 0 2px, transparent 2px 8px), repeating-linear-gradient(45deg, hsl(0 0% 0% / 0.2) 0 3px, transparent 3px 10px), radial-gradient(circle at 76% 24%, hsl(0 0% 100% / 0.06) 0 5%, transparent 5% 18%)",
  Steel:
    "repeating-linear-gradient(135deg, hsl(0 0% 100% / 0.12) 0 2px, transparent 2px 7px), repeating-linear-gradient(90deg, hsl(210 20% 18% / 0.12) 0 1px, transparent 1px 6px), linear-gradient(180deg, hsl(0 0% 100% / 0.12), transparent 36%, hsl(210 20% 12% / 0.08) 100%)",
  Fairy:
    "radial-gradient(circle at 25% 28%, hsl(0 0% 100% / 0.16) 0 7%, transparent 7% 24%), radial-gradient(circle at 72% 68%, hsl(320 45% 20% / 0.12) 0 6%, transparent 6% 22%), radial-gradient(circle at 52% 42%, hsl(0 0% 100% / 0.08) 0 4%, transparent 4% 14%)",
};

export function getTypeSurfaceStyle(type?: string | null, fallback = "var(--surface-3)") {
  const color = TYPE_COLORS[type ?? ""] ?? fallback;
  const text = TYPE_TEXT_COLORS[type ?? ""] ?? "var(--text)";
  const texture =
    TYPE_TEXTURES[type ?? ""] ??
    "repeating-linear-gradient(135deg, hsl(0 0% 100% / 0.06) 0 6px, transparent 6px 12px)";

  return {
    backgroundColor: color,
    backgroundImage: `${texture}, linear-gradient(180deg, hsl(0 0% 100% / 0.12), hsl(0 0% 0% / 0.1))`,
    backgroundBlendMode: "overlay, normal",
    color: text,
  } as const;
}

const TYPE_CHART: Record<string, Partial<Record<string, number>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5,
  },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5, Ice: 0.5 },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
    Fairy: 0.5,
  },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
    Fairy: 0.5,
  },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Fairy: 2, Steel: 0.5 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

export function getTypeEffectiveness(attackType: string, defenseTypes: string[]) {
  return defenseTypes.reduce((multiplier, defenseType) => {
    const modifier = TYPE_CHART[attackType]?.[defenseType] ?? 1;
    return multiplier * modifier;
  }, 1);
}

export function getMultiplierBucket(multiplier: number): MultiplierBucket {
  if (multiplier >= 4) {
    return "x4";
  }
  if (multiplier >= 2) {
    return "x2";
  }
  if (multiplier === 1) {
    return "x1";
  }
  if (multiplier === 0.5) {
    return "x0.5";
  }
  if (multiplier <= 0.25 && multiplier > 0) {
    return "x0.25";
  }
  return "x0";
}

export function getMultiplierLabel(bucket: MultiplierBucket) {
  return {
    x4: "ultra efectivo",
    x2: "super efectivo",
    x1: "efectivo",
    "x0.5": "resistido",
    "x0.25": "muy resistido",
    x0: "inmune",
  }[bucket];
}
