import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "data", "reference");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "item-sources-canonical-bw2.json");
const PARTS = Array.from({ length: 22 }, (_, index) => index + 1);

function normalizeWords(input) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSlug(input) {
  return normalizeWords(input).replace(/\s+/g, "-");
}

function decodeHtml(input) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&times;/g, "×")
    .replace(/&eacute;/g, "é")
    .replace(/&uuml;/g, "ü")
    .replace(/&aacute;/g, "á")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

function stripHtml(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|tr|table|li|ul|ol|caption)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim(),
  );
}

function cleanItemName(raw) {
  return String(raw ?? "")
    .replace(/\s+[BW]2(?:\s+[BW]2)?$/i, "")
    .replace(/\s+×\d+$/i, "")
    .replace(/\s+x\d+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

function pushSource(index, rawItem, area, detail) {
  const itemName = cleanItemName(rawItem);
  if (!itemName || !area) {
    return;
  }

  const slug = normalizeSlug(itemName);
  if (!index[slug]) {
    index[slug] = {
      slug,
      name: itemName,
      sources: {
        locations: [],
        shops: [],
      },
    };
  }

  index[slug].sources.locations.push({
    area,
    detail: detail.trim(),
  });
}

function dedupeSources(index) {
  for (const entry of Object.values(index)) {
    for (const bucket of ["locations", "shops"]) {
      const seen = new Set();
      entry.sources[bucket] = entry.sources[bucket].filter((source) => {
        const key = `${source.area}::${source.detail}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }
  }
}

function extractText(fragment) {
  return stripHtml(fragment)
    .replace(/\s+/g, " ")
    .trim();
}

function parseItemsFromHtml(html, index) {
  const sectionPattern = /<h2><span class="mw-headline" id="([^"]+)">[\s\S]*?<\/h2>([\s\S]*?)(?=<h2><span class="mw-headline"|$)/g;
  for (const match of html.matchAll(sectionPattern)) {
    const area = decodeHtml(match[1]).replace(/_/g, " ").trim();
    const body = match[2];
    if (!/>Items\s*<\/th>/i.test(body)) {
      continue;
    }

    const itemsTableMatch = body.match(/<th>\s*Items\s*<\/th>[\s\S]*?<table class="roundy"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>\s*<\/table>/i);
    if (!itemsTableMatch) {
      continue;
    }

    const rows = itemsTableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g);
    for (const row of rows) {
      const cells = Array.from(row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)).map((cell) => extractText(cell[1]));
      if (cells.length < 4) {
        continue;
      }

      const itemName = cells[1];
      const detail = cells[2];
      const games = cells.at(-1) ?? "";
      if (!itemName || !detail || !/\bB2\b/.test(games) || !/\bW2\b/.test(games)) {
        continue;
      }

      pushSource(index, itemName, area, detail);
    }
  }
}

async function fetchPart(part) {
  const url = `https://bulbapedia.bulbagarden.net/wiki/Walkthrough%3APok%C3%A9mon_Black_2_and_White_2/Part_${part}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "pkm-builder-redux/1.0 (local build script)",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Bulbapedia part ${part}: ${response.status}`);
  }
  return response.text();
}

async function main() {
  const index = {};

  for (const part of PARTS) {
    const html = await fetchPart(part);
    parseItemsFromHtml(html, index);
  }

  dedupeSources(index);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(index, null, 2));
  console.log("Canonical BW2 item sources generated in data/reference/item-sources-canonical-bw2.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
