import type { GiftPokemon, TradePokemon, WildArea } from "@/lib/docsSchema";

export type WildAcquisition = {
  area: string;
  method: string;
  level: string;
  rate?: string;
  rateValue?: number | null;
};

export type GiftAcquisition = {
  location: string;
  level: string;
};

export type TradeAcquisition = {
  location: string;
  requested: string;
};

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

const EVOLUTIONARY_STONE_NAMES = new Set([
  "fire stone",
  "water stone",
  "thunder stone",
  "leaf stone",
  "moon stone",
  "sun stone",
  "dusk stone",
  "dawn stone",
  "shiny stone",
  "ice stone",
]);

const EVOLUTIONARY_ITEM_NAMES = new Set([
  "deep sea scale",
  "deep sea tooth",
  "dragon scale",
  "dubious disc",
  "electirizer",
  "kings rock",
  "magmarizer",
  "metal coat",
  "protector",
  "reaper cloth",
  "up grade",
  "ice stone",
  "link cable",
]);

export function shopDetailMatchesItem(detail: string, itemName: string) {
  const normalizedDetail = normalizeWords(detail);
  const normalizedItemName = normalizeWords(itemName);

  if (!normalizedDetail || !normalizedItemName) {
    return false;
  }

  if (normalizedDetail.includes(normalizedItemName)) {
    return true;
  }

  if (
    normalizedDetail.includes("evolutionary stones") &&
    EVOLUTIONARY_STONE_NAMES.has(normalizedItemName)
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("all evolutionary items") &&
    (EVOLUTIONARY_STONE_NAMES.has(normalizedItemName) ||
      EVOLUTIONARY_ITEM_NAMES.has(normalizedItemName))
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("incense items") &&
    normalizedItemName.includes("incense")
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("pp ups and pp maxes") &&
    (normalizedItemName === "pp up" || normalizedItemName === "pp max")
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("everstones and eviolites") &&
    (normalizedItemName === "everstone" || normalizedItemName === "eviolite")
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("white mental and power herbs") &&
    (normalizedItemName === "white herb" ||
      normalizedItemName === "mental herb" ||
      normalizedItemName === "power herb")
  ) {
    return true;
  }

  return false;
}

export function sanitizeSpeciesName(species: string) {
  return species
    .replace(/^a\s+/i, "")
    .replace(/\.$/, "")
    .trim();
}

export function parseEncounterRate(rate?: string | null) {
  const value = String(rate ?? "").trim();
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d+(?:\.\d+)?)%$/);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export function formatWildAcquisition(entry: WildAcquisition) {
  const parts = [`${entry.area} · ${entry.method}`];
  if (entry.rate) {
    parts.push(entry.rate);
  }
  if (entry.level) {
    parts.push(`Lv ${entry.level}`);
  }
  return parts.join(" · ");
}

export function formatGiftAcquisition(entry: GiftAcquisition) {
  return `${entry.location} · Lv ${entry.level}`;
}

export function formatTradeAcquisition(entry: TradeAcquisition) {
  return `${entry.location} · por ${entry.requested}`;
}

export function buildAcquisitionIndex(
  wildAreas: WildArea[],
  gifts: GiftPokemon[],
  trades: TradePokemon[],
  pokemonNames: string[],
) {
  const wildBySpecies = new Map<string, WildAcquisition[]>();
  const giftsBySpecies = new Map<string, GiftAcquisition[]>();
  const tradesBySpecies = new Map<string, TradeAcquisition[]>();

  wildAreas.forEach((area) => {
    area.methods.forEach((method) => {
      method.encounters.forEach((encounter) => {
        extractEncounterSpecies(encounter.species, pokemonNames).forEach((name) => {
          const key = normalizeWords(name);
          wildBySpecies.set(key, [
            ...(wildBySpecies.get(key) ?? []),
            {
              area: area.area,
              method: method.method,
              level: encounter.level,
              rate: encounter.rate,
              rateValue: parseEncounterRate(encounter.rate),
            },
          ]);
        });
      });
    });
  });

  gifts.forEach((gift) => {
    extractGiftSpecies(gift.name, gift.notes ?? [], pokemonNames).forEach((name) => {
      const key = normalizeWords(name);
      giftsBySpecies.set(key, [
        ...(giftsBySpecies.get(key) ?? []),
        { location: gift.location, level: gift.level },
      ]);
    });
  });

  trades.forEach((trade) => {
    const key = normalizeWords(trade.received);
    tradesBySpecies.set(key, [
      ...(tradesBySpecies.get(key) ?? []),
      { location: trade.location, requested: trade.requested },
    ]);
  });

  return { wildBySpecies, giftsBySpecies, tradesBySpecies };
}

function normalizeWords(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
