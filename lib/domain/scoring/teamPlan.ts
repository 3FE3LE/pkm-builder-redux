import type { PokemonProfile, TeamPlanContext } from "../profiles/types";
import { buildTeamSnapshot } from "../profiles/buildTeamSnapshot";
import { normalizeName } from "../names";

export function buildTeamPlanContext(
  team: Array<{ species: string; locked?: boolean }>,
  profiles: PokemonProfile[],
): TeamPlanContext {
  const lockedSpecies = new Set(
    team
      .filter((member) => member.locked)
      .map((member) => normalizeName(member.species)),
  );
  const profileBySpecies = new Map(
    profiles.map((profile) => [normalizeName(profile.name), profile] as const),
  );
  const rankedMembers = team
    .filter((member) => member.species.trim())
    .map((member) => {
      const profile = profileBySpecies.get(normalizeName(member.species));
      return {
        species: member.species,
        locked: member.locked ?? false,
        profile,
        score: profile ? scoreCoreFit(profile, member.locked ?? false) : -1,
      };
    })
    .sort((left, right) => right.score - left.score);

  const coreSlots = rankedMembers.length >= 4 ? 4 : rankedMembers.length >= 3 ? 3 : rankedMembers.length;
  const coreSpecies = new Set(
    rankedMembers
      .slice(0, coreSlots)
      .map((member) => normalizeName(member.species)),
  );
  const flexSpecies = new Set(
    rankedMembers
      .slice(coreSlots)
      .map((member) => normalizeName(member.species)),
  );
  const coreProfiles = rankedMembers
    .slice(0, coreSlots)
    .flatMap((member) => (member.profile ? [member.profile] : []));

  return {
    coreSpecies,
    flexSpecies,
    lockedSpecies,
    coreSlots: Math.max(coreSlots, Math.min(4, Math.max(3, rankedMembers.length || 0))),
    coreSnapshot: coreProfiles.length ? buildTeamSnapshot(coreProfiles) : null,
  };
}

function scoreCoreFit(profile: PokemonProfile, locked: boolean) {
  return (
    (locked ? 100 : 0) +
    profile.floorScore * 4 +
    (profile.terminalCeiling ?? profile.ceilingScore) * 4.5 +
    profile.evolutionGrowth * 3 +
    profile.reduxScore * 2.5 +
    profile.defensiveSolidity / 8
  );
}
