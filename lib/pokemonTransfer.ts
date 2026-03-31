import { genderOptions, natureOptions } from "@/lib/builderForm";
import { createEditable, type EditableMember } from "@/lib/builderStore";
import { absoluteUrl } from "@/lib/site";
import abilityNameList from "@/data/reference/ability-name-list-gen5.json";
import itemNameList from "@/data/reference/item-name-list-gen5.json";
import moveNameList from "@/data/reference/move-name-list-gen5.json";
import { z } from "zod";

const TOKEN_PREFIX_V3 = "PKMRDX3";
const SHARE_PARAM = "m";
const SPREAD_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const abilityNameIndex = buildNameIndex(abilityNameList);
const itemNameIndex = buildNameIndex(itemNameList);
const moveNameIndex = buildNameIndex(moveNameList);

type ExportableMember = Omit<EditableMember, "id">;

const portableMemberSchema = z.object({
  species: z.string().trim().min(1),
  nickname: z.string().trim().max(24),
  locked: z.boolean(),
  shiny: z.boolean(),
  level: z.number().int().min(1).max(100),
  gender: z.enum(genderOptions),
  nature: z.string().refine((value) => natureOptions.includes(value as (typeof natureOptions)[number])),
  ability: z.string().trim(),
  item: z.string().trim().max(40),
  moves: z.array(z.string().trim().min(1)).max(4),
  ivs: z.object({
    hp: z.number().int().min(0).max(31),
    atk: z.number().int().min(0).max(31),
    def: z.number().int().min(0).max(31),
    spa: z.number().int().min(0).max(31),
    spd: z.number().int().min(0).max(31),
    spe: z.number().int().min(0).max(31),
  }),
  evs: z.object({
    hp: z.number().int().min(0).max(252),
    atk: z.number().int().min(0).max(252),
    def: z.number().int().min(0).max(252),
    spa: z.number().int().min(0).max(252),
    spd: z.number().int().min(0).max(252),
    spe: z.number().int().min(0).max(252),
  }),
});

export function exportPokemonToHash(member: EditableMember) {
  return `${TOKEN_PREFIX_V3}.${encodeBase64Url(serializeMemberV3(toExportableMember(member)))}`;
}

export function buildPokemonShareUrl(member: EditableMember) {
  const token = getBareToken(exportPokemonToHash(member));
  return absoluteUrl(`/team/share/${token}`);
}

export function importPokemonFromHash(input: string) {
  const token = extractToken(input.trim());
  if (!token) {
    return invalidFormat();
  }

  if (token.prefix === TOKEN_PREFIX_V3) {
    return importV3Token(token.body);
  }

  return invalidFormat();
}

function importV3Token(body: string) {
  try {
    const parsed = portableMemberSchema.safeParse(deserializeMemberV3(decodeBase64Url(body)));
    if (!parsed.success) {
      return invalidFormat();
    }
    return {
      ok: true as const,
      member: hydrateImportedMember(parsed.data),
    };
  } catch {
    return {
      ok: false as const,
      error: "No se pudo decodificar el token del Pokémon.",
    };
  }
}

function toExportableMember(member: EditableMember): ExportableMember {
  return {
    species: member.species,
    nickname: member.nickname,
    locked: member.locked,
    shiny: member.shiny,
    level: member.level,
    gender: member.gender,
    nature: member.nature,
    ability: member.ability,
    item: member.item,
    moves: member.moves,
    ivs: member.ivs,
    evs: member.evs,
  };
}

function serializeMemberV3(member: ExportableMember) {
  const flags = Number(member.locked) | (Number(member.shiny) << 1);
  const genderIndex = genderOptions.indexOf(member.gender);
  const natureIndex = natureOptions.indexOf(member.nature as (typeof natureOptions)[number]);

  return [
    member.species,
    member.nickname === member.species ? "" : member.nickname,
    flags.toString(36),
    member.level === 5 ? "" : member.level.toString(36),
    genderIndex <= 0 ? "" : genderIndex.toString(36),
    natureIndex <= 0 ? "" : natureIndex.toString(36),
    encodeNamedValue(member.ability, abilityNameIndex),
    encodeNamedValue(member.item, itemNameIndex),
    member.moves.map((move) => encodeNamedValue(move, moveNameIndex)).join("^"),
    packSpread(member.ivs),
    packSpread(member.evs),
  ].join("~");
}

