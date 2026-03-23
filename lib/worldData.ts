import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { WorldData, WorldGift, WorldItemLocation, WorldTrade, WorldArea } from "@/lib/worldDataSchema";

const REFERENCE_DIR = path.join(process.cwd(), "data", "reference");

function readReferenceArray<T>(fileName: string): T[] {
  const filePath = path.join(REFERENCE_DIR, fileName);
  if (!existsSync(filePath)) {
    return [];
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as T[];
}

export function getWorldData(): WorldData {
  return {
    gifts: readReferenceArray<WorldGift>("gift-pokemon.json"),
    trades: readReferenceArray<WorldTrade>("trade-pokemon.json"),
    items: readReferenceArray<WorldItemLocation>("item-locations.json"),
    wildAreas: readReferenceArray<WorldArea>("wild-areas.json"),
  };
}
