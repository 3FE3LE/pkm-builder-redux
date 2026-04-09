"use client";

import clsx from "clsx";
import {
  Shield,
  ShieldPlus,
  Sparkles,
  Sword,
  WandSparkles,
} from "lucide-react";
import type { CSSProperties } from "react";

import { TYPE_COLORS, getTypeSurfaceStyle } from "@/lib/domain/typeChart";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export function MovePowerBadge({
  damageClass,
  power,
  adjustedPower,
}: {
  damageClass?: string | null;
  power?: number | null;
  adjustedPower?: number | null;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-current/80">
      {damageClass === "physical" ? (
        <Sword className="h-3.5 w-3.5" />
      ) : damageClass === "special" ? (
        <WandSparkles className="h-3.5 w-3.5" />
      ) : (
        <ShieldPlus className="h-3.5 w-3.5" />
      )}
      {power ? (
        <span className="tabular-nums">
          {adjustedPower && adjustedPower !== power ? `${power}→${adjustedPower}` : power}
        </span>
      ) : null}
    </span>
  );
}

export type MoveProfileFit = {
  kind: "offense" | "defense";
  stat: "atk" | "spa" | "def" | "spd";
};

export function getMoveProfileFit(
  member: Pick<ResolvedTeamMember, "effectiveStats"> | undefined,
  move: { damageClass?: string | null },
): MoveProfileFit | null {
  const stats = member?.effectiveStats;
  if (!stats) {
    return null;
  }

  if (move.damageClass === "physical" && stats.atk >= stats.spa) {
    return { kind: "offense", stat: "atk" };
  }

  if (move.damageClass === "special" && stats.spa >= stats.atk) {
    return { kind: "offense", stat: "spa" };
  }

  if (move.damageClass === "status") {
    return stats.def >= stats.spd
      ? { kind: "defense", stat: "def" }
      : { kind: "defense", stat: "spd" };
  }

  return null;
}

function getMoveStabGlow(type?: string | null) {
  const color = TYPE_COLORS[type ?? ""] ?? "hsl(0 0% 100%)";
  return `color-mix(in srgb, ${color} 40%, transparent)`;
}

export function getMoveStabStyle(type?: string | null) {
  return {
    "--stab-glow": getMoveStabGlow(type),
  } as CSSProperties;
}

export function getMoveSurfaceClass(type?: string | null, hasStab?: boolean) {
  return clsx(
    "border",
    "border-line",
    hasStab &&
      "stab-frame border-white/35",
  );
}

export function getMoveSurfaceStyle(type?: string | null) {
  if (!type) {
    return {
      background: "var(--surface-3)",
      color: "var(--text)",
    } satisfies CSSProperties;
  }

  return getTypeSurfaceStyle(type, "var(--surface-3)") satisfies CSSProperties;
}

export function MoveSlotSurface({
  move,
  member,
  className,
  title,
}: {
  move: Pick<
    ResolvedTeamMember["moves"][number],
    "name" | "type" | "hasStab" | "damageClass" | "power" | "adjustedPower"
  >;
  member?: Pick<ResolvedTeamMember, "effectiveStats">;
  className?: string;
  title?: string;
}) {
  const fit = getMoveProfileFit(member, move);

  return (
    <span
      style={{
        ...getMoveSurfaceStyle(move.type),
        ...(move.hasStab ? getMoveStabStyle(move.type) : undefined),
      }}
      className={clsx(
        "inline-flex min-w-0 items-center gap-2 border px-2.5 py-1.5 text-sm lg:text-base",
        getMoveSurfaceClass(move.type, move.hasStab),
        fit?.kind === "offense" &&
          "fit-offense-surface rounded-[0.625rem_0.375rem_0.625rem_0.375rem]",
        fit?.kind === "defense" &&
          "fit-defense-surface rounded-[0.375rem_0.625rem_0.375rem_0.625rem]",
        !fit && "rounded-lg",
        move.hasStab && "move-stab-surface",
        className,
      )}
      title={
        title ??
        (fit?.kind === "offense"
          ? `Fits ${fit.stat === "atk" ? "Atk" : "SpA"} profile`
          : fit?.kind === "defense"
            ? `Fits ${fit.stat === "def" ? "Def" : "SpD"} profile`
            : undefined)
      }
    >
      <span className="pixel-face min-w-0 flex-1 truncate text-xs leading-none tracking-[0.12em] font-normal sm:text-[13px] md:text-sm lg:text-base">
        {move.name}
      </span>
      <MovePowerBadge
        damageClass={move.damageClass}
        power={move.power}
        adjustedPower={move.adjustedPower}
      />
    </span>
  );
}

export function MoveCueIcons({
  hasStab,
  fit,
}: {
  hasStab?: boolean;
  fit?: MoveProfileFit | null;
}) {
  if (!hasStab && !fit) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-current/85">
      {fit ? (
        <span
          title={
            fit.kind === "offense"
              ? `Aprovecha ${fit.stat === "atk" ? "Atk" : "SpA"}`
              : `Aprovecha ${fit.stat === "def" ? "Def" : "SpD"}`
          }
          className={clsx(
            "inline-flex items-center justify-center",
            fit.kind === "offense" ? "text-warning-strong" : "text-info-soft",
          )}
        >
          {fit.kind === "offense" ? (
            <Sparkles className="h-3.5 w-3.5" />
          ) : (
            <Shield className="h-3.5 w-3.5" />
          )}
        </span>
      ) : null}
      {hasStab ? (
        <span
          title="STAB"
          className="stab-cue inline-flex items-center justify-center"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </span>
  );
}
