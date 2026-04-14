"use client";

import { useMemo, useState } from "react";

import { editableMemberSchema } from "@/lib/builderForm";
import { createEditable, type EditableMember } from "@/lib/builderStore";
import type { EvolutionConstraintPreferences, EvolutionEligibility, EvolutionTimeContext } from "@/lib/domain/evolutionEligibility";
import { getEvolutionLineBaseSpecies } from "@/lib/domain/evolutionLine";
import {
  getLevelUpMovesBetweenLevels,
  mergeLevelUpMoveQueues,
  type LevelUpMoveEntry,
} from "@/lib/domain/levelUpMoves";
import { buildMemberLens } from "@/lib/domain/memberLens";
import {
  projectResolvedMemberForEvolution,
  shouldAutoPromptEvolution,
} from "@/lib/domain/evolutionProjection";
import { getAvailableFormsForSpecies } from "@/lib/forms";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

import type { SpeciesCatalogEntry } from "@/components/team/editor/types";
import type { ResetFields } from "@/components/team/workspace/roster/SlotModals";

type UseEditorMemberStateParams = {
  member: EditableMember;
  resolved?: ResolvedTeamMember;
  starterSpeciesLine: string[];
  speciesCatalog: SpeciesCatalogEntry[];
  pokemonIndex: Record<string, { name?: string; nextEvolutions?: string[] }>;
  resolvedTeam: ResolvedTeamMember[];
  editorEvolutionEligibility: EvolutionEligibility[];
  evolutionState: {
    currentSpecies: string;
    currentSpriteUrl?: string;
    currentAnimatedSpriteUrl?: string;
    nextOptions: {
      species: string;
      spriteUrl?: string;
      animatedSpriteUrl?: string;
      eligible?: boolean;
      reasons?: string[];
    }[];
    selectedNext: string | null;
  } | null;
  localTime: EvolutionTimeContext;
  evolutionConstraints: EvolutionConstraintPreferences;
  onChange: (next: EditableMember) => void;
  onRequestEvolution: () => void;
  onAutoRequestEvolution: (projectedResolved: ResolvedTeamMember) => void;
};

