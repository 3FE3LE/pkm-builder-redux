import { readFileSync } from "node:fs";
import path from "node:path";

import type {
  BaseStats,
  EvolutionChange,
  GiftPokemon,
  ItemLocation,
  MoveDetail,
  MoveReplacement,
  MoveTypeOverride,
  ParsedDocs,
  PokemonProfile,
  PokemonTypeChange,
  TradePokemon,
  WildArea,
  WildMethod,
} from "@/lib/docsSchema";

const DOCS_DIR = path.join(process.cwd(), "Documentation");

function readDoc(fileName: string) {
  return readFileSync(path.join(DOCS_DIR, fileName), "utf8").replace(/\r/g, "");
}

function cleanLine(line: string) {
  return line.replace(/\t/g, " ").trimEnd();
}

function parseMoveChanges(text: string) {
  const lines = text.split("\n").map(cleanLine);
  const replacements: MoveReplacement[] = [];
  const typeChanges: string[] = [];
  const typeOverrides: MoveTypeOverride[] = [];
  const details: MoveDetail[] = [];

  let section = "";
  let currentMove: MoveDetail | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      currentMove = section === "Redux Move Modifications" ? currentMove : null;
      continue;
    }
    if (/^=+$/.test(line) || /^-+$/.test(line) || /^o-+/.test(line) || /^\|/.test(line)) {
      continue;
    }
    if (
      line === "Move Replacements" ||
      line === "Type Changes" ||
      line === "Redux Move Modifications"
    ) {
      section = line;
      currentMove = null;
      continue;
    }

    if (section === "Move Replacements") {
      if (line.startsWith("Old Move") || line.startsWith("The attributes") || line.startsWith("To help")) {
        continue;
      }
      const match = line.match(/^(.+?)\s{2,}(.+)$/);
      if (match) {
        replacements.push({
          oldMove: match[1].trim(),
          newMove: match[2].trim(),
        });
      }
      continue;
    }

    if (section === "Type Changes") {
      if (line.startsWith("Certain moves")) {
        continue;
      }
      if (!line.startsWith("-") && !line.startsWith(" - ")) {
        typeChanges.push(line);
      } else {
        const last = typeChanges.pop();
        if (last) {
          const detail = line.replace(/^-\s*/, "");
          typeChanges.push(`${last} ${detail}`);
          const match = detail.match(/^Type\s+(.+?)\s+->\s+(.+)$/i);
          if (match) {
            typeOverrides.push({
              move: last,
              from: match[1].trim(),
              to: match[2].trim().replace(/\s+\[[^\]]+\]$/, ""),
            });
          }
        }
      }
      continue;
    }

    if (section === "Redux Move Modifications") {
      if (!line.startsWith("-")) {
        currentMove = { move: line, changes: [] };
        details.push(currentMove);
        continue;
      }
      if (!currentMove) {
        continue;
      }
      const match = line.match(/^- (.+?) (.+?) -> (.+?)(?: (\[[^\]]+\]))?$/);
      if (match) {
        currentMove.changes.push({
          field: match[1].trim(),
          from: match[2].trim(),
          to: match[3].trim(),
          tag: match[4]?.trim(),
        });
      } else {
        currentMove.changes.push({
          field: "Note",
          from: "",
          to: line.replace(/^- /, ""),
        });
      }
    }
  }

  return { replacements, typeChanges, typeOverrides, details };
}

function parseTypeChanges(text: string) {
  const lines = text.split("\n").map(cleanLine);
  const results: PokemonTypeChange[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith("#")) {
      continue;
    }
    const match = line.match(
      /^(#\d+)\s+(.+?)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+)$/
    );
    if (!match) {
      continue;
    }
    results.push({
      dex: match[1],
      pokemon: match[2].trim(),
      oldType: match[3].trim(),
      newType: match[4].trim(),
      justification: match[5].trim(),
    });
  }

  return results;
}

function parseGiftPokemon(text: string) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n(?=[^\n]+\.\n---\n)/)
    .map((block) => block.trim())
    .filter((block) => block.includes("Location:"));

  const gifts: GiftPokemon[] = [];

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

function parseTradePokemon(text: string) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n(?=[^\n]+\.\n---\n)/)
    .map((block) => block.trim())
    .filter((block) => block.includes("Location:"));

  const trades: TradePokemon[] = [];

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

