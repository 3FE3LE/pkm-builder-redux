import { type ParsedDocs } from "./docsSchema";
import {
  findWorldArea,
  findWorldGifts,
  findWorldItems,
  findWorldTrades,
  type WorldArea,
  type WorldData,
} from "./worldDataSchema";

export type StarterKey = "snivy" | "tepig" | "oshawott";
export type PokemonGender = "unknown" | "male" | "female";

export type Milestone = {
  id: string;
  label: string;
  checkpoint: string;
  areas: string[];
  focus: string[];
};

export type SuggestionInput = {
  species: string;
  nickname: string;
  locked?: boolean;
  level: number;
  gender: PokemonGender;
  nature: string;
  ability: string;
  item: string;
  moves: string[];
};

export type RecommendationOutput = {
  notes: string[];
  availableSources: {
    area: string;
    encounters: string[];
    gifts: string[];
    trades: string[];
    items: string[];
  }[];
};

export type RecommendationFilters = {
  excludeLegendaries: boolean;
  excludePseudoLegendaries: boolean;
  excludeUniquePokemon: boolean;
  excludeOtherStarters: boolean;
  excludeExactTypeDuplicates: boolean;
};

const DEFAULT_RECOMMENDATION_FILTERS: RecommendationFilters = {
  excludeLegendaries: false,
  excludePseudoLegendaries: false,
  excludeUniquePokemon: false,
  excludeOtherStarters: false,
  excludeExactTypeDuplicates: false,
};

export const starters: Record<
  StarterKey,
  {
    species: string;
    stageSpecies: string[];
    headline: string;
    preferredTypes: string[];
    avoidTypes: string[];
    rolePlan: string[];
    abilityNotes: string[];
  }
> = {
  snivy: {
    species: "Snivy",
    stageSpecies: ["Snivy", "Servine", "Serperior"],
    headline: "Control de tempo con Serperior Grass/Dragon y setup orientado a snowball.",
    preferredTypes: ["Fire", "Water", "Steel", "Fairy", "Flying", "Ground"],
    avoidTypes: ["Ice", "Bug", "Dragon"],
    rolePlan: ["speed control", "special breaker", "steel pivot", "ground immunity", "priority"],
    abilityNotes: ["Contrary convierte boosts invertidos en valor inmediato.", "Aprovecha moves de utility con presión constante."],
  },
  tepig: {
    species: "Tepig",
    stageSpecies: ["Tepig", "Pignite", "Emboar"],
    headline: "Nucleo de wallbreaking fisico con Emboar Fire/Ground y presión inmediata.",
    preferredTypes: ["Water", "Grass", "Electric", "Flying", "Psychic", "Fairy"],
    avoidTypes: ["Water", "Ground"],
    rolePlan: ["wallbreaker", "speed control", "water check", "special sponge", "late cleaner"],
    abilityNotes: ["Sheer Force empuja sets ofensivos y castiga cambios pasivos.", "Necesita partners que cubran Water y Ground pronto."],
  },
  oshawott: {
    species: "Oshawott",
    stageSpecies: ["Oshawott", "Dewott", "Samurott"],
    headline: "Core balanceado con Samurott Water/Fighting que mezcla presión y utility.",
    preferredTypes: ["Electric", "Grass", "Flying", "Fairy", "Ground", "Dark"],
    avoidTypes: ["Electric", "Grass", "Psychic", "Flying"],
    rolePlan: ["bulky attacker", "electric immunity", "special attacker", "revenge killer", "status pivot"],
    abilityNotes: ["Shell Armor facilita una línea consistente en la historia.", "Samurott agradece soporte de velocidad y cobertura especial."],
  },
};

export const milestones: Milestone[] = [
  {
    id: "opening",
    label: "Inicio",
    checkpoint: "Antes de Cheren",
    areas: ["Aspertia City", "Route 19"],
    focus: ["capturar base temprana", "asegurar cobertura inicial"],
  },
  {
    id: "floccesy",
    label: "Floccesy",
    checkpoint: "Antes de Roxie",
    areas: ["Route 20 - Spring", "Floccesy Ranch", "Floccesy Town"],
    focus: ["sumar segundo y tercer slot", "encender sinergia con el inicial"],
  },
  {
    id: "virbank",
    label: "Virbank",
    checkpoint: "Antes de Burgh",
    areas: ["Virbank City", "Virbank Complex"],
    focus: ["cerrar core de cuatro", "buscar item spikes"],
  },
  {
    id: "castelia",
    label: "Castelia",
    checkpoint: "Antes de Elesa",
    areas: ["Castelia City", "Castelia Sewers", "Route 4"],
    focus: ["terminar seis slots", "cubrir matchups de midgame"],
  },
];

const LEGENDARY_SPECIES = new Set(
  [
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
  ].map(normalizeRecommendationName),
);

const UNIQUE_SPECIES = new Set(
  [
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
  ].map(normalizeRecommendationName),
);

const PSEUDO_LEGENDARY_SPECIES = new Set(
  [
    "Dratini",
    "Dragonair",
    "Dragonite",
    "Larvitar",
    "Pupitar",
    "Tyranitar",
    "Bagon",
    "Shelgon",
    "Salamence",
    "Beldum",
    "Metang",
    "Metagross",
    "Gible",
    "Gabite",
    "Garchomp",
    "Deino",
    "Zweilous",
    "Hydreigon",
  ].map(normalizeRecommendationName),
);

