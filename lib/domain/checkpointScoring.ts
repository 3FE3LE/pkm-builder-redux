import {
  buildCoverageSummary,
  buildThreatSummary,
} from "./battle";
import { ROLE_LABELS } from "./roleLabels";
import { buildTeamRoleSnapshot } from "./roleAnalysis";
import { buildSignatureCeiling } from "./signatureCeiling";
import { getTypeEffectiveness } from "./typeChart";

type CheckpointMember = {
  key?: string;
  species: string;
  resolvedTypes: string[];
  nature?: string;
  natureEffect?: {
    up?: "atk" | "def" | "spa" | "spd" | "spe";
    down?: "atk" | "def" | "spa" | "spd" | "spe";
  };
  ability?: string;
  abilities?: string[];
  abilityDetails?: {
    effect?: string;
  } | null;
  summaryStats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  resolvedStats?: {
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
  statModifiers?: { stat: string; multiplier: number }[];
  moves: {
    name: string;
    type?: string;
    hasStab?: boolean;
    damageClass?: string;
    power?: number | null;
    adjustedPower?: number | null;
    accuracy?: number | null;
  }[];
};

type ScoreBreakdown = {
  score: number;
  summary: string;
  signals: string[];
};

export type CheckpointRiskSnapshot = {
  totalRisk: number;
  totalScore: number;
  teamSize: number;
  offense: ScoreBreakdown;
  defense: ScoreBreakdown;
  speed: ScoreBreakdown;
  roles: ScoreBreakdown;
  roleSnapshot: ReturnType<typeof buildTeamRoleSnapshot>;
  consistency: ScoreBreakdown;
  ceiling: ScoreBreakdown;
  notes: string[];
};

const CHECKPOINT_PROFILES: Record<
  string,
  {
    preferredCoverage: string[];
    preferredResists: string[];
    speedPressure: "low" | "medium" | "high";
    label: string;
  }
> = {
  opening: {
    preferredCoverage: ["Normal", "Dark"],
    preferredResists: ["Normal"],
    speedPressure: "low",
    label: "Antes de Cheren",
  },
  floccesy: {
    preferredCoverage: ["Poison", "Bug"],
    preferredResists: ["Poison", "Bug"],
    speedPressure: "medium",
    label: "Antes de Roxie",
  },
  virbank: {
    preferredCoverage: ["Bug", "Poison", "Steel", "Flying"],
    preferredResists: ["Bug", "Poison"],
    speedPressure: "medium",
    label: "Antes de Burgh",
  },
  castelia: {
    preferredCoverage: ["Electric", "Flying", "Water", "Ground"],
    preferredResists: ["Electric", "Flying"],
    speedPressure: "high",
    label: "Antes de Elesa",
  },
  driftveil: {
    preferredCoverage: ["Ground", "Rock", "Steel", "Water"],
    preferredResists: ["Ground", "Rock", "Electric"],
    speedPressure: "high",
    label: "Tramo Driftveil y Clay",
  },
  mistralton: {
    preferredCoverage: ["Flying", "Ice", "Electric", "Dragon"],
    preferredResists: ["Flying", "Dragon", "Ice"],
    speedPressure: "high",
    label: "Tramo Mistralton y Skyla",
  },
  undella: {
    preferredCoverage: ["Water", "Ice", "Grass", "Ground"],
    preferredResists: ["Water", "Ice", "Grass"],
    speedPressure: "high",
    label: "Tramo Undella y Drayden",
  },
  humilau: {
    preferredCoverage: ["Dragon", "Dark", "Fighting", "Ice"],
    preferredResists: ["Dragon", "Dark", "Ghost"],
    speedPressure: "high",
    label: "Tramo Plasma final",
  },
  league: {
    preferredCoverage: ["Dragon", "Dark", "Psychic", "Ice", "Fighting"],
    preferredResists: ["Dragon", "Dark", "Ghost", "Psychic"],
    speedPressure: "high",
    label: "Liga y N's Castle",
  },
  postgame: {
    preferredCoverage: ["Dragon", "Steel", "Ice", "Fighting", "Electric"],
    preferredResists: ["Dragon", "Ice", "Steel", "Dark"],
    speedPressure: "high",
    label: "Postgame",
  },
};

export function buildCheckpointRiskSnapshot({
  team,
  checkpointId,
}: {
  team: CheckpointMember[];
  checkpointId: string;
}): CheckpointRiskSnapshot {
  const activeTeam = team.filter((member) => member.species.trim());
  const profile = CHECKPOINT_PROFILES[checkpointId] ?? CHECKPOINT_PROFILES.opening;

  if (!activeTeam.length) {
    return {
      totalRisk: 10,
      totalScore: 0,
      teamSize: 0,
      offense: {
        score: 0,
        summary: "Sin datos ofensivos",
        signals: ["Anade al menos una especie para medir cobertura."],
      },
      defense: {
        score: 0,
        summary: "Sin datos defensivos",
        signals: ["No hay tipos resueltos para calcular debilidades."],
      },
      speed: {
        score: 0,
        summary: "Sin lectura de velocidad",
        signals: ["Completa niveles y especies para estimar speed tiers."],
      },
      roles: {
        score: 0,
        summary: "Sin roles detectados",
        signals: ["Todavia no hay slots suficientes para leer roles."],
      },
      roleSnapshot: buildTeamRoleSnapshot([]),
      consistency: {
        score: 0,
        summary: "Consistencia sin evaluar",
        signals: ["No se pueden medir dependencias con el roster vacio."],
      },
      ceiling: {
        score: 0,
        summary: "Sin lectura de ceiling",
        signals: ["No hay sinergias de habilidad o combo que evaluar todavia."],
      },
      notes: [
        `El tramo ${profile.label} todavia no tiene roster suficiente para generar una lectura util.`,
      ],
    };
  }

  const offense = scoreOffense(activeTeam, profile.preferredCoverage);
  const defense = scoreDefense(activeTeam, profile.preferredResists);
  const speed = scoreSpeed(activeTeam, profile.speedPressure);
  const roleSnapshot = buildTeamRoleSnapshot(activeTeam);
  const roles = scoreRoles(roleSnapshot);
  const consistency = scoreConsistency(activeTeam);
  const ceiling = scoreCeiling(activeTeam);

  const totalScore = clamp(
    offense.score * 0.2 +
      defense.score * 0.26 +
      speed.score * 0.18 +
      roles.score * 0.14 +
      consistency.score * 0.08 +
      ceiling.score * 0.14,
    0,
    100,
  );
  const totalRisk = round(clamp(10 - totalScore / 10, 0, 10), 1);

  const notes = [
    buildRiskHeadline(totalRisk, profile.label),
    ...collectTopSignals([offense, defense, speed, roles, consistency, ceiling], 4),
  ];

  return {
    totalRisk,
    totalScore: round(totalScore, 1),
    teamSize: activeTeam.length,
    offense,
    defense,
    speed,
    roles,
    roleSnapshot,
    consistency,
    ceiling,
    notes,
  };
}

function scoreOffense(team: CheckpointMember[], preferredCoverage: string[]): ScoreBreakdown {
  const coverage = buildCoverageSummary(team);
  const coveredTypes = coverage.filter((entry) => entry.multiplier > 1);
  const deadTypes = coverage.filter((entry) => entry.multiplier <= 1).map((entry) => entry.defenseType);
  const strongStabCount = team.filter((member) =>
    member.moves.some(
      (move) =>
        move.hasStab &&
        move.damageClass !== "status" &&
        (move.adjustedPower ?? move.power ?? 0) >= 70,
    ),
  ).length;
  const preferredHits = preferredCoverage.filter((type) =>
    coverage.some((entry) => entry.defenseType === type && entry.multiplier > 1),
  );

  const score = clamp(
    coveredTypes.length * 3.2 +
      strongStabCount * 9 +
      preferredHits.length * 10 -
      deadTypes.length * 1.4,
    0,
    100,
  );

  return {
    score: round(score, 1),
    summary: `${coveredTypes.length}/18 tipos cubiertos; ${strongStabCount} slots con STAB fuerte.`,
    signals: [
      preferredHits.length
        ? `Ya cubres objetivos del checkpoint: ${preferredHits.join(", ")}.`
        : "Todavia no cubres bien los tipos clave del siguiente tramo.",
      deadTypes.length
        ? `Huecos ofensivos: ${deadTypes.slice(0, 4).join(", ")}.`
        : "No aparecen huecos ofensivos claros en el moveset actual.",
    ],
  };
}

function scoreDefense(team: CheckpointMember[], preferredResists: string[]): ScoreBreakdown {
  const threats = buildThreatSummary(team);
  const severeThreats = threats.filter((entry) => entry.worst >= 4);
  const immunityCount = preferredResists.reduce(
    (count, attackType) =>
      count +
      team.filter(
        (member) => member.resolvedTypes.length && getTypeEffectiveness(attackType, member.resolvedTypes) === 0,
      ).length,
    0,
  );
  const resistCoverage = preferredResists.filter((attackType) =>
    team.some((member) => {
      return member.resolvedTypes.length && getTypeEffectiveness(attackType, member.resolvedTypes) < 1;
    }),
  );
  const safeSwitchCount = team.filter((member) => {
    const stats = member.effectiveStats ?? member.summaryStats ?? member.resolvedStats;
    return stats && stats.hp + stats.def + stats.spd >= 240;
  }).length;
  const score = clamp(
    68 -
      threats.length * 10 -
      severeThreats.length * 12 +
      safeSwitchCount * 7 +
      immunityCount * 3 +
      resistCoverage.length * 5,
    0,
    100,
  );

  return {
    score: round(score, 1),
    summary: `${safeSwitchCount} pivots fiables; ${threats.length} presiones defensivas visibles.`,
    signals: [
      threats.length
        ? `Amenazas abiertas: ${threats.slice(0, 3).map((entry) => entry.attackType).join(", ")}.`
        : "No aparecen stacks defensivos obvios en el equipo actual.",
      severeThreats.length
        ? `Debilidades graves x4 o acumuladas: ${severeThreats.map((entry) => entry.attackType).join(", ")}.`
        : "No hay debilidades x4 relevantes en los tipos cargados.",
    ],
  };
}

function scoreSpeed(
  team: CheckpointMember[],
  speedPressure: "low" | "medium" | "high",
): ScoreBreakdown {
  const threshold = speedPressure === "high" ? 105 : speedPressure === "medium" ? 88 : 75;
  const fastCount = team.filter((member) => getCheckpointSpeedValue(member) >= threshold).length;
  const priorityCount = team.filter((member) =>
    member.moves.some((move) =>
      ["mach punch", "aqua jet", "ice shard", "bullet punch", "accelerock", "vacuum wave", "shadow sneak", "extremespeed"].includes(
        move.name.toLowerCase(),
      ),
    ),
  ).length;
  const controlCount = team.filter((member) =>
    member.moves.some((move) =>
      ["thunder wave", "icy wind", "tailwind", "trick room", "electroweb", "rock tomb"].includes(
        move.name.toLowerCase(),
      ),
    ),
  ).length;
  const slowSlots = team.filter((member) => getCheckpointSpeedValue(member) < threshold - 15).length;

  const score = clamp(
    fastCount * 18 + priorityCount * 10 + controlCount * 12 - slowSlots * 7 + (speedPressure === "high" ? 10 : 15),
    0,
    100,
  );

  return {
    score: round(score, 1),
    summary: `${fastCount} slots por encima del speed tier ${threshold}; ${priorityCount + controlCount} formas de speed control.`,
    signals: [
      fastCount >= 2
        ? "Hay al menos dos slots que pueden jugar el tempo del checkpoint."
        : "El equipo llega corto de velocidad pura para el siguiente tramo.",
      slowSlots >= 3
        ? `${slowSlots} slots quedan expuestos si el rival snowballea.`
        : "La parte lenta del equipo todavia es manejable.",
    ],
  };
}

function getCheckpointSpeedValue(member: CheckpointMember) {
  return member.summaryStats?.spe ?? member.resolvedStats?.spe ?? member.effectiveStats?.spe ?? 0;
}

function scoreRoles(roleSnapshot: ReturnType<typeof buildTeamRoleSnapshot>): ScoreBreakdown {
  const { coveredRoles, missingRoles, redundantRoles } = roleSnapshot;
  const score = clamp(coveredRoles.length * 18 - missingRoles.length * 8 - redundantRoles.length * 4 + 18, 0, 100);

  return {
    score: round(score, 1),
    summary: `${coveredRoles.length}/8 roles cubiertos; ${redundantRoles.length} saturados.`,
    signals: [
      missingRoles.length
        ? `Faltan roles: ${missingRoles.map((role) => ROLE_LABELS[role]).join(", ")}.`
        : "El equipo ya enseña una estructura funcional de roles.",
      redundantRoles.length
        ? `Roles redundantes: ${redundantRoles.map((role) => ROLE_LABELS[role]).join(", ")}.`
        : "No hay redundancias graves entre los slots cargados.",
    ],
  };
}

function scoreConsistency(team: CheckpointMember[]): ScoreBreakdown {
  const setupCount = team.filter((member) =>
    member.moves.some((move) =>
      ["swords dance", "dragon dance", "calm mind", "nasty plot", "quiver dance", "bulk up", "shell smash"].includes(
        move.name.toLowerCase(),
      ),
    ),
  ).length;
  const shakyAccuracyCount = team.reduce(
    (count, member) =>
      count +
      member.moves.filter((move) => move.damageClass !== "status" && move.accuracy !== undefined && move.accuracy !== null && move.accuracy < 90).length,
    0,
  );
  const incompleteSlots = team.filter((member) => member.moves.filter((move) => move.name.trim()).length < 2).length;
  const itemReliantSlots = team.filter((member) => Boolean(member.item) && member.statModifiers?.length).length;

  const score = clamp(
    84 - setupCount * 4 - shakyAccuracyCount * 4 - incompleteSlots * 12 - itemReliantSlots * 3,
    0,
    100,
  );

  return {
    score: round(score, 1),
    summary: `${setupCount} slots dependen de setup; ${shakyAccuracyCount} ataques por debajo de 90% accuracy.`,
    signals: [
      setupCount >= 2
        ? "Hay varias líneas de setup, así que la ejecución importa más que una lectura plana de riesgo."
        : "La wincon no descansa demasiado en setup forzado.",
      incompleteSlots > 0
        ? `${incompleteSlots} slots siguen incompletos y recortan consistencia real.`
        : "Los slots cargados ya tienen una base razonable de execution.",
    ],
  };
}

function scoreCeiling(team: CheckpointMember[]): ScoreBreakdown {
  const signatures = team
    .map((member) => ({
      species: member.species,
      ...buildSignatureCeiling({
        ability: member.ability,
        abilities: member.abilities,
        moves: member.moves,
      }),
    }))
    .filter((entry) => entry.score > 0);

  const totalSignatureValue = signatures.reduce((sum, entry) => sum + entry.score, 0);
  const score = clamp(18 + totalSignatureValue * 10, 0, 100);

  return {
    score: round(score, 1),
    summary: `${signatures.length} slots con ceiling alto por habilidad o combo; valor total ${round(totalSignatureValue, 1)}.`,
    signals: signatures.length
      ? signatures
          .flatMap((entry) =>
            entry.notes.length
              ? [`${entry.species}: ${entry.notes[0]}`]
              : [`${entry.species}: su perfil tiene más techo real que el sugerido por sus stats.`],
          )
          .slice(0, 2)
      : ["No se detectan picos claros de power por habilidad o combo en el equipo actual."],
  };
}

function buildRiskHeadline(totalRisk: number, label: string) {
  if (totalRisk >= 7.5) {
    return `Run risk alto para ${label}: el equipo todavia tiene huecos serios.`;
  }
  if (totalRisk >= 5) {
    return `Run risk medio para ${label}: hay plan, pero todavia no es estable.`;
  }
  return `Run risk controlado para ${label}: la estructura ya aguanta bien este tramo.`;
}

function collectTopSignals(sections: ScoreBreakdown[], limit: number) {
  return sections
    .flatMap((section) => section.signals)
    .filter(Boolean)
    .slice(0, limit);
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
