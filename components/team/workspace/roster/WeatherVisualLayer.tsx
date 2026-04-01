"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import type { BattleWeather } from "@/lib/domain/battle";

const RAIN_STREAKS = [
  { left: "10%", delay: 0, duration: 0.95 },
  { left: "28%", delay: 0.22, duration: 1.15 },
  { left: "46%", delay: 0.1, duration: 1.05 },
  { left: "64%", delay: 0.34, duration: 1.2 },
  { left: "82%", delay: 0.14, duration: 0.98 },
] as const;

const SUN_FLARES = [
  { left: "78%", top: "12%", size: 72, delay: 0 },
  { left: "66%", top: "22%", size: 34, delay: 0.5 },
] as const;

const SAND_SWEEPS = [
  { top: "24%", delay: 0, duration: 2.4 },
  { top: "46%", delay: 0.7, duration: 2.9 },
  { top: "68%", delay: 0.35, duration: 2.6 },
] as const;

const HAIL_FLAKES = [
  { left: "14%", top: "18%", size: 8, delay: 0 },
  { left: "32%", top: "10%", size: 6, delay: 0.45 },
  { left: "55%", top: "22%", size: 7, delay: 0.18 },
  { left: "74%", top: "14%", size: 9, delay: 0.62 },
  { left: "84%", top: "30%", size: 6, delay: 0.3 },
] as const;

