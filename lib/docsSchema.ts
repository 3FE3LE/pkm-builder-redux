export type MoveReplacement = {
  oldMove: string;
  newMove: string;
};

export type MoveTypeOverride = {
  move: string;
  from: string;
  to: string;
};

export type MoveFieldChange = {
  field: string;
  from: string;
  to: string;
  tag?: string;
};

export type MoveDetail = {
  move: string;
  changes: MoveFieldChange[];
};

export type PokemonTypeChange = {
  dex: string;
  pokemon: string;
  oldType: string;
  newType: string;
  justification: string;
};

export type GiftPokemon = {
  name: string;
  location: string;
  level: string;
  notes: string[];
};

export type TradePokemon = {
  name: string;
  location: string;
  requested: string;
  received: string;
  traits: string[];
};

export type WildEncounter = {
  species: string;
  level: string;
  rate?: string;
};

export type WildMethod = {
  method: string;
  encounters: WildEncounter[];
};

export type WildArea = {
  area: string;
  methods: WildMethod[];
};

export type ItemLocation = {
  area: string;
  items: string[];
};

export type BaseStats = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  bst: number;
};

export type PokemonProfile = {
  dex: number;
  species: string;
  types?: string[];
  stats?: BaseStats;
  abilities?: string[];
};

export type EvolutionChange = {
  dex: number;
  species: string;
  target: string;
  method: string;
  summary: string;
};

export type ParsedDocs = {
  moveReplacements: MoveReplacement[];
  moveTypeChanges: string[];
  moveTypeOverrides: MoveTypeOverride[];
  moveDetails: MoveDetail[];
  typeChanges: PokemonTypeChange[];
  itemLocations: ItemLocation[];
  itemHighlights: string[];
  gifts: GiftPokemon[];
  trades: TradePokemon[];
  wildAreas: WildArea[];
  pokemonProfiles: PokemonProfile[];
  evolutionChanges: EvolutionChange[];
};

function normalizeName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findArea(areas: WildArea[], name: string) {
  const wanted = normalizeName(name);
  return areas.find((area) => normalizeName(area.area) === wanted);
}

export function findGift(gifts: GiftPokemon[], locationIncludes: string) {
  const wanted = normalizeName(locationIncludes);
  return gifts.filter((gift) => normalizeName(gift.location).includes(wanted));
}

export function findTrade(trades: TradePokemon[], locationIncludes: string) {
  const wanted = normalizeName(locationIncludes);
  return trades.filter((trade) => normalizeName(trade.location).includes(wanted));
}

export function findItemLocation(itemLocations: ItemLocation[], areaName: string) {
  const wanted = normalizeName(areaName);
  return itemLocations.find((itemLocation) => normalizeName(itemLocation.area) === wanted);
}
