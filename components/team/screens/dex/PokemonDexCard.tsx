"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";

import { PokemonSprite } from "@/components/builder-shared/PokemonSprite";
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
        expanded ? "p-4 sm:p-5" : "panel-strong panel-frame aspect-square rounded-[1rem] p-3",
        !expanded && "scroll-mt-24",
        href && "group hover:border-warning-line hover:bg-surface-2/90",
      )}
    >
      <div className="pointer-events-none absolute inset-0" style={cardShellStyle} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.12))]" />
      <div className={clsx("relative", !expanded && "flex h-full items-center justify-center")}>
        <div className={clsx("flex items-start", !expanded && "w-full flex-col items-center justify-center gap-0", expanded && "gap-4")}>
          <ViewTransition name={spriteTransitionName} share="dex-sprite-share">
            <div
              className={clsx(
                "relative flex items-center justify-center self-center overflow-hidden bg-transparent shadow-none",
                expanded ? "h-36 w-36 rounded-[1rem]" : "h-24 w-24 rounded-[1rem]",
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
          <div className={clsx("min-w-0 flex-1", !expanded && "w-full text-center")}>
            <div className={clsx("flex flex-wrap items-center gap-1.5", !expanded && "justify-center")}>
              <span className="pixel-face text-[10px] text-text-faint md:text-[11px]">#{String(pokemon.dex).padStart(3, "0")}</span>
              <h2 className={clsx("display-face text-sm text-text md:text-[13px]", expanded && "text-base")}>{pokemon.name}</h2>
            </div>
            <div className={clsx("mt-2 flex flex-row gap-1", !expanded && "justify-center")}>
              {pokemon.types.map((type: string, index: number) => (
                <TypeBadge
                  key={`${pokemon.slug}-${type}-${index}`}
                  type={type}
                  size={!expanded ? (pokemon.types.length === 1 ? "lg" : "md") : undefined}
                  className={
                    !expanded
                      ? pokemon.types.length === 1
                        ? "max-md:min-w-[4.75rem] max-md:gap-1 max-md:px-1.5 max-md:py-1 max-md:text-[12px] max-md:tracking-[0.06em]"
                        : "max-md:min-w-[3.5rem] max-md:gap-1 max-md:px-1.5 max-md:py-0.5 max-md:text-[10px] max-md:tracking-[0.05em]"
                      : undefined
                  }
                />
              ))}
            </div>
            {expanded ? (
              <>
                {(pokemon.generation || pokemon.category || pokemon.height || pokemon.weight) ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {pokemon.generation ? <StatChip label={pokemon.generation} /> : null}
                    {pokemon.category ? <StatChip label={pokemon.category} /> : null}
                    {typeof pokemon.height === "number" ? <StatChip label={`Height ${pokemon.height.toFixed(1)} m`} /> : null}
                    {typeof pokemon.weight === "number" ? <StatChip label={`Weight ${pokemon.weight.toFixed(1)} kg`} /> : null}
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
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
