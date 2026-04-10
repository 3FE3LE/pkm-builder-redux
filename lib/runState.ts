"use client";

import type { StarterKey, SuggestionInput } from "@/lib/builder";
import type { BattleWeather } from "@/lib/domain/battle";
import type { StatSpread } from "@/lib/teamAnalysis";
import type { RunMode } from "@/lib/runEncounters";
import { createId } from "@/lib/createId";

type RunEditableMember = SuggestionInput & {
  id: string;
  nickname: string;
  locked: boolean;
  ivs: StatSpread;
  evs: StatSpread;
};

export type RunCompositionState = {
  id: string;
  name: string;
  memberIds: string[];
};

export type RunFlagState = Record<string, boolean>;
export type EvolutionConstraintKey = "level" | "gender" | "timeOfDay";
export type EvolutionConstraintState = Record<EvolutionConstraintKey, boolean>;
export type RecommendationFilterKey =
  | "excludeLegendaries"
  | "excludePseudoLegendaries"
  | "excludeUniquePokemon"
  | "excludeOtherStarters"
  | "excludeExactTypeDuplicates"
  | "preferReduxUpgrades";
export type RecommendationFilterState = Record<RecommendationFilterKey, boolean>;
export type BuilderTheme = "dark" | "light" | "auto";

export type ClaimedSourceBuckets = {
  encounters: string[];
  gifts: string[];
  trades: string[];
  items: string[];
};

export type RunProgressState = {
  mode: RunMode;
  milestoneId: string;
  completedEncounterIds: string[];
  completedMilestoneIds: string[];
  claimedSources: ClaimedSourceBuckets;
  achievements: string[];
  flags: RunFlagState;
};

export type RunRosterState = {
  pokemonLibrary: RunEditableMember[];
  compositions: RunCompositionState[];
  activeCompositionId: string | null;
  pcBoxIds: string[];
  currentTeam: RunEditableMember[];
  activeMemberId: string | null;
  editorMemberId: string | null;
};

export type RunState = {
  started: boolean;
  starter: StarterKey;
  preferences: {
    evolutionConstraints: EvolutionConstraintState;
    recommendationFilters: RecommendationFilterState;
    battleWeather: BattleWeather;
    theme: BuilderTheme;
  };
  roster: RunRosterState;
  progress: RunProgressState;
};

export const DEFAULT_MILESTONE_ID = "floccesy";

export function createEmptyRunState(): RunState {
  const defaultComposition = createDefaultComposition();

  return {
    started: false,
    starter: "snivy",
    preferences: {
      evolutionConstraints: {
        level: true,
        gender: true,
        timeOfDay: true,
      },
      recommendationFilters: {
        excludeLegendaries: false,
        excludePseudoLegendaries: false,
        excludeUniquePokemon: false,
        excludeOtherStarters: false,
        excludeExactTypeDuplicates: false,
        preferReduxUpgrades: false,
      },
      battleWeather: "clear",
      theme: "dark",
    },
    roster: {
      pokemonLibrary: [],
      compositions: [defaultComposition],
      activeCompositionId: defaultComposition.id,
      pcBoxIds: [],
      currentTeam: [],
      activeMemberId: null,
      editorMemberId: null,
    },
    progress: {
      mode: "challenge",
      milestoneId: DEFAULT_MILESTONE_ID,
      completedEncounterIds: [],
      completedMilestoneIds: [],
      claimedSources: {
        encounters: [],
        gifts: [],
        trades: [],
        items: [],
      },
      achievements: [],
      flags: {},
    },
  };
}

export function createStartedRunState(
  starter: StarterKey,
  lead: RunEditableMember,
): RunState {
  const defaultComposition = createDefaultComposition([lead.id]);

  return {
    started: true,
    starter,
    preferences: {
      evolutionConstraints: {
        level: true,
        gender: true,
        timeOfDay: true,
      },
      recommendationFilters: {
        excludeLegendaries: false,
        excludePseudoLegendaries: false,
        excludeUniquePokemon: false,
        excludeOtherStarters: false,
        excludeExactTypeDuplicates: false,
        preferReduxUpgrades: false,
      },
      battleWeather: "clear",
      theme: "dark",
    },
    roster: {
      pokemonLibrary: [lead],
      compositions: [defaultComposition],
      activeCompositionId: defaultComposition.id,
      pcBoxIds: [],
      currentTeam: [lead],
      activeMemberId: lead.id,
      editorMemberId: lead.id,
    },
    progress: {
      mode: "challenge",
      milestoneId: DEFAULT_MILESTONE_ID,
      completedEncounterIds: [],
      completedMilestoneIds: [],
      claimedSources: {
        encounters: [],
        gifts: [],
        trades: [],
        items: [],
      },
      achievements: [],
      flags: {},
    },
  };
}

function createDefaultComposition(memberIds: string[] = []): RunCompositionState {
  return {
    id: createId(),
    name: "Main Team",
    memberIds,
  };
}
