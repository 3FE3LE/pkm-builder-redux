"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";

export function PokemonSprite({
  species,
  spriteUrl,
  animatedSpriteUrl,
  isEvolving = false,
  size = "default",
  chrome = "framed",
  eager = false,
}: {
  species: string;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  isEvolving?: boolean;
  size?: "tiny" | "small" | "default" | "large";
  chrome?: "framed" | "plain";
  eager?: boolean;
}) {
  const [useAnimated, setUseAnimated] = useState(true);
  const hasAnimated = Boolean(animatedSpriteUrl);
  const source = hasAnimated && useAnimated ? animatedSpriteUrl : spriteUrl;
  const imageSize =
    size === "large" ? 140 : size === "small" ? 64 : size === "tiny" ? 40 : 112;

  return (
    <div
      className={clsx(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        chrome === "framed"
          ? size === "tiny"
            ? "sprite-frame h-9 w-9 rounded-[0.55rem]"
            : size === "small"
              ? "sprite-frame h-14 w-14 rounded-[0.75rem]"
              : "sprite-frame h-24 w-24 rounded-[0.875rem]"
          : size === "large"
            ? "h-36 w-36 rounded-[1rem] bg-transparent"
            : size === "tiny"
              ? "h-9 w-9 rounded-[0.55rem] bg-transparent"
              : size === "small"
                ? "h-14 w-14 rounded-[0.75rem] bg-transparent"
              : "h-24 w-24 rounded-[0.875rem] bg-transparent",
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
          unoptimized={hasAnimated && useAnimated}
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
