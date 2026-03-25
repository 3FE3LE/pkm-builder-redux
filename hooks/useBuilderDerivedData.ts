"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  buildAverageStats,
  buildCoverageSummary,
  buildDefensiveSections,
  buildThreatSummary,
} from "@/lib/domain/battle";
import { buildCheckpointRiskSnapshot } from "@/lib/domain/checkpointScoring";
import { buildCaptureRecommendations } from "@/lib/domain/contextualRecommendations";
import { getMoveRecommendations } from "@/lib/domain/moveRecommendations";
import { buildSwapOpportunities } from "@/lib/domain/swapOpportunities";
import { buildSpeedTierSnapshot } from "@/lib/domain/speedTiers";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import {
  getContextualSourceAreas,
  getNextRelevantEncounter,
  getRunEncounterCatalog,
  mapEncounterOrderToMilestoneId,
} from "@/lib/runEncounters";
import { milestones } from "@/lib/builder";
import {
  type ResolvedTeamMember,
} from "@/lib/teamAnalysis";
import { buildAreaSources, getRecommendation } from "@/lib/builder";
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
  const workspaceTab = searchParams.get("tab") ?? "builder";
  const toolTab = searchParams.get("tool") ?? "compare";
  const isWorkspaceRoute = pathname === "/team" || pathname.startsWith("/team/pokemon/");
  const needsTeamCore = isWorkspaceRoute;
  const needsCopilotAnalysis = pathname === "/team" && workspaceTab === "copilot";
  const needsCaptureRecommendations = pathname === "/team";
  const needsCompareResolution = pathname === "/team/tools" && toolTab === "compare";
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

  const emptyRecommendation = useMemo(
    () => ({
      notes: [
        nextEncounter
          ? `Tu run ya va por ${nextEncounter.label}. Las sugerencias curadas tempranas se desactivan para no mentirte.`
          : "No hay un checkpoint soportado para capturas curadas en este punto del run.",
      ],
      availableSources: [],
    }),
    [nextEncounter],
  );

  const recommendation = useMemo(
    () =>
      needsCopilotAnalysis && copilotSupportsRecommendations
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
        : emptyRecommendation,
    [
      contextualMilestoneId,
      copilotSupportsRecommendations,
      docs,
      emptyRecommendation,
      needsCopilotAnalysis,
      nextEncounter,
      store.currentTeam,
      store.recommendationFilters,
      store.starter,
    ],
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

  const threats = useMemo(
    () =>
      needsTeamCore
        ? buildThreatSummary(resolvedTeam.filter((member) => member.species))
            .filter((entry) => entry.weak > 0)
            .slice(0, 6)
        : [],
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

  const speedTiers = useMemo(
    () =>
      buildSpeedTierSnapshot({
        checkpointId: contextualMilestoneId,
        targetEncounterId: nextEncounter?.id,
        team: needsCopilotAnalysis ? resolvedTeam : [],
        pokemonIndex,
        encounters: encounterCatalog,
      }),
    [
      contextualMilestoneId,
      encounterCatalog,
      needsCopilotAnalysis,
      nextEncounter?.id,
      pokemonIndex,
      resolvedTeam,
    ],
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

  const sourceCards = useMemo(() => {
    if (!needsCopilotAnalysis) {
      return [];
    }

    const contextualAreas = getContextualSourceAreas(nextEncounter?.order ?? 1);
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
  }, [docs, needsCopilotAnalysis, nextEncounter?.order, store.recommendationFilters, store.starter]);

  const activeMovePickerMemberId = ui.movePickerState?.memberId ?? null;
  const activeModalMember = activeMovePickerMemberId
    ? resolvedTeam.find((member) => member.key === activeMovePickerMemberId)
    : undefined;

  const activeMember = store.activeMemberId
    ? resolvedTeam.find((member) => member.key === store.activeMemberId)
    : undefined;

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
      needsCopilotAnalysis
        ? buildSwapOpportunities({
            docs,
            team: resolvedTeam,
            nextEncounter,
            pokemonByName: pokemonIndex,
            moveIndex,
            starter: store.starter,
            filters: store.recommendationFilters,
          })
        : [],
    [
      docs,
      moveIndex,
      needsCopilotAnalysis,
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
      nextEncounter,
      pokemonIndex,
      resolvedTeam,
      store.recommendationFilters,
      store.starter,
    ],
  );

  return {
    resolverContext,
    resolvedTeam,
    resolvedCompareMembers,
    recommendation,
    contextualMilestoneId,
    copilotSupportsRecommendations,
    supportsContextualSwaps,
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
    captureRecommendations,
  };
}
