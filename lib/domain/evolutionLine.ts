import { normalizeName } from "@/lib/domain/names";

export function getEvolutionLineBaseSpecies({
  species,
  speciesCatalog,
  pokemonIndex,
}: {
  species: string;
  speciesCatalog: { name: string; slug: string }[];
  pokemonIndex: Record<string, { name?: string; nextEvolutions?: string[] }>;
}) {
  if (!species) {
    return species;
  }

  const previousBySpecies = new Map<string, string[]>();

  speciesCatalog.forEach((entry) => {
    const pokemon =
      pokemonIndex[entry.slug] ??
      pokemonIndex[normalizeName(entry.name)] ??
      null;

    (pokemon?.nextEvolutions ?? []).forEach((nextSpecies) => {
      const key = normalizeName(nextSpecies);
      previousBySpecies.set(key, [...(previousBySpecies.get(key) ?? []), entry.name]);
    });
  });

  let current = species;
  const seen = new Set<string>();

  while (current && !seen.has(normalizeName(current))) {
    const key = normalizeName(current);
    seen.add(key);
    const previous = previousBySpecies.get(key)?.[0];
    if (!previous) {
      return current;
    }
    current = previous;
  }

  return species;
}
