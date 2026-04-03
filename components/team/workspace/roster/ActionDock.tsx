"use client";

import clsx from "clsx";
import Link from "next/link";
import { ChevronLeft, GitCompareArrows, Info, Lock, LockOpen, Pencil, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { EditableMember } from "@/lib/builderStore";

export function ActionDock({
  mode = "full",
  buttonSize,
  selectedMember,
  detailsOpen,
  editorOpen,
  editHref,
  editTransitionTypes,
  editAriaLabel,
  editIcon,
  closeHref,
  onToggleDetails,
  onOpenReset,
  onToggleLock,
  onAssignToCompare,
  onOpenDelete,
  onCloseEditor,
}: {
  mode?: "full" | "close-only";
  buttonSize: "desktop" | "mobile";
  selectedMember?: EditableMember;
  detailsOpen: boolean;
  editorOpen: boolean;
  editHref?: string;
  editTransitionTypes?: string[];
  editAriaLabel?: string;
  editIcon?: "edit" | "back";
  closeHref?: string;
  onToggleDetails: () => void;
  onOpenReset: () => void;
  onToggleLock: () => void;
  onAssignToCompare: () => void;
  onOpenDelete: () => void;
  onCloseEditor: () => void;
}) {
  if (!selectedMember) {
    return null;
  }

  const isDesktop = buttonSize === "desktop";
  const showCloseDockAction = !isDesktop && editorOpen;
  const buttonClass = isDesktop
    ? "size-9 rounded-[0.9rem] border bg-surface-4 hover:bg-surface-8"
    : "size-11 rounded-[0.9rem] border bg-surface-4 hover:bg-surface-8";
  const iconClass = isDesktop ? "h-4 w-4" : "h-5 w-5";
  const editLabel = editAriaLabel ?? "Editar slot seleccionado";
  const editNode = editIcon === "back" ? <ChevronLeft className={iconClass} /> : <Pencil className={iconClass} />;

  if (mode === "close-only") {
    if (closeHref) {
      return (
        <Link
          href={closeHref}
          transitionTypes={["editor-back"]}
          aria-label="Volver al team"
          className={clsx(
            "inline-flex items-center justify-center",
            buttonClass,
            "border-danger-line text-danger hover:bg-danger-fill",
          )}
        >
          <X className={iconClass} />
        </Link>
      );
    }

    return (
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onCloseEditor}
        aria-label="Volver al team"
        className={clsx(buttonClass, "border-danger-line text-danger hover:bg-danger-fill")}
      >
        <X className={iconClass} />
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onToggleDetails}
        aria-label={detailsOpen ? "Ocultar info del slot seleccionado" : "Mostrar info del slot seleccionado"}
        className={clsx(
          buttonClass,
          detailsOpen
            ? "border-info-line bg-info-fill text-info-soft"
            : "border-line text-muted",
        )}
      >
        <Info className={iconClass} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onOpenReset}
        aria-label="Resetear slot seleccionado"
        className={clsx(buttonClass, "border-danger-line-soft text-danger hover:bg-danger-fill")}
      >
        <RotateCcw className={iconClass} />
      </Button>
      {editHref ? (
        <Link
          href={editHref}
          transitionTypes={editTransitionTypes ?? ["editor-forward"]}
          aria-label={editLabel}
          className={clsx(
            "inline-flex items-center justify-center",
            buttonClass,
            "border-line text-muted",
          )}
        >
          {editNode}
        </Link>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          disabled
          aria-label={editLabel}
          className={clsx(buttonClass, "border-line text-muted")}
        >
          {editNode}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onToggleLock}
        aria-label={selectedMember.locked ? "Desbloquear slot seleccionado" : "Bloquear slot seleccionado"}
        className={clsx(
          buttonClass,
          selectedMember.locked
            ? "border-warning-line text-warning-strong"
            : "border-line text-muted",
        )}
      >
        {selectedMember.locked ? <Lock className={iconClass} /> : <LockOpen className={iconClass} />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onAssignToCompare}
        aria-label="Comparar slot seleccionado"
        className={clsx(buttonClass, "border-line text-muted")}
      >
        <GitCompareArrows className={iconClass} />
      </Button>
      {showCloseDockAction && closeHref ? (
        <Link
          href={closeHref}
          transitionTypes={["editor-back"]}
          aria-label="Volver al team"
          className={clsx(
            "inline-flex items-center justify-center",
            buttonClass,
            "border-danger-line text-danger hover:bg-danger-fill",
          )}
        >
          <X className={iconClass} />
        </Link>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={() => {
            if (showCloseDockAction) {
              onCloseEditor();
              return;
            }
            onOpenDelete();
          }}
          aria-label={showCloseDockAction ? "Volver al team" : "Mandar Pokemon seleccionado a caja"}
          className={clsx(buttonClass, "border-danger-line text-danger hover:bg-danger-fill")}
        >
          <X className={iconClass} />
        </Button>
      )}
    </>
  );
}
