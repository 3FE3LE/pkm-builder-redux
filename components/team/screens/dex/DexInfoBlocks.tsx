"use client";

import clsx from "clsx";

import { MoveSlotSurface } from "@/components/team/UI";
import {
  dexSectionCaptionClassName,
  dexStatChipClassName,
} from "@/components/team/screens/dex/DexShared";

const dexInfoCardClassName = "app-soft-panel p-3";
const dexInfoWarningPillClassName =
  "rounded-2xl border border-warning-line px-2 py-1 text-warning-strong";
const dexInfoAcquisitionEntryClassName =
  "app-soft-panel rounded-[0.7rem] px-2.5 py-1.5 text-xs leading-5 text-text";

export function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-0 py-0">
      <p className="micro-label text-text-faint">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function DexMoveEntryCard({
  move,
  eyebrow,
  compact = false,
}: {
  move: {
    name: string;
    type: string;
    damageClass: string;
    power?: number | null;
    accuracy?: number | null;
    pp?: number | null;
    priority?: number | null;
    description?: string;
  };
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <div className={clsx("rounded-[0.7rem]", compact ? "" : dexInfoCardClassName)}>
      {eyebrow ? <p className="mb-1 micro-label text-text-faint">{eyebrow}</p> : null}
      <MoveSlotSurface
        move={{
          name: move.name,
          type: move.type,
          hasStab: false,
          damageClass: move.damageClass,
          power: move.power,
          adjustedPower: move.power,
        }}
        className={clsx("w-full", compact && "px-2 py-1")}
      />
      {!compact ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            {move.accuracy ? (
              <span className={dexStatChipClassName}>
                Acc {move.accuracy}%
              </span>
            ) : null}
            {move.pp ? (
              <span className={dexStatChipClassName}>
                PP {move.pp}
              </span>
            ) : null}
            {move.priority ? (
              <span className={dexInfoWarningPillClassName}>
                Pri {move.priority > 0 ? `+${move.priority}` : move.priority}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            {move.description || "Sin descripcion registrada."}
          </p>
        </>
      ) : null}
    </div>
  );
}

export function AcquisitionList({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  const sliced = values.slice(0, 4);

  return (
    <div>
      <p className={dexSectionCaptionClassName}>{title}</p>
      {sliced.length ? (
        <div className="mt-1 flex flex-col gap-1.5">
          {sliced.map((value, index) => (
            <div
              key={`${title}-${value}-${index}`}
              className={dexInfoAcquisitionEntryClassName}
            >
              {value}
            </div>
          ))}
          {values.length > sliced.length ? (
            <p className="text-xs text-text-faint">+{values.length - sliced.length} entradas mas</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">Sin registro.</p>
      )}
    </div>
  );
}
