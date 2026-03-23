import { normalizeName, type RemoteEvolutionDetail, type ResolvedTeamMember } from "@/lib/teamAnalysis";

export type EvolutionEligibility = {
  species: string;
  eligible: boolean;
  reasons: string[];
};

export type EvolutionTimeContext = {
  ready: boolean;
  period: "day" | "night";
  label: string;
};

export type EvolutionConstraintPreferences = {
  level: boolean;
  gender: boolean;
  timeOfDay: boolean;
};

export function buildEvolutionEligibility(
  member: ResolvedTeamMember | undefined,
  team: ResolvedTeamMember[],
  timeContext: EvolutionTimeContext,
  preferences: EvolutionConstraintPreferences,
): EvolutionEligibility[] {
  if (!member?.nextEvolutions?.length) {
    return [];
  }

  return member.nextEvolutions.map((species) => {
    const details =
      member.evolutionDetails?.filter(
        (detail) => normalizeName(detail.target) === normalizeName(species),
      ) ?? [];

    if (!details.length) {
      return {
        species,
        eligible: true,
        reasons: [],
      };
    }

    const matchingPaths = details.map((detail) =>
      evaluateEvolutionPath(member, team, detail, timeContext, preferences),
    );
    const firstEligible = matchingPaths.find((entry) => entry.eligible);

    if (firstEligible) {
      return {
        species,
        eligible: true,
        reasons: [],
      };
    }

    const mergedReasons = [...new Set(matchingPaths.flatMap((entry) => entry.reasons))];
    return {
      species,
      eligible: false,
      reasons: mergedReasons,
    };
  });
}

function evaluateEvolutionPath(
  member: ResolvedTeamMember,
  team: ResolvedTeamMember[],
  detail: RemoteEvolutionDetail,
  timeContext: EvolutionTimeContext,
  preferences: EvolutionConstraintPreferences,
) {
  const reasons: string[] = [];
  const summaryStats = member.summaryStats ?? member.resolvedStats;

  if (preferences.level && detail.minLevel && (member.level ?? 0) < detail.minLevel) {
    reasons.push(`Requiere Lv ${detail.minLevel}`);
  }

  if (detail.relativePhysicalStats !== undefined && summaryStats) {
    const relation =
      summaryStats.atk > summaryStats.def ? 1 : summaryStats.atk < summaryStats.def ? -1 : 0;
    if (relation !== detail.relativePhysicalStats) {
      reasons.push(
        detail.relativePhysicalStats === 1
          ? "Requiere Atk > Def"
          : detail.relativePhysicalStats === -1
            ? "Requiere Atk < Def"
            : "Requiere Atk = Def",
      );
    }
  }

  if (preferences.timeOfDay && detail.timeOfDay) {
    const normalizedTimeOfDay = normalizeName(detail.timeOfDay);
    if (normalizedTimeOfDay === "day" || normalizedTimeOfDay === "night") {
      if (!timeContext.ready) {
        reasons.push("Esperando la hora local del navegador");
      } else if (timeContext.period !== normalizedTimeOfDay) {
        reasons.push(
          `Requiere ${normalizedTimeOfDay === "day" ? "día" : "noche"} (ahora ${timeContext.label})`,
        );
      }
    }
  }

  if (preferences.gender && detail.gender) {
    const requiredGender = detail.gender === 1 ? "female" : detail.gender === 2 ? "male" : null;
    if (requiredGender && member.gender !== requiredGender) {
      reasons.push(`Requiere género ${requiredGender === "female" ? "hembra" : "macho"}`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
