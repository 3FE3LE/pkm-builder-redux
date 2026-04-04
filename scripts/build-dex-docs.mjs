import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "Documentation");
const OUTPUT_DIR = path.join(ROOT, "data", "local-dex");

function cleanLine(line) {
  return line.replace(/\t/g, " ").trimEnd();
}

async function readDoc(fileName) {
  return (await readFile(path.join(DOCS_DIR, fileName), "utf8")).replace(/\r/g, "");
}

function parseGiftPokemon(text) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n(?=[^\n]+\.\n---\n)/)
    .map((block) => block.trim())
    .filter((block) => block.includes("Location:"));

  const gifts = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const name = lines[0].replace(/\.$/, "");
    const locationLine = lines.find((line) => line.startsWith("Location:"));
    const levelLine = lines.find((line) => line.startsWith("Level:"));
    if (!locationLine || !levelLine) {
      continue;
    }
    const notes = lines.filter((line) => line.startsWith("-")).map((line) => line.replace(/^- /, ""));
    gifts.push({
      name,
      location: locationLine.replace("Location:", "").trim(),
      level: levelLine.replace("Level:", "").trim(),
      notes,
    });
  }

  return gifts;
}

function parseTradePokemon(text) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n(?=[^\n]+\.\n---\n)/)
    .map((block) => block.trim())
    .filter((block) => block.includes("Location:"));

  const trades = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const name = lines[0].replace(/\.$/, "");
    const location = lines.find((line) => line.startsWith("Location:"))?.replace("Location:", "").trim();
    const requestLine = lines.find((line) => line.includes("looking for"));
    if (!location || !requestLine) {
      continue;
    }
    const tradeMatch = requestLine.match(/looking for (.+?) in exchange for (.+?)[,.]/i);
    trades.push({
      name,
      location,
      requested: tradeMatch?.[1]?.trim() ?? "Unknown",
      received: tradeMatch?.[2]?.trim() ?? name,
      traits: lines.filter((line) => line.startsWith("-")).map((line) => line.replace(/^- /, "")),
    });
  }

  return trades;
}

function parseItemChanges(text) {
  const lines = text.split("\n").map(cleanLine);
  const locations = [];
  let currentArea = null;
  let inLocations = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (/^=+$/.test(line) || /^o-+/.test(line) || /^\|/.test(line)) {
      continue;
    }
    if (line === "Item Locations") {
      inLocations = true;
      continue;
    }
    if (!inLocations) {
      continue;
    }
    const areaMatch = line.match(/^~{5,}\s+(.+?)\s+~{5,}$/);
    if (areaMatch) {
      currentArea = { area: areaMatch[1].trim(), items: [] };
      locations.push(currentArea);
      continue;
    }
    if (currentArea) {
      currentArea.items.push(line);
    }
  }

  return locations;
}

function parseWildAreas(text) {
  const lines = text.split("\n").map(cleanLine);
  const areas = [];
  let currentArea = null;
  let currentMethod = null;
  let inHiddenGrottoGuide = false;
  let hiddenGrottoArea = null;
  let hiddenGrottoMethod = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line === "Hidden Grotto Guide") {
      inHiddenGrottoGuide = true;
      currentArea = null;
      currentMethod = null;
      continue;
    }
    if (/^=+$/.test(line) || /^o-+/.test(line) || /^\|/.test(line) || line.startsWith("Main Story")) {
      continue;
    }
    const areaMatch = line.match(/^~{5,}\s+(.+?)\s+~{5,}$/);
    if (areaMatch) {
      if (inHiddenGrottoGuide) {
        hiddenGrottoArea = { area: areaMatch[1].trim(), methods: [] };
        areas.push(hiddenGrottoArea);
        hiddenGrottoMethod = null;
      } else {
        currentArea = { area: areaMatch[1].trim(), methods: [] };
        areas.push(currentArea);
        currentMethod = null;
      }
      continue;
    }
    if (inHiddenGrottoGuide) {
      if (!hiddenGrottoArea) {
        continue;
      }
      if (line.endsWith("Encounters:")) {
        hiddenGrottoMethod = {
          method: `Hidden Grotto - ${line.replace(/:$/, "").trim()}`,
          encounters: [],
        };
        hiddenGrottoArea.methods.push(hiddenGrottoMethod);
        continue;
      }
      if (hiddenGrottoMethod && line.startsWith("- ")) {
        hiddenGrottoMethod.encounters.push({
          species: line.replace(/^- /, "").trim(),
          level: "",
        });
      }
      continue;
    }
    if (!currentArea) {
      continue;
    }
    if (line.includes(":") && !line.startsWith("-") && !line.startsWith("Location:")) {
      const methodName = line.split(":")[0].trim();
      currentMethod = { method: methodName, encounters: [] };
      currentArea.methods.push(currentMethod);
      continue;
    }
    if (
      currentMethod &&
      !line.startsWith("-") &&
      !/^[- ]+$/.test(line) &&
      !line.startsWith("A common metric")
    ) {
      const encounterMatch = line.match(/^(.+?)\s+Lv\.\s+([0-9\-]+)\s+([0-9]+%)?$/i);
      if (encounterMatch) {
        currentMethod.encounters.push({
          species: encounterMatch[1].trim(),
          level: encounterMatch[2].trim(),
          rate: encounterMatch[3]?.trim(),
        });
      }
    }
  }

  return areas;
}

async function main() {
  const [itemChanges, gifts, trades, wildAreas] = await Promise.all([
    readDoc("Item Changes.txt"),
    readDoc("Gift Pokemon.txt"),
    readDoc("Trade Changes.txt"),
    readDoc("Wild Area Changes.txt"),
  ]);

  const dexDocs = {
    itemLocations: parseItemChanges(itemChanges),
    gifts: parseGiftPokemon(gifts),
    trades: parseTradePokemon(trades),
    wildAreas: parseWildAreas(wildAreas),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "dex-docs.json"), JSON.stringify(dexDocs, null, 2));
  console.log("Dex docs generated in data/local-dex/dex-docs.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
