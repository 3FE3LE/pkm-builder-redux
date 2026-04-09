"use client";

import clsx from "clsx";
import Link from "next/link";
import { ChevronLeft, GitCompareArrows, Info, Lock, LockOpen, Pencil, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { EditableMember } from "@/lib/builderStore";
import { markNavigationStart } from "@/lib/perf";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

const actionDockLinkBaseClassName = "inline-flex items-center justify-center";
const actionDockButtonBaseClassName =
  "app-dock-button border border-line-strong bg-surface-3 text-text hover:bg-surface-6";
const actionDockButtonDesktopClassName = `${actionDockButtonBaseClassName} size-9`;
const actionDockButtonMobileClassName = `${actionDockButtonBaseClassName} size-11`;
const actionDockDangerClassName = "border-danger-line text-danger hover:bg-danger-fill";
const actionDockDangerSoftClassName = "border-danger-line-soft text-danger hover:bg-danger-fill";
const actionDockMutedClassName = "border-line text-muted";
const actionDockPrimaryClassName = "border-line-strong text-text";
const actionDockInfoActiveClassName = "border-info-line bg-info-fill text-info-soft";
const actionDockWarningClassName = "border-warning-line text-warning-strong";

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
  const backTransition = useSafeTransitionTypes(["editor-back"]);
  const forwardTransition = useSafeTransitionTypes(
    editTransitionTypes ?? ["editor-forward"],
  );

  if (!selectedMember) {
    return null;
  }

  const isDesktop = buttonSize === "desktop";
  const showCloseDockAction = !isDesktop && editorOpen;
  const buttonClass = isDesktop
    ? actionDockButtonDesktopClassName
    : actionDockButtonMobileClassName;
  const iconClass = isDesktop ? "h-4 w-4" : "h-5 w-5";
  const editLabel = editAriaLabel ?? "Editar slot seleccionado";
  const editNode = editIcon === "back" ? <ChevronLeft className={iconClass} /> : <Pencil className={iconClass} />;
  const showDetailsAction = !editorOpen;
  const showEditAction = !editorOpen;
  const showLockAction = !editorOpen;

  if (mode === "close-only") {
    if (closeHref) {
      return (
        <Link
          href={closeHref}
          transitionTypes={backTransition}
          aria-label="Volver al team"
          className={clsx(
            actionDockLinkBaseClassName,
            buttonClass,
            actionDockDangerClassName,
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
        className={clsx(buttonClass, actionDockDangerClassName)}
      >
        <X className={iconClass} />
      </Button>
    );
  }

  return (
    <>
      {showDetailsAction ? (
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={onToggleDetails}
          aria-label={detailsOpen ? "Ocultar info del slot seleccionado" : "Mostrar info del slot seleccionado"}
          className={clsx(
            buttonClass,
            detailsOpen ? actionDockInfoActiveClassName : actionDockMutedClassName,
          )}
        >
          <Info className={iconClass} />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onOpenReset}
        aria-label="Resetear slot seleccionado"
        className={clsx(buttonClass, actionDockDangerSoftClassName)}
      >
        <RotateCcw className={iconClass} />
      </Button>
      {showEditAction ? (
        editHref ? (
          <Link
            href={editHref}
            prefetch
            transitionTypes={forwardTransition}
            aria-label={editLabel}
            className={clsx(
              actionDockLinkBaseClassName,
              buttonClass,
              actionDockPrimaryClassName,
            )}
            onClick={() => markNavigationStart("roster-to-editor", editHref)}
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
            className={clsx(buttonClass, actionDockPrimaryClassName)}
          >
            {editNode}
          </Button>
        )
      ) : null}
      {showLockAction ? (
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={onToggleLock}
          aria-label={selectedMember.locked ? "Desbloquear slot seleccionado" : "Bloquear slot seleccionado"}
          className={clsx(
            buttonClass,
            selectedMember.locked
              ? actionDockWarningClassName
              : actionDockMutedClassName,
          )}
        >
          {selectedMember.locked ? <Lock className={iconClass} /> : <LockOpen className={iconClass} />}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size={isDesktop ? "icon-sm" : "icon-lg"}
        onClick={onAssignToCompare}
        aria-label="Comparar slot seleccionado"
        className={clsx(buttonClass, actionDockMutedClassName)}
      >
        <GitCompareArrows className={iconClass} />
      </Button>
      {showCloseDockAction && closeHref ? (
        <Link
          href={closeHref}
          transitionTypes={backTransition}
          aria-label="Volver al team"
          className={clsx(
            actionDockLinkBaseClassName,
            buttonClass,
            actionDockDangerClassName,
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
          className={clsx(buttonClass, actionDockDangerClassName)}
        >
          <X className={iconClass} />
        </Button>
      )}
    </>
  );
}
