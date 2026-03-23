import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DOC_PATH = path.join(ROOT, "Documentation", "Pokemon Changes.txt");
const OUTPUT_DIR = path.join(ROOT, "data", "reference");

function normalize(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

function parseStatsLine(line) {
  const match = line.match(
    /(\d+)\s+HP\s+\/\s+(\d+)\s+Atk\s+\/\s+(\d+)\s+Def\s+\/\s+(\d+)\s+SAtk\s+\/\s+(\d+)\s+SDef\s+\/\s+(\d+)\s+Spd\s+\/\s+(\d+)\s+BST/i
  );
  if (!match) {
    return null;
  }
  return {
    hp: Number(match[1]),
    atk: Number(match[2]),
    def: Number(match[3]),
    spa: Number(match[4]),
    spd: Number(match[5]),
    spe: Number(match[6]),
    bst: Number(match[7]),
  };
}

function parsePokemonChanges(text) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/(?=^===================\n\d{3} - .+\n===================$)/m)
    .map((block) => block.trim())
    .filter((block) => /^\d{3} - /m.test(block));

  const overrides = {};
  const moveNames = new Set();

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trimEnd());
    const header = lines.find((line) => /^\d{3} - /.test(line));
    const headerMatch = header?.match(/^(\d{3}) - (.+)$/);
    if (!headerMatch) {
      continue;
    }

    const dex = Number(headerMatch[1]);
    const species = headerMatch[2].trim();
    const slug = normalize(species);
    const entry = {
      dex,
      species,
      slug,
      complete: {},
      classic: {},
      learnsets: {
        levelUp: [],
        machines: [],
      },
    };

    let inLevelUp = false;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line) {
        inLevelUp = false;
        continue;
      }

      if (line === "Base Stats (Complete):") {
        const stats = parseStatsLine((lines[index + 2] ?? "").trim());
        if (stats) {
          entry.complete.stats = stats;
        }
        continue;
      }

      if (line === "Ability (Complete):" || line === "Ability (Complete / Classic):") {
        const abilityLine = (lines[index + 2] ?? "").trim();
        const match = abilityLine.match(/^New\s+(.+)$/);
        if (match) {
          entry.complete.abilities = match[1].split("/").map((value) => value.trim());
        }
        continue;
      }

      if (line === "Ability (Classic):" || line === "Ability (Complete / Classic):") {
        const classicLine =
          line === "Ability (Classic):" ? (lines[index + 2] ?? "").trim() : (lines[index + 2] ?? "").trim();
        const match = classicLine.match(/^New\s+(.+)$/);
        if (match) {
          entry.classic.abilities = match[1].split("/").map((value) => value.trim());
        }
      }

      if (line === "Type (Complete):") {
        const typeLine = (lines[index + 2] ?? "").trim();
        const match = typeLine.match(/^New\s+(.+)$/);
        if (match) {
          entry.complete.types = match[1].split("/").map((value) => value.trim());
        }
        continue;
      }

      const machineMatch = line.match(/^Now compatible with (TM\d+|HM\d+),\s+(.+?)\.(?: \[\*\])?$/);
      if (machineMatch) {
        const moveName = machineMatch[2].trim();
        entry.learnsets.machines.push({
          source: machineMatch[1],
          move: moveName,
          tab: machineMatch[1].startsWith("HM") ? "hm" : "tm",
        });
        moveNames.add(moveName);
        continue;
      }

      const tutorMatch = line.match(/^Now compatible with (.+?) from the Move Tutor\.$/);
      if (tutorMatch) {
        const moveName = tutorMatch[1].trim();
        entry.learnsets.machines.push({
          source: "Tutor",
          move: moveName,
          tab: "tutor",
        });
        moveNames.add(moveName);
        continue;
      }

      if (line === "Level Up:" || line === "Level Up: " || line === "Level Up:    " || line === "Level Up: ") {
        inLevelUp = true;
        continue;
      }

      if (inLevelUp) {
        const moveMatch = line.match(/^(\d+)\s+-\s+(.+)$/);
        if (moveMatch) {
          const moveName = moveMatch[2].replace(/\s+\[\*\]$/, "").trim();
          entry.learnsets.levelUp.push({
            level: Number(moveMatch[1]),
            move: moveName,
          });
          moveNames.add(moveName);
          continue;
        }
        inLevelUp = false;
      }
    }

    overrides[slug] = entry;
  }

  return {
    overrides,
    moveNames: Array.from(moveNames).sort((left, right) => left.localeCompare(right)),
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const source = await readFile(DOC_PATH, "utf8");
  const { overrides, moveNames } = parsePokemonChanges(source);

  await writeFile(
    path.join(OUTPUT_DIR, "pokemon-redux-overrides-gen5.json"),
    JSON.stringify(overrides, null, 2)
  );
  await writeFile(path.join(OUTPUT_DIR, "move-name-list-gen5.json"), JSON.stringify(moveNames, null, 2));

  console.log("Wrote data/reference/pokemon-redux-overrides-gen5.json");
  console.log("Wrote data/reference/move-name-list-gen5.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
