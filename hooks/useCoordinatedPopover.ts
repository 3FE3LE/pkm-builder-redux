"use client";

import { useEffect, type RefObject } from "react";

type CoordinationDetail = {
  group?: string;
  id?: string;
};

export function useCoordinatedPopover({
  open,
  coordinationGroup,
  coordinationEventName,
  coordinationId,
  rootRef,
  panelRef,
  onClose,
}: {
  open: boolean;
  coordinationGroup?: string;
  coordinationEventName: string;
  coordinationId: string;
  rootRef: RefObject<HTMLElement | null>;
  panelRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!open) {
        return;
      }

      const target = event.target as Node;
      const insideRoot = rootRef.current?.contains(target);
      const insidePanel = panelRef?.current?.contains(target);
      if (!insideRoot && !insidePanel) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (open && event.key === "Escape") {
        onClose();
      }
    }

    function handleCoordinatedOpen(event: Event) {
      if (!coordinationGroup) {
        return;
      }

      const detail = (event as CustomEvent<CoordinationDetail>).detail;
      if (detail?.group === coordinationGroup && detail.id !== coordinationId) {
        onClose();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    if (coordinationGroup) {
      window.addEventListener(coordinationEventName, handleCoordinatedOpen);
    }

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      if (coordinationGroup) {
        window.removeEventListener(coordinationEventName, handleCoordinatedOpen);
      }
    };
  }, [
    open,
    coordinationGroup,
    coordinationEventName,
    coordinationId,
    rootRef,
    panelRef,
    onClose,
  ]);
}