export function useEditorMemberState({
  member,
  resolved,
  starterSpeciesLine,
  speciesCatalog,
  pokemonIndex,
  resolvedTeam,
  editorEvolutionEligibility,
  evolutionState,
  localTime,
  evolutionConstraints,
  onChange,
  onRequestEvolution,
  onAutoRequestEvolution,
}: UseEditorMemberStateParams) {
  const [editorTab, setEditorTab] = useState<"stats" | "moves" | "typing">("stats");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [levelUpQueue, setLevelUpQueue] = useState<LevelUpMoveEntry[]>([]);
  const [pendingEvolutionPrompt, setPendingEvolutionPrompt] = useState<{
    species: string;
    level: number;
  } | null>(null);
  const [resetFields, setResetFields] = useState<ResetFields>({
    evolutionLine: false,
    nickname: true,
    level: true,
    gender: true,
    nature: true,
    ability: true,
    item: true,
    moves: true,
    ivs: true,
    evs: true,
  });

  const currentLevel = Number(member.level ?? 1);
  const currentSpecies = String(member.species ?? "");
  const formOptions = getAvailableFormsForSpecies(currentSpecies);
  const parsedValues = editableMemberSchema.safeParse(member);
  const issues = parsedValues.success ? [] : parsedValues.error.issues;
  const getIssue = (path: string) => issues.find((issue) => issue.path.join(".") === path)?.message;
  const canRequestEvolution = editorEvolutionEligibility.some((entry) => entry.eligible);
  const evolutionBlockReason =
    !canRequestEvolution && editorEvolutionEligibility.length
      ? editorEvolutionEligibility
          .flatMap((entry) => entry.reasons.slice(0, 2))
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ")
      : undefined;
  const currentNature = String(member.nature ?? "Serious");
  const currentAbility = String(member.ability ?? "");
  const currentItem = String(member.item ?? "");
  const starterLens = useMemo(
    () => (resolved && starterSpeciesLine.includes(resolved.species) ? buildMemberLens(resolved) : null),
    [resolved, starterSpeciesLine],
  );
  const evolutionLineBaseSpecies = useMemo(
    () =>
      getEvolutionLineBaseSpecies({
        species: currentSpecies,
        speciesCatalog,
        pokemonIndex,
      }),
    [currentSpecies, pokemonIndex, speciesCatalog],
  );

  function maybeOpenPendingEvolution(nextQueueLength: number) {
    if (!pendingEvolutionPrompt) {
      return;
    }
    if (pendingEvolutionPrompt.species !== currentSpecies || currentLevel < pendingEvolutionPrompt.level) {
      setPendingEvolutionPrompt(null);
      return;
    }
    if (nextQueueLength > 0 || evolutionState || !canRequestEvolution) {
      return;
    }

    onRequestEvolution();
    setPendingEvolutionPrompt(null);
  }

  function updateEditorMember(updater: (current: EditableMember) => EditableMember) {
    const next = updater(member);
    const nextLevel = Number(next.level ?? currentLevel);
    const speciesChanged = next.species !== member.species;
    const unlockedMoves =
      !speciesChanged &&
      nextLevel > currentLevel &&
      resolved?.learnsets?.levelUp?.length
        ? getLevelUpMovesBetweenLevels({
            learnset: resolved.learnsets.levelUp,
            currentMoves: member.moves,
            fromLevel: currentLevel,
            toLevel: nextLevel,
          })
        : [];

    if (speciesChanged) {
      setLevelUpQueue([]);
      setPendingEvolutionPrompt(null);
    }
    if (unlockedMoves.length) {
      setLevelUpQueue((currentQueue) => mergeLevelUpMoveQueues(currentQueue, unlockedMoves));
      setEditorTab("moves");
    }
    if (!speciesChanged && nextLevel > currentLevel) {
      setPendingEvolutionPrompt(
        unlockedMoves.length
          ? {
              species: member.species,
              level: nextLevel,
            }
          : null,
      );
    }
    if (!speciesChanged && nextLevel < currentLevel) {
      setPendingEvolutionPrompt(null);
    }

    const parsed = editableMemberSchema.safeParse(next);
    onChange(parsed.success ? parsed.data : next);

    if (
      !speciesChanged &&
      nextLevel > currentLevel &&
      unlockedMoves.length === 0 &&
      shouldAutoPromptEvolution({
        currentResolved: resolved,
        nextMember: next,
        nextLevel,
        resolvedTeam,
        localTime,
        evolutionConstraints,
        editorEvolutionEligibility,
      })
    ) {
      const projectedResolved = projectResolvedMemberForEvolution({
        currentResolved: resolved,
        nextMember: next,
        nextLevel,
      });
      window.setTimeout(() => {
        if (projectedResolved) {
          onAutoRequestEvolution(projectedResolved);
        }
      }, 0);
    }
  }

  function advanceLevelUpQueue() {
    setLevelUpQueue((currentQueue) => {
      const nextQueue = currentQueue.slice(1);
      maybeOpenPendingEvolution(nextQueue.length);
      return nextQueue;
    });
  }

  function handleCloseLevelUpModal() {
    setLevelUpQueue([]);
    maybeOpenPendingEvolution(0);
  }

  function handleSkipLevelUpMove() {
    advanceLevelUpQueue();
  }

  function handleLearnLevelUpMove() {
    const queuedMove = levelUpQueue[0];
    if (!queuedMove || member.moves.includes(queuedMove.move) || member.moves.length >= 4) {
      advanceLevelUpQueue();
      return;
    }

    onChange({
      ...member,
      moves: [...member.moves, queuedMove.move],
    });
    advanceLevelUpQueue();
  }

  function handleReplaceLevelUpMove(slotIndex: number) {
    const queuedMove = levelUpQueue[0];
    if (!queuedMove || !member.moves[slotIndex]) {
      return;
    }

    const nextMoves = [...member.moves];
    nextMoves[slotIndex] = queuedMove.move;
    onChange({
      ...member,
      moves: nextMoves,
    });
    advanceLevelUpQueue();
  }

  function resetSelectedMember() {
    const resetSpecies = resetFields.evolutionLine ? evolutionLineBaseSpecies : member.species;
    const defaults = createEditable(resetSpecies);
    defaults.id = member.id;
    defaults.locked = member.locked;
    defaults.nickname = resetSpecies;
    setLevelUpQueue([]);
    setPendingEvolutionPrompt(null);

    onChange({
      ...member,
      species: resetSpecies,
      nickname: resetFields.nickname ? defaults.nickname : member.nickname,
      level: resetFields.level ? defaults.level : member.level,
      gender: resetFields.gender ? defaults.gender : member.gender,
      nature: resetFields.nature ? defaults.nature : member.nature,
      ability: resetFields.ability ? defaults.ability : member.ability,
      item: resetFields.item ? defaults.item : member.item,
      moves: resetFields.moves ? defaults.moves : member.moves,
      ivs: resetFields.ivs ? defaults.ivs : member.ivs,
      evs: resetFields.evs ? defaults.evs : member.evs,
    });
    setResetOpen(false);
  }

  return {
    canRequestEvolution,
    currentAbility,
    currentItem,
    currentLevel,
    currentNature,
    currentSpecies,
    detailsOpen,
    editorTab,
    evolutionBlockReason,
    formOptions,
    getIssue,
    handleCloseLevelUpModal,
    handleLearnLevelUpMove,
    handleReplaceLevelUpMove,
    handleSkipLevelUpMove,
    levelUpQueue,
    resetFields,
    resetOpen,
    resetSelectedMember,
    setDetailsOpen,
    setEditorTab,
    setResetFields,
    setResetOpen,
    starterLens,
    updateEditorMember,
  };
}
