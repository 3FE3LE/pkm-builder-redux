const FORM_FAMILIES = {
  Deoxys: [
    "Deoxys",
    "Deoxys-Attack",
    "Deoxys-Defense",
    "Deoxys-Speed",
  ],
  Wormadam: [
    "Wormadam",
    "Wormadam-Sandy",
    "Wormadam-Trash",
  ],
  Shaymin: [
    "Shaymin",
    "Shaymin-Sky",
  ],
  Giratina: [
    "Giratina",
    "Giratina-Origin",
  ],
  Rotom: [
    "Rotom",
    "Rotom-Heat",
    "Rotom-Wash",
    "Rotom-Frost",
    "Rotom-Fan",
    "Rotom-Mow",
  ],
  Darmanitan: [
    "Darmanitan",
    "Darmanitan-Zen",
  ],
  Basculin: [
    "Basculin",
    "Basculin-Blue-Striped",
  ],
  Meloetta: [
    "Meloetta",
    "Meloetta-Pirouette",
  ],
  Tornadus: [
    "Tornadus",
    "Tornadus-Therian",
  ],
  Thundurus: [
    "Thundurus",
    "Thundurus-Therian",
  ],
  Landorus: [
    "Landorus",
    "Landorus-Therian",
  ],
  Kyurem: [
    "Kyurem",
    "Kyurem-Black",
    "Kyurem-White",
  ],
  Keldeo: [
    "Keldeo",
    "Keldeo-Resolute",
  ],
  Castform: [
    "Castform",
    "Castform-Sunny",
    "Castform-Rainy",
    "Castform-Snowy",
  ],
} as const satisfies Record<string, string[]>;

const FORM_TO_BASE = Object.fromEntries(
  Object.entries(FORM_FAMILIES).flatMap(([base, forms]) =>
    forms.map((form) => [form, base] as const),
  ),
) as Record<string, string>;

export function getBaseSpeciesName(species: string) {
  return FORM_TO_BASE[species] ?? species;
}

export function getAvailableFormsForSpecies(species: string) {
  const base = getBaseSpeciesName(species);
  return [...(FORM_FAMILIES[base as keyof typeof FORM_FAMILIES] ?? [base])];
}
