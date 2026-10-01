import { ZodObject, ZodError } from "zod";

export const validateSchema =
  (schema: ZodObject, data: any) => {
    try {

      data = schema.parse(data);

    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error("Validation failed");
      }
    }
  }