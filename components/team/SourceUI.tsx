"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { useMemo } from "react";

import { ItemSprite } from "@/components/BuilderShared";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
type DecisionDelta = ReturnType<typeof import("@/lib/domain/decisionDelta").buildDecisionDeltas>[number];

type RecommendedMember = {
  species: string;
  source: string;
  reason: string;
  role: string;
  roleLabel: string;
  teamFitNote: string;
  roleReason: string;
  area?: string;
};

export type AreaSource = {
  area: string;
  encounters: string[];
  gifts: string[];
  trades: string[];
  items: string[];
};

export function RecommendedCard({
  member,
  delta,
}: {
  member: RecommendedMember;
  delta?: DecisionDelta;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="panel rounded-3xl p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-face text-lg">{member.species}</p>
          <p className="mt-1 text-sm text-muted">{member.reason}</p>
        </div>
        <span className="accent-chip rounded-[6px] px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
          {member.source}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-[6px] border border-accent-line bg-accent-fill px-3 py-1 text-accent-soft">
          {member.roleLabel}
        </span>
        <span className="rounded-[6px] border border-line px-3 py-1">{member.role}</span>
        {member.area ? (
          <span className="rounded-[6px] border border-line px-3 py-1">
            {member.area}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-muted">{member.teamFitNote}</p>
        <p className="text-xs text-muted">{member.roleReason}</p>
      </div>
      {delta ? (
        <div className="mt-4 rounded-[0.85rem] border border-accent-line-soft bg-accent-fill-soft p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="display-face text-xs text-accent">
                {delta.action === "add"
                  ? "Mejor como slot nuevo"
                  : delta.action === "skip"
                    ? "No hay slot elegible"
                  : delta.replacedSlot
                    ? `Mejor si reemplaza a ${delta.replacedSlot}`
                    : "Impacto estimado"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {delta.action === "skip"
                  ? "Todos los slots candidatos estan locked o fuera de regla."
                  : delta.riskDelta >= 0
                  ? `Risk ${formatSigned(-delta.riskDelta)} -> ${delta.projectedRisk.toFixed(1)}/10`
                  : `Sube el riesgo ${formatSigned(Math.abs(delta.riskDelta))} si entra ahora`}
              </p>
            </div>
            <div className="rounded-[0.65rem] border border-line bg-surface-3 px-3 py-2 text-right">
              <p className={clsx("display-face text-sm", delta.scoreDelta >= 0 ? "text-accent-soft" : "text-danger-soft")}>
                {delta.action === "skip" ? "locked" : `${formatSigned(delta.scoreDelta)} score`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={deltaChipClass(delta.offenseDelta)}>Off {formatSigned(delta.offenseDelta)}</span>
            <span className={deltaChipClass(delta.defenseDelta)}>Def {formatSigned(delta.defenseDelta)}</span>
            <span className={deltaChipClass(delta.speedDelta)}>Spe {formatSigned(delta.speedDelta)}</span>
            <span className={deltaChipClass(delta.rolesDelta)}>Rol {formatSigned(delta.rolesDelta)}</span>
            <span className={deltaChipClass(delta.consistencyDelta)}>Cons {formatSigned(delta.consistencyDelta)}</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-muted">
              Entra como <span className="text-text">{delta.roleLabel}</span>. {delta.teamFitNote}
            </p>
            <p className="text-xs text-muted">{delta.roleReason}</p>
          </div>
          {delta.gains.length ? (
            <p className="mt-3 text-xs text-muted">Gana: {delta.gains.join(" · ")}</p>
          ) : null}
          {delta.losses.length ? (
            <p className="mt-2 text-xs text-muted">Pierde: {delta.losses.join(" · ")}</p>
          ) : null}
          {delta.projectedMoves.length ? (
            <p className="mt-2 text-xs text-muted">Moves proyectados: {delta.projectedMoves.join(" / ")}</p>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function deltaChipClass(value: number) {
  return clsx(
    "rounded-[6px] border px-2.5 py-1 text-[11px]",
    value >= 4
      ? "border-accent-line bg-accent-fill-strong text-accent-soft"
      : value <= -4
        ? "border-danger-line bg-danger-fill text-danger-soft"
        : "border-line bg-surface-3 text-muted",
  );
}

function SourceCount({
  label,
  count,
  tone = "muted",
}: {
  label: string;
  count: number;
  tone?: "accent" | "muted";
}) {
  return (
    <span
      className={clsx(
        "display-face rounded-[6px] border px-3 py-1 text-[10px] tracking-[0.14em]",
        tone === "accent"
          ? "border-accent-line-strong bg-accent-fill-strong text-accent-soft"
          : "border-line bg-surface-3 text-muted",
      )}
    >
      {label} {count}
    </span>
  );
}

function SourceList({
  title,
  entries,
  activeSpecies,
}: {
  title: string;
  entries: string[];
  activeSpecies?: string;
}) {
  const normalizedActive = normalizeName(activeSpecies ?? "");
  const filtered = entries.filter(Boolean);

  return (
    <div className="rounded-[0.75rem] border border-line bg-surface-1 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="display-face text-xs text-accent">{title}</p>
        <SourceCount label="count" count={filtered.length} />
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.length ? (
          filtered.map((entry, index) => {
            const isActiveMatch =
              normalizedActive && normalizeName(entry).includes(normalizedActive);
            return (
              <span
                key={`${title}-${index}-${entry}`}
                className={clsx(
                  "rounded-[6px] border px-3 py-1 text-xs",
                  isActiveMatch
                    ? "border-primary-line-strong bg-primary-fill-strong text-primary-soft"
                    : "border-line bg-surface-3 text-muted",
                )}
              >
                {entry}
              </span>
            );
          })
        ) : (
          <span className="text-sm text-muted">Nada registrado.</span>
        )}
      </div>
    </div>
  );
}

export function AreaSourceCard({
  source,
  activeSpecies,
  speciesCatalog,
  itemCatalog,
}: {
  source: AreaSource;
  activeSpecies?: string;
  speciesCatalog: { name: string; dex: number }[];
  itemCatalog: { name: string; effect?: string; sprite?: string | null }[];
}) {
  const dexByName = useMemo(
    () =>
      Object.fromEntries(
        speciesCatalog.map((entry) => [normalizeName(entry.name), entry.dex]),
      ) as Record<string, number>,
    [speciesCatalog],
  );
  const itemByName = useMemo(
    () =>
      Object.fromEntries(
        itemCatalog.map((entry) => [normalizeName(entry.name), entry]),
      ) as Record<string, { name: string; effect?: string; sprite?: string | null }>,
    [itemCatalog],
  );
  const groups = [
    { title: "Wild", entries: source.encounters },
    { title: "Gift", entries: source.gifts },
    { title: "Trade", entries: source.trades },
    { title: "Item", entries: source.items },
  ].filter((group) => group.entries.length);

  return (
    <article className="rounded-[0.85rem] border border-line px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <p className="display-face text-sm text-accent">{source.area}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceCount label="wild" count={source.encounters.length} tone="accent" />
          <SourceCount label="gift" count={source.gifts.length} />
          <SourceCount label="trade" count={source.trades.length} />
          <SourceCount label="item" count={source.items.length} />
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        {groups.map((group) => (
          <InlineSourceRow
            key={`${source.area}-${group.title}`}
            title={group.title}
            entries={group.entries}
            activeSpecies={activeSpecies}
            dexByName={dexByName}
            itemByName={itemByName}
          />
        ))}
      </div>
    </article>
  );
}

function InlineSourceRow({
  title,
  entries,
  activeSpecies,
  dexByName,
  itemByName,
}: {
  title: string;
  entries: string[];
  activeSpecies?: string;
  dexByName: Record<string, number>;
  itemByName: Record<string, { name: string; effect?: string; sprite?: string | null }>;
}) {
  const normalizedActive = normalizeName(activeSpecies ?? "");

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="display-face text-[11px] text-accent">{title}</p>
        {title === "Item" ? null : <SourceCount label="count" count={entries.length} />}
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry, index) =>
          title === "Item" ? (
            <ItemEntryChip
              key={`${title}-${index}-${entry}`}
              entry={entry}
              itemByName={itemByName}
              dexByName={dexByName}
            />
          ) : title === "Trade" ? (
            <TradeEntryChip
              key={`${title}-${index}-${entry}`}
              entry={entry}
              dexByName={dexByName}
              itemByName={itemByName}
            />
          ) : (
            <PokemonEntryChip
              key={`${title}-${index}-${entry}`}
              entry={entry}
              dexByName={dexByName}
              highlighted={Boolean(normalizedActive && normalizeName(entry).includes(normalizedActive))}
            />
          ),
        )}
      </div>
    </div>
  );
}

function PokemonEntryChip({
  entry,
  dexByName,
  highlighted,
}: {
  entry: string;
  dexByName: Record<string, number>;
  highlighted: boolean;
}) {
  const species = entry.split(" (")[0]?.trim() ?? entry;
  const dex = resolveSourceDex(species, dexByName);
  const sprites = buildSpriteUrls(species, dex);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 px-0 py-0 text-xs",
        highlighted
          ? "text-primary-soft"
          : "text-muted",
      )}
    >
      <SourceSprite species={species} spriteUrl={sprites.spriteUrl} />
      <span>{entry}</span>
    </span>
  );
}

function TradeEntryChip({
  entry,
  dexByName,
  itemByName,
}: {
  entry: string;
  dexByName: Record<string, number>;
  itemByName: Record<string, { name: string; effect?: string; sprite?: string | null }>;
}) {
  const { primary, reference } = parseSourceRelation(entry);
  const received = primary ?? entry;
  const dex = resolveSourceDex(received, dexByName);
  const sprites = buildSpriteUrls(received, dex);

  return (
    <span className="inline-flex items-center gap-2 px-0 py-0 text-xs text-muted">
      <SourceSprite species={received} spriteUrl={sprites.spriteUrl} />
      <span>{entry}</span>
      {reference ? (
        <ReferencedThingSprite
          label={reference}
          dexByName={dexByName}
          itemByName={itemByName}
        />
      ) : null}
    </span>
  );
}

function ItemEntryChip({
  entry,
  itemByName,
  dexByName,
}: {
  entry: string;
  itemByName: Record<string, { name: string; effect?: string; sprite?: string | null }>;
  dexByName: Record<string, number>;
}) {
  const { primary, reference } = parseSourceRelation(entry);
  const itemName = (primary ?? entry).replace(/\s+x\d+$/i, "").trim();
  const details = itemByName[normalizeName(itemName)];

  return (
    <span className="group relative inline-flex items-center gap-2 px-0 py-0 text-xs text-muted">
      <ItemSprite name={itemName} sprite={details?.sprite} chrome="plain" />
      <span>{entry}</span>
      {reference ? (
        <ReferencedThingSprite
          label={reference}
          dexByName={dexByName}
          itemByName={itemByName}
        />
      ) : null}
      {details?.effect ? (
        <span className="status-popover pointer-events-none absolute left-1/2 top-[calc(100%+0.45rem)] z-20 hidden w-64 -translate-x-1/2 rounded-[6px] border border-line px-3 py-2 text-xs leading-5 text-text group-hover:block">
          {details.effect}
        </span>
      ) : null}
    </span>
  );
}

function SourceSprite({
  species,
  spriteUrl,
}: {
  species: string;
  spriteUrl?: string;
}) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[4px]">
      {spriteUrl ? (
        <img src={spriteUrl} alt={species} className="h-7 w-7 object-contain pixelated" />
      ) : (
        <span className="text-[9px] text-muted">{species.slice(0, 3)}</span>
      )}
    </span>
  );
}

