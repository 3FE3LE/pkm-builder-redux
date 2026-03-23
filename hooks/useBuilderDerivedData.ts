"use client";

import { useMemo } from "react";

import {
  buildAverageStats,
  buildCoverageSummary,
  buildDefensiveSections,
  buildThreatSummary,
} from "@/lib/domain/battle";
import { buildCheckpointRiskSnapshot } from "@/lib/domain/checkpointScoring";
import { getMoveRecommendations } from "@/lib/domain/moveRecommendations";
import { buildSwapOpportunities } from "@/lib/domain/swapOpportunities";
import { buildSpeedTierSnapshot } from "@/lib/domain/speedTiers";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import {
  getNextRelevantEncounter,
  getRunEncounterCatalog,
  mapEncounterOrderToMilestoneId,
} from "@/lib/runEncounters";
import { milestones } from "@/lib/builder";
import {
  type ResolvedTeamMember,
} from "@/lib/teamAnalysis";
import { getRecommendation } from "@/lib/builder";
import {
  buildNameIndex,
  resolveEditableMember as resolveTeamMember,
  type BuilderResolverContext,
} from "@/lib/builderResolver";

import type { BuilderDataProps } from "@/hooks/types";
import type { useBuilderStoreState } from "@/hooks/useBuilderStoreState";
import type { useBuilderUiState } from "@/hooks/useBuilderUiState";

type StoreState = ReturnType<typeof useBuilderStoreState>;
type UiState = ReturnType<typeof useBuilderUiState>;

