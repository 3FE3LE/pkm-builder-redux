"use client";

import clsx from "clsx";
import { GitCompareArrows, Info, Lock, LockOpen, Pencil, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { EditableMember } from "@/lib/builderStore";

export function ActionDock({
  buttonSize,
  selectedMember,
  detailsOpen,
  editorOpen,
  onToggleDetails,
  onOpenReset,
  onEdit,
  onToggleLock,
  onAssignToCompare,
  onOpenDelete,
  onCloseEditor,
}: {
  buttonSize: "desktop" | "mobile";
  selectedMember?: EditableMember;
  detailsOpen: boolean;
  editorOpen: boolean;
  onToggleDetails: () => void;
  onOpenReset: () => void;
  onEdit: () => void;
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
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onEdit}
        aria-label="Editar slot seleccionado"
        className={clsx(buttonClass, "border-line text-muted")}
      >
        <Pencil className={iconClass} />
      </Button>
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
        aria-label={showCloseDockAction ? "Cerrar menu flotante" : "Mandar Pokemon seleccionado a caja"}
        className={clsx(buttonClass, "border-danger-line text-danger hover:bg-danger-fill")}
      >
        <X className={iconClass} />
      </Button>
    </>
  );
}
