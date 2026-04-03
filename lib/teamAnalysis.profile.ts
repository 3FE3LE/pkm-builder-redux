import type { ParsedDocs } from "@/lib/docsSchema";
import { buildSpriteUrls, formatName, normalizeName, toTitleCase } from "@/lib/domain/names";

import { buildDocumentedEvolutionDetail, formatCanonicalEvolutionMethod } from "@/lib/teamAnalysis.evolution";
import { supportsPokemonGender } from "@/lib/teamAnalysis.gender";
import type { RemotePokemon, ResolvedTeamMember } from "@/lib/teamAnalysis.types";

export function resolvePokemonProfile(
  docs: ParsedDocs,
  species: string,
  remote?: RemotePokemon,
  shiny = false,
): ResolvedTeamMember | undefined {
  const name = species.trim();
  if (!name) {
    return undefined;
  }

  const normalized = normalizeName(name);
  const profile = docs.pokemonProfiles.find((entry) => normalizeName(entry.species) === normalized);
  const typeChange = docs.typeChanges.find((entry) => normalizeName(entry.pokemon) === normalized);
  const types =
    profile?.types ??
    (typeChange ? typeChange.newType.split("/").map((value) => value.trim()) : undefined) ??
    remote?.types.map(toTitleCase) ??
    [];
  const stats = profile?.stats ?? remote?.stats;
  const dexNumber = profile?.dex ?? remote?.id;
  const abilities = (profile?.abilities?.length ? profile.abilities : remote?.abilities ?? []).map((ability) =>
    ability.trim(),
  );
  const sprites = buildSpriteUrls(profile?.species ?? remote?.name ?? name, dexNumber, { shiny });

  const documentedEvolutionHints = docs.evolutionChanges
    .filter((entry) => normalizeName(entry.species) === normalized)
    .map((entry) => ({
      target: entry.target,
      method: entry.method,
      summary: entry.summary,
    }));

  const knownSpecies = docs.pokemonProfiles.length > 1
    ? new Set(docs.pokemonProfiles.map((entry) => normalizeName(entry.species)))
    : null;
  const canonicalEvolutionDetails = (remote?.evolutionDetails ?? []).filter((detail) =>
    !knownSpecies || knownSpecies.has(normalizeName(formatName(detail.target))),
  );
  const canonicalEvolutionHints = canonicalEvolutionDetails.map((detail) => {
    const target = formatName(detail.target);
    const method = formatCanonicalEvolutionMethod(detail);
    return {
      target,
      method,
      summary: `${target} evolves via ${method}.`,
    };
  });
  const documentedEvolutionDetails = documentedEvolutionHints.map(buildDocumentedEvolutionDetail);
  const nextEvolutions =
    (documentedEvolutionHints.length
      ? documentedEvolutionHints.map((entry) => formatName(entry.target))
      : remote?.nextEvolutions
          ?.map(formatName)
          .filter((target) => !knownSpecies || knownSpecies.has(normalizeName(target)))) ?? [];
  const effectiveEvolutionDetails =
    documentedEvolutionDetails.length > 0 ? documentedEvolutionDetails : canonicalEvolutionDetails;

  const evolutionHints = [
    ...documentedEvolutionHints,
    ...canonicalEvolutionHints.filter(
      (hint) =>
        !documentedEvolutionHints.some(
          (documentedHint) => normalizeName(documentedHint.target) === normalizeName(hint.target),
        ),
    ),
    ...nextEvolutions
      .filter(
        (target) =>
          !documentedEvolutionHints.some((hint) => normalizeName(hint.target) === normalizeName(target)) &&
          !canonicalEvolutionHints.some((hint) => normalizeName(hint.target) === normalizeName(target)),
      )
      .map((target) => ({
        target,
        method: "",
        summary: `${target} is the next evolution.`,
      })),
  ];

  return {
    key: normalized,
    species: profile?.species ?? remote?.name ?? formatName(name),
    shiny,
    supportsGender: supportsPokemonGender(profile?.species ?? remote?.name ?? name),
    dexNumber,
    category: remote?.category,
    height: remote?.height,
    weight: remote?.weight,
    flavorText: remote?.flavorText,
    spriteUrl: sprites.spriteUrl,
    animatedSpriteUrl: sprites.animatedSpriteUrl,
    resolvedTypes: types,
    resolvedStats: stats,
    abilities,
    nextEvolutions,
    evolutionDetails: effectiveEvolutionDetails,
    evolutionHints,
    learnsets: remote?.learnsets,
    moves: [],
  };
}
