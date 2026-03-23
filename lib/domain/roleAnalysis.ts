type TeamMember = {
  key?: string;
  species: string;
  nature?: string;
  natureEffect?: {
    up?: "atk" | "def" | "spa" | "spd" | "spe";
    down?: "atk" | "def" | "spa" | "spd" | "spe";
  };
  ability?: string;
  abilityDetails?: {
    effect?: string;
  } | null;
  resolvedStats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  summaryStats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  effectiveStats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  item?: string;
  statModifiers?: { stat: string; multiplier: number; source?: string; label?: string }[];
  moves: {
    name: string;
    damageClass?: string;
    power?: number | null;
    adjustedPower?: number | null;
    hasStab?: boolean;
  }[];
};

export type RoleId =
  | "wallbreaker"
  | "setupSweeper"
  | "cleaner"
  | "revengeKiller"
  | "speedControl"
  | "bulkyPivot"
  | "support"
  | "defensiveGlue";

export type MemberRoleRecommendation = {
  key?: string;
  species: string;
  naturalRole: RoleId;
  recommendedRole: RoleId;
  matchedRoles: RoleId[];
  alternativeRoles: RoleId[];
  roleScores: Record<RoleId, number>;
  reasons: string[];
  drivers: string[];
  compositionNote?: string;
};

export type TeamRoleSnapshot = {
  members: MemberRoleRecommendation[];
  coveredRoles: RoleId[];
  missingRoles: RoleId[];
  redundantRoles: RoleId[];
  assignments: Record<RoleId, string[]>;
  compositionNotes: string[];
};

const ROLE_ORDER: RoleId[] = [
  "wallbreaker",
  "setupSweeper",
  "cleaner",
  "revengeKiller",
  "speedControl",
  "bulkyPivot",
  "support",
  "defensiveGlue",
];

const ROLE_RULES: Record<RoleId, { min: number; max: number; weight: number }> = {
  wallbreaker: { min: 1, max: 2, weight: 1.2 },
  setupSweeper: { min: 0, max: 1, weight: 1.05 },
  cleaner: { min: 1, max: 2, weight: 1.1 },
  revengeKiller: { min: 1, max: 2, weight: 1.15 },
  speedControl: { min: 1, max: 2, weight: 1.15 },
  bulkyPivot: { min: 1, max: 2, weight: 1.1 },
  support: { min: 0, max: 2, weight: 0.95 },
  defensiveGlue: { min: 1, max: 2, weight: 1.15 },
};

const PIVOT_MOVES = new Set([
  "u-turn",
  "volt switch",
  "wish",
  "protect",
  "recover",
  "roost",
  "morning sun",
  "slack off",
]);

const SUPPORT_MOVES = new Set([
  "thunder wave",
  "will-o-wisp",
  "toxic",
  "leech seed",
  "encore",
  "taunt",
  "stealth rock",
  "spikes",
  "reflect",
  "light screen",
  "wish",
  "heal bell",
  "aromatherapy",
]);

const SPEED_CONTROL_MOVES = new Set([
  "thunder wave",
  "tailwind",
  "icy wind",
  "rock tomb",
  "trick room",
  "electroweb",
  "mach punch",
  "aqua jet",
  "ice shard",
  "bullet punch",
  "shadow sneak",
  "extremespeed",
  "vacuum wave",
  "accelerock",
]);

const SETUP_MOVES = new Set([
  "dragon dance",
  "quiver dance",
  "shell smash",
  "swords dance",
  "calm mind",
  "nasty plot",
  "agility",
  "bulk up",
]);

const WALLBREAKER_ABILITIES = [
  "sheer force",
  "huge power",
  "pure power",
  "adaptability",
  "tough claws",
  "technician",
  "moxie",
  "guts",
];

const CLEANER_ABILITIES = [
  "speed boost",
  "swift swim",
  "chlorophyll",
  "moxie",
  "beast boost",
];

const PIVOT_ABILITIES = [
  "intimidate",
  "regenerator",
  "levitate",
  "water absorb",
  "volt absorb",
  "flash fire",
  "natural cure",
];

const GLUE_ABILITIES = [
  "intimidate",
  "regenerator",
  "magic guard",
  "multiscale",
  "sturdy",
  "natural cure",
  "thick fat",
];

const SUPPORT_ABILITIES = [
  "natural cure",
  "poison point",
  "effect spore",
  "flame body",
  "static",
  "cute charm",
  "trace",
  "serene grace",
  "prankster",
];

const OFFENSE_ITEMS = ["life orb", "choice band", "choice specs", "expert belt", "muscle band", "wise glasses"];
const SPEED_ITEMS = ["choice scarf", "focus sash", "quick claw"];
const DEFENSE_ITEMS = ["leftovers", "eviolite", "rocky helmet", "sitrus berry", "black sludge", "assault vest"];
const SUPPORT_ITEMS = ["light clay", "mental herb"];

