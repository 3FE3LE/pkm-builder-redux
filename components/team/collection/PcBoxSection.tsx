"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Archive } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { FilterCombobox, PokemonSprite } from "@/components/BuilderShared";
import { ImportPanel, TransferActions } from "@/components/team/shared/TransferPanels";
import { Button } from "@/components/ui/Button";
import { buildSpriteUrls } from "@/lib/domain/names";

import type { EditableMember } from "@/lib/builderStore";

type Composition = {
  id: string;
  name: string;
  memberIds: string[];
};

export function PcBoxSection({
  members,
  compositions,
  activeCompositionId,
  speciesCatalog,
  pulseMemberId,
  onOpenEditor,
  onAssignToComposition,
  onImportToPc,
}: {
  members: EditableMember[];
  compositions: Composition[];
  activeCompositionId: string | null;
  speciesCatalog: { name: string; dex: number }[];
  pulseMemberId?: string | null;
  onOpenEditor: (memberId: string) => void;
  onAssignToComposition: (memberId: string, compositionId: string) => void;
  onImportToPc: (member: EditableMember) => boolean;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [manualTargetCompositionName, setManualTargetCompositionName] = useState<string | null>(null);
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const compositionOptions = compositions.map((composition) => composition.name || "Team");
  const defaultCompositionName = useMemo(() => {
    const activeComposition =
      compositions.find((composition) => composition.id === activeCompositionId) ?? compositions[0];
    return activeComposition?.name ?? "";
  }, [activeCompositionId, compositions]);
  const targetCompositionName = manualTargetCompositionName ?? defaultCompositionName;
  const dexBySpecies = useMemo(
    () =>
      Object.fromEntries(speciesCatalog.map((entry) => [entry.name.toLowerCase(), entry.dex])) as Record<
        string,
        number
      >,
    [speciesCatalog],
  );

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">Caja / PC</p>
          <p className="text-xs text-muted">{members.length} guardados</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportPanel onImportToPc={onImportToPc} />
          <Archive className="h-4 w-4 text-accent" />
        </div>
      </div>

      {members.length ? (
        <div className="soft-card p-3">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setManualTargetCompositionName(null);
                  setSelectedMemberId(member.id);
                }}
                className={clsx(
                  "flex aspect-square items-center justify-center rounded-[0.75rem] transition",
                  selectedMemberId === member.id
                    ? "ring-2 ring-primary-line-emphasis"
                    : "opacity-90 hover:opacity-100",
                )}
                aria-label={`Abrir acciones para ${member.nickname || member.species}`}
              >
                <motion.div
                  initial={false}
                  animate={
                    pulseMemberId === member.id
                      ? { scale: [0, 1.08, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  {(() => {
                    const dex = dexBySpecies[member.species.toLowerCase()];
                    const sprites = buildSpriteUrls(member.species, dex, { shiny: Boolean(member.shiny) });

                    return (
                      <PokemonSprite
                        species={member.species}
                        spriteUrl={sprites.spriteUrl}
                        animatedSpriteUrl={sprites.animatedSpriteUrl}
                        size="tiny"
                        chrome="plain"
                      />
                    );
                  })()}
                </motion.div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="soft-card-dashed px-3 py-4 text-sm text-muted">
          Aun no tienes Pokemon mandados a la caja.
        </div>
      )}

      <AnimatePresence>
        {selectedMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-scrim z-[120]"
            onClick={() => {
              setManualTargetCompositionName(null);
              setSelectedMemberId(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="dialog-surface max-w-md p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <PokemonSprite
                    species={selectedMember.species}
                    spriteUrl={
                      buildSpriteUrls(
                        selectedMember.species,
                        dexBySpecies[selectedMember.species.toLowerCase()],
                        { shiny: Boolean(selectedMember.shiny) },
                      ).spriteUrl
                    }
                    animatedSpriteUrl={
                      buildSpriteUrls(
                        selectedMember.species,
                        dexBySpecies[selectedMember.species.toLowerCase()],
                        { shiny: Boolean(selectedMember.shiny) },
                      ).animatedSpriteUrl
                    }
                    size="small"
                    chrome="plain"
                  />
                  <div className="min-w-0">
                    <p className="display-face truncate text-sm text-text">
                      {selectedMember.nickname || selectedMember.species}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {selectedMember.species} · Lv. {selectedMember.level}
                      {selectedMember.item ? ` · ${selectedMember.item}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setManualTargetCompositionName(null);
                    setSelectedMemberId(null);
                  }}
                  aria-label="Cerrar menu de caja"
                >
                  Cerrar
                </Button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <FilterCombobox
                value={targetCompositionName}
                options={compositionOptions}
                placeholder="Equipo destino"
                coordinationGroup="pc-composition-target"
                onChange={(next) => setManualTargetCompositionName(next)}
              />
              <Button
                type="button"
                onClick={() => {
                    const targetComposition = compositions.find(
                      (composition) => composition.name === targetCompositionName,
                    );
                    if (!targetComposition) {
                      return;
                    }

                    onAssignToComposition(selectedMember.id, targetComposition.id);
                    setSelectedMemberId(null);
                    setManualTargetCompositionName(null);
                  }}
                >
                Agregar
                </Button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <TransferActions member={selectedMember} />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setManualTargetCompositionName(null);
                    onOpenEditor(selectedMember.id);
                  }}
                >
                  Ver datos
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
