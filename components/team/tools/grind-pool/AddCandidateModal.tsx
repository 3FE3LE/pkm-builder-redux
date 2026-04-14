import { AnimatePresence, motion } from "motion/react";

import { FilterCombobox } from "@/components/BuilderShared";
import { SpreadInput } from "@/components/team/UI";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { natureOptions } from "@/lib/builderForm";
import { getNatureEffect } from "@/lib/domain/battle";
import { cn } from "@/lib/utils";

import { createCandidateDraft } from "./factories";
import { statOrder } from "./types";
import { GenderIconPicker } from "./GenderIconPicker";

import type { UseFormReturn } from "react-hook-form";
import type { StatKey, StatSpread } from "./types";

const grindPoolFieldStackClassName = "space-y-1.5";
const grindPoolCompactFieldGridClassName =
  "grid grid-cols-2 gap-3 lg:grid-cols-4";
const grindPoolSectionIntroClassName = "mt-1 text-sm text-muted";

type CandidateDraft = ReturnType<typeof createCandidateDraft>;

function StatInputs({
  values,
  onChange,
  errors,
}: {
  values: StatSpread;
  onChange: (key: StatKey, value: number) => void;
  errors?: Partial<Record<StatKey, string>>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {statOrder.map((stat) => (
        <SpreadInput
          key={stat.key}
          label={stat.label.toUpperCase()}
          value={values[stat.key]}
          max={999}
          orientation="horizontal"
          error={errors?.[stat.key]}
          onChange={(next) => onChange(stat.key, next)}
        />
      ))}
    </div>
  );
}

export function AddCandidateModal({
  isOpen,
  onClose,
  draftForm,
  safeDraft,
  draftValidation,
  draftStatIssues,
  hasDraftStatIssues,
  abilityOptions,
  speciesMeta,
  onChangeStat,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  draftForm: UseFormReturn<CandidateDraft>;
  safeDraft: CandidateDraft;
  draftValidation: { success: boolean };
  draftStatIssues: Partial<Record<StatKey, string>>;
  hasDraftStatIssues: boolean;
  abilityOptions: string[];
  speciesMeta: { name: string } | undefined;
  onChangeStat: (key: StatKey, value: number) => void;
  onSubmit: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-scrim z-120"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="dialog-surface max-w-3xl p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="display-face micro-copy text-accent">
                  Agregar ejemplar
                </p>
                <p className={grindPoolSectionIntroClassName}>
                  Captura uno nuevo, guárdalo en el pool y vuelve al ranking
                  sin perder contexto.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>

            <div className={cn("mt-4", grindPoolCompactFieldGridClassName)}>
              <div className={grindPoolFieldStackClassName}>
                <SpreadInput
                  label="LVL"
                  value={safeDraft.level}
                  max={100}
                  orientation="horizontal"
                  onChange={(next) =>
                    draftForm.setValue(
                      "level",
                      Math.max(1, Math.min(100, next)),
                      { shouldDirty: true },
                    )
                  }
                />
              </div>
              <div className={grindPoolFieldStackClassName}>
                <p className="display-face micro-copy text-muted">Género</p>
                <GenderIconPicker
                  value={safeDraft.gender}
                  onChange={(next) =>
                    draftForm.setValue("gender", next, { shouldDirty: true })
                  }
                />
              </div>
              <div className={grindPoolFieldStackClassName}>
                <p className="display-face micro-copy text-muted">
                  Naturaleza
                </p>
                <FilterCombobox
                  value={safeDraft.nature}
                  options={natureOptions}
                  placeholder="Nature"
                  searchable={false}
                  onChange={(next) =>
                    draftForm.setValue("nature", next, { shouldDirty: true })
                  }
                />
                <p className="mt-1 text-xs text-text-faint">
                  Favorece:{" "}
                  {getNatureEffect(safeDraft.nature).up?.toUpperCase() ??
                    "ninguno"}
                </p>
              </div>
              <div className={grindPoolFieldStackClassName}>
                <p className="display-face micro-copy text-muted">
                  Habilidad
                </p>
                <FilterCombobox
                  value={safeDraft.ability}
                  options={abilityOptions}
                  placeholder="Ability"
                  searchable={false}
                  onChange={(next) =>
                    draftForm.setValue("ability", next, { shouldDirty: true })
                  }
                />
              </div>
            </div>

            <label className="mt-3 block">
              <span className="display-face micro-copy text-muted">
                Notas
              </span>
              <Input
                className="mt-1.5 h-10"
                placeholder="Ruta, encuentro, observaciones, etc."
                value={safeDraft.notes}
                onChange={(event) =>
                  draftForm.setValue("notes", event.target.value, {
                    shouldDirty: true,
                  })
                }
              />
            </label>

            <div className="mt-4">
              <p className="display-face micro-copy text-muted">
                Stats observados
              </p>
              <p className="mt-1 text-xs text-text-faint">
                Se convierten a IV estimado usando nivel, naturaleza y la
                especie elegida.
              </p>
            </div>

            <div className="mt-3">
              <StatInputs
                values={safeDraft.stats}
                onChange={onChangeStat}
                errors={draftStatIssues}
              />
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => draftForm.reset(createCandidateDraft())}
              >
                Limpiar draft
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={
                  !speciesMeta ||
                  !draftValidation.success ||
                  hasDraftStatIssues
                }
              >
                Agregar al pool
              </Button>
            </div>
            {!draftValidation.success ? (
              <p className="mt-2 text-xs text-danger">
                Completa nivel, naturaleza, habilidad y stats válidos.
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
