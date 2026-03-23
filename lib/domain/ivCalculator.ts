import { calculateEffectiveStats, type FullStatKey, type Stats } from "./battle";

export type IvInferenceResult = {
  stat: FullStatKey;
  observed: number;
  iv0Value: number;
  iv31Value: number;
  candidates: number[];
  exactIv: number | null;
  minIv: number | null;
  maxIv: number | null;
};

export function getRepresentativeIv(result: IvInferenceResult) {
  if (result.exactIv !== null) {
    return result.exactIv;
  }
  if (result.minIv === null || result.maxIv === null) {
    return 0;
  }
  return Math.round((result.minIv + result.maxIv) / 2);
}

const ZERO_EVS = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
} as const;

export function inferIvForObservedStat({
  baseStats,
  level,
  nature,
  stat,
  observed,
}: {
  baseStats: Stats;
  level: number;
  nature: string;
  stat: FullStatKey;
  observed: number;
}): IvInferenceResult {
  const candidates: number[] = [];

  for (let iv = 0; iv <= 31; iv += 1) {
    const stats = calculateEffectiveStats(baseStats, level, nature, { [stat]: iv }, ZERO_EVS);
    if (stats[stat] === observed) {
      candidates.push(iv);
    }
  }

  const iv0Value = calculateEffectiveStats(baseStats, level, nature, { [stat]: 0 }, ZERO_EVS)[stat];
  const iv31Value = calculateEffectiveStats(baseStats, level, nature, { [stat]: 31 }, ZERO_EVS)[stat];

  return {
    stat,
    observed,
    iv0Value,
    iv31Value,
    candidates,
    exactIv: candidates.length === 1 ? candidates[0] : null,
    minIv: candidates.length ? candidates[0] : null,
    maxIv: candidates.length ? candidates[candidates.length - 1] : null,
  };
}
