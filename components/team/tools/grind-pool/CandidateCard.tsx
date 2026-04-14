import { Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { statOrder } from "./types";

import type { PerfectSpecimen, StatSpread } from "./types";
import type { RankedCandidate } from "./useGrindPool";

export function CandidateCard({
  candidate,
  rank,
  isExpanded,
  safePerfectSpecimen,
  onToggleDetails,
}: {
  candidate: RankedCandidate;
  rank: number;
  isExpanded: boolean;
  safePerfectSpecimen: PerfectSpecimen;
  onToggleDetails: () => void;
}) {
  return (
    <article className="surface-card-muted border border-line-soft">
      <button
        type="button"
        onClick={onToggleDetails}
        className="flex flex-col w-full items-start justify-between gap-3 p-3 text-left"
      >
        <div className="min-w-0 w-full flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="display-face micro-copy text-muted">
              #{rank + 1} {rank === 0 ? "mejor ahora" : "candidato"}
            </div>
            <p className="mt-1 display-face text-base text-text">
              Ejemplar {rank + 1}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {rank === 0 ? (
              <Trophy className="h-4 w-4 text-warning-strong" />
            ) : null}
            <span className="text-xs text-text-faint">
              {isExpanded ? "Ocultar detalle" : "Ver detalle"}
            </span>
          </div>
        </div>
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted">
          <span className="chip-surface px-3 py-1">
            {candidate.percent}% cercanía
          </span>
          <span className="chip-surface px-3 py-1">
            {candidate.exactMatches}/6 exactos
          </span>
          <span className="chip-surface px-3 py-1">
            Stat clave:{" "}
            {candidate.favoredStatMatch ? "match" : "fuera"}
          </span>
          <span className="chip-surface px-3 py-1">
            Habilidad: {candidate.abilityMatch ? "match" : "fuera"}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            key={`${candidate.id}-details`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-line-soft px-3 pb-3 pt-3 text-center">
              <div className="flex gap-3">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    <span className="chip-surface px-3 py-1">
                      Lvl {candidate.level}
                    </span>
                    <span className="chip-surface px-3 py-1">
                      Género: {candidate.gender}
                    </span>
                    <span className="chip-surface px-3 py-1">
                      Nature: {candidate.nature || "Sin definir"}
                    </span>
                    <span className="chip-surface px-3 py-1">
                      Favorece:{" "}
                      {candidate.candidateNatureEffect.up?.toUpperCase() ??
                        "ninguno"}
                    </span>
                    <span className="chip-surface px-3 py-1">
                      Ability: {candidate.ability || "Sin definir"}
                    </span>
                  </div>
                  {candidate.notes ? (
                    <p className="mt-2 text-sm text-muted">
                      {candidate.notes}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap w-full justify-center">
                <CandidateStatGrid
                  candidateId={candidate.id}
                  title="IV estimado"
                  stats={candidate.estimatedIvs}
                  target={safePerfectSpecimen.stats}
                />
                <CandidateStatGrid
                  candidateId={candidate.id}
                  title="Stats observados"
                  stats={candidate.stats}
                  keyPrefix="observed"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                <span className="chip-surface px-3 py-1">
                  Priority score: {candidate.priorityScore}
                </span>
                <span className="chip-surface px-3 py-1">
                  Score total: {candidate.totalScore}
                </span>
                <span className="chip-surface px-3 py-1">
                  Distancia IV: {candidate.statDistance}
                </span>
                <span className="chip-surface px-3 py-1">
                  Género:{" "}
                  {candidate.genderMatch ? "match" : "fuera"}
                </span>
                {candidate.inferenceIssues.length > 0 ? (
                  <span className="chip-surface px-3 py-1">
                    IV incierto:{" "}
                    {candidate.inferenceIssues
                      .map((stat) => stat.label)
                      .join(", ")}
                  </span>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

function CandidateStatGrid({
  candidateId,
  title,
  stats,
  target,
  keyPrefix,
}: {
  candidateId: string;
  title: string;
  stats: StatSpread;
  target?: StatSpread;
  keyPrefix?: string;
}) {
  const prefix = keyPrefix ?? "estimated";
  return (
    <div className="mt-3 max-w-md w-full">
      <p className="display-face micro-copy text-muted">{title}</p>
      <div className="mt-2 overflow-x-auto">
        <div className="grid grid-cols-6 gap-2">
          {statOrder.map((stat) => {
            const current = stats[stat.key];
            const delta = target ? current - target[stat.key] : null;

            return (
              <div
                key={`${candidateId}-${prefix}-${stat.key}`}
                className="bg-surface-3 px-2 py-2 text-center"
              >
                <div className="display-face micro-copy text-muted">
                  {stat.label}
                </div>
                <div className="mt-1 text-sm text-text">{current}</div>
                <div className="mt-1 text-xs text-text-faint">
                  {delta === null
                    ? "\u00A0"
                    : delta === 0
                      ? "perfecto"
                      : delta > 0
                        ? `+${delta}`
                        : delta}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
