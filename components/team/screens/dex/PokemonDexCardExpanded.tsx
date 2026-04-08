"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { useMediaQuery } from "usehooks-ts";

import { PokemonSprite } from "@/components/builder-shared/PokemonSprite";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import { DefenseSection } from "@/components/team/editor/DefenseSection";
import { StatBar } from "@/components/team/shared/StatWidgets";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AcquisitionList, DexMoveEntryCard, InfoBlock } from "@/components/team/screens/dex/DexInfoBlocks";
import { StatChip } from "@/components/team/screens/dex/DexShared";
import {
  formatBstLabel,
  formatEvolutionSummary,
  getDexSearchHref,
  getDexTransitionName,
  resolveDexMoveCardData,
  sanitizeAbilityList,
} from "@/components/team/screens/dex/utils";
import { getBaseSpeciesName } from "@/lib/forms";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

export function PokemonDexCardExpanded({
  pokemon,
  abilityEffects,
  moveDetailsByName,
  forms,
  evolutions,
  dexQuery,
  acquisitionGroups,
  pokemonHrefBuilder,
}: {
  pokemon: any;
  abilityEffects: Map<string, string>;
  moveDetailsByName?: Map<string, any>;
  forms?: Array<any>;
  evolutions?: Array<Array<any>>;
  dexQuery: string;
  acquisitionGroups: Array<{ title: string; values: string[] }>;
  pokemonHrefBuilder?: (slug: string) => string;
}) {
  const evolutionForwardTransition = useSafeTransitionTypes(["dex-forward"]);
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)", {
    initializeWithValue: false,
    defaultValue: false,
  });
  const hasEvolutionChain = Boolean(evolutions?.some((chain) => chain.length > 1));
  const evolutionChains = hasEvolutionChain ? evolutions ?? [] : [];
  const abilitiesBlock = (
    <InfoBlock label="Habilidades">
      {sanitizeAbilityList(pokemon.abilities).length ? (
        <div className="space-y-2">
          {pokemon.abilitySlots?.regular?.length ? (
            <AbilityGroup
              pokemonSlug={pokemon.slug}
              label={pokemon.abilitySlots.regular.length > 1 ? "Normales" : "Normal"}
              abilities={pokemon.abilitySlots.regular}
            />
          ) : null}
          {pokemon.abilitySlots?.hidden?.length ? (
            <AbilityGroup
              pokemonSlug={pokemon.slug}
              label="Oculta"
              abilities={pokemon.abilitySlots.hidden}
              tone="hidden"
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">Sin habilidades registradas.</p>
      )}
    </InfoBlock>
  );
  const evolutionBlock = hasEvolutionChain ? (
    <InfoBlock label="Evolucion">
      <div className="pb-1">
        {evolutionChains.map((chain, chainIndex) => (
          <div key={`${pokemon.slug}-chain-${chainIndex}`}>
            <div className="mx-auto flex w-max min-w-max items-center justify-between gap-4">
              {chain.map((node, nodeIndex) => (
                <div key={`${node.slug}-${nodeIndex}`} className="contents">
                  {nodeIndex > 0 ? (
                    <div className="flex flex-col items-center gap-0 text-center">
                      <span className="text-[10px] text-text-faint">→</span>
                      {node.summaryFromPrevious ? (
                        <span className="whitespace-pre-line text-[9px] leading-3 text-muted">
                          {formatEvolutionSummary(node.summaryFromPrevious)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {node.current ? (
                    <div className="flex w-14 shrink-0 flex-col items-center gap-0.5 text-center text-[hsl(39_100%_78%)]">
                      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-4xl border border-white/10 bg-surface-1">
                        <PokemonSprite species={node.name} spriteUrl={node.spriteUrl} animatedSpriteUrl={undefined} size="small" chrome="plain" />
                      </div>
                      <span className="display-face text-[10px] leading-3 text-current">{node.name}</span>
                    </div>
                  ) : (
                    <Link
                      href={(pokemonHrefBuilder ?? ((slug) => `/team/dex/pokemon/${slug}${dexQuery}`))(node.slug)}
                      transitionTypes={evolutionForwardTransition}
                      className="group flex w-14 shrink-0 flex-col items-center gap-0.5 text-center text-text transition-colors hover:text-[hsl(39_100%_78%)]"
                    >
                      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-4xl border border-white/10 bg-surface-1">
                        <ViewTransition name={getDexTransitionName("evo-sprite", node.slug)}>
                          <PokemonSprite species={node.name} spriteUrl={node.spriteUrl} animatedSpriteUrl={undefined} size="small" chrome="plain" />
                        </ViewTransition>
                      </div>
                      <ViewTransition name={getDexTransitionName("evo-title", node.slug)}>
                        <span className="display-face text-[10px] leading-3 text-current">{node.name}</span>
                      </ViewTransition>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </InfoBlock>
  ) : null;
  const statsBlock = pokemon.stats ? (
    <InfoBlock label="Stats">
      <div className="space-y-1.5">
        {[
          ["HP", pokemon.stats.hp, pokemon.canonicalStats?.hp],
          ["Atk", pokemon.stats.atk, pokemon.canonicalStats?.atk],
          ["Def", pokemon.stats.def, pokemon.canonicalStats?.def],
          ["SpA", pokemon.stats.spa, pokemon.canonicalStats?.spa],
          ["SpD", pokemon.stats.spd, pokemon.canonicalStats?.spd],
          ["Spe", pokemon.stats.spe, pokemon.canonicalStats?.spe],
        ].map(([label, value, baseline]) => (
          <StatBar
            key={`${pokemon.slug}-${label}`}
            label={String(label)}
            value={Number(value)}
            baselineValue={typeof baseline === "number" ? baseline : undefined}
            max={160}
            transitionName={`dex-stat-${String(label).toLowerCase()}-${pokemon.slug}`}
          />
        ))}
      </div>
    </InfoBlock>
  ) : null;
  const acquisitionBlock = acquisitionGroups.length ? (
    <InfoBlock label="Obtencion en Redux">
      <div className="space-y-1.5">
        {acquisitionGroups.map((group) => (
          <AcquisitionList key={`${pokemon.slug}-${group.title}`} title={group.title} values={group.values} />
        ))}
      </div>
    </InfoBlock>
  ) : null;
  const typingBlock = pokemon.types.length ? (
    <InfoBlock label="Typing">
      <DefenseSection types={pokemon.types} />
    </InfoBlock>
  ) : null;
  const formsBlock = forms?.length ? (
    <InfoBlock label="Formas">
      <div className="space-y-1.5">
        {forms.map((form) => (
          <div key={form.slug} className="flex items-start gap-2.5 rounded-[0.7rem] border border-line-soft bg-surface-3 px-2.5 py-2">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[0.7rem] border border-white/10 bg-surface-2">
              <PokemonSprite species={form.name} spriteUrl={form.spriteUrl} animatedSpriteUrl={undefined} size="small" chrome="plain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="display-face text-[11px] text-text">{form.name}</p>
                {getBaseSpeciesName(form.name) === form.name ? <span className="rounded-full border border-line-soft bg-surface-2 px-2 py-0.5 text-[10px] text-text-faint">Base</span> : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {form.types.map((type: string) => <TypeBadge key={`${form.slug}-${type}`} type={type} />)}
              </div>
              <div className="mt-1.5 space-y-1.5">
                {form.abilitySlots?.regular?.length ? (
                  <FormAbilityGroup label={form.abilitySlots.regular.length > 1 ? "Normales" : "Normal"} abilities={form.abilitySlots.regular} />
                ) : null}
                {form.abilitySlots?.hidden?.length ? (
                  <FormAbilityGroup label="Oculta" abilities={form.abilitySlots.hidden} tone="hidden" />
                ) : null}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <StatChip label={`BST ${form.stats?.bst ?? "-"}`} />
                <StatChip label={`Spe ${form.stats?.spe ?? "-"}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </InfoBlock>
  ) : null;
  const learnsetBlock = pokemon.learnsets?.levelUp?.length || pokemon.learnsets?.machines?.length ? (
    <InfoBlock label="Learnset">
      <Collapsible className="rounded-[0.7rem] border border-line-soft bg-surface-3 px-2 py-1.5">
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 text-left">
          <div>
            <p className="display-face text-[11px] text-text">Ver movimientos</p>
            <p className="mt-1 text-xs text-muted">{pokemon.learnsets?.levelUp?.length ?? 0} level up · {pokemon.learnsets?.machines?.length ?? 0} machines</p>
          </div>
          <span className="text-xs text-text-faint transition-transform data-[panel-open]:rotate-180">⌄</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
          {(pokemon.learnsets?.levelUp?.length ?? 0) ? (
            <LearnsetSection
              title="Level up"
              entries={pokemon.learnsets?.levelUp ?? []}
              eyebrowBuilder={(entry) => `Lv ${entry.level}`}
              moveDetailsByName={moveDetailsByName}
            />
          ) : null}
          {(pokemon.learnsets?.machines?.length ?? 0) ? (
            <LearnsetSection
              title="Machines"
              entries={pokemon.learnsets?.machines ?? []}
              eyebrowBuilder={(entry) => entry.source}
              moveDetailsByName={moveDetailsByName}
            />
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </InfoBlock>
  ) : null;

  return (
    <>
      <ViewTransition enter="dex-detail-body-enter" exit="dex-detail-body-exit" default="none">
        {isDesktopLayout ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="space-y-2.5">
              {abilitiesBlock}
              {statsBlock}
              {formsBlock}
              {learnsetBlock}
            </div>

            <div className="space-y-2.5">
              {evolutionBlock}
              {acquisitionBlock}
              {typingBlock}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {abilitiesBlock}
            {evolutionBlock}
            {statsBlock}
            {formsBlock}
            {learnsetBlock}
            {acquisitionBlock}
            {typingBlock}
          </div>
        )}
      </ViewTransition>
    </>
  );
}

function AbilityGroup({
  pokemonSlug,
  label,
  abilities,
  tone = "regular",
}: {
  pokemonSlug: string;
  label: string;
  abilities: string[];
  tone?: "regular" | "hidden";
}) {
  return (
    <div className="space-y-1">
      <p className="display-face text-[10px] uppercase tracking-[0.12em] text-text-faint">{label}</p>
      <div className="flex flex-wrap gap-2">
        {abilities.map((ability, index) => (
          <Link
            key={`${pokemonSlug}-${label}-${ability}-${index}`}
            href={getDexSearchHref("abilities", ability)}
            className={[
              "display-face rounded-full border px-2.5 py-1.5 text-[11px] transition-colors",
              tone === "hidden"
                ? "border-accent-line-faint bg-accent-fill-soft text-accent-soft hover:border-warning-line hover:text-[hsl(39_100%_78%)]"
                : "border-line-soft bg-surface-3 text-text hover:border-warning-line hover:text-[hsl(39_100%_78%)]",
            ].join(" ")}
          >
            {ability}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FormAbilityGroup({
  label,
  abilities,
  tone = "regular",
}: {
  label: string;
  abilities: string[];
  tone?: "regular" | "hidden";
}) {
  return (
    <div className="space-y-1">
      <p className="display-face text-[10px] uppercase tracking-[0.12em] text-text-faint">{label}</p>
      <div className="flex flex-wrap gap-1">
        {abilities.map((ability, index) => (
          <span
            key={`${label}-${ability}-${index}`}
            className={
              tone === "hidden"
                ? "rounded-full border border-accent-line-faint bg-accent-fill-soft px-2.5 py-1 text-[11px] text-accent-soft"
                : "rounded-full border border-line-soft bg-surface-2 px-2.5 py-1 text-[11px] text-text-faint"
            }
          >
            {ability}
          </span>
        ))}
      </div>
    </div>
  );
}

function LearnsetSection({
  title,
  entries,
  eyebrowBuilder,
  moveDetailsByName,
}: {
  title: string;
  entries: Array<any>;
  eyebrowBuilder: (entry: any) => string;
  moveDetailsByName?: Map<string, any>;
}) {
  return (
    <div className="space-y-1">
      <p className="display-face text-[10px] text-text-faint">{title}</p>
      <div className="space-y-1">
        {entries.map((entry, index) => (
          <Link key={`${title}-${entry.move}-${index}`} href={getDexSearchHref("moves", entry.move)} className="block">
            <DexMoveEntryCard
              move={resolveDexMoveCardData(entry, moveDetailsByName)}
              eyebrow={eyebrowBuilder(entry)}
              compact
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
