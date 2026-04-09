"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, type ReactNode, ViewTransition } from "react";

import { TypeBadge } from "@/components/BuilderShared";
import { Input } from "@/components/ui/Input";
import { type MultiplierBucket } from "@/lib/domain/typeChart";

const statWidgetDeltaLabelClassName = "micro-copy";
const statWidgetLegendClassName = "mt-1 flex items-center gap-3 micro-label text-muted";
const spreadInputLabelClassName = "display-face block text-center text-[8px] leading-none tracking-[0.08em] text-muted";
const spreadInputLabelResponsiveClassName = "lg:text-center lg:text-[9px]";
const spreadInputStepButtonClassName =
  "flex h-6 w-full items-center justify-center border border-line bg-surface-2 px-0 text-[11px] leading-none text-muted transition hover:bg-surface-6";
const spreadInputHorizontalStepButtonClassName =
  "flex h-8 w-7 shrink-0 items-center justify-center border border-line bg-surface-2 text-xs text-muted transition hover:bg-surface-6";
const spreadInputErrorClassName = "mt-2 block micro-copy text-danger";

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
  transitionName,
  baselineValue,
}: {
  label: string;
  value: number;
  max?: number;
  transitionName?: string;
  baselineValue?: number;
}) {
  const reduceMotion = useReducedMotion();
  const isOverflow = value > max;
  const width = Math.min(100, Math.round((value / max) * 100));
  const baselineWidth =
    typeof baselineValue === "number"
      ? Math.min(100, Math.round((baselineValue / max) * 100))
      : null;
  const delta =
    typeof baselineValue === "number" ? value - baselineValue : null;
  const deltaSegment =
    baselineWidth !== null && delta
      ? {
          left: `${Math.min(width, baselineWidth)}%`,
          width: `${Math.abs(width - baselineWidth)}%`,
        }
      : null;
  const badMarker = Math.min(100, Math.round((60 / max) * 100));
  const regularMarker = Math.min(100, Math.round((80 / max) * 100));
  const goodMarker = Math.min(100, Math.round((100 / max) * 100));
  const fillClass =
    value >= 100
      ? "stat-bar-fill-good"
      : value >= 80
        ? "stat-bar-fill-regular"
        : "stat-bar-fill-bad";
  const content = (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="display-face text-xs text-muted">{label}</span>
        <span className="mono-face inline-flex items-center gap-1 text-sm text-accent">
          <span>{value}</span>
          {delta ? (
            <span
              className={clsx(
                statWidgetDeltaLabelClassName,
                delta > 0 ? "text-[hsl(161_84%_67%)]" : "text-[hsl(9_90%_70%)]",
              )}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          ) : null}
          {isOverflow ? (
            <span title={`Excede la escala visual base de ${max}`} className="text-warning-strong">
              *
            </span>
          ) : null}
        </span>
      </div>
      <div className="relative h-3 rounded-md bg-surface-6">
        {baselineWidth !== null && delta ? (
          <span
            className="absolute inset-y-0 left-0 rounded-md border border-dashed border-white/20 bg-white/5"
            style={{ width: `${baselineWidth}%` }}
            aria-hidden="true"
          />
        ) : null}
        {deltaSegment ? (
          <span
            className={clsx(
              "absolute inset-y-0 rounded-md",
              (delta ?? 0) > 0
                ? "bg-[rgba(94,240,203,0.38)]"
                : "bg-[rgba(255,122,92,0.42)]",
            )}
            style={deltaSegment}
            aria-hidden="true"
          />
        ) : null}
        {baselineWidth !== null && delta ? (
          <span
            className="absolute -inset-y-0.5 w-0.5 -translate-x-1/2 rounded-full bg-white/75 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
            style={{ left: `${baselineWidth}%` }}
            aria-hidden="true"
          />
        ) : null}
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
        <motion.div
          className={`h-full rounded-md ${fillClass}`}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${width}%` }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 0.55, ease: "easeInOut" }
          }
          style={{ width: `${width}%` }}
        />
      </div>
      <div className={statWidgetLegendClassName}>
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

  if (!transitionName) {
    return content;
  }

  return <ViewTransition name={transitionName}>{content}</ViewTransition>;
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
        "chip-surface inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1 text-xs text-muted",
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
  autoFocus = false,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
  error?: string;
  orientation?: "horizontal" | "vertical" | "responsive";
  hideLabel?: boolean;
  autoFocus?: boolean;
}) {
  const isVertical = orientation === "vertical" || orientation === "responsive";
  const isResponsive = orientation === "responsive";
  const valueRef = useRef(value);
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const holdCleanupRef = useRef<(() => void) | null>(null);
  const rootNodeRef = useRef<HTMLLabelElement | null>(null);

  valueRef.current = value;

  function clearHold() {
    holdCleanupRef.current?.();
    holdCleanupRef.current = null;
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }

  function step(nextValue: number) {
    onChange(nextValue);
  }

  function startHold(getNextValue: () => number) {
    clearHold();
    step(getNextValue());

    const stopHold = () => {
      clearHold();
    };
    const listeners: Array<[keyof WindowEventMap, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]> = [
      ["pointerup", stopHold, undefined],
      ["pointercancel", stopHold, undefined],
      ["blur", stopHold, undefined],
    ];
    listeners.forEach(([eventName, listener, options]) => {
      window.addEventListener(eventName, listener, options);
    });
    holdCleanupRef.current = () => {
      listeners.forEach(([eventName, listener, options]) => {
        window.removeEventListener(eventName, listener, options);
      });
    };

    holdTimeoutRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(() => {
        step(getNextValue());
      }, 55);
    }, 260);
  }

  const handleRootRef = useCallback((node: HTMLLabelElement | null) => {
    if (!node && rootNodeRef.current) {
      clearHold();
    }
    rootNodeRef.current = node;
  }, []);

  return (
    <label
      ref={handleRootRef}
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
            spreadInputLabelClassName,
            isResponsive && spreadInputLabelResponsiveClassName,
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
            onPointerDown={(event) => {
              event.preventDefault();
              startHold(() =>
                isResponsive ? Math.max(0, valueRef.current - 1) : Math.min(max, valueRef.current + 1),
              );
            }}
            className={clsx(
              `${spreadInputStepButtonClassName} rounded-t-[6px]`,
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
            autoFocus={autoFocus}
            value={value}
            onChange={(event) => {
              const parsedValue = parseInt(event.target.value, 10);
              onChange(Number.isNaN(parsedValue) ? 0 : parsedValue);
            }}
            className={clsx(
              "h-8 min-w-0 w-full rounded-none border-x border-y-0 border-line bg-surface-6 px-0.5 text-center text-sm font-semibold tabular-nums [appearance:textfield]",
              isResponsive && "lg:h-8 lg:w-13 lg:flex-none lg:border-y lg:border-x-0",
            )}
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              startHold(() =>
                isResponsive ? Math.min(max, valueRef.current + 1) : Math.max(0, valueRef.current - 1),
              );
            }}
            className={clsx(
              `${spreadInputStepButtonClassName} rounded-b-[6px]`,
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
            onPointerDown={(event) => {
              event.preventDefault();
              startHold(() => Math.max(0, valueRef.current - 1));
            }}
            className={`${spreadInputHorizontalStepButtonClassName} rounded-l-[6px]`}
            aria-label={`Bajar ${label}`}
          >
            -
          </button>
          <Input
            type="number"
            min={0}
            max={max}
            autoFocus={autoFocus}
            value={value}
            onChange={(event) => {
              const parsedValue = parseInt(event.target.value, 10);
              onChange(Number.isNaN(parsedValue) ? 0 : parsedValue);
            }}
            className="h-8 min-w-12 w-13 flex-1 rounded-none border-y border-x-0 border-line bg-surface-6 px-1 text-center text-base font-semibold tabular-nums [appearance:textfield]"
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              startHold(() => Math.min(max, valueRef.current + 1));
            }}
            className={`${spreadInputHorizontalStepButtonClassName} rounded-r-[6px]`}
            aria-label={`Subir ${label}`}
          >
            +
          </button>
        </div>
      )}
      {error ? (
        <span className={spreadInputErrorClassName}>{error}</span>
      ) : null}
    </label>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-line bg-surface-3 p-4">
      <p className="display-face text-xs text-muted">{label}</p>
      <p className="mono-face mt-3 text-3xl text-accent">{value}</p>
    </article>
  );
}

export function MetaBadge({ label }: { label: string }) {
  return (
    <span className="chip-surface inline-flex min-w-[5.1rem] items-center justify-center px-3 py-1 text-center text-xs text-muted">
      {label}
    </span>
  );
}
