import z from "zod";

export const invoiceSchema = z.object({
    documentId: z.string,
    invoiceNumber: z.string,
    issuerName: z.string,
    total: z.number,
})