import type { CandidateScore } from "../profiles/types";

type CacheEntry = {
  scores: CandidateScore[];
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();

const MAX_ENTRIES = 32;
const TTL_MS = 60_000; // 1 minute

export function buildCacheKey(
  teamIds: string[],
  encounterId: string | null,
  checkpointId: string,
  filterHash: string,
): string {
  return `${teamIds.sort().join(",")}_${encounterId ?? "none"}_${checkpointId}_${filterHash}`;
}

export function getCachedScores(key: string): CandidateScore[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.scores;
}

export function setCachedScores(key: string, scores: CandidateScore[]): void {
  // Evict oldest if full
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest != null) cache.delete(oldest);
  }
  cache.set(key, { scores, timestamp: Date.now() });
}

export function clearScoringCache(): void {
  cache.clear();
}
