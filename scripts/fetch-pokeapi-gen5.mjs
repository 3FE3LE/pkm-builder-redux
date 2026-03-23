import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "data", "reference");
let moveCatalogPromise = null;
const MOVE_ALIASES = {
  "acid-armour": "acid-armor",
  autonomize: "autotomize",
  "faint-attack": "feint-attack",
  "ominous-mind": "ominous-wind",
  "sliver-wind": "silver-wind",
  twinneedle: "twineedle",
  "will-o-wiisp": "will-o-wisp",
};

function parseArgs(argv) {
  const args = {
    start: 1,
    end: 649,
    movesFile: null,
    skipPokemon: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--start") {
      args.start = Number(argv[index + 1]);
      index += 1;
    } else if (value === "--end") {
      args.end = Number(argv[index + 1]);
      index += 1;
    } else if (value === "--moves-file") {
      args.movesFile = argv[index + 1];
      index += 1;
    } else if (value === "--skip-pokemon") {
      args.skipPokemon = true;
    }
  }

  return args;
}

function normalize(value) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-")
    .replace(/armour/g, "armor");
  return MOVE_ALIASES[normalized] ?? normalized;
}

function compareKey(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function formatName(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${url} -> ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (attempt >= 4) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    return fetchJson(url, attempt + 1);
  }
}

function findNextEvolutions(chain, currentName) {
  if (chain.species.name === currentName) {
    return chain.evolves_to.map((entry) => formatName(entry.species.name));
  }
  for (const next of chain.evolves_to) {
    const result = findNextEvolutions(next, currentName);
    if (result.length) {
      return result;
    }
  }
  return [];
}

function mapEvolutionDetail(entry) {
  const detail = entry.evolution_details?.[0] ?? null;
  return {
    target: formatName(entry.species.name),
    trigger: detail?.trigger?.name ?? null,
    minLevel: detail?.min_level ?? null,
    item: detail?.item ? formatName(detail.item.name) : null,
    heldItem: detail?.held_item ? formatName(detail.held_item.name) : null,
    knownMove: detail?.known_move ? formatName(detail.known_move.name) : null,
    knownMoveType: detail?.known_move_type ? formatName(detail.known_move_type.name) : null,
    minHappiness: detail?.min_happiness ?? null,
    minBeauty: detail?.min_beauty ?? null,
    minAffection: detail?.min_affection ?? null,
    partySpecies: detail?.party_species ? formatName(detail.party_species.name) : null,
    partyType: detail?.party_type ? formatName(detail.party_type.name) : null,
    tradeSpecies: detail?.trade_species ? formatName(detail.trade_species.name) : null,
    timeOfDay: detail?.time_of_day ?? null,
    location: detail?.location?.name ?? null,
    gender: detail?.gender ?? null,
    relativePhysicalStats: detail?.relative_physical_stats ?? null,
    needsOverworldRain: Boolean(detail?.needs_overworld_rain),
    turnUpsideDown: Boolean(detail?.turn_upside_down),
  };
}

function findEvolutionDetails(chain, currentName) {
  if (chain.species.name === currentName) {
    return chain.evolves_to.map(mapEvolutionDetail);
  }
  for (const next of chain.evolves_to) {
    const result = findEvolutionDetails(next, currentName);
    if (result.length) {
      return result;
    }
  }
  return [];
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  for (let index = 0; index < items.length; index += limit) {
    const chunk = items.slice(index, index + limit);
    const chunkResults = await Promise.all(chunk.map((item) => mapper(item)));
    results.push(...chunkResults);
    console.log(`Processed ${Math.min(index + limit, items.length)}/${items.length}`);
  }
  return results;
}

async function buildPokemonEntry(id) {
  const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const species = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  const evolution = species.evolution_chain?.url ? await fetchJson(species.evolution_chain.url) : null;

  return [
    String(id).padStart(3, "0"),
    {
      id: pokemon.id,
      dex: id,
      slug: pokemon.name,
      name: formatName(pokemon.name),
      types: pokemon.types.map((entry) => formatName(entry.type.name)),
      abilities: pokemon.abilities.map((entry) => formatName(entry.ability.name)),
      stats: {
        hp: pokemon.stats[0].base_stat,
        atk: pokemon.stats[1].base_stat,
        def: pokemon.stats[2].base_stat,
        spa: pokemon.stats[3].base_stat,
        spd: pokemon.stats[4].base_stat,
        spe: pokemon.stats[5].base_stat,
        bst: pokemon.stats.reduce((sum, entry) => sum + entry.base_stat, 0),
      },
      nextEvolutions: evolution?.chain ? findNextEvolutions(evolution.chain, species.name) : [],
      evolutionDetails: evolution?.chain ? findEvolutionDetails(evolution.chain, species.name) : [],
      sprites: {
        frontDefault: pokemon.sprites.front_default,
        officialArtwork: pokemon.sprites.other["official-artwork"].front_default,
      },
    },
  ];
}

async function buildMoveEntry(moveName) {
  let slug = normalize(moveName);
  let move;
  try {
    move = await fetchJson(`https://pokeapi.co/api/v2/move/${slug}`);
  } catch {
    if (!moveCatalogPromise) {
      moveCatalogPromise = fetchJson("https://pokeapi.co/api/v2/move?limit=2000");
    }
    const catalog = await moveCatalogPromise;
    const found =
      catalog.results.find((entry) => normalize(entry.name) === slug) ??
      catalog.results.find((entry) => compareKey(entry.name) === compareKey(moveName));
    if (!found) {
      console.warn(`Unresolved move, writing placeholder: ${moveName}`);
      return [
        slug,
        {
          slug,
          name: moveName,
          type: "Unknown",
          power: null,
          accuracy: null,
          pp: null,
          damageClass: "unknown",
          description: "",
        },
      ];
    }
    slug = found.name;
    move = await fetchJson(found.url);
  }
  const effect =
    move.effect_entries.find((entry) => entry.language.name === "en")?.short_effect ??
    move.effect_entries.find((entry) => entry.language.name === "en")?.effect ??
    "";

  return [
    slug,
    {
      slug,
      name: formatName(move.name),
      type: formatName(move.type.name),
      power: move.power ?? null,
      accuracy: move.accuracy ?? null,
      pp: move.pp ?? null,
      damageClass: move.damage_class.name,
      description: effect.replace(/\$effect_chance/g, String(move.effect_chance ?? "")),
    },
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUTPUT_DIR, { recursive: true });

  if (!args.skipPokemon) {
    const pokemonIds = Array.from({ length: args.end - args.start + 1 }, (_, index) => args.start + index);
    const pokemonIndex = Object.fromEntries(await mapWithConcurrency(pokemonIds, 8, buildPokemonEntry));
    await writeFile(path.join(OUTPUT_DIR, "pokemon-canonical-gen5.json"), JSON.stringify(pokemonIndex, null, 2));
  }

  if (args.movesFile) {
    const rawMoveList = JSON.parse(await readFile(path.resolve(ROOT, args.movesFile), "utf8"));
    const uniqueMoves = Array.from(new Set(rawMoveList)).sort((left, right) => left.localeCompare(right));
    const moveIndex = Object.fromEntries(await mapWithConcurrency(uniqueMoves, 12, buildMoveEntry));
    await writeFile(path.join(OUTPUT_DIR, "moves-canonical.json"), JSON.stringify(moveIndex, null, 2));
  }

  console.log("Canonical reference data written to data/reference");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
