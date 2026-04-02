import { TYPE_COLORS } from "@/lib/domain/typeChart";

export function getTypedSurfaceStyle(
  types: string[],
  options?: {
    primaryGlowMix?: number;
    secondaryGlowMix?: number;
    primaryBodyMix?: number;
    secondaryBodyMix?: number;
  },
) {
  const primary = TYPE_COLORS[types[0] ?? ""] ?? "hsl(169 37% 68%)";
  const secondary = TYPE_COLORS[types[1] ?? types[0] ?? ""] ?? primary;
  const primaryGlowMix = options?.primaryGlowMix ?? 20;
  const secondaryGlowMix = options?.secondaryGlowMix ?? 18;
  const primaryBodyMix = options?.primaryBodyMix ?? 10;
  const secondaryBodyMix = options?.secondaryBodyMix ?? 9;

  return {
    backgroundColor: "var(--roster-card-core)",
    backgroundImage: `
      radial-gradient(circle at 14% 14%, color-mix(in srgb, ${primary} ${primaryGlowMix}%, transparent) 0%, transparent 34%),
      radial-gradient(circle at 86% 84%, color-mix(in srgb, ${secondary} ${secondaryGlowMix}%, transparent) 0%, transparent 38%),
      linear-gradient(160deg, color-mix(in srgb, ${primary} ${primaryBodyMix}%, var(--roster-card-core)) 0%, var(--roster-card-core) 42%, color-mix(in srgb, ${secondary} ${secondaryBodyMix}%, var(--roster-card-core-strong)) 100%)
    `,
  } as const;
}