function deserializeMemberV3(serialized: string): ExportableMember {
  const [species, nickname, flagsText, levelText, genderText, natureText, ability, item, movesText, ivsText, evsText] =
    serialized.split("~");

  const flags = parseBase36(flagsText, 0);
  const genderIndex = parseBase36(genderText, 0);
  const natureIndex = parseBase36(natureText, 0);

  return {
    species: species ?? "",
    nickname: nickname || species || "",
    locked: Boolean(flags & 1),
    shiny: Boolean(flags & 2),
    level: parseBase36(levelText, 5),
    gender: genderOptions[genderIndex] ?? "unknown",
    nature: natureOptions[natureIndex] ?? "Serious",
    ability: decodeNamedValue(ability, abilityNameList),
    item: decodeNamedValue(item, itemNameList),
    moves: movesText ? movesText.split("^").filter(Boolean).map((move) => decodeNamedValue(move, moveNameList)) : [],
    ivs: unpackSpread(ivsText, 31),
    evs: unpackSpread(evsText, 252),
  };
}

function hydrateImportedMember(member: ExportableMember): EditableMember {
  const next = createEditable(member.species, member.locked);

  return {
    ...next,
    ...member,
    nickname: member.nickname || member.species,
  };
}

function packSpread(spread: ExportableMember["ivs"] | ExportableMember["evs"]) {
  const isAllZero = SPREAD_KEYS.every((key) => (spread[key] ?? 0) === 0);
  if (isAllZero) {
    return "";
  }

  return SPREAD_KEYS.map((key) => Math.max(0, spread[key] ?? 0).toString(36)).join(".");
}

function unpackSpread(serialized: string | undefined, defaultMax: number) {
  const values = (serialized ?? "").split(".");

  return {
    hp: clampSpread(parseBase36(values[0], 0), defaultMax),
    atk: clampSpread(parseBase36(values[1], 0), defaultMax),
    def: clampSpread(parseBase36(values[2], 0), defaultMax),
    spa: clampSpread(parseBase36(values[3], 0), defaultMax),
    spd: clampSpread(parseBase36(values[4], 0), defaultMax),
    spe: clampSpread(parseBase36(values[5], 0), defaultMax),
  };
}

function clampSpread(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

function parseBase36(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 36);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractToken(input: string) {
  if (!input) {
    return null;
  }

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const tokenBody = url.searchParams.get(SHARE_PARAM);
      if (tokenBody) {
        return { prefix: TOKEN_PREFIX_V3, body: tokenBody };
      }

      const pathMatch = url.pathname.match(/\/team\/share\/([A-Za-z0-9_-]{16,})$/);
      return pathMatch ? { prefix: TOKEN_PREFIX_V3, body: pathMatch[1] } : null;
    } catch {
      return null;
    }
  }

  const prefixedMatch = input.match(/^(PKMRDX3)\.(.+)$/);
  if (prefixedMatch) {
    return {
      prefix: prefixedMatch[1] as typeof TOKEN_PREFIX_V3,
      body: prefixedMatch[2],
    };
  }

  if (/^[A-Za-z0-9_-]{16,}$/.test(input)) {
    return {
      prefix: TOKEN_PREFIX_V3,
      body: input,
    };
  }

  return null;
}

function getBareToken(hash: string) {
  const match = hash.match(/^PKMRDX3\.(.+)$/);
  return match?.[1] ?? hash;
}

function invalidFormat() {
  return {
    ok: false as const,
    error: "Formato de import inválido.",
  };
}

function encodeBase64Url(input: string) {
  const bytes = new TextEncoder().encode(input);
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : btoa(String.fromCharCode(...bytes));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  const bytes =
    typeof Buffer !== "undefined"
      ? Uint8Array.from(Buffer.from(padded, "base64"))
      : Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function buildNameIndex(values: string[]) {
  return new Map(values.map((value, index) => [value, index]));
}

function encodeNamedValue(value: string, index: Map<string, number>) {
  if (!value) {
    return "";
  }
  const matchedIndex = index.get(value);
  return matchedIndex == null ? `'${value}` : matchedIndex.toString(36);
}

function decodeNamedValue(value: string | undefined, values: string[]) {
  if (!value) {
    return "";
  }
  if (value.startsWith("'")) {
    return value.slice(1);
  }
  const index = parseBase36(value, -1);
  return values[index] ?? "";
}

export function inspectPokemonTransfer(input: string) {
  const imported = importPokemonFromHash(input);
  if (!imported.ok) {
    return null;
  }

  const { member } = imported;
  return {
    species: member.species,
    nickname: member.nickname,
    shiny: member.shiny,
    level: member.level,
    ability: member.ability,
    item: member.item,
    moves: member.moves,
  };
}
