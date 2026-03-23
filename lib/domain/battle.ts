import { TYPE_ORDER, getMultiplierBucket, getTypeEffectiveness, type MultiplierBucket } from "./typeChart";
import { normalizeName } from "./names";

export type StatKey = "atk" | "def" | "spa" | "spd" | "spe";
export type FullStatKey = "hp" | StatKey;
export type StatSpread = Record<FullStatKey, number>;

export type Stats = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  bst: number;
};

export type BattleWeather = "clear" | "sun" | "rain" | "sand" | "hail";

export type TeamCoverageMember = {
  moves: { type?: string; damageClass?: string }[];
  resolvedTypes: string[];
  summaryStats?: Stats;
  resolvedStats?: Stats;
};

const NATURE_EFFECTS: Record<string, { up?: StatKey; down?: StatKey }> = {
  hardy: {},
  lonely: { up: "atk", down: "def" },
  brave: { up: "atk", down: "spe" },
  adamant: { up: "atk", down: "spa" },
  naughty: { up: "atk", down: "spd" },
  bold: { up: "def", down: "atk" },
  docile: {},
  relaxed: { up: "def", down: "spe" },
  impish: { up: "def", down: "spa" },
  lax: { up: "def", down: "spd" },
  timid: { up: "spe", down: "atk" },
  hasty: { up: "spe", down: "def" },
  serious: {},
  jolly: { up: "spe", down: "spa" },
  naive: { up: "spe", down: "spd" },
  modest: { up: "spa", down: "atk" },
  mild: { up: "spa", down: "def" },
  quiet: { up: "spa", down: "spe" },
  bashful: {},
  rash: { up: "spa", down: "spd" },
  calm: { up: "spd", down: "atk" },
  gentle: { up: "spd", down: "def" },
  sassy: { up: "spd", down: "spe" },
  careful: { up: "spd", down: "spa" },
  quirky: {},
};

function compactCompare(input: string) {
  return normalizeName(input).replace(/-/g, "");
}

export function getNatureEffect(nature: string) {
  return NATURE_EFFECTS[normalizeName(nature)] ?? {};
}

function getNatureMultiplier(stat: StatKey, natureEffect: { up?: StatKey; down?: StatKey }) {
  if (natureEffect.up === stat) {
    return 1.1;
  }
  if (natureEffect.down === stat) {
    return 0.9;
  }
  return 1;
}

export function calculateEffectiveStats(
  baseStats: Stats,
  level: number,
  nature: string,
  ivs?: Partial<StatSpread>,
  evs?: Partial<StatSpread>,
) {
  const normalizedLevel = Math.max(1, Math.min(100, Math.round(level)));
  const natureEffect = getNatureEffect(nature);
  const iv = {
    hp: Math.max(0, Math.min(31, Math.round(ivs?.hp ?? 31))),
    atk: Math.max(0, Math.min(31, Math.round(ivs?.atk ?? 31))),
    def: Math.max(0, Math.min(31, Math.round(ivs?.def ?? 31))),
    spa: Math.max(0, Math.min(31, Math.round(ivs?.spa ?? 31))),
    spd: Math.max(0, Math.min(31, Math.round(ivs?.spd ?? 31))),
    spe: Math.max(0, Math.min(31, Math.round(ivs?.spe ?? 31))),
  };
  const ev = {
    hp: Math.max(0, Math.min(252, Math.round(evs?.hp ?? 0))),
    atk: Math.max(0, Math.min(252, Math.round(evs?.atk ?? 0))),
    def: Math.max(0, Math.min(252, Math.round(evs?.def ?? 0))),
    spa: Math.max(0, Math.min(252, Math.round(evs?.spa ?? 0))),
    spd: Math.max(0, Math.min(252, Math.round(evs?.spd ?? 0))),
    spe: Math.max(0, Math.min(252, Math.round(evs?.spe ?? 0))),
  };

  const hp =
    Math.floor(((2 * baseStats.hp + iv.hp + Math.floor(ev.hp / 4)) * normalizedLevel) / 100) +
    normalizedLevel +
    10;
  const atk = Math.floor(
    (Math.floor(((2 * baseStats.atk + iv.atk + Math.floor(ev.atk / 4)) * normalizedLevel) / 100) + 5) *
      getNatureMultiplier("atk", natureEffect),
  );
  const def = Math.floor(
    (Math.floor(((2 * baseStats.def + iv.def + Math.floor(ev.def / 4)) * normalizedLevel) / 100) + 5) *
      getNatureMultiplier("def", natureEffect),
  );
  const spa = Math.floor(
    (Math.floor(((2 * baseStats.spa + iv.spa + Math.floor(ev.spa / 4)) * normalizedLevel) / 100) + 5) *
      getNatureMultiplier("spa", natureEffect),
  );
  const spd = Math.floor(
    (Math.floor(((2 * baseStats.spd + iv.spd + Math.floor(ev.spd / 4)) * normalizedLevel) / 100) + 5) *
      getNatureMultiplier("spd", natureEffect),
  );
  const spe = Math.floor(
    (Math.floor(((2 * baseStats.spe + iv.spe + Math.floor(ev.spe / 4)) * normalizedLevel) / 100) + 5) *
      getNatureMultiplier("spe", natureEffect),
  );

  return {
    hp,
    atk,
    def,
    spa,
    spd,
    spe,
    bst: hp + atk + def + spa + spd + spe,
  };
}

