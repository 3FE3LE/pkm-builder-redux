import type { ParsedDocs } from "@/lib/docsSchema";
import { findArea, findGift, findTrade } from "@/lib/docsSchema";
import {
  isRecommendationSpeciesAllowed,
  starters,
  type RecommendationFilters,
  type StarterKey,
} from "@/lib/builder";
import { buildCoverageSummary } from "@/lib/domain/battle";
import { extractEncounterSpecies, extractGiftSpecies, sanitizeSpeciesName } from "@/lib/domain/sourceData";
import { normalizeName as normalizeSpeciesLookupName } from "@/lib/domain/names";
import { buildTeamRoleSnapshot } from "@/lib/domain/roleAnalysis";
import { ROLE_LABELS } from "@/lib/domain/roleLabels";
import { getTypeEffectiveness } from "@/lib/domain/typeChart";
import type { RemoteMove, RemotePokemon, ResolvedTeamMember } from "@/lib/teamAnalysis";
import { getContextualSourceAreasForMilestone, type RunEncounterDefinition } from "@/lib/runEncounters";

import {
  buildDecisionDeltas,
  inferProjectedLevel,
  projectCandidateMember,
  type DecisionDelta,
  type DecisionDeltaTeamMember,
} from "./decisionDelta";

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

export type SwapOpportunity = {
  id: string;
  candidateSpecies: string;
  candidateRole: string;
  source: string;
  area: string;
  projectedMoves: string[];
  replacedSpecies: string;
  replacedRole?: string;
  scoreDelta: number;
  riskDelta: number;
  projectedRisk: number;
  offenseDelta: number;
  defenseDelta: number;
  speedDelta: number;
  rolesDelta: number;
  consistencyDelta: number;
  attackUpsides: string[];
  defenseUpsides: string[];
  currentMember: ResolvedTeamMember;
  candidateMember: DecisionDeltaTeamMember;
  duplicatePenalty: number;
};

