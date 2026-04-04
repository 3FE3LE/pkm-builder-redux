import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "local-dex");

async function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function fail(message) {
  console.error(`dex-data check failed: ${message}`);
  process.exitCode = 1;
}

function isValidSpeciesEntry(entry) {
  return (
    entry &&
    typeof entry.name === "string" &&
    entry.name.trim().length > 0 &&
    typeof entry.slug === "string" &&
    entry.slug.trim().length > 0 &&
    typeof entry.dex === "number" &&
    Number.isFinite(entry.dex) &&
    Array.isArray(entry.types)
  );
}

async function main() {
  const speciesList = await readJson("species-list.json");
  const pokemonIndex = await readJson("pokemon-index.json");

  if (!Array.isArray(speciesList) || speciesList.length === 0) {
    fail("species-list.json is empty or invalid");
    return;
  }

  if (!pokemonIndex || typeof pokemonIndex !== "object") {
    fail("pokemon-index.json is empty or invalid");
    return;
  }

  const badEntry = speciesList.find((entry) => !isValidSpeciesEntry(entry));
  if (badEntry) {
    fail(`species-list.json contains an invalid entry: ${JSON.stringify(badEntry)}`);
    return;
  }

  const pokemonValues = Object.values(pokemonIndex);
  if (pokemonValues.length !== speciesList.length) {
    fail(
      `species-list.json length (${speciesList.length}) does not match pokemon-index.json length (${pokemonValues.length})`,
    );
    return;
  }

  const missingSpecies = pokemonValues.find((entry) => {
    const slug = entry?.slug;
    return !speciesList.some((species) => species.slug === slug);
  });

  if (missingSpecies) {
    fail(`species-list.json is missing slug "${missingSpecies.slug}" from pokemon-index.json`);
    return;
  }

  console.log(`dex-data ok: ${speciesList.length} species validated`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
