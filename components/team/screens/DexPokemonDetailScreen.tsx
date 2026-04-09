"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo } from "react";

import { PokemonDexCard } from "@/components/team/screens/DexScreen";
import { PokeballMark } from "@/components/team/shared/PokeballMark";
import { useDexRunMarkers } from "@/components/team/screens/dex/useDexRunMarkers";
import type { DexDetailPageData } from "@/lib/dexDetailPageData";
import { normalizeName } from "@/lib/domain/names";
import { buildIvCalcHref } from "@/lib/ivCalc";
import { markNavigationStart } from "@/lib/perf";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

export function DexPokemonDetailScreen({ detail }: { detail: DexDetailPageData }) {
  const router = useRouter();
  const backTransition = useSafeTransitionTypes(["dex-back"]);
  const forwardTransition = useSafeTransitionTypes(["dex-forward"]);
  const toolForwardTransition = useSafeTransitionTypes(["tool-forward"]);
  const { capturedSpecies, suggestedSpecies } = useDexRunMarkers();
  const moveDetailsByName = useMemo(
    () => new Map(Object.entries(detail.moveDetailsByName)),
    [detail.moveDetailsByName],
  );
  const emptyAbilityEffects = useMemo(() => new Map<string, string>(), []);
  const speciesKey = normalizeName(detail.pokemon.name);
  const captureHref = buildIvCalcHref(detail.pokemon.name);
  const isCaptured = capturedSpecies.has(speciesKey);
  const isSuggested = suggestedSpecies.has(speciesKey);

  const prepareRoute = (href: string, label: string) => {
    router.prefetch(href);
    markNavigationStart(label, href);
  };

  return (
    <main className="relative overflow-visible px-4 pb-5 pt-2 sm:px-6 sm:pt-3 lg:px-8">
      {detail.previousSpecies ? (
        <Link
          href={`/team/dex/pokemon/${detail.previousSpecies.slug}${detail.dexQuery}`}
          prefetch
          transitionTypes={backTransition}
          aria-label={`Pokemon anterior: ${detail.previousSpecies.name}`}
          className="app-icon-button app-floating-icon-button fixed left-1.5 top-1/2 z-30 h-11 w-11 -translate-y-1/2 hover:border-warning-line hover:bg-surface-3 active:scale-95 sm:left-2"
          style={{ left: "max(0.375rem, env(safe-area-inset-left))" }}
          onPointerDown={() => prepareRoute(`/team/dex/pokemon/${detail.previousSpecies?.slug}${detail.dexQuery}`, "dex-detail-to-previous")}
          onClick={() => prepareRoute(`/team/dex/pokemon/${detail.previousSpecies?.slug}${detail.dexQuery}`, "dex-detail-to-previous")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {detail.nextSpecies ? (
        <Link
          href={`/team/dex/pokemon/${detail.nextSpecies.slug}${detail.dexQuery}`}
          prefetch
          transitionTypes={forwardTransition}
          aria-label={`Pokemon siguiente: ${detail.nextSpecies.name}`}
          className="app-icon-button app-floating-icon-button fixed right-1.5 top-1/2 z-30 h-11 w-11 -translate-y-1/2 hover:border-warning-line hover:bg-surface-3 active:scale-95 sm:right-2"
          style={{ right: "max(0.375rem, env(safe-area-inset-right))" }}
          onPointerDown={() => prepareRoute(`/team/dex/pokemon/${detail.nextSpecies?.slug}${detail.dexQuery}`, "dex-detail-to-next")}
          onClick={() => prepareRoute(`/team/dex/pokemon/${detail.nextSpecies?.slug}${detail.dexQuery}`, "dex-detail-to-next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
      <section className="relative mx-auto max-w-6xl">
        <div className="pointer-events-none absolute right-0 top-0 z-20 flex justify-end gap-2">
          <Link
            href={captureHref}
            prefetch
            transitionTypes={toolForwardTransition}
            aria-label={`Preparar captura de ${detail.pokemon.name} en IV Calc`}
            className="app-icon-button pointer-events-auto h-11 w-11 rounded-full border-primary-line bg-primary-fill text-primary-soft hover:border-primary-line-active hover:bg-primary-fill-hover active:scale-95"
            onPointerDown={() => prepareRoute(captureHref, "dex-detail-to-ivcalc")}
            onClick={() => prepareRoute(captureHref, "dex-detail-to-ivcalc")}
          >
            <PokeballMark className="h-4 w-4 shadow-none" centerClassName="h-1.5 w-1.5" />
          </Link>
          <Link
            href={detail.closeHref}
            prefetch
            scroll={false}
            transitionTypes={backTransition}
            aria-label="Cerrar ficha"
            className="app-icon-button app-floating-icon-button pointer-events-auto h-11 w-11 hover:border-warning-line hover:bg-surface-3 active:scale-95"
            onPointerDown={() => prepareRoute(detail.closeHref, "dex-detail-to-list")}
            onClick={() => prepareRoute(detail.closeHref, "dex-detail-to-list")}
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
        <PokemonDexCard
          pokemon={detail.pokemon}
          abilityEffects={emptyAbilityEffects}
          moveDetailsByName={moveDetailsByName}
          wildEncounters={detail.wildEncounters}
          gifts={detail.gifts}
          trades={detail.trades}
          captured={isCaptured}
          suggested={isSuggested}
          forms={detail.forms.length > 1 ? detail.forms : undefined}
          evolutions={detail.evolutions.length ? detail.evolutions : undefined}
          dexQuery={detail.dexQuery}
          pokemonHrefBuilder={(slug) => `/team/dex/pokemon/${slug}${detail.dexQuery}`}
          expanded
        />
      </section>
    </main>
  );
}
