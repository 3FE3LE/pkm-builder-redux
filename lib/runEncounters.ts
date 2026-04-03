export type RunMode = "challenge";

export type EncounterCategory =
  | "gym"
  | "hoenn"
  | "storyBoss"
  | "league"
  | "facility"
  | "postgame";

export type EncounterDocumentation = "documented" | "partial";

export type EncounterAffiliation =
  | "unova-league"
  | "hoenn-leaders"
  | "team-plasma"
  | "rival"
  | "independent"
  | "facility"
  | "postgame";

export type RunEncounterBoss = {
  label: string;
  trainerSpriteUrl?: string | null;
  team: string[];
};

export type RunEncounterDefinition = {
  id: string;
  order: number;
  label: string;
  category: EncounterCategory;
  affiliation: EncounterAffiliation;
  trainerSpriteUrl?: string | null;
  team?: string[];
  bosses?: RunEncounterBoss[];
  mode: RunMode;
  mandatory: boolean;
  levelCap: number;
  documentation: EncounterDocumentation;
};

export const challengeRunEncounters: RunEncounterDefinition[] = [
  {
    id: "hugh-1",
    order: 1,
    label: "Hugh",
    category: "storyBoss",
    affiliation: "rival",
    bosses: [
      {
        label: "If you picked Oshawott",
        team: ["Taillow", "Snivy", "Panpour"],
      },
      {
        label: "If you picked Tepig",
        team: ["Taillow", "Oshawott", "Pansear"],
      },
      {
        label: "If you picked Snivy",
        team: ["Taillow", "Tepig", "Pansage"],
      },
    ],
    mode: "challenge",
    mandatory: true,
    levelCap: 11,
    documentation: "documented",
  },
  { id: "roxanne", order: 2, label: "Roxanne", category: "hoenn", affiliation: "hoenn-leaders", team: ["Anorith", "Lileep", "Nosepass", "Archen"], mode: "challenge", mandatory: false, levelCap: 13, documentation: "documented" },
  { id: "cheren", order: 3, label: "Cheren", category: "gym", affiliation: "unova-league", team: ["Porygon", "Lillipup", "Doduo", "Aipom", "Deerling", "Munchlax"], mode: "challenge", mandatory: true, levelCap: 14, documentation: "documented" },
  { id: "brawly", order: 4, label: "Brawly", category: "hoenn", affiliation: "hoenn-leaders", team: ["Monferno", "Meditite", "Machop", "Sawk", "Makuhita"], mode: "challenge", mandatory: false, levelCap: 20, documentation: "documented" },
  { id: "roxie", order: 5, label: "Roxie", category: "gym", affiliation: "unova-league", team: ["Trubbish", "Koffing", "Ivysaur", "Qwilfish", "Gastly", "Whirlipede"], mode: "challenge", mandatory: true, levelCap: 21, documentation: "documented" },
  { id: "brycen", order: 6, label: "Brycen", category: "storyBoss", affiliation: "independent", team: ["Snover", "Cryogonal", "Smoochum", "Shellder"], mode: "challenge", mandatory: true, levelCap: 23, documentation: "documented" },
  { id: "wattson", order: 7, label: "Wattson", category: "hoenn", affiliation: "hoenn-leaders", team: ["Jolteon", "Rotom-Frost", "Magneton", "Electabuzz", "Manectric", "Volbeat"], mode: "challenge", mandatory: false, levelCap: 29, documentation: "documented" },
  { id: "burgh", order: 8, label: "Burgh", category: "gym", affiliation: "unova-league", team: ["Mothim", "Masquerain", "Escavalier", "Vespiquen", "Heracross", "Leavanny"], mode: "challenge", mandatory: true, levelCap: 29, documentation: "documented" },
  { id: "colress-1", order: 9, label: "Colress", category: "storyBoss", affiliation: "team-plasma", team: ["Magnemite", "Rotom-Fan", "Klink", "Metang", "Porygon2"], mode: "challenge", mandatory: true, levelCap: 30, documentation: "documented" },
  {
    id: "lenora-hawes",
    order: 10,
    label: "Lenora and Hawes",
    category: "storyBoss",
    affiliation: "independent",
    bosses: [
      {
        label: "Hawes",
        team: ["Gigalith", "Machamp"],
      },
      {
        label: "Lenora",
        team: ["Stoutland", "Unfezant"],
      },
    ],
    mode: "challenge",
    mandatory: true,
    levelCap: 33,
    documentation: "documented",
  },
  { id: "subway-bosses", order: 11, label: "Subway Bosses Ingo and Emmet", category: "facility", affiliation: "facility", mode: "challenge", mandatory: false, levelCap: 36, documentation: "documented" },
  { id: "flannery", order: 12, label: "Flannery", category: "hoenn", affiliation: "hoenn-leaders", team: ["Torkoal", "Magmar", "Houndoom", "Rotom-Heat", "Camerupt", "Magcargo"], mode: "challenge", mandatory: false, levelCap: 37, documentation: "documented" },
  { id: "elesa", order: 13, label: "Elesa", category: "gym", affiliation: "unova-league", team: ["Emolga", "Lanturn", "Electivire", "Raichu", "Stunfisk", "Zebstrika"], mode: "challenge", mandatory: true, levelCap: 38, documentation: "documented" },
  {
    id: "charles",
    order: 14,
    label: "Charles",
    category: "storyBoss",
    affiliation: "independent",
    team: ["Accelgor", "Sigilyph", "Krookodile", "Archeops", "Carracosta", "Basculin"],
    mode: "challenge",
    mandatory: true,
    levelCap: 39,
    documentation: "documented",
  },
  {
    id: "rood",
    order: 15,
    label: "Rood",
    category: "storyBoss",
    affiliation: "team-plasma",
    team: ["Bouffalant", "Zoroark", "Swoobat", "Stoutland", "Chandelure"],
    mode: "challenge",
    mandatory: true,
    levelCap: 41,
    documentation: "documented",
  },
  { id: "norman", order: 16, label: "Norman", category: "hoenn", affiliation: "hoenn-leaders", team: ["Exploud", "Tauros", "Banette", "Zangoose", "Slaking", "Linoone"], mode: "challenge", mandatory: false, levelCap: 44, documentation: "documented" },
  { id: "clay", order: 17, label: "Clay", category: "gym", affiliation: "unova-league", team: ["Seismitoad", "Mamoswine", "Torterra", "Garchomp", "Nidoking", "Excadrill"], mode: "challenge", mandatory: true, levelCap: 45, documentation: "documented" },
  {
    id: "hugh-2",
    order: 18,
    label: "Hugh",
    category: "storyBoss",
    affiliation: "rival",
    bosses: [
      {
        label: "If you picked Tepig",
        team: ["Swellow", "Eelektrik", "Flygon", "Lilligant", "Samurott"],
      },
      {
        label: "If you picked Oshawott",
        team: ["Swellow", "Eelektrik", "Flygon", "Camerupt", "Serperior"],
      },
      {
        label: "If you picked Snivy",
        team: ["Swellow", "Eelektrik", "Flygon", "Starmie", "Emboar"],
      },
    ],
    mode: "challenge",
    mandatory: true,
    levelCap: 47,
    documentation: "documented",
  },
  { id: "colress-2", order: 19, label: "Colress", category: "storyBoss", affiliation: "team-plasma", team: ["MT", "UFO", "F-00", "MT2"], mode: "challenge", mandatory: true, levelCap: 53, documentation: "documented" },
  { id: "juan", order: 20, label: "Juan", category: "hoenn", affiliation: "hoenn-leaders", team: ["Swampert", "Slowking", "Pelipper", "Starmie", "Crawdaunt"], mode: "challenge", mandatory: false, levelCap: 54, documentation: "documented" },
  { id: "skyla", order: 21, label: "Skyla", category: "gym", affiliation: "unova-league", team: ["Jumpluff", "Gliscor", "Pidgeot", "Aerodactyl", "Togekiss", "Swanna"], mode: "challenge", mandatory: true, levelCap: 55, documentation: "documented" },
  { id: "bianca", order: 22, label: "Bianca", category: "storyBoss", affiliation: "independent", mode: "challenge", mandatory: true, levelCap: 56, documentation: "documented" },
  {
    id: "hugh-3",
    order: 23,
    label: "Hugh",
    category: "storyBoss",
    affiliation: "rival",
    bosses: [
      {
        label: "If you picked Tepig",
        team: ["Swellow", "Eelektross", "Flygon", "Lilligant", "Samurott", "Camerupt"],
      },
      {
        label: "If you picked Oshawott",
        team: ["Swellow", "Eelektross", "Flygon", "Camerupt", "Serperior", "Starmie"],
      },
      {
        label: "If you picked Snivy",
        team: ["Swellow", "Eelektross", "Flygon", "Starmie", "Emboar", "Lilligant"],
      },
    ],
    mode: "challenge",
    mandatory: true,
    levelCap: 58,
    documentation: "documented",
  },
  { id: "zinzolin-1", order: 24, label: "Zinzolin", category: "storyBoss", affiliation: "team-plasma", mode: "challenge", mandatory: true, levelCap: 60, documentation: "documented" },
  { id: "benga", order: 25, label: "Benga", category: "storyBoss", affiliation: "independent", team: ["Metagross", "Garchomp", "Emboar", "Gyarados", "Conkeldurr", "Volcarona"], mode: "challenge", mandatory: true, levelCap: 62, documentation: "documented" },
  { id: "winona", order: 26, label: "Winona", category: "hoenn", affiliation: "hoenn-leaders", team: ["Dragonite", "Mantine", "Rotom-Fan", "Pelipper"], mode: "challenge", mandatory: false, levelCap: 63, documentation: "documented" },
  { id: "drayden", order: 27, label: "Drayden", category: "gym", affiliation: "unova-league", team: ["Charizard", "Latias", "Haxorus", "Flygon", "Salamence", "Sceptile"], mode: "challenge", mandatory: true, levelCap: 64, documentation: "documented" },
  { id: "zinzolin-2", order: 28, label: "Zinzolin", category: "storyBoss", affiliation: "team-plasma", mode: "challenge", mandatory: true, levelCap: 64, documentation: "documented" },
  {
    id: "tate-liza",
    order: 29,
    label: "Tate and Liza",
    category: "hoenn",
    affiliation: "hoenn-leaders",
    bosses: [
      {
        label: "Liza",
        team: ["Mr. Mime", "Lunatone", "Exeggutor", "Jynx"],
      },
      {
        label: "Tate",
        team: ["Claydol", "Solrock", "Medicham", "Beheeyem"],
      },
    ],
    mode: "challenge",
    mandatory: false,
    levelCap: 67,
    documentation: "documented",
  },
  { id: "marlon", order: 30, label: "Marlon", category: "gym", affiliation: "unova-league", team: ["Poliwrath", "Ludicolo", "Kabutops", "Pelipper", "Starmie", "Kingdra"], mode: "challenge", mandatory: true, levelCap: 68, documentation: "documented" },
  { id: "zinzolin-3", order: 31, label: "Zinzolin", category: "storyBoss", affiliation: "team-plasma", mode: "challenge", mandatory: true, levelCap: 68, documentation: "documented" },
  { id: "zinzolin-4", order: 32, label: "Zinzolin", category: "storyBoss", affiliation: "team-plasma", mode: "challenge", mandatory: true, levelCap: 70, documentation: "documented" },
  { id: "colress-3", order: 33, label: "Colress", category: "storyBoss", affiliation: "team-plasma", team: ["Beheeyem", "Rotom-Wash", "Magnezone", "Metagross", "Porygon-Z", "Klinklang"], mode: "challenge", mandatory: true, levelCap: 70, documentation: "documented" },
  { id: "ghetsis", order: 34, label: "Ghetsis", category: "storyBoss", affiliation: "team-plasma", team: ["Cofagrigus", "Eelektross", "Gyarados", "Machamp", "Genesect", "Hydreigon"], mode: "challenge", mandatory: true, levelCap: 72, documentation: "documented" },
  {
    id: "lance",
    order: 35,
    label: "Lance Gauntlet",
    category: "storyBoss",
    affiliation: "independent",
    bosses: [
      {
        label: "Hail Trainer Caroll",
        team: ["Abomasnow", "Reuniclus", "Weavile", "Vanilluxe", "Cloyster", "Jynx"],
      },
      {
        label: "Sun Trainer Elmer",
        team: ["Torkoal", "Darmanitan", "Venusaur", "Ninetales", "Volcarona", "Victreebel"],
      },
      {
        label: "Rain Trainer Porta",
        team: ["Pelipper", "Seismitoad", "Electrode", "Politoed", "Scizor", "Kingdra"],
      },
      {
        label: "Sand Trainer Sterling",
        team: ["Hippowdon", "Garchomp", "Excadrill", "Tyranitar", "Clefable", "Nidoking"],
      },
      {
        label: "Lance",
        team: ["Aerodactyl", "Charizard", "Gyarados", "Salamence", "Haxorus", "Dragonite"],
      },
    ],
    mode: "challenge",
    mandatory: true,
    levelCap: 76,
    documentation: "documented",
  },
  {
    id: "hugh-4",
    order: 36,
    label: "Hugh",
    category: "storyBoss",
    affiliation: "rival",
    bosses: [
      {
        label: "If you picked Tepig",
        team: ["Swellow", "Eelektross", "Flygon", "Lilligant", "Samurott", "Camerupt"],
      },
      {
        label: "If you picked Oshawott",
        team: ["Swellow", "Eelektross", "Flygon", "Camerupt", "Serperior", "Starmie"],
      },
      {
        label: "If you picked Snivy",
        team: ["Swellow", "Eelektross", "Flygon", "Starmie", "Emboar", "Lilligant"],
      },
    ],
    mode: "challenge",
    mandatory: true,
    levelCap: 77,
    documentation: "documented",
  },
  {
    id: "pokemon-league",
    order: 37,
    label: "Pokemon League",
    category: "league",
    affiliation: "unova-league",
    bosses: [
      {
        label: "Shauntal",
        team: ["Sableye", "Gengar", "Mismagius", "Golurk", "Jellicent", "Chandelure"],
      },
      {
        label: "Grimsley",
        team: ["Krookodile", "Tyranitar", "Honchkrow", "Sharpedo", "Zoroark", "Drapion"],
      },
      {
        label: "Caitlin",
        team: ["Musharna", "Slowbro", "Gallade", "Darmanitan-Zen", "Xatu", "Metagross"],
      },
      {
        label: "Marshal",
        team: ["Hitmontop", "Infernape", "Breloom", "Toxicroak", "Lucario", "Conkeldurr"],
      },
      {
        label: "Iris",
        team: ["Serperior", "Dragonite", "Empoleon", "Alakazam", "Togekiss", "Latios"],
      },
    ],
    mode: "challenge",
    mandatory: true,
    levelCap: 78,
    documentation: "documented",
  },
  {
    id: "steven-wallace",
    order: 38,
    label: "Steven and Wallace",
    category: "postgame",
    affiliation: "postgame",
    bosses: [
      {
        label: "Steven",
        team: ["Metagross", "Claydol", "Empoleon", "Aerodactyl", "Aggron", "Cradily"],
      },
      {
        label: "Wallace",
        team: ["Pelipper", "Ludicolo", "Milotic", "Gyarados", "Kabutops", "Sharpedo"],
      },
    ],
    mode: "challenge",
    mandatory: false,
    levelCap: 90,
    documentation: "partial",
  },
  {
    id: "elite-four-rematch",
    order: 39,
    label: "Elite Four Rematch",
    category: "postgame",
    affiliation: "postgame",
    bosses: [
      {
        label: "Shauntal",
        team: ["Giratina", "Mismagius", "Gengar", "Golurk", "Jellicent", "Chandelure"],
      },
      {
        label: "Grimsley",
        team: ["Darkrai", "Bisharp", "Zoroark", "Weavile", "Hydreigon", "Spiritomb"],
      },
      {
        label: "Caitlin",
        team: ["Slowbro", "Gothitelle", "Cresselia", "Darmanitan", "Reuniclus", "Metagross"],
      },
      {
        label: "Marshal",
        team: ["Infernape", "Scrafty", "Lucario", "Mienshao", "Keldeo", "Conkeldurr"],
      },
      {
        label: "Iris",
        team: ["Latios", "Aerodactyl", "Dragonite", "Heatran", "Serperior", "Rayquaza"],
      },
    ],
    mode: "challenge",
    mandatory: false,
    levelCap: 90,
    documentation: "documented",
  },
  {
    id: "benga-postgame",
    order: 40,
    label: "Benga Postgame",
    category: "postgame",
    affiliation: "postgame",
    bosses: [
      {
        label: "White Tree Hollow",
        team: ["Kyogre", "Zekrom", "Lugia", "Latios", "Volcarona"],
      },
      {
        label: "Black Skyscraper",
        team: ["Groudon", "Reshiram", "Ho-Oh", "Latias", "Volcarona"],
      },
    ],
    mode: "challenge",
    mandatory: false,
    levelCap: 100,
    documentation: "documented",
  },
  { id: "n-postgame", order: 41, label: "N Postgame", category: "postgame", affiliation: "postgame", mode: "challenge", mandatory: false, levelCap: 92, documentation: "partial" },
  { id: "red-postgame", order: 42, label: "Red", category: "postgame", affiliation: "postgame", mode: "challenge", mandatory: false, levelCap: 100, documentation: "partial" },
];