export function buildSwapOpportunities({
  docs,
  team,
  nextEncounter,
  milestoneId,
  pokemonByName,
  moveIndex,
  starter,
  filters,
}: {
  docs: ParsedDocs;
  team: Array<ResolvedTeamMember & { locked?: boolean }>;
  nextEncounter: RunEncounterDefinition | null;
  milestoneId?: string;
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
  moveIndex: Record<string, RemoteMove | null | undefined>;
  starter: StarterKey;
  filters: RecommendationFilters;
}): SwapOpportunity[] {
  const activeTeam = team.filter((member) => member.species.trim());
  if (!nextEncounter || !activeTeam.length) {
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
  const candidateSuggestions = candidatePool
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
      const roleLabel = ROLE_LABELS[roleEntry?.naturalRole ?? "wallbreaker"];

      return {
        id: source.id,
        species: source.species,
        source: source.source,
        reason: `${source.source} disponible en ${source.area}`,
        role: roleLabel,
        canonicalRole: roleEntry?.naturalRole ?? "wallbreaker",
        roleLabel,
        teamFitNote: `${source.area} abre un pivot inmediato para este checkpoint.`,
        roleReason: roleEntry?.drivers[0] ?? "Su perfil base encaja mejor para este tramo.",
        area: source.area,
        duplicatePenalty,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (!candidateSuggestions.length) {
    return [];
  }

  const deltas = buildDecisionDeltas({
    team: activeTeam,
    checkpointId,
    candidates: candidateSuggestions,
    pokemonByName,
    moveIndex,
  });

  const groupedBySlot = new Map<string, SwapOpportunity>();
  for (const delta of deltas) {
    if (delta.action !== "replace" || !delta.replacedSlot || delta.riskDelta <= 0) {
      continue;
    }
    const replacedSlot = delta.replacedSlot;

    const currentMember = activeTeam.find(
      (member) =>
        normalizeWords(member.species) === normalizeWords(replacedSlot) &&
        !member.locked,
    );
    const candidateMember = projectedByCandidateId.get(delta.id);
    if (!currentMember || !candidateMember) {
      continue;
    }

    const replacedKey = currentMember.key ?? currentMember.species;
    const currentBest = groupedBySlot.get(replacedKey);
    const nextOpportunity = buildSwapOpportunity({
      delta,
      currentMember,
      candidateMember,
      nextEncounter,
      pokemonByName,
    });

    if (
      !currentBest ||
      nextOpportunity.riskDelta > currentBest.riskDelta ||
      (nextOpportunity.riskDelta === currentBest.riskDelta &&
        nextOpportunity.scoreDelta > currentBest.scoreDelta)
    ) {
      groupedBySlot.set(replacedKey, nextOpportunity);
    }
  }

  return [...groupedBySlot.values()]
    .sort(
      (left, right) =>
        (right.riskDelta - right.duplicatePenalty) - (left.riskDelta - left.duplicatePenalty) ||
        (right.scoreDelta - right.duplicatePenalty * 1.4) - (left.scoreDelta - left.duplicatePenalty * 1.4) ||
        left.replacedSpecies.localeCompare(right.replacedSpecies),
    )
    .slice(0, 2);
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

function buildSwapOpportunity({
  delta,
  currentMember,
  candidateMember,
  nextEncounter,
  pokemonByName,
}: {
  delta: DecisionDelta;
  currentMember: ResolvedTeamMember;
  candidateMember: DecisionDeltaTeamMember;
  nextEncounter: RunEncounterDefinition | null;
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
}): SwapOpportunity {
  const currentRole = buildTeamRoleSnapshot([currentMember]).members[0];
  const candidateRole = buildTeamRoleSnapshot([candidateMember]).members[0];
  const { attackUpsides, defenseUpsides } = buildEncounterEdges({
    currentMember,
    candidateMember,
    nextEncounter,
    pokemonByName,
  });

  return {
    id: delta.id,
    candidateSpecies: delta.species,
    candidateRole: ROLE_LABELS[candidateRole?.naturalRole ?? delta.canonicalRole],
    source: delta.source,
    area: delta.area ?? "",
    projectedMoves: delta.projectedMoves,
    replacedSpecies: currentMember.species,
    replacedRole: currentRole ? ROLE_LABELS[currentRole.naturalRole] : undefined,
    scoreDelta: delta.scoreDelta,
    riskDelta: delta.riskDelta,
    projectedRisk: delta.projectedRisk,
    offenseDelta: delta.offenseDelta,
    defenseDelta: delta.defenseDelta,
    speedDelta: delta.speedDelta,
    rolesDelta: delta.rolesDelta,
    consistencyDelta: delta.consistencyDelta,
    attackUpsides,
    defenseUpsides,
    currentMember,
    candidateMember,
    duplicatePenalty:
      "duplicatePenalty" in delta && typeof delta.duplicatePenalty === "number"
        ? delta.duplicatePenalty
        : 0,
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

function buildEncounterEdges({
  currentMember,
  candidateMember,
  nextEncounter,
  pokemonByName,
}: {
  currentMember: ResolvedTeamMember;
  candidateMember: DecisionDeltaTeamMember;
  nextEncounter: RunEncounterDefinition | null;
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
}) {
  if (!nextEncounter) {
    return {
      attackUpsides: [] as string[],
      defenseUpsides: [] as string[],
    };
  }

  const encounterTypes = Array.from(
    new Set(
      getEncounterSpecies(nextEncounter)
        .flatMap((species) => pokemonByName[normalizeKey(species)]?.types ?? []),
    ),
  );

  const attackUpsides = encounterTypes
    .filter((type) => {
      const currentScore = bestAttackMultiplier(currentMember.moves, [type]);
      const nextScore = bestAttackMultiplier(candidateMember.moves, [type]);
      return nextScore > currentScore && nextScore > 1;
    })
    .slice(0, 3);

  const defenseUpsides = encounterTypes
    .filter((type) => {
      const currentMultiplier = getTypeEffectiveness(type, currentMember.resolvedTypes);
      const nextMultiplier = getTypeEffectiveness(type, candidateMember.resolvedTypes);
      return nextMultiplier < currentMultiplier;
    })
    .slice(0, 3);

  return { attackUpsides, defenseUpsides };
}

function getEncounterSpecies(encounter: RunEncounterDefinition) {
  if (encounter.team?.length) {
    return encounter.team;
  }

  return encounter.bosses?.flatMap((boss) => boss.team) ?? [];
}

function bestAttackMultiplier(
  moves: {
    type?: string;
    power?: number | null;
    adjustedPower?: number | null;
    damageClass?: string;
  }[],
  targetTypes: string[],
) {
  return moves.reduce((best, move) => {
    if (!move.type || move.damageClass === "status") {
      return best;
    }

    const multiplier = getTypeEffectiveness(move.type, targetTypes);
    return multiplier > best ? multiplier : best;
  }, 0);
}

function sourcePriority(source: CandidateSource["source"]) {
  return {
    Gift: 0,
    Trade: 1,
    Wild: 2,
  }[source];
}

function normalizeWords(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeKey(input: string) {
  return normalizeSpeciesLookupName(input);
}
