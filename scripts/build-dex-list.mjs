import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const LOCAL_DEX_DIR = path.join(ROOT, "data", "local-dex");
const REFERENCE_DIR = path.join(ROOT, "data", "reference");

function normalize(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s*\[[^\]]*]\s*/g, " ")
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const LEGENDARY_OR_UNIQUE_SPECIES = new Set(
  [
    "Articuno",
    "Zapdos",
    "Moltres",
    "Mewtwo",
    "Raikou",
    "Entei",
    "Suicune",
    "Lugia",
    "Ho-Oh",
    "Regirock",
    "Regice",
    "Registeel",
    "Latias",
    "Latios",
    "Kyogre",
    "Groudon",
    "Rayquaza",
    "Uxie",
    "Mesprit",
    "Azelf",
    "Dialga",
    "Palkia",
    "Heatran",
    "Regigigas",
    "Giratina",
    "Cresselia",
    "Cobalion",
    "Terrakion",
    "Virizion",
    "Tornadus",
    "Thundurus",
    "Reshiram",
    "Zekrom",
    "Landorus",
    "Kyurem",
    "Mew",
    "Celebi",
    "Jirachi",
    "Deoxys",
    "Phione",
    "Manaphy",
    "Darkrai",
    "Shaymin",
    "Arceus",
    "Victini",
    "Keldeo",
    "Meloetta",
    "Genesect",
  ].map(normalize),
);

function mergeMachines(canonical = [], redux = []) {
  return Array.from(
    new Map(
      [...canonical, ...redux].map((entry) => [
        `${entry.tab ?? "tm"}:${entry.source ?? ""}:${normalize(entry.move ?? "")}`,
        entry,
      ]),
    ).values(),
  );
}

async function readJson(baseDir, fileName) {
  const raw = await readFile(path.join(baseDir, fileName), "utf8");
  return JSON.parse(raw);
}

function buildPokemonIndex(canonical, reduxOverrides, canonicalLearnsets, { applyOverrides }) {
  const index = {};

  for (const entry of Object.values(canonical)) {
    const key = normalize(entry.slug ?? entry.name);
    const canonicalEntryLearnsets = canonicalLearnsets[key] ?? {
      levelUp: [],
      machines: [],
    };
    const reduxLearnsets = reduxOverrides?.[key]?.learnsets ?? {
      levelUp: [],
      machines: [],
    };

    index[key] = {
      ...entry,
      types: applyOverrides ? reduxOverrides?.[key]?.complete?.types ?? entry.types : entry.types,
      stats: applyOverrides ? reduxOverrides?.[key]?.complete?.stats ?? entry.stats : entry.stats,
      abilities: applyOverrides ? reduxOverrides?.[key]?.complete?.abilities ?? entry.abilities : entry.abilities,
      learnsets: {
        levelUp:
          reduxLearnsets.levelUp?.length > 0
            ? reduxLearnsets.levelUp
            : canonicalEntryLearnsets.levelUp ?? [],
        machines: mergeMachines(
          canonicalEntryLearnsets.machines ?? [],
          reduxLearnsets.machines ?? [],
        ),
      },
    };
  }

  return index;
}

async function main() {
  const speciesList = await readJson(LOCAL_DEX_DIR, "species-list.json");
  const canonicalPokemon = await readJson(REFERENCE_DIR, "pokemon-canonical-gen5.json");
  const reduxOverrides = await readJson(REFERENCE_DIR, "pokemon-redux-overrides-gen5.json");
  const canonicalLearnsets = await readJson(REFERENCE_DIR, "pokemon-canonical-learnsets-gen5.json");
  const currentPokemonIndex = buildPokemonIndex(
    canonicalPokemon,
    reduxOverrides,
    canonicalLearnsets,
    { applyOverrides: true },
  );
  const canonicalPokemonIndex = buildPokemonIndex(
    canonicalPokemon,
    reduxOverrides,
    canonicalLearnsets,
    { applyOverrides: false },
  );

  const dexList = speciesList
    .map((species) => {
      const canonicalEntry =
        canonicalPokemonIndex[species.slug] ??
        canonicalPokemonIndex[normalize(species.name)];
      const currentEntry =
        currentPokemonIndex[species.slug] ??
        currentPokemonIndex[normalize(species.name)] ??
        canonicalEntry ??
        null;
      const types = currentEntry?.types ?? species.types ?? [];
      const abilities = currentEntry?.abilities ?? [];

      return {
        dex: species.dex,
        name: species.name,
        slug: species.slug,
        types,
        abilities,
        isLegendaryOrUnique: LEGENDARY_OR_UNIQUE_SPECIES.has(species.slug) || LEGENDARY_OR_UNIQUE_SPECIES.has(normalize(species.name)),
        hasTypeChanges:
          JSON.stringify(types.map(normalize)) !==
          JSON.stringify((canonicalEntry?.types ?? []).map(normalize)),
        hasStatChanges:
          JSON.stringify(currentEntry?.stats ?? null) !== JSON.stringify(canonicalEntry?.stats ?? null),
        hasAbilityChanges:
          JSON.stringify(abilities.map(normalize)) !==
          JSON.stringify((canonicalEntry?.abilities ?? []).map(normalize)),
      };
    })
    .sort((left, right) => left.dex - right.dex || left.name.localeCompare(right.name));

  await mkdir(LOCAL_DEX_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DEX_DIR, "dex-list.json"), JSON.stringify(dexList, null, 2));
  console.log(`dex-list built: ${dexList.length} entries`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
