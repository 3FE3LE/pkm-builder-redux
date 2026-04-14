import clsx from "clsx";
import { Mars, Venus } from "lucide-react";

import type { PokemonGender } from "@/lib/builder";

export function GenderIconPicker({
  value,
  onChange,
}: {
  value: PokemonGender;
  onChange: (next: PokemonGender) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(value === "male" ? "unknown" : "male")}
        aria-label="Set male"
        title="Male"
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
          value === "male"
            ? "border-info-line bg-info-fill text-info-soft"
            : "border-line bg-surface-4 text-muted hover:bg-surface-6",
        )}
      >
        <Mars className="h-4.5 w-4.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "female" ? "unknown" : "female")}
        aria-label="Set female"
        title="Female"
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
          value === "female"
            ? "border-danger-line bg-danger-fill text-danger-soft"
            : "border-line bg-surface-4 text-muted hover:bg-surface-6",
        )}
      >
        <Venus className="h-4.5 w-4.5" />
      </button>
      <span className="text-xs text-text-faint">
        {value === "unknown" ? "cualquiera" : value}
      </span>
    </div>
  );
}
