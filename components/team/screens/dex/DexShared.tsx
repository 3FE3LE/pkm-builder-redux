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

export const dexPanelCardClassName = "panel-strong panel-frame rounded-2xl p-4";
export const dexCollapsedCaretClassName =
  "text-xs text-text-faint transition-transform data-panel-open:rotate-180";
export const dexSectionCaptionClassName = "display-face caption-dense text-text-faint";
export const dexOwnerChipClassName =
  "app-soft-panel inline-flex rounded-[0.6rem] p-1";
export const dexLoadMoreChipClassName =
  "app-soft-chip app-chip-xs px-3";
export const dexStatChipClassName =
  "app-soft-chip app-chip-xs";
export const dexFilterLabelClassName = "micro-label text-text-faint";
export const dexInfoListCardClassName = "app-soft-panel radius-panel-md px-3 py-2";

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
          className={dexPanelCardClassName}
        >
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-10 w-full radius-control-lg" />
            <Skeleton className="h-20 w-full radius-control-lg" />
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
          <span className={dexLoadMoreChipClassName}>
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
        <Collapsible className="app-soft-panel radius-panel-sm mt-2 px-2 py-1.5">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
            <div>
              <p className="display-face text-xs text-text">{closedLabel}</p>
              <p className="mt-1 text-xs text-muted">{count} Pokemon</p>
            </div>
            <span className={dexCollapsedCaretClassName}>⌄</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {nonEmptySections.map((section) => (
              <div key={`${label}-${section.title}`} className="space-y-1">
                <p className={dexSectionCaptionClassName}>{section.title}</p>
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
    <span className={dexOwnerChipClassName} title={species} aria-label={species}>
      <PokemonSprite species={species} spriteUrl={sprites.spriteUrl} animatedSpriteUrl={sprites.animatedSpriteUrl} size="tiny" chrome="plain" />
    </span>
  );
}

export function StatChip({ label }: { label: string }) {
  return (
    <span className={clsx(dexStatChipClassName)}>
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
          ? "warning-badge soft-inset-shadow"
          : "app-soft-panel text-text-soft hover:border-line hover:text-text",
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
        compact ? "px-2 py-1 text-xs sm:px-2.5 sm:py-1.5" : "px-3 py-2",
        active
          ? {
              warning: "warning-badge",
              accent: "border-accent-line bg-accent-fill text-accent-soft",
              info: "border-info-line bg-info-fill text-info-soft",
              primary: "border-primary-line bg-primary-fill text-primary-soft",
            }[tone]
          : "app-soft-chip text-muted hover:border-line hover:text-text",
        className,
      )}
    >
      {children}
    </button>
  );
}
