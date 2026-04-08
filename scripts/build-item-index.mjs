import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "data", "local-dex");
const CANONICAL_ITEMS_PATH = path.join(ROOT, "data", "reference", "items-canonical.json");
const CANONICAL_SOURCES_PATH = path.join(ROOT, "data", "reference", "item-sources-canonical-bw2.json");
const CANONICAL_SOURCE_OVERRIDES_PATH = path.join(ROOT, "data", "reference", "item-sources-canonical-bw2-overrides.json");
const REDUX_OVERRIDES_PATH = path.join(ROOT, "data", "reference", "item-redux-overrides.json");
const DEX_DOCS_PATH = path.join(ROOT, "data", "local-dex", "dex-docs.json");

const EVOLUTIONARY_STONE_NAMES = new Set([
  "fire stone",
  "water stone",
  "thunder stone",
  "leaf stone",
  "moon stone",
  "sun stone",
  "dusk stone",
  "dawn stone",
  "shiny stone",
  "ice stone",
]);

const EVOLUTIONARY_ITEM_NAMES = new Set([
  "deep sea scale",
  "deep sea tooth",
  "dragon scale",
  "dubious disc",
  "electirizer",
  "kings rock",
  "magmarizer",
  "metal coat",
  "protector",
  "reaper cloth",
  "up grade",
  "ice stone",
  "link cable",
]);

function normalizeWords(input) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseLocationSource(detail) {
  const trimmed = String(detail ?? "").trim();
  const replacement = trimmed.includes("->")
    ? trimmed.split("->").slice(1).join("->").trim()
    : trimmed;

  const normalized = replacement
    .replace(/^\*+/, "")
    .replace(/\*+$/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bx\s*\d+\b/gi, " ")
    .replace(/^new:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    itemName: normalized || null,
    detail: trimmed.includes("->")
      ? `Reemplaza ${trimmed.split("->")[0].trim()}`
      : formatReduxLocationDetail(trimmed),
  };
}

function formatReduxLocationDetail(detail) {
  const trimmed = String(detail ?? "").trim();
  const challengeOnly = /^\*\*/.test(trimmed);
  const easyNormalOnly = !challengeOnly && /^\*/.test(trimmed);
  const quantityMatch = trimmed.match(/\bx\s*(\d+)\b/i);

  const base = trimmed
    .replace(/^\*+/, "")
    .replace(/\*+$/g, "")
    .replace(/\bx\s*\d+\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const notes = [];
  if (quantityMatch) {
    notes.push(`x${quantityMatch[1]}`);
  }
  if (challengeOnly) {
    notes.push("Solo Challenge");
  } else if (easyNormalOnly) {
    notes.push("Solo Easy/Normal");
  }

  return notes.length ? `${base} · ${notes.join(" · ")}` : base;
}

function shopDetailMatchesItem(detail, itemName) {
  const normalizedDetail = normalizeWords(detail);
  const normalizedItemName = normalizeWords(itemName);

  if (!normalizedDetail || !normalizedItemName) {
    return false;
  }

  if (normalizedDetail.includes(normalizedItemName)) {
    return true;
  }

  if (
    normalizedDetail.includes("evolutionary stones") &&
    EVOLUTIONARY_STONE_NAMES.has(normalizedItemName)
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("all evolutionary items") &&
    (EVOLUTIONARY_STONE_NAMES.has(normalizedItemName) ||
      EVOLUTIONARY_ITEM_NAMES.has(normalizedItemName))
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("incense items") &&
    normalizedItemName.includes("incense")
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("pp ups and pp maxes") &&
    (normalizedItemName === "pp up" || normalizedItemName === "pp max")
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("everstones and eviolites") &&
    (normalizedItemName === "everstone" || normalizedItemName === "eviolite")
  ) {
    return true;
  }

  if (
    normalizedDetail.includes("white mental and power herbs") &&
    (normalizedItemName === "white herb" ||
      normalizedItemName === "mental herb" ||
      normalizedItemName === "power herb")
  ) {
    return true;
  }

  return false;
}

function dedupeSources(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.area}::${entry.detail}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function main() {
  const [canonicalRaw, overridesRaw, dexDocsRaw, canonicalSourcesRaw, canonicalSourceOverridesRaw] = await Promise.all([
    readFile(CANONICAL_ITEMS_PATH, "utf8"),
    readFile(REDUX_OVERRIDES_PATH, "utf8"),
    readFile(DEX_DOCS_PATH, "utf8"),
    readFile(CANONICAL_SOURCES_PATH, "utf8").catch(() => "{}"),
    readFile(CANONICAL_SOURCE_OVERRIDES_PATH, "utf8").catch(() => "{}"),
  ]);

  const canonical = JSON.parse(canonicalRaw);
  const overrides = JSON.parse(overridesRaw);
  const dexDocs = JSON.parse(dexDocsRaw);
  const canonicalSources = JSON.parse(canonicalSourcesRaw);
  const canonicalSourceOverrides = JSON.parse(canonicalSourceOverridesRaw);
  const itemLocations = Array.isArray(dexDocs.itemLocations) ? dexDocs.itemLocations : Array.isArray(dexDocs.locations) ? dexDocs.locations : [];
  const itemShops = Array.isArray(dexDocs.itemShops) ? dexDocs.itemShops : [];

  const index = Object.fromEntries(
    Object.entries(canonical).map(([key, entry]) => {
      const canonicalEntrySources = canonicalSources[key]?.sources ?? {};
      const canonicalOverrideSources = canonicalSourceOverrides[key]?.sources ?? {};
      const sources = {
        locations: [
          ...(Array.isArray(canonicalEntrySources.locations) ? canonicalEntrySources.locations : []),
          ...(Array.isArray(canonicalOverrideSources.locations) ? canonicalOverrideSources.locations : []),
        ],
        shops: [
          ...(Array.isArray(canonicalEntrySources.shops) ? canonicalEntrySources.shops : []),
          ...(Array.isArray(canonicalOverrideSources.shops) ? canonicalOverrideSources.shops : []),
        ],
      };

      itemLocations.forEach((location) => {
        for (const rawDetail of location.items ?? []) {
          const parsed = parseLocationSource(rawDetail);
          if (normalizeWords(parsed.itemName) !== normalizeWords(entry.name)) {
            continue;
          }

          sources.locations.push({
            area: location.area,
            detail: parsed.detail,
          });
        }
      });

      itemShops.forEach((shop) => {
        for (const detail of shop.details ?? []) {
          if (!shopDetailMatchesItem(detail, entry.name)) {
            continue;
          }

          sources.shops.push({
            area: shop.area,
            detail,
          });
        }
      });

      return [
        key,
        {
          ...entry,
          ...(overrides[key] ?? {}),
          sources: {
            locations: dedupeSources(sources.locations),
            shops: dedupeSources(sources.shops),
          },
        },
      ];
    }),
  );

  for (const [key, entry] of Object.entries(overrides)) {
    if (!(key in index)) {
      index[key] = {
        ...entry,
        sources: {
          locations: [],
          shops: [],
        },
      };
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "item-index.json"), JSON.stringify(index, null, 2));
  console.log("Item index generated in data/local-dex/item-index.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
