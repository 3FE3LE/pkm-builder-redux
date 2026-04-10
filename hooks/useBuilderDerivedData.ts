"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  buildAverageStats,
  buildCoverageSummary,
  buildDefensiveSections,
} from "@/lib/domain/battle";
import { getBuilderViewState } from "@/lib/domain/builderViewState";
import { buildCheckpointRiskSnapshot } from "@/lib/domain/checkpointScoring";
import { buildCaptureRecommendations } from "@/lib/domain/contextualRecommendations";
import { getMoveRecommendations } from "@/lib/domain/moveRecommendations";
import { buildSwapOpportunities } from "@/lib/domain/swapOpportunities";
import { enrichCaptureRecommendations } from "@/lib/domain/scoring/enrichRecommendations";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import {
  getFurthestMilestoneId,
  getContextualSourceAreasForMilestone,
  getNextRelevantEncounter,
  getRunEncounterCatalog,
  mapEncounterOrderToMilestoneId,
} from "@/lib/runEncounters";
import {
  type ResolvedTeamMember,
} from "@/lib/teamAnalysis";
import { buildAreaSources } from "@/lib/builder";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceTab = searchParams.get("tab");
  const toolTab = searchParams.get("tool");
  const {
    needsTeamCore,
    needsCopilotAnalysis,
    needsCaptureRecommendations,
    needsCompareResolution,
  } = getBuilderViewState(pathname, workspaceTab, toolTab);
  const encounterCatalog = useMemo(
    () => getRunEncounterCatalog(store.run.progress.mode),
    [store.run.progress.mode],
  );
  const nextEncounter = useMemo(
    () => getNextRelevantEncounter(encounterCatalog, store.completedEncounterIds),
    [encounterCatalog, store.completedEncounterIds],
  );
  const contextualMilestoneId = getFurthestMilestoneId(
    store.milestoneId,
    nextEncounter ? mapEncounterOrderToMilestoneId(nextEncounter.order) : null,
  );
  const supportsContextualSwaps = Boolean(nextEncounter);

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
      needsCompareResolution
        ? (ui.compareMembers.map((member) =>
            resolveTeamMember(member, resolverContext),
          ) as [ResolvedTeamMember | undefined, ResolvedTeamMember | undefined])
        : ([undefined, undefined] as [ResolvedTeamMember | undefined, ResolvedTeamMember | undefined]),
    [needsCompareResolution, resolverContext, ui.compareMembers],
  );

  const coverage = useMemo(
    () =>
      needsTeamCore
        ? buildCoverageSummary(resolvedTeam.filter((member) => member.species))
        : [],
    [needsTeamCore, resolvedTeam],
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
    () =>
      needsTeamCore
        ? buildDefensiveSections(resolvedTeam.filter((member) => member.species))
        : buildDefensiveSections([]),
    [needsTeamCore, resolvedTeam],
  );

  const averageStats = useMemo(
    () =>
      needsTeamCore ? buildAverageStats(resolvedTeam.filter((member) => member.species)) : null,
    [needsTeamCore, resolvedTeam],
  );

  const checkpointRisk = useMemo(
    () =>
      needsTeamCore
        ? buildCheckpointRiskSnapshot({
            team: resolvedTeam,
            checkpointId: contextualMilestoneId,
          })
        : buildCheckpointRiskSnapshot({
            team: [],
            checkpointId: contextualMilestoneId,
          }),
    [contextualMilestoneId, needsTeamCore, resolvedTeam],
  );

  const editorMember = store.editorMemberId
    ? store.pokemonLibrary.find((member) => member.id === store.editorMemberId)
    : undefined;

  const editorResolved = useMemo(() => {
    if (!editorMember) {
      return undefined;
    }

    return {
      ...resolveTeamMember(editorMember, resolverContext),
      locked: editorMember.locked,
    };
  }, [editorMember, resolverContext]);

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

  const sourceCards = useMemo(() => {
    if (!needsCopilotAnalysis) {
      return [];
    }

    const contextualAreas = getContextualSourceAreasForMilestone(contextualMilestoneId);
    return buildAreaSources(
      docs,
      contextualAreas,
      store.starter,
      store.recommendationFilters,
      {
        team: resolvedTeam,
        pokemonByName: pokemonIndex,
      },
    ).filter(
      (source) =>
        source.encounters.length ||
        source.gifts.length ||
        source.trades.length ||
        source.items.length,
    );
  }, [
    contextualMilestoneId,
    docs,
    needsCopilotAnalysis,
    pokemonIndex,
    resolvedTeam,
    store.recommendationFilters,
    store.starter,
  ]);

  const activeMovePickerMemberId = ui.movePickerState?.memberId ?? null;
  const activeMovePickerMember = activeMovePickerMemberId
    ? store.pokemonLibrary.find((member) => member.id === activeMovePickerMemberId)
    : undefined;
  const activeModalMember = useMemo(() => {
    if (!activeMovePickerMember) {
      return undefined;
    }

    return {
      ...resolveTeamMember(activeMovePickerMember, resolverContext),
      locked: activeMovePickerMember.locked,
    };
  }, [activeMovePickerMember, resolverContext]);

  const activeMember = store.activeMemberId
    ? resolvedTeam.find((member) => member.key === store.activeMemberId)
    : undefined;

  const moveRecommendations = useMemo(
    () =>
      needsTeamCore
        ? getMoveRecommendations({
            member: activeMember,
            weather: store.battleWeather,
            maxLevelDelta: 5,
            uncoveredTypes: coverage
              .filter((entry) => entry.multiplier <= 1)
              .map((entry) => entry.defenseType),
          })
        : [],
    [activeMember, coverage, needsTeamCore, store.battleWeather],
  );

  const swapOpportunities = useMemo(
    () =>
      needsCopilotAnalysis
        ? buildSwapOpportunities({
            docs,
            team: resolvedTeam,
            nextEncounter,
            milestoneId: contextualMilestoneId,
            pokemonByName: pokemonIndex,
            moveIndex,
            reduxBySpecies: data.reduxBySpecies,
            starter: store.starter,
            filters: store.recommendationFilters,
          })
        : [],
    [
      docs,
      moveIndex,
      needsCopilotAnalysis,
      contextualMilestoneId,
      nextEncounter,
      pokemonIndex,
      resolvedTeam,
      store.recommendationFilters,
      store.starter,
    ],
  );
  const captureRecommendations = useMemo(
    () =>
      needsCaptureRecommendations
        ? buildCaptureRecommendations({
            docs,
            team: resolvedTeam,
            nextEncounter,
            milestoneId: contextualMilestoneId,
            pokemonByName: pokemonIndex,
            moveIndex,
            starter: store.starter,
            filters: store.recommendationFilters,
          })
        : [],
    [
      docs,
      moveIndex,
      needsCaptureRecommendations,
      contextualMilestoneId,
      nextEncounter,
      pokemonIndex,
      resolvedTeam,
      store.recommendationFilters,
      store.starter,
    ],
  );

  const enrichedCaptureRecommendations = useMemo(
    () =>
      enrichCaptureRecommendations({
        recommendations: captureRecommendations,
        team: resolvedTeam,
        nextEncounter,
        milestoneId: contextualMilestoneId,
        pokemonByName: pokemonIndex,
        filters: {
          preferReduxUpgrades: store.recommendationFilters.preferReduxUpgrades,
          excludeExactTypeDuplicates: store.recommendationFilters.excludeExactTypeDuplicates,
          excludeLegendaries: store.recommendationFilters.excludeLegendaries,
          excludePseudoLegendaries: store.recommendationFilters.excludePseudoLegendaries,
        },
      }),
    [captureRecommendations, contextualMilestoneId, nextEncounter, pokemonIndex, resolvedTeam, store.recommendationFilters],
  );

  return {
    resolverContext,
    resolvedTeam,
    resolvedCompareMembers,
    contextualMilestoneId,
    supportsContextualSwaps,
    nextEncounter,
    coveredCoverage,
    uncoveredCoverage,
    defensiveSections,
    averageStats,
    checkpointRisk,
    editorMember,
    editorResolved,
    editorEvolutionEligibility,
    localTime: ui.localTime,
    sourceCards,
    activeModalMember,
    activeMember,
    moveRecommendations,
    swapOpportunities,
    captureRecommendations: enrichedCaptureRecommendations,
  };
}
