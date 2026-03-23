import { type ParsedDocs } from "@/lib/docsSchema";
import {
  findWorldArea,
  findWorldGifts,
  findWorldItems,
  findWorldTrades,
  type WorldArea,
  type WorldData,
} from "@/lib/worldDataSchema";
import { ROLE_LABELS } from "@/lib/domain/roleLabels";
import type { RoleId } from "@/lib/domain/roleAnalysis";
import { getTypeEffectiveness } from "@/lib/domain/typeChart";

export type StarterKey = "snivy" | "tepig" | "oshawott";
export type PokemonGender = "unknown" | "male" | "female";

export type TeamMember = {
  id: string;
  species: string;
  source: string;
  reason: string;
  role: string;
  canonicalRole: RoleId;
  roleLabel: string;
  teamFitNote: string;
  roleReason: string;
  area?: string;
};

type CuratedRecommendation = Pick<TeamMember, "species" | "source" | "reason" | "role" | "area">;

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
  starterSummary: string;
  recommendedTeam: TeamMember[];
  notes: string[];
  currentBuildAdvice: string[];
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
};

const DEFAULT_RECOMMENDATION_FILTERS: RecommendationFilters = {
  excludeLegendaries: false,
  excludePseudoLegendaries: false,
  excludeUniquePokemon: false,
  excludeOtherStarters: false,
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

const curatedByStarter: Record<StarterKey, Record<string, CuratedRecommendation[]>> = {
  snivy: {
    opening: [
      {
        species: "Starly",
        source: "Wild",
        area: "Route 19",
        role: "revenge killer",
        reason: "Aporta presión inmediata contra Bugs y ayuda a estabilizar el early game.",
      },
      {
        species: "Azurill",
        source: "Wild",
        area: "Floccesy Ranch",
        role: "fairy utility",
        reason: "Cubre Dragón y ofrece un pivot más seguro para Snivy.",
      },
    ],
    floccesy: [
      {
        species: "Riolu",
        source: "Wild",
        area: "Floccesy Ranch",
        role: "physical breaker",
        reason: "Castiga Ice y Steel, dos respuestas comunes al core de Serperior.",
      },
      {
        species: "Pansear",
        source: "Gift",
        area: "Floccesy Town",
        role: "fire coverage",
        reason: "El mono de regalo parchea temprano el matchup contra Bugs y Grass resistentes.",
      },
      {
        species: "Ralts",
        source: "Wild",
        area: "Route 20 - Spring",
        role: "special support",
        reason: "Da utility y presión especial para no depender solo del starter.",
      },
    ],
    virbank: [
      {
        species: "Charmander",
        source: "Gift",
        area: "Virbank City",
        role: "special breaker",
        reason: "Escala muy bien y castiga muros físicos que aguanten a Serperior.",
      },
      {
        species: "Magnemite",
        source: "Wild",
        area: "Virbank Complex",
        role: "steel pivot",
        reason: "Aguanta varias amenazas y da resistencias clave al equipo.",
      },
    ],
    castelia: [
      {
        species: "Eevee",
        source: "Gift",
        area: "Castelia City",
        role: "flex slot",
        reason: "Te deja pivotear a la eeveelution que mejor tape lo que falte.",
      },
      {
        species: "Togepi",
        source: "Trade",
        area: "Route 4",
        role: "support fairy",
        reason: "El trade ya viene optimizado y encaja perfecto como glue defensivo.",
      },
    ],
  },
  tepig: {
    opening: [
      {
        species: "Marill",
        source: "Wild",
        area: "Route 19",
        role: "water pivot",
        reason: "Reduce la presión rival sobre Tepig y ofrece utilidad defensiva.",
      },
      {
        species: "Pansage",
        source: "Gift",
        area: "Floccesy Town",
        role: "grass coverage",
        reason: "El mono de regalo cubre Water y Ground desde muy temprano.",
      },
    ],
    floccesy: [
      {
        species: "Mareep",
        source: "Wild",
        area: "Floccesy Ranch",
        role: "electric support",
        reason: "Controla Water/Flying y permite jugar más agresivo con Tepig.",
      },
      {
        species: "Ralts",
        source: "Wild",
        area: "Route 20 - Spring",
        role: "special cleaner",
        reason: "Compensa la orientación física del starter y mejora el balance ofensivo.",
      },
      {
        species: "Riolu",
        source: "Wild",
        area: "Floccesy Ranch",
        role: "priority breaker",
        reason: "Forma un early core ofensivo muy difícil de pivotear.",
      },
    ],
    virbank: [
      {
        species: "Squirtle",
        source: "Gift",
        area: "Virbank City",
        role: "bulky water",
        reason: "Aporta un switch-in mucho más estable para Ground y Fire.",
      },
      {
        species: "Magnemite",
        source: "Wild",
        area: "Virbank Complex",
        role: "steel electric",
        reason: "Sujeta la defensa del equipo y presiona amenazas voladoras.",
      },
    ],
    castelia: [
      {
        species: "Eevee",
        source: "Gift",
        area: "Castelia City",
        role: "adaptive slot",
        reason: "Puede cerrarte huecos concretos según el punto del run.",
      },
      {
        species: "Togepi",
        source: "Trade",
        area: "Route 4",
        role: "speed control support",
        reason: "Un Fairy de soporte le da a Emboar margen para entrar más veces.",
      },
    ],
  },
  oshawott: {
    opening: [
      {
        species: "Pidove",
        source: "Wild",
        area: "Route 20 - Spring",
        role: "fast flyer",
        reason: "Te da velocidad y presión sobre Grass cuando Oshawott todavía es corto de cobertura.",
      },
      {
        species: "Pansear",
        source: "Gift",
        area: "Floccesy Town",
        role: "fire pressure",
        reason: "El regalo arregla inmediatamente el matchup contra Grass y Bug.",
      },
    ],
    floccesy: [
      {
        species: "Mareep",
        source: "Wild",
        area: "Floccesy Ranch",
        role: "electric support",
        reason: "Cubre Water/Flying y ayuda a acelerar midgame.",
      },
      {
        species: "Ralts",
        source: "Wild",
        area: "Route 20 - Spring",
        role: "special breaker",
        reason: "Suma presión especial y utility a un núcleo balanceado.",
      },
      {
        species: "Riolu",
        source: "Wild",
        area: "Floccesy Ranch",
        role: "physical pressure",
        reason: "Forma un doble Fighting muy fuerte al evolucionar Samurott.",
      },
    ],
    virbank: [
      {
        species: "Bulbasaur",
        source: "Gift",
        area: "Virbank City",
        role: "grass utility",
        reason: "Tapa Electric y Water bulky sin romper la estructura del equipo.",
      },
      {
        species: "Magnemite",
        source: "Wild",
        area: "Virbank Complex",
        role: "steel pivot",
        reason: "Agrega resistencias claves y presión especial estable.",
      },
    ],
    castelia: [
      {
        species: "Eevee",
        source: "Gift",
        area: "Castelia City",
        role: "glue slot",
        reason: "Sirve para ajustar la sexta pieza según tus capturas previas.",
      },
      {
        species: "Togepi",
        source: "Trade",
        area: "Route 4",
        role: "fairy support",
        reason: "Soporta al core Water/Fighting con utilidad y matchups de Dragon.",
      },
    ],
  },
};

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

const natureMap: Record<string, string[]> = {
  adamant: ["physical attacker", "evita depender de daño especial."],
  jolly: ["speed control", "prioriza limpieza y revenge kills."],
  modest: ["special attacker", "busca cobertura especial consistente."],
  timid: ["fast special attacker", "aprovecha turnos gratis y chip."],
  bold: ["physical wall", "entra más veces y gana valor por desgaste."],
  calm: ["special wall", "encaja mejor en núcleos balanceados."],
  impish: ["bulky pivot", "mejor para utility que para barrer."],
  careful: ["special sponge", "combina bien con soporte y recovery."],
};

function buildSources(
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

function normalizeRecommendationName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function inferCanonicalRole(rawRole: string): RoleId {
  const normalized = normalizeRecommendationName(rawRole);

  if (
    normalized.includes("pivot") ||
    normalized.includes("bulky water")
  ) {
    return "bulkyPivot";
  }
  if (
    normalized.includes("support") ||
    normalized.includes("utility")
  ) {
    return "support";
  }
  if (
    normalized.includes("glue")
  ) {
    return "defensiveGlue";
  }
  if (
    normalized.includes("revenge") ||
    normalized.includes("priority")
  ) {
    return "revengeKiller";
  }
  if (
    normalized.includes("speed")
  ) {
    return "speedControl";
  }
  if (
    normalized.includes("cleaner") ||
    normalized.includes("fast flyer")
  ) {
    return "cleaner";
  }
  if (
    normalized.includes("setup")
  ) {
    return "setupSweeper";
  }

  return "wallbreaker";
}

function resolveDocTypes(docs: ParsedDocs, species: string) {
  const normalized = normalizeRecommendationName(species);
  const profileTypes = docs.pokemonProfiles.find(
    (entry) => normalizeRecommendationName(entry.species) === normalized
  )?.types;
  if (profileTypes?.length) {
    return profileTypes;
  }
  const typeChange = docs.typeChanges.find(
    (entry) => normalizeRecommendationName(entry.pokemon) === normalized
  );
  return typeChange?.newType.split("/").map((value) => value.trim()) ?? [];
}

function buildEvolutionFamilyMap(docs: ParsedDocs) {
  const graph = new Map<string, Set<string>>();
  const link = (left: string, right: string) => {
    const normalizedLeft = normalizeRecommendationName(left);
    const normalizedRight = normalizeRecommendationName(right);
    if (!normalizedLeft || !normalizedRight) {
      return;
    }
    graph.set(normalizedLeft, new Set([...(graph.get(normalizedLeft) ?? []), normalizedRight]));
    graph.set(normalizedRight, new Set([...(graph.get(normalizedRight) ?? []), normalizedLeft]));
  };

  for (const change of docs.evolutionChanges) {
    link(change.species, change.target);
  }

  for (const starter of Object.values(starters)) {
    for (let index = 0; index < starter.stageSpecies.length - 1; index += 1) {
      link(starter.stageSpecies[index], starter.stageSpecies[index + 1]);
    }
  }

  return graph;
}

function buildEvolutionFamilySet(
  species: string,
  graph: Map<string, Set<string>>
) {
  const origin = normalizeRecommendationName(species);
  const visited = new Set<string>();
  const queue = [origin];

  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const next of graph.get(current) ?? []) {
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return visited;
}

function scoreCandidateFit({
  docs,
  starter,
  candidate,
  currentTypeSet,
  currentRoleSet,
}: {
  docs: ParsedDocs;
  starter: StarterKey;
  candidate: CuratedRecommendation;
  currentTypeSet: Set<string>;
  currentRoleSet: Set<string>;
}) {
  const candidateTypes = resolveDocTypes(docs, candidate.species);
  const normalizedCandidateTypes = candidateTypes.map((type) => normalizeRecommendationName(type));
  const newTypeCount = normalizedCandidateTypes.filter((type) => !currentTypeSet.has(type)).length;
  const duplicateTypeCount = normalizedCandidateTypes.length - newTypeCount;
  const preferredMatches = candidateTypes.filter((type) =>
    starters[starter].preferredTypes.some(
      (preferred) => normalizeRecommendationName(preferred) === normalizeRecommendationName(type)
    )
  ).length;
  const avoidResists = starters[starter].avoidTypes.filter((attackType) =>
    candidateTypes.length > 0 && getTypeEffectiveness(attackType, candidateTypes) < 1
  ).length;
  const avoidWeaknesses = starters[starter].avoidTypes.filter((attackType) =>
    candidateTypes.length > 0 && getTypeEffectiveness(attackType, candidateTypes) > 1
  ).length;
  const bst =
    docs.pokemonProfiles.find(
      (entry) => normalizeRecommendationName(entry.species) === normalizeRecommendationName(candidate.species)
    )?.stats?.bst ?? 360;
  const normalizedRole = normalizeRecommendationName(ROLE_LABELS[inferCanonicalRole(candidate.role)]);
  const addsRoleVariety = normalizedRole && !currentRoleSet.has(normalizedRole);

  return (
    newTypeCount * 20 -
    duplicateTypeCount * 6 +
    preferredMatches * 10 +
    avoidResists * 14 -
    avoidWeaknesses * 12 +
    Math.max(0, Math.min(18, Math.round((bst - 320) / 12))) +
    (addsRoleVariety ? 10 : -4)
  );
}

function buildRoleFitExplanation(rawRole: string, currentRoleSet: Set<string>) {
  const canonicalRole = inferCanonicalRole(rawRole);
  const canonicalLabel = ROLE_LABELS[canonicalRole];
  const normalizedCanonical = normalizeRecommendationName(canonicalLabel);
  const coversMissingRole = !currentRoleSet.has(normalizedCanonical);

  return {
    canonicalRole,
    roleLabel: canonicalLabel,
    teamFitNote: coversMissingRole
      ? `Cubre el hueco de ${canonicalLabel} que tu comp todavia no enseña bien.`
      : `No abre un rol nuevo; compite con otro ${canonicalLabel} que ya tienes.`,
    roleReason: coversMissingRole
      ? `${rawRole} suma variedad funcional a la comp actual.`
      : `${rawRole} sirve mas como ajuste fino que como pieza estructural nueva.`,
  };
}

function inferCurrentTeamRoles(currentTeam: SuggestionInput[]) {
  const roles = new Set<string>();

  for (const member of currentTeam) {
    const normalizedNature = normalizeRecommendationName(member.nature);
    const normalizedMoves = member.moves.map((move) => normalizeRecommendationName(move));
    const normalizedAbility = normalizeRecommendationName(member.ability);

    if (normalizedNature === "jolly" || normalizedNature === "timid") {
      roles.add(normalizeRecommendationName(ROLE_LABELS.cleaner));
      roles.add(normalizeRecommendationName(ROLE_LABELS.speedControl));
    }
    if (normalizedNature === "adamant" || normalizedNature === "modest") {
      roles.add(normalizeRecommendationName(ROLE_LABELS.wallbreaker));
    }
    if (normalizedNature === "bold" || normalizedNature === "calm" || normalizedNature === "impish" || normalizedNature === "careful") {
      roles.add(normalizeRecommendationName(ROLE_LABELS.bulkyPivot));
      roles.add(normalizeRecommendationName(ROLE_LABELS.defensiveGlue));
    }

    if (normalizedMoves.some((move) => ["thunder wave", "tailwind", "icy wind", "rock tomb"].includes(move))) {
      roles.add(normalizeRecommendationName(ROLE_LABELS.speedControl));
      roles.add(normalizeRecommendationName(ROLE_LABELS.support));
    }
    if (normalizedMoves.some((move) => ["u turn", "volt switch", "wish", "protect", "recover", "roost"].includes(move))) {
      roles.add(normalizeRecommendationName(ROLE_LABELS.bulkyPivot));
    }
    if (normalizedMoves.some((move) => ["swords dance", "dragon dance", "calm mind", "nasty plot", "quiver dance", "bulk up"].includes(move))) {
      roles.add(normalizeRecommendationName(ROLE_LABELS.setupSweeper));
    }
    if (normalizedMoves.some((move) => ["mach punch", "aqua jet", "ice shard", "bullet punch", "shadow sneak"].includes(move))) {
      roles.add(normalizeRecommendationName(ROLE_LABELS.revengeKiller));
    }
    if (normalizedMoves.some((move) => ["stealth rock", "spikes", "reflect", "light screen", "toxic", "leech seed"].includes(move))) {
      roles.add(normalizeRecommendationName(ROLE_LABELS.support));
      roles.add(normalizeRecommendationName(ROLE_LABELS.defensiveGlue));
    }

    if (normalizedAbility.includes("intimidate")) {
      roles.add(normalizeRecommendationName(ROLE_LABELS.bulkyPivot));
      roles.add(normalizeRecommendationName(ROLE_LABELS.defensiveGlue));
    }
    if (normalizedAbility.includes("sheer force") || normalizedAbility.includes("moxie") || normalizedAbility.includes("adaptability")) {
      roles.add(normalizeRecommendationName(ROLE_LABELS.wallbreaker));
    }
  }

  return roles;
}

function gatherCurated(
  docs: ParsedDocs,
  starter: StarterKey,
  milestoneId: string,
  currentTeam: SuggestionInput[],
  filters: RecommendationFilters,
) {
  const timeline = ["opening", "floccesy", "virbank", "castelia"];
  const maxIndex = timeline.indexOf(milestoneId);
  const evolutionGraph = buildEvolutionFamilyMap(docs);
  const currentSpecies = currentTeam
    .map((member) => member.species.trim())
    .filter(Boolean);
  const currentTypeSet = new Set(
    currentSpecies.flatMap((species) =>
      resolveDocTypes(docs, species).map((type) => normalizeRecommendationName(type))
    )
  );
  const currentSpeciesSet = new Set(currentSpecies.map((species) => normalizeRecommendationName(species)));
  const currentFamilySet = new Set(
    currentSpecies.flatMap((species) => [...buildEvolutionFamilySet(species, evolutionGraph)])
  );
  const starterFamily = new Set(
    starters[starter].stageSpecies.map((species) => normalizeRecommendationName(species)),
  );
  const currentRoleSet = inferCurrentTeamRoles(currentTeam);
  const candidates: (CuratedRecommendation & { stageId: string; fitScore: number })[] = [];

  if (maxIndex < 0) {
    return [];
  }

  for (const stageId of timeline.slice(0, maxIndex + 1)) {
    for (const member of curatedByStarter[starter][stageId] ?? []) {
      const normalizedSpecies = normalizeRecommendationName(member.species);
      const candidateFamily = buildEvolutionFamilySet(member.species, evolutionGraph);
      if (
        !isRecommendationSpeciesAllowed(
          member.species,
          starterFamily,
          filters,
          member.source === "Gift" || member.source === "Trade",
        ) ||
        candidates.some(
          (existing) => normalizeRecommendationName(existing.species) === normalizedSpecies
        ) ||
        currentSpeciesSet.has(normalizedSpecies) ||
        [...candidateFamily].some((species) => currentFamilySet.has(species))
      ) {
        continue;
      }
      const fitScore = scoreCandidateFit({
        docs,
        starter,
        candidate: member,
        currentTypeSet,
        currentRoleSet,
      });
      candidates.push({
        ...member,
        stageId,
        fitScore,
      });
    }
  }

  return candidates
    .sort(
      (left, right) =>
        right.fitScore - left.fitScore ||
        left.stageId.localeCompare(right.stageId) ||
        left.species.localeCompare(right.species)
    )
    .slice(0, 6)
    .map((member) => {
      const roleFit = buildRoleFitExplanation(member.role, currentRoleSet);
      return {
        id: `${member.stageId}-${member.species.toLowerCase()}`,
        species: member.species,
        source: member.source,
        role: member.role,
        canonicalRole: roleFit.canonicalRole,
        roleLabel: roleFit.roleLabel,
        teamFitNote: roleFit.teamFitNote,
        roleReason: roleFit.roleReason,
        reason: member.reason,
        area: member.area,
      };
    });
}

function isRecommendationSpeciesAllowed(
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

function inferAdvice(input: SuggestionInput) {
  const advice: string[] = [];
  const normalizedNature = input.nature.toLowerCase().trim();
  const normalizedAbility = input.ability.toLowerCase().trim();
  const normalizedMoves = input.moves.map((move) => move.toLowerCase().trim()).filter(Boolean);

  if (natureMap[normalizedNature]) {
    advice.push(
      `${input.species}: naturaleza ${input.nature} apunta a ${natureMap[normalizedNature][0]}; ${natureMap[normalizedNature][1]}`
    );
  }

  if (normalizedAbility.includes("contrary")) {
    advice.push(`${input.species}: si usas Contrary, prioriza boosts invertidos y presión de snowball.`);
  }
  if (normalizedAbility.includes("sheer force")) {
    advice.push(`${input.species}: Sheer Force pide cobertura ofensiva y objetos que no te obliguen a pivotear mucho.`);
  }
  if (normalizedAbility.includes("intimidate")) {
    advice.push(`${input.species}: con Intimidate vale más entrar, forzar cambios y repartir utility.`);
  }
  if (normalizedAbility.includes("serene grace")) {
    advice.push(`${input.species}: Serene Grace premia moves con efectos secundarios; úsalo como glue y no solo como daño plano.`);
  }

  const supportMoves = ["toxic", "thunder wave", "reflect", "light screen", "leech seed", "wish", "protect"];
  const setupMoves = ["calm mind", "dragon dance", "bulk up", "swords dance", "nasty plot", "quiver dance"];
  const priorityMoves = ["bullet punch", "accelerock", "mach punch", "aqua jet", "ice shard"];

  if (normalizedMoves.some((move) => supportMoves.includes(move))) {
    advice.push(`${input.species}: ya tiene herramientas de soporte; conviene que el resto del equipo cargue con el daño complementario.`);
  }
  if (normalizedMoves.some((move) => setupMoves.includes(move))) {
    advice.push(`${input.species}: el set ya insinúa win condition; protégelo con pivots y control de velocidad.`);
  }
  if (normalizedMoves.some((move) => priorityMoves.includes(move))) {
    advice.push(`${input.species}: la prioridad te permite jugar más agresivo al repartir roles ofensivos.`);
  }

  return advice;
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
  const recommendedTeam = gatherCurated(docs, starter, milestone.id, currentTeam, filters);
  const currentBuildAdvice = currentTeam.flatMap(inferAdvice);
  const notes = [
    `${currentStarterStage} funciona mejor si el resto del equipo cubre ${starters[starter].avoidTypes.join(", ")}.`,
    `En ${milestone.checkpoint} la prioridad es ${milestone.focus.join(" y ")}.`,
    `Revisa objetos redistribuidos en las zonas activas: Redux mueve power spikes muy temprano.`,
  ];

  return {
    starterSummary: starters[starter].headline,
    recommendedTeam,
    notes,
    currentBuildAdvice,
    availableSources: buildSources(docs, milestone.areas, starter, filters),
  };
}
