"use client";

import { useBuilderStore } from "@/lib/builderStore";

export function useBuilderStoreState() {
  const hydrated = useBuilderStore((state) => state.hydrated);
  const run = useBuilderStore((state) => state.run);
  const builderStarted = useBuilderStore((state) => state.run.started);
  const starter = useBuilderStore((state) => state.run.starter);
  const evolutionConstraints = useBuilderStore(
    (state) => state.run.preferences.evolutionConstraints,
  );
  const recommendationFilters = useBuilderStore(
    (state) => state.run.preferences.recommendationFilters,
  );
  const userPreferences = useBuilderStore((state) => state.run.preferences.userPreferences);
  const battleWeather = useBuilderStore((state) => state.run.preferences.battleWeather);
  const theme = useBuilderStore((state) => state.run.preferences.theme);
  const milestoneId = useBuilderStore((state) => state.run.progress.milestoneId);
  const pokemonLibrary = useBuilderStore((state) => state.run.roster.pokemonLibrary);
  const compositions = useBuilderStore((state) => state.run.roster.compositions);
  const activeCompositionId = useBuilderStore(
    (state) => state.run.roster.activeCompositionId,
  );
  const pcBoxIds = useBuilderStore((state) => state.run.roster.pcBoxIds);
  const currentTeam = useBuilderStore((state) => state.run.roster.currentTeam);
  const activeMemberId = useBuilderStore((state) => state.run.roster.activeMemberId);
  const editorMemberId = useBuilderStore((state) => state.run.roster.editorMemberId);
  const completedEncounterIds = useBuilderStore(
    (state) => state.run.progress.completedEncounterIds,
  );
  const hackEvents = useBuilderStore((state) => state.run.progress.flags);
  const setBuilderStarted = useBuilderStore((state) => state.setBuilderStarted);
  const beginRun = useBuilderStore((state) => state.beginRun);
  const setMilestoneId = useBuilderStore((state) => state.setMilestoneId);
  const setCurrentTeam = useBuilderStore((state) => state.setCurrentTeam);
  const updateMember = useBuilderStore((state) => state.updateMember);
  const createComposition = useBuilderStore((state) => state.createComposition);
  const renameComposition = useBuilderStore((state) => state.renameComposition);
  const setActiveCompositionId = useBuilderStore((state) => state.setActiveCompositionId);
  const addLibraryMemberToComposition = useBuilderStore(
    (state) => state.addLibraryMemberToComposition,
  );
  const saveMemberToPc = useBuilderStore((state) => state.saveMemberToPc);
  const moveMemberToPc = useBuilderStore((state) => state.moveMemberToPc);
  const releaseMember = useBuilderStore((state) => state.releaseMember);
  const restoreMemberFromPc = useBuilderStore((state) => state.restoreMemberFromPc);
  const setActiveMemberId = useBuilderStore((state) => state.setActiveMemberId);
  const setEditorMemberId = useBuilderStore((state) => state.setEditorMemberId);
  const setEvolutionConstraint = useBuilderStore((state) => state.setEvolutionConstraint);
  const setRecommendationFilter = useBuilderStore((state) => state.setRecommendationFilter);
  const setRecommendationPlaystyle = useBuilderStore((state) => state.setRecommendationPlaystyle);
  const toggleFavoriteType = useBuilderStore((state) => state.toggleFavoriteType);
  const toggleAvoidedType = useBuilderStore((state) => state.toggleAvoidedType);
  const togglePreferredRole = useBuilderStore((state) => state.togglePreferredRole);
  const setBattleWeather = useBuilderStore((state) => state.setBattleWeather);
  const setTheme = useBuilderStore((state) => state.setTheme);
  const toggleEncounterCompleted = useBuilderStore((state) => state.toggleEncounterCompleted);
  const resetRun = useBuilderStore((state) => state.resetRun);

  return {
    hydrated,
    run,
    builderStarted,
    starter,
    evolutionConstraints,
    recommendationFilters,
    userPreferences,
    battleWeather,
    theme,
    milestoneId,
    pokemonLibrary,
    compositions,
    activeCompositionId,
    pcBoxIds,
    currentTeam,
    activeMemberId,
    editorMemberId,
    completedEncounterIds,
    hackEvents,
    setBuilderStarted,
    beginRun,
    setMilestoneId,
    setCurrentTeam,
    updateMember,
    createComposition,
    renameComposition,
    setActiveCompositionId,
    addLibraryMemberToComposition,
    saveMemberToPc,
    moveMemberToPc,
    releaseMember,
    restoreMemberFromPc,
    setActiveMemberId,
    setEditorMemberId,
    setEvolutionConstraint,
    setRecommendationFilter,
    setRecommendationPlaystyle,
    toggleFavoriteType,
    toggleAvoidedType,
    togglePreferredRole,
    setBattleWeather,
    setTheme,
    toggleEncounterCompleted,
    resetRun,
  };
}