function ReferencedThingSprite({
  label,
  dexByName,
  itemByName,
}: {
  label: string;
  dexByName: Record<string, number>;
  itemByName: Record<string, { name: string; effect?: string; sprite?: string | null }>;
}) {
  const cleanLabel = label.replace(/\s+x\d+$/i, "").trim();
  const item = itemByName[normalizeName(cleanLabel)];
  if (item?.sprite) {
    return <ItemSprite name={cleanLabel} sprite={item.sprite} chrome="plain" />;
  }

  const dex = resolveSourceDex(cleanLabel, dexByName);
  const sprites = buildSpriteUrls(cleanLabel, dex);
  return <SourceSprite species={cleanLabel} spriteUrl={sprites.spriteUrl} />;
}

function parseSourceRelation(entry: string) {
  if (entry.includes("->")) {
    const [left, right] = entry.split("->").map((part) => part.trim());
    return { primary: left || entry, reference: right || null };
  }

  if (entry.includes(" for ")) {
    const [left, right] = entry.split(" for ").map((part) => part.trim());
    return { primary: left || entry, reference: right || null };
  }

  return { primary: entry, reference: null };
}

function resolveSourceDex(species: string, dexByName: Record<string, number>) {
  const normalized = normalizeName(species);
  const exactDex = dexByName[normalized];
  if (exactDex) {
    return exactDex;
  }
  if (normalized.startsWith("rotom-")) {
    return dexByName.rotom;
  }
  return dexByName[normalized.split("-")[0]];
}
