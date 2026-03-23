import { findArea, findGift, findTrade, type ParsedDocs } from "../docsSchema";
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
import { getContextualSourceAreas, type RunEncounterDefinition } from "../runEncounters";
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
};

export function buildCaptureRecommendations({
  docs,
  team,
  nextEncounter,
  pokemonByName,
  moveIndex,
  starter,
  filters,
}: {
  docs: ParsedDocs;
  team: Array<ResolvedTeamMember & { locked?: boolean }>;
  nextEncounter: RunEncounterDefinition | null;
  pokemonByName: Record<string, RemotePokemon | null | undefined>;
  moveIndex: Record<string, RemoteMove | null | undefined>;
  starter: StarterKey;
  filters: RecommendationFilters;
}): CaptureRecommendation[] {
  const activeTeam = team.filter((member) => member.species.trim());
  if (!nextEncounter || activeTeam.length >= 6) {
    return [];
  }

  const checkpointId = inferCheckpointIdFromOrder(nextEncounter.order);
  const candidatePool = collectCandidateSources({
    docs,
    areas: getContextualSourceAreas(nextEncounter.order),
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
      const candidateLineTypes = getLineTerminalTypes(source.species, pokemonByName);
      if (
        filters.excludeExactTypeDuplicates &&
        activeTeam.some(
          (member) => member.locked && sharesAnyType(candidateLineTypes, member.resolvedTypes),
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

      return {
        id: delta.id,
        species: delta.species,
        source: delta.source,
        area: delta.area ?? "",
        role: delta.roleLabel,
        projectedMoves: delta.projectedMoves,
        delta,
        candidateMember,
        sortRisk: delta.riskDelta - duplicatePenalty,
        sortScore: delta.scoreDelta - duplicatePenalty * 1.4,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort(
      (left, right) =>
        right.sortRisk - left.sortRisk ||
        right.sortScore - left.sortScore ||
        left.species.localeCompare(right.species),
    )
    .slice(0, 4)
    .map(({ sortRisk: _sortRisk, sortScore: _sortScore, ...entry }) => entry);
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
  return getLineTerminalTypes(finalSpecies, pokemonByName);
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
      addCandidate(candidates, {
        species: encounter.species,
        source: "Wild",
        area: areaName,
        existingSpecies,
      });
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

function extractGiftSpecies(name: string, notes: string[], pokemonNames: string[]) {
  const fromName = matchPokemonNames(name, pokemonNames);
  if (fromName.length) {
    return fromName;
  }

  return matchPokemonNames(notes.join(" "), pokemonNames);
}

function matchPokemonNames(text: string, pokemonNames: string[]) {
  const haystack = ` ${normalizeWords(text)} `;
  return pokemonNames.filter((species) =>
    haystack.includes(` ${normalizeWords(species)} `),
  );
}

function sanitizeSpeciesName(species: string) {
  return species
    .replace(/^a\s+/i, "")
    .replace(/\.$/, "")
    .trim();
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
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
