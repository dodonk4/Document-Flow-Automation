import { z } from "zod";

export const validateSchema = <T>(schema: z.ZodType<T>, data: unknown): T =>
  schema.parse(data);