export function buildTeamRoleSnapshot(team: TeamMember[]): TeamRoleSnapshot {
  const activeTeam = team.filter((member) => member.species.trim());
  const rawMembers = activeTeam.map(scoreMemberRoles);
  const roleCounts = Object.fromEntries(ROLE_ORDER.map((role) => [role, 0])) as Record<RoleId, number>;

  const members = [...rawMembers]
    .sort((left, right) => getTopScore(right.roleScores) - getTopScore(left.roleScores))
    .map((member) => {
      const recommendedRole = pickRecommendedRole(member.roleScores, roleCounts);
      roleCounts[recommendedRole] += 1;
      const naturalRole = pickNaturalRole(member.roleScores);
      const matchedRoles = ROLE_ORDER.filter((role) => member.roleScores[role] >= 3);
      const alternativeRoles = matchedRoles.filter((role) => role !== recommendedRole);

      return {
        key: member.key,
        species: member.species,
        naturalRole,
        recommendedRole,
        matchedRoles: matchedRoles.length ? matchedRoles : [naturalRole],
        alternativeRoles,
        roleScores: member.roleScores,
        reasons: member.reasons,
        drivers: member.drivers,
        compositionNote:
          recommendedRole !== naturalRole
            ? `${labelOf(naturalRole)} ya va cubierto; aqui aporta mas como ${labelOf(recommendedRole)}.`
            : undefined,
      };
    })
    .sort((left, right) => left.species.localeCompare(right.species));

  const assignments = createRoleStringRecord();
  for (const member of members) {
    assignments[member.recommendedRole].push(member.species);
  }

  const coveredRoles = ROLE_ORDER.filter((role) => assignments[role].length > 0);
  const missingRoles = ROLE_ORDER.filter((role) => assignments[role].length < ROLE_RULES[role].min);
  const redundantRoles = ROLE_ORDER.filter((role) => assignments[role].length > ROLE_RULES[role].max);

  return {
    members,
    coveredRoles,
    missingRoles,
    redundantRoles,
    assignments,
    compositionNotes: buildCompositionNotes(assignments),
  };
}

