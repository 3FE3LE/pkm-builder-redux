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

export function buildSpriteUrls(
  _name: string,
  dexNumber?: number,
  options?: { shiny?: boolean },
) {
  const normalizedName = normalizeName(_name);
  const shiny = options?.shiny ?? false;
  const syntheticFormIds: Record<string, number> = {
    "deoxys-attack": 10001,
    "deoxys-defense": 10002,
    "deoxys-speed": 10003,
    "wormadam-sandy": 10004,
    "wormadam-trash": 10005,
    "shaymin-sky": 10006,
    "giratina-origin": 10007,
    "rotom-heat": 10008,
    "rotom-wash": 10009,
    "rotom-frost": 10010,
    "rotom-fan": 10011,
    "rotom-mow": 10012,
    "castform-sunny": 10013,
    "castform-rainy": 10014,
    "castform-snowy": 10015,
    "basculin-blue-striped": 10016,
    "darmanitan-zen": 10017,
    "meloetta-pirouette": 10018,
    "tornadus-therian": 10019,
    "thundurus-therian": 10020,
    "landorus-therian": 10021,
    "kyurem-black": 10022,
    "kyurem-white": 10023,
    "keldeo-resolute": 10024,
  };
  const formId = syntheticFormIds[normalizedName];
  if (formId) {
    return {
      spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? `shiny/${formId}` : formId}.png`,
      animatedSpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${shiny ? `shiny/${formId}` : formId}.gif`,
    };
  }

  const gen5Base = dexNumber
    ? "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white"
    : undefined;

  return {
    spriteUrl: gen5Base ? `${gen5Base}/${shiny ? "shiny/" : ""}${dexNumber}.png` : undefined,
    animatedSpriteUrl: gen5Base ? `${gen5Base}/animated/${shiny ? "shiny/" : ""}${dexNumber}.gif` : undefined,
  };
}
