import type { CandidateScore } from "../profiles/types";

const VERDICT_LABELS: Record<CandidateScore["verdict"], string> = {
  strong: "Excelente opción",
  solid: "Opción sólida",
  situational: "Opción situacional",
  weak: "Opción limitada",
};

export function buildScoreExplanation(score: CandidateScore): string {
  const parts: string[] = [];

  parts.push(`${VERDICT_LABELS[score.verdict]} (${score.finalScore.toFixed(0)}).`);

  // Top 2 signals from highest-weighted dimensions
  const sorted = Object.values(score.breakdown)
    .sort((a, b) => b.weighted - a.weighted);

  for (const dim of sorted.slice(0, 2)) {
    if (dim.signals.length > 0) {
      parts.push(dim.signals[0]);
    }
  }

  return parts.join(" ");
}

export function buildShortLabel(score: CandidateScore): string {
  return `${score.finalScore.toFixed(0)} — ${VERDICT_LABELS[score.verdict]}`;
}
