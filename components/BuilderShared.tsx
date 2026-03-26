"use client";

import Image from "next/image";
import { type CSSProperties, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Check, ChevronsUpDown, Info } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { buildSpriteUrls } from "@/lib/domain/names";
import { TYPE_ORDER, getTypeSurfaceStyle } from "@/lib/domain/typeChart";

const SPECIES_ROW_HEIGHT = 66;
const SPECIES_LIST_MAX_HEIGHT = 288;
const SPECIES_OVERSCAN = 4;

export function TypeBadge({
  type,
  trailing,
  emphasis = "normal",
  className,
}: {
  type: string;
  trailing?: ReactNode;
  emphasis?: "normal" | "danger" | "positive";
  className?: string;
}) {
  return (
    <span
      style={getTypeSurfaceStyle(type, "var(--line)")}
      className={clsx(
        typeBadgeClass(type),
        className,
        emphasis === "danger" &&
          "danger-glow-badge",
        emphasis === "positive" &&
          "positive-glow-badge",
      )}
    >
      <span>{type}</span>
      {trailing ? <span className="text-[10px] opacity-90">{trailing}</span> : null}
    </span>
  );
}

export function ItemSprite({
  name,
  sprite,
  chrome = "framed",
}: {
  name: string;
  sprite?: string | null;
  chrome?: "framed" | "plain";
}) {
  if (!sprite) {
    return (
      <span
        className={clsx(
          "flex h-8 w-8 shrink-0 items-center justify-center text-[10px] text-muted",
          chrome === "framed" && "rounded-[6px] border border-line bg-surface-4",
        )}
      >
        item
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center",
        chrome === "framed" && "rounded-[6px] border border-line bg-surface-4",
      )}
    >
      <Image
        src={sprite}
        alt={name}
        width={36}
        height={36}
        className="h-9 w-9 object-contain pixelated"
        unoptimized={false}
      />
    </span>
  );
}

export function InfoHint({ text }: { text?: string | null }) {
  if (!text) {
    return null;
  }

  return (
    <span className="group relative inline-flex">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] border border-line bg-surface-4 text-muted">
        <Info className="h-3 w-3" />
      </span>
      <span className="status-popover pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-20 hidden w-72 -translate-x-1/2 rounded-[6px] border border-line px-3 py-2 text-xs leading-5 text-text group-hover:block">
        {text}
      </span>
    </span>
  );
}

