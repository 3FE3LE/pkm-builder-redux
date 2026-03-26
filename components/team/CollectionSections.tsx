"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Archive, Check, Pencil, Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { FilterCombobox, PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildSpriteUrls } from "@/lib/domain/names";

import type { EditableMember } from "@/lib/builderStore";

type Composition = {
  id: string;
  name: string;
  memberIds: string[];
};

export function CompositionsSection({
  compositions,
  activeCompositionId,
  onCreateComposition,
  onSelectComposition,
  onRenameComposition,
}: {
  compositions: Composition[];
  activeCompositionId: string | null;
  onCreateComposition: () => void;
  onSelectComposition: (compositionId: string) => void;
  onRenameComposition: (compositionId: string, name: string) => void;
}) {
  const [editingCompositionId, setEditingCompositionId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!editingCompositionId) {
      return;
    }

    const current = compositions.find((composition) => composition.id === editingCompositionId);
    setDraftName(current?.name ?? "");
  }, [compositions, editingCompositionId]);

  function commitRename() {
    if (!editingCompositionId) {
      return;
    }

    onRenameComposition(editingCompositionId, draftName);
    setEditingCompositionId(null);
  }

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">Compositions</p>
          <p className="text-xs text-muted">Reutiliza tus Pokemon entre equipos.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCreateComposition}
          className="touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          Add team
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {compositions.map((composition, index) => {
          const isActive = composition.id === activeCompositionId;
          const isEditing = composition.id === editingCompositionId;

          return (
            <div
              key={composition.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectComposition(composition.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectComposition(composition.id);
                }
              }}
              className={clsx(
                "rounded-[0.9rem] border px-3 py-3 text-left transition",
                isActive
                  ? "border-primary-line-emphasis bg-primary-fill"
                  : "border-line bg-surface-3 hover:bg-surface-4",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <Input
                      value={draftName}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setDraftName(event.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitRename();
                        }
                        if (event.key === "Escape") {
                          setEditingCompositionId(null);
                        }
                      }}
                      className="h-8"
                      autoFocus
                    />
                  ) : (
                    <>
                      <p className="display-face truncate text-sm text-text">
                        {composition.name || `Team ${index + 1}`}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {composition.memberIds.length}/6 Pokemon
                      </p>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingCompositionId(composition.id);
                    setDraftName(composition.name);
                  }}
                  aria-label="Editar nombre del equipo"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PcBoxSection({
  members,
  compositions,
  activeCompositionId,
  speciesCatalog,
  pulseMemberId,
  onOpenEditor,
  onAssignToComposition,
}: {
  members: EditableMember[];
  compositions: Composition[];
  activeCompositionId: string | null;
  speciesCatalog: { name: string; dex: number }[];
  pulseMemberId?: string | null;
  onOpenEditor: (memberId: string) => void;
  onAssignToComposition: (memberId: string, compositionId: string) => void;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [targetCompositionName, setTargetCompositionName] = useState("");
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const compositionOptions = compositions.map((composition) => composition.name || "Team");
  const dexBySpecies = useMemo(
    () =>
      Object.fromEntries(speciesCatalog.map((entry) => [entry.name.toLowerCase(), entry.dex])) as Record<
        string,
        number
      >,
    [speciesCatalog],
  );

  useEffect(() => {
    if (!selectedMember) {
      return;
    }

    const activeComposition =
      compositions.find((composition) => composition.id === activeCompositionId) ?? compositions[0];
    setTargetCompositionName(activeComposition?.name ?? "");
  }, [activeCompositionId, compositions, selectedMember]);
  useEffect(() => {
    if (!selectedMember) {
      setTargetCompositionName("");
    }
  }, [selectedMember]);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">Caja / PC</p>
          <p className="text-xs text-muted">{members.length} guardados</p>
        </div>
        <Archive className="h-4 w-4 text-accent" />
      </div>

      {members.length ? (
        <div className="rounded-[0.9rem] border border-line bg-surface-3 p-3">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMemberId(member.id)}
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
                      size="small"
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
        <div className="rounded-[0.9rem] border border-dashed border-line bg-surface-3 px-3 py-4 text-sm text-muted">
          Aun no tienes Pokemon mandados a la caja.
        </div>
      )}

      <AnimatePresence>
        {selectedMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(2,8,10,0.72)] px-4 backdrop-blur-md"
            onClick={() => setSelectedMemberId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[1.05rem] border border-line-strong bg-[linear-gradient(180deg,hsl(196_57%_9%_/_0.96),hsl(196_57%_7%_/_0.94))] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[18px]"
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
                  onClick={() => setSelectedMemberId(null)}
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
                  onChange={setTargetCompositionName}
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
                  }}
                >
                  Agregar
                </Button>
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenEditor(selectedMember.id)}
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


