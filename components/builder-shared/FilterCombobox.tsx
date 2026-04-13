"use client";

import { type CSSProperties, type ReactNode, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Check, ChevronsUpDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMediaQuery } from "usehooks-ts";

import { Input } from "@/components/ui/Input";
import { useCoordinatedPopover } from "@/hooks/useCoordinatedPopover";

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMediaQuery("(max-width: 639px)", {
    defaultValue: false,
    initializeWithValue: false,
  });

  const filtered = useMemo(() => {
    const normalizedQuery = (query ?? "").trim().toLowerCase();
    return options.filter((option) => !searchable || !normalizedQuery || option.toLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  useCoordinatedPopover({
    open,
    coordinationGroup,
    coordinationEventName: "filter-combobox-open",
    coordinationId: comboboxId,
    rootRef,
    panelRef,
    onClose: () => setOpen(false),
  });

  const panelBody = (
    <>
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
              className="control-surface-hover flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-text transition"
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
    </>
  );
  const panelContent = isMobile ? (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-1000">
          <motion.button
            type="button"
            aria-label="Cerrar combobox"
            className="modal-backdrop absolute inset-0 supports-backdrop-filter:backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
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
            <motion.div
              ref={panelRef}
              style={panelStyle}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, delay: 0.06, ease: "easeOut" }}
              className={clsx(
                "status-popover popover-panel popover-panel-floating box-border w-full origin-top",
                panelClassName,
              )}
            >
              {panelBody}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  ) : (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          style={panelStyle}
          initial={{ opacity: 0, y: -8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.05, ease: "easeOut" }}
          className={clsx(
            "status-popover popover-panel absolute left-0 z-1000 mt-2 box-border w-72 origin-top",
            panelClassName,
          )}
        >
          {panelBody}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

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
      {isMobile ? createPortal(panelContent, document.body) : panelContent}
    </div>
  );
}
