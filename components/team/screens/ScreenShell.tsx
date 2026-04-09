"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export function TeamScreenShell({
  children,
  width = "wide",
  density = "default",
  overflow = "hidden",
  className,
}: {
  children: ReactNode;
  width?: "wide" | "detail" | "narrow";
  density?: "default" | "compact";
  overflow?: "hidden" | "visible";
  className?: string;
}) {
  return (
    <main
      className={clsx(
        "relative px-4 sm:px-6 lg:px-8",
        density === "compact" ? "py-3 sm:py-5" : "py-5",
        overflow === "visible" ? "overflow-visible" : "overflow-hidden",
        className,
      )}
    >
      <section
        className={clsx(
          "mx-auto",
          width === "wide" && "max-w-7xl",
          width === "detail" && "max-w-6xl",
          width === "narrow" && "max-w-4xl",
        )}
      >
        {children}
      </section>
    </main>
  );
}

export function TeamScreenHeader({
  eyebrow,
  title,
  titleClassName,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  titleClassName?: string;
  children?: ReactNode;
  className?: string;
}) {
  if (!eyebrow && !title && !children) {
    return null;
  }

  return (
    <div className={clsx("mb-4 space-y-2", className)}>
      {eyebrow ? <p className="display-face text-sm text-accent">{eyebrow}</p> : null}
      {title ? <h1 className={clsx("pixel-face text-2xl text-text sm:text-[2rem]", titleClassName)}>{title}</h1> : null}
      {children}
    </div>
  );
}
