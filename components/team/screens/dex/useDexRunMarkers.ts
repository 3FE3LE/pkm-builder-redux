"use client";

import { useMemo } from "react";

import { useTeamCatalogs } from "@/components/BuilderProvider";
import { useBuilderStoreState } from "@/hooks/useBuilderStoreState";
import {
  buildNameIndex,
  resolveEditableMember,
  type BuilderResolverContext,
} from "@/lib/builderResolver";
import { normalizeName } from "@/lib/domain/names";
import { buildCaptureRecommendations } from "@/lib/domain/contextualRecommendations";
import {
  getFurthestMilestoneId,
  getNextRelevantEncounter,
  getRunEncounterCatalog,
  mapEncounterOrderToMilestoneId,
} from "@/lib/runEncounters";

export function useDexRunMarkers() {
  const data = useTeamCatalogs();
  const store = useBuilderStoreState();

  const encounterCatalog = useMemo(
    () => getRunEncounterCatalog(store.run.progress.mode),
    [store.run.progress.mode],
  );
  const nextEncounter = useMemo(
    () => getNextRelevantEncounter(encounterCatalog, store.completedEncounterIds),
    [encounterCatalog, store.completedEncounterIds],
  );
  const contextualMilestoneId = useMemo(
    () =>
      getFurthestMilestoneId(
        store.milestoneId,
        nextEncounter ? mapEncounterOrderToMilestoneId(nextEncounter.order) : null,
      ),
    [store.milestoneId, nextEncounter],
  );
  const resolverContext = useMemo<BuilderResolverContext>(
    () => ({
      docs: data.docs,
      pokemonByName: data.pokemonIndex,
      abilitiesByName: buildNameIndex(data.abilityCatalog),
      itemsByName: buildNameIndex(data.itemCatalog),
      movesByName: data.moveIndex,
      weather: store.battleWeather,
    }),
    [
      data.abilityCatalog,
      data.docs,
      data.itemCatalog,
      data.moveIndex,
      data.pokemonIndex,
      store.battleWeather,
    ],
  );
  const resolvedTeam = useMemo(
    () =>
      !store.hydrated
        ? []
        : store.currentTeam.map((member) => ({
            ...resolveEditableMember(member, resolverContext),
            locked: member.locked,
          })),
    [resolverContext, store.currentTeam, store.hydrated],
  );
  const captureRecommendations = useMemo(
    () =>
      !store.hydrated || !store.run.started || !store.currentTeam.some((member) => member.species.trim())
        ? []
        : buildCaptureRecommendations({
            docs: data.docs,
            team: resolvedTeam,
            nextEncounter,
            milestoneId: contextualMilestoneId,
            pokemonByName: data.pokemonIndex,
            moveIndex: data.moveIndex,
            reduxBySpecies: data.reduxBySpecies,
            starter: store.starter,
            filters: store.recommendationFilters,
          }),
    [
      contextualMilestoneId,
      data.docs,
      data.moveIndex,
      data.pokemonIndex,
      data.reduxBySpecies,
      nextEncounter,
      resolvedTeam,
      store.hydrated,
      store.run.started,
      store.currentTeam,
      store.recommendationFilters,
      store.starter,
    ],
  );
  const capturedSpecies = useMemo(
    () =>
      new Set(
        (store.hydrated ? store.pokemonLibrary : [])
          .map((member) => normalizeName(member.species))
          .filter(Boolean),
      ),
    [store.hydrated, store.pokemonLibrary],
  );
  const suggestedSpecies = useMemo(
    () =>
      new Set(
        captureRecommendations.map((recommendation) =>
          normalizeName(recommendation.species),
        ),
      ),
    [captureRecommendations],
  );

  return {
    capturedSpecies,
    suggestedSpecies,
  };
}
