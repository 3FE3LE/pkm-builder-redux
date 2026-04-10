"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { PokemonSprite, SpeciesCombobox } from "@/components/BuilderShared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import type { EditableMember } from "@/lib/builderStore";

const addMemberSectionMetaClassName = "micro-copy text-muted";

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
  const [selectedDexSpecies, setSelectedDexSpecies] = useState("");
  const activeTeamIdSet = useMemo(() => new Set(activeTeamIds), [activeTeamIds]);
  const availableMembers = useMemo(
    () => libraryMembers.filter((member) => member.species.trim() && !activeTeamIdSet.has(member.id)),
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
  if (!open) {
    return null;
  }

  function closeSheet() {
    setQuery("");
    setSelectedDexSpecies("");
    onClose();
  }

  return (
    <div
      className="modal-scrim z-125 items-end px-3 py-4 sm:items-center"
      onClick={closeSheet}
    >
      <div
        className="panel-strong panel-frame w-full max-w-3xl p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display-face text-sm text-accent">Agregar Pokemon</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={closeSheet}>
            Cerrar
          </Button>
        </div>

        <section className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="display-face text-xs text-accent">Dex</p>
            <p className={addMemberSectionMetaClassName}>Crear nuevo</p>
          </div>
          <div className="space-y-3">
            <SpeciesCombobox
              value={selectedDexSpecies}
              speciesCatalog={speciesCatalog}
              coordinationGroup="add-member-dex"
              panelClassName="max-w-none"
              onChange={(species) => {
                setSelectedDexSpecies(species);
                setQuery("");
                onCreateFromDex(species);
              }}
            />
            <div className="soft-card-dashed px-3 py-4 text-sm text-muted">
              Usa el selector de especies para crear un Pokemon nuevo desde la dex.
            </div>
          </div>
        </section>

        {availableMembers.length ? (
          <>
            <div className="mt-4 relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca en tu libreria por nickname o especie"
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="mt-4">
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="display-face text-xs text-accent">Tus Pokemon</p>
                  <p className={addMemberSectionMetaClassName}>{filteredLibrary.length} disponibles</p>
                </div>
                <div className="max-h-96 space-y-2 overflow-auto pr-1">
                  {filteredLibrary.length ? (
                    filteredLibrary.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setQuery("");
                          onPickLibraryMember(member.id);
                        }}
                        className="soft-card flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-surface-4"
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
                    <div className="soft-card-dashed px-3 py-4 text-sm text-muted">
                      No hay coincidencias en tu libreria.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
