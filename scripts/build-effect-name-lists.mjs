import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DOC_PATH = path.join(ROOT, "Documentation", "Item Changes.txt");
const OUTPUT_DIR = path.join(ROOT, "data", "reference");

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

function cleanToken(value) {
  return value
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\bx\d+\b/gi, " ")
    .replace(/\$\d+/g, " ")
    .replace(/^\W+|\W+$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function singularizeItem(value) {
  if (/berries$/i.test(value)) {
    return value.replace(/berries$/i, "Berry");
  }
  return value;
}

function splitChoices(value) {
  return value
    .replace(/^Choice between\s+/i, "")
    .replace(/\.$/, "")
    .replace(/\bor\b/gi, ",")
    .split(",")
    .map((part) => cleanToken(part.replace(/^(a|an)\s+/i, "")))
    .map(singularizeItem)
    .filter(Boolean);
}

function extractItemsFromLine(line) {
  const trimmed = line.trim();
  if (!trimmed || /^o-+/i.test(trimmed) || /^=+/i.test(trimmed) || /^~+/i.test(trimmed)) {
    return [];
  }

  if (/^\*+/i.test(trimmed) || /mode only/i.test(trimmed)) {
    return [];
  }

  if (/^Choice between\s+/i.test(trimmed)) {
    return splitChoices(trimmed);
  }

  const fragments = trimmed.split(/\s*->\s*/g);
  const extracted = [];

  for (const fragment of fragments) {
    if (/^Choice between\s+/i.test(fragment)) {
      extracted.push(...splitChoices(fragment));
      continue;
    }

    const token = singularizeItem(cleanToken(fragment));
    if (!token) {
      continue;
    }

    if (/^(either|new|unused in vanilla)$/i.test(token)) {
      continue;
    }

    extracted.push(token);
  }

  return extracted;
}

function collectAbilityNames(pokemonCanonical, pokemonOverrides) {
  const abilities = new Set();

  for (const entry of Object.values(pokemonCanonical)) {
    for (const ability of entry.abilities ?? []) {
      abilities.add(String(ability).trim());
    }
  }

  for (const entry of Object.values(pokemonOverrides)) {
    for (const ability of entry.complete?.abilities ?? []) {
      abilities.add(String(ability).trim());
    }
    for (const ability of entry.classic?.abilities ?? []) {
      abilities.add(String(ability).trim());
    }
  }

  return Array.from(abilities)
    .filter((ability) => ability && ability !== "-" && ability.toLowerCase() !== "none")
    .sort((left, right) => left.localeCompare(right));
}

function collectItemNames(itemText) {
  const items = new Map();
  const lines = itemText.replace(/\r/g, "").split("\n");
  let mode = null;
  let inArea = false;
  const ignoredPhrases = [
    /^all /i,
    /^almost all /i,
    /^several /i,
    /^modified /i,
    /^secondary mart /i,
    /^plasma grunt /i,
    /^now sells/i,
    /^a '\*' means/i,
    /^castelia berry guy/i,
    /^new:\s+armou?r fossil and skull fossil/i,
    /^new:\s+cover fossil and plume fossil/i,
    /^everstones and eviolites$/i,
    /^incense items$/i,
    /^pp ups and pp maxes$/i,
    /^white, mental and power herbs$/i,
  ];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line === "The following items have been replaced for new items:") {
      mode = "replacements";
      continue;
    }

    if (line === "The following items have had adjustments to their costs:") {
      mode = "costs";
      continue;
    }

    if (line === 'The following items now have a "Use" option like evolutionary stones:') {
      mode = "use";
      continue;
    }

    if (line === "Item Locations") {
      mode = "locations";
      inArea = false;
      continue;
    }

    if (
      line === "EVless Mode Information" ||
      line === "Modified Items" ||
      line === "Pickup Table Changes" ||
      line === "Castelia Berry Guy, Battle Subway and PWT Prizes"
    ) {
      mode = null;
      inArea = false;
      continue;
    }

    if (/^=+$/.test(line)) {
      continue;
    }

    if (/^~+/.test(line)) {
      if (mode === "locations") {
        inArea = true;
        continue;
      }
      mode = null;
      continue;
    }

    if (!mode || /^\*+/i.test(line) || /mode only/i.test(line)) {
      continue;
    }

    if (mode === "locations" && !inArea) {
      continue;
    }

    if (mode === "locations" && (/^A '\*' means/i.test(line) || /^TM\s+#/i.test(line) || /^----/.test(line))) {
      mode = null;
      inArea = false;
      continue;
    }

    const candidates =
      mode === "use"
        ? [line.replace(/^-\s+/, "").trim()]
        : mode === "costs"
          ? [line.replace(/^-\s+/, "").replace(/\(\$.*$/, "").trim()]
          : extractItemsFromLine(line);

    for (const item of candidates) {
      if (ignoredPhrases.some((pattern) => pattern.test(item))) {
        continue;
      }
      const key = normalize(item);
      if (!key) {
        continue;
      }
      items.set(key, toTitleCase(item));
    }
  }

  return Array.from(items.values()).sort((left, right) => left.localeCompare(right));
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [pokemonCanonicalRaw, pokemonOverridesRaw, itemText] = await Promise.all([
    readFile(path.join(OUTPUT_DIR, "pokemon-canonical-gen5.json"), "utf8"),
    readFile(path.join(OUTPUT_DIR, "pokemon-redux-overrides-gen5.json"), "utf8"),
    readFile(DOC_PATH, "utf8"),
  ]);

  const abilityNames = collectAbilityNames(
    JSON.parse(pokemonCanonicalRaw),
    JSON.parse(pokemonOverridesRaw)
  );
  const itemNames = collectItemNames(itemText);

  await writeFile(path.join(OUTPUT_DIR, "ability-name-list-gen5.json"), JSON.stringify(abilityNames, null, 2));
  await writeFile(path.join(OUTPUT_DIR, "item-name-list-gen5.json"), JSON.stringify(itemNames, null, 2));

  console.log("Wrote data/reference/ability-name-list-gen5.json");
  console.log("Wrote data/reference/item-name-list-gen5.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
