import type {
  AbilityEffect,
  MoveEffect,
  ItemEffect,
  SynergyRule,
  SynergyMatch,
} from "./types";

/**
 * Synergy rules define abstract effect combinations that produce ceiling value.
 * Rules are matched by effect KIND, never by ability/move/item NAME.
 *
 * Rules that share a prefix (e.g. "invert-selfdrop" and "invert-base") are
 * deduplicated: only the highest-scoring match per prefix is kept.
 */
export const SYNERGY_RULES: SynergyRule[] = [
  // ── Stat Inversion Snowball ──
  {
    id: "invert-selfdrop",
    requires: { abilityKind: ["invertStatChanges"], moveKind: ["selfDropDamage"] },
    score: 5.6,
    tag: "snowball",
    explanation:
      "Habilidad que invierte stat drops + move de self-drop = snowball ofensivo.",
  },
  {
    id: "invert-base",
    requires: { abilityKind: ["invertStatChanges"] },
    score: 1.4,
    tag: "ceiling-passive",
    explanation:
      "Inversión de stat changes abre opciones no evidentes.",
  },

  // ── Speed Scaling ──
  {
    id: "autospeed-protect",
    requires: { abilityKind: ["autoSpeedBoost"], moveKind: ["protection"] },
    score: 4.0,
    tag: "speed-snowball",
    explanation:
      "Auto-boost de speed + Protect permite acumular velocidad de forma segura.",
  },
  {
    id: "autospeed-base",
    requires: { abilityKind: ["autoSpeedBoost"] },
    score: 3.2,
    tag: "speed-passive",
    explanation:
      "Speed boost pasivo eleva el ceiling del slot cada turno.",
  },

  // ── Low-Power Amplification ──
  {
    id: "lowpower-spike",
    requires: {
      abilityKind: ["lowPowerAmplify"],
      moveKind: ["priority"],
      minMoveMatches: 2,
    },
    score: 2.8,
    tag: "tech-spike",
    explanation:
      "Amplificador de moves débiles + prioridad múltiple = tempo real.",
  },
  {
    id: "lowpower-base",
    requires: { abilityKind: ["lowPowerAmplify"] },
    score: 1.2,
    tag: "tech-passive",
    explanation: "Amplifica moves de baja potencia, mejorando versatilidad.",
  },

  // ── Priority Status Control ──
  {
    id: "priostatus-control",
    requires: {
      abilityKind: ["priorityOnStatus"],
      moveKind: ["status", "speedControl", "screen", "antiSetup"],
    },
    score: 2.6,
    tag: "priority-control",
    explanation:
      "Status con prioridad convierte utility ordinaria en control del turno.",
  },

  // ── Raw Offensive Multiplier ──
  {
    id: "offmult-base",
    requires: { abilityKind: ["offensiveMultiplier"] },
    score: 3.6,
    tag: "raw-power",
    explanation:
      "Multiplicador ofensivo eleva el techo de daño real del slot.",
  },

  // ── Status-Powered Offense ──
  {
    id: "statuspow-facade",
    requires: { abilityKind: ["statusPowerUp"], moveKind: ["statusBoostedDamage"] },
    score: 2.8,
    tag: "status-wallbreak",
    explanation:
      "Habilidad de status + Facade = línea de wallbreaking excepcional.",
  },
  {
    id: "statuspow-orb",
    requires: { abilityKind: ["statusPowerUp"], itemKind: ["statusOrb"] },
    score: 1.5,
    tag: "self-activate",
    explanation:
      "Auto-activar status garantiza el power-up sin depender del rival.",
  },
  {
    id: "statuspow-base",
    requires: { abilityKind: ["statusPowerUp"] },
    score: 0.8,
    tag: "status-upside",
    explanation:
      "Habilidad activa al recibir status, convirtiendo debilidad en ventaja.",
  },

  // ── Pivot Recovery ──
  {
    id: "regen-pivot",
    requires: { abilityKind: ["pivotRecovery"], moveKind: ["pivot"] },
    score: 2.1,
    tag: "sustainable-pivot",
    explanation:
      "Recuperación al pivotar crea un ciclo de switch sostenible.",
  },
  {
    id: "regen-base",
    requires: { abilityKind: ["pivotRecovery"] },
    score: 0.9,
    tag: "regen-passive",
    explanation:
      "Recuperación pasiva al switchear mejora longevidad del slot.",
  },

  // ── Weather Speed ──
  {
    id: "weatherspeed-base",
    requires: { abilityKind: ["weatherSpeed"] },
    score: 1.8,
    tag: "weather-speed",
    explanation:
      "Duplica speed bajo weather, convirtiendo al slot en sweeper condicional.",
  },

  // ── Download ──
  {
    id: "download-base",
    requires: { abilityKind: ["download"] },
    score: 1.6,
    tag: "auto-boost",
    explanation:
      "Boost automático de ofensa al entrar, sin turno de setup.",
  },

  // ── Serene Grace ──
  {
    id: "serenegrace-base",
    requires: { abilityKind: ["sereneGrace"] },
    score: 1.4,
    tag: "secondary-amp",
    explanation:
      "Duplica tasas de efectos secundarios, mejorando flinch/status chance.",
  },

  // ── Sheer Force ──
  {
    id: "sheerforce-lifeorb",
    requires: { abilityKind: ["sheerForce"], itemKind: ["lifeOrb"] },
    score: 2.4,
    tag: "force-orb",
    explanation:
      "Sheer Force + Life Orb = boost ofensivo sin recoil.",
  },
  {
    id: "sheerforce-base",
    requires: { abilityKind: ["sheerForce"] },
    score: 1.2,
    tag: "force-passive",
    explanation:
      "Boost de daño en moves con efectos secundarios.",
  },

  // ── Adaptability ──
  {
    id: "adaptability-base",
    requires: { abilityKind: ["adaptability"] },
    score: 1.4,
    tag: "stab-boost",
    explanation:
      "STAB amplificado convierte moves mediocres en amenazas reales.",
  },

  // ── Setup + Priority (move-only synergy) ──
  {
    id: "setup-priority",
    requires: { moveKind: ["setup", "priority"] },
    score: 1.4,
    tag: "setup-close",
    explanation:
      "Setup + prioridad permite cerrar partidas una vez boosteado.",
  },

  // ── Hazards + Phazing ──
  {
    id: "hazard-phaze",
    requires: { moveKind: ["hazard", "antiSetup"] },
    score: 1.2,
    tag: "hazard-stack",
    explanation:
      "Hazards + phazing acumula daño pasivo al forzar switches.",
  },

  // ── Recovery (standalone) ──
  {
    id: "recovery-base",
    requires: { moveKind: ["recovery"] },
    score: 0.8,
    tag: "self-sustain",
    explanation:
      "Recuperación confiable permite mantener presencia prolongada.",
  },

  // ── Draining Offense ──
  {
    id: "draining-base",
    requires: { moveKind: ["draining"] },
    score: 0.6,
    tag: "drain-sustain",
    explanation:
      "Daño con drenaje combina ofensa con sostenibilidad.",
  },

  // ── Defensive Passives ──
  {
    id: "magicguard-base",
    requires: { abilityKind: ["magicGuard"] },
    score: 1.2,
    tag: "passive-defense",
    explanation:
      "Inmunidad a daño indirecto (hazards, weather, status) mejora longevidad.",
  },
  {
    id: "multiscale-base",
    requires: { abilityKind: ["multiscale"] },
    score: 1.0,
    tag: "entry-tank",
    explanation:
      "Reduce daño al entrar con HP full, facilitando setup seguro.",
  },
  {
    id: "magicbounce-base",
    requires: { abilityKind: ["magicBounce"] },
    score: 1.2,
    tag: "bounce-control",
    explanation:
      "Rebota hazards y status, controlando el campo pasivamente.",
  },
  {
    id: "intimidate-base",
    requires: { abilityKind: ["intimidate"] },
    score: 1.0,
    tag: "atk-suppress",
    explanation:
      "Reduce ataque rival al entrar, mejorando el bulk efectivo del equipo.",
  },

  // ── Eviolite ──
  {
    id: "eviolite-base",
    requires: { itemKind: ["eviolite"] },
    score: 1.4,
    tag: "evo-bulk",
    explanation:
      "Eviolite eleva el bulk de NFE por encima de muchos fully evolved.",
  },
];

