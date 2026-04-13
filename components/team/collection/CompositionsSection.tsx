"use client";

import { useState } from "react";
import clsx from "clsx";
import { Pencil, Plus } from "lucide-react";

import { PokemonSprite } from "@/components/BuilderShared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";

const compositionSectionHeaderClassName = "flex flex-wrap items-center justify-between gap-3";
const compositionCardClassName = "rounded-xl border px-3 py-3 text-left transition";
const compositionCardIdleClassName = "border-line bg-surface-3 hover:bg-surface-4";
const compositionCardActiveClassName = "border-primary-line-emphasis bg-primary-fill";

type Composition = {
  id: string;
  name: string;
  memberIds: string[];
};

type CompositionMember = {
  id: string;
  species: string;
  nickname?: string;
};

export function CompositionsSection({
  compositions,
  members,
  speciesCatalog,
  activeCompositionId,
  onCreateComposition,
  onSelectComposition,
  onRenameComposition,
}: {
  compositions: Composition[];
  members: CompositionMember[];
  speciesCatalog: { name: string; dex: number }[];
  activeCompositionId: string | null;
  onCreateComposition: () => void;
  onSelectComposition: (compositionId: string) => void;
  onRenameComposition: (compositionId: string, name: string) => void;
}) {
  const [editingCompositionId, setEditingCompositionId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  function commitRename() {
    if (!editingCompositionId) {
      return;
    }

    onRenameComposition(editingCompositionId, draftName);
    setEditingCompositionId(null);
  }

  return (
    <section className="space-y-2">
      <div className={compositionSectionHeaderClassName}>
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
          const compositionMembers = composition.memberIds
            .map((memberId) => members.find((member) => member.id === memberId))
            .filter((member): member is CompositionMember => Boolean(member));

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
                compositionCardClassName,
                isActive ? compositionCardActiveClassName : compositionCardIdleClassName,
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
                      {compositionMembers.length ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {compositionMembers.slice(0, 4).map((member) => (
                              <div
                                key={`${composition.id}-${member.id}-sprite`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-soft bg-surface-2"
                              >
                                <PokemonSprite
                                  species={member.species}
                                  spriteUrl={getCompositionSpriteUrl(member.species, speciesCatalog)}
                                  size="small"
                                  chrome="plain"
                                />
                              </div>
                            ))}
                            {compositionMembers.length > 4 ? (
                              <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-line-soft bg-surface-2 px-2 text-xs text-muted">
                                +{compositionMembers.length - 4}
                              </div>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted">
                            {compositionMembers
                              .slice(0, 3)
                              .map((member) => member.nickname?.trim() || member.species)
                              .join(", ")}
                            {compositionMembers.length > 3 ? "..." : ""}
                          </p>
                        </div>
                      ) : null}
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

function getCompositionSpriteUrl(
  species: string,
  speciesCatalog: { name: string; dex: number }[],
) {
  const dex = speciesCatalog.find(
    (entry) => normalizeName(entry.name) === normalizeName(species),
  )?.dex;
  return buildSpriteUrls(species, dex).spriteUrl;
}