export function getStatModifiers({
  itemName,
  itemEffect,
  abilityName,
  abilityEffect,
  canEvolve,
  weather = "clear",
  resolvedTypes = [],
}: {
  itemName?: string;
  itemEffect?: string;
  abilityName?: string;
  abilityEffect?: string;
  canEvolve?: boolean;
  weather?: BattleWeather;
  resolvedTypes?: string[];
}) {
  const modifiers: { source: string; stat: FullStatKey; multiplier: number; label: string }[] = [];
  const normalizedItem = compactCompare(itemName ?? "");
  const normalizedAbility = compactCompare(abilityName ?? "");
  const effectTextItem = (itemEffect ?? "").toLowerCase();
  const effectTextAbility = (abilityEffect ?? "").toLowerCase();
  const normalizedTypes = resolvedTypes.map((type) => compactCompare(type));

  if (normalizedItem === "eviolite" && canEvolve) {
    modifiers.push({ source: itemName!, stat: "def", multiplier: 1.5, label: "Def +50%" });
    modifiers.push({ source: itemName!, stat: "spd", multiplier: 1.5, label: "SpD +50%" });
  }
  if (normalizedItem === "choicescarf") {
    modifiers.push({ source: itemName!, stat: "spe", multiplier: 1.5, label: "Spe +50%" });
  }
  if (normalizedItem === "choiceband") {
    modifiers.push({ source: itemName!, stat: "atk", multiplier: 1.5, label: "Atk +50%" });
  }
  if (normalizedItem === "choicespecs") {
    modifiers.push({ source: itemName!, stat: "spa", multiplier: 1.5, label: "SpA +50%" });
  }
  if (normalizedAbility === "purepower" || normalizedAbility === "hugepower") {
    modifiers.push({ source: abilityName!, stat: "atk", multiplier: 2, label: "Atk x2" });
  }
  if (weather === "sun" && normalizedAbility === "chlorophyll" && /doubles speed during strong sunlight/i.test(abilityEffect ?? "")) {
    modifiers.push({ source: abilityName!, stat: "spe", multiplier: 2, label: "Spe x2 sun" });
  }
  if (weather === "rain" && (normalizedAbility === "swiftswim" || /doubles speed in rain/i.test(effectTextAbility))) {
    modifiers.push({ source: abilityName!, stat: "spe", multiplier: 2, label: "Spe x2 rain" });
  }
  if (weather === "sand" && (normalizedAbility === "sandrush" || /doubles speed in a sandstorm/i.test(effectTextAbility))) {
    modifiers.push({ source: abilityName!, stat: "spe", multiplier: 2, label: "Spe x2 sand" });
  }
  if (weather === "sun" && normalizedAbility === "solarpower" && /raises special attack/i.test(effectTextAbility)) {
    modifiers.push({ source: abilityName!, stat: "spa", multiplier: 1.5, label: "SpA +50% sun" });
  }
  if (weather === "sand" && normalizedTypes.includes("rock")) {
    modifiers.push({ source: "Sandstorm", stat: "spd", multiplier: 1.5, label: "SpD +50% rock" });
  }

  if (/raises (attack|defense|special attack|special defense|speed)/i.test(effectTextItem)) {
    const match = effectTextItem.match(/raises (attack|defense|special attack|special defense|speed)/i);
    const statMap: Record<string, FullStatKey> = {
      attack: "atk",
      defense: "def",
      "special attack": "spa",
      "special defense": "spd",
      speed: "spe",
    };
    const stat = match ? statMap[match[1].toLowerCase()] : undefined;
    if (stat && itemName) {
      modifiers.push({ source: itemName, stat, multiplier: 1.5, label: `${stat.toUpperCase()} +50%` });
    }
  }

  return modifiers;
}

export function applyStatModifiers(
  stats: Stats,
  modifiers: { stat: FullStatKey; multiplier: number }[],
) {
  if (!modifiers.length) {
    return stats;
  }

  const next = { ...stats };
  for (const modifier of modifiers) {
    if (modifier.stat === "hp") {
      next.hp = Math.round(next.hp * modifier.multiplier);
    } else {
      next[modifier.stat] = Math.round(next[modifier.stat] * modifier.multiplier);
    }
  }
  next.bst = next.hp + next.atk + next.def + next.spa + next.spd + next.spe;
  return next;
}

