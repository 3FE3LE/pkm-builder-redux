"use client";

import { useState } from 'react';
import clsx from 'clsx';
import {
  CircleArrowUp,
  Mars,
  PencilLine,
  Sparkles,
  Venus,
} from 'lucide-react';

import { PokemonSprite, TypeBadge } from '@/components/BuilderShared';
import { MiniPill, SpreadInput } from '@/components/team/UI';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supportsPokemonGender } from '@/lib/teamAnalysis';

import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore";

import type {
  EditorIssueGetter,
  EditorUpdate,
} from "@/components/team/editor/editorTypes";

function LevelControls({
  currentLevel,
  getIssue,
  hasEvolution,
  evolutionBlockReason,
  updateEditorMember,
  onRequestEvolution,
}: {
  currentLevel: number;
  getIssue: EditorIssueGetter;
  hasEvolution: boolean;
  evolutionBlockReason?: string;
  updateEditorMember: EditorUpdate;
  onRequestEvolution: () => void;
}) {
  return (
    <>
      <div className="micro-copy flex items-center justify-between gap-3 text-muted">
        <span className="display-face text-xs text-muted">Nivel</span>
        <span className="display-face text-sm text-accent">Lv {currentLevel}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={1}
            max={100}
            value={currentLevel}
            onChange={(event) =>
              updateEditorMember((current) => ({
                ...current,
                level: Number(event.target.value),
              }))
            }
            className="h-2.5 w-full cursor-pointer accent-accent"
          />
          <div className="micro-label mt-1 flex items-center justify-between text-muted">
            <span>1</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
        <SpreadInput
          label="LV"
          value={currentLevel}
          max={100}
          hideLabel
          onChange={(next) =>
            updateEditorMember((current) => ({
              ...current,
              level: Math.max(1, Math.min(100, next)),
            }))
          }
          error={getIssue("level")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onRequestEvolution}
          disabled={!hasEvolution}
          aria-label={
            hasEvolution
              ? "Abrir evolución"
              : evolutionBlockReason || "Sin evolución disponible"
          }
          title={!hasEvolution ? evolutionBlockReason : undefined}
          className={clsx(
            "h-8 w-8",
            hasEvolution
              ? "border-primary-line-strong bg-primary-fill-strong text-primary-soft hover:bg-primary-fill-hover"
              : "opacity-45",
          )}
        >
          <CircleArrowUp className="h-4 w-4" />
        </Button>
      </div>
      {!hasEvolution && evolutionBlockReason ? (
        <p className="mt-2 text-xs text-muted">{evolutionBlockReason}</p>
      ) : null}
    </>
  );
}

