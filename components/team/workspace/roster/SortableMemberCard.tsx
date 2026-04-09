"use client";

import { ViewTransition } from "react";
import clsx from 'clsx';
import { Mars, Venus } from 'lucide-react';
import { useMediaQuery } from "usehooks-ts";

import { ItemSprite, PokemonSprite, TypeBadge } from '@/components/BuilderShared';
import { MiniPill } from '@/components/team/UI';
import { WeatherVisualLayer } from "@/components/team/workspace/roster/WeatherVisualLayer";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { BattleWeather } from "@/lib/domain/battle";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import { getTypedSurfaceStyle } from "@/lib/ui/typeSurface";
import type { EditableMember } from "@/lib/builderStore";
import { getTeamEditorTransitionName } from "@/lib/teamEditorViewTransition";

const rosterCardShellClassName =
  "panel relative min-w-0 cursor-grab rounded-xl p-2.5 transition-[border-color,box-shadow,background,transform,opacity,filter] duration-200 ease-out active:cursor-grabbing sm:p-3";
const rosterCardDraggingClassName =
  "drag-surface scale-[0.94] border-accent opacity-45 saturate-[0.82] blur-[1px]";
const rosterSpeciesCaptionClassName =
  "pixel-face micro-copy leading-none tracking-[0.08em] text-text-faint";
const rosterMetaPillClassName =
  "micro-copy flex w-full min-w-0 items-center justify-between gap-2 px-2.5 py-1.5 text-text";
const rosterMetaLabelClassName =
  "display-face shrink-0 text-[9px] tracking-[0.12em] text-text-faint";
const rosterMetaValueClassName =
  "pixel-face micro-copy min-w-0 flex-1 truncate leading-none tracking-[0.06em] text-text";
const rosterMetaHintClassName =
  "status-popover tooltip-card pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-20 hidden w-72 -translate-x-1/2 group-hover:block group-focus:block";
const rosterEmptyTypePillClassName =
  "micro-label flex w-full items-center justify-center px-2 py-1 sm:text-xs";

function getRosterCardStyle(types: string[]) {
  return getTypedSurfaceStyle(types, {
    primaryGlowMix: 20,
    secondaryGlowMix: 18,
    primaryBodyMix: 10,
    secondaryBodyMix: 9,
  });
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
  hasActiveSelection,
  onSelect,
}: {
  member: EditableMember;
  index: number;
  resolved?: ResolvedTeamMember;
  roleRecommendation?: MemberRoleRecommendation;
  weather: BattleWeather;
  isEvolving: boolean;
  isSelected: boolean;
  hasActiveSelection: boolean;
  onSelect: () => void;
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
  const isDesktop = useMediaQuery("(min-width: 768px)", {
    defaultValue: false,
    initializeWithValue: false,
  });
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

  return (
    <ViewTransition name={getTeamEditorTransitionName("card", member.id)}>
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
        rosterCardShellClassName,
        isDragging && rosterCardDraggingClassName,
        isSelected &&
          "roster-card-selected selection-tint selection-shadow border-primary-line-active",
        hasActiveSelection &&
          !isSelected &&
          "roster-card-unselected",
      )}
      onClick={onSelect}
      >
      <WeatherVisualLayer weather={weather} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-start gap-2">
          <p className="roster-name-face mt-0.5 min-w-0 flex-1 truncate">
            <span className="inline-flex max-w-full items-center gap-1.5">
              <ViewTransition name={getTeamEditorTransitionName("title", member.id)}>
                <span className="truncate">{displayName}</span>
              </ViewTransition>
              {genderIcon}
            </span>
          </p>
        </div>

        {isDesktop ? (
          <div className="mt-2 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              {member.nickname && resolved?.species && member.nickname !== resolved.species ? (
                <p className={rosterSpeciesCaptionClassName}>
                  {resolved.species}
                </p>
              ) : null}

              <ViewTransition name={getTeamEditorTransitionName("types", member.id)}>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {resolved?.resolvedTypes.length ? (
                    resolved.resolvedTypes.map((type) => (
                      <TypeBadge key={`${member.id}-${type}-desktop`} type={type} />
                    ))
                  ) : (
                    <MiniPill className="micro-copy px-2.5 py-1">tipo pendiente</MiniPill>
                  )}
                </div>
              </ViewTransition>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {desktopMetaEntries.map((entry) => {
                  const hintId = `entry-hint-${member.id}-${entry.key}`;
                  return (
                    <span
                      key={`${member.id}-${entry.key}`}
                      className="group relative min-w-0"
                      tabIndex={entry.hint ? 0 : undefined}
                      aria-describedby={entry.hint ? hintId : undefined}
                    >
                      <MiniPill
                        className={rosterMetaPillClassName}
                      >
                        {entry.label ? (
                          <span className={rosterMetaLabelClassName}>
                            {entry.label}
                          </span>
                        ) : null}
                        <span className={rosterMetaValueClassName}>
                          {entry.value}
                        </span>
                      </MiniPill>
                      {entry.hint ? (
                        <span
                          id={hintId}
                          role="tooltip"
                          className={rosterMetaHintClassName}
                        >
                          {entry.hint}
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex shrink-0 justify-center">
              <div className="relative">
                <ViewTransition name={getTeamEditorTransitionName("sprite", member.id)}>
                  <PokemonSprite
                    species={resolved?.species ?? member.species ?? `Slot ${index + 1}`}
                    spriteUrl={resolved?.spriteUrl}
                    animatedSpriteUrl={resolved?.animatedSpriteUrl}
                    allowCoarsePointerAnimation
                    isEvolving={isEvolving}
                    size="large"
                    chrome="plain"
                  />
                </ViewTransition>
                {currentItem ? (
                  <div className="absolute bottom-1 right-1">
                    <ItemSprite name={currentItem} sprite={resolved?.itemDetails?.sprite} chrome="plain" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex justify-center">
              <div className="relative">
                <ViewTransition name={getTeamEditorTransitionName("sprite", member.id)}>
                  <PokemonSprite
                    species={resolved?.species ?? member.species ?? `Slot ${index + 1}`}
                    spriteUrl={resolved?.spriteUrl}
                    animatedSpriteUrl={resolved?.animatedSpriteUrl}
                    allowCoarsePointerAnimation
                    isEvolving={isEvolving}
                    size="default"
                    chrome="plain"
                  />
                </ViewTransition>
                {currentItem ? (
                  <div className="absolute bottom-0 right-0">
                    <ItemSprite name={currentItem} sprite={resolved?.itemDetails?.sprite} chrome="plain" />
                  </div>
                ) : null}
              </div>
            </div>
            <ViewTransition name={getTeamEditorTransitionName("types", member.id)}>
              <div className="mt-2 grid grid-cols-2 gap-1 sm:gap-1.5">
                {resolved?.resolvedTypes.length ? (
                  resolved.resolvedTypes.map((type) => (
                    <div key={`${member.id}-${type}`} className="min-w-0">
                      <TypeBadge type={type} className="w-full" />
                    </div>
                  ))
                ) : (
                  <div className="min-w-0">
                    <MiniPill className={rosterEmptyTypePillClassName}>
                      tipo pendiente
                    </MiniPill>
                  </div>
                )}
              </div>
            </ViewTransition>
          </div>
        )}

      </div>
      </article>
    </ViewTransition>
  );
}
