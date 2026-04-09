"use client";

import { CoverageBadge } from "@/components/team/UI";
import { buildDefensiveSummary } from "@/lib/domain/battle";
import { TYPE_ORDER, getMultiplierBucket, getTypeEffectiveness } from "@/lib/domain/typeChart";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export function DefenseSection({
  resolved,
  types,
}: {
  resolved?: ResolvedTeamMember;
  types?: string[];
}) {
  const resolvedTypes = resolved?.resolvedTypes ?? types ?? [];
  const defensiveSummary = resolvedTypes.length
    ? buildDefensiveSummary([
        {
          resolvedTypes,
        } as ResolvedTeamMember,
      ])
    : [];
  const weaknesses = defensiveSummary.filter(
    (entry) => entry.buckets.x4 > 0 || entry.buckets.x2 > 0,
  );
  const resistances = defensiveSummary.filter(
    (entry) =>
      entry.buckets["x0.5"] > 0 ||
      entry.buckets["x0.25"] > 0,
  );
  const immunities = defensiveSummary.filter((entry) => entry.buckets.x0 > 0);
  const stabCoverage = resolvedTypes.map((attackType) => {
    const effective = TYPE_ORDER.filter((defenseType) => getTypeEffectiveness(attackType, [defenseType]) > 1);
    const resisted = TYPE_ORDER.filter((defenseType) => {
      const multiplier = getTypeEffectiveness(attackType, [defenseType]);
      return multiplier > 0 && multiplier < 1;
    });
    const noDamage = TYPE_ORDER.filter((defenseType) => getTypeEffectiveness(attackType, [defenseType]) === 0);

    return {
      attackType,
      effective,
      resisted,
      noDamage,
    };
  });

  if (!resolvedTypes.length) {
    return (
      <div className="rounded-[0_1rem_1rem_1rem] p-0">
        <div className="radius-control-lg px-1 py-1 text-sm text-muted">
          Selecciona una especie válida para revisar debilidades y resistencias.
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[0_1rem_1rem_1rem] p-0">
      <div className="space-y-3 radius-control-lg px-1 py-1">
        <article className="rounded-xl px-1 py-1">
          <p className="display-face text-xs text-danger">Debilidades</p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {weaknesses.length ? (
              weaknesses.map((entry) => (
                <CoverageBadge
                  key={`editor-weak-${entry.attackType}`}
                  type={entry.attackType}
                  label={entry.attackType}
                  bucket={entry.buckets.x4 > 0 ? "x4" : "x2"}
                />
              ))
            ) : (
              <span className="text-xs text-muted">Sin debilidades.</span>
            )}
          </div>
        </article>

        <article className="rounded-xl px-1 py-1">
          <p className="display-face text-xs text-info">Resistencias</p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {resistances.length ? (
              resistances.map((entry) => (
                <CoverageBadge
                  key={`editor-resist-${entry.attackType}`}
                  type={entry.attackType}
                  label={entry.attackType}
                  bucket={
                    entry.buckets.x0 > 0
                      ? "x0"
                      : entry.buckets["x0.25"] > 0
                        ? "x0.25"
                        : "x0.5"
                  }
                />
              ))
            ) : (
              <span className="text-xs text-muted">Sin resistencias.</span>
            )}
          </div>
        </article>

        <article className="rounded-xl px-1 py-1">
          <p className="display-face text-xs text-info">Inmunidades</p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {immunities.length ? (
              immunities.map((entry) => (
                <CoverageBadge
                  key={`editor-immune-${entry.attackType}`}
                  type={entry.attackType}
                  label={entry.attackType}
                  bucket="x0"
                />
              ))
            ) : (
              <span className="text-xs text-muted">Sin inmunidades.</span>
            )}
          </div>
        </article>

        <article className="rounded-xl px-1 py-1">
          <p className="display-face text-xs text-accent">STAB</p>
          <div className="mt-2 space-y-3">
            {stabCoverage.map((stab) => (
              <div key={`editor-stab-${stab.attackType}`} className="radius-panel-sm border border-line bg-surface-3 px-3 py-3">
                <p className="display-face text-xs text-text">{stab.attackType}</p>

                <div className="mt-2">
                  <p className="display-face caption-dense text-primary-soft">Efectivo</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 sm:gap-2">
                    {stab.effective.length ? (
                      stab.effective.map((defenseType) => (
                        <CoverageBadge
                          key={`editor-stab-effective-${stab.attackType}-${defenseType}`}
                          type={defenseType}
                          label={defenseType}
                          bucket={getMultiplierBucket(getTypeEffectiveness(stab.attackType, [defenseType]))}
                        />
                      ))
                    ) : (
                      <span className="text-xs text-muted">Sin targets superefectivos.</span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="display-face caption-dense text-warning-strong">Poco efectivo</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 sm:gap-2">
                    {stab.resisted.length ? (
                      stab.resisted.map((defenseType) => (
                        <CoverageBadge
                          key={`editor-stab-resisted-${stab.attackType}-${defenseType}`}
                          type={defenseType}
                          label={defenseType}
                          bucket={getMultiplierBucket(getTypeEffectiveness(stab.attackType, [defenseType]))}
                        />
                      ))
                    ) : (
                      <span className="text-xs text-muted">Sin targets resistidos.</span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="display-face caption-dense text-info-soft">Daño nulo</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 sm:gap-2">
                    {stab.noDamage.length ? (
                      stab.noDamage.map((defenseType) => (
                        <CoverageBadge
                          key={`editor-stab-no-damage-${stab.attackType}-${defenseType}`}
                          type={defenseType}
                          label={defenseType}
                          bucket="x0"
                        />
                      ))
                    ) : (
                      <span className="text-xs text-muted">Sin targets inmunes.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