export function getRunEncounterCatalog(mode: RunMode = "challenge") {
  return challengeRunEncounters.filter((encounter) => encounter.mode === mode);
}

export function getNextRelevantEncounter(
  encounters: RunEncounterDefinition[],
  completedEncounterIds: string[],
) {
  const completed = new Set(completedEncounterIds ?? []);
  return (
    encounters
      .filter((encounter) => encounter.mandatory)
      .find((encounter) => !completed.has(encounter.id)) ??
    encounters.find((encounter) => !completed.has(encounter.id)) ??
    encounters[encounters.length - 1]
  );
}

export function getPendingMandatoryBeforeEncounter(
  encounters: RunEncounterDefinition[],
  completedEncounterIds: string[],
  encounterId: string,
) {
  const completed = new Set(completedEncounterIds ?? []);
  const target = encounters.find((encounter) => encounter.id === encounterId);
  if (!target) {
    return null;
  }

  return (
    encounters.find(
      (encounter) =>
        encounter.order < target.order &&
        encounter.mandatory &&
        !completed.has(encounter.id),
    ) ?? null
  );
}

export function mapEncounterOrderToMilestoneId(order: number) {
  if (order <= 3) {
    return "opening";
  }
  if (order <= 5) {
    return "floccesy";
  }
  if (order <= 9) {
    return "virbank";
  }
  if (order <= 13) {
    return "castelia";
  }
  if (order <= 17) {
    return "driftveil";
  }
  if (order <= 22) {
    return "mistralton";
  }
  if (order <= 27) {
    return "undella";
  }
  if (order <= 34) {
    return "humilau";
  }
  if (order <= 40) {
    return "league";
  }
  return "postgame";
}

