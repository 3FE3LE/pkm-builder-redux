export type WorldGift = {
  name: string;
  location: string;
  level: string;
  notes: string[];
};

export type WorldTrade = {
  name: string;
  location: string;
  requested: string;
  received: string;
  traits: string[];
};

export type WorldItemLocation = {
  area: string;
  items: string[];
};

export type WorldEncounter = {
  species: string;
  level: string;
  rate?: string | null;
};

export type WorldMethod = {
  method: string;
  encounters: WorldEncounter[];
};

export type WorldArea = {
  area: string;
  methods: WorldMethod[];
};

export type WorldData = {
  gifts: WorldGift[];
  trades: WorldTrade[];
  items: WorldItemLocation[];
  wildAreas: WorldArea[];
};

export function normalizeWorldName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findWorldArea(areas: WorldArea[], name: string) {
  const wanted = normalizeWorldName(name);
  return areas.find((area) => normalizeWorldName(area.area) === wanted);
}

export function findWorldGifts(gifts: WorldGift[], locationIncludes: string) {
  const wanted = normalizeWorldName(locationIncludes);
  return gifts.filter((gift) => normalizeWorldName(gift.location).includes(wanted));
}

export function findWorldTrades(trades: WorldTrade[], locationIncludes: string) {
  const wanted = normalizeWorldName(locationIncludes);
  return trades.filter((trade) => normalizeWorldName(trade.location).includes(wanted));
}

export function findWorldItems(items: WorldItemLocation[], areaName: string) {
  const wanted = normalizeWorldName(areaName);
  return items.find((item) => normalizeWorldName(item.area) === wanted);
}
