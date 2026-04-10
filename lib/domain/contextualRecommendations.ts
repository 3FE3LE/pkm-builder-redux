import { findArea, findGift, findTrade, type ParsedDocs } from "../docsSchema";
import { normalizeName as normalizeSpeciesLookupName } from "./names";
import { buildSignatureCeiling } from "./signatureCeiling";
import {
  buildDecisionDeltas,
  inferProjectedLevel,
  projectCandidateMember,
  type DecisionDelta,
  type DecisionDeltaTeamMember,
} from "./decisionDelta";
import { buildCoverageSummary } from "./battle";
import { buildTeamRoleSnapshot } from "./roleAnalysis";
import { ROLE_LABELS } from "./roleLabels";
import { extractEncounterSpecies, extractGiftSpecies, sanitizeSpeciesName } from "./sourceData";
import { getContextualSourceAreasForMilestone, type RunEncounterDefinition } from "../runEncounters";
import {
  isRecommendationSpeciesAllowed,
  starters,
  type RecommendationFilters,
  type StarterKey,
} from "../builder";
import type { RemoteMove, RemotePokemon, ResolvedTeamMember } from "../teamAnalysis";

type CandidateSource = {
  id: string;
  species: string;
  source: "Wild" | "Gift" | "Trade";
  area: string;
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
  ].map((species) => normalizeWords(species)),
);

export type CaptureRecommendation = {
  id: string;
  species: string;
  source: string;
  area: string;
  role: string;
  projectedMoves: string[];
  delta: DecisionDelta;
  candidateMember: DecisionDeltaTeamMember;
  recommendationScore: number;
  redux: {
    score: number;
    sortBonus: number;
    hasTypeChanges: boolean;
    hasAbilityChanges: boolean;
    hasStatChanges: boolean;
    labels: string[];
  };
  lateGame: {
    finalSpecies: string;
    finalTypes: string[];
    finalBst?: number;
    score: number;
    notes: string[];
  };
};