const CONTEXTUAL_SOURCE_AREA_CHUNKS: Record<string, string[]> = {
  opening: ["Aspertia City", "Route 19"],
  floccesy: ["Route 20 - Spring", "Floccesy Ranch", "Floccesy Town"],
  virbank: ["Virbank City", "Virbank Complex - Outside", "Virbank Complex - Inside"],
  castelia: ["Castelia City", "Castelia Sewers", "Relic Passage - Castelia", "Route 4"],
  driftveil: [
    "Desert Resort",
    "Relic Castle - Upper Floors",
    "Route 5",
    "Route 16",
    "Lostlorn Forest",
    "Driftveil Drawbridge, Charizard Bridge",
    "Route 6 - Spring, Summer, Autumn",
    "Route 6 - Winter",
    "Driftveil City",
    "Clay Tunnel - All Areas",
    "Relic Passage - Driftveil Side",
    "Relic Passage - Center (Main) Room",
    "Mistralton Cave",
    "Chargestone Cave",
  ],
  mistralton: [
    "Route 7 - Spring, Summer, Autumn",
    "Route 7 - Winter",
    "Celestial Tower",
    "Reversal Mountain - Outside",
    "Reversal Mountain - Inside",
    "Strange House",
    "Undella Town",
    "Undella Bay",
    "Route 14",
    "Abundant Shrine",
    "Seaside Cave - Upper Floor",
    "Seaside Cave - Lower Floor",
  ],
  undella: [
    "Route 13",
    "Route 12",
    "Village Bridge",
    "Route 11",
    "Route 9",
    "Route 21",
    "Humilau City",
    "Route 22",
    "Giants Chasm - Route 13",
    "Giants Chasm - Entrance Cave",
    "Giants Chasm - Plasma Airship Area",
    "Giants Chasm - Kyurems Cave",
  ],
  humilau: [
    "Route 23",
    "Victory Road - Ruined Area",
    "Victory Road - Lower Mountainside",
    "Victory Road - Forest",
    "Victory Road - Connecting Caves I",
    "Victory Road - Upper Mountainside",
    "Victory Road - Connecting Caves II",
    "Victory Road - N's Castle, Entrance",
    "Route 8, Moor of Icirrus - All Seasons",
    "Icirrus City - All Seasons",
    "Dragonspiral Tower - Spring/Summer/Autumn",
    "Dragonspiral Tower - Winter",
    "Dragonspiral Tower - Indoors",
    "Twist Mountain - All Seasons",
    "Underground Ruins - All Areas",
  ],
  league: [
    "Route 23",
    "Victory Road - Ruined Area",
    "Victory Road - Lower Mountainside",
    "Victory Road - Forest",
    "Victory Road - Connecting Caves I",
    "Victory Road - Upper Mountainside",
    "Victory Road - Connecting Caves II",
    "Victory Road - N's Castle, Entrance",
    "Route 8, Moor of Icirrus - All Seasons",
    "Icirrus City - All Seasons",
    "Dragonspiral Tower - Spring/Summer/Autumn",
    "Dragonspiral Tower - Winter",
    "Dragonspiral Tower - Indoors",
    "Twist Mountain - All Seasons",
    "Underground Ruins - All Areas",
  ],
  postgame: [
    "Marvellous Bridge",
    "Route 15",
    "Pinwheel Forest - Inside",
    "Pinwheel Forest - Outside",
    "Route 3",
    "Wellspring Cave - Both Floors",
    "Striation City",
    "Dreamyard - All Areas",
    "Route 2",
    "Route 1",
    "Route 17",
    "Route 18",
    "P2 Laboratory",
  ],
};

