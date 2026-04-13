import type { CaptureRecommendation } from "../contextualRecommendations";
import { starters, type StarterKey } from "@/lib/builder";
import type { ResolvedTeamMember, RemotePokemon } from "@/lib/teamAnalysis";
import type { RunEncounterDefinition } from "@/lib/runEncounters";
import { normalizeName } from "@/lib/domain/names";
import {
  buildPokemonProfile,
  type PokemonProfileInput,
} from "../profiles/buildPokemonProfile";
import { buildTeamSnapshot } from "../profiles/buildTeamSnapshot";
import { buildEncounterProfile } from "../profiles/buildEncounterProfile";
import { scoreCandidate } from "./scoreCandidate";
import type {
  CandidateScore,
  CheckpointProfile,
  PokemonProfile,
  ScoringPreferences,
} from "../profiles/types";

// ── Checkpoint Profiles (static, mirrored from checkpointScoring) ──

const CHECKPOINT_PROFILES: Record<string, CheckpointProfile> = {
  opening: {
    id: "opening",
    label: "Antes de Cheren",
    preferredCoverage: ["Normal", "Dark"],
    preferredResists: ["Normal"],
    speedPressure: "low",
    speedThreshold: 75,
    projectedLevel: 11,
  },
  floccesy: {
    id: "floccesy",
    label: "Antes de Roxie",
    preferredCoverage: ["Poison", "Bug"],
    preferredResists: ["Poison", "Bug"],
    speedPressure: "medium",
    speedThreshold: 88,
    projectedLevel: 16,
  },
  virbank: {
    id: "virbank",
    label: "Antes de Burgh",
    preferredCoverage: ["Bug", "Poison", "Steel", "Flying"],
    preferredResists: ["Bug", "Poison"],
    speedPressure: "medium",
    speedThreshold: 88,
    projectedLevel: 24,
  },
  castelia: {
    id: "castelia",
    label: "Antes de Elesa",
    preferredCoverage: ["Electric", "Flying", "Water", "Ground"],
    preferredResists: ["Electric", "Flying"],
    speedPressure: "high",
    speedThreshold: 105,
    projectedLevel: 30,
  },
  driftveil: {
    id: "driftveil",
    label: "Tramo Driftveil y Clay",
    preferredCoverage: ["Ground", "Rock", "Steel", "Water"],
    preferredResists: ["Ground", "Rock", "Electric"],
    speedPressure: "high",
    speedThreshold: 105,
    projectedLevel: 42,
  },
  mistralton: {
    id: "mistralton",
    label: "Tramo Mistralton y Skyla",
    preferredCoverage: ["Flying", "Ice", "Electric", "Dragon"],
    preferredResists: ["Flying", "Dragon", "Ice"],
    speedPressure: "high",
    speedThreshold: 105,
    projectedLevel: 55,
  },
  undella: {
    id: "undella",
    label: "Tramo Undella y Drayden",
    preferredCoverage: ["Water", "Ice", "Grass", "Ground"],
    preferredResists: ["Water", "Ice", "Grass"],
    speedPressure: "high",
    speedThreshold: 105,
    projectedLevel: 64,
  },
  humilau: {
    id: "humilau",
    label: "Tramo Plasma final",
    preferredCoverage: ["Dragon", "Dark", "Fighting", "Ice"],
    preferredResists: ["Dragon", "Dark", "Ghost"],
    speedPressure: "high",
    speedThreshold: 105,
    projectedLevel: 70,
  },
  league: {
    id: "league",
    label: "Liga y N's Castle",
    preferredCoverage: ["Dragon", "Dark", "Psychic", "Ice", "Fighting"],
    preferredResists: ["Dragon", "Dark", "Ghost", "Psychic"],
    speedPressure: "high",
    speedThreshold: 105,
    projectedLevel: 78,
  },
  postgame: {
    id: "postgame",
    label: "Postgame",
    preferredCoverage: ["Dragon", "Steel", "Ice", "Fighting", "Electric"],
    preferredResists: ["Dragon", "Ice", "Steel", "Dark"],
    speedPressure: "high",
    speedThreshold: 105,
    projectedLevel: 90,
  },
};

// ── Bridge: ResolvedTeamMember → PokemonProfileInput ──

function teamMemberToProfileInput(
  member: ResolvedTeamMember & { locked?: boolean },
): PokemonProfileInput {
  const stats = member.summaryStats ?? member.resolvedStats;
  return {
    id: member.key,
    name: member.species,
    types: member.resolvedTypes,
    stats: stats ?? { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1, bst: 6 },
    ability: member.ability,
    abilities: member.abilities,
    moves: (member.moves ?? []).map((m) => ({
      name: m.name,
      type: m.type,
      damageClass: m.damageClass,
      power: m.power,
    })),
    item: member.item,
  };
}

// ── Bridge: CaptureRecommendation candidate → PokemonProfileInput ──

