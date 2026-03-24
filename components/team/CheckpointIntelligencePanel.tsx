"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

import { TypeBadge } from "@/components/BuilderShared";
import { ROLE_LABELS } from "@/lib/domain/roleLabels";
type CheckpointRisk = ReturnType<typeof import("@/lib/domain/checkpointScoring").buildCheckpointRiskSnapshot>;
type SwapOpportunity = ReturnType<typeof import("@/lib/domain/swapOpportunities").buildSwapOpportunities>[number];

export function CheckpointIntelligencePanel({
  teamSize,
  supportsContextualSwaps,
  checkpointRisk,
  swapOpportunities,
}: {
  teamSize: number;
  supportsContextualSwaps: boolean;
  checkpointRisk: CheckpointRisk;
  swapOpportunities: SwapOpportunity[];
}) {
  return (
    <div className="min-w-0 overflow-x-hidden rounded-[1rem] px-2 py-3 sm:px-3 sm:py-4 lg:px-4 lg:py-5">
      {teamSize >= 5 && supportsContextualSwaps && swapOpportunities.length ? (
        <SectionBlock title="Swaps del tramo">
          <div className="mt-2 space-y-2">
            {swapOpportunities.slice(0, 4).map((opportunity) => (
              <div
                key={`${opportunity.replacedSpecies}-${opportunity.candidateSpecies}`}
                className="rounded-[0.65rem] px-2 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="display-face text-xs text-accent">{opportunity.replacedSpecies}</p>
                    <p className="mt-1 text-xs text-muted">
                      {opportunity.candidateSpecies} entra mejor ahora desde {opportunity.area}.
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "rounded-[6px] border px-3 py-1 text-[10px] uppercase tracking-[0.14em]",
                      opportunity.riskDelta >= 1.5
                        ? "border-danger-line bg-danger-fill text-danger-soft"
                        : opportunity.riskDelta >= 0.7
                          ? "border-warning-line bg-warning-fill text-warning-soft"
                          : "border-accent-line bg-accent-fill-strong text-accent-soft",
                    )}
                  >
                    {formatOpportunityStatus(opportunity.riskDelta)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted">
                    role {opportunity.candidateRole}
                  </span>
                  <span className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted">
                    risk -{opportunity.riskDelta.toFixed(1)}
                  </span>
                  <span className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted">
                    score +{opportunity.scoreDelta.toFixed(1)}
                  </span>
                </div>
                {opportunity.attackUpsides.length || opportunity.defenseUpsides.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {opportunity.attackUpsides.map((type) => (
                      <TypeBadge key={`${opportunity.id}-atk-${type}`} type={type} emphasis="positive" />
                    ))}
                    {opportunity.defenseUpsides.map((type) => (
                      <TypeBadge key={`${opportunity.id}-def-${type}`} type={type} emphasis="positive" />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      <SectionBlock title="Roles detectados">
        <p className="text-xs text-muted">
          Cada slot recibe un rol sugerido según stats, naturaleza, habilidad y moves.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {checkpointRisk.roleSnapshot.members.map((member) => (
            <div
              key={`role-${member.species}`}
              className="rounded-[0.65rem] px-2 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="display-face text-xs text-accent">{member.species}</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-[6px] border border-line px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">
                    natural {ROLE_LABELS[member.naturalRole]}
                  </span>
                  <span className="rounded-[6px] border border-accent-line bg-accent-fill px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-accent-soft">
                    team {ROLE_LABELS[member.recommendedRole]}
                  </span>
                </div>
              </div>
              {member.compositionNote ? (
                <p className="mt-1 text-xs text-muted">{member.compositionNote}</p>
              ) : null}
              {member.alternativeRoles.length ? (
                <p className="mt-1 text-xs text-muted">
                  Tambien puede jugar como {member.alternativeRoles.map((role) => ROLE_LABELS[role]).join(", ")}.
                </p>
              ) : null}
              {member.reasons.length ? (
                <p className="mt-1 text-xs text-muted">{member.reasons.join(" · ")}</p>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <RoleBucket
            label="Cubiertos"
            values={checkpointRisk.roleSnapshot.coveredRoles.map((role) => ROLE_LABELS[role])}
          />
          <RoleBucket
            label="Faltan"
            values={checkpointRisk.roleSnapshot.missingRoles.map((role) => ROLE_LABELS[role])}
          />
        </div>
        {checkpointRisk.roleSnapshot.compositionNotes.length ? (
          <div className="mt-3 space-y-1.5">
            {checkpointRisk.roleSnapshot.compositionNotes.map((note) => (
              <p key={note} className="text-sm text-muted">
                {note}
              </p>
            ))}
          </div>
        ) : null}
      </SectionBlock>

    </div>
  );
}

function SectionBlock({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="mt-3 px-1 py-1">
      <div className="flex items-start justify-between gap-3">
        <p className="display-face text-sm text-accent">{title}</p>
        {aside ?? null}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function RoleBucket({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-[0.65rem] px-1.5 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="display-face text-[11px] text-accent">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {values.length ? values.join(", ") : "ninguno"}
      </p>
    </div>
  );
}

function formatOpportunityStatus(riskDelta: number) {
  if (riskDelta >= 1.5) {
    return "change";
  }
  if (riskDelta >= 0.7) {
    return "watch";
  }
  return "keep";
}