export function EditorHeader({
  member,
  resolved,
  currentSpecies,
  currentLevel,
  currentGender,
  currentShiny,
  getIssue,
  hasEvolution,
  evolutionBlockReason,
  updateEditorMember,
  onRequestEvolution,
}: {
  member: EditableMember;
  resolved?: ResolvedTeamMember;
  currentSpecies: string;
  currentLevel: number;
  currentGender: EditableMember["gender"];
  currentShiny: boolean;
  getIssue: EditorIssueGetter;
  hasEvolution: boolean;
  evolutionBlockReason?: string;
  updateEditorMember: EditorUpdate;
  onRequestEvolution: () => void;
}) {
  const [nicknameEditable, setNicknameEditable] = useState(false);
  const supportsGender =
    resolved?.supportsGender ?? supportsPokemonGender(currentSpecies);
  const nicknamePlaceholder = currentSpecies || "Pokemon pendiente";
  const nicknameDisplayValue = member.nickname || nicknamePlaceholder;

  return (
    <div className="px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex shrink-0 flex-col items-center gap-2.5">
          <PokemonSprite
            species={resolved?.species ?? currentSpecies ?? "Pokemon"}
            spriteUrl={resolved?.spriteUrl}
            animatedSpriteUrl={resolved?.animatedSpriteUrl}
            size="large"
            chrome="plain"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateEditorMember((current) => ({
                  ...current,
                  shiny: !current.shiny,
                }))
              }
              aria-label="Toggle shiny"
              title="Shiny"
              className={clsx(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
                currentShiny
                  ? "border-warning-line bg-[rgba(255,215,102,0.14)] text-warning-strong"
                  : "border-line bg-surface-4 text-muted hover:bg-surface-6",
              )}
            >
              <Sparkles className="h-4.5 w-4.5" />
            </button>
          {supportsGender ? (
            <>
              <button
                type="button"
                onClick={() =>
                  updateEditorMember((current) => ({
                    ...current,
                    gender: "male",
                  }))
                }
                aria-label="Set male"
                title="Male"
                className={clsx(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
                  currentGender === "male"
                    ? "border-info-line bg-info-fill text-info-soft"
                    : "border-line bg-surface-4 text-muted hover:bg-surface-6",
                )}
              >
                <Mars className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateEditorMember((current) => ({
                    ...current,
                    gender: "female",
                  }))
                }
                aria-label="Set female"
                title="Female"
                className={clsx(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
                  currentGender === "female"
                    ? "border-danger-line bg-danger-fill text-danger-soft"
                    : "border-line bg-surface-4 text-muted hover:bg-surface-6",
                )}
              >
                <Venus className="h-4.5 w-4.5" />
              </button>
            </>
          ) : null}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative max-w-md">
            <Input
              value={nicknameEditable ? member.nickname : nicknameDisplayValue}
              readOnly={!nicknameEditable}
              tabIndex={nicknameEditable ? 0 : -1}
              onChange={(event) =>
                updateEditorMember((current) => ({
                  ...current,
                  nickname: event.target.value,
                }))
              }
              placeholder={nicknamePlaceholder}
              maxLength={24}
              className={clsx(
                "display-face h-12 pr-11 text-xl",
                nicknameEditable
                  ? "border-line bg-surface-4"
                  : "cursor-default border-transparent bg-transparent px-0 text-text shadow-none focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0",
              )}
            />
            <button
              type="button"
              onClick={() => setNicknameEditable((current) => !current)}
              aria-label={nicknameEditable ? "Bloquear nickname" : "Editar nickname"}
              className={clsx(
                "absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[0.55rem] border transition",
                nicknameEditable
                  ? "border-primary-line-strong bg-primary-fill text-primary-soft"
                  : "border-line bg-surface-4 text-muted hover:bg-surface-6",
              )}
            >
              <PencilLine className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            {resolved?.species || currentSpecies || "Pokemon pendiente"}
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {resolved?.resolvedTypes.length ? (
                resolved.resolvedTypes.map((type) => (
                  <TypeBadge key={`sheet-${type}`} type={type} />
                ))
              ) : (
                <MiniPill>tipo pendiente</MiniPill>
              )}
            </div>
          </div>
          {resolved?.evolutionHints?.length ? (
            <div className="mt-3 space-y-1">
              {resolved.evolutionHints.slice(0, 2).map((hint) => (
                <p
                  key={`sheet-evolution-${hint.target}-${hint.method}`}
                  className="text-xs text-muted"
                  title={hint.summary}
                >
                  {hint.method
                    ? `Next: ${hint.target} · ${hint.method}`
                    : `Next: ${hint.target}`}
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-4 hidden lg:block">
            <LevelControls
              currentLevel={currentLevel}
              getIssue={getIssue}
              hasEvolution={hasEvolution}
              evolutionBlockReason={evolutionBlockReason}
              updateEditorMember={updateEditorMember}
              onRequestEvolution={onRequestEvolution}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 lg:hidden">
        <LevelControls
          currentLevel={currentLevel}
          getIssue={getIssue}
          hasEvolution={hasEvolution}
          evolutionBlockReason={evolutionBlockReason}
          updateEditorMember={updateEditorMember}
          onRequestEvolution={onRequestEvolution}
        />
      </div>
    </div>
  );
}
