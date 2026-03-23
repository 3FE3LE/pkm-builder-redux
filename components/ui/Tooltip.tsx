"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type TooltipContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRect: DOMRect | null;
  setTriggerRect: (rect: DOMRect | null) => void;
  setTriggerElement: (element: HTMLElement | null) => void;
  contentId: string;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentId = useId();

  function setTriggerElement(element: HTMLElement | null) {
    triggerRef.current = element;
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      setTriggerRect(triggerRef.current?.getBoundingClientRect() ?? null);
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      triggerRect,
      setTriggerRect,
      setTriggerElement,
      contentId,
    }),
    [contentId, open, triggerRect],
  );

  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

export function TooltipTrigger({
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = useTooltipContext();

  return (
    <button
      {...props}
      ref={(node) => context.setTriggerElement(node)}
      aria-describedby={context.open ? context.contentId : undefined}
      onMouseEnter={(event) => {
        context.setTriggerRect(event.currentTarget.getBoundingClientRect());
        context.setOpen(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        context.setOpen(false);
        onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        context.setTriggerRect(event.currentTarget.getBoundingClientRect());
        context.setOpen(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        context.setOpen(false);
        onBlur?.(event);
      }}
    >
      {children}
    </button>
  );
}

export function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number;
}) {
  const context = useTooltipContext();

  if (!context.open || !context.triggerRect || typeof document === "undefined") {
    return null;
  }

  const left = Math.min(
    Math.max(12, context.triggerRect.left + context.triggerRect.width / 2),
    window.innerWidth - 12,
  );
  const top = Math.max(12, context.triggerRect.top - sideOffset);

  return createPortal(
    <div
      className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full"
      style={{
        left,
        top,
      }}
    >
      <div
        id={context.contentId}
        role="tooltip"
        {...props}
        className={cn(
          "tooltip-surface relative w-max max-w-[min(20rem,calc(100vw-24px))] rounded-[0.65rem] border border-line-strong px-3 py-2 text-xs leading-relaxed text-text backdrop-blur-md",
          className,
        )}
      >
        {children}
        <span
          className="overlay-surface-soft absolute top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-line-strong"
          style={{ left: "50%" }}
        />
      </div>
    </div>,
    document.body,
  );
}

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within Tooltip");
  }
  return context;
}
