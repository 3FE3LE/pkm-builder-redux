"use client";

import { type CSSProperties, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronsUpDown } from "lucide-react";

import { Input } from "@/components/ui/Input";

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
        className="control-surface control-surface-hover flex h-10 w-full items-center justify-between px-3 text-left text-sm text-text transition-[border-color,background-color]"
      >
        <span className={clsx("truncate", !safeValue && "text-text-faint")}>{safeValue || placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </button>

      {open ? (
        <div
          style={panelStyle}
          className={clsx(
            "status-popover absolute left-0 z-20 mt-2 min-w-full rounded-[8px] border border-line p-2 backdrop-blur-md",
            panelClassName,
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
                  className="control-surface-hover flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-sm text-text transition"
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
