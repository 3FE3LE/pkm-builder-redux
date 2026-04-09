"use client";

import clsx from "clsx";
import { useCallback, useMemo, useRef, useState } from "react";

import { PokemonSprite } from "@/components/builder-shared/PokemonSprite";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { getBaseSpeciesName } from "@/lib/forms";
import { INITIAL_RESULTS, RESULT_BATCH_SIZE } from "@/components/team/screens/dex/utils";

export function DexSectionHeader({
  count,
  emptyLabel,
}: {
  count: number;
  emptyLabel: string;
}) {
  if (!count) {
    return <p className="mb-3 text-sm text-muted">{emptyLabel}</p>;
  }

  return null;
}

export function DexCollectionLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article
          key={`dex-loading-card-${index}`}
          className="panel-strong panel-frame rounded-2xl p-4"
        >
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-10 w-full rounded-[0.9rem]" />
            <Skeleton className="h-20 w-full rounded-[0.9rem]" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function DexIncrementalGrid<T>({
  items,
  emptyLabel,
  loadingLabel,
  renderItem,
  gridClassName,
}: {
  items: T[];
  emptyLabel: string;
  loadingLabel: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  gridClassName?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULTS);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const setSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node || visibleCount >= items.length) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }

          setVisibleCount((current) => Math.min(current + RESULT_BATCH_SIZE, items.length));
        },
        { rootMargin: "320px 0px" },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [items.length, visibleCount],
  );

  return (
    <>
      <DexSectionHeader count={items.length} emptyLabel={emptyLabel} />
      <div className={clsx("grid gap-3 xl:grid-cols-2", gridClassName)}>{visibleItems.map((item, index) => renderItem(item, index))}</div>
      {visibleCount < items.length ? (
        <div ref={setSentinelRef} className="mt-4 flex justify-center" aria-hidden="true">
          <span className="rounded-full border border-line-soft bg-surface-3 px-3 py-1 text-xs text-text-faint">
            {loadingLabel}
          </span>
        </div>
      ) : null}
    </>
  );
}

export function SegmentedOwnerCollapsible({
  label,
  dexBySpecies,
  sections,
  count,
  closedLabel,
  emptyLabel,
}: {
  label: string;
  dexBySpecies: Record<string, number>;
  sections: Array<{ title: string; values: string[] }>;
  count: number;
  closedLabel: string;
  emptyLabel: string;
}) {
  const nonEmptySections = sections.filter((section) => section.values.length);

  return (
    <div className="mt-4 border-t border-line-soft pt-3">
      <p className="micro-label text-text-faint">{label}</p>
      {count ? (
        <Collapsible className="mt-2 rounded-[0.7rem] border border-line-soft bg-surface-3 px-2 py-1.5">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
            <div>
              <p className="display-face text-[11px] text-text">{closedLabel}</p>
              <p className="mt-1 text-xs text-muted">{count} Pokemon</p>
            </div>
            <span className="text-xs text-text-faint transition-transform data-[panel-open]:rotate-180">⌄</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {nonEmptySections.map((section) => (
              <div key={`${label}-${section.title}`} className="space-y-1">
                <p className="display-face text-[10px] text-text-faint">{section.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {section.values.map((value, index) => (
                    <OwnerSpriteChip key={`${section.title}-${value}-${index}`} species={value} dexBySpecies={dexBySpecies} />
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <p className="mt-2 text-sm text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

function OwnerSpriteChip({
  species,
  dexBySpecies,
}: {
  species: string;
  dexBySpecies: Record<string, number>;
}) {
  const dex =
    dexBySpecies[normalizeName(species)] ??
    dexBySpecies[normalizeName(getBaseSpeciesName(species))];
  const sprites = buildSpriteUrls(species, dex);

  return (
    <span className="inline-flex rounded-[0.6rem] border border-line-soft bg-surface-2 p-1" title={species} aria-label={species}>
      <PokemonSprite species={species} spriteUrl={sprites.spriteUrl} animatedSpriteUrl={sprites.animatedSpriteUrl} size="tiny" chrome="plain" />
    </span>
  );
}

export function StatChip({ label }: { label: string }) {
  return (
    <span className={clsx("rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text-faint")}>
      {label}
    </span>
  );
}

export function DexModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex min-h-24 flex-col items-start justify-between rounded-2xl border px-3 py-3 text-left transition",
        active
          ? "border-warning-line bg-[rgba(255,199,107,0.12)] text-[hsl(39_100%_82%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-line-soft bg-[rgba(255,255,255,0.025)] text-text-soft hover:border-line hover:text-text",
      )}
    >
      <span className="display-face text-sm">{title}</span>
      <span className="text-xs leading-5 text-current/80">{description}</span>
    </button>
  );
}

export function DexFilterToggle({
  active,
  onClick,
  tone = "accent",
  compact = false,
  className,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: "warning" | "accent" | "info" | "primary";
  compact?: boolean;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        "inline-flex items-center rounded-full border text-xs transition",
        compact ? "px-2 py-1 text-[11px] sm:px-2.5 sm:py-1.5 sm:text-xs" : "px-3 py-2",
        active
          ? {
              warning: "border-warning-line bg-warning-fill text-[hsl(39_100%_82%)]",
              accent: "border-accent-line bg-accent-fill text-accent-soft",
              info: "border-info-line bg-info-fill text-info-soft",
              primary: "border-primary-line bg-primary-fill text-primary-soft",
            }[tone]
          : "border-line-soft bg-surface-3 text-muted hover:border-line hover:text-text",
        className,
      )}
    >
      {children}
    </button>
  );
}
