import { z } from "zod";

const statKeys = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export const genderOptions = ["unknown", "female", "male"] as const;

const natureOptions = [
  "Hardy",
  "Lonely",
  "Brave",
  "Adamant",
  "Naughty",
  "Bold",
  "Docile",
  "Relaxed",
  "Impish",
  "Lax",
  "Timid",
  "Hasty",
  "Serious",
  "Jolly",
  "Naive",
  "Modest",
  "Mild",
  "Quiet",
  "Bashful",
  "Rash",
  "Calm",
  "Gentle",
  "Sassy",
  "Careful",
  "Quirky",
] as const;

function buildSpreadSchema(max: number) {
  return z.object({
    hp: z.coerce.number().int().min(0).max(max),
    atk: z.coerce.number().int().min(0).max(max),
    def: z.coerce.number().int().min(0).max(max),
    spa: z.coerce.number().int().min(0).max(max),
    spd: z.coerce.number().int().min(0).max(max),
    spe: z.coerce.number().int().min(0).max(max),
  });
}

export const ivSpreadSchema = buildSpreadSchema(31);
export const evSpreadSchema = buildSpreadSchema(252);

export const editableMemberSchema = z
  .object({
    id: z.string().min(1),
    species: z.string().trim(),
    nickname: z.string().trim().max(24),
    locked: z.boolean().default(false),
    level: z.coerce.number().int().min(1).max(100),
    gender: z.enum(genderOptions),
    nature: z
      .string()
      .refine((value) => natureOptions.includes(value as (typeof natureOptions)[number]), {
        message: "Selecciona una naturaleza válida.",
      }),
    ability: z.string().trim(),
    item: z.string().trim().max(40),
    moves: z.array(z.string().trim().min(1)).max(4),
    ivs: ivSpreadSchema,
    evs: evSpreadSchema,
  })
  .superRefine((value, ctx) => {
    const totalEvs = statKeys.reduce((sum, key) => sum + value.evs[key], 0);
    if (totalEvs > 510) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evs"],
        message: "El total de EV no puede pasar de 510.",
      });
    }
  });

export type EditableMemberFormValues = z.infer<typeof editableMemberSchema>;
export type EditableMemberFormInput = z.input<typeof editableMemberSchema>;
export { natureOptions, statKeys };