export function FilterCombobox({
  value,
  options,
  placeholder,
  renderOption,
  searchable = true,
  panelClassName,
  panelStyle,
  coordinationGroup,
  onChange,
}: {
  value: string;
  options: readonly string[] | string[];
  placeholder: string;
  renderOption?: (option: string, selected: boolean) => ReactNode;
  searchable?: boolean;
  panelClassName?: string;
  panelStyle?: CSSProperties;
  coordinationGroup?: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const safeValue = value ?? "";
  const [query, setQuery] = useState("");
  const comboboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = (query ?? "").trim().toLowerCase();
    return options.filter((option) => !searchable || !normalizedQuery || option.toLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  useEffect(() => {
    if (!coordinationGroup) {
      return;
    }

    function handleComboboxOpen(event: Event) {
      const detail = (event as CustomEvent<{ group?: string; id?: string }>).detail;
      if (detail?.group === coordinationGroup && detail.id !== comboboxId) {
        setOpen(false);
      }
    }

    window.addEventListener("filter-combobox-open", handleComboboxOpen);
    return () => window.removeEventListener("filter-combobox-open", handleComboboxOpen);
  }, [comboboxId, coordinationGroup]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setQuery(safeValue);
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen && coordinationGroup) {
            queueMicrotask(() => {
              window.dispatchEvent(
                new CustomEvent("filter-combobox-open", {
                  detail: { group: coordinationGroup, id: comboboxId },
                }),
              );
            });
          }
        }}
        className="flex h-10 w-full items-center justify-between rounded-[6px] border border-line bg-surface-4 px-3 text-left text-sm text-text transition-[border-color,background-color] hover:bg-surface-6"
      >
        <span className={clsx("truncate", !safeValue && "text-text-faint")}>{safeValue || placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </button>

      {open ? (
        <div
          style={panelStyle}
          className={clsx(
            "status-popover absolute left-0 z-20 mt-2 min-w-full rounded-[8px] border border-line p-2 backdrop-blur-md",
            panelClassName
          )}
        >
          {searchable ? (
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="h-9"
              autoFocus
            />
          ) : null}
          <div className={clsx("max-h-56 overflow-auto", searchable && "mt-2")}>
            {filtered.length ? (
              filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setQuery(option);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-sm text-text transition hover:bg-surface-6"
                >
                  {renderOption ? (
                    renderOption(option, option === safeValue)
                  ) : (
                    <>
                      <span>{option}</span>
                      {option === safeValue ? <Check className="h-4 w-4 text-accent" /> : null}
                    </>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted">Sin coincidencias.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SpeciesCombobox({
  value,
  speciesCatalog,
  panelClassName,
  panelStyle,
  coordinationGroup,
  portal = false,
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
  const comboboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const spriteBySlug = useMemo(
    () =>
      Object.fromEntries(
        speciesCatalog.map((entry) => [entry.slug, buildSpriteUrls(entry.name, entry.dex).spriteUrl])
      ) as Record<string, string | undefined>,
    [speciesCatalog]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return speciesCatalog.filter((entry) => {
      const matchesQuery =
        !normalizedQuery || entry.name.toLowerCase().includes(normalizedQuery) || String(entry.dex).includes(normalizedQuery);
      const matchesTypes = typeFilters.every((filterType) => !filterType || entry.types.includes(filterType));
      return matchesQuery && matchesTypes;
    });
  }, [query, speciesCatalog, typeFilters]);
  const totalHeight = filtered.length * SPECIES_ROW_HEIGHT;
  const maxScrollTop = Math.max(0, totalHeight - SPECIES_LIST_MAX_HEIGHT);
  const clampedScrollTop = Math.min(scrollTop, maxScrollTop);
  const startIndex = Math.max(0, Math.floor(clampedScrollTop / SPECIES_ROW_HEIGHT) - SPECIES_OVERSCAN);
  const visibleCount = Math.ceil(SPECIES_LIST_MAX_HEIGHT / SPECIES_ROW_HEIGHT) + SPECIES_OVERSCAN * 2;
  const visibleEntries = filtered.slice(startIndex, startIndex + visibleCount);

  useEffect(() => {
    if (!coordinationGroup) {
      return;
    }

    function handleComboboxOpen(event: Event) {
      const detail = (event as CustomEvent<{ group?: string; id?: string }>).detail;
      if (detail?.group === coordinationGroup && detail.id !== comboboxId) {
        setOpen(false);
      }
    }

    window.addEventListener("species-combobox-open", handleComboboxOpen);
    return () => window.removeEventListener("species-combobox-open", handleComboboxOpen);
  }, [comboboxId, coordinationGroup]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const panelContent = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className={clsx(
        "status-popover absolute z-[120] mt-2 w-full rounded-[8px] border border-line p-2 backdrop-blur-md",
        portal && "mt-0",
        panelClassName,
      )}
    >
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
            setTypeFilters((current) => [next, current[1] === next ? null : current[1]]);
          }}
        />
        <TypeFilterSelect
          value={typeFilters[1]}
          comboboxId="type-filter-2"
          onChange={(next) => {
            setScrollTop(0);
            setTypeFilters((current) => [current[0] === next ? null : current[0], next]);
          }}
        />
      </div>
      <div
        className="mt-2 max-h-72 overflow-auto"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
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
                className="absolute left-0 right-0 flex h-[66px] items-center justify-between rounded-[6px] px-3 py-2 text-left text-sm transition hover:bg-surface-6"
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
                      <span className="text-[10px] text-muted">n/a</span>
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
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={clsx("relative w-full", open && !portal && "z-[140]")}
    >
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
        className="flex h-10 w-full items-center justify-between rounded-[6px] border border-line bg-surface-4 px-3 text-left text-sm text-text transition-[border-color,background-color] hover:bg-surface-6"
      >
        <span className={clsx("truncate", !value && "text-text-faint")}>{value || "Pokemon"}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </button>

      {portal && panelContent ? createPortal(panelContent, document.body) : panelContent}
    </div>
  );
}

export function PokemonSprite({
  species,
  spriteUrl,
  animatedSpriteUrl,
  isEvolving = false,
  size = "default",
  chrome = "framed",
}: {
  species: string;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  isEvolving?: boolean;
  size?: "small" | "default" | "large";
  chrome?: "framed" | "plain";
}) {
  const [useAnimated, setUseAnimated] = useState(true);
  const hasAnimated = Boolean(animatedSpriteUrl);
  const source = hasAnimated && useAnimated ? animatedSpriteUrl : spriteUrl;
  const imageSize = size === "large" ? 140 : size === "small" ? 64 : 112;

  return (
    <div
      className={clsx(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        chrome === "framed"
          ? size === "small"
            ? "sprite-frame h-14 w-14 rounded-[0.75rem]"
            : "sprite-frame h-24 w-24 rounded-[0.875rem]"
          : size === "large"
            ? "h-36 w-36 rounded-[1rem] bg-transparent"
            : size === "small"
              ? "h-14 w-14 rounded-[0.75rem] bg-transparent"
            : "h-24 w-24 rounded-[0.875rem] bg-transparent",
        isEvolving && "animate-[pulse_1.4s_ease-in-out_infinite]"
      )}
    >
      {source ? (
        <Image
          src={source}
          alt={species}
          width={imageSize}
          height={imageSize}
          className={clsx(
            "h-full w-full object-contain transition-[filter,transform] duration-300",
            isEvolving ? "scale-[1.08] brightness-125 saturate-150" : "brightness-100"
          )}
          unoptimized={hasAnimated && useAnimated}
          onError={() => {
            if (useAnimated && spriteUrl) {
              setUseAnimated(false);
            }
          }}
        />
      ) : (
        <div className="display-face text-center text-[11px] text-muted">
          {species}
        </div>
      )}
      {chrome === "framed" ? <div className="sprite-highlight pointer-events-none absolute inset-0" /> : null}
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
        className="flex w-full items-center justify-between rounded-[6px] border border-line bg-surface-4 px-2.5 py-2 transition-[border-color,background-color] hover:bg-surface-6"
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
              className="mb-1 flex w-full items-center justify-between rounded-[6px] px-2 py-2 text-left transition hover:bg-surface-6"
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

export function typeBadgeClass(type: string) {
  return "type-badge-surface pixel-face inline-flex w-[4.75rem] items-center justify-center gap-1 rounded-[0.55rem_0.35rem_0.55rem_0.35rem] border border-white/12 px-1.5 py-1 text-center text-[12px] leading-none tracking-[0.06em] font-normal sm:w-[5.75rem] sm:px-2 sm:text-[13px] md:w-[6.75rem] md:px-2.5 md:text-[14px] lg:w-[8.5rem] lg:gap-2 lg:px-3 lg:py-1.5 lg:text-[16px] lg:tracking-[0.12em]";
}
