"use client";

import Image from "next/image";
import clsx from "clsx";

export function ItemSprite({
  name,
  sprite,
  chrome = "framed",
}: {
  name: string;
  sprite?: string | null;
  chrome?: "framed" | "plain";
}) {
  if (!sprite) {
    return (
      <span
        className={clsx(
          "micro-label flex h-8 w-8 shrink-0 items-center justify-center text-muted",
          chrome === "framed" && "control-surface",
        )}
      >
        item
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center",
        chrome === "framed" && "control-surface",
      )}
    >
      <Image
        src={sprite}
        alt={name}
        width={36}
        height={36}
        className="h-9 w-9 object-contain pixelated"
        style={{ width: "auto", height: "auto" }}
        unoptimized={false}
      />
    </span>
  );
}
