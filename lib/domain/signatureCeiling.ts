import { normalizeName } from "./names";

type SignatureMoveLike =
  | string
  | {
      name: string;
      power?: number | null;
      damageClass?: string | null;
    };

function normalizeSignal(input: string) {
  return normalizeName(input).replace(/-/g, " ");
}

export function buildSignatureCeiling({
  ability,
  abilities = [],
  moves = [],
}: {
  ability?: string | null;
  abilities?: string[] | null;
  moves?: SignatureMoveLike[] | null;
}) {
  const abilityPool = new Set(
    [ability, ...(abilities ?? [])]
      .filter(Boolean)
      .map((entry) => normalizeSignal(String(entry))),
  );
  const moveNames = (moves ?? [])
    .map((move) => (typeof move === "string" ? move : move.name))
    .filter(Boolean)
    .map((move) => normalizeSignal(move));

  const notes: string[] = [];
  let score = 0;

  if (abilityPool.has("contrary")) {
    score += 1.4;
    if (hasAnyMove(moveNames, ["leaf storm", "draco meteor", "overheat", "superpower"])) {
      score += 4.2;
      notes.push("Contrary con move de self-drop convierte el slot en snowball real.");
    } else {
      notes.push("Contrary abre un techo de snowball por encima de lo que dicen los stats base.");
    }
  }

  if (abilityPool.has("speed boost")) {
    score += 3.2;
    notes.push("Speed Boost eleva mucho el ceiling incluso sin bulk excepcional.");
    if (hasAnyMove(moveNames, ["protect"])) {
      score += 0.8;
    }
  }

  if (abilityPool.has("technician")) {
    const technicianMoves = moveNames.filter((move) =>
      TECHNICIAN_SPIKE_MOVES.has(move),
    ).length;
    if (technicianMoves >= 2) {
      score += 2.8;
      notes.push("Technician empuja varios moves de tempo o chip por encima de lo aparente.");
    } else {
      score += 1.2;
    }
  }

  if (abilityPool.has("prankster") && hasAnyMove(moveNames, CONTROL_SPIKE_MOVES)) {
    score += 2.6;
    notes.push("Prankster convierte utility normal en control prioritario del turno.");
  }

  if ((abilityPool.has("huge power") || abilityPool.has("pure power"))) {
    score += 3.6;
    notes.push("La habilidad duplica el techo ofensivo real del slot.");
  }

  if (abilityPool.has("guts") && hasAnyMove(moveNames, ["facade"])) {
    score += 2.8;
    notes.push("Guts con Facade crea una línea de wallbreaking muy por encima de la media.");
  }

  if (abilityPool.has("regenerator") && hasAnyMove(moveNames, ["u-turn", "volt switch", "flip turn"])) {
    score += 2.1;
    notes.push("Regenerator con pivot move mejora mucho el valor repetible del slot.");
  }

  return {
    score: round(Math.min(8, score), 1),
    notes,
  };
}

const TECHNICIAN_SPIKE_MOVES = new Set([
  "bullet punch",
  "mach punch",
  "vacuum wave",
  "aqua jet",
  "icy wind",
  "electroweb",
  "fake out",
  "confusion",
  "swift",
  "shock wave",
  "pursuit",
  "struggle bug",
  "draining kiss",
]);

const CONTROL_SPIKE_MOVES = [
  "thunder wave",
  "tailwind",
  "encore",
  "taunt",
  "reflect",
  "light screen",
  "will-o-wisp",
  "leech seed",
  "spore",
];

function hasAnyMove(moveNames: string[], expected: Iterable<string>) {
  const pool = new Set(moveNames);
  for (const move of expected) {
    if (pool.has(normalize(move))) {
      return true;
    }
  }
  return false;
}

function normalize(input: string) {
  return normalizeSignal(input);
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}
