import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DOC_DIR = path.join(ROOT, "Documentation");
const OUTPUT_DIR = path.join(ROOT, "data", "reference");

function cleanLine(line) {
  return line.replace(/\r/g, "").replace(/\t/g, " ").trimEnd();
}

async function readDoc(fileName) {
  return readFile(path.join(DOC_DIR, fileName), "utf8");
}

function parseGiftPokemon(text) {
  return text
    .replace(/\r/g, "")
    .split(/\n(?=[^\n]+\.\n---\n)/)
    .map((block) => block.trim())
    .filter((block) => block.includes("Location:"))
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      return {
        name: lines[0].replace(/\.$/, ""),
        location: lines.find((line) => line.startsWith("Location:"))?.replace("Location:", "").trim() ?? "",
        level: lines.find((line) => line.startsWith("Level:"))?.replace("Level:", "").trim() ?? "",
        notes: lines.filter((line) => line.startsWith("-")).map((line) => line.replace(/^- /, "")),
      };
    });
}

function parseTradePokemon(text) {
  return text
    .replace(/\r/g, "")
    .split(/\n(?=[^\n]+\.\n---\n)/)
    .map((block) => block.trim())
    .filter((block) => block.includes("Location:"))
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const requestLine = lines.find((line) => line.includes("looking for"));
      const tradeMatch = requestLine?.match(/looking for (.+?) in exchange for (.+?)[,.]/i);
      return {
        name: lines[0].replace(/\.$/, ""),
        location: lines.find((line) => line.startsWith("Location:"))?.replace("Location:", "").trim() ?? "",
        requested: tradeMatch?.[1]?.trim() ?? "",
        received: tradeMatch?.[2]?.trim() ?? "",
        traits: lines.filter((line) => line.startsWith("-")).map((line) => line.replace(/^- /, "")),
      };
    });
}

function parseItemChanges(text) {
  const lines = text.split("\n").map(cleanLine);
  const results = [];
  let current = null;
  let inLocations = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed === "Item Locations") {
      inLocations = true;
      continue;
    }
    if (!inLocations || /^=+$/.test(trimmed) || /^o-+/.test(trimmed) || /^\|/.test(trimmed)) {
      continue;
    }
    const areaMatch = trimmed.match(/^~~~~~\s+(.+?)\s+~~~~~$/);
    if (areaMatch) {
      current = { area: areaMatch[1].trim(), items: [] };
      results.push(current);
      continue;
    }
    if (current) {
      current.items.push(trimmed);
    }
  }

  return results;
}

function parseWildAreas(text) {
  const lines = text.split("\n").map(cleanLine);
  const areas = [];
  let currentArea = null;
  let currentMethod = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (/^=+$/.test(trimmed) || /^o-+/.test(trimmed) || /^\|/.test(trimmed) || trimmed.startsWith("Main Story")) {
      continue;
    }
    const areaMatch = trimmed.match(/^~~~~~\s+(.+?)\s+~~~~~$/);
    if (areaMatch) {
      currentArea = { area: areaMatch[1].trim(), methods: [] };
      areas.push(currentArea);
      currentMethod = null;
      continue;
    }
    if (!currentArea) {
      continue;
    }
    if (trimmed.includes(":") && !trimmed.startsWith("-") && !trimmed.startsWith("Location:")) {
      currentMethod = { method: trimmed.split(":")[0].trim(), encounters: [] };
      currentArea.methods.push(currentMethod);
      continue;
    }
    if (currentMethod) {
      const match = trimmed.match(/^(.+?)\s+Lv\.\s+([0-9\-]+)\s+([0-9]+%)?$/i);
      if (match) {
        currentMethod.encounters.push({
          species: match[1].trim(),
          level: match[2].trim(),
          rate: match[3]?.trim() ?? null,
        });
      }
    }
  }

  return areas;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [giftText, tradeText, itemText, wildText] = await Promise.all([
    readDoc("Gift Pokemon.txt"),
    readDoc("Trade Changes.txt"),
    readDoc("Item Changes.txt"),
    readDoc("Wild Area Changes.txt"),
  ]);

  await writeFile(
    path.join(OUTPUT_DIR, "gift-pokemon.json"),
    JSON.stringify(parseGiftPokemon(giftText), null, 2)
  );
  await writeFile(
    path.join(OUTPUT_DIR, "trade-pokemon.json"),
    JSON.stringify(parseTradePokemon(tradeText), null, 2)
  );
  await writeFile(
    path.join(OUTPUT_DIR, "item-locations.json"),
    JSON.stringify(parseItemChanges(itemText), null, 2)
  );
  await writeFile(
    path.join(OUTPUT_DIR, "wild-areas.json"),
    JSON.stringify(parseWildAreas(wildText), null, 2)
  );

  console.log("Wrote data/reference world-data JSON files");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
