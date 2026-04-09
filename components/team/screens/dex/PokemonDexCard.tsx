"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";
import { Star } from "lucide-react";

import { PokemonSprite } from "@/components/builder-shared/PokemonSprite";
import { PokeballMark } from "@/components/team/shared/PokeballMark";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import { PokemonDexCardExpanded } from "@/components/team/screens/dex/PokemonDexCardExpanded";
import { StatChip } from "@/components/team/screens/dex/DexShared";
import {
  formatGiftAcquisition,
  formatTradeAcquisition,
  formatWildAcquisition,
  type GiftAcquisition,
  type TradeAcquisition,
  type WildAcquisition,
} from "@/lib/domain/sourceData";
import {
  formatBstLabel,
  getDexAnchorId,
  getDexTransitionName,
  getDexSpriteShellStyle,
} from "@/components/team/screens/dex/utils";
import { markNavigationStart } from "@/lib/perf";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

export function PokemonDexCard({
  pokemon,
  abilityEffects,
  wildEncounters,
  gifts,
  trades,
  href,
  transitionTypes,
  scroll = true,
  expanded = false,
  forms,
  evolutions,
  moveDetailsByName,
  dexQuery = "",
  pokemonHrefBuilder,
  sharedTransitionEnabled = true,
  captured = false,
  suggested = false,
}: {
  pokemon: any;
  abilityEffects: Map<string, string>;
  wildEncounters: WildAcquisition[];
  gifts: GiftAcquisition[];
  trades: TradeAcquisition[];
  href?: string;
  transitionTypes?: string[];
  scroll?: boolean;
  expanded?: boolean;
  forms?: Array<any>;
  evolutions?: Array<Array<any>>;
  moveDetailsByName?: Map<string, any>;
  dexQuery?: string;
  pokemonHrefBuilder?: (slug: string) => string;
  sharedTransitionEnabled?: boolean;
  captured?: boolean;
  suggested?: boolean;
}) {
  const router = useRouter();
  const cardForwardTransition = useSafeTransitionTypes(transitionTypes ?? ["dex-forward"]);
  const spriteTransitionName = sharedTransitionEnabled ? getDexTransitionName("sprite", pokemon.slug) : undefined;
  const cardShellStyle = getDexSpriteShellStyle(pokemon.types);
  const anchorId = getDexAnchorId(pokemon.slug);
  const acquisitionGroups = [
    {
      title: "Wild",
      values: [...wildEncounters]
        .sort((left, right) => (right.rateValue ?? -1) - (left.rateValue ?? -1))
        .map(formatWildAcquisition),
    },
    { title: "Gift", values: gifts.map(formatGiftAcquisition) },
    { title: "Trade", values: trades.map(formatTradeAcquisition) },
  ].filter((group) => group.values.length);

  const prepareNavigation = () => {
    if (typeof window === "undefined" || !href) {
      return;
    }

    router.prefetch(href);
    markNavigationStart("dex-card-to-detail", href);
    const card = document.getElementById(anchorId);
    if (!card) {
      return;
    }

    window.sessionStorage.setItem(
      "dex-scroll-restore",
      JSON.stringify({ anchorId, topOffset: card.getBoundingClientRect().top }),
    );
  };

  const cardBody = (
    <article
      suppressHydrationWarning
      id={!expanded ? anchorId : undefined}
      className={clsx(
        "relative overflow-hidden transition-[transform,border-color,background-color] duration-200",
        expanded ? "panel panel-frame overflow-hidden p-4 sm:p-5" : "panel-strong panel-frame aspect-square rounded-2xl p-3",
        !expanded && "scroll-mt-24",
        href && "group hover:border-warning-line hover:bg-surface-2/90",
      )}
    >
      <div className="pointer-events-none absolute inset-0" style={cardShellStyle} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.12))]" />
      {suggested ? (
        <div
          className={clsx(
            "pointer-events-none absolute z-10",
            expanded ? "left-3 top-3" : "left-2 top-2",
          )}
        >
          <span className="inset-sheen-shadow inline-flex h-8 w-8 items-center justify-center rounded-full border border-warning-line bg-warning-fill">
            <Star className="h-4 w-4 fill-warning-strong text-warning-strong" />
          </span>
        </div>
      ) : null}
      {captured && !expanded ? (
        <div
          className={clsx(
            "pointer-events-none absolute z-10",
            expanded ? "right-3 top-3" : "right-2 top-2",
          )}
        >
          <span className="inset-sheen-shadow inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary-line bg-primary-fill">
            <PokeballMark className="h-4 w-4 shadow-none" centerClassName="h-1.5 w-1.5" />
          </span>
        </div>
      ) : null}
      <div className={clsx("relative", !expanded && "flex h-full items-center justify-center")}>
        <div
          className={clsx(
            "flex",
            !expanded && "w-full flex-col items-center justify-center gap-0",
            expanded && "flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:gap-4 lg:text-left",
          )}
        >
          <ViewTransition name={spriteTransitionName} share="dex-sprite-share">
            <div
              className={clsx(
                "relative flex items-center justify-center self-center overflow-hidden bg-transparent shadow-none",
                expanded ? "h-36 w-36 rounded-2xl" : "h-24 w-24 rounded-2xl",
              )}
            >
              {expanded ? (
                <PokemonSprite
                  species={pokemon.name}
                  spriteUrl={pokemon.spriteUrl}
                  animatedSpriteUrl={pokemon.animatedSpriteUrl}
                  size="large"
                  chrome="plain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PokemonSprite
                    species={pokemon.name}
                    spriteUrl={pokemon.spriteUrl}
                    animatedSpriteUrl={undefined}
                    size="fill"
                    chrome="plain"
                  />
                </div>
              )}
            </div>
          </ViewTransition>
          <div className={clsx("min-w-0 flex-1", !expanded && "w-full text-center", expanded && "w-full lg:text-left")}>
            <div className={clsx("flex flex-wrap items-center gap-1.5", !expanded && "justify-center", expanded && "justify-center lg:justify-start")}>
              <span className="pixel-face caption-dense text-text-faint md:text-xs">#{String(pokemon.dex).padStart(3, "0")}</span>
              <h2 className={clsx("display-face text-sm text-text md:text-xs", expanded && "text-base")}>{pokemon.name}</h2>
            </div>
            <div className={clsx("mt-2 flex flex-row gap-1", !expanded && "justify-center", expanded && "justify-center lg:justify-start")}>
              {pokemon.types.map((type: string, index: number) => (
                <TypeBadge
                  key={`${pokemon.slug}-${type}-${index}`}
                  type={type}
                  size={!expanded ? (pokemon.types.length === 1 ? "lg" : "md") : undefined}
                  className={
                    !expanded
                      ? pokemon.types.length === 1
                        ? "max-md:min-w-19 max-md:gap-1 max-md:px-1.5 max-md:py-1 max-md:text-xs max-md:tracking-ui"
                        : "type-badge-compact-mobile"
                      : undefined
                  }
                />
              ))}
            </div>
            {expanded ? (
              <>
                {(pokemon.generation || pokemon.category || pokemon.height || pokemon.weight) ? (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                    {pokemon.generation ? <StatChip label={pokemon.generation} /> : null}
                    {pokemon.category ? <StatChip label={pokemon.category} /> : null}
                    {typeof pokemon.height === "number" ? <StatChip label={`Height ${pokemon.height.toFixed(1)} m`} /> : null}
                    {typeof pokemon.weight === "number" ? <StatChip label={`Weight ${pokemon.weight.toFixed(1)} kg`} /> : null}
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <StatChip label={formatBstLabel(pokemon.stats?.bst, pokemon.canonicalStats?.bst)} />
                </div>
                {pokemon.flavorText ? <p className="mt-2 text-sm leading-6 text-muted">{pokemon.flavorText}</p> : null}
              </>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <PokemonDexCardExpanded
            pokemon={pokemon}
            abilityEffects={abilityEffects}
            moveDetailsByName={moveDetailsByName}
            forms={forms}
            evolutions={evolutions}
            dexQuery={dexQuery}
            acquisitionGroups={acquisitionGroups}
            pokemonHrefBuilder={pokemonHrefBuilder}
          />
        ) : null}
      </div>
    </article>
  );

  if (!href) {
    return cardBody;
  }

  return (
    <Link
      href={href}
      prefetch
      scroll={scroll}
      transitionTypes={cardForwardTransition}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-line active:scale-[0.995]"
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      onPointerDown={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        prepareNavigation();
      }}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        prepareNavigation();
      }}
    >
      {cardBody}
    </Link>
  );
}