function scoreMemberRoles(member: TeamMember) {
  const stats = member.effectiveStats ?? member.summaryStats ?? member.resolvedStats;
  const damagingMoves = member.moves.filter((move) => move.damageClass !== "status");
  const supportMoves = member.moves.filter((move) => move.damageClass === "status");
  const highPowerMoves = damagingMoves.filter((move) => (move.adjustedPower ?? move.power ?? 0) >= 90);
  const strongMoves = damagingMoves.filter((move) => (move.adjustedPower ?? move.power ?? 0) >= 75);
  const stabMoves = damagingMoves.filter((move) => move.hasStab);
  const bulk = stats ? stats.hp + stats.def + stats.spd : 0;
  const speed = stats?.spe ?? 0;
  const physicalOffense = stats?.atk ?? 0;
  const specialOffense = stats?.spa ?? 0;
  const offense = stats ? Math.max(physicalOffense, specialOffense) : 0;
  const physicalBias = stats ? stats.atk - stats.spa : 0;
  const specialBias = stats ? stats.spa - stats.atk : 0;
  const normalizedAbility = (member.ability ?? "").toLowerCase().trim();
  const abilityEffect = (member.abilityDetails?.effect ?? "").toLowerCase();
  const normalizedItem = (member.item ?? "").toLowerCase().trim();
  const dominantStatEntries: Array<["atk" | "spa" | "spe" | "bulk", number]> = [
    ["atk", physicalOffense],
    ["spa", specialOffense],
    ["spe", speed],
    ["bulk", bulk / 3],
  ];
  const dominantStat = stats
    ? dominantStatEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? "atk"
    : "atk";

  const roleScores: Record<RoleId, number> = {
    wallbreaker: 0,
    setupSweeper: 0,
    cleaner: 0,
    revengeKiller: 0,
    speedControl: 0,
    bulkyPivot: 0,
    support: 0,
    defensiveGlue: 0,
  };

  if (offense >= 55) {
    roleScores.wallbreaker += 1;
  }
  if (offense >= 75) {
    roleScores.wallbreaker += 2;
    roleScores.setupSweeper += 1;
  }
  if (offense >= 95) {
    roleScores.wallbreaker += 1;
    roleScores.cleaner += 1;
  }
  if (Math.max(physicalBias, specialBias) >= 10) {
    roleScores.wallbreaker += 1;
    roleScores.setupSweeper += 1;
  }
  if (dominantStat === "atk" || dominantStat === "spa") {
    roleScores.wallbreaker += 1;
  }
  if (member.natureEffect?.up === "atk" || member.natureEffect?.up === "spa") {
    roleScores.wallbreaker += 1;
    roleScores.setupSweeper += 1;
  }

  if (speed >= 45) {
    roleScores.cleaner += 1;
    roleScores.revengeKiller += 1;
  }
  if (speed >= 65) {
    roleScores.cleaner += 1;
    roleScores.revengeKiller += 1;
    roleScores.speedControl += 1;
  }
  if (speed >= 85) {
    roleScores.cleaner += 2;
    roleScores.revengeKiller += 1;
    roleScores.speedControl += 1;
  }
  if (speed >= 100) {
    roleScores.revengeKiller += 1;
    roleScores.speedControl += 1;
  }
  if (dominantStat === "spe") {
    roleScores.cleaner += 1;
    roleScores.speedControl += 1;
  }
  if (member.natureEffect?.up === "spe") {
    roleScores.cleaner += 1;
    roleScores.revengeKiller += 1;
    roleScores.speedControl += 1;
  }

  if (bulk >= 45) {
    roleScores.support += 1;
    roleScores.defensiveGlue += 1;
  }
  if (bulk >= 60) {
    roleScores.bulkyPivot += 1;
    roleScores.support += 1;
    roleScores.defensiveGlue += 1;
  }
  if (bulk >= 80) {
    roleScores.bulkyPivot += 2;
    roleScores.defensiveGlue += 2;
  }
  if (bulk >= 100) {
    roleScores.bulkyPivot += 1;
    roleScores.defensiveGlue += 1;
  }
  if (dominantStat === "bulk") {
    roleScores.bulkyPivot += 1;
    roleScores.support += 1;
    roleScores.defensiveGlue += 1;
  }
  if (member.natureEffect?.up === "def" || member.natureEffect?.up === "spd") {
    roleScores.bulkyPivot += 1;
    roleScores.support += 1;
    roleScores.defensiveGlue += 1;
  }

  if (supportMoves.some((move) => SUPPORT_MOVES.has(move.name.toLowerCase()))) {
    roleScores.support += 2;
    roleScores.defensiveGlue += 1;
  }
  if (supportMoves.length >= 2) {
    roleScores.support += 1;
  }
  if (member.moves.some((move) => SETUP_MOVES.has(move.name.toLowerCase()))) {
    roleScores.setupSweeper += 2;
  }
  if (speed >= 65 && stabMoves.length >= 1) {
    roleScores.setupSweeper += 1;
  }
  if (speed >= 70 && strongMoves.length >= 1) {
    roleScores.cleaner += 1;
  }
  if (speed >= 80 || member.moves.some((move) => SPEED_CONTROL_MOVES.has(move.name.toLowerCase()))) {
    roleScores.revengeKiller += 1;
  }
  if (member.moves.some((move) => SPEED_CONTROL_MOVES.has(move.name.toLowerCase()))) {
    roleScores.speedControl += 2;
    roleScores.support += 1;
  }
  if (supportMoves.some((move) => PIVOT_MOVES.has(move.name.toLowerCase())) || bulk >= 80) {
    roleScores.bulkyPivot += 1;
  }
  if (highPowerMoves.length >= 1) {
    roleScores.wallbreaker += 1;
  }

  if (hasNamedSignal(normalizedAbility, abilityEffect, WALLBREAKER_ABILITIES)) {
    roleScores.wallbreaker += 1;
  }
  if (hasNamedSignal(normalizedAbility, abilityEffect, CLEANER_ABILITIES)) {
    roleScores.setupSweeper += 1;
    roleScores.cleaner += 1;
  }
  if (hasNamedSignal(normalizedAbility, abilityEffect, PIVOT_ABILITIES)) {
    roleScores.bulkyPivot += 1;
    roleScores.defensiveGlue += 1;
  }
  if (hasNamedSignal(normalizedAbility, abilityEffect, GLUE_ABILITIES)) {
    roleScores.defensiveGlue += 1;
  }
  if (hasNamedSignal(normalizedAbility, abilityEffect, SUPPORT_ABILITIES)) {
    roleScores.support += 1;
    roleScores.defensiveGlue += 1;
  }

  if (hasListSignal(normalizedItem, OFFENSE_ITEMS)) {
    roleScores.wallbreaker += 1;
    roleScores.cleaner += 1;
  }
  if (hasListSignal(normalizedItem, SPEED_ITEMS)) {
    roleScores.revengeKiller += 1;
    roleScores.speedControl += 1;
  }
  if (hasListSignal(normalizedItem, SUPPORT_ITEMS)) {
    roleScores.support += 1;
  }
  if (hasListSignal(normalizedItem, DEFENSE_ITEMS)) {
    roleScores.bulkyPivot += 1;
    roleScores.defensiveGlue += 1;
  }

  const reasons = compactReasons([
    roleScores.wallbreaker >= 3 ? buildOffenseReason(stats, member.nature) : "",
    roleScores.setupSweeper >= 3 ? "tiene setup para barrer" : "",
    roleScores.cleaner >= 3 ? "puede cerrar cuando el rival ya esta tocado" : "",
    roleScores.revengeKiller >= 3 ? "speed o prioridad para rematar amenazas" : "",
    roleScores.speedControl >= 3 ? "puede manipular el tempo" : "",
    roleScores.bulkyPivot >= 3 ? (bulk >= 250 ? "bulk para pivotear" : "entra y sale con utilidad") : "",
    roleScores.support >= 3 ? "aporta utility real" : "",
    roleScores.defensiveGlue >= 3 ? "aporta estabilidad defensiva" : "",
  ]).slice(0, 2);

  const drivers = compactReasons([
    member.natureEffect?.up === "atk" || member.natureEffect?.up === "spa" || member.natureEffect?.up === "spe" || member.natureEffect?.up === "def" || member.natureEffect?.up === "spd"
      ? `naturaleza ${member.nature}`
      : "",
    member.ability ? `habilidad ${member.ability}` : "",
    member.item ? `item ${member.item}` : "",
    ...member.moves
      .filter((move) =>
        SUPPORT_MOVES.has(move.name.toLowerCase()) ||
        SPEED_CONTROL_MOVES.has(move.name.toLowerCase()) ||
        SETUP_MOVES.has(move.name.toLowerCase()) ||
        PIVOT_MOVES.has(move.name.toLowerCase()) ||
        (move.adjustedPower ?? move.power ?? 0) >= 90,
      )
      .slice(0, 3)
      .map((move) => move.name),
  ]).slice(0, 4);

  return {
    key: member.key,
    species: member.species,
    roleScores,
    reasons,
    drivers,
  };
}

