"use client";

import clsx from "clsx";
import {
  Crosshair,
  Gauge,
  HeartPulse,
  RefreshCcw,
  Shield,
  Sparkles,
  Swords,
  WandSparkles,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROLE_LABELS } from "@/lib/domain/roleLabels";

import type {
  MemberRoleRecommendation,
  RoleId,
} from "@/lib/domain/roleAnalysis";

const ROLE_AXIS_ORDER: RoleId[] = [
  "wallbreaker",
  "setupSweeper",
  "cleaner",
  "revengeKiller",
  "speedControl",
  "bulkyPivot",
  "support",
  "defensiveGlue",
];

export function RoleAxesCard({
  role,
  compact = false,
  className,
}: {
  role?: MemberRoleRecommendation;
  compact?: boolean;
  className?: string;
}) {
  if (!role) {
    return null;
  }

  const size = compact ? 116 : 220;
  const center = size / 2;
  const radius = compact ? 34 : 70;
  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = buildPolygon(role.roleScores, center, radius);
  const spikes = ROLE_AXIS_ORDER.map((axis, index) =>
    buildAxisPoint(index, ROLE_AXIS_ORDER.length, center, radius),
  );

  return (
    <div className={clsx("relative shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {rings.map((ring) => (
          <polygon
            key={`ring-${ring}`}
            points={buildRing(ring, center, radius)}
            fill="none"
            stroke="rgba(143,204,193,0.16)"
            strokeWidth="1"
          />
        ))}
        {spikes.map((point, index) => (
          <line
            key={`axis-${ROLE_AXIS_ORDER[index]}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="rgba(143,204,193,0.18)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={polygon}
          fill="rgba(94,240,203,0.18)"
          stroke="rgba(94,240,203,0.78)"
          strokeWidth="2"
        />
        {ROLE_AXIS_ORDER.map((axis, index) => {
          const point = buildValuePoint(
            role.roleScores[axis],
            index,
            ROLE_AXIS_ORDER.length,
            center,
            radius,
          );
          return (
            <circle
              key={`value-${axis}`}
              cx={point.x}
              cy={point.y}
              r={compact ? 2.5 : 3.5}
              fill="rgba(185,255,102,0.95)"
            />
          );
        })}
      </svg>
      {ROLE_AXIS_ORDER.map((axis, index) => {
        const point = buildAxisPoint(
          index,
          ROLE_AXIS_ORDER.length,
          center,
          radius + (compact ? 16 : 26),
        );
        const Icon = roleIcon(axis);
        return (
          <Tooltip key={`icon-${axis}`}>
            <TooltipTrigger
              type="button"
              className={clsx(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-soft bg-[rgba(7,20,24,0.9)] text-[rgba(220,247,242,0.82)] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]",
                compact ? "p-1" : "p-1.5",
              )}
              style={{ left: point.x, top: point.y }}
            >
              <span className={clsx("block")}>
                <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{ROLE_LABELS[axis]}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function buildPolygon(
  scores: Record<RoleId, number>,
  center: number,
  radius: number,
) {
  return ROLE_AXIS_ORDER.map((axis, index) => {
    const point = buildValuePoint(
      scores[axis],
      index,
      ROLE_AXIS_ORDER.length,
      center,
      radius,
    );
    return `${point.x},${point.y}`;
  }).join(" ");
}

function buildRing(multiplier: number, center: number, radius: number) {
  return ROLE_AXIS_ORDER.map((_, index) => {
    const point = buildAxisPoint(
      index,
      ROLE_AXIS_ORDER.length,
      center,
      radius * multiplier,
    );
    return `${point.x},${point.y}`;
  }).join(" ");
}

function buildValuePoint(
  score: number,
  index: number,
  total: number,
  center: number,
  radius: number,
) {
  const normalized = Math.max(0, Math.min(1, score / 7));
  return buildAxisPoint(index, total, center, radius * normalized);
}

function buildAxisPoint(
  index: number,
  total: number,
  center: number,
  radius: number,
) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function roleIcon(role: RoleId) {
  return {
    wallbreaker: Swords,
    setupSweeper: Sparkles,
    cleaner: Crosshair,
    revengeKiller: Gauge,
    speedControl: WandSparkles,
    bulkyPivot: RefreshCcw,
    support: HeartPulse,
    defensiveGlue: Shield,
  }[role];
}
