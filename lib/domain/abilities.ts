import { normalizeName } from "@/lib/domain/names";

export function reconcileAbilitySelection(
  currentAbility: string,
  availableAbilities: string[],
): string {
  const cleanedAbilities = availableAbilities.map((ability) => ability.trim()).filter(Boolean);
  const normalizedCurrent = normalizeName(currentAbility);

  if (
    normalizedCurrent &&
    cleanedAbilities.some((ability) => normalizeName(ability) === normalizedCurrent)
  ) {
    return currentAbility;
  }

  return cleanedAbilities[0] ?? "";
}
