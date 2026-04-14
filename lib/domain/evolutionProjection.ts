import {
  buildEvolutionEligibility,
  type EvolutionConstraintPreferences,
  type EvolutionEligibility,
  type EvolutionTimeContext,
} from "@/lib/domain/evolutionEligibility";
import { normalizeName } from "@/lib/domain/names";

import type { EditableMember } from "@/lib/builderStore";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export function shouldAutoPromptEvolution({
  currentResolved,
  nextMember,
  nextLevel,
  resolvedTeam,
  localTime,
  evolutionConstraints,
  editorEvolutionEligibility,
}: {
  currentResolved?: ResolvedTeamMember;
  nextMember: EditableMember;
  nextLevel: number;
  resolvedTeam: ResolvedTeamMember[];
  localTime: EvolutionTimeContext;
  evolutionConstraints: EvolutionConstraintPreferences;
  editorEvolutionEligibility: EvolutionEligibility[];
}) {
  if (editorEvolutionEligibility.some((entry) => entry.eligible)) {
    return true;
  }

  return (
    editorEvolutionEligibility.some((entry) => {
      if (!entry.reasons.length) {
        return false;
      }

      const levelRequirements = entry.reasons
        .map((reason) => reason.match(/^Requiere Lv (\d+)$/)?.[1])
        .filter((value): value is string => Boolean(value))
        .map((value) => Number(value));

      return (
        levelRequirements.length > 0 &&
        levelRequirements.length === entry.reasons.length &&
        levelRequirements.some((requiredLevel) => nextLevel >= requiredLevel)
      );
    }) ||
    buildEvolutionEligibility(
      projectResolvedMemberForEvolution({
        currentResolved,
        nextMember,
        nextLevel,
      }),
      resolvedTeamWithProjectedMember({
        resolvedTeam,
        currentResolved,
        nextMember,
        nextLevel,
      }),
      localTime,
      evolutionConstraints,
    ).some((entry) => entry.eligible)
  );
}

export function projectResolvedMemberForEvolution({
  currentResolved,
  nextMember,
  nextLevel,
}: {
  currentResolved?: ResolvedTeamMember;
  nextMember: EditableMember;
  nextLevel: number;
}) {
  if (!currentResolved?.nextEvolutions?.length) {
    return undefined;
  }

  return {
    ...currentResolved,
    level: nextLevel,
    gender: nextMember.gender,
    ability: nextMember.ability,
    item: nextMember.item,
    moves: nextMember.moves.map((moveName) => {
      const existingMove = currentResolved.moves.find(
        (move) => normalizeName(move.name) === normalizeName(moveName),
      );
      return existingMove ?? { name: moveName };
    }),
  } satisfies ResolvedTeamMember;
}

export function resolvedTeamWithProjectedMember({
  resolvedTeam,
  currentResolved,
  nextMember,
  nextLevel,
}: {
  resolvedTeam: ResolvedTeamMember[];
  currentResolved?: ResolvedTeamMember;
  nextMember: EditableMember;
  nextLevel: number;
}) {
  const projectedMember = projectResolvedMemberForEvolution({
    currentResolved,
    nextMember,
    nextLevel,
  });
  if (!projectedMember || !currentResolved) {
    return resolvedTeam;
  }

  return resolvedTeam.some((entry) => entry.key === currentResolved.key)
    ? resolvedTeam.map((entry) =>
        entry.key === currentResolved.key ? projectedMember : entry,
      )
    : [...resolvedTeam, projectedMember];
}
