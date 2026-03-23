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
  const battleWeather = useBuilderStore((state) => state.run.preferences.battleWeather);
  const milestoneId = useBuilderStore((state) => state.run.progress.milestoneId);
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
  const setActiveMemberId = useBuilderStore((state) => state.setActiveMemberId);
  const setEditorMemberId = useBuilderStore((state) => state.setEditorMemberId);
  const setEvolutionConstraint = useBuilderStore((state) => state.setEvolutionConstraint);
  const setRecommendationFilter = useBuilderStore((state) => state.setRecommendationFilter);
  const setBattleWeather = useBuilderStore((state) => state.setBattleWeather);
  const toggleEncounterCompleted = useBuilderStore((state) => state.toggleEncounterCompleted);
  const resetRun = useBuilderStore((state) => state.resetRun);

  return {
    hydrated,
    run,
    builderStarted,
    starter,
    evolutionConstraints,
    recommendationFilters,
    battleWeather,
    milestoneId,
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
    setActiveMemberId,
    setEditorMemberId,
    setEvolutionConstraint,
    setRecommendationFilter,
    setBattleWeather,
    toggleEncounterCompleted,
    resetRun,
  };
}
