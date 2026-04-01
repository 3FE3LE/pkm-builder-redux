export {
  buildSpriteUrls,
  formatName,
  normalizeName,
  toTitleCase,
} from "@/lib/domain/names";
export {
  TYPE_COLORS,
  TYPE_ORDER,
  TYPE_STYLES,
  getMultiplierBucket,
  getMultiplierLabel,
  getTypeEffectiveness,
} from "@/lib/domain/typeChart";
export type { MultiplierBucket } from "@/lib/domain/typeChart";
export {
  applyStatModifiers,
  buildAverageStats,
  buildCoverageSummary,
  buildDefensiveSections,
  buildDefensiveSummary,
  buildThreatSummary,
  calculateEffectiveStats,
  getNatureEffect,
  getStatModifiers,
} from "@/lib/domain/battle";
export {
  applyMovePowerModifiers,
  getHiddenPowerResult,
  getMovePowerModifiers,
  normalizeMoveLookupName,
  resolveMovePower,
  resolveMoveType,
} from "@/lib/domain/moves";

export type {
  FullStatKey,
  RemoteAbility,
  RemoteEvolutionDetail,
  RemoteItem,
  RemoteMove,
  RemotePokemon,
  ResolvedTeamMember,
  StatKey,
  StatSpread,
} from "@/lib/teamAnalysis.types";
export { supportsPokemonGender } from "@/lib/teamAnalysis.gender";
export { resolvePokemonProfile } from "@/lib/teamAnalysis.profile";
