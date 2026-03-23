export function normalizeName(input?: string | null) {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

export function formatName(input: string) {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function buildSpriteUrls(_name: string, dexNumber?: number) {
  const normalizedName = normalizeName(_name);
  if (normalizedName === "darmanitan-zen") {
    const formId = 10017;
    return {
      spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${formId}.png`,
      animatedSpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${formId}.gif`,
    };
  }

  const gen5Base = dexNumber
    ? "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white"
    : undefined;

  return {
    spriteUrl: gen5Base ? `${gen5Base}/${dexNumber}.png` : undefined,
    animatedSpriteUrl: gen5Base ? `${gen5Base}/animated/${dexNumber}.gif` : undefined,
  };
}
