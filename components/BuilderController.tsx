"use client";

import { useMemo } from "react";

import { starters } from "@/lib/builder";
import { TYPE_COLORS } from "@/lib/domain/typeChart";
import { getRunEncounterCatalog } from "@/lib/runEncounters";

import type { BuilderDataProps } from "@/hooks/types";
import { useBuilderActions } from "@/hooks/useBuilderActions";
import { useBuilderDerivedData } from "@/hooks/useBuilderDerivedData";
import { useBuilderStoreState } from "@/hooks/useBuilderStoreState";
import { useBuilderUiState } from "@/hooks/useBuilderUiState";

export function getSingleTypeSurface(type?: string | null) {
  const color = TYPE_COLORS[type ?? "Normal"] ?? "hsl(169 37% 68%)";

  return {
    backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${color} 13%, transparent) 0%, var(--surface-3) 62%, var(--surface-2) 100%)`,
  };
}

export function useBuilderController({
  docs,
  moveHighlights,
  speciesOptions,
  speciesCatalog,
  moveIndex,
  pokemonIndex,
  abilityCatalog,
  itemCatalog,
}: BuilderDataProps) {
  const data = {
    docs,
    moveHighlights,
    speciesOptions,
    speciesCatalog,
    moveIndex,
    pokemonIndex,
    abilityCatalog,
    itemCatalog,
  };

  const store = useBuilderStoreState();
  const ui = useBuilderUiState();
  const derived = useBuilderDerivedData(data, store, ui);
  const actions = useBuilderActions(data, store, ui, derived);
  const session = useMemo(
    () => ({
      run: store.run,
      hydrated: store.hydrated,
      builderStarted: store.builderStarted,
      starter: store.starter,
      evolutionConstraints: store.evolutionConstraints,
      recommendationFilters: store.recommendationFilters,
      battleWeather: store.battleWeather,
      milestoneId: store.milestoneId,
      completedEncounterIds: store.completedEncounterIds,
      mode: store.run.progress.mode,
      actions: {
        toggleEncounterCompleted: store.toggleEncounterCompleted,
        setEvolutionConstraint: store.setEvolutionConstraint,
        setRecommendationFilter: store.setRecommendationFilter,
        setBattleWeather: store.setBattleWeather,
      },
    }),
    [
      store.run,
      store.hydrated,
      store.builderStarted,
      store.starter,
      store.evolutionConstraints,
      store.recommendationFilters,
      store.battleWeather,
      store.milestoneId,
      store.completedEncounterIds,
      store.toggleEncounterCompleted,
      store.setEvolutionConstraint,
      store.setRecommendationFilter,
      store.setBattleWeather,
    ],
  );
  const catalogs = useMemo(
    () => ({
      docs,
      moveHighlights,
      speciesOptions,
      speciesCatalog,
      pokemonIndex,
      abilityCatalog,
      itemCatalog,
      encounterCatalog: getRunEncounterCatalog(store.run.progress.mode),
    }),
    [
      docs,
      moveHighlights,
      speciesOptions,
      speciesCatalog,
      pokemonIndex,
      abilityCatalog,
      itemCatalog,
      store.run.progress.mode,
    ],
  );
  const onboarding = useMemo(
    () => ({
      selection: ui.onboardingSelection,
      modalStarter: ui.onboardingModalStarter,
      nickname: ui.onboardingNickname,
      starters,
      actions: {
        openStarterConfirm: actions.openStarterConfirm,
        cancelStarterConfirm: actions.cancelStarterConfirm,
        confirmStarterSelection: actions.confirmStarterSelection,
        setNickname: ui.setOnboardingNickname,
      },
    }),
    [
      ui.onboardingSelection,
      ui.onboardingModalStarter,
      ui.onboardingNickname,
      actions.openStarterConfirm,
      actions.cancelStarterConfirm,
      actions.confirmStarterSelection,
      ui.setOnboardingNickname,
    ],
  );
  const team = useMemo(
    () => ({
      pokemonLibrary: store.pokemonLibrary,
      compositions: store.compositions,
      activeCompositionId: store.activeCompositionId,
      pcBoxIds: store.pcBoxIds,
      currentTeam: store.currentTeam,
      activeMemberId: store.activeMemberId,
      editorMemberId: store.editorMemberId,
      editorMoveSelection: ui.editorMoveSelection,
      editorMember: derived.editorMember,
      editorResolved: derived.editorResolved,
      editorEvolutionEligibility: derived.editorEvolutionEligibility,
      localTime: derived.localTime,
      activeMember: derived.activeMember,
      resolvedTeam: derived.resolvedTeam,
      evolvingIds: ui.evolvingIds,
      sensors: ui.sensors,
      actions: {
        setMilestoneId: store.setMilestoneId,
        updateMember: store.updateMember,
        createComposition: store.createComposition,
        renameComposition: store.renameComposition,
        setActiveCompositionId: store.setActiveCompositionId,
        addLibraryMemberToComposition: store.addLibraryMemberToComposition,
        saveMemberToPc: store.saveMemberToPc,
        moveMemberToPc: store.moveMemberToPc,
        restoreMemberFromPc: store.restoreMemberFromPc,
        resetRun: store.resetRun,
        returnToOnboarding: actions.returnToOnboarding,
        handleDragEnd: actions.handleDragEnd,
        selectMember: actions.selectMember,
        clearSelection: actions.clearSelection,
        editMember: actions.editMember,
        removeMember: actions.removeMember,
        addMember: actions.addMember,
        addPreparedMember: actions.addPreparedMember,
        closeEditor: actions.closeEditor,
        setEditorMoveSelection: ui.setEditorMoveSelection,
        openMovePickerForEditor: actions.openMovePickerForEditor,
        openMovePickerForMember: actions.openMovePickerForMember,
        removeMoveFromEditor: actions.removeMoveFromEditor,
        removeMoveFromEditorAt: actions.removeMoveFromEditorAt,
        removeMoveAtForMember: actions.removeMoveAtForMember,
        reorderMovesForEditor: actions.reorderMovesForEditor,
        reorderMovesForMember: actions.reorderMovesForMember,
        requestEvolution: actions.requestEvolution,
        requestEvolutionForMember: actions.requestEvolutionForMember,
      },
    }),
    [
      store.currentTeam,
      store.pokemonLibrary,
      store.compositions,
      store.activeCompositionId,
      store.pcBoxIds,
      store.activeMemberId,
      store.editorMemberId,
      ui.editorMoveSelection,
      derived.editorMember,
      derived.editorResolved,
      derived.editorEvolutionEligibility,
      derived.localTime,
      derived.activeMember,
      derived.resolvedTeam,
      ui.evolvingIds,
      ui.sensors,
      store.setMilestoneId,
      store.updateMember,
      store.createComposition,
      store.renameComposition,
      store.setActiveCompositionId,
      store.addLibraryMemberToComposition,
      store.saveMemberToPc,
      store.moveMemberToPc,
      store.restoreMemberFromPc,
      store.resetRun,
      actions.returnToOnboarding,
      actions.handleDragEnd,
      actions.selectMember,
      actions.clearSelection,
      actions.editMember,
      actions.removeMember,
      actions.addMember,
      actions.addPreparedMember,
      actions.closeEditor,
      ui.setEditorMoveSelection,
      actions.openMovePickerForEditor,
      actions.openMovePickerForMember,
      actions.removeMoveFromEditor,
      actions.removeMoveFromEditorAt,
      actions.removeMoveAtForMember,
      actions.reorderMovesForEditor,
      actions.reorderMovesForMember,
      actions.requestEvolution,
      actions.requestEvolutionForMember,
    ],
  );
  const analysis = useMemo(
    () => ({
      averageStats: derived.averageStats,
      checkpointRisk: derived.checkpointRisk,
      copilotSupportsRecommendations: derived.copilotSupportsRecommendations,
      supportsContextualSwaps: derived.supportsContextualSwaps,
      contextualMilestoneId: derived.contextualMilestoneId,
      nextEncounter: derived.nextEncounter,
      speedTiers: derived.speedTiers,
      coveredCoverage: derived.coveredCoverage,
      uncoveredCoverage: derived.uncoveredCoverage,
      defensiveSections: derived.defensiveSections,
      recommendation: derived.recommendation,
      threats: derived.threats,
      sourceCards: derived.sourceCards,
      moveRecommendations: derived.moveRecommendations,
      swapOpportunities: derived.swapOpportunities,
      captureRecommendations: derived.captureRecommendations,
    }),
    [derived],
  );
  const compare = useMemo(
    () => ({
      members: ui.compareMembers,
      resolvedMembers: derived.resolvedCompareMembers,
      actions: {
        updateMember: actions.updateCompareMember,
      },
    }),
    [ui.compareMembers, derived.resolvedCompareMembers, actions.updateCompareMember],
  );
  const movePicker = useMemo(
    () => ({
      memberId: ui.movePickerState?.memberId ?? null,
      slotIndex: ui.movePickerState?.slotIndex ?? null,
      tab: ui.moveModalTab,
      expandedMoveKey: ui.expandedMoveKey,
      activeMember: derived.activeModalMember,
      getSurfaceStyle: getSingleTypeSurface,
      actions: {
        open: actions.openMovePickerForMember,
        setTab: ui.setMoveModalTab,
        toggleExpanded: ui.setExpandedMoveKey,
        close: actions.closeMovePicker,
        pickMove: actions.pickMove,
      },
    }),
    [
      ui.movePickerState?.memberId,
      ui.movePickerState?.slotIndex,
      ui.moveModalTab,
      ui.expandedMoveKey,
      derived.activeModalMember,
      actions.openMovePickerForMember,
      ui.setMoveModalTab,
      ui.setExpandedMoveKey,
      actions.closeMovePicker,
      actions.pickMove,
    ],
  );
  const evolution = useMemo(
    () => ({
      state: ui.evolutionState,
      actions: {
        select: actions.selectEvolution,
        close: actions.cancelEvolution,
        confirm: actions.confirmEvolution,
      },
    }),
    [ui.evolutionState, actions.selectEvolution, actions.cancelEvolution, actions.confirmEvolution],
  );

  return {
    session,
    catalogs,
    onboarding,
    team,
    analysis,
    compare,
    movePicker,
    evolution,
  };
}

export type BuilderController = ReturnType<typeof useBuilderController>;
