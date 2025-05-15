import { z } from "zod";

export const ZSetRequireRetypingSchema = z.object({
  entityId: z.string(),
  requireRetyping: z.boolean(),
});

export type TSetRequireRetypingSchema = z.infer<
  typeof ZSetRequireRetypingSchema
>;
