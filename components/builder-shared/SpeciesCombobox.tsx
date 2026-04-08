"use client";

import Image from "next/image";
import {
  startTransition,
  type CSSProperties,
  useDeferredValue,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";

import { Input } from "@/components/ui/Input";
import { buildSpriteUrls } from "@/lib/domain/names";
import { TYPE_ORDER } from "@/lib/domain/typeChart";
import { useCoordinatedPopover } from "@/hooks/useCoordinatedPopover";

import { TypeBadge } from "@/components/builder-shared/TypeBadge";

const SPECIES_ROW_HEIGHT = 66;
const SPECIES_LIST_MAX_HEIGHT = 288;
const SPECIES_OVERSCAN = 4;

export function SpeciesCombobox({
  value,
  speciesCatalog,
  panelClassName,
  panelStyle,
  coordinationGroup,
  portal = true,
  autoFocus = false,
  onChange,
}: {
  value: string;
  speciesCatalog: { name: string; slug: string; dex: number; types: string[] }[];
  panelClassName?: string;
  panelStyle?: CSSProperties;
  coordinationGroup?: string;
  portal?: boolean;
  autoFocus?: boolean;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState<[string | null, string | null]>([null, null]);
  const [scrollTop, setScrollTop] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const deferredTypeFilters = useDeferredValue(typeFilters);
  const comboboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMediaQuery("(max-width: 639px)", {
    defaultValue: false,
    initializeWithValue: false,
  });
  const spriteBySlug = useMemo(
    () =>
      Object.fromEntries(speciesCatalog.map((entry) => [entry.slug, buildSpriteUrls(entry.name, entry.dex).spriteUrl])) as Record<string, string | undefined>,
    [speciesCatalog],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return speciesCatalog.filter((entry) => {
      const matchesQuery =
        !normalizedQuery || entry.name.toLowerCase().includes(normalizedQuery) || String(entry.dex).includes(normalizedQuery);
      const matchesTypes = deferredTypeFilters.every((filterType) => !filterType || entry.types.includes(filterType));
      return matchesQuery && matchesTypes;
    });
  }, [deferredQuery, deferredTypeFilters, speciesCatalog]);
  const totalHeight = filtered.length * SPECIES_ROW_HEIGHT;
  const maxScrollTop = Math.max(0, totalHeight - SPECIES_LIST_MAX_HEIGHT);
  const clampedScrollTop = Math.min(scrollTop, maxScrollTop);
  const startIndex = Math.max(0, Math.floor(clampedScrollTop / SPECIES_ROW_HEIGHT) - SPECIES_OVERSCAN);
  const visibleCount = Math.ceil(SPECIES_LIST_MAX_HEIGHT / SPECIES_ROW_HEIGHT) + SPECIES_OVERSCAN * 2;
  const visibleEntries = filtered.slice(startIndex, startIndex + visibleCount);

  useCoordinatedPopover({
    open,
    coordinationGroup,
    coordinationEventName: "species-combobox-open",
    coordinationId: comboboxId,
    rootRef,
    panelRef,
    onClose: () => setOpen(false),
  });

  const panelBody = (
    <>
      <Input
        value={query}
        onChange={(event) => {
          setScrollTop(0);
          setQuery(event.target.value);
        }}
        placeholder="Buscar por nombre o dex"
        className="h-9"
        autoFocus
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <TypeFilterSelect
          value={typeFilters[0]}
          comboboxId="type-filter-1"
          onChange={(next) => {
            setScrollTop(0);
            startTransition(() => {
              setTypeFilters((current) => [next, current[1] === next ? null : current[1]]);
            });
          }}
        />
        <TypeFilterSelect
          value={typeFilters[1]}
          comboboxId="type-filter-2"
          onChange={(next) => {
            setScrollTop(0);
            startTransition(() => {
              setTypeFilters((current) => [current[0] === next ? null : current[0], next]);
            });
          }}
        />
      </div>
      <div className="mt-2 max-h-72 overflow-auto" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        {filtered.length ? (
          <div className="relative" style={{ height: totalHeight }}>
            {visibleEntries.map((entry, index) => (
              <button
                key={entry.slug}
                type="button"
                onClick={() => {
                  onChange(entry.name);
                  setQuery(entry.name);
                  setOpen(false);
                }}
                style={{ top: (startIndex + index) * SPECIES_ROW_HEIGHT }}
                className="control-surface-hover absolute left-0 right-0 flex h-[66px] items-center justify-between rounded-[6px] px-3 py-2 text-left text-sm transition"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-line bg-surface-4">
                    {spriteBySlug[entry.slug] ? (
                      <Image
                        src={spriteBySlug[entry.slug]!}
                        alt={entry.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain pixelated"
                        unoptimized={false}
                      />
                    ) : (
                      <span className="micro-label text-muted">n/a</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="display-face text-sm text-text">
                      #{String(entry.dex).padStart(3, "0")} {entry.name}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.types.map((type) => (
                        <TypeBadge key={`${entry.slug}-${type}`} type={type} />
                      ))}
                    </div>
                  </div>
                </div>
                {entry.name === value ? <Check className="h-4 w-4 text-accent" /> : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 py-2 text-sm text-muted">No hay resultados para ese filtro.</div>
        )}
      </div>
    </>
  );

  const panelContent = open ? (
    isMobile ? (
      <div className="fixed inset-0 z-1000">
        <button
          type="button"
          aria-label="Cerrar selector de Pokemon"
          className="modal-backdrop absolute inset-0 supports-backdrop-filter:backdrop-blur-md"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
        />
        <div className="absolute inset-x-0 top-0 px-3 pt-[max(env(safe-area-inset-top),1rem)]">
          <div
            ref={panelRef}
            style={panelStyle}
            className={clsx(
              "status-popover box-border w-full rounded-[12px] border border-line p-2 shadow-2xl backdrop-blur-md",
              panelClassName,
            )}
          >
            {panelBody}
          </div>
        </div>
      </div>
    ) : (
      <div
        ref={panelRef}
        style={panelStyle}
        className={clsx(
          "status-popover absolute left-0 z-120 mt-2 box-border w-72 rounded-[8px] border border-line p-2 backdrop-blur-md",
          panelClassName,
        )}
      >
        {panelBody}
      </div>
    )
  ) : null;

  return (
    <div ref={rootRef} className={clsx("relative w-full", open && !portal && "z-140")}>
      <button
        type="button"
        autoFocus={autoFocus}
        onClick={() => {
          setQuery(value);
          setScrollTop(0);
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen && coordinationGroup) {
            queueMicrotask(() => {
              window.dispatchEvent(
                new CustomEvent("species-combobox-open", {
                  detail: { group: coordinationGroup, id: comboboxId },
                }),
              );
            });
          }
        }}
        className="control-surface control-surface-hover flex h-10 w-full items-center justify-between px-3 text-left text-sm text-text transition-[border-color,background-color]"
      >
        <span className={clsx("truncate", !value && "text-text-faint")}>{value || "Pokemon"}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </button>

      {panelContent ? (isMobile ? createPortal(panelContent, document.body) : panelContent) : null}
    </div>
  );
}

function TypeFilterSelect({
  value,
  onChange,
  comboboxId,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  comboboxId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="control-surface control-surface-hover flex w-full items-center justify-between px-2.5 py-2 transition-[border-color,background-color]"
      >
        {value ? <TypeBadge type={value} /> : <span className="pixel-face text-[12px] text-muted">Any</span>}
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </button>

      {open ? (
        <div className="status-popover absolute z-20 mt-2 w-full rounded-[8px] border border-line p-2 backdrop-blur-md">
          <div className="max-h-56 overflow-auto">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="control-surface-hover mb-1 flex w-full items-center justify-between rounded-[6px] px-2 py-2 text-left transition"
            >
              <span className="pixel-face text-[12px] text-muted">Any</span>
              {!value ? <Check className="h-4 w-4 text-accent" /> : null}
            </button>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_ORDER.map((type) => (
                <button
                  key={`${comboboxId}-${type}`}
                  type="button"
                  onClick={() => {
                    onChange(type);
                    setOpen(false);
                  }}
                  className={clsx("transition", value !== type && "opacity-80 hover:opacity-100")}
                >
                  <TypeBadge type={type} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
