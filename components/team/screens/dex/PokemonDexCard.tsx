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
  headerAction,
  forms,
  evolutions,
  moveDetailsByName,
  dexQuery = "",
  pokemonHrefBuilder,
  sharedTransitionEnabled = true,
}: {
  pokemon: any;
  abilityEffects: Map<string, string>;
  wildEncounters: { area: string; method: string }[];
  gifts: { location: string; level: string }[];
  trades: { location: string; requested: string }[];
  href?: string;
  transitionTypes?: string[];
  scroll?: boolean;
  expanded?: boolean;
  headerAction?: React.ReactNode;
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
  const spriteShellStyle = getDexSpriteShellStyle(pokemon.types);
  const anchorId = getDexAnchorId(pokemon.slug);
  const acquisitionGroups = [
    { title: "Wild", values: wildEncounters.map((entry) => `${entry.area} · ${entry.method}`) },
    { title: "Gift", values: gifts.map((entry) => `${entry.location} · Lv ${entry.level}`) },
    { title: "Trade", values: trades.map((entry) => `${entry.location} · por ${entry.requested}`) },
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
        "panel-strong panel-frame relative overflow-hidden rounded-[1rem] p-3 transition-[transform,border-color,background-color] duration-200",
        !expanded && "scroll-mt-24",
        href && "group hover:border-warning-line hover:bg-surface-2/90",
        expanded && "p-4 sm:p-5",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,120,0.12),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(89,181,255,0.12),transparent_28%)]" />
      <div className="relative">
        <div className={clsx("flex items-start gap-4", expanded && "gap-4")}>
          <ViewTransition name={spriteTransitionName} share="dex-sprite-share">
            <div
              className={clsx(
                "relative flex items-center justify-center overflow-hidden border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                expanded ? "h-36 w-36 rounded-[1rem]" : "h-14 w-14 rounded-[0.75rem]",
              )}
              style={spriteShellStyle}
            >
              <PokemonSprite
                species={pokemon.name}
                spriteUrl={pokemon.spriteUrl}
                animatedSpriteUrl={expanded ? pokemon.animatedSpriteUrl : undefined}
                size={expanded ? "large" : "small"}
                chrome="plain"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_38%,rgba(0,0,0,0.12))]" />
            </div>
          </ViewTransition>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pixel-face text-xs text-text-faint">#{String(pokemon.dex).padStart(3, "0")}</span>
              <h2 className={clsx("display-face text-sm text-text", expanded && "text-base")}>{pokemon.name}</h2>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {pokemon.types.map((type: string, index: number) => <TypeBadge key={`${pokemon.slug}-${type}-${index}`} type={type} />)}
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
            headerAction={headerAction}
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
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-line active:scale-[0.995]"
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
