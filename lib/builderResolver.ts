import type { ParsedDocs } from "@/lib/docsSchema";
import {
  applyMovePowerModifiers,
  getMovePowerModifiers,
  getWeatherAdjustedMove,
  normalizeMoveLookupName,
  resolveMovePower,
  resolveMoveType,
} from "@/lib/domain/moves";
import {
  applyStatModifiers,
  type BattleWeather,
  calculateEffectiveStats,
  getNatureEffect,
  getStatModifiers,
} from "@/lib/domain/battle";
import type { EditableMember } from "@/lib/builderStore";
import {
  normalizeName,
  resolvePokemonProfile,
  supportsPokemonGender,
  type RemoteAbility,
  type RemoteItem,
  type RemoteMove,
  type RemotePokemon,
  type ResolvedTeamMember,
} from "@/lib/teamAnalysis";

type AbilityLookup = Record<string, RemoteAbility | null | undefined>;
type ItemLookup = Record<string, RemoteItem | null | undefined>;
type MoveLookup = Record<string, RemoteMove | null | undefined>;
type PokemonLookup = Record<string, RemotePokemon | null | undefined>;

export type BuilderResolverContext = {
  docs: ParsedDocs;
  abilitiesByName: AbilityLookup;
  itemsByName: ItemLookup;
  movesByName: MoveLookup;
  pokemonByName: PokemonLookup;
  weather: BattleWeather;
};

export function buildNameIndex<T extends { name: string }>(entries: readonly T[]) {
  return Object.fromEntries(entries.map((entry) => [normalizeName(entry.name), entry])) as Record<string, T>;
}

export function resolveEditableMember(
  member: EditableMember,
  context: BuilderResolverContext
): ResolvedTeamMember {
  const normalizedSpecies = normalizeName(member.species);
  const basePokemon = normalizedSpecies ? context.pokemonByName[normalizedSpecies] ?? undefined : undefined;
  const remotePokemon = basePokemon ? hydratePokemonLearnsets(basePokemon, context.movesByName) : undefined;
  const resolved =
    resolvePokemonProfile(context.docs, member.species, remotePokemon, member.shiny) ??
    ({
      key: member.id,
      species: member.species,
      shiny: member.shiny,
      supportsGender: supportsPokemonGender(member.species),
      resolvedTypes: [],
      abilities: [],
      moves: [],
    } as ResolvedTeamMember);
  const natureEffect = getNatureEffect(member.nature);
  const itemDetails = member.item ? context.itemsByName[normalizeName(member.item)] ?? null : null;
  const abilityDetails = member.ability ? context.abilitiesByName[normalizeName(member.ability)] ?? null : null;
  const statModifiers = getStatModifiers({
    itemName: member.item,
    itemEffect: itemDetails?.effect,
    abilityName: member.ability,
    abilityEffect: abilityDetails?.effect,
    canEvolve: Boolean(resolved.nextEvolutions?.length),
    weather: context.weather,
    resolvedTypes: resolved.resolvedTypes,
  });
  const summaryStats = resolved.resolvedStats
    ? buildSummaryStats(resolved.resolvedStats, natureEffect, statModifiers)
    : undefined;
  const effectiveStats = resolved.resolvedStats
    ? applyStatModifiers(
        calculateEffectiveStats(resolved.resolvedStats, member.level, member.nature, member.ivs, member.evs),
        statModifiers
      )
    : undefined;

  return {
    ...resolved,
    key: member.id,
    shiny: member.shiny,
    level: member.level,
    gender: member.gender,
    nature: member.nature,
    natureEffect,
    statModifiers,
    item: member.item,
    itemDetails,
    ability: member.ability,
    abilityDetails,
    summaryStats,
    effectiveStats,
    moves: member.moves.map((move) => {
      const normalizedMove = normalizeMoveLookupName(move);
      const fromLearnset =
        resolved.learnsets?.levelUp.find(
          (entry) => normalizeMoveLookupName(entry.move) === normalizedMove,
        )?.details ??
        resolved.learnsets?.machines.find(
          (entry) => normalizeMoveLookupName(entry.move) === normalizedMove,
        )?.details ??
        context.movesByName[normalizedMove] ??
        undefined;
      const moveType = resolveMoveType(
        context.docs,
        move,
        fromLearnset as RemoteMove | undefined,
        member.ivs,
      );
      const movePower = resolveMovePower(move, fromLearnset as RemoteMove | undefined, member.ivs);
      const rawMove = {
        name: move,
        type: moveType,
        hasStab: Boolean(
          moveType &&
            resolved.resolvedTypes.some((type) => normalizeName(type) === normalizeName(moveType))
        ),
        damageClass: fromLearnset?.damageClass,
        power: movePower,
        accuracy: fromLearnset?.accuracy,
        pp: fromLearnset?.pp,
        description: fromLearnset?.description,
      };
      const weatherAdjustedMove = getWeatherAdjustedMove(rawMove, context.weather);
      const powerModifiers = getMovePowerModifiers({
        move: weatherAdjustedMove,
        itemName: member.item,
        itemEffect: itemDetails?.effect,
        abilityName: member.ability,
        abilityEffect: abilityDetails?.effect,
        weather: context.weather,
      });

      return {
        ...weatherAdjustedMove,
        type: weatherAdjustedMove.type ?? undefined,
        damageClass: weatherAdjustedMove.damageClass ?? undefined,
        accuracy: weatherAdjustedMove.accuracy ?? undefined,
        hasStab: Boolean(
          weatherAdjustedMove.type &&
            resolved.resolvedTypes.some(
              (type) => normalizeName(type) === normalizeName(weatherAdjustedMove.type ?? ""),
            )
        ),
        adjustedPower: applyMovePowerModifiers(weatherAdjustedMove.power, powerModifiers),
        powerModifiers,
      };
    }),
  };
}

