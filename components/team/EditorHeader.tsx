"use client";

import clsx from 'clsx';
import {
  CircleArrowUp,
  Mars,
  PencilLine,
  RotateCcw,
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
} from "@/components/team/editorTypes";
export function EditorHeader({
  member,
  resolved,
  currentSpecies,
  currentLevel,
  currentGender,
  getIssue,
  hasEvolution,
  evolutionBlockReason,
  updateEditorMember,
  onRequestEvolution,
  onOpenReset,
}: {
  member: EditableMember;
  resolved?: ResolvedTeamMember;
  currentSpecies: string;
  currentLevel: number;
  currentGender: EditableMember["gender"];
  getIssue: EditorIssueGetter;
  hasEvolution: boolean;
  evolutionBlockReason?: string;
  updateEditorMember: EditorUpdate;
  onRequestEvolution: () => void;
  onOpenReset: () => void;
}) {
  const supportsGender =
    resolved?.supportsGender ?? supportsPokemonGender(currentSpecies);

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
          {supportsGender ? (
            <div className="flex items-center gap-2">
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
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative max-w-md">
            <Input
              value={member.nickname}
              onChange={(event) =>
                updateEditorMember((current) => ({
                  ...current,
                  nickname: event.target.value,
                }))
              }
              placeholder={currentSpecies || "Pokemon pendiente"}
              maxLength={24}
              className="display-face h-12 border-line bg-surface-4 pr-11 text-xl"
            />
            <PencilLine className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onOpenReset}
              aria-label="Reset slot"
              title="Reset slot"
              className="shrink-0 border-danger-line-soft text-danger hover:bg-danger-fill"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
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
            <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
              <span className="display-face text-xs text-muted">Nivel</span>
              <span className="display-face text-sm text-accent">
                Lv {currentLevel}
              </span>
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
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                  <span>1</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <SpreadInput
                label="LV"
                value={currentLevel}
                max={100}
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
          </div>
        </div>
      </div>
      <div className="mt-4 lg:hidden">
        <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
          <span className="display-face text-xs text-muted">Nivel</span>
          <span className="display-face text-sm text-accent">
            Lv {currentLevel}
          </span>
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
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
          <SpreadInput
            label="LV"
            value={currentLevel}
            max={100}
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
      </div>
    </div>
  );
}
