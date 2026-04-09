"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

import { TypeBadge } from "@/components/BuilderShared";
import { ROLE_LABELS } from "@/lib/domain/roleLabels";
type CheckpointRisk = ReturnType<typeof import("@/lib/domain/checkpointScoring").buildCheckpointRiskSnapshot>;
type SwapOpportunity = ReturnType<typeof import("@/lib/domain/swapOpportunities").buildSwapOpportunities>[number];

const intelligenceSectionTitleClassName = "display-face text-sm text-accent";
const intelligenceSectionEyebrowClassName = "display-face micro-copy text-accent";
const intelligenceHeaderRowClassName = "flex flex-wrap items-center justify-between gap-3";
const intelligenceTokenPillClassName = "token-card px-3 py-1 micro-copy text-muted";
const intelligenceCompactGridClassName = "mt-3 grid gap-2 sm:grid-cols-2";
const intelligenceSectionShellClassName = "mt-3 px-1 py-1";
const intelligenceSectionTopRowClassName = "flex items-start justify-between gap-3";
const intelligenceCardClassName = "surface-card px-3 py-3";
const intelligenceAlertTagClassName = "micro-label-wide rounded-md border px-3 py-1 uppercase";
const intelligenceRoleTagClassName = "micro-label token-card px-2 py-1 uppercase";

export function IntelligencePanel({
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
    <div className="min-w-0 overflow-x-hidden rounded-2xl px-2 py-3 sm:px-3 sm:py-4 lg:px-4 lg:py-5">
      {teamSize >= 5 && supportsContextualSwaps && swapOpportunities.length ? (
        <SectionBlock title="Swaps del tramo">
          <div className="mt-2 space-y-2">
            {swapOpportunities.slice(0, 4).map((opportunity) => (
              <div
                key={`${opportunity.replacedSpecies}-${opportunity.candidateSpecies}`}
                className={intelligenceCardClassName}
              >
                <div className={intelligenceHeaderRowClassName}>
                  <div>
                    <p className={intelligenceSectionEyebrowClassName}>{opportunity.replacedSpecies}</p>
                    <p className="mt-1 text-xs text-muted">
                      {opportunity.candidateSpecies} entra mejor ahora desde {opportunity.area}.
                    </p>
                  </div>
                  <span
                    className={clsx(
                      intelligenceAlertTagClassName,
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
                  <span className={intelligenceTokenPillClassName}>
                    role {opportunity.candidateRole}
                  </span>
                  <span className={intelligenceTokenPillClassName}>
                    risk -{opportunity.riskDelta.toFixed(1)}
                  </span>
                  <span className={intelligenceTokenPillClassName}>
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
        <div className={intelligenceCompactGridClassName}>
          {checkpointRisk.roleSnapshot.members.map((member) => (
            <div
              key={`role-${member.species}`}
              className={intelligenceCardClassName}
            >
              <div className={intelligenceHeaderRowClassName}>
                <span className={intelligenceSectionEyebrowClassName}>{member.species}</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className={clsx(intelligenceRoleTagClassName, "text-muted")}>
                    natural {ROLE_LABELS[member.naturalRole]}
                  </span>
                  <span
                    className={clsx(
                      intelligenceRoleTagClassName,
                      "border-accent-line bg-accent-fill text-accent-soft",
                    )}
                  >
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
        <div className={intelligenceCompactGridClassName}>
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
    <section className={intelligenceSectionShellClassName}>
      <div className={intelligenceSectionTopRowClassName}>
        <p className={intelligenceSectionTitleClassName}>{title}</p>
        {aside ?? null}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function RoleBucket({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="surface-card px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="display-face micro-copy text-accent">{label}</span>
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
