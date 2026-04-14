import { TYPE_ORDER } from "@/lib/domain/typeChart";

import type { EnrichedCaptureRecommendation } from "@/lib/domain/scoring/enrichRecommendations";

export function getCaptureVerdictLabel(
  verdict: EnrichedCaptureRecommendation["score"]["verdict"],
) {
  if (verdict === "strong") {
    return "Excelente";
  }

  if (verdict === "solid") {
    return "Sólido";
  }

  if (verdict === "situational") {
    return "Situacional";
  }

  return "Limitado";
}

export function getReduxCardLabel(
  recommendation: EnrichedCaptureRecommendation,
) {
  const reduxLabels = recommendation.redux?.labels ?? [];

  if (!reduxLabels.length) {
    return "Base";
  }

  if (reduxLabels.length >= 3) {
    return "Línea+";
  }

  return reduxLabels.length === 2 ? "Doble" : "Sí";
}

export function extractMentionedTypes(signals: string[]) {
  const lowerSignals = signals.join(" ").toLowerCase();
  return TYPE_ORDER.filter((type) =>
    lowerSignals.includes(type.toLowerCase()),
  );
}

export function getOffenseMoves(
  recommendation: EnrichedCaptureRecommendation,
) {
  return (recommendation.candidateMember.moves ?? []).filter(
    (move) =>
      move.damageClass !== "status" &&
      ((move.power ?? 0) >= 60 || move.hasStab),
  );
}

export function getUtilityMoves(
  recommendation: EnrichedCaptureRecommendation,
) {
  const projectedSet = new Set(
    recommendation.projectedMoves.map((move) => move.toLowerCase()),
  );
  const gains = recommendation.delta.gains ?? [];

  return (recommendation.candidateMember.moves ?? []).filter(
    (move) =>
      move.damageClass === "status" ||
      projectedSet.has(move.name.toLowerCase()) ||
      gains.some((gain) =>
        gain.toLowerCase().includes(move.name.toLowerCase()),
      ),
  );
}