function candidateToProfileInput(
  rec: CaptureRecommendation,
): PokemonProfileInput {
  const member = rec.candidateMember;
  const stats = member.summaryStats ?? member.resolvedStats;
  return {
    id: rec.id,
    name: rec.species,
    types: member.resolvedTypes,
    stats: stats ?? { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1, bst: 6 },
    ability: member.ability,
    abilities: member.abilities ?? [],
    moves: (member.moves ?? []).map((m) => ({
      name: m.name,
      type: m.type,
      damageClass: m.damageClass,
      power: m.power,
    })),
    reduxFlags: rec.redux
      ? {
          hasTypeChanges: rec.redux.hasTypeChanges,
          hasAbilityChanges: rec.redux.hasAbilityChanges,
          hasStatChanges: rec.redux.hasStatChanges,
        }
      : undefined,
    terminalTypes: rec.lateGame?.finalTypes as string[] | undefined,
    terminalStats: rec.lateGame?.finalBst
      ? approximateTerminalStats(stats?.bst ?? 300, rec.lateGame.finalBst)
      : undefined,
  };
}

// ── Bridge: Encounter → EncounterProfile input ──

function encounterToProfileInput(
  encounter: RunEncounterDefinition,
  pokemonByName: Record<string, RemotePokemon>,
) {
  const speciesNames =
    encounter.bosses?.flatMap((b) => b.team) ?? encounter.team ?? [];

  const team = speciesNames
    .map((name) => {
      const data = pokemonByName[name];
      if (!data) return null;
      return {
        name: data.name,
        types: data.types,
        stats: data.stats ? { spe: data.stats.spe } : undefined,
      };
    })
    .filter(Boolean) as { name: string; types: string[]; stats?: { spe: number } }[];

  return { id: encounter.id, label: encounter.label, team };
}

/**
 * Approximate terminal stats from known BST.
 * We don't have full terminal stats in CaptureRecommendation, so we distribute
 * the BST gain proportionally. This is "good enough" for ceiling scoring.
 */
function approximateTerminalStats(
  currentBst: number,
  terminalBst: number,
): { hp: number; atk: number; def: number; spa: number; spd: number; spe: number; bst: number } {
  const base = Math.round(terminalBst / 6);
  return {
    hp: base,
    atk: base,
    def: base,
    spa: base,
    spd: base,
    spe: base,
    bst: terminalBst,
  };
}

// ── Main enrichment function ──

export type EnrichedCaptureRecommendation = CaptureRecommendation & {
  score: CandidateScore;
  profile: PokemonProfile;
};

const OFF_STARTER_SPECIES = new Set(
  [
    "Bulbasaur", "Ivysaur", "Venusaur",
    "Charmander", "Charmeleon", "Charizard",
    "Squirtle", "Wartortle", "Blastoise",
    "Chikorita", "Bayleef", "Meganium",
    "Cyndaquil", "Quilava", "Typhlosion",
    "Totodile", "Croconaw", "Feraligatr",
    "Treecko", "Grovyle", "Sceptile",
    "Torchic", "Combusken", "Blaziken",
    "Mudkip", "Marshtomp", "Swampert",
    "Turtwig", "Grotle", "Torterra",
    "Chimchar", "Monferno", "Infernape",
    "Piplup", "Prinplup", "Empoleon",
    "Snivy", "Servine", "Serperior",
    "Tepig", "Pignite", "Emboar",
    "Oshawott", "Dewott", "Samurott",
  ].map((species) => normalizeName(species)),
);

export function enrichCaptureRecommendations({
  recommendations,
  team,
  nextEncounter,
  milestoneId,
  pokemonByName,
  starter,
  filters,
}: {
  recommendations: CaptureRecommendation[];
  team: (ResolvedTeamMember & { locked?: boolean })[];
  nextEncounter: RunEncounterDefinition | null;
  milestoneId: string;
  pokemonByName: Record<string, RemotePokemon>;
  starter?: StarterKey;
  filters: ScoringPreferences;
}): EnrichedCaptureRecommendation[] {
  if (!recommendations.length) return [];
  const starterFamily = starter
    ? new Set(starters[starter].stageSpecies.map((species) => normalizeName(species)))
    : null;
  const visibleRecommendations =
    filters.excludeOtherStarters && starterFamily
      ? recommendations.filter((recommendation) => {
          const normalizedSpecies = normalizeName(recommendation.species);
          return (
            !OFF_STARTER_SPECIES.has(normalizedSpecies) ||
            starterFamily.has(normalizedSpecies)
          );
        })
      : recommendations;

  if (!visibleRecommendations.length) return [];

  // Build team profiles
  const activeTeam = team.filter((m) => m.species);
  const teamProfiles = activeTeam.map((m) =>
    buildPokemonProfile(teamMemberToProfileInput(m)),
  );
  const teamSnapshot = buildTeamSnapshot(teamProfiles);

  // Build encounter profile
  const encounterProfile = nextEncounter
    ? buildEncounterProfile(encounterToProfileInput(nextEncounter, pokemonByName))
    : null;

  // Get checkpoint
  const checkpoint =
    CHECKPOINT_PROFILES[milestoneId] ?? CHECKPOINT_PROFILES.opening;

  // Score each candidate
  return visibleRecommendations.map((rec) => {
    const profile = buildPokemonProfile(candidateToProfileInput(rec));
    const score = scoreCandidate(
      profile,
      teamSnapshot,
      encounterProfile,
      checkpoint,
      filters,
    );
    return { ...rec, score, profile };
  });
}