function parseItemChanges(text: string) {
  const lines = text.split("\n").map(cleanLine);
  const highlights: string[] = [];
  const locations: ItemLocation[] = [];
  const shops: { area: string; details: string[] }[] = [];
  let currentArea: ItemLocation | null = null;
  let currentShop: { area: string; details: string[] } | null = null;
  let inLocations = false;
  let inShops = false;

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
      inShops = false;
      currentShop = null;
      continue;
    }
    if (line === "Modified Marts") {
      inLocations = false;
      inShops = true;
      currentArea = null;
      continue;
    }
    if (!inLocations && !inShops) {
      if (line.startsWith("- ")) {
        highlights.push(line.replace(/^- /, ""));
      }
      continue;
    }
    const areaMatch = line.match(/^~{5,}\s+(.+?)\s+~{5,}$/);
    if (areaMatch) {
      if (inLocations) {
        currentArea = { area: areaMatch[1].trim(), items: [] };
        locations.push(currentArea);
      }
      if (inShops) {
        currentShop = { area: areaMatch[1].trim(), details: [] };
        shops.push(currentShop);
      }
      continue;
    }
    if (inLocations && currentArea) {
      currentArea.items.push(line);
    }
    if (inShops && currentShop) {
      currentShop.details.push(line);
    }
  }

  return { highlights, locations, shops };
}

function parseWildAreas(text: string) {
  const lines = text.split("\n").map(cleanLine);
  const areas: WildArea[] = [];
  let currentArea: WildArea | null = null;
  let currentMethod: WildMethod | null = null;
  let inHiddenGrottoGuide = false;
  let hiddenGrottoArea: WildArea | null = null;
  let hiddenGrottoMethod: WildMethod | null = null;

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

function parseStatsLine(line: string): BaseStats | undefined {
  const match = line.match(
    /(\d+)\s+HP\s+\/\s+(\d+)\s+Atk\s+\/\s+(\d+)\s+Def\s+\/\s+(\d+)\s+SAtk\s+\/\s+(\d+)\s+SDef\s+\/\s+(\d+)\s+Spd\s+\/\s+(\d+)\s+BST/i
  );
  if (!match) {
    return undefined;
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

function parsePokemonChanges(text: string) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/(?=^===================\n\d{3} - .+\n===================$)/m)
    .map((block) => block.trim())
    .filter((block) => /^\d{3} - /m.test(block));

  const profiles: PokemonProfile[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(cleanLine);
    const headerIndex = lines.findIndex((line) => /^\d{3} - /.test(line));
    if (headerIndex < 0) {
      continue;
    }
    const headerMatch = lines[headerIndex].match(/^(\d{3}) - (.+)$/);
    if (!headerMatch) {
      continue;
    }

    const profile: PokemonProfile = {
      dex: Number(headerMatch[1]),
      species: headerMatch[2].trim(),
    };

    for (let index = headerIndex + 1; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (line === "Base Stats (Complete):") {
        const stats = parseStatsLine(lines[index + 2] ?? "");
        if (stats) {
          profile.stats = stats;
        }
      }
      if (line === "Type (Complete):") {
        const newLine = (lines[index + 2] ?? "").trim();
        const typeMatch = newLine.match(/^New\s+(.+)$/);
        if (typeMatch) {
          profile.types = typeMatch[1].split("/").map((value) => value.trim());
        }
      }
      if (line === "Ability (Complete):" || line === "Ability (Complete / Classic):") {
        const newLine = (lines[index + 2] ?? "").trim();
        const abilityMatch = newLine.match(/^New\s+(.+)$/);
        if (abilityMatch) {
          profile.abilities = abilityMatch[1].split("/").map((value) => value.trim());
        }
      }
    }

    profiles.push(profile);
  }

  return profiles;
}

function parseEvolutionChanges(text: string) {
  const lines = text.split("\n").map(cleanLine);
  const changes: EvolutionChange[] = [];
  let inSection = false;
  let currentDex: number | null = null;
  let currentSpecies: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      continue;
    }
    if (line === "Evolution Changes") {
      inSection = true;
      continue;
    }
    if (!inSection || /^=+$/.test(line) || /^-+$/.test(line) || /^o-+/.test(line) || /^\|/.test(line)) {
      continue;
    }
    if (line.startsWith("Pokémon") || line.startsWith("---")) {
      continue;
    }

    const fullEntryMatch = line.match(/^(\d{3})\s+(.+?)\s{2,}(Now evolves.+)$/);
    const continuationMatch = line.match(/^\s+(Now evolves.+)$/);

    let summary = "";
    if (fullEntryMatch) {
      currentDex = Number(fullEntryMatch[1]);
      currentSpecies = fullEntryMatch[2].trim();
      summary = fullEntryMatch[3].trim();
    } else if (continuationMatch && currentDex !== null && currentSpecies) {
      summary = continuationMatch[1].trim();
    } else {
      continue;
    }

    const targetMatch = summary.match(/^Now evolves into (.+?)(?: at Level| via the use of| by leveling up| if | in addition|\.?$)/i);
    const target = targetMatch?.[1]?.trim() ?? "Unknown";

    changes.push({
      dex: currentDex!,
      species: currentSpecies!,
      target,
      method: summarizeEvolutionMethod(summary),
      summary,
    });
  }

  return changes;
}

