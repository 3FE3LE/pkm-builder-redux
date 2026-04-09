"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import clsx from "clsx";

function subscribeAnimationCapability(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  coarsePointerQuery.addEventListener("change", callback);
  reducedMotionQuery.addEventListener("change", callback);

  return () => {
    coarsePointerQuery.removeEventListener("change", callback);
    reducedMotionQuery.removeEventListener("change", callback);
  };
}

function getAnimationCapabilitySnapshot() {
  if (typeof window === "undefined") {
    return true;
  }

  return (
    !window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function PokemonSprite({
  species,
  spriteUrl,
  animatedSpriteUrl,
  isEvolving = false,
  size = "default",
  chrome = "framed",
  eager = false,
  allowCoarsePointerAnimation = false,
}: {
  species: string;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  isEvolving?: boolean;
  size?: "tiny" | "small" | "default" | "large" | "fill";
  chrome?: "framed" | "plain";
  eager?: boolean;
  allowCoarsePointerAnimation?: boolean;
}) {
  const [useAnimated, setUseAnimated] = useState(true);
  const canUseAnimatedSprites = useSyncExternalStore(
    subscribeAnimationCapability,
    getAnimationCapabilitySnapshot,
    () => true,
  );
  const hasAnimated = Boolean(animatedSpriteUrl);
  const canAnimateHere = canUseAnimatedSprites || allowCoarsePointerAnimation;
  const source =
    hasAnimated && useAnimated && canAnimateHere
      ? animatedSpriteUrl
      : spriteUrl;
  const imageSize =
    size === "large" ? 140 : size === "small" ? 64 : size === "tiny" ? 40 : size === "fill" ? 192 : 112;

  return (
    <div
      className={clsx(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        chrome === "framed"
          ? size === "tiny"
            ? "sprite-frame h-9 w-9 rounded-3xl"
            : size === "small"
              ? "sprite-frame h-14 w-14 rounded-xl"
              : size === "fill"
                ? "sprite-frame h-full w-full rounded-[inherit]"
              : "sprite-frame h-24 w-24 rounded-xl"
          : size === "large"
            ? "h-36 w-36 rounded-2xl bg-transparent"
            : size === "tiny"
              ? "h-9 w-9 rounded-3xl bg-transparent"
            : size === "small"
              ? "h-14 w-14 rounded-xl bg-transparent"
            : size === "fill"
                ? "h-full w-full rounded-[inherit] bg-transparent"
              : "h-24 w-24 rounded-xl bg-transparent",
        isEvolving && "animate-[pulse_1.4s_ease-in-out_infinite]",
      )}
    >
      {source ? (
        <Image
          src={source}
          alt={species}
          width={imageSize}
          height={imageSize}
          loading={eager ? "eager" : undefined}
          className={clsx(
            "h-full w-full object-contain transition-[filter,transform] duration-300",
            isEvolving ? "scale-[1.08] brightness-125 saturate-150" : "brightness-100",
          )}
          unoptimized={hasAnimated && useAnimated && canAnimateHere}
          onError={() => {
            if (useAnimated && spriteUrl) {
              setUseAnimated(false);
            }
          }}
        />
      ) : (
        <div className="display-face micro-copy text-center text-muted">{species}</div>
      )}
      {chrome === "framed" ? <div className="sprite-highlight pointer-events-none absolute inset-0" /> : null}
    </div>
  );
}