function pickNaturalRole(scores: Record<RoleId, number>) {
  return [...ROLE_ORDER].sort((left, right) => scores[right] - scores[left])[0] ?? "support";
}

function pickRecommendedRole(
  scores: Record<RoleId, number>,
  counts: Record<RoleId, number>,
) {
  const ranked = [...ROLE_ORDER]
    .map((role) => ({
      role,
      score: adjustedRoleScore(role, scores[role], counts[role]),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.role ?? "support";
}

function adjustedRoleScore(role: RoleId, baseScore: number, currentCount: number) {
  let score = baseScore * ROLE_RULES[role].weight;

  if (currentCount < ROLE_RULES[role].min) {
    score += 2.5;
  } else if (currentCount >= ROLE_RULES[role].max) {
    score -= 2.25 + (currentCount - ROLE_RULES[role].max);
  }

  return score;
}

function buildCompositionNotes(assignments: Record<RoleId, string[]>) {
  const notes: string[] = [];

  for (const role of ROLE_ORDER) {
    const count = assignments[role].length;
    const rules = ROLE_RULES[role];
    if (count < rules.min) {
      notes.push(`Falta ${labelOf(role)} para cerrar mejor la composicion.`);
    } else if (count > rules.max) {
      notes.push(`Hay demasiado ${labelOf(role)} y el equipo pierde flexibilidad.`);
    }
  }

  return notes.slice(0, 4);
}

function buildOffenseReason(
  stats: TeamMember["effectiveStats"] | TeamMember["summaryStats"] | TeamMember["resolvedStats"],
  nature?: string,
) {
  if (!stats) {
    return "perfil ofensivo general";
  }
  const axis = stats.atk >= stats.spa ? "Atk" : "SpA";
  return nature && nature !== "Serious"
    ? `${axis} alta con naturaleza ${nature}`
    : `${axis} alta para presionar`;
}

function compactReasons(reasons: string[]) {
  return Array.from(new Set(reasons.filter(Boolean)));
}

function hasNamedSignal(abilityName: string, abilityEffect: string, candidates: string[]) {
  return candidates.some(
    (candidate) => abilityName.includes(candidate) || abilityEffect.includes(candidate),
  );
}

function hasListSignal(value: string, candidates: string[]) {
  return candidates.some((candidate) => value.includes(candidate));
}

function getTopScore(scores: Record<RoleId, number>) {
  return Math.max(...Object.values(scores));
}

function labelOf(role: RoleId) {
  return {
    wallbreaker: "wallbreaker",
    setupSweeper: "setup sweeper",
    cleaner: "cleaner",
    revengeKiller: "revenge killer",
    speedControl: "speed control",
    bulkyPivot: "bulky pivot",
    support: "support",
    defensiveGlue: "glue",
  }[role];
}

function createRoleStringRecord() {
  return {
    wallbreaker: [],
    setupSweeper: [],
    cleaner: [],
    revengeKiller: [],
    speedControl: [],
    bulkyPivot: [],
    support: [],
    defensiveGlue: [],
  } as Record<RoleId, string[]>;
}
