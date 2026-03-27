import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DOC_PATH = path.join(ROOT, "Documentation", "Pokemon Changes.txt");
const OUTPUT_DIR = path.join(ROOT, "data", "local-dex");
let moveCatalogPromise = null;

function normalize(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

function normalizeMoveSlug(value) {
  return normalize(value)
    .replace(/armour/g, "armor");
}

function formatName(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pickEnglishGenus(speciesPayload) {
  return speciesPayload.genera?.find((entry) => entry.language.name === "en")?.genus ?? null;
}

function pickEnglishFlavorText(speciesPayload) {
  const rawText =
    speciesPayload.flavor_text_entries?.find((entry) => entry.language.name === "en")?.flavor_text ?? "";
  const cleaned = rawText.replace(/[\f\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function parsePokemonChanges(text) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/(?=^===================\n\d{3} - .+\n===================$)/m)
    .map((block) => block.trim())
    .filter((block) => /^\d{3} - /m.test(block));

  return blocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trimEnd());
    const header = lines.find((line) => /^\d{3} - /.test(line));
    const [, dex, species] = header.match(/^(\d{3}) - (.+)$/) ?? [];
    const levelUp = [];
    const machines = [];
    let inLevelUp = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (inLevelUp) {
          inLevelUp = false;
        }
        continue;
      }
      if (line === "Level Up:" || line === "Level Up: ") {
        inLevelUp = true;
        continue;
      }
      if (inLevelUp) {
        const match = line.match(/^(\d+)\s+-\s+(.+)$/);
        if (match) {
          levelUp.push({
            level: Number(match[1]),
            move: match[2].replace(/\s+\[\*\]$/, "").trim(),
          });
          continue;
        }
        inLevelUp = false;
      }

      const machineMatch = line.match(/^Now compatible with (TM\d+|HM\d+),\s+(.+?)\.$/);
      if (machineMatch) {
        machines.push({
          source: machineMatch[1],
          move: machineMatch[2].trim(),
          tab: machineMatch[1].startsWith("HM") ? "hm" : "tm",
        });
        continue;
      }

      const tutorMatch = line.match(/^Now compatible with (.+?) from the Move Tutor\.$/);
      if (tutorMatch) {
        machines.push({
          source: "Tutor",
          move: tutorMatch[1].trim(),
          tab: "tutor",
        });
      }
    }

    return {
      dex: Number(dex),
      species: species.trim(),
      slug: normalize(species),
      learnsets: {
        levelUp,
        machines,
      },
    };
  });
}

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed: ${url} -> ${response.status}`);
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
    return chain.evolves_to.map((entry) => entry.species.name);
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

async function buildPokemonEntry(entry) {
  const payload = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${entry.dex}`);
  const speciesPayload = await fetchJson(payload.species.url);
  const evolutionPayload = speciesPayload.evolution_chain?.url
    ? await fetchJson(speciesPayload.evolution_chain.url)
    : null;

  return [
    entry.slug,
    {
      id: payload.id,
      dex: entry.dex,
      name: formatName(entry.species),
      slug: entry.slug,
      types: payload.types.map((item) => formatName(item.type.name)),
      category: pickEnglishGenus(speciesPayload),
      height: typeof payload.height === "number" ? payload.height / 10 : null,
      weight: typeof payload.weight === "number" ? payload.weight / 10 : null,
      flavorText: pickEnglishFlavorText(speciesPayload),
      stats: {
        hp: payload.stats[0].base_stat,
        atk: payload.stats[1].base_stat,
        def: payload.stats[2].base_stat,
        spa: payload.stats[3].base_stat,
        spd: payload.stats[4].base_stat,
        spe: payload.stats[5].base_stat,
        bst: payload.stats.reduce((sum, item) => sum + item.base_stat, 0),
      },
      abilities: payload.abilities.map((item) => formatName(item.ability.name)),
      nextEvolutions: evolutionPayload?.chain
        ? findNextEvolutions(evolutionPayload.chain, speciesPayload.name).map(formatName)
        : [],
      evolutionDetails: evolutionPayload?.chain
        ? findEvolutionDetails(evolutionPayload.chain, speciesPayload.name)
        : [],
      learnsets: entry.learnsets,
    },
  ];
}

async function buildMoveEntry(moveName) {
  let slug = normalizeMoveSlug(moveName);
  let payload;
  try {
    payload = await fetchJson(`https://pokeapi.co/api/v2/move/${slug}`);
  } catch {
    if (!moveCatalogPromise) {
      moveCatalogPromise = fetchJson("https://pokeapi.co/api/v2/move?limit=2000");
    }
    const catalog = await moveCatalogPromise;
    const found = catalog.results.find(
      (entry) => normalizeMoveSlug(entry.name) === normalizeMoveSlug(moveName)
    );
    if (!found) {
      throw new Error(`Move not found in catalog: ${moveName}`);
    }
    slug = found.name;
    payload = await fetchJson(found.url);
  }
  const effect =
    payload.effect_entries.find((entry) => entry.language.name === "en")?.short_effect ??
    payload.effect_entries.find((entry) => entry.language.name === "en")?.effect ??
    "";

  return [
    slug,
    {
      name: formatName(moveName),
      slug,
      type: formatName(payload.type.name),
      power: payload.power ?? null,
      accuracy: payload.accuracy ?? null,
      damageClass: payload.damage_class.name,
      pp: payload.pp ?? null,
      description: effect.replace(/\$effect_chance/g, String(payload.effect_chance ?? "")),
    },
  ];
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

async function main() {
  const source = await readFile(DOC_PATH, "utf8");
  const pokemonEntries = parsePokemonChanges(source);
  const uniqueMoves = Array.from(
    new Set(
      pokemonEntries.flatMap((entry) => [
        ...entry.learnsets.levelUp.map((move) => move.move),
        ...entry.learnsets.machines.map((move) => move.move),
      ])
    )
  ).sort((left, right) => left.localeCompare(right));

  console.log(`Generating local dex for ${pokemonEntries.length} Pokemon and ${uniqueMoves.length} moves...`);

  const pokemonIndex = Object.fromEntries(
    await mapWithConcurrency(pokemonEntries, 8, (entry) => buildPokemonEntry(entry))
  );
  const moveIndex = Object.fromEntries(
    await mapWithConcurrency(uniqueMoves, 12, (move) => buildMoveEntry(move))
  );

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "pokemon-index.json"), JSON.stringify(pokemonIndex, null, 2));
  await writeFile(path.join(OUTPUT_DIR, "move-index.json"), JSON.stringify(moveIndex, null, 2));
  await writeFile(
    path.join(OUTPUT_DIR, "species-list.json"),
    JSON.stringify(
      Object.values(pokemonIndex).map((pokemon) => ({ name: pokemon.name, slug: pokemon.slug })),
      null,
      2
    )
  );

  console.log("Local dex generated in data/local-dex");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