const CONTEXTUAL_MILESTONE_ORDER = [
  "opening",
  "floccesy",
  "virbank",
  "castelia",
  "driftveil",
  "mistralton",
  "undella",
  "humilau",
  "league",
  "postgame",
] as const;

export function getFurthestMilestoneId(...milestoneIds: Array<string | null | undefined>) {
  return milestoneIds
    .filter((value): value is string => Boolean(value))
    .reduce((furthest, current) => {
      const currentIndex = CONTEXTUAL_MILESTONE_ORDER.indexOf(current as (typeof CONTEXTUAL_MILESTONE_ORDER)[number]);
      const furthestIndex = CONTEXTUAL_MILESTONE_ORDER.indexOf(furthest as (typeof CONTEXTUAL_MILESTONE_ORDER)[number]);
      return currentIndex > furthestIndex ? current : furthest;
    }, "opening");
}

export function getContextualSourceAreasForMilestone(milestoneId: string) {
  const targetIndex = Math.max(
    0,
    CONTEXTUAL_MILESTONE_ORDER.indexOf(
      getFurthestMilestoneId(milestoneId) as (typeof CONTEXTUAL_MILESTONE_ORDER)[number],
    ),
  );

  return Array.from(
    new Set(
      CONTEXTUAL_MILESTONE_ORDER.slice(0, targetIndex + 1).flatMap(
        (key) => CONTEXTUAL_SOURCE_AREA_CHUNKS[key] ?? [],
      ),
    ),
  );
}

export function getContextualSourceAreas(order: number) {
  return getContextualSourceAreasForMilestone(mapEncounterOrderToMilestoneId(order));
}