export function WeatherVisualLayer({ weather }: { weather: BattleWeather }) {
  const prefersReducedMotion = useReducedMotion();
  const [disableAmbientFx, setDisableAmbientFx] = useState(false);

  useEffect(() => {
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setDisableAmbientFx(coarsePointerQuery.matches || reduceMotionQuery.matches);
    };

    update();
    coarsePointerQuery.addEventListener("change", update);
    reduceMotionQuery.addEventListener("change", update);
    return () => {
      coarsePointerQuery.removeEventListener("change", update);
      reduceMotionQuery.removeEventListener("change", update);
    };
  }, []);

  if (weather === "clear") {
    return null;
  }

  if (prefersReducedMotion || disableAmbientFx) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div
          className="absolute inset-0"
          style={{
            background:
              weather === "rain"
                ? "linear-gradient(180deg, color-mix(in srgb, hsl(202 90% 74%) 7%, transparent) 0%, transparent 55%, color-mix(in srgb, hsl(205 72% 68%) 6%, transparent) 100%)"
                : weather === "sun"
                  ? "radial-gradient(circle at 84% 14%, color-mix(in srgb, hsl(47 100% 74%) 16%, transparent) 0%, transparent 24%), linear-gradient(135deg, color-mix(in srgb, hsl(30 100% 74%) 6%, transparent) 0%, transparent 58%)"
                  : weather === "sand"
                    ? "linear-gradient(135deg, color-mix(in srgb, hsl(36 46% 62%) 7%, transparent) 0%, transparent 50%, color-mix(in srgb, hsl(31 30% 54%) 5%, transparent) 100%)"
                    : "linear-gradient(180deg, color-mix(in srgb, hsl(197 100% 94%) 6%, transparent) 0%, transparent 62%, color-mix(in srgb, hsl(204 80% 88%) 5%, transparent) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {weather === "rain" ? (
        <>
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.12, 0.2, 0.12] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, hsl(202 90% 74%) 9%, transparent) 0%, transparent 48%, color-mix(in srgb, hsl(205 72% 68%) 8%, transparent) 100%)",
            }}
          />
          {RAIN_STREAKS.map((streak) => (
            <motion.div
              key={`rain-${streak.left}`}
              className="absolute top-[-18%] h-[58%] w-[2px] rounded-full"
              style={{
                left: streak.left,
                background:
                  "linear-gradient(180deg, transparent 0%, color-mix(in srgb, hsl(194 100% 86%) 95%, transparent) 45%, transparent 100%)",
                rotate: "18deg",
                filter:
                  "drop-shadow(0 0 6px color-mix(in srgb, hsl(198 100% 80%) 34%, transparent))",
              }}
              animate={{ y: ["-10%", "150%"], opacity: [0, 0.85, 0] }}
              transition={{
                duration: streak.duration,
                delay: streak.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </>
      ) : null}

      {weather === "sun" ? (
        <>
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.1, 0.16, 0.1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(circle at 84% 14%, color-mix(in srgb, hsl(47 100% 74%) 24%, transparent) 0%, transparent 26%), linear-gradient(135deg, color-mix(in srgb, hsl(30 100% 74%) 10%, transparent) 0%, transparent 58%)",
            }}
          />
          <motion.div
            className="absolute left-[-22%] top-[16%] h-[28%] w-[88%]"
            style={{
              rotate: "-10deg",
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in srgb, hsl(48 100% 84%) 38%, transparent) 20%, color-mix(in srgb, hsl(35 100% 78%) 26%, transparent) 48%, color-mix(in srgb, hsl(28 100% 72%) 14%, transparent) 62%, transparent 100%)",
              filter: "blur(10px)",
              mixBlendMode: "screen",
            }}
            animate={{
              x: ["0%", "10%", "0%"],
              opacity: [0.28, 0.62, 0.3],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {SUN_FLARES.map((flare) => (
            <motion.div
              key={`sun-${flare.left}-${flare.top}`}
              className="absolute rounded-full"
              style={{
                left: flare.left,
                top: flare.top,
                width: flare.size,
                height: flare.size,
                background:
                  "radial-gradient(circle, color-mix(in srgb, hsl(47 100% 82%) 40%, transparent) 0%, transparent 68%)",
                filter: "blur(3px)",
                mixBlendMode: "screen",
              }}
              animate={{
                scale: [0.94, 1.08, 0.96],
                opacity: [0.18, 0.34, 0.2],
              }}
              transition={{
                duration: 3,
                delay: flare.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </>
      ) : null}

      {weather === "sand" ? (
        <>
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.08, 0.16, 0.1] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, hsl(36 46% 62%) 10%, transparent) 0%, transparent 50%, color-mix(in srgb, hsl(31 30% 54%) 7%, transparent) 100%)",
            }}
          />
          {SAND_SWEEPS.map((sweep) => (
            <motion.div
              key={`sand-${sweep.top}`}
              className="absolute left-[-30%] h-[18%] w-[60%]"
              style={{
                top: sweep.top,
                background:
                  "linear-gradient(90deg, transparent 0%, color-mix(in srgb, hsl(39 44% 66%) 22%, transparent) 35%, transparent 100%)",
                filter: "blur(6px)",
                rotate: "-6deg",
              }}
              animate={{ x: ["0%", "210%"], opacity: [0, 0.5, 0] }}
              transition={{
                duration: sweep.duration,
                delay: sweep.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </>
      ) : null}

      {weather === "hail" ? (
        <>
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.08, 0.14, 0.08] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, hsl(197 100% 94%) 9%, transparent) 0%, transparent 62%, color-mix(in srgb, hsl(204 80% 88%) 8%, transparent) 100%)",
            }}
          />
          {HAIL_FLAKES.map((flake) => (
            <motion.div
              key={`hail-${flake.left}-${flake.top}`}
              className="absolute rounded-[2px]"
              style={{
                left: flake.left,
                top: flake.top,
                width: flake.size,
                height: flake.size,
                background:
                  "linear-gradient(135deg, color-mix(in srgb, hsl(199 100% 97%) 96%, transparent) 0%, color-mix(in srgb, hsl(198 78% 84%) 88%, transparent) 100%)",
                boxShadow:
                  "0 0 10px color-mix(in srgb, hsl(198 100% 93%) 24%, transparent)",
              }}
              animate={{
                y: [0, 16, 0],
                rotate: [0, 18, -10, 0],
                opacity: [0.35, 0.82, 0.42],
              }}
              transition={{
                duration: 1.8,
                delay: flake.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}
