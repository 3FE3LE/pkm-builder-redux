import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "data", "reference");
const POKEMON_FILE = path.join(OUTPUT_DIR, "pokemon-canonical-gen5.json");
const VERSION_GROUP = "black-2-white-2";
const moveMachineCache = new Map();

function normalize(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-")
    .replace(/armour/g, "armor");
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

function parseMachineSource(itemName) {
  const match = itemName.match(/^(tm|hm)(\d+)/i);
  if (!match) {
    return {
      source: "Machine",
      tab: "tm",
      machineNumber: null,
    };
  }

  const prefix = match[1].toLowerCase();
  const machineNumber = Number(match[2]);

  return {
    source: `${prefix.toUpperCase()}${String(machineNumber).padStart(2, "0")}`,
    tab: prefix,
    machineNumber,
  };
}

async function resolveMachineData(moveUrl) {
  if (moveMachineCache.has(moveUrl)) {
    return moveMachineCache.get(moveUrl);
  }

  const payload = await fetchJson(moveUrl);
  const match = payload.machines.find(
    (entry) => entry.version_group.name === VERSION_GROUP
  );

  if (!match?.machine?.url) {
    const fallback = {
      source: "Machine",
      tab: "tm",
      machineNumber: null,
    };
    moveMachineCache.set(moveUrl, fallback);
    return fallback;
  }

  const machinePayload = await fetchJson(match.machine.url);
  const resolved = parseMachineSource(machinePayload.item?.name ?? "");
  moveMachineCache.set(moveUrl, resolved);
  return resolved;
}

async function extractLearnsets(payload) {
  const levelUp = [];
  const machines = [];

  for (const moveEntry of payload.moves) {
    for (const detail of moveEntry.version_group_details) {
      if (detail.version_group.name !== VERSION_GROUP) {
        continue;
      }
      const moveName = formatName(moveEntry.move.name);
      if (detail.move_learn_method.name === "level-up") {
        levelUp.push({
          level: detail.level_learned_at,
          move: moveName,
        });
      }
      if (detail.move_learn_method.name === "machine") {
        const machine = await resolveMachineData(moveEntry.move.url);
        machines.push({
          source: machine.source,
          move: moveName,
          tab: machine.tab,
          machineNumber: machine.machineNumber,
        });
      }
      if (detail.move_learn_method.name === "tutor") {
        machines.push({
          source: "Tutor",
          move: moveName,
          tab: "tutor",
          machineNumber: null,
        });
      }
    }
  }

  levelUp.sort((left, right) => left.level - right.level || left.move.localeCompare(right.move));
  machines.sort(
    (left, right) =>
      (left.tab === right.tab ? 0 : left.tab.localeCompare(right.tab)) ||
      ((left.machineNumber ?? 999) - (right.machineNumber ?? 999)) ||
      left.move.localeCompare(right.move)
  );

  return {
    levelUp,
    machines: Array.from(
      new Map(machines.map((entry) => [`${entry.tab}:${entry.source}:${normalize(entry.move)}`, entry])).values()
    ),
  };
}

async function buildEntry(entry) {
  const payload = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${entry.id}`);
  return [entry.slug, await extractLearnsets(payload)];
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const pokemonIndex = JSON.parse(await readFile(POKEMON_FILE, "utf8"));
  const pokemonList = Object.values(pokemonIndex);
  const learnsets = Object.fromEntries(await mapWithConcurrency(pokemonList, 8, buildEntry));
  await writeFile(
    path.join(OUTPUT_DIR, "pokemon-canonical-learnsets-gen5.json"),
    JSON.stringify(learnsets, null, 2)
  );
  console.log("Wrote data/reference/pokemon-canonical-learnsets-gen5.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
