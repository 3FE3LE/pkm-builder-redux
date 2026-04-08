import {
  normalizeMoveLookupName,
  normalizeName,
  type RemoteEvolutionDetail,
  type ResolvedTeamMember,
} from "@/lib/teamAnalysis";

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
  const knownMoveNames = new Set(
    (member.moves ?? [])
      .map((move) => normalizeMoveLookupName(move.name ?? ""))
      .filter(Boolean),
  );
  const knownMoveTypes = new Set(
    (member.moves ?? [])
      .map((move) => normalizeName(move.type ?? ""))
      .filter(Boolean),
  );

  const trigger = normalizeName(detail.trigger ?? "");
  if (trigger === "use-item" || detail.item) {
    reasons.push(
      detail.item
        ? `Requiere usar ${detail.item} manualmente`
        : "Requiere usar un objeto manualmente",
    );
  }

  if (detail.heldItem) {
    reasons.push(`Requiere llevar ${detail.heldItem}`);
  }

  if (trigger === "trade" || detail.tradeSpecies) {
    reasons.push(
      detail.tradeSpecies
        ? `Requiere intercambio por ${detail.tradeSpecies}`
        : "Requiere intercambio",
    );
  }

  if (detail.partySpecies) {
    reasons.push(`Requiere ${detail.partySpecies} en el equipo`);
  }

  if (detail.partyType) {
    reasons.push(`Requiere un Pokemon ${detail.partyType} en el equipo`);
  }

  if (detail.location) {
    reasons.push(`Requiere evolucionar en ${detail.location}`);
  }

  if (detail.needsOverworldRain) {
    reasons.push("Requiere lluvia en el overworld");
  }

  if (detail.turnUpsideDown) {
    reasons.push("Requiere invertir la consola");
  }

  if (detail.minHappiness != null) {
    reasons.push("Requiere felicidad");
  }

  if (detail.minBeauty != null) {
    reasons.push("Requiere belleza");
  }

  if (detail.minAffection != null) {
    reasons.push("Requiere afecto");
  }

  if (preferences.level && detail.minLevel && (member.level ?? 0) < detail.minLevel) {
    reasons.push(`Requiere Lv ${detail.minLevel}`);
  }

  if (detail.relativePhysicalStats != null && summaryStats) {
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

  if (detail.knownMove) {
    const requiredMove = normalizeMoveLookupName(detail.knownMove);
    if (!knownMoveNames.has(requiredMove)) {
      reasons.push(`Requiere saber ${detail.knownMove}`);
    }
  }

  if (detail.knownMoveType) {
    const requiredType = normalizeName(detail.knownMoveType);
    if (!knownMoveTypes.has(requiredType)) {
      reasons.push(`Requiere saber un movimiento ${detail.knownMoveType}`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
