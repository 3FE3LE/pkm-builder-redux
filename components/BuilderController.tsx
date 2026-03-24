"use client";

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

  return {
    session: {
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
    },
    catalogs: {
      docs,
      moveHighlights,
      speciesOptions,
      speciesCatalog,
      pokemonIndex,
      abilityCatalog,
      itemCatalog,
      encounterCatalog: getRunEncounterCatalog(store.run.progress.mode),
    },
    onboarding: {
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
    },
    team: {
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
    },
    analysis: {
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
    },
    compare: {
      members: ui.compareMembers,
      resolvedMembers: derived.resolvedCompareMembers,
      actions: {
        updateMember: actions.updateCompareMember,
      },
    },
    movePicker: {
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
    },
    evolution: {
      state: ui.evolutionState,
      actions: {
        select: actions.selectEvolution,
        close: actions.cancelEvolution,
        confirm: actions.confirmEvolution,
      },
    },
  };
}

export type BuilderController = ReturnType<typeof useBuilderController>;
