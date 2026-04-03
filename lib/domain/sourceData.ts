export function matchPokemonNames(text: string, pokemonNames: string[]) {
  const haystack = ` ${normalizeWords(text)} `;
  return Array.from(new Set(
    pokemonNames.filter((species) =>
      haystack.includes(` ${normalizeWords(species)} `),
    ),
  ));
}

export function extractGiftSpecies(
  name: string,
  notes: string[],
  pokemonNames: string[],
) {
  const fromName = matchPokemonNames(name, pokemonNames);
  if (fromName.length) {
    return fromName;
  }

  return matchPokemonNames(notes.join(" "), pokemonNames);
}

export function extractEncounterSpecies(
  rawSpecies: string,
  pokemonNames: string[],
) {
  const exact = pokemonNames.find(
    (species) => normalizeWords(species) === normalizeWords(rawSpecies),
  );
  if (exact) {
    return [exact];
  }

  const matches = matchPokemonNames(rawSpecies, pokemonNames);
  if (matches.length) {
    return matches;
  }

  const sanitized = rawSpecies
    .replace(/\bLv\..*$/i, "")
    .replace(/\s+\d+%.*$/i, "")
    .trim();

  return sanitized ? [sanitizeSpeciesName(sanitized)] : [];
}

export function entryMatchesSpecies(
  rawText: string,
  species: string,
  pokemonNames: string[],
) {
  const key = normalizeWords(species);
  return extractEncounterSpecies(rawText, pokemonNames).some(
    (entry) => normalizeWords(entry) === key,
  );
}

export function giftMatchesSpecies(
  gift: { name: string; notes?: string[] },
  species: string,
  pokemonNames: string[],
) {
  const key = normalizeWords(species);
  return extractGiftSpecies(gift.name, gift.notes ?? [], pokemonNames).some(
    (entry) => normalizeWords(entry) === key,
  );
}

export function parseItemLocationDetail(detail: string) {
  const trimmed = detail.trim();
  if (!trimmed.includes("->")) {
    return {
      original: null,
      replacement: trimmed,
      display: trimmed,
    };
  }

  const [left, ...rest] = trimmed.split("->");
  const original = left?.trim() ?? "";
  const replacement = rest.join("->").trim();

  return {
    original: original || null,
    replacement: replacement || null,
    display: replacement ? `Reemplaza ${original}` : original,
  };
}

export function sanitizeSpeciesName(species: string) {
  return species
    .replace(/^a\s+/i, "")
    .replace(/\.$/, "")
    .trim();
}

function normalizeWords(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
