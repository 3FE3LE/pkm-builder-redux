"use client";

import clsx from "clsx";

import { applyStatModifiers, calculateEffectiveStats } from "@/lib/domain/battle";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore";

const ZERO_SPREAD = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
} satisfies Record<keyof EditableMember["ivs"], number>;

const RADAR_MIN_STAT = 5;
const RADAR_MAX_STAT = 500;
const RADAR_MIN_VISIBLE_RATIO = 0.08;
const RADAR_SCALE_PIVOT = 110;
const statRadarLabelClassName = "micro-label font-medium";
const statRadarLegendClassName = "mt-3 flex flex-wrap items-center justify-center gap-3 micro-copy text-muted";
const statRadarGridStroke = "rgba(255,255,255,0.08)";
const statRadarBaseFill = "rgba(255,255,255,0.045)";
const statRadarBaseStroke = "rgba(255,255,255,0.28)";
const statRadarIvLayerFill = "rgba(99,144,240,0.18)";
const statRadarEvLayerFill = "rgba(185,255,102,0.16)";
const statRadarIvStroke = "rgba(99,144,240,0.82)";
const statRadarEvStroke = "rgba(185,255,102,0.92)";
const statRadarBasePointFill = "rgba(255,255,255,0.55)";
const statRadarIvPointFill = "rgba(99,144,240,0.95)";
const statRadarEvPointFill = "rgba(185,255,102,1)";
const statRadarBaseLegendDotClassName = "bg-white/65";
const statRadarIvLegendDotClassName = "bg-info";
const statRadarEvLegendDotClassName = "bg-primary";

export function buildSummaryStats(
  baseStats: NonNullable<ResolvedTeamMember["resolvedStats"]>,
  natureEffect: NonNullable<ResolvedTeamMember["natureEffect"]>,
  statModifiers?: ResolvedTeamMember["statModifiers"],
) {
  const natureAdjusted = {
    hp: baseStats.hp,
    atk: Math.round(
      baseStats.atk *
        (natureEffect.up === "atk"
          ? 1.1
          : natureEffect.down === "atk"
            ? 0.9
            : 1),
    ),
    def: Math.round(
      baseStats.def *
        (natureEffect.up === "def"
          ? 1.1
          : natureEffect.down === "def"
            ? 0.9
            : 1),
    ),
    spa: Math.round(
      baseStats.spa *
        (natureEffect.up === "spa"
          ? 1.1
          : natureEffect.down === "spa"
            ? 0.9
            : 1),
    ),
    spd: Math.round(
      baseStats.spd *
        (natureEffect.up === "spd"
          ? 1.1
          : natureEffect.down === "spd"
            ? 0.9
            : 1),
    ),
    spe: Math.round(
      baseStats.spe *
        (natureEffect.up === "spe"
          ? 1.1
          : natureEffect.down === "spe"
            ? 0.9
            : 1),
    ),
    bst: baseStats.bst,
  };
  const adjusted = statModifiers?.length
    ? applyStatModifiers(natureAdjusted, statModifiers)
    : natureAdjusted;
  return {
    ...adjusted,
    bst: baseStats.bst,
  };
}

