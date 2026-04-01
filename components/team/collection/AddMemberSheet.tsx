"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import type { EditableMember } from "@/lib/builderStore";

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

  if (!open) {
    return null;
  }

  function closeSheet() {
    setQuery("");
    onClose();
  }

  return (
    <div className="modal-scrim z-[125] items-end px-3 py-4 sm:items-center">
      <div className="panel-strong panel-frame w-full max-w-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display-face text-sm text-accent">Agregar Pokemon</p>
            <p className="text-sm text-muted">Tus Pokemon primero, luego la dex.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={closeSheet}>
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
                  onClick={() => {
                    setQuery("");
                    onCreateFromDex(entry.name);
                  }}
                  className="soft-card flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-surface-4"
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