function hydratePokemonLearnsets(pokemon: RemotePokemon, movesByName: MoveLookup): RemotePokemon {
  if (!pokemon.learnsets) {
    return pokemon;
  }

  return {
    ...pokemon,
    learnsets: {
      levelUp: (pokemon.learnsets.levelUp ?? []).map((entry) => ({
        ...entry,
        details: entry.details ?? movesByName[normalizeMoveLookupName(entry.move)] ?? null,
      })),
      machines: (pokemon.learnsets.machines ?? []).map((entry) => ({
        ...entry,
        details: entry.details ?? movesByName[normalizeMoveLookupName(entry.move)] ?? null,
      })),
    },
  };
}

function buildSummaryStats(
  baseStats: NonNullable<ResolvedTeamMember["resolvedStats"]>,
  natureEffect: ReturnType<typeof getNatureEffect>,
  modifiers: { stat: keyof NonNullable<ResolvedTeamMember["resolvedStats"]>; multiplier: number }[]
) {
  return {
    hp: applySummaryModifier(baseStats.hp, modifiers.find((modifier) => modifier.stat === "hp")?.multiplier),
    atk: applySummaryModifier(
      Math.round(baseStats.atk * getNatureMultiplier("atk", natureEffect)),
      modifiers.find((modifier) => modifier.stat === "atk")?.multiplier
    ),
    def: applySummaryModifier(
      Math.round(baseStats.def * getNatureMultiplier("def", natureEffect)),
      modifiers.find((modifier) => modifier.stat === "def")?.multiplier
    ),
    spa: applySummaryModifier(
      Math.round(baseStats.spa * getNatureMultiplier("spa", natureEffect)),
      modifiers.find((modifier) => modifier.stat === "spa")?.multiplier
    ),
    spd: applySummaryModifier(
      Math.round(baseStats.spd * getNatureMultiplier("spd", natureEffect)),
      modifiers.find((modifier) => modifier.stat === "spd")?.multiplier
    ),
    spe: applySummaryModifier(
      Math.round(baseStats.spe * getNatureMultiplier("spe", natureEffect)),
      modifiers.find((modifier) => modifier.stat === "spe")?.multiplier
    ),
    bst: baseStats.bst,
  };
}

function applySummaryModifier(value: number, multiplier?: number) {
  return multiplier ? Math.round(value * multiplier) : value;
}

function getNatureMultiplier(
  stat: "atk" | "def" | "spa" | "spd" | "spe",
  natureEffect: ReturnType<typeof getNatureEffect>
) {
  if (natureEffect.up === stat) {
    return 1.1;
  }
  if (natureEffect.down === stat) {
    return 0.9;
  }
  return 1;
}
