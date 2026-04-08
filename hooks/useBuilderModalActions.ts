"use client";

import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { reconcileAbilitySelection } from "@/lib/domain/abilities";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import { applyMoveSelection } from "@/lib/domain/moveSelection";
import { resolvePokemonProfile, type ResolvedTeamMember } from "@/lib/teamAnalysis";
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
    let didApply = false;
    store.updateMember(memberId, (item) => {
      const result = applyMoveSelection(item.moves, moveName, slotIndex);
      if (!result.didApply) {
        return item;
      }

      didApply = true;
      return { ...item, moves: result.nextMoves };
    });
    if (didApply) {
      closeMovePicker();
    }
  }

  function requestEvolution() {
    if (!store.editorMemberId || !derived.editorResolved?.nextEvolutions?.length) {
      return;
    }
    requestEvolutionForMember(store.editorMemberId);
  }

  function requestEvolutionForMember(memberId: string) {
    const memberResolved =
      (derived.editorResolved?.key === memberId ? derived.editorResolved : undefined) ??
      (derived.activeModalMember?.key === memberId ? derived.activeModalMember : undefined) ??
      derived.resolvedTeam.find((entry) => entry.key === memberId);
    if (!memberResolved) {
      return;
    }
    requestEvolutionForResolvedMember(memberId, memberResolved);
  }

  function requestEvolutionForResolvedMember(
    memberId: string,
    memberResolved: ResolvedTeamMember,
  ) {
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
    const currentResolved =
      (derived.editorResolved?.key === memberId ? derived.editorResolved : undefined) ??
      (derived.activeModalMember?.key === memberId ? derived.activeModalMember : undefined) ??
      derived.resolvedTeam.find((entry) => entry.key === memberId);
    const nextProfile = resolvePokemonProfile(
      data.docs,
      species,
      data.pokemonIndex[normalizeName(species)] ?? undefined,
    );
    const currentAbilityIndex = currentResolved?.ability
      ? currentResolved.abilities.findIndex(
          (ability) => normalizeName(ability) === normalizeName(currentResolved.ability ?? ""),
        )
      : -1;

    ui.setEvolvingIds((current) => ({ ...current, [memberId]: true }));
    store.updateMember(memberId, (item) => {
      const nextAbilities = nextProfile?.abilities ?? [];
      const indexedAbility =
        currentAbilityIndex >= 0 && currentAbilityIndex < nextAbilities.length
          ? nextAbilities[currentAbilityIndex] ?? ""
          : item.ability;
      const nextAbility = reconcileAbilitySelection(indexedAbility, nextAbilities) || item.ability;

      return { ...item, species, ability: nextAbility };
    });
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
    requestEvolutionForResolvedMember,
    selectEvolution,
    cancelEvolution,
    confirmEvolution,
  };
}