/**
 * Evaluate which synergy rules a Pokémon matches based on its resolved effects.
 * Returns deduplicated matches (most specific rule wins per prefix group).
 */
export function evaluateSynergies(
  abilityEffects: AbilityEffect[],
  moveEffects: MoveEffect[],
  itemEffects: ItemEffect[],
): SynergyMatch[] {
  const abilityKinds = new Set(abilityEffects.map((e) => e.kind));
  const moveKinds = moveEffects.map((e) => e.kind);
  const moveKindSet = new Set(moveKinds);
  const itemKinds = new Set(itemEffects.map((e) => e.kind));

  const matches: SynergyMatch[] = [];

  for (const rule of SYNERGY_RULES) {
    const { requires } = rule;

    if (requires.abilityKind) {
      if (!requires.abilityKind.some((k) => abilityKinds.has(k))) continue;
    }

    if (requires.moveKind) {
      const minMatches = requires.minMoveMatches ?? 1;
      if (minMatches === 1) {
        if (!requires.moveKind.some((k) => moveKindSet.has(k))) continue;
      } else {
        const count = moveKinds.filter((k) =>
          requires.moveKind!.includes(k),
        ).length;
        if (count < minMatches) continue;
      }
    }

    if (requires.itemKind) {
      if (!requires.itemKind.some((k) => itemKinds.has(k))) continue;
    }

    matches.push({
      ruleId: rule.id,
      score: rule.score,
      tag: rule.tag,
      explanation: rule.explanation,
    });
  }

  return deduplicateSynergies(matches);
}

/**
 * Deduplicate synergies by prefix group.
 * "invert-selfdrop" (5.6) subsumes "invert-base" (1.4).
 * Keeps only the highest-scoring match per prefix.
 */
function deduplicateSynergies(matches: SynergyMatch[]): SynergyMatch[] {
  const byPrefix = new Map<string, SynergyMatch>();
  for (const m of matches) {
    const prefix = m.ruleId.split("-")[0];
    const existing = byPrefix.get(prefix);
    if (!existing || m.score > existing.score) {
      byPrefix.set(prefix, m);
    }
  }
  return Array.from(byPrefix.values());
}
