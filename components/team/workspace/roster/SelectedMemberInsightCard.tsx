"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { TypeBadge } from "@/components/BuilderShared";
import { RoleAxesCard } from "@/components/team/RoleAxes";
import { Button } from "@/components/ui/Button";
import { buildMemberLens } from "@/lib/domain/memberLens";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

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
  const [dexDetails, setDexDetails] = useState<DexPokemonDetail | null>(null);

  useEffect(() => {
    const species = member.species.trim();
    if (!species) {
      setDexDetails(null);
      return;
    }

    const controller = new AbortController();
    async function loadDexDetails() {
      try {
        const response = await fetch(`/api/dex?pokemon=${encodeURIComponent(species)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setDexDetails(null);
          return;
        }
        const payload = (await response.json()) as DexPokemonDetail;
        setDexDetails({
          category: payload.category ?? null,
          height: payload.height ?? null,
          weight: payload.weight ?? null,
          flavorText: payload.flavorText ?? null,
        });
      } catch {
        if (!controller.signal.aborted) {
          setDexDetails(null);
        }
      }
    }

    setDexDetails(null);
    void loadDexDetails();

    return () => controller.abort();
  }, [member.species]);

  return (
    <div className="max-h-[min(32rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain rounded-[1rem] border border-line-strong bg-[linear-gradient(180deg,rgba(12,32,40,0.96),rgba(8,21,25,0.96))] p-4 shadow-[0_22px_50px_rgba(0,0,0,0.34)] backdrop-blur-md">
      <div className="sticky top-0 z-10 -mx-4 flex items-start justify-between gap-3 border-b border-line/60 bg-[linear-gradient(180deg,rgba(12,32,40,0.98),rgba(8,21,25,0.94))] px-4 pb-3 pt-1 backdrop-blur-md">
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
          className="h-8 w-8 rounded-[0.8rem] border border-line bg-surface-4 text-muted hover:bg-surface-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {roleRecommendation ? (
        <div className="mt-4">
          <RoleAxesCard role={roleRecommendation} compact />
        </div>
      ) : null}

      {dexDetails?.category || dexDetails?.height || dexDetails?.weight || dexDetails?.flavorText ? (
        <div className="mt-4">
          <p className="display-face text-xs text-accent">Dex Notes</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {dexDetails?.category ? <StarterLensCard label="Categoria" value={dexDetails.category} /> : null}
            {dexDetails?.height ? <StarterLensCard label="Altura" value={`${dexDetails.height.toFixed(1)} m`} /> : null}
            {dexDetails?.weight ? <StarterLensCard label="Peso" value={`${dexDetails.weight.toFixed(1)} kg`} /> : null}
          </div>
          {dexDetails?.flavorText ? (
            <p className="mt-3 rounded-[0.7rem] border border-line bg-surface-3 px-3 py-3 text-sm text-muted">
              {dexDetails.flavorText}
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
                className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted"
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
                className="rounded-[0.7rem] border border-line bg-surface-3/60 px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="display-face text-[10px] text-accent">{entry.source}</span>
                  <span className="pixel-face text-[12px] text-text">{entry.move}</span>
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
    <div className="rounded-[0.7rem] border border-line bg-surface-3 px-3 py-2">
      <p className="display-face text-[10px] text-accent">{label}</p>
      <p className="mt-1 text-sm text-muted">{value}</p>
    </div>
  );
}
