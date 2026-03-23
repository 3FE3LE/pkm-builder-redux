export type MilestoneReplacementDeltas = {
  milestoneId: string;
  milestoneLabel: string;
  deltas: {
    species: string;
    riskDelta: number;
    scoreDelta: number;
    action: "add" | "replace" | "skip";
    replacedSlot?: string;
    source: string;
    area?: string;
  }[];
};

export type ReplacementPlan = {
  species: string;
  keepUntil: string;
  status: "hold" | "upgrade-soon" | "replace-now";
  summary: string;
  replacementOptions: {
    species: string;
    milestoneId: string;
    milestoneLabel: string;
    source: string;
    area?: string;
    riskDelta: number;
    scoreDelta: number;
  }[];
};

export function buildReplacementPlanner({
  teamSpecies,
  currentMilestoneId,
  currentMilestoneLabel,
  milestoneDeltas,
}: {
  teamSpecies: string[];
  currentMilestoneId: string;
  currentMilestoneLabel: string;
  milestoneDeltas: MilestoneReplacementDeltas[];
}): ReplacementPlan[] {
  const activeSpecies = teamSpecies.filter(Boolean);

  return activeSpecies.map((species) => {
    const options = milestoneDeltas
      .flatMap((milestone) =>
        milestone.deltas
          .filter(
            (delta) =>
              delta.action === "replace" &&
              delta.replacedSlot === species &&
              delta.riskDelta >= 0.4,
          )
          .map((delta) => ({
            species: delta.species,
            milestoneId: milestone.milestoneId,
            milestoneLabel: milestone.milestoneLabel,
            source: delta.source,
            area: delta.area,
            riskDelta: delta.riskDelta,
            scoreDelta: delta.scoreDelta,
          })),
      )
      .sort(
        (left, right) =>
          right.riskDelta - left.riskDelta ||
          right.scoreDelta - left.scoreDelta ||
          left.species.localeCompare(right.species),
      );

    const firstUpgrade = options[0];
    const keepUntil = firstUpgrade ? firstUpgrade.milestoneLabel : currentMilestoneLabel;
    const status = !firstUpgrade
      ? ("hold" as const)
      : firstUpgrade.milestoneId === currentMilestoneId
        ? ("replace-now" as const)
        : ("upgrade-soon" as const);

    return {
      species,
      keepUntil,
      status,
      summary: buildSummary({
        species,
        status,
        currentMilestoneLabel,
        firstUpgrade,
      }),
      replacementOptions: options.slice(0, 3),
    };
  });
}

function buildSummary({
  species,
  status,
  currentMilestoneLabel,
  firstUpgrade,
}: {
  species: string;
  status: "hold" | "upgrade-soon" | "replace-now";
  currentMilestoneLabel: string;
  firstUpgrade?: ReplacementPlan["replacementOptions"][number];
}) {
  if (!firstUpgrade) {
    return `${species} no tiene un upgrade claro desde ${currentMilestoneLabel}.`;
  }

  if (status === "replace-now") {
    return `${species} ya compite mal en este tramo; ${firstUpgrade.species} entra mejor ahora.`;
  }

  return `${species} aguanta por ahora, pero ${firstUpgrade.species} mejora la run en ${firstUpgrade.milestoneLabel}.`;
}
