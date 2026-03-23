"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

import { TypeBadge } from "@/components/BuilderShared";
import { RoleAxesCard } from "@/components/team/RoleAxes";
import { MovePowerBadge } from "@/components/team/UI";
import { buildMemberLens } from "@/lib/domain/memberLens";
import { ROLE_LABELS } from "@/lib/domain/roleLabels";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { RunEncounterDefinition } from "@/lib/runEncounters";

type Recommendation = ReturnType<typeof import("@/lib/builder").getRecommendation>;
type CheckpointRisk = ReturnType<typeof import("@/lib/domain/checkpointScoring").buildCheckpointRiskSnapshot>;
type SwapOpportunity = ReturnType<typeof import("@/lib/domain/swapOpportunities").buildSwapOpportunities>[number];
type SpeedTiers = ReturnType<typeof import("@/lib/domain/speedTiers").buildSpeedTierSnapshot>;
type MoveRecommendation = ReturnType<typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations>[number];

export function CheckpointIntelligencePanel({
  activeMember,
  activeRoleRecommendation,
  teamSize,
  copilotSupportsRecommendations,
  supportsContextualSwaps,
  milestoneId,
  nextEncounter,
  starterMember,
  checkpointRisk,
  swapOpportunities,
  speedTiers,
  recommendation,
  moveRecommendations,
}: {
  activeMember?: ResolvedTeamMember;
  activeRoleRecommendation?: import("@/lib/domain/roleAnalysis").MemberRoleRecommendation;
  teamSize: number;
  copilotSupportsRecommendations: boolean;
  supportsContextualSwaps: boolean;
  milestoneId: string;
  nextEncounter: RunEncounterDefinition | null;
  starterMember?: ResolvedTeamMember;
  checkpointRisk: CheckpointRisk;
  swapOpportunities: SwapOpportunity[];
  speedTiers: SpeedTiers;
  recommendation: Recommendation;
  moveRecommendations: MoveRecommendation[];
}) {
  const riskState = describeRiskState(checkpointRisk.totalRisk);
  const speedState = describeSpeedState(speedTiers.outspeedCount, speedTiers.exposedCount);
  const nextAction = describeNextAction({
    copilotSupportsRecommendations,
    swapOpportunities,
    moveRecommendations,
    activeMemberName: activeMember?.species,
  });
  const starterLens = buildMemberLens(starterMember);

  return (
    <div className="rounded-[1rem] px-2 py-3 sm:px-3 sm:py-4 lg:px-4 lg:py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-face text-sm text-accent">Checkpoint</p>
          <p className="mt-1.5 text-sm text-muted">
            Todo este bloque se lee contra el siguiente encuentro real del run.
          </p>
        </div>
        {activeMember?.species ? (
          <TypeBadge type={activeMember.resolvedTypes[0] ?? "Normal"} />
        ) : null}
      </div>
      <div className="mt-3 px-1 py-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="display-face text-sm text-accent">
              {nextEncounter ? nextEncounter.label : "Sin siguiente encounter"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {nextEncounter
                ? `Level cap ${nextEncounter.levelCap} · contexto ${formatCheckpointLabel(milestoneId)}`
                : `Contexto ${formatCheckpointLabel(milestoneId)}`}
            </p>
          </div>
          {nextEncounter ? (
            <span className="rounded-[6px] border border-line px-3 py-1 text-xs text-muted">
              {nextEncounter.category}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <SummaryCard
          label="Riesgo"
          value={riskState}
          detail={checkpointRisk.notes[0] ?? "Sin lectura clara todavia."}
        />
        <SummaryCard
          label="Velocidad"
          value={speedState}
          detail={speedTiers.notes[0] ?? "Sin benchmark claro todavia."}
        />
        <SummaryCard
          label="Siguiente ajuste"
          value={nextAction.title}
          detail={nextAction.detail}
        />
      </div>
      <SectionBlock title="Starter Lens">
        <p className="text-sm text-muted">{starterLens.summary}</p>
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
          <LensCard label="Rol actual" value={starterLens.role} />
          <LensCard label="Plan del equipo" value={starterLens.teamPlan} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <LensMetric label="Pressure" value={starterLens.axes.pressure} />
          <LensMetric label="Utility" value={starterLens.axes.utility} />
          <LensMetric label="Setup" value={starterLens.axes.setup} />
          <LensMetric label="Pivot" value={starterLens.axes.pivot} />
          <LensMetric label="Sustain" value={starterLens.axes.sustain} />
          <LensMetric label="Speed" value={starterLens.axes.speedControl} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {starterLens.supportNeeds.map((need) => (
            <LensCard key={need} label="Necesita" value={need} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Lectura del equipo"
        aside={
          <div className="rounded-[0.7rem] border border-accent-line px-3 py-2 text-right">
            <p className="display-face text-lg text-accent-soft">{checkpointRisk.totalRisk.toFixed(1)} / 10</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{riskState}</p>
          </div>
        }
      >
        <p className="text-xs text-muted">
          Menor es mejor. Los subscores van al revés: más alto es mejor.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <RiskPill label="Ataque" value={checkpointRisk.offense.score} summary={checkpointRisk.offense.summary} />
          <RiskPill label="Aguante" value={checkpointRisk.defense.score} summary={checkpointRisk.defense.summary} />
          <RiskPill label="Tempo" value={checkpointRisk.speed.score} summary={checkpointRisk.speed.summary} />
          <RiskPill label="Roles" value={checkpointRisk.roles.score} summary={checkpointRisk.roles.summary} />
          <RiskPill label="Consistencia" value={checkpointRisk.consistency.score} summary={checkpointRisk.consistency.summary} />
        </div>
        <div className="mt-3 space-y-1.5">
          {checkpointRisk.notes.slice(0, 3).map((note) => (
            <p key={note} className="text-sm text-muted">
              {note}
            </p>
          ))}
        </div>
      </SectionBlock>

      <div className="mt-3 grid gap-2.5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SectionBlock
          title="Tempo"
          aside={
            <div className="rounded-[0.7rem] border border-info-line px-3 py-2 text-right">
              <p className="display-face text-base text-info-soft">{speedTiers.benchmarkSpeed} Spe</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{speedState}</p>
            </div>
          }
        >
          <p className="text-xs text-muted">
            Si no igualas este benchmark, el rival mueve primero con mucha frecuencia.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <CompactMetric label="Mas rapidos" value={`${speedTiers.outspeedCount}`} detail="Superan el benchmark" />
            <CompactMetric label="Con control" value={`${speedTiers.speedControlCount}`} detail="Prioridad o speed control" />
            <CompactMetric label="Se quedan cortos" value={`${speedTiers.exposedCount}`} detail="Llegan por detras" />
          </div>
          <div className="mt-3 space-y-1.5">
            {speedTiers.notes.slice(0, 2).map((note) => (
              <p key={note} className="text-sm text-muted">
                {note}
              </p>
            ))}
          </div>
          {speedTiers.memberMatchups.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {speedTiers.memberMatchups.map((entry) => (
                <span
                  key={`${entry.species}-${entry.speed}`}
                  className={clsx(
                    "rounded-[6px] border px-3 py-1 text-xs",
                    entry.status === "outspeeds"
                      ? "border-accent-line-strong bg-accent-fill-strong text-accent-soft"
                      : entry.status === "ties"
                        ? "border-info-line bg-info-fill text-info-soft"
                        : "border-danger-line bg-danger-fill text-danger-soft",
                  )}
                >
                  {entry.species} {entry.speed}
                </span>
              ))}
            </div>
          ) : null}
        </SectionBlock>

        <SectionBlock title="Notas">
          <div className="space-y-2">
            {(copilotSupportsRecommendations ? recommendation.notes.slice(0, 2) : recommendation.notes.slice(0, 1)).map((note) => (
              <p
                key={note}
                className="rounded-[0.75rem] border border-line px-4 py-3 text-sm text-muted"
              >
                {note}
              </p>
            ))}
          </div>
        </SectionBlock>
      </div>

      <SectionBlock title="Swaps del tramo">
        <p className="text-xs text-muted">
          {teamSize < 5
            ? "Con menos de cinco slots el foco sigue siendo expandir el roster. Los swaps empiezan a importar cuando el equipo base ya esta casi cerrado."
            : "Aqui ya no se trata de sumar miembros, sino de optimizar slots no locked con pivots del tramo actual para el siguiente combate."}
        </p>
        <div className="mt-3 space-y-2">
          {teamSize >= 5 && supportsContextualSwaps && swapOpportunities.length ? (
            swapOpportunities.slice(0, 4).map((opportunity) => (
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
            ))
          ) : (
            <p className="text-sm text-muted">
              {teamSize < 5
                ? "Completa primero el roster base antes de priorizar reemplazos."
                : supportsContextualSwaps
                ? "Completa el roster para detectar swaps claros en este checkpoint."
                : "Todavia faltan fuentes suficientes para proyectar pivots reales en este punto del run."}
            </p>
          )}
        </div>
      </SectionBlock>

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

      <SectionBlock title="Mejoras del slot activo">
        <p className="text-xs text-muted">
          Solo se sugieren moves del slot activo, cercanos al nivel actual o por máquina.
        </p>
        {activeMember?.species && activeRoleRecommendation ? (
          <div className="mt-3">
            <RoleAxesCard role={activeRoleRecommendation} compact />
          </div>
        ) : null}
        <div className="mt-3 space-y-2">
          {activeMember?.species && moveRecommendations.length ? (
            moveRecommendations.map((entry) => (
              <div
                key={`${entry.source}-${entry.move}`}
                className="rounded-[0.65rem] px-2 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="display-face text-[10px] text-accent">
                    {entry.source}
                  </span>
                  <span className="pixel-face text-[12px]">{entry.move}</span>
                  {entry.type ? <TypeBadge type={entry.type} /> : null}
                  <MovePowerBadge
                    damageClass={entry.damageClass}
                    power={entry.power}
                    adjustedPower={entry.adjustedPower}
                  />
                </div>
                {entry.reasons.length ? (
                  <p className="mt-2 text-xs text-muted">{entry.reasons.join(" · ")}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">
              {activeMember?.species
                ? "No hay una recomendación clara todavia para el slot activo."
                : "Selecciona un miembro del roster para ver sugerencias de moves sobre ese slot."}
            </p>
          )}
        </div>
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

function RiskPill({
  label,
  value,
  summary,
}: {
  label: string;
  value: number;
  summary: string;
}) {
  return (
    <div className="rounded-[0.65rem] px-1.5 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="display-face text-[11px] text-accent">{label}</span>
        <span className="pixel-face text-xs">{describeSubscore(value)}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{summary}</p>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[0.65rem] px-1.5 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="display-face text-[11px] text-accent">{label}</span>
        <span className="pixel-face text-xs">{value}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[0.75rem] px-1.5 py-2.5">
      <p className="display-face text-[11px] text-accent">{label}</p>
      <p className="mt-1 pixel-face text-sm">{value}</p>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </div>
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

function formatCheckpointLabel(milestoneId: string) {
  return (
    {
      opening: "antes de Cheren",
      floccesy: "antes de Roxie",
      virbank: "antes de Burgh",
      castelia: "antes de Elesa",
      driftveil: "tramo Driftveil y Clay",
      mistralton: "tramo Mistralton y Skyla",
      undella: "tramo Undella y Drayden",
      humilau: "tramo Plasma final",
      league: "liga y N's Castle",
      postgame: "postgame",
    }[milestoneId] ?? milestoneId
  );
}

function LensCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.65rem] px-1.5 py-2">
      <p className="display-face text-[11px] text-accent">{label}</p>
      <p className="mt-1 text-xs text-muted">{value}</p>
    </div>
  );
}

function LensMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[0.65rem] px-1.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="display-face text-[11px] text-accent">{label}</p>
        <p className="display-face text-xs text-text">{value}</p>
      </div>
      <div className="mt-2 h-2 rounded-[6px] bg-surface-5">
        <div
          className="h-full rounded-[6px] bg-accent"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function describeRiskState(totalRisk: number) {
  if (totalRisk >= 7.5) {
    return "fragil";
  }
  if (totalRisk >= 5) {
    return "inestable";
  }
  return "estable";
}

function describeSpeedState(outspeeds: number, exposed: number) {
  if (outspeeds >= 2 && exposed <= 2) {
    return "bien";
  }
  if (outspeeds >= 1) {
    return "justo";
  }
  return "corto";
}

function describeSubscore(value: number) {
  if (value >= 75) {
    return "bien";
  }
  if (value >= 50) {
    return "medio";
  }
  return "flojo";
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

function describeNextAction({
  copilotSupportsRecommendations,
  swapOpportunities,
  moveRecommendations,
  activeMemberName,
}: {
  copilotSupportsRecommendations: boolean;
  swapOpportunities: SwapOpportunity[];
  moveRecommendations: {
    move: string;
    source: string;
  }[];
  activeMemberName?: string;
}) {
  const replaceNow = swapOpportunities.find((opportunity) => opportunity.riskDelta >= 1.5);
  if (copilotSupportsRecommendations && replaceNow) {
    return {
      title: `cambia ${replaceNow.replacedSpecies}`,
      detail: `${replaceNow.candidateSpecies} mejora el siguiente tramo desde ${replaceNow.area}.`,
    };
  }

  const watch = swapOpportunities.find((opportunity) => opportunity.riskDelta >= 0.7);
  if (copilotSupportsRecommendations && watch) {
    return {
      title: `vigila ${watch.replacedSpecies}`,
      detail: `${watch.candidateSpecies} aparece como pivot util para este checkpoint.`,
    };
  }

  if (activeMemberName && moveRecommendations[0]) {
    return {
      title: `mejora ${activeMemberName}`,
      detail: `${moveRecommendations[0].move} aparece como el ajuste mas claro del slot activo.`,
    };
  }

  return {
    title: "sin urgencia",
    detail: "No aparece un cambio inmediato mas claro que los demas.",
  };
}
