"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

import { TypeBadge } from "@/components/BuilderShared";
import { Input } from "@/components/ui/Input";
import { type MultiplierBucket } from "@/lib/domain/typeChart";
export { MoveCueIcons, MovePowerBadge, MoveSlotSurface, getMoveProfileFit, getMoveStabStyle, getMoveSurfaceClass, getMoveSurfaceStyle } from "@/components/team/MoveUI";
export { AreaSourceCard, RecommendedCard, type AreaSource } from "@/components/team/SourceUI";

export function CoverageBadge({
  label: _label,
  type,
  bucket: _bucket,
  compact: _compact = false,
}: {
  label: string;
  type: string;
  bucket: MultiplierBucket;
  compact?: boolean;
}) {
  return <TypeBadge type={type} />;
}

export function StatBar({
  label,
  value,
  max = 120,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const isOverflow = value > max;
  const width = Math.min(100, Math.round((value / max) * 100));
  const badMarker = Math.min(100, Math.round((60 / max) * 100));
  const regularMarker = Math.min(100, Math.round((80 / max) * 100));
  const goodMarker = Math.min(100, Math.round((100 / max) * 100));
  const fillClass =
    value >= 100
      ? "stat-bar-fill-good"
      : value >= 80
        ? "stat-bar-fill-regular"
        : "stat-bar-fill-bad";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="display-face text-xs text-muted">{label}</span>
        <span className="mono-face inline-flex items-center gap-1 text-sm text-accent">
          <span>{value}</span>
          {isOverflow ? (
            <span title={`Excede la escala visual base de ${max}`} className="text-warning-strong">
              *
            </span>
          ) : null}
        </span>
      </div>
      <div className="relative h-3 rounded-[6px] bg-surface-6">
        <span
          className="absolute -inset-y-0.75 w-px bg-warning-mark"
          style={{ left: `${badMarker}%` }}
          aria-hidden="true"
        />
        <span
          className="absolute -inset-y-0.75 w-px bg-[rgba(111,184,255,0.55)]"
          style={{ left: `${regularMarker}%` }}
          aria-hidden="true"
        />
        <span
          className="absolute -inset-y-0.75 w-px bg-[rgba(94,240,203,0.6)]"
          style={{ left: `${goodMarker}%` }}
          aria-hidden="true"
        />
        <div
          className={`h-full rounded-[6px] ${fillClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-1 flex items-center gap-3 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-px bg-warning-mark-strong" />
          60 malo
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-px bg-[rgba(111,184,255,0.75)]" />
          80 regular
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-px bg-[rgba(94,240,203,0.8)]" />
          100 bueno
        </span>
      </div>
    </div>
  );
}

export function MemberStatChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "up" | "down" | "neutral";
}) {
  return (
    <div
      className={clsx(
        "rounded-[0.5rem] border px-3 py-2",
        tone === "up"
          ? "border-[rgba(94,240,203,0.35)] bg-[rgba(94,240,203,0.1)]"
          : tone === "down"
            ? "border-[rgba(255,143,143,0.3)] bg-[rgba(255,143,143,0.08)]"
            : "border-line bg-surface-3",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="display-face text-[10px] tracking-[0.12em] text-muted">{label}</span>
        {tone === "up" ? (
          <ArrowUp className="h-3.5 w-3.5 text-accent-soft" />
        ) : tone === "down" ? (
          <ArrowDown className="h-3.5 w-3.5 text-danger-soft" />
        ) : (
          <span className="text-[10px] text-muted">·</span>
        )}
      </div>
      <p className="mono-face mt-2 text-lg text-text">{value}</p>
    </div>
  );
}

export function MiniPill({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[0.6rem_0.4rem_0.6rem_0.4rem] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-3 py-1 text-xs text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SpreadInput({
  label,
  value,
  max,
  onChange,
  error,
  orientation = "horizontal",
  hideLabel = false,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
  error?: string;
  orientation?: "horizontal" | "vertical" | "responsive";
  hideLabel?: boolean;
}) {
  const isVertical = orientation === "vertical" || orientation === "responsive";
  const isResponsive = orientation === "responsive";

  return (
    <label
      className={clsx(
        isVertical
          ? "inline-flex w-auto flex-col items-center"
          : "block",
        isResponsive && "lg:inline-flex lg:w-auto lg:flex-col lg:items-center",
      )}
    >
      {hideLabel ? null : (
        <span
          className={clsx(
            "display-face block text-center text-[8px] leading-none tracking-[0.08em] text-muted",
            isResponsive && "lg:text-center lg:text-[9px]",
          )}
        >
          {label}
        </span>
      )}
      {isVertical ? (
        <div
          className={clsx(
            "mx-auto flex w-[2.45rem] flex-col items-center",
            !hideLabel && "mt-1.5",
            isResponsive && "lg:mx-0 lg:mt-0 lg:flex-1 lg:w-auto lg:flex-row lg:items-center",
          )}
        >
          <button
            type="button"
            onClick={() =>
              onChange(
                isResponsive ? Math.max(0, value - 1) : Math.min(max, value + 1),
              )
            }
            className={clsx(
              "flex h-6 w-full items-center justify-center rounded-t-[6px] border border-line bg-surface-2 px-0 text-[11px] leading-none text-muted transition hover:bg-surface-6",
              isResponsive &&
                "lg:h-8 lg:w-7 lg:shrink-0 lg:rounded-b-none lg:rounded-l-[6px] lg:rounded-r-none",
            )}
            aria-label={isResponsive ? `Bajar ${label}` : `Subir ${label}`}
          >
            {isResponsive ? "-" : "+"}
          </button>
          <Input
            type="number"
            min={0}
            max={max}
            value={value}
            onChange={(event) => onChange(Number(event.target.value || 0))}
            className={clsx(
              "h-8 min-w-0 w-full rounded-none border-x border-y-0 border-line bg-surface-6 px-0.5 text-center text-sm font-semibold tabular-nums [appearance:textfield]",
              isResponsive && "lg:h-8 lg:w-[3.25rem] lg:flex-none lg:border-y lg:border-x-0",
            )}
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onClick={() =>
              onChange(
                isResponsive ? Math.min(max, value + 1) : Math.max(0, value - 1),
              )
            }
            className={clsx(
              "flex h-6 w-full items-center justify-center rounded-b-[6px] border border-line bg-surface-2 px-0 text-[11px] leading-none text-muted transition hover:bg-surface-6",
              isResponsive &&
                "lg:h-8 lg:w-7 lg:shrink-0 lg:rounded-t-none lg:rounded-l-none lg:rounded-r-[6px]",
            )}
            aria-label={isResponsive ? `Subir ${label}` : `Bajar ${label}`}
          >
            {isResponsive ? "+" : "-"}
          </button>
        </div>
      ) : (
        <div className={clsx("flex items-center", !hideLabel && "mt-1.5")}>
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 1))}
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-l-[6px] border border-line bg-surface-2 text-xs text-muted transition hover:bg-surface-6"
            aria-label={`Bajar ${label}`}
          >
            -
          </button>
          <Input
            type="number"
            min={0}
            max={max}
            value={value}
            onChange={(event) => onChange(Number(event.target.value || 0))}
            className="h-8 min-w-[3rem] w-[3.25rem] flex-1 rounded-none border-y border-x-0 border-line bg-surface-6 px-1 text-center text-base font-semibold tabular-nums [appearance:textfield]"
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-r-[6px] border border-line bg-surface-2 text-xs text-muted transition hover:bg-surface-6"
            aria-label={`Subir ${label}`}
          >
            +
          </button>
        </div>
      )}
      {error ? (
        <span className="mt-2 block text-[11px] text-danger">{error}</span>
      ) : null}
    </label>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[0.75rem] border border-line bg-surface-3 p-4">
      <p className="display-face text-xs text-muted">{label}</p>
      <p className="mono-face mt-3 text-3xl text-accent">{value}</p>
    </article>
  );
}

export function DefensiveSectionCard({
  title,
  items,
}: {
  title: string;
  items: { type: string; count: number }[];
}) {
  const filtered = items.filter((item) => item.count > 0);
  return (
    <article className="rounded-[0.75rem] border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="display-face text-sm">{title}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filtered.length ? (
          filtered.map((item) => (
            <TypeBadge key={`${title}-${item.type}`} type={item.type} trailing={item.count} />
          ))
        ) : (
          <span className="text-sm text-muted">Sin tipos en esta categoría.</span>
        )}
      </div>
    </article>
  );
}

export function MetaBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex min-w-[5.1rem] items-center justify-center rounded-[0.6rem_0.4rem_0.6rem_0.4rem] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-3 py-1 text-center text-xs text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_0_rgba(255,255,255,0.04)]">
      {label}
    </span>
  );
}
