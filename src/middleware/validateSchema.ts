import { ZodObject, ZodError } from "zod";

export const validateSchema =
  (schema: ZodObject, data: any) => {
      data = schema.parse(data);
  }