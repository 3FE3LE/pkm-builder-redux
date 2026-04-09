"use client";

import clsx from "clsx";
import Image from "next/image";
import { motion } from "motion/react";

export function AppLoadingScreen({
  label = "Cargando Redux Builder",
  detail = "Preparando datos, hidración y navegación.",
  fullscreen = false,
}: {
  label?: string;
  detail?: string;
  fullscreen?: boolean;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className={clsx(
        "relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10",
        fullscreen && "min-h-[100svh]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,208,94,0.08),transparent_34%),radial-gradient(circle_at_70%_20%,rgba(94,240,203,0.08),transparent_28%)]" />
      <div className="dex-loading-pixels pointer-events-none absolute inset-0 opacity-60" />
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.48, ease: "easeOut", delay: 0.06 }}
        className={clsx(
          "relative mx-auto flex max-w-7xl items-center justify-center",
          fullscreen ? "min-h-[calc(100svh-3rem)]" : "min-h-64",
        )}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="dex-loading-snivy-shell">
            <div className="dex-loading-snivy-shell__glow" />
            <motion.div
              className="relative"
              animate={{ y: [0, -6, 0], rotate: [0, -1.5, 1.5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/brand/snivy.png"
                alt="Snivy"
                width={84}
                height={84}
                loading="eager"
                className="h-19 w-19 object-contain pixelated drop-shadow-[0_14px_28px_rgba(0,0,0,0.28)]"
              />
            </motion.div>
          </div>
          <div className="space-y-2">
            <p className="display-face text-sm text-[hsl(39_100%_78%)]">
              {label}
            </p>
            <p className="max-w-md text-sm text-muted">{detail}</p>
            <div className="mx-auto mt-3 flex items-center justify-center gap-1.5">
              <span className="dex-loading-dot" />
              <span className="dex-loading-dot dex-loading-dot-delay-1" />
              <span className="dex-loading-dot dex-loading-dot-delay-2" />
            </div>
          </div>
        </div>
      </motion.section>
    </motion.main>
  );
}
