"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useId } from "react";
import useSWR from "swr";

import { TypeBadge } from "@/components/BuilderShared";
import { RoleAxesCard } from "@/components/team/shared/RoleAxes";
import { Button } from "@/components/ui/Button";
import { buildMemberLens } from "@/lib/domain/memberLens";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

const selectedInsightSurfaceClassName =
  "app-floating-panel max-h-[min(32rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain rounded-2xl p-4";
const selectedInsightStickyHeaderSurfaceClassName = "bg-(--floating-panel-bg)";
const selectedInsightStickyHeaderClassName =
  "sticky top-0 z-10 -mx-4 flex items-start justify-between gap-3 border-b border-line/60 px-4 pb-3 pt-1 backdrop-blur-md";
const selectedInsightCloseButtonClassName =
  "app-icon-button inline-flex items-center justify-center h-8 w-8 text-muted";
const selectedInsightCardClassName = "app-soft-panel rounded-xl px-3 py-2";
const selectedInsightCardMutedClassName = "app-soft-panel rounded-xl px-3 py-3 text-sm text-muted";
const selectedInsightCardSoftClassName = "app-soft-panel rounded-xl px-3 py-3";
const selectedInsightEyebrowClassName = "display-face micro-label text-accent";
const selectedInsightTagClassName = "app-soft-chip rounded-md px-3 py-1 text-xs text-muted";

type MoveRecommendation = ReturnType<
  typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations
>[number];

type DexPokemonDetail = {
  category?: string | null;
  height?: number | null;
  weight?: number | null;
  flavorText?: string | null;
};

export function SelectedMemberInsightCard({
  member,
  roleRecommendation,
  moveRecommendations,
  starterLens,
  onClose,
}: {
  member: ResolvedTeamMember;
  roleRecommendation?: MemberRoleRecommendation;
  moveRecommendations: MoveRecommendation[];
  starterLens: ReturnType<typeof buildMemberLens> | null;
  onClose: () => void;
}) {
  const requestScope = useId();
  const species = member.species.trim();
  const dexUrl = species ? `/api/dex?pokemon=${encodeURIComponent(species)}` : null;
  const { data: dexDetails } = useSWR<DexPokemonDetail | null>(
    dexUrl ? [dexUrl, requestScope] : null,
    async ([url]) => {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as DexPokemonDetail;
      return {
        category: payload.category ?? null,
        height: payload.height ?? null,
        weight: payload.weight ?? null,
        flavorText: payload.flavorText ?? null,
      };
    },
    {
      dedupingInterval: 0,
      shouldRetryOnError: true,
      errorRetryCount: 1,
      errorRetryInterval: 0,
    },
  );
  const normalizedDexDetails = dexDetails ?? null;

  return (
    <div className={selectedInsightSurfaceClassName}>
      <div className={clsx(selectedInsightStickyHeaderClassName, selectedInsightStickyHeaderSurfaceClassName)}>
        <div>
          <p className="display-face text-sm text-accent">Info del slot</p>
          <p className="mt-1 text-sm text-muted">
            Lectura puntual de {member.species} y mejoras recomendadas para este miembro.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Cerrar info del slot"
          className={selectedInsightCloseButtonClassName}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {roleRecommendation ? (
        <div className="mt-4">
          <RoleAxesCard role={roleRecommendation} compact />
        </div>
      ) : null}

      {normalizedDexDetails?.category || normalizedDexDetails?.height || normalizedDexDetails?.weight || normalizedDexDetails?.flavorText ? (
        <div className="mt-4">
          <p className="display-face text-xs text-accent">Dex Notes</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {normalizedDexDetails?.category ? <StarterLensCard label="Categoria" value={normalizedDexDetails.category} /> : null}
            {normalizedDexDetails?.height ? <StarterLensCard label="Altura" value={`${normalizedDexDetails.height.toFixed(1)} m`} /> : null}
            {normalizedDexDetails?.weight ? <StarterLensCard label="Peso" value={`${normalizedDexDetails.weight.toFixed(1)} kg`} /> : null}
          </div>
          {normalizedDexDetails?.flavorText ? (
            <p className={clsx("mt-3", selectedInsightCardMutedClassName)}>
              {normalizedDexDetails.flavorText}
            </p>
          ) : null}
        </div>
      ) : null}

      {starterLens ? (
        <div className="mt-4">
          <p className="display-face text-xs text-accent">Starter Lens</p>
          <p className="mt-1 text-sm text-muted">{starterLens.summary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {starterLens.tags.map((tag) => (
              <span
                key={tag}
                className={selectedInsightTagClassName}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <StarterLensCard label="Rol actual" value={starterLens.role} />
            <StarterLensCard label="Plan del equipo" value={starterLens.teamPlan} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {starterLens.supportNeeds.map((need) => (
              <StarterLensCard key={need} label="Necesita" value={need} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="display-face text-xs text-accent">Mejoras del slot</p>
        <p className="mt-1 text-xs text-muted">
          Moves sugeridos cerca del nivel actual o accesibles por máquina.
        </p>
        <div className="mt-3 space-y-2">
          {moveRecommendations.length ? (
            moveRecommendations.slice(0, 4).map((entry) => (
              <div
                key={`${entry.source}-${entry.move}`}
                className={selectedInsightCardSoftClassName}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={selectedInsightEyebrowClassName}>{entry.source}</span>
                  <span className="pixel-face text-xs text-text">{entry.move}</span>
                  {entry.type ? <TypeBadge key={`${entry.move}-${entry.type}`} type={entry.type} /> : null}
                </div>
                {entry.reasons.length ? (
                  <p className="mt-2 text-xs text-muted">{entry.reasons.join(" · ")}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No hay una recomendación clara todavia para este slot.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StarterLensCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={selectedInsightCardClassName}>
      <p className={selectedInsightEyebrowClassName}>{label}</p>
      <p className="mt-1 text-sm text-muted">{value}</p>
    </div>
  );
}
