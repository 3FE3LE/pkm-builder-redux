import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

const SETUP_MOVES = new Set([
  "calm mind",
  "bulk up",
  "dragon dance",
  "coil",
  "swords dance",
  "nasty plot",
  "quiver dance",
  "shell smash",
  "curse",
  "growth",
  "agility",
  "rock polish",
]);

const SCREEN_MOVES = new Set(["reflect", "light screen", "aurora veil"]);
const STATUS_UTILITY_MOVES = new Set([
  "leech seed",
  "glare",
  "thunder wave",
  "toxic",
  "will o wisp",
  "protect",
  "substitute",
  "taunt",
  "encore",
  "disable",
  "knock off",
  "rapid spin",
  "defog",
  "roar",
  "whirlwind",
  "haze",
]);
const PIVOT_MOVES = new Set(["u turn", "volt switch", "parting shot", "baton pass", "flip turn"]);
const RECOVERY_MOVES = new Set([
  "recover",
  "roost",
  "slack off",
  "soft boiled",
  "milk drink",
  "moonlight",
  "synthesis",
  "rest",
  "drain punch",
  "giga drain",
  "leech seed",
]);
const PRIORITY_MOVES = new Set([
  "mach punch",
  "aqua jet",
  "ice shard",
  "bullet punch",
  "shadow sneak",
  "extremespeed",
  "vacuum wave",
  "accelerock",
  "sucker punch",
]);

export type MemberLens = {
  summary: string;
  role: string;
  teamPlan: string;
  supportNeeds: string[];
  tags: string[];
  axes: {
    pressure: number;
    utility: number;
    setup: number;
    pivot: number;
    sustain: number;
    speedControl: number;
  };
};

export function buildMemberLens(member?: ResolvedTeamMember): MemberLens {
  if (!member?.species) {
    return {
      summary: "Añade o define mejor este slot para leer su función real dentro del equipo.",
      role: "sin lectura",
      teamPlan: "sin contexto",
      supportNeeds: ["completa el set", "define su función"],
      tags: ["slot pendiente"],
      axes: {
        pressure: 0,
        utility: 0,
        setup: 0,
        pivot: 0,
        sustain: 0,
        speedControl: 0,
      },
    };
  }

  const moveNames = member.moves.map((move) => move.name.toLowerCase()).filter(Boolean);
  const attackingMoves = member.moves.filter((move) => move.damageClass && move.damageClass !== "status");
  const strongAttacks = attackingMoves.filter((move) => (move.adjustedPower ?? move.power ?? 0) >= 70);
  const setupCount = moveNames.filter((move) => SETUP_MOVES.has(move)).length;
  const screenCount = moveNames.filter((move) => SCREEN_MOVES.has(move)).length;
  const utilityCount = moveNames.filter((move) => STATUS_UTILITY_MOVES.has(move)).length;
  const pivotCount = moveNames.filter((move) => PIVOT_MOVES.has(move)).length;
  const recoveryCount = moveNames.filter((move) => RECOVERY_MOVES.has(move)).length;
  const priorityCount = moveNames.filter((move) => PRIORITY_MOVES.has(move)).length;
  const offensiveStabCount = member.moves.filter(
    (move) =>
      move.hasStab &&
      move.damageClass !== "status" &&
      (move.adjustedPower ?? move.power ?? 0) >= 55,
  ).length;
  const speed = member.effectiveStats?.spe ?? member.summaryStats?.spe ?? 0;
  const bulk =
    (member.effectiveStats?.hp ?? 0) +
    (member.effectiveStats?.def ?? 0) +
    (member.effectiveStats?.spd ?? 0);
  const offensiveBias =
    (member.effectiveStats?.atk ?? 0) +
    (member.effectiveStats?.spa ?? 0) +
    strongAttacks.length * 10 +
    offensiveStabCount * 8;
  const axes = {
    pressure: clamp(
      strongAttacks.length * 18 +
        offensiveStabCount * 14 +
        Math.max(0, offensiveBias - 150) * 0.18,
      0,
      100,
    ),
    utility: clamp(screenCount * 28 + utilityCount * 16, 0, 100),
    setup: clamp(setupCount * 34 + (setupCount > 0 ? offensiveStabCount * 8 : 0), 0, 100),
    pivot: clamp(pivotCount * 38 + (speed >= 95 ? 18 : 0) + (utilityCount > 0 ? 8 : 0), 0, 100),
    sustain: clamp(recoveryCount * 30 + Math.max(0, bulk - 220) * 0.14, 0, 100),
    speedControl: clamp(
      priorityCount * 20 +
        (speed >= 110 ? 50 : speed >= 95 ? 32 : speed >= 80 ? 18 : 0) +
        moveNames.filter((move) => ["thunder wave", "glare", "tailwind", "icy wind", "electroweb", "rock tomb"].includes(move)).length * 18,
      0,
      100,
    ),
  };

  let role = "pieza flexible";
  let teamPlan = "encájalo como slot funcional y deja que el resto del equipo cubra lo que no alcanza a resolver solo.";

  if (axes.utility >= 56 && axes.pressure < 60) {
    role = "support enabler";
    teamPlan = "su mejor uso es abrir turnos, poner utility y habilitar a otro slot para cerrar o romper.";
  } else if (axes.setup >= 55 && axes.pressure >= 55) {
    role = "setup wincon";
    teamPlan = "protégelo hasta que encuentre el turno de boost y deja que otros slots abran el camino.";
  } else if (axes.pivot >= 58) {
    role = "tempo pivot";
    teamPlan = "mantiene iniciativa, genera entradas favorables y distribuye presión sin exigir protagonismo constante.";
  } else if (axes.pressure >= 65) {
    role = "primary breaker";
    teamPlan = "rompe núcleos rivales para que otro miembro limpie después o para forzar progreso inmediato.";
  } else if (axes.speedControl >= 58) {
    role = "speed control";
    teamPlan = "funciona mejor asegurando revenge kills y evitando que el rival marque el tempo.";
  } else if (axes.sustain >= 55) {
    role = "bulky glue";
    teamPlan = "absorbe presión, recompone el tempo y estabiliza el equipo entre intercambios.";
  }

  const supportNeeds = new Set<string>();
  if (member.resolvedTypes.includes("Grass")) {
    supportNeeds.add("switch-in o presión sólida contra Ice");
    supportNeeds.add("respuesta estable a Fire o Bug");
  }
  if (screenCount > 0 || utilityCount >= 2) {
    supportNeeds.add("breaker o cleaner que capitalice los turnos que abre");
  }
  if (setupCount > 0) {
    supportNeeds.add("pivots que le den entrada segura");
    supportNeeds.add("soporte para debilitar checks antes del sweep");
  }
  if (pivotCount > 0) {
    supportNeeds.add("compañero que aproveche los cambios forzados");
  }
  if (speed < 90 && priorityCount === 0) {
    supportNeeds.add("speed control secundario");
  }
  if ((member.item ?? "").trim().length === 0) {
    supportNeeds.add("item definido para cerrar su plan");
  }
  if (strongAttacks.length === 0 && utilityCount === 0) {
    supportNeeds.add("movimientos que definan mejor su función");
  }

  return {
    summary: `${member.species} está leyendo como ${role}. ${teamPlan}`,
    role,
    teamPlan,
    supportNeeds: [...supportNeeds].slice(0, 4),
    tags: [
      member.ability || "sin habilidad",
      member.item || "sin item",
      member.nature || "sin naturaleza",
      ...member.resolvedTypes,
    ].slice(0, 4),
    axes,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
