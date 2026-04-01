type ItemLike = {
  category?: string;
  effect?: string;
};

const HELD_CATEGORY_KEYWORDS = [
  "held",
  "type enhancement",
  "species specific",
  "jewel",
  "choice",
  "plate",
  "type protection",
  "scarf",
  "picky healing",
  "effort training",
] as const;

export function isHeldItem(item: ItemLike): boolean {
  const category = (item.category ?? "").toLowerCase();
  if (
    HELD_CATEGORY_KEYWORDS.some((keyword) => category.includes(keyword))
  ) {
    return true;
  }

  const effect = (item.effect ?? "").toLowerCase();
  return (
    effect.includes("held:") ||
    effect.includes("holder") ||
    effect.includes("when held")
  );
}