const OFF_STARTER_SPECIES = new Set(
  [
    "Bulbasaur",
    "Ivysaur",
    "Venusaur",
    "Charmander",
    "Charmeleon",
    "Charizard",
    "Squirtle",
    "Wartortle",
    "Blastoise",
    "Chikorita",
    "Bayleef",
    "Meganium",
    "Cyndaquil",
    "Quilava",
    "Typhlosion",
    "Totodile",
    "Croconaw",
    "Feraligatr",
    "Treecko",
    "Grovyle",
    "Sceptile",
    "Torchic",
    "Combusken",
    "Blaziken",
    "Mudkip",
    "Marshtomp",
    "Swampert",
    "Turtwig",
    "Grotle",
    "Torterra",
    "Chimchar",
    "Monferno",
    "Infernape",
    "Piplup",
    "Prinplup",
    "Empoleon",
    "Snivy",
    "Servine",
    "Serperior",
    "Tepig",
    "Pignite",
    "Emboar",
    "Oshawott",
    "Dewott",
    "Samurott",
  ].map(normalizeRecommendationName),
);

export function buildAreaSources(
  docs: ParsedDocs,
  areas: string[],
  starter: StarterKey,
  filters: RecommendationFilters,
) {
  const worldData = (docs as ParsedDocs & { worldData?: WorldData }).worldData;
  const starterFamily = new Set(
    starters[starter].stageSpecies.map((species) => normalizeRecommendationName(species)),
  );
  return areas.map((areaName) => {
    const area = worldData ? findWorldArea(worldData.wildAreas, areaName) : undefined;
    const gifts = worldData
      ? findWorldGifts(worldData.gifts, areaName).filter((gift) =>
          isRecommendationSpeciesAllowed(gift.name, starterFamily, filters, true),
        )
      : [];
    const trades = worldData
      ? findWorldTrades(worldData.trades, areaName).filter((trade) =>
          isRecommendationSpeciesAllowed(trade.received, starterFamily, filters, true),
        )
      : [];
    const items = worldData ? findWorldItems(worldData.items, areaName) : undefined;
    return {
      area: areaName,
      encounters: summarizeEncounters(area).filter((encounter) =>
        isRecommendationSpeciesAllowed(encounter.species, starterFamily, filters, false),
      ).map((encounter) => `${encounter.species} (${encounter.method})`),
      gifts: gifts.map((gift) => gift.name),
      trades: trades.map((trade) => `${trade.received} for ${trade.requested}`),
      items: items?.items.slice(0, 5) ?? [],
    };
  });
}

function summarizeEncounters(area?: WorldArea) {
  if (!area) {
    return [];
  }
  return area.methods
    .flatMap((method: WorldArea["methods"][number]) =>
      method.encounters
        .slice(0, 4)
        .map((encounter: WorldArea["methods"][number]["encounters"][number]) => ({
          species: encounter.species,
          method: method.method,
        }))
    )
    .slice(0, 8);
}

export function normalizeRecommendationName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isRecommendationSpeciesAllowed(
  species: string,
  starterFamily: Set<string>,
  filtersInput: RecommendationFilters | undefined,
  _isUniqueSource: boolean,
) {
  const filters = filtersInput ?? DEFAULT_RECOMMENDATION_FILTERS;
  const normalized = normalizeRecommendationName(species);
  if (!normalized) {
    return true;
  }

  if (filters.excludeLegendaries && LEGENDARY_SPECIES.has(normalized)) {
    return false;
  }
  if (filters.excludePseudoLegendaries && PSEUDO_LEGENDARY_SPECIES.has(normalized)) {
    return false;
  }
  if (filters.excludeUniquePokemon && UNIQUE_SPECIES.has(normalized)) {
    return false;
  }
  if (filters.excludeOtherStarters && OFF_STARTER_SPECIES.has(normalized) && !starterFamily.has(normalized)) {
    return false;
  }

  return true;
}
export function getRecommendation(
  docs: ParsedDocs,
  starter: StarterKey,
  milestoneId: string,
  currentTeam: SuggestionInput[],
  filters: RecommendationFilters = DEFAULT_RECOMMENDATION_FILTERS,
): RecommendationOutput {
  const milestone = milestones.find((item) => item.id === milestoneId) ?? milestones[0];
  const starterFamily = new Set(
    starters[starter].stageSpecies.map((species) => normalizeRecommendationName(species))
  );
  const currentStarterStage =
    currentTeam
      .map((member) => member.species.trim())
      .find((species) => starterFamily.has(normalizeRecommendationName(species))) ??
    starters[starter].species;
  const notes = [
    `${currentStarterStage} funciona mejor si el resto del equipo cubre ${starters[starter].avoidTypes.join(", ")}.`,
    `En ${milestone.checkpoint} la prioridad es ${milestone.focus.join(" y ")}.`,
    `Revisa objetos redistribuidos en las zonas activas: Redux mueve power spikes muy temprano.`,
  ];

  return {
    notes,
    availableSources: buildAreaSources(docs, milestone.areas, starter, filters),
  };
}
