import { normalizeMoveLookupName } from "@/lib/domain/moves";
import type { RemotePokemon } from "@/lib/teamAnalysis";

export type LevelUpMoveEntry = NonNullable<RemotePokemon["learnsets"]>["levelUp"][number];

export function getLevelUpMovesBetweenLevels({
  learnset,
  currentMoves,
  fromLevel,
  toLevel,
}: {
  learnset: LevelUpMoveEntry[];
  currentMoves: string[];
  fromLevel: number;
  toLevel: number;
}) {
  if (toLevel <= fromLevel) {
    return [];
  }

  const knownMoves = new Set(currentMoves.map((move) => normalizeMoveLookupName(move)));
  const seen = new Set<string>();

  return [...learnset]
    .filter(
      (entry) =>
        typeof entry.level === "number" &&
        entry.level > fromLevel &&
        entry.level <= toLevel,
    )
    .sort((left, right) => left.level - right.level || left.move.localeCompare(right.move))
    .filter((entry) => {
      const key = normalizeMoveLookupName(entry.move);
      if (knownMoves.has(key) || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function mergeLevelUpMoveQueues(
  currentQueue: LevelUpMoveEntry[],
  nextEntries: LevelUpMoveEntry[],
) {
  if (!nextEntries.length) {
    return currentQueue;
  }

  const seen = new Set(currentQueue.map((entry) => normalizeMoveLookupName(entry.move)));
  const merged = [...currentQueue];

  nextEntries.forEach((entry) => {
    const key = normalizeMoveLookupName(entry.move);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(entry);
  });

  return merged;
}
