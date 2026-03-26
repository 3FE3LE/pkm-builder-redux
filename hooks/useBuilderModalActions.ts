"use client";

import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import type { BuilderActionDeps } from "@/hooks/actionTypes";

export function useBuilderModalActions({
  data,
  store,
  ui,
  derived,
}: BuilderActionDeps) {
  function updateCompareMember(index: 0 | 1, nextMember: (typeof ui.compareMembers)[number]) {
    ui.setCompareMembers((current) => {
      const updated = [...current] as typeof current;
      updated[index] = nextMember;
      return updated;
    });
  }

  function openMovePicker(memberId: string, slotIndex: number | null = null) {
    ui.setMovePickerState({ memberId, slotIndex });
    ui.setMoveModalTab("levelUp");
    ui.setExpandedMoveKey(null);
  }

  function openMovePickerForEditor(slotIndex: number | null = null) {
    if (!store.editorMemberId) {
      return;
    }
    openMovePicker(store.editorMemberId, slotIndex);
  }

  function openMovePickerForMember(memberId: string, slotIndex: number | null = null) {
    openMovePicker(memberId, slotIndex);
  }

  function closeMovePicker() {
    ui.setMovePickerState(null);
    ui.setExpandedMoveKey(null);
  }

  function pickMove(moveName: string) {
    if (!ui.movePickerState) {
      return;
    }
    const { memberId, slotIndex } = ui.movePickerState;
    store.updateMember(memberId, (item) => {
      if (slotIndex === null) {
        if (item.moves.includes(moveName) || item.moves.length >= 4) {
          return item;
        }
        return { ...item, moves: [...item.moves, moveName] };
      }

      const currentMove = item.moves[slotIndex];
      const existsElsewhere = item.moves.some(
        (existingMove, index) => existingMove === moveName && index !== slotIndex,
      );

      if (!currentMove || existsElsewhere || currentMove === moveName) {
        return item;
      }

      const nextMoves = [...item.moves];
      nextMoves[slotIndex] = moveName;
      return { ...item, moves: nextMoves };
    });
    closeMovePicker();
  }

  function requestEvolution() {
    if (!store.editorMemberId || !derived.editorResolved?.nextEvolutions?.length) {
      return;
    }
    requestEvolutionForMember(store.editorMemberId);
  }

  function requestEvolutionForMember(memberId: string) {
    const memberResolved =
      derived.resolvedLibrary.find((entry) => entry.key === memberId) ??
      derived.resolvedTeam.find((entry) => entry.key === memberId);
    if (!memberResolved?.nextEvolutions?.length) {
      return;
    }

    const memberEvolutionEligibility = buildEvolutionEligibility(
      memberResolved,
      derived.resolvedTeam,
      ui.localTime,
      store.evolutionConstraints,
    );

    const nextOptions = memberResolved.nextEvolutions.map((species) => {
      const eligibility = memberEvolutionEligibility.find(
        (entry) => normalizeName(entry.species) === normalizeName(species),
      );
      const match = data.speciesCatalog.find(
        (entry) => normalizeName(entry.name) === normalizeName(species),
      );
      const sprites = buildSpriteUrls(species, match?.dex);
      return {
        species,
        spriteUrl: sprites.spriteUrl,
        animatedSpriteUrl: sprites.animatedSpriteUrl,
        eligible: eligibility?.eligible ?? true,
        reasons: eligibility?.reasons ?? [],
      };
    });

    const eligibleOptions = nextOptions.filter((option) => option.eligible);
    if (!eligibleOptions.length) {
      return;
    }

    ui.setEvolutionState({
      memberId,
      currentSpecies: memberResolved.species,
      currentSpriteUrl: memberResolved.spriteUrl,
      currentAnimatedSpriteUrl: memberResolved.animatedSpriteUrl,
      nextOptions,
      selectedNext: eligibleOptions[0]?.species ?? null,
    });
  }

  function selectEvolution(species: string) {
    ui.setEvolutionState((current) =>
      current ? { ...current, selectedNext: species } : current,
    );
  }

  function cancelEvolution() {
    ui.setEvolutionState(null);
  }

  function confirmEvolution(species: string) {
    if (!ui.evolutionState) {
      return;
    }

    const memberId = ui.evolutionState.memberId;
    ui.setEvolvingIds((current) => ({ ...current, [memberId]: true }));
    store.updateMember(memberId, (item) => ({ ...item, species }));
    ui.setEvolutionState(null);
    window.setTimeout(() => {
      ui.setEvolvingIds((current) => ({ ...current, [memberId]: false }));
    }, 1400);
  }

  return {
    updateCompareMember,
    openMovePicker,
    openMovePickerForEditor,
    openMovePickerForMember,
    closeMovePicker,
    pickMove,
    requestEvolution,
    requestEvolutionForMember,
    selectEvolution,
    cancelEvolution,
    confirmEvolution,
  };
}