export function useBuilderDerivedData(
  data: BuilderDataProps,
  store: StoreState,
  ui: UiState,
) {
  const { docs, pokemonIndex, abilityCatalog, itemCatalog, moveIndex } = data;
  const encounterCatalog = useMemo(
    () => getRunEncounterCatalog(store.run.progress.mode),
    [store.run.progress.mode],
  );
  const nextEncounter = useMemo(
    () => getNextRelevantEncounter(encounterCatalog, store.completedEncounterIds),
    [encounterCatalog, store.completedEncounterIds],
  );
  const contextualMilestoneId =
    (nextEncounter ? mapEncounterOrderToMilestoneId(nextEncounter.order) : null) ?? store.milestoneId;
  const copilotSupportsRecommendations = milestones.some(
    (milestone) => milestone.id === contextualMilestoneId,
  );

  const resolverContext = useMemo<BuilderResolverContext>(
    () => ({
      docs,
      pokemonByName: pokemonIndex,
      abilitiesByName: buildNameIndex(abilityCatalog),
      itemsByName: buildNameIndex(itemCatalog),
      movesByName: moveIndex,
      weather: store.battleWeather,
    }),
    [abilityCatalog, docs, itemCatalog, moveIndex, pokemonIndex, store.battleWeather],
  );

  const resolvedTeam = useMemo(
    () =>
      store.currentTeam.map((member) => ({
        ...resolveTeamMember(member, resolverContext),
        locked: member.locked,
      })),
    [resolverContext, store.currentTeam],
  );

  const resolvedCompareMembers = useMemo(
    () =>
      ui.compareMembers.map((member) =>
        resolveTeamMember(member, resolverContext),
      ) as [ResolvedTeamMember | undefined, ResolvedTeamMember | undefined],
    [resolverContext, ui.compareMembers],
  );

  const recommendation = useMemo(
    () =>
      copilotSupportsRecommendations
        ? getRecommendation(
            docs,
            store.starter,
            contextualMilestoneId,
            store.currentTeam.map((member) => ({
              species: member.species,
              nickname: member.nickname,
              locked: member.locked,
              level: member.level,
              gender: member.gender,
              nature: member.nature,
              ability: member.ability,
              item: member.item,
              moves: member.moves,
            })),
            store.recommendationFilters,
          )
        : {
            starterSummary: "Copilot de capturas y swaps soportado hasta el tramo de Elesa.",
            recommendedTeam: [],
            notes: [
              nextEncounter
                ? `Tu run ya va por ${nextEncounter.label}. Las sugerencias curadas tempranas se desactivan para no mentirte.`
                : "No hay un checkpoint soportado para capturas curadas en este punto del run.",
            ],
            currentBuildAdvice: [],
            availableSources: [],
          },
    [
      contextualMilestoneId,
      copilotSupportsRecommendations,
      docs,
      nextEncounter,
      store.currentTeam,
      store.recommendationFilters,
      store.starter,
    ],
  );

  const coverage = useMemo(
    () => buildCoverageSummary(resolvedTeam.filter((member) => member.species)),
    [resolvedTeam],
  );

  const coveredCoverage = useMemo(
    () => coverage.filter((entry) => entry.multiplier > 1),
    [coverage],
  );

  const uncoveredCoverage = useMemo(
    () => coverage.filter((entry) => entry.multiplier <= 1),
    [coverage],
  );

  const defensiveSections = useMemo(
    () => buildDefensiveSections(resolvedTeam.filter((member) => member.species)),
    [resolvedTeam],
  );

  const threats = useMemo(
    () =>
      buildThreatSummary(resolvedTeam.filter((member) => member.species))
        .filter((entry) => entry.weak > 0)
        .slice(0, 6),
    [resolvedTeam],
  );

  const averageStats = useMemo(
    () => buildAverageStats(resolvedTeam.filter((member) => member.species)),
    [resolvedTeam],
  );

  const checkpointRisk = useMemo(
    () =>
      buildCheckpointRiskSnapshot({
        team: resolvedTeam,
        checkpointId: contextualMilestoneId,
      }),
    [contextualMilestoneId, resolvedTeam],
  );

  const speedTiers = useMemo(
    () =>
      buildSpeedTierSnapshot({
        checkpointId: contextualMilestoneId,
        targetEncounterId: nextEncounter?.id,
        team: resolvedTeam,
        pokemonIndex,
        encounters: encounterCatalog,
      }),
    [contextualMilestoneId, encounterCatalog, nextEncounter?.id, pokemonIndex, resolvedTeam],
  );

  const editorMember = store.editorMemberId
    ? store.currentTeam.find((member) => member.id === store.editorMemberId)
    : undefined;

  const editorResolved = store.editorMemberId
    ? resolvedTeam.find((member) => member.key === store.editorMemberId)
    : undefined;

  const editorEvolutionEligibility = useMemo(
    () =>
      buildEvolutionEligibility(
        editorResolved,
        resolvedTeam,
        ui.localTime,
        store.evolutionConstraints,
      ),
    [editorResolved, resolvedTeam, store.evolutionConstraints, ui.localTime],
  );

  const sourceCards = recommendation.availableSources.filter(
    (source) =>
      source.encounters.length ||
      source.gifts.length ||
      source.trades.length ||
      source.items.length,
  );

  const activeMovePickerMemberId = ui.movePickerState?.memberId ?? null;
  const activeModalMember = activeMovePickerMemberId
    ? resolvedTeam.find((member) => member.key === activeMovePickerMemberId)
    : undefined;

  const activeMember =
    resolvedTeam.find((member) => member.key === store.activeMemberId) ??
    resolvedTeam.find((member) => member.species.trim());

  const moveRecommendations = useMemo(
    () =>
      getMoveRecommendations({
        member: activeMember,
        weather: store.battleWeather,
        maxLevelDelta: 5,
        uncoveredTypes: coverage
          .filter((entry) => entry.multiplier <= 1)
          .map((entry) => entry.defenseType),
      }),
    [activeMember, coverage, store.battleWeather],
  );

  const swapOpportunities = useMemo(
    () =>
      buildSwapOpportunities({
        docs,
        team: resolvedTeam,
        checkpointId: contextualMilestoneId,
        nextEncounter,
        pokemonByName: pokemonIndex,
        moveIndex,
      }),
    [contextualMilestoneId, docs, moveIndex, nextEncounter, pokemonIndex, resolvedTeam],
  );

  return {
    resolverContext,
    resolvedTeam,
    resolvedCompareMembers,
    recommendation,
    contextualMilestoneId,
    copilotSupportsRecommendations,
    nextEncounter,
    coveredCoverage,
    uncoveredCoverage,
    defensiveSections,
    threats,
    averageStats,
    checkpointRisk,
    speedTiers,
    editorMember,
    editorResolved,
    editorEvolutionEligibility,
    localTime: ui.localTime,
    sourceCards,
    activeModalMember,
    activeMember,
    moveRecommendations,
    swapOpportunities,
  };
}
