import type { StarterKey } from "@/lib/builder";
import {
  createEmptyRunState,
  type RunFlagState,
  type RunState,
} from "@/lib/runState";
import type { EditableMember } from "@/lib/builderStore/types";
import {
  createFallbackComposition,
  ensureRosterState,
  normalizeEditableMember,
} from "@/lib/builderStore/roster";

type LegacyBuilderState =
  | {
      run?: RunState;
      builderStarted?: boolean;
      starter?: StarterKey;
      milestoneId?: string;
      currentTeam?: EditableMember[];
      activeMemberId?: string | null;
      editorMemberId?: string | null;
      hackEvents?: RunFlagState;
    }
  | undefined;

export function migrateBuilderState(persistedState: unknown) {
  const legacyState = persistedState as LegacyBuilderState;

  if (!legacyState) {
    return { hydrated: false, run: createEmptyRunState() };
  }

  if (legacyState.run) {
    return {
      ...legacyState,
      run: ensureRosterState({
        ...createEmptyRunState(),
        ...legacyState.run,
        preferences: {
          ...createEmptyRunState().preferences,
          ...legacyState.run.preferences,
          evolutionConstraints: {
            ...createEmptyRunState().preferences.evolutionConstraints,
            ...legacyState.run.preferences?.evolutionConstraints,
          },
          recommendationFilters: {
            ...createEmptyRunState().preferences.recommendationFilters,
            ...legacyState.run.preferences?.recommendationFilters,
            excludeUniquePokemon:
              legacyState.run.preferences?.recommendationFilters?.excludeUniquePokemon ??
              (legacyState.run.preferences?.recommendationFilters as Record<string, boolean> | undefined)
                ?.excludeUniqueEncounters ??
              createEmptyRunState().preferences.recommendationFilters.excludeUniquePokemon,
          },
          battleWeather:
            legacyState.run.preferences?.battleWeather ??
            createEmptyRunState().preferences.battleWeather,
          theme:
            legacyState.run.preferences?.theme ??
            createEmptyRunState().preferences.theme,
        },
        progress: {
          ...createEmptyRunState().progress,
          ...legacyState.run.progress,
          claimedSources: {
            ...createEmptyRunState().progress.claimedSources,
            ...legacyState.run.progress.claimedSources,
          },
          completedEncounterIds:
            legacyState.run.progress.completedEncounterIds ?? [],
          flags: legacyState.run.progress.flags ?? {},
        },
      }),
    };
  }

  const normalizedCurrentTeam = (legacyState.currentTeam ?? []).map(normalizeEditableMember);
  const defaultComposition = createFallbackComposition(
    normalizedCurrentTeam.map((member) => member.id),
  );

  return {
    hydrated: false,
    run: ensureRosterState({
      started: legacyState.builderStarted ?? false,
      starter: legacyState.starter ?? "snivy",
      preferences: createEmptyRunState().preferences,
      roster: {
        pokemonLibrary: normalizedCurrentTeam,
        compositions: [defaultComposition],
        activeCompositionId: defaultComposition.id,
        pcBoxIds: [],
        currentTeam: normalizedCurrentTeam,
        activeMemberId: legacyState.activeMemberId ?? null,
        editorMemberId: legacyState.editorMemberId ?? null,
      },
      progress: {
        mode: "challenge",
        milestoneId: legacyState.milestoneId ?? createEmptyRunState().progress.milestoneId,
        completedEncounterIds: [],
        completedMilestoneIds: [],
        claimedSources: {
          encounters: [],
          gifts: [],
          trades: [],
          items: [],
        },
        achievements: [],
        flags: legacyState.hackEvents ?? {},
      },
    }),
  };
}
