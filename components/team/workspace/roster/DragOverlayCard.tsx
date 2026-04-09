"use client";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";

export function DragOverlayCard({
  member,
  resolved,
}: {
  member: { species: string; nickname: string; level: number };
  resolved?: {
    species?: string;
    resolvedTypes?: string[];
    spriteUrl?: string | null;
    animatedSpriteUrl?: string | null;
  };
}) {
  const types = resolved?.resolvedTypes ?? [];

  return (
    <div className="w-68 rounded-2xl border border-primary-line-emphasis bg-[var(--sheet-surface-bg)] p-3 shadow-[0_22px_65px_rgba(0,0,0,0.36)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="display-face truncate text-base text-text">
            {member.nickname || resolved?.species || member.species || "Pokemon"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {resolved?.species || member.species || "slot pendiente"} · Lv {member.level}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {types.length ? types.map((type) => <TypeBadge key={`drag-${type}`} type={type} />) : null}
          </div>
        </div>
        <PokemonSprite
          species={resolved?.species ?? member.species ?? "Pokemon"}
          spriteUrl={resolved?.spriteUrl ?? undefined}
          animatedSpriteUrl={resolved?.animatedSpriteUrl ?? undefined}
          size="default"
          chrome="plain"
        />
      </div>
    </div>
  );
}
