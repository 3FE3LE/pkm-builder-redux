"use client";

export function buildIvCalcHref(species: string) {
  return `/team/tools?tool=ivcalc&species=${encodeURIComponent(species)}`;
}
