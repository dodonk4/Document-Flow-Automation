import { z } from 'zod';

export const invoiceSchema = z.object({
    documentId: z
        .string('El documentId es obligatorio'),

    // Valida el número de factura en formato "00010-00000101" (Punto de Venta - Comprobante)
    invoiceNumber: z
        .string('El número de factura es obligatorio')
        .regex(/^\d{5}-\d{8}$/, 'El número de factura debe tener el formato 00000-00000000'),

    issuerName: z
        .string('La Razón Social del emisor es obligatoria',)
        .min(1, 'El nombre del emisor no puede estar vacío')
        .transform((val) => val.trim()),

    // Acepta tanto un número directamente como un string y lo transforma/valida
    total: z
        .union([
            z.number(),
            z.string().transform((val) => {
                // Normaliza el formato: quita puntos de miles y cambia coma por punto
                const clean = val.replace(/\./g, '').replace(',', '.');
                return parseFloat(clean);
            }),
        ])
        .pipe(
            z
                .number('El total debe ser un número válido')
                .positive('El total de la factura debe ser un monto positivo')
        ),
});

export type InvoiceDTO = z.infer<typeof invoiceSchema>;