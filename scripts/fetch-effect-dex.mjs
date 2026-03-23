import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "data", "reference");

const ITEM_ALIASES = {
  deepseascale: "deep-sea-scale",
  deepseatooth: "deep-sea-tooth",
  bike: "bicycle",
  expshare: "exp-share",
  kingsrock: "kings-rock",
  metalpowder: "metal-powder",
  metalcoat: "metal-coat",
  nevermeltice: "never-melt-ice",
  pokeball: "poke-ball",
  poygon2: "porygon2",
  dubiousdisk: "dubious-disc",
  parlyzheal: "paralyze-heal",
  balmmushroom: "balm-mushroom",
  brightpowder: "bright-powder",
  silverpowder: "silver-powder",
  tinymushroom: "tiny-mushroom",
  bigmushroom: "big-mushroom",
  upgrade: "up-grade",
  xaccuracy: "x-accuracy",
  xattack: "x-attack",
  xdefend: "x-defend",
  xspatk: "x-sp-atk",
  xspdef: "x-sp-def",
  xspeed: "x-speed",
};

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

function compareKey(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function singularizeCompareKey(value) {
  return compareKey(
    value
      .replace(/berries$/i, "berry")
      .replace(/shards$/i, "shard")
      .replace(/balls$/i, "ball")
      .replace(/fossils$/i, "fossil")
  );
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

async function resolveCatalogEntry(kind, value, catalogPromise) {
  const catalog = await catalogPromise;
  if (kind === "item") {
    const tmHmMatch = value.trim().match(/^(tm|hm)\s*0*(\d+)\b/i);
    if (tmHmMatch) {
      const code = `${tmHmMatch[1].toLowerCase()}${String(tmHmMatch[2]).padStart(2, "0")}`;
      const matched = catalog.results.find((entry) => entry.name === code);
      if (matched) {
        return matched;
      }
    }
  }
  const slug = ITEM_ALIASES[normalize(value)] ?? normalize(value);
  return (
    catalog.results.find((entry) => normalize(entry.name) === slug) ??
    catalog.results.find((entry) => compareKey(entry.name) === compareKey(value)) ??
    catalog.results.find((entry) => singularizeCompareKey(entry.name) === singularizeCompareKey(value))
  );
}

function getEnglishEffect(entries = [], fallback = "") {
  return (
    entries.find((entry) => entry.language.name === "en")?.short_effect ??
    entries.find((entry) => entry.language.name === "en")?.effect ??
    fallback
  );
}

async function buildItemEntry(itemName, catalogPromise) {
  const found = await resolveCatalogEntry("item", itemName, catalogPromise);
  if (!found) {
    console.warn(`Unresolved item, writing placeholder: ${itemName}`);
    const slug = normalize(itemName);
    return [
      slug,
      {
        slug,
        name: itemName,
      category: "unknown",
      cost: null,
      flingPower: null,
      flingEffect: null,
      consumable: false,
      effect: "",
      sprite: null,
      },
    ];
  }

  const item = await fetchJson(found.url);
  return [
    normalize(found.name),
    {
      slug: item.name,
      name: formatName(item.name),
      category: formatName(item.category?.name ?? "unknown"),
      cost: item.cost ?? null,
      flingPower: item.fling_power ?? null,
      flingEffect: item.fling_effect ? formatName(item.fling_effect.name) : null,
      consumable: item.attributes?.some((attribute) => attribute.name === "consumable") ?? false,
      effect: getEnglishEffect(item.effect_entries),
      sprite: item.sprites?.default ?? null,
    },
  ];
}

async function buildAbilityEntry(abilityName, catalogPromise) {
  const found = await resolveCatalogEntry("ability", abilityName, catalogPromise);
  if (!found) {
    console.warn(`Unresolved ability, writing placeholder: ${abilityName}`);
    const slug = normalize(abilityName);
    return [
      slug,
      {
        slug,
        name: abilityName,
        generation: null,
        effect: "",
      },
    ];
  }

  const ability = await fetchJson(found.url);
  return [
    normalize(found.name),
    {
      slug: ability.name,
      name: formatName(ability.name),
      generation: formatName(ability.generation?.name ?? ""),
      effect: getEnglishEffect(ability.effect_entries),
    },
  ];
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [itemNamesRaw, abilityNamesRaw] = await Promise.all([
    readFile(path.join(OUTPUT_DIR, "item-name-list-gen5.json"), "utf8"),
    readFile(path.join(OUTPUT_DIR, "ability-name-list-gen5.json"), "utf8"),
  ]);

  const itemNames = JSON.parse(itemNamesRaw);
  const abilityNames = JSON.parse(abilityNamesRaw);

  const itemCatalogPromise = fetchJson("https://pokeapi.co/api/v2/item?limit=4000");
  const abilityCatalogPromise = fetchJson("https://pokeapi.co/api/v2/ability?limit=400");

  const [itemIndex, abilityIndex] = await Promise.all([
    mapWithConcurrency(itemNames, 12, (item) => buildItemEntry(item, itemCatalogPromise)),
    mapWithConcurrency(abilityNames, 12, (ability) => buildAbilityEntry(ability, abilityCatalogPromise)),
  ]);

  await writeFile(path.join(OUTPUT_DIR, "items-canonical.json"), JSON.stringify(Object.fromEntries(itemIndex), null, 2));
  await writeFile(
    path.join(OUTPUT_DIR, "abilities-canonical.json"),
    JSON.stringify(Object.fromEntries(abilityIndex), null, 2)
  );

  console.log("Wrote data/reference/items-canonical.json");
  console.log("Wrote data/reference/abilities-canonical.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