export function EffectiveStatsRadar({
  effectiveStats,
  baseStats,
  level,
  nature,
  ivs,
  evs,
  statModifiers,
  natureEffect,
}: {
  effectiveStats: NonNullable<ResolvedTeamMember["effectiveStats"]>;
  baseStats: NonNullable<ResolvedTeamMember["resolvedStats"]>;
  level: number;
  nature: string;
  ivs: Partial<EditableMember["ivs"]>;
  evs: Partial<EditableMember["evs"]>;
  statModifiers?: ResolvedTeamMember["statModifiers"];
  natureEffect?: ResolvedTeamMember["natureEffect"];
}) {
  const axes = [
    { label: "HP", key: "hp" as const },
    { label: "Atk", key: "atk" as const },
    { label: "Def", key: "def" as const },
    { label: "Spe", key: "spe" as const },
    { label: "SpD", key: "spd" as const },
    { label: "SpA", key: "spa" as const },
  ];
  const center = 120;
  const radius = 82;
  const levels = [0.25, 0.5, 0.75, 1];
  const baseLayerStats = applyStatModifiers(
    calculateEffectiveStats(baseStats, level, nature, ZERO_SPREAD, ZERO_SPREAD),
    statModifiers ?? [],
  );
  const ivLayerStats = applyStatModifiers(
    calculateEffectiveStats(baseStats, level, nature, ivs, {}),
    statModifiers ?? [],
  );
  const evLayerStats = effectiveStats;
  const points = axes.map((axis, index) =>
    buildRadarPoint(
      axis,
      index,
      evLayerStats[axis.key],
      center,
      radius,
      axes.length,
    ),
  );
  const basePoints = axes.map((axis, index) =>
    buildRadarPoint(
      axis,
      index,
      baseLayerStats[axis.key],
      center,
      radius,
      axes.length,
    ),
  );
  const ivPoints = axes.map((axis, index) =>
    buildRadarPoint(
      axis,
      index,
      ivLayerStats[axis.key],
      center,
      radius,
      axes.length,
    ),
  );
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  const basePolygon = basePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const ivPolygon = ivPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const ivLayerPath = buildLayerPath(ivPoints, basePoints);
  const evLayerPath = buildLayerPath(points, ivPoints);

  return (
    <div className="w-full">
      <svg viewBox="0 0 240 240" className="h-auto w-full overflow-visible">
        {levels.map((levelValue) => {
          const ring = axes
            .map((_, index) => {
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes.length;
              const x = center + Math.cos(angle) * radius * levelValue;
              const y = center + Math.sin(angle) * radius * levelValue;
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={`radar-level-${levelValue}`}
              points={ring}
              fill="none"
              stroke={statRadarGridStroke}
              strokeWidth="1"
            />
          );
        })}
        {points.map((point) => (
          <line
            key={`radar-axis-${point.key}`}
            x1={center}
            y1={center}
            x2={point.axisX}
            y2={point.axisY}
            stroke={statRadarGridStroke}
            strokeWidth="1"
          />
        ))}
        <polygon
          points={basePolygon}
          fill={statRadarBaseFill}
          stroke={statRadarBaseStroke}
          strokeWidth="1.25"
        />
        <path
          d={ivLayerPath}
          fill={statRadarIvLayerFill}
          fillRule="evenodd"
        />
        <path
          d={evLayerPath}
          fill={statRadarEvLayerFill}
          fillRule="evenodd"
        />
        <polygon
          points={ivPolygon}
          fill="none"
          stroke={statRadarIvStroke}
          strokeWidth="1.5"
        />
        <polygon
          points={polygon}
          fill="none"
          stroke={statRadarEvStroke}
          strokeWidth="2"
        />
        {basePoints.map((point) => (
          <circle
            key={`radar-base-point-${point.key}`}
            cx={point.x}
            cy={point.y}
            r="2.2"
            fill={statRadarBasePointFill}
          />
        ))}
        {ivPoints.map((point) => (
          <circle
            key={`radar-iv-point-${point.key}`}
            cx={point.x}
            cy={point.y}
            r="2.7"
            fill={statRadarIvPointFill}
          />
        ))}
        {points.map((point) => (
          <circle
            key={`radar-point-${point.key}`}
            cx={point.x}
            cy={point.y}
            r="3.5"
            fill={statRadarEvPointFill}
          />
        ))}
        {points.map((point) => (
          <text
            key={`radar-label-${point.key}`}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className={clsx(
              statRadarLabelClassName,
              point.key === "hp" || point.key === "spe"
                ? "leading-[1.1]"
                : "leading-[1.45]",
              getNatureTone(point.key, natureEffect),
            )}
          >
            {point.label}
            {natureEffect?.up === point.key
              ? "↑"
              : natureEffect?.down === point.key
                ? "↓"
                : ""}
          </text>
        ))}
        {points.map((point) => (
          <text
            key={`radar-value-${point.key}`}
            x={point.labelX}
            y={point.valueY}
            textAnchor="middle"
            dominantBaseline="middle"
            className={clsx(
              statRadarLabelClassName,
              point.key === "hp" || point.key === "spe"
                ? "leading-[1.05]"
                : "leading-[1.35]",
              getNatureTone(point.key, natureEffect, "fill-text"),
            )}
          >
            {point.value}
          </text>
        ))}
      </svg>
      <div className={statRadarLegendClassName}>
        <span className="inline-flex items-center gap-1.5">
          <span className={clsx("h-2 w-2 rounded-full", statRadarBaseLegendDotClassName)} />
          base
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={clsx("h-2 w-2 rounded-full", statRadarIvLegendDotClassName)} />
          + IV
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={clsx("h-2 w-2 rounded-full", statRadarEvLegendDotClassName)} />
          + EV
        </span>
      </div>
    </div>
  );
}

function buildRadarPoint(
  axis: { label: string; key: "hp" | "atk" | "def" | "spe" | "spd" | "spa" },
  index: number,
  value: number,
  center: number,
  radius: number,
  totalAxes: number,
) {
  const ratio = getRadarScaleRatio(value);
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / totalAxes;

  return {
    ...axis,
    ratio,
    x: center + Math.cos(angle) * radius * ratio,
    y: center + Math.sin(angle) * radius * ratio,
    labelX: center + Math.cos(angle) * (radius + 26),
    labelY: center + Math.sin(angle) * (radius + 26),
    valueY:
      center +
      Math.sin(angle) *
        (radius + (axis.key === "hp" || axis.key === "spe" ? 40 : 47)),
    axisX: center + Math.cos(angle) * radius,
    axisY: center + Math.sin(angle) * radius,
    value,
    max: RADAR_MAX_STAT,
  };
}

export function getRadarScaleRatio(value: number) {
  const clampedValue = Math.max(RADAR_MIN_STAT, Math.min(RADAR_MAX_STAT, value));
  const normalized =
    Math.asinh((clampedValue - RADAR_MIN_STAT) / RADAR_SCALE_PIVOT) /
    Math.asinh((RADAR_MAX_STAT - RADAR_MIN_STAT) / RADAR_SCALE_PIVOT);

  return RADAR_MIN_VISIBLE_RATIO + normalized * (1 - RADAR_MIN_VISIBLE_RATIO);
}

function buildLayerPath(
  outerPoints: Array<{ x: number; y: number }>,
  innerPoints: Array<{ x: number; y: number }>,
) {
  const outer = outerPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const inner = [...innerPoints]
    .reverse()
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  return `${outer} Z ${inner} Z`;
}

function getNatureTone(
  stat: "hp" | "atk" | "def" | "spe" | "spd" | "spa",
  natureEffect?: ResolvedTeamMember["natureEffect"],
  fallback = "fill-muted",
) {
  if (natureEffect?.up === stat) {
    return "fill-danger";
  }
  if (natureEffect?.down === stat) {
    return "fill-info";
  }
  return fallback;
}
