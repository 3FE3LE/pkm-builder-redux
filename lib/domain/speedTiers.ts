import { calculateEffectiveStats } from "./battle";
import type { RunEncounterDefinition } from "../runEncounters";

type SpeedStats = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  bst: number;
};

type TeamMember = {
  species: string;
  level?: number;
  effectiveStats?: SpeedStats;
  summaryStats?: SpeedStats;
  resolvedStats?: SpeedStats;
  moves: {
    name: string;
  }[];
};

type PokemonIndexEntry = {
  name: string;
  stats?: SpeedStats;
};

export type SpeedTierSnapshot = {
  targetEncounterId: string;
  targetLabel: string;
  levelCap: number;
  benchmarkSpeed: number;
  fastestEnemy: {
    species: string;
    speed: number;
  } | null;
  outspeedCount: number;
  speedControlCount: number;
  exposedCount: number;
  notes: string[];
  memberMatchups: {
    species: string;
    speed: number;
    status: "outspeeds" | "ties" | "behind";
  }[];
};

const CHECKPOINT_TARGETS: Record<string, string> = {
  opening: "cheren",
  floccesy: "roxie",
  virbank: "burgh",
  castelia: "elesa",
};

const SPEED_CONTROL_MOVES = new Set([
  "thunder wave",
  "tailwind",
  "icy wind",
  "rock tomb",
  "electroweb",
  "trick room",
  "mach punch",
  "aqua jet",
  "ice shard",
  "bullet punch",
  "shadow sneak",
  "extremespeed",
  "vacuum wave",
]);

export function buildSpeedTierSnapshot({
  checkpointId,
  team,
  pokemonIndex,
  encounters,
  targetEncounterId,
}: {
  checkpointId: string;
  team: TeamMember[];
  pokemonIndex: Record<string, PokemonIndexEntry | null | undefined>;
  encounters: RunEncounterDefinition[];
  targetEncounterId?: string | null;
}): SpeedTierSnapshot {
  const targetEncounter =
    (targetEncounterId ? encounters.find((entry) => entry.id === targetEncounterId) : undefined) ??
    encounters.find((entry) => entry.id === (CHECKPOINT_TARGETS[checkpointId] ?? "cheren")) ??
    encounters.find((entry) => entry.mandatory) ??
    encounters[0];

  const enemySpecies = [
    ...(targetEncounter?.team ?? []),
    ...((targetEncounter?.bosses ?? []).flatMap((boss) => boss.team) ?? []),
  ].filter(Boolean);

  const enemyBenchmarks = enemySpecies
    .map((species) => {
      const entry = pokemonIndex[normalize(species)];
      if (!entry?.stats) {
        return null;
      }
      const stats = calculateEffectiveStats(entry.stats, targetEncounter.levelCap, "Serious", {
        hp: 31,
        atk: 31,
        def: 31,
        spa: 31,
        spd: 31,
        spe: 31,
      });
      return {
        species: entry.name ?? species,
        speed: stats.spe,
      };
    })
    .filter((entry): entry is { species: string; speed: number } => Boolean(entry))
    .sort((left, right) => right.speed - left.speed);

  const benchmarkSpeed = enemyBenchmarks[0]?.speed ?? inferFallbackBenchmark(targetEncounter.levelCap);
  const activeTeam = team.filter((member) => member.species.trim());
  const memberMatchups = activeTeam
    .map((member) => {
      const speed = member.effectiveStats?.spe ?? member.summaryStats?.spe ?? 0;
      return {
        species: member.species,
        speed,
        status:
          speed > benchmarkSpeed
            ? ("outspeeds" as const)
            : speed === benchmarkSpeed
              ? ("ties" as const)
              : ("behind" as const),
      };
    })
    .sort((left, right) => right.speed - left.speed);

  const outspeedCount = memberMatchups.filter((entry) => entry.status === "outspeeds").length;
  const exposedCount = memberMatchups.filter((entry) => entry.status === "behind").length;
  const speedControlCount = activeTeam.filter((member) =>
    member.moves.some((move) => SPEED_CONTROL_MOVES.has(move.name.toLowerCase())),
  ).length;

  return {
    targetEncounterId: targetEncounter.id,
    targetLabel: targetEncounter.label,
    levelCap: targetEncounter.levelCap,
    benchmarkSpeed,
    fastestEnemy: enemyBenchmarks[0] ?? null,
    outspeedCount,
    speedControlCount,
    exposedCount,
    notes: buildNotes({
      targetLabel: targetEncounter.label,
      benchmarkSpeed,
      fastestEnemy: enemyBenchmarks[0] ?? null,
      outspeedCount,
      speedControlCount,
      exposedCount,
    }),
    memberMatchups,
  };
}

function buildNotes({
  targetLabel,
  benchmarkSpeed,
  fastestEnemy,
  outspeedCount,
  speedControlCount,
  exposedCount,
}: {
  targetLabel: string;
  benchmarkSpeed: number;
  fastestEnemy: { species: string; speed: number } | null;
  outspeedCount: number;
  speedControlCount: number;
  exposedCount: number;
}) {
  const notes = [
    fastestEnemy
      ? `${targetLabel}: la referencia de velocidad es ${fastestEnemy.species} con ${fastestEnemy.speed} Spe estimada.`
      : `${targetLabel}: benchmark provisional ${benchmarkSpeed} Spe.`,
  ];

  if (outspeedCount >= 2) {
    notes.push(`Tienes ${outspeedCount} slots que superan el speed tier del siguiente boss.`);
  } else {
    notes.push(`Solo ${outspeedCount} slots superan el speed tier del siguiente boss.`);
  }

  if (speedControlCount > 0) {
    notes.push(`El equipo trae ${speedControlCount} formas de speed control o prioridad util.`);
  } else if (exposedCount >= 3) {
    notes.push("El equipo llega expuesto al snowball rival y sin speed control claro.");
  }

  return notes;
}

function inferFallbackBenchmark(levelCap: number) {
  if (levelCap <= 15) {
    return 30;
  }
  if (levelCap <= 25) {
    return 50;
  }
  if (levelCap <= 35) {
    return 75;
  }
  return 100;
}

function normalize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