export function buildCaptureRecommendations({
  docs,
  team,
  nextEncounter,
  milestoneId,
  pokemonByName,
  moveIndex,
  reduxBySpecies = {},
  starter,
  filters,
  limit = 4,
}: {
  docs: ParsedDocs;
  team: Array<ResolvedTeamMember & { locked?: boolean }>;
  nextEncounter: RunEncounterDefinition | null;
  milestoneId?: string;
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
  moveIndex: Record<string, RemoteMove | null | undefined>;
  reduxBySpecies?: Record<
    string,
    {
      hasTypeChanges: boolean;
      hasAbilityChanges: boolean;
      hasStatChanges: boolean;
    }
  >;
  starter: StarterKey;
  filters: RecommendationFilters;
  limit?: number;
}): CaptureRecommendation[] {
  const activeTeam = team.filter((member) => member.species.trim());
  if (!nextEncounter || activeTeam.length >= 6) {
    return [];
  }

  const checkpointId = milestoneId ?? inferCheckpointIdFromOrder(nextEncounter.order);
  const candidatePool = collectCandidateSources({
    docs,
    areas: getContextualSourceAreasForMilestone(checkpointId),
    existingSpecies: new Set(activeTeam.map((member) => normalizeWords(member.species))),
    pokemonByName,
  });
  if (!candidatePool.length) {
    return [];
  }

  const projectedLevel = inferProjectedLevel(activeTeam, checkpointId);
  const uncoveredTypes = buildCoverageSummary(activeTeam)
    .filter((entry) => entry.multiplier <= 1)
    .map((entry) => entry.defenseType);

  const projectedByCandidateId = new Map<string, DecisionDeltaTeamMember>();
  const starterFamily = new Set(
    starters[starter].stageSpecies.map((species) => normalizeWords(species)),
  );
  const lockedStarterLine = activeTeam.find(
    (member) => member.locked && starterFamily.has(normalizeWords(member.species)),
  );
  const lockedStarterFinalTypes = getStarterFinalTypes(starter, pokemonByName);

  const candidates = candidatePool
    .map((source) => {
      const normalizedSpecies = normalizeWords(source.species);
      if (!isRecommendationSpeciesAllowed(source.species, starterFamily, filters, true)) {
        return null;
      }
      if (
        filters.excludeOtherStarters &&
        OFF_STARTER_SPECIES.has(normalizedSpecies) &&
        !starterFamily.has(normalizedSpecies)
      ) {
        return null;
      }

      const projected = projectCandidateMember({
        species: source.species,
        level: projectedLevel,
        uncoveredTypes,
        pokemonByName,
        moveIndex,
      });
      if (!projected) {
        return null;
      }

      const duplicatePenalty = getExactTypeDuplicatePenalty({
        team: activeTeam,
        candidateTypes: projected.resolvedTypes,
        candidateSpecies: source.species,
        starterFamily,
      });

      if (filters.excludeExactTypeDuplicates && duplicatePenalty > 0) {
        return null;
      }
      const candidateLineTypes = getComparableTypes({
        species: source.species,
        fallbackTypes: projected.resolvedTypes,
        pokemonByName,
      });
      if (
        filters.excludeExactTypeDuplicates &&
        activeTeam.some(
          (member) =>
            member.locked &&
            sharesAnyType(
              candidateLineTypes,
              getComparableTypes({
                species: member.species,
                fallbackTypes: member.resolvedTypes,
                pokemonByName,
              }),
            ),
        )
      ) {
        return null;
      }
      if (
        lockedStarterLine &&
        sharesAnyType(candidateLineTypes, lockedStarterFinalTypes)
      ) {
        return null;
      }

      projectedByCandidateId.set(source.id, projected);
      const roleEntry = buildTeamRoleSnapshot([projected]).members[0];

      return {
        id: source.id,
        species: source.species,
        source: source.source,
        reason: `${source.source} disponible en ${source.area}`,
        role: ROLE_LABELS[roleEntry?.naturalRole ?? "wallbreaker"],
        canonicalRole: roleEntry?.naturalRole ?? "wallbreaker",
        roleLabel: ROLE_LABELS[roleEntry?.naturalRole ?? "wallbreaker"],
        teamFitNote: `${source.area} abre un slot nuevo util para este checkpoint.`,
        roleReason: roleEntry?.drivers[0] ?? "Su perfil cubre mejor las carencias actuales del equipo.",
        area: source.area,
        duplicatePenalty,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const deltas = buildDecisionDeltas({
    team: activeTeam,
    checkpointId,
    candidates,
    pokemonByName,
    moveIndex,
  });

  return deltas
    .filter((delta) => delta.action === "add")
    .map((delta) => {
      const candidateMember = projectedByCandidateId.get(delta.id);
      const duplicatePenalty =
        candidates.find((candidate) => candidate.id === delta.id)?.duplicatePenalty ?? 0;

      if (!candidateMember) {
        return null;
      }

      const reduxScoring = buildReduxScoring({
        species: delta.species,
        reduxBySpecies,
        preferReduxUpgrades: filters.preferReduxUpgrades,
      });
      const lateGameScoring = buildLateGameScoring({
        species: delta.species,
        currentMember: candidateMember,
        pokemonByName,
      });

      return {
        id: delta.id,
        species: delta.species,
        source: delta.source,
        area: delta.area ?? "",
        role: delta.roleLabel,
        projectedMoves: delta.projectedMoves,
        delta,
        candidateMember,
        recommendationScore: reduxScoring.recommendationScore,
        redux: reduxScoring.redux,
        lateGame: lateGameScoring,
        sortRisk: delta.riskDelta - duplicatePenalty,
        sortScore: delta.scoreDelta - duplicatePenalty * 1.4,
        finalSortScore:
          delta.scoreDelta -
          duplicatePenalty * 1.4 +
          reduxScoring.redux.sortBonus +
          lateGameScoring.score,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort(
      (left, right) =>
        right.finalSortScore - left.finalSortScore ||
        right.sortRisk - left.sortRisk ||
        right.sortScore - left.sortScore ||
        left.species.localeCompare(right.species),
    )
    .slice(0, limit)
    .map(({ sortRisk: _sortRisk, sortScore: _sortScore, finalSortScore: _finalSortScore, ...entry }) => entry);
}

function buildLateGameScoring({
  species,
  currentMember,
  pokemonByName,
}: {
  species: string;
  currentMember: DecisionDeltaTeamMember;
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
}) {
  const terminalProfile = getTerminalLineProfile(species, pokemonByName);
  if (!terminalProfile) {
    return {
      finalSpecies: species,
      finalTypes: currentMember.resolvedTypes,
      finalBst: currentMember.resolvedStats?.bst,
      score: 0,
      notes: [],
    };
  }

  const currentBst = currentMember.resolvedStats?.bst ?? 0;
  const terminalBst = terminalProfile.stats?.bst ?? currentBst;
  const bstGrowth = Math.max(0, terminalBst - currentBst);
  const bstBonus = Math.min(5, round(bstGrowth / 55, 1));
  const currentTypeSignature = buildTypeSignature(currentMember.resolvedTypes);
  const terminalTypeSignature = buildTypeSignature(terminalProfile.types ?? []);
  const typingBonus = terminalTypeSignature && terminalTypeSignature !== currentTypeSignature ? 1.8 : 0;
  const currentAbilitySignature = buildAbilitySignature(pokemonByName[normalizeKey(species)] ?? null);
  const terminalAbilitySignature = buildAbilitySignature(terminalProfile);
  const abilityBonus =
    terminalAbilitySignature && terminalAbilitySignature !== currentAbilitySignature ? 1.2 : 0;
  const signatureCeiling = buildSignatureCeiling({
    abilities: terminalProfile.abilities ?? [],
    moves: terminalProfile.learnsets?.levelUp?.map((entry) => entry.move) ?? [],
  });
  const notes = [
    bstBonus > 0 ? `${terminalProfile.name} sube el techo de BST a ${terminalBst}.` : null,
    typingBonus > 0 ? `${terminalProfile.name} cambia la proyección de typing a ${terminalProfile.types.join("/")}.` : null,
    abilityBonus > 0 ? `${terminalProfile.name} abre habilidades finales distintas.` : null,
    ...signatureCeiling.notes.map((note) => `${terminalProfile.name}: ${note}`),
  ].filter((entry): entry is string => Boolean(entry));

  return {
    finalSpecies: terminalProfile.name ?? species,
    finalTypes: terminalProfile.types ?? currentMember.resolvedTypes,
    finalBst: terminalProfile.stats?.bst,
    score: round(bstBonus + typingBonus + abilityBonus + signatureCeiling.score, 1),
    notes,
  };
}

function getTerminalLineProfile(
  species: string,
  pokemonByName: Record<string, RemotePokemon | null | undefined>,
  visited = new Set<string>(),
): RemotePokemon | null {
  const key = normalizeKey(species);
  if (!key || visited.has(key)) {
    return null;
  }
  visited.add(key);

  const pokemon = pokemonByName[key] ?? null;
  if (!pokemon) {
    return null;
  }
  if (!pokemon.nextEvolutions?.length) {
    return pokemon;
  }

  const terminals = pokemon.nextEvolutions
    .map((nextSpecies) => getTerminalLineProfile(nextSpecies, pokemonByName, new Set(visited)))
    .filter((entry): entry is RemotePokemon => Boolean(entry));

  if (!terminals.length) {
    return pokemon;
  }

  return terminals.sort(
    (left, right) =>
      (right.stats?.bst ?? 0) - (left.stats?.bst ?? 0) ||
      (right.types?.length ?? 0) - (left.types?.length ?? 0) ||
      String(left.name ?? "").localeCompare(String(right.name ?? "")),
  )[0] ?? pokemon;
}

function buildAbilitySignature(pokemon: RemotePokemon | null | undefined) {
  return [...(pokemon?.abilities ?? [])]
    .filter(Boolean)
    .map((ability) => normalizeWords(ability))
    .sort()
    .join("|");
}

function buildReduxScoring({
  species,
  reduxBySpecies,
  preferReduxUpgrades,
}: {
  species: string;
  reduxBySpecies: Record<
    string,
    {
      hasTypeChanges: boolean;
      hasAbilityChanges: boolean;
      hasStatChanges: boolean;
    }
  >;
  preferReduxUpgrades: boolean;
}) {
  const reduxEntry =
    reduxBySpecies[normalizeSpeciesLookupName(species)] ??
    reduxBySpecies[normalizeWords(species)] ??
    {
      hasTypeChanges: false,
      hasAbilityChanges: false,
      hasStatChanges: false,
    };
  const reduxScore =
    (reduxEntry.hasTypeChanges ? 3 : 0) +
    (reduxEntry.hasAbilityChanges ? 2 : 0) +
    (reduxEntry.hasStatChanges ? 1 : 0);
  const labels = [
    reduxEntry.hasTypeChanges ? "Typing Redux" : null,
    reduxEntry.hasAbilityChanges ? "Habs Redux" : null,
    reduxEntry.hasStatChanges ? "Stats Redux" : null,
  ].filter((entry): entry is string => Boolean(entry));
  const sortBonus = round(reduxScore * (preferReduxUpgrades ? 0.9 : 0.35), 1);

  return {
    recommendationScore: reduxScore,
    redux: {
      score: reduxScore,
      sortBonus,
      hasTypeChanges: reduxEntry.hasTypeChanges,
      hasAbilityChanges: reduxEntry.hasAbilityChanges,
      hasStatChanges: reduxEntry.hasStatChanges,
      labels,
    },
  };
}

function getExactTypeDuplicatePenalty({
  team,
  candidateTypes,
  candidateSpecies,
  starterFamily,
}: {
  team: Array<ResolvedTeamMember & { locked?: boolean }>;
  candidateTypes: string[];
  candidateSpecies: string;
  starterFamily: Set<string>;
}) {
  const candidateSignature = buildTypeSignature(candidateTypes);
  if (!candidateSignature) {
    return 0;
  }

  return team.reduce((penalty, member) => {
    if (buildTypeSignature(member.resolvedTypes) !== candidateSignature) {
      return penalty;
    }

    let nextPenalty = penalty + 2;
    if (member.locked) {
      nextPenalty += 2;
    }
    if (starterFamily.has(normalizeWords(member.species))) {
      nextPenalty += 2;
    }
    if (normalizeWords(member.species) === normalizeWords(candidateSpecies)) {
      nextPenalty += 3;
    }
    return nextPenalty;
  }, 0);
}

function buildTypeSignature(types: string[]) {
  return [...types]
    .filter(Boolean)
    .map((type) => normalizeWords(type))
    .sort()
    .join("|");
}

function getStarterFinalTypes(
  starter: StarterKey,
  pokemonByName: Record<string, RemotePokemon | null | undefined>,
) {
  const finalSpecies = starters[starter].stageSpecies.at(-1);
  if (!finalSpecies) {
    return [];
  }
  return getComparableTypes({ species: finalSpecies, fallbackTypes: [], pokemonByName });
}

function getComparableTypes({
  species,
  fallbackTypes,
  pokemonByName,
}: {
  species: string;
  fallbackTypes: string[];
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
}) {
  const lineTypes = getLineTerminalTypes(species, pokemonByName);
  return lineTypes.length ? lineTypes : fallbackTypes;
}

function getLineTerminalTypes(
  species: string,
  pokemonByName: Record<string, RemotePokemon | null | undefined>,
  visited = new Set<string>(),
): string[] {
  const key = normalizeKey(species);
  if (!key || visited.has(key)) {
    return [];
  }
  visited.add(key);

  const pokemon = pokemonByName[key];
  if (!pokemon) {
    return [];
  }
  if (!pokemon.nextEvolutions?.length) {
    return pokemon.types ?? [];
  }

  const terminalTypes = pokemon.nextEvolutions.flatMap((nextSpecies) =>
    getLineTerminalTypes(nextSpecies, pokemonByName, new Set(visited)),
  );

  return terminalTypes.length ? Array.from(new Set(terminalTypes)) : (pokemon.types ?? []);
}

function sharesAnyType(left: string[], right: string[]) {
  const rightSet = new Set(right.map((type) => normalizeWords(type)));
  return left.some((type) => rightSet.has(normalizeWords(type)));
}

function inferCheckpointIdFromOrder(order: number) {
  if (order <= 3) {
    return "opening";
  }
  if (order <= 5) {
    return "floccesy";
  }
  if (order <= 9) {
    return "virbank";
  }
  return "castelia";
}

function collectCandidateSources({
  docs,
  areas,
  existingSpecies,
  pokemonByName,
}: {
  docs: ParsedDocs;
  areas: string[];
  existingSpecies: Set<string>;
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
}) {
  const pokemonNames = Object.values(pokemonByName)
    .map((entry) => entry?.name)
    .filter((entry): entry is string => Boolean(entry));
  const candidates = new Map<string, CandidateSource>();

  for (const areaName of areas) {
    const wildArea = findArea(docs.wildAreas, areaName);
    for (const encounter of wildArea?.methods.flatMap((method) => method.encounters) ?? []) {
      for (const species of extractEncounterSpecies(encounter.species, pokemonNames)) {
        addCandidate(candidates, {
          species,
          source: "Wild",
          area: areaName,
          existingSpecies,
        });
      }
    }

    for (const trade of findTrade(docs.trades, areaName)) {
      addCandidate(candidates, {
        species: sanitizeSpeciesName(trade.received),
        source: "Trade",
        area: areaName,
        existingSpecies,
      });
    }

    for (const gift of findGift(docs.gifts, areaName)) {
      const extracted = extractGiftSpecies(gift.name, gift.notes, pokemonNames);
      for (const species of extracted) {
        addCandidate(candidates, {
          species,
          source: "Gift",
          area: areaName,
          existingSpecies,
        });
      }
    }
  }

  return [...candidates.values()];
}

function addCandidate(
  pool: Map<string, CandidateSource>,
  {
    species,
    source,
    area,
    existingSpecies,
  }: {
    species: string;
    source: CandidateSource["source"];
    area: string;
    existingSpecies: Set<string>;
  },
) {
  const cleanSpecies = sanitizeSpeciesName(species);
  const key = normalizeWords(cleanSpecies);
  if (!cleanSpecies || existingSpecies.has(key)) {
    return;
  }

  const existing = pool.get(key);
  if (!existing || sourcePriority(source) < sourcePriority(existing.source)) {
    pool.set(key, {
      id: `${source.toLowerCase()}-${normalizeKey(area)}-${normalizeKey(cleanSpecies)}`,
      species: cleanSpecies,
      source,
      area,
    });
  }
}

function matchPokemonNames(text: string, pokemonNames: string[]) {
  const haystack = ` ${normalizeWords(text)} `;
  return pokemonNames.filter((species) =>
    haystack.includes(` ${normalizeWords(species)} `),
  );
}

function sourcePriority(source: CandidateSource["source"]) {
  return {
    Gift: 0,
    Trade: 1,
    Wild: 2,
  }[source];
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeWords(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeKey(input: string) {
  return normalizeSpeciesLookupName(input);
}
