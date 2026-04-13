import type { StatSpread } from "@/lib/teamAnalysis";
import type { PokemonGender, StarterKey, SuggestionInput } from "@/lib/builder";
import type { BattleWeather } from "@/lib/domain/battle";
import type {
  BuilderTheme,
  EvolutionConstraintKey,
  RecommendationFilterKey,
  RecommendationPlaystyle,
  RunState,
} from "@/lib/runState";
import type { TypeName } from "@/lib/domain/effects/types";
import type { RoleKey } from "@/lib/domain/profiles/types";

export type EditableMember = SuggestionInput & {
  id: string;
  nickname: string;
  locked: boolean;
  ivs: StatSpread;
  evs: StatSpread;
};

export type BuilderStore = {
  hydrated: boolean;
  run: RunState;
  setHydrated: (hydrated: boolean) => void;
  setBuilderStarted: (builderStarted: boolean) => void;
  setStarter: (starter: StarterKey) => void;
  beginRun: (starter: StarterKey, species: string, nickname?: string) => void;
  setMilestoneId: (milestoneId: string) => void;
  setCurrentTeam: (updater: EditableMember[] | ((items: EditableMember[]) => EditableMember[])) => void;
  updateMember: (id: string, updater: EditableMember | ((member: EditableMember) => EditableMember)) => void;
  createComposition: (name?: string) => string;
  renameComposition: (compositionId: string, name: string) => void;
  setActiveCompositionId: (compositionId: string) => void;
  addLibraryMemberToComposition: (memberId: string, compositionId?: string) => boolean;
  saveMemberToPc: (member: EditableMember) => boolean;
  moveMemberToPc: (memberId: string, compositionId?: string) => boolean;
  releaseMember: (memberId: string) => boolean;
  restoreMemberFromPc: (memberId: string, compositionId?: string) => boolean;
  setActiveMemberId: (activeMemberId: string | null) => void;
  setEditorMemberId: (editorMemberId: string | null) => void;
  setEvolutionConstraint: (key: EvolutionConstraintKey, value: boolean) => void;
  setRecommendationFilter: (key: RecommendationFilterKey, value: boolean) => void;
  setRecommendationPlaystyle: (playstyle: RecommendationPlaystyle) => void;
  toggleFavoriteType: (type: TypeName) => void;
  toggleAvoidedType: (type: TypeName) => void;
  togglePreferredRole: (role: RoleKey) => void;
  setBattleWeather: (weather: BattleWeather) => void;
  setTheme: (theme: BuilderTheme) => void;
  toggleEncounterCompleted: (encounterId: string) => void;
  setHackEvent: (key: string, value: boolean) => void;
  resetHackEvents: () => void;
  resetRun: () => void;
};

export type { PokemonGender };
