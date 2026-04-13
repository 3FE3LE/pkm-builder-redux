export type RecommendationSeason = "spring" | "summer" | "autumn" | "winter";

const SEASON_BY_REMAINDER: Record<number, RecommendationSeason> = {
  0: "spring",
  1: "summer",
  2: "autumn",
  3: "winter",
};

export function getSeasonFromMonth(month: number): RecommendationSeason {
  const normalizedMonth = Number.isFinite(month) ? Math.abs(Math.trunc(month)) % 12 : 0;
  return SEASON_BY_REMAINDER[normalizedMonth % 4];
}