export function AddMemberSheet({
  open,
  libraryMembers,
  activeTeamIds,
  speciesCatalog,
  onClose,
  onPickLibraryMember,
  onCreateFromDex,
}: {
  open: boolean;
  libraryMembers: EditableMember[];
  activeTeamIds: string[];
  speciesCatalog: { name: string; slug: string; dex: number; types: string[] }[];
  onClose: () => void;
  onPickLibraryMember: (memberId: string) => void;
  onCreateFromDex: (species: string) => void;
}) {
  const [query, setQuery] = useState("");
  const activeTeamIdSet = useMemo(() => new Set(activeTeamIds), [activeTeamIds]);
  const availableMembers = useMemo(
    () => libraryMembers.filter((member) => !activeTeamIdSet.has(member.id)),
    [libraryMembers, activeTeamIdSet],
  );
  const filteredLibrary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return availableMembers.filter((member) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        member.nickname.toLowerCase().includes(normalizedQuery) ||
        member.species.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [availableMembers, query]);
  const filteredDex = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return speciesCatalog
      .filter((entry) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          entry.name.toLowerCase().includes(normalizedQuery) ||
          String(entry.dex).includes(normalizedQuery)
        );
      })
      .slice(0, 18);
  }, [query, speciesCatalog]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[125] flex items-end justify-center bg-[rgba(2,8,10,0.76)] px-3 py-4 backdrop-blur-md sm:items-center">
      <div className="panel-strong w-full max-w-3xl rounded-[1rem] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display-face text-sm text-accent">Agregar Pokemon</p>
            <p className="text-sm text-muted">Tus Pokemon primero, luego la dex.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="mt-3 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca por nickname, especie o numero dex"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="display-face text-xs text-accent">Tus Pokemon</p>
              <p className="text-[11px] text-muted">{filteredLibrary.length} disponibles</p>
            </div>
            <div className="max-h-[24rem] space-y-2 overflow-auto pr-1">
              {filteredLibrary.length ? (
                filteredLibrary.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onPickLibraryMember(member.id)}
                    className="flex w-full items-center gap-3 rounded-[0.9rem] border border-line bg-surface-3 px-3 py-2 text-left transition hover:bg-surface-4"
                  >
                    <PokemonSprite species={member.species} size="small" chrome="plain" />
                    <div className="min-w-0 flex-1">
                      <p className="display-face truncate text-sm text-text">
                        {member.nickname || member.species}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {member.species} · Lv. {member.level}
                        {member.item ? ` · ${member.item}` : ""}
                      </p>
                    </div>
                    <Check className="h-4 w-4 text-accent" />
                  </button>
                ))
              ) : (
                <div className="rounded-[0.9rem] border border-dashed border-line bg-surface-3 px-3 py-4 text-sm text-muted">
                  No hay coincidencias en tu libreria.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="display-face text-xs text-accent">Dex</p>
              <p className="text-[11px] text-muted">Crear nuevo</p>
            </div>
            <div className="max-h-[24rem] space-y-2 overflow-auto pr-1">
              {filteredDex.map((entry) => (
                <button
                  key={entry.slug}
                  type="button"
                  onClick={() => onCreateFromDex(entry.name)}
                  className="flex w-full items-center justify-between gap-3 rounded-[0.9rem] border border-line bg-surface-3 px-3 py-2 text-left transition hover:bg-surface-4"
                >
                  <div className="min-w-0">
                    <p className="display-face truncate text-sm text-text">
                      #{String(entry.dex).padStart(3, "0")} {entry.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.types.map((type) => (
                        <TypeBadge key={`${entry.slug}-${type}`} type={type} />
                      ))}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-accent" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
