import { normalizeName } from "@/lib/domain/names";

function toSpeciesSet(values: string[]) {
  return new Set(values.map(normalizeName));
}

export const LEGENDARY_SPECIES = toSpeciesSet([
  "Articuno",
  "Zapdos",
  "Moltres",
  "Mewtwo",
  "Raikou",
  "Entei",
  "Suicune",
  "Lugia",
  "Ho-Oh",
  "Regirock",
  "Regice",
  "Registeel",
  "Latias",
  "Latios",
  "Kyogre",
  "Groudon",
  "Rayquaza",
  "Uxie",
  "Mesprit",
  "Azelf",
  "Dialga",
  "Palkia",
  "Heatran",
  "Regigigas",
  "Giratina",
  "Cresselia",
  "Cobalion",
  "Terrakion",
  "Virizion",
  "Tornadus",
  "Thundurus",
  "Reshiram",
  "Zekrom",
  "Landorus",
  "Kyurem",
]);

export const UNIQUE_SPECIES = toSpeciesSet([
  "Mew",
  "Celebi",
  "Jirachi",
  "Deoxys",
  "Phione",
  "Manaphy",
  "Darkrai",
  "Shaymin",
  "Arceus",
  "Victini",
  "Keldeo",
  "Meloetta",
  "Genesect",
]);

export function isLegendaryOrUniqueSpecies(nameOrSlug: string) {
  const normalized = normalizeName(nameOrSlug);
  return LEGENDARY_SPECIES.has(normalized) || UNIQUE_SPECIES.has(normalized);
}