export function buildCoverageSummary(team: TeamCoverageMember[]) {
  return TYPE_ORDER.map((defenseType) => {
    const best = Math.max(
      0,
      ...team.flatMap((member) =>
        member.moves
          .filter((move) => move.damageClass !== "status" && Boolean(move.type))
          .map((move) => getTypeEffectiveness(move.type as string, [defenseType])),
      ),
    );
    return {
      defenseType,
      multiplier: best,
      bucket: getMultiplierBucket(best),
    };
  });
}

export function buildDefensiveSummary(team: TeamCoverageMember[]) {
  return TYPE_ORDER.map((attackType) => {
    const multipliers = team
      .filter((member) => member.resolvedTypes.length)
      .map((member) => getTypeEffectiveness(attackType, member.resolvedTypes));
    return {
      attackType,
      buckets: {
        x4: multipliers.filter((value) => getMultiplierBucket(value) === "x4").length,
        x2: multipliers.filter((value) => getMultiplierBucket(value) === "x2").length,
        x1: multipliers.filter((value) => getMultiplierBucket(value) === "x1").length,
        "x0.5": multipliers.filter((value) => getMultiplierBucket(value) === "x0.5").length,
        "x0.25": multipliers.filter((value) => getMultiplierBucket(value) === "x0.25").length,
        x0: multipliers.filter((value) => getMultiplierBucket(value) === "x0").length,
      },
      weak: multipliers.filter((value) => value > 1).length,
      resist: multipliers.filter((value) => value > 0 && value < 1).length,
      immune: multipliers.filter((value) => value === 0).length,
      neutral: multipliers.filter((value) => value === 1).length,
      worst: multipliers.length ? Math.max(...multipliers) : 1,
    };
  });
}

export function buildThreatSummary(team: TeamCoverageMember[]) {
  return buildDefensiveSummary(team)
    .filter((entry) => entry.weak >= 2 && entry.resist + entry.immune === 0)
    .sort((left, right) => right.weak - left.weak || right.worst - left.worst);
}

export function buildDefensiveSections(team: TeamCoverageMember[]) {
  const summary = buildDefensiveSummary(team);
  const netBalance = summary.map((entry) => ({
    attackType: entry.attackType,
    score:
      entry.buckets["x0.5"] +
      entry.buckets["x0.25"] +
      entry.buckets.x0 -
      entry.buckets.x2 -
      entry.buckets.x4,
    severe: entry.buckets.x4 > 0,
  }));

  return {
    superWeak: summary.filter((entry) => entry.buckets.x4 > 0),
    weak: summary.filter((entry) => entry.buckets.x2 > 0),
    neutral: summary.filter((entry) => entry.buckets.x1 > 0),
    resist: summary.filter((entry) => entry.buckets["x0.5"] > 0),
    superResist: summary.filter((entry) => entry.buckets["x0.25"] > 0),
    immune: summary.filter((entry) => entry.buckets.x0 > 0),
    netWeak: netBalance
      .filter((entry) => entry.score < 0)
      .map((entry) => ({
        attackType: entry.attackType,
        count: Math.abs(entry.score),
        severe: entry.severe,
      }))
      .sort((left, right) => Number(right.severe) - Number(left.severe) || right.count - left.count || left.attackType.localeCompare(right.attackType)),
    netResist: netBalance
      .filter((entry) => entry.score > 0)
      .map((entry) => ({
        attackType: entry.attackType,
        count: entry.score,
      }))
      .sort((left, right) => right.count - left.count || left.attackType.localeCompare(right.attackType)),
  };
}

export function buildAverageStats(team: TeamCoverageMember[]) {
  const withStats = team.filter((member) => member.summaryStats ?? member.resolvedStats);
  if (!withStats.length) {
    return undefined;
  }
  const totals = withStats.reduce(
    (accumulator, member) => {
      const stats = member.summaryStats ?? member.resolvedStats!;
      accumulator.hp += stats.hp;
      accumulator.atk += stats.atk;
      accumulator.def += stats.def;
      accumulator.spa += stats.spa;
      accumulator.spd += stats.spd;
      accumulator.spe += stats.spe;
      accumulator.bst += stats.bst;
      return accumulator;
    },
    { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 },
  );

  return {
    hp: Math.round(totals.hp / withStats.length),
    atk: Math.round(totals.atk / withStats.length),
    def: Math.round(totals.def / withStats.length),
    spa: Math.round(totals.spa / withStats.length),
    spd: Math.round(totals.spd / withStats.length),
    spe: Math.round(totals.spe / withStats.length),
    bst: Math.round(totals.bst / withStats.length),
  };
}
