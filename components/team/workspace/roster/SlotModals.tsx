"use client";

import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/Button";
import type { EditableMember } from "@/lib/builderStore";

export type ResetFields = {
  nickname: boolean;
  level: boolean;
  gender: boolean;
  nature: boolean;
  ability: boolean;
  item: boolean;
  moves: boolean;
  ivs: boolean;
  evs: boolean;
};

const RESET_LABELS = {
  nickname: "Nickname",
  level: "Nivel",
  gender: "Genero",
  nature: "Naturaleza",
  ability: "Habilidad",
  item: "Objeto",
  moves: "Moveset",
  ivs: "IVs",
  evs: "EVs",
} as const;

export function SlotModals({
  selectedMember,
  resetOpen,
  deleteOpen,
  resetFields,
  onCloseReset,
  onCloseDelete,
  onToggleResetField,
  onApplyReset,
  onConfirmDelete,
  onConfirmRelease,
}: {
  selectedMember?: EditableMember;
  resetOpen: boolean;
  deleteOpen: boolean;
  resetFields: ResetFields;
  onCloseReset: () => void;
  onCloseDelete: () => void;
  onToggleResetField: (field: keyof ResetFields, checked: boolean) => void;
  onApplyReset: () => void;
  onConfirmDelete: () => void;
  onConfirmRelease: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {resetOpen && selectedMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-scrim z-[120]"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="panel-strong panel-frame w-full max-w-lg p-5"
            >
              <p className="display-face text-sm text-accent">Reset del slot</p>
              <p className="mt-2 text-sm text-muted">
                Elige exactamente qué quieres restablecer. Todas las opciones vienen marcadas por defecto.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(resetFields).map(([key, checked]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-[0.75rem] border border-line bg-surface-3 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        onToggleResetField(key as keyof ResetFields, event.target.checked)
                      }
                    />
                    <span>{RESET_LABELS[key as keyof ResetFields]}</span>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCloseReset}>
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" onClick={onApplyReset}>
                  Aplicar reset
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteOpen && selectedMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-scrim z-[120]"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="panel-strong panel-frame w-full max-w-md p-5"
            >
              <p className="display-face text-sm text-danger">Mandar a caja</p>
              <p className="mt-2 text-sm text-muted">
                Vas a sacar a {selectedMember.nickname || selectedMember.species || "este Pokemon"} del roster activo.
              </p>
              <p className="mt-1 text-sm text-muted">
                El Pokemon seguira guardado en tu PC para reusarlo despues.
              </p>
              <p className="mt-3 text-xs text-text-faint">
                Si no quieres conservarlo, puedes liberarlo y quitarlo por completo de tu builder.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onConfirmRelease}>
                  Liberar
                </Button>
                <Button type="button" variant="ghost" onClick={onCloseDelete}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onConfirmDelete}
                >
                  Mandar a caja
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
