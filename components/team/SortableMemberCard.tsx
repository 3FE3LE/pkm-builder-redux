"use client";

import { useEffect, useRef, useState } from "react";
import clsx from 'clsx';
import { Ellipsis, GitCompareArrows, Lock, LockOpen, Mars, Venus, X } from 'lucide-react';
import { motion } from 'motion/react';

import { ItemSprite, PokemonSprite, TypeBadge } from '@/components/BuilderShared';
import { MiniPill } from '@/components/team/UI';
import { Button } from '@/components/ui/Button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { BattleWeather } from "@/lib/domain/battle";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import { TYPE_COLORS } from "@/lib/domain/typeChart";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore";

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

function WeatherVisualLayer({ weather }: { weather: BattleWeather }) {
  if (weather === "clear") {
    return null;
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

function getRosterCardStyle(types: string[]) {
  const primary = TYPE_COLORS[types[0] ?? ""] ?? "hsl(169 37% 68%)";
  const secondary = TYPE_COLORS[types[1] ?? types[0] ?? ""] ?? primary;

  return {
    backgroundColor: "rgba(6, 15, 19, 0.9)",
    backgroundImage: `
      radial-gradient(circle at 14% 14%, color-mix(in srgb, ${primary} 20%, transparent) 0%, transparent 34%),
      radial-gradient(circle at 86% 84%, color-mix(in srgb, ${secondary} 18%, transparent) 0%, transparent 38%),
      linear-gradient(160deg, color-mix(in srgb, ${primary} 10%, rgba(6,15,19,0.92)) 0%, rgba(6,15,19,0.92) 42%, color-mix(in srgb, ${secondary} 9%, rgba(4,10,13,0.96)) 100%)
    `,
  } as const;
}

function renderGenderIcon(
  supportsGender: boolean | undefined,
  gender: EditableMember["gender"],
) {
  if (!supportsGender) {
    return null;
  }

  if (gender === "male") {
    return <Mars className="h-3.5 w-3.5 shrink-0 text-info-soft sm:h-4 sm:w-4" />;
  }

  if (gender === "female") {
    return <Venus className="h-3.5 w-3.5 shrink-0 text-danger-soft sm:h-4 sm:w-4" />;
  }

  return null;
}

function getNatureSummary(
  nature: string,
  natureEffect?: ResolvedTeamMember["natureEffect"],
) {
  if (!nature.trim()) {
    return null;
  }

  if (natureEffect?.up && natureEffect?.down) {
    return `${nature}: sube ${natureEffect.up.toUpperCase()} y baja ${natureEffect.down.toUpperCase()}.`;
  }

  return `${nature}: naturaleza neutra.`;
}

export function SortableMemberCard({
  member,
  index,
  resolved,
  roleRecommendation: _roleRecommendation,
  weather,
  isEvolving,
  isSelected,
  onSelect,
  onToggleLock,
  onAssignToCompare,
  onRemove,
}: {
  member: EditableMember;
  index: number;
  resolved?: ResolvedTeamMember;
  roleRecommendation?: MemberRoleRecommendation;
  weather: BattleWeather;
  isEvolving: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  onAssignToCompare: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: member.id,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const displayName =
    member.nickname ||
    resolved?.species ||
    member.species ||
    "Pokemon pendiente";
  const currentAbility = String(member.ability ?? "").trim();
  const currentNature = String(member.nature ?? "").trim();
  const currentItem = String(member.item ?? "").trim();
  const genderIcon = renderGenderIcon(resolved?.supportsGender, member.gender);
  const cardStyle = getRosterCardStyle(resolved?.resolvedTypes ?? []);
  const desktopMetaEntries = [
    {
      key: "ability",
      label: null,
      value: currentAbility || "-",
      hint: resolved?.abilityDetails?.effect ?? null,
    },
    {
      key: "nature",
      label: null,
      value: currentNature || "-",
      hint: getNatureSummary(currentNature, resolved?.natureEffect),
    },
    {
      key: "item",
      label: null,
      value: currentItem || "Item",
      hint: resolved?.itemDetails?.effect ?? null,
    },
    {
      key: "bst",
      label: "BST",
      value: String(
        resolved?.resolvedStats?.bst ??
          resolved?.summaryStats?.bst ??
          resolved?.effectiveStats?.bst ??
          "-",
      ),
      hint: null,
    },
  ];

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...cardStyle,
      }}
      className={clsx(
        "panel relative min-w-0 cursor-grab rounded-[0.9rem] p-2.5 transition-[border-color,box-shadow,background,transform,opacity,filter] duration-200 ease-out active:cursor-grabbing sm:p-3",
        isDragging &&
          "drag-surface scale-[0.94] border-accent opacity-45 saturate-[0.82] blur-[1px]",
        isSelected &&
          "selection-tint selection-shadow border-primary-line-active",
      )}
      onClick={onSelect}
    >
      <WeatherVisualLayer weather={weather} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="roster-name-face mt-0.5 min-w-0 flex-1 truncate pr-2">
            <span className="inline-flex max-w-full items-center gap-1.5">
              <span className="truncate">{displayName}</span>
              {genderIcon}
            </span>
          </p>
          <div ref={menuRef} className="relative shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((current) => !current);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label={`Abrir acciones para ${member.species || `slot ${index + 1}`}`}
              aria-expanded={menuOpen}
              className="size-6 border border-line bg-surface-4 text-muted hover:bg-surface-8 sm:size-7"
            >
              <Ellipsis className="h-4 w-4" />
            </Button>
            {menuOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+0.35rem)] min-w-[9rem] rounded-[0.8rem] border border-line-strong bg-[rgba(6,15,19,0.96)] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-md"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleLock();
                  }}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-[0.65rem] px-2.5 py-2 text-left text-xs transition",
                    member.locked
                      ? "text-warning-strong hover:bg-warning-fill"
                      : "text-text hover:bg-surface-4",
                  )}
                >
                  {member.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                  <span>{member.locked ? "Unlock" : "Lock"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAssignToCompare();
                  }}
                  className="flex w-full items-center gap-2 rounded-[0.65rem] px-2.5 py-2 text-left text-xs text-text transition hover:bg-surface-4"
                >
                  <GitCompareArrows className="h-3.5 w-3.5" />
                  <span>Compare</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove();
                  }}
                  className="flex w-full items-center gap-2 rounded-[0.65rem] px-2.5 py-2 text-left text-xs text-danger transition hover:bg-danger-fill"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2 lg:hidden">
          <div className="flex justify-center">
            <div className="relative">
              <PokemonSprite
                species={resolved?.species ?? member.species ?? `Slot ${index + 1}`}
                spriteUrl={resolved?.spriteUrl}
                animatedSpriteUrl={resolved?.animatedSpriteUrl}
                isEvolving={isEvolving}
                size="default"
                chrome="plain"
              />
              {currentItem ? (
                <div className="absolute bottom-0 right-0">
                  <ItemSprite name={currentItem} sprite={resolved?.itemDetails?.sprite} chrome="plain" />
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 sm:gap-1.5">
            {resolved?.resolvedTypes.length ? (
              resolved.resolvedTypes.map((type) => (
                <div key={`${member.id}-${type}`} className="min-w-0">
                  <TypeBadge type={type} className="w-full" />
                </div>
              ))
            ) : (
              <div className="min-w-0">
                <MiniPill className="flex w-full items-center justify-center px-2 py-1 text-[10px] sm:text-xs">
                  tipo pendiente
                </MiniPill>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="mt-2 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              {member.nickname && resolved?.species && member.nickname !== resolved.species ? (
                <p className="pixel-face text-[11px] leading-none tracking-[0.08em] text-text-faint">
                  {resolved.species}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {resolved?.resolvedTypes.length ? (
                  resolved.resolvedTypes.map((type) => (
                    <TypeBadge key={`${member.id}-${type}-desktop`} type={type} />
                  ))
                ) : (
                  <MiniPill className="px-2.5 py-1 text-[11px]">tipo pendiente</MiniPill>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {desktopMetaEntries.map((entry) => (
                  <span
                    key={`${member.id}-${entry.key}`}
                    className="group relative min-w-0"
                  >
                    <MiniPill
                      className="flex w-full min-w-0 items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-text"
                    >
                      {entry.label ? (
                        <span className="display-face shrink-0 text-[9px] tracking-[0.12em] text-text-faint">
                          {entry.label}
                        </span>
                      ) : null}
                      <span className="pixel-face min-w-0 flex-1 truncate text-[11px] leading-none tracking-[0.06em] text-text">
                        {entry.value}
                      </span>
                    </MiniPill>
                    {entry.hint ? (
                      <span className="status-popover pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-20 hidden w-72 -translate-x-1/2 rounded-[6px] border border-line px-3 py-2 text-xs leading-5 text-text group-hover:block">
                        {entry.hint}
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 justify-center">
              <div className="relative">
                <PokemonSprite
                  species={resolved?.species ?? member.species ?? `Slot ${index + 1}`}
                  spriteUrl={resolved?.spriteUrl}
                  animatedSpriteUrl={resolved?.animatedSpriteUrl}
                  isEvolving={isEvolving}
                  size="large"
                  chrome="plain"
                />
                {currentItem ? (
                  <div className="absolute bottom-1 right-1">
                    <ItemSprite name={currentItem} sprite={resolved?.itemDetails?.sprite} chrome="plain" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