function summarizeEvolutionMethod(summary: string) {
  const levelMatch = summary.match(/at Level (\d+)/i);
  if (levelMatch) {
    return `Lv ${levelMatch[1]}`;
  }

  const itemMatch = summary.match(/via the use of (?:an|a) (.+?)\./i);
  if (itemMatch) {
    return itemMatch[1].trim();
  }

  const moveMatch = summary.match(/while knowing the move (.+?)\./i);
  if (moveMatch) {
    return `Move: ${moveMatch[1].trim()}`;
  }

  const friendshipMatch = summary.match(/while at (.+?)\./i);
  if (friendshipMatch) {
    return friendshipMatch[1].trim();
  }

  const partyMatch = summary.match(/when a (.+?) is in the party\./i);
  if (partyMatch) {
    return `Party: ${partyMatch[1].trim()}`;
  }

  const conditionMatch = summary.match(/if Burmy is (female|male)\./i);
  if (conditionMatch) {
    return conditionMatch[1].trim();
  }

  if (/normal evolution method/i.test(summary)) {
    return "Normal method";
  }

  return summary.replace(/^Now evolves into .+? /i, "").replace(/\.$/, "").trim();
}

export function parseDocumentation(): ParsedDocs {
  const moveChanges = parseMoveChanges(readDoc("Move Changes.txt"));
  const typeChanges = parseTypeChanges(readDoc("Type Changes.txt"));
  const itemChanges = parseItemChanges(readDoc("Item Changes.txt"));
  const gifts = parseGiftPokemon(readDoc("Gift Pokemon.txt"));
  const trades = parseTradePokemon(readDoc("Trade Changes.txt"));
  const wildAreas = parseWildAreas(readDoc("Wild Area Changes.txt"));
  const pokemonProfiles = parsePokemonChanges(readDoc("Pokemon Changes.txt"));
  const evolutionChanges = parseEvolutionChanges(readDoc("Evolution Changes.txt"));

  return {
    moveReplacements: moveChanges.replacements,
    moveTypeChanges: moveChanges.typeChanges,
    moveTypeOverrides: moveChanges.typeOverrides,
    moveDetails: moveChanges.details,
    typeChanges,
    itemLocations: itemChanges.locations,
    itemShops: itemChanges.shops,
    itemHighlights: itemChanges.highlights,
    gifts,
    trades,
    wildAreas,
    pokemonProfiles,
    evolutionChanges,
  };
}

export function parseDexDocumentation(): ParsedDocs {
  const itemChanges = parseItemChanges(readDoc("Item Changes.txt"));
  const gifts = parseGiftPokemon(readDoc("Gift Pokemon.txt"));
  const trades = parseTradePokemon(readDoc("Trade Changes.txt"));
  const wildAreas = parseWildAreas(readDoc("Wild Area Changes.txt"));

  return {
    moveReplacements: [],
    moveTypeChanges: [],
    moveTypeOverrides: [],
    moveDetails: [],
    typeChanges: [],
    itemLocations: itemChanges.locations,
    itemShops: itemChanges.shops,
    itemHighlights: [],
    gifts,
    trades,
    wildAreas,
    pokemonProfiles: [],
    evolutionChanges: [],
  };
}
