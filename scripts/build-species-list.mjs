import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const LOCAL_DEX_DIR = path.join(ROOT, "data", "local-dex");
const REFERENCE_DIR = path.join(ROOT, "data", "reference");

const BASE_FORM_SUFFIXES = [
  { name: /\s+standard$/i, slug: /-standard$/i },
  { name: /\s+incarnate$/i, slug: /-incarnate$/i },
  { name: /\s+normal$/i, slug: /-normal$/i },
  { name: /\s+plant$/i, slug: /-plant$/i },
  { name: /\s+land$/i, slug: /-land$/i },
  { name: /\s+altered$/i, slug: /-altered$/i },
  { name: /\s+red-striped$/i, slug: /-red-striped$/i },
  { name: /\s+red striped$/i, slug: /-red-striped$/i },
  { name: /\s+aria$/i, slug: /-aria$/i },
  { name: /\s+ordinary$/i, slug: /-ordinary$/i },
];

function normalize(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

function normalizeDexCatalogName(name) {
  return BASE_FORM_SUFFIXES.reduce((value, suffix) => value.replace(suffix.name, ""), name);
}

function normalizeDexCatalogSlug(slug) {
  return BASE_FORM_SUFFIXES.reduce(
    (value, suffix) => value.replace(suffix.slug, ""),
    normalize(slug),
  );
}

async function readJson(baseDir, fileName) {
  const raw = await readFile(path.join(baseDir, fileName), "utf8");
  return JSON.parse(raw);
}

function buildSpeciesList(canonical, reduxOverrides) {
  return Array.from(
    new Map(
      Object.values(canonical).map((entry) => {
        const key = normalize(entry.slug ?? entry.name);
        const name = normalizeDexCatalogName(entry.name);
        const slug = normalizeDexCatalogSlug(entry.slug ?? entry.name);
        const types = reduxOverrides?.[key]?.complete?.types ?? entry.types ?? [];

        return [
          slug,
          {
            name,
            slug,
            dex: entry.dex ?? entry.id ?? 0,
            types,
          },
        ];
      }),
    ).values(),
  ).sort((left, right) => left.dex - right.dex || left.name.localeCompare(right.name));
}

async function main() {
  const canonical = await readJson(REFERENCE_DIR, "pokemon-canonical-gen5.json");
  const reduxOverrides = await readJson(REFERENCE_DIR, "pokemon-redux-overrides-gen5.json");
  const speciesList = buildSpeciesList(canonical, reduxOverrides);

  await mkdir(LOCAL_DEX_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DEX_DIR, "species-list.json"), JSON.stringify(speciesList, null, 2));
  console.log(`species-list built: ${speciesList.length} entries`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
