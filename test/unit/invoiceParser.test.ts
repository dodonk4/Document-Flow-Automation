import assert from "node:assert/strict";
import test from "node:test";
import { invoiceParser } from "../../src/utils/invoiceParser.ts";
import { invoiceSchema } from "../../src/schemas/invoiceSchema.ts";

test("extracts invoice fields and a Spanish-formatted total", () => {
    const result = invoiceParser("document-id", `
        Apellido y Nombre / Razón Social: Empresa Ejemplo S.A.
        Condición frente al IVA: Responsable Inscripto
        Punto de Venta: 00010
        Comp. Nro: 00000101
        Importe Total: $ 1.234.567,89
    `);

    assert.deepEqual(result, {
        documentId: "document-id",
        invoiceNumber: "00010-00000101",
        issuerName: "Empresa Ejemplo S.A.",
        total: 1234567.89,
    });
    assert.equal(invoiceSchema.safeParse(result).success, true);
});

test("rejects text that does not contain the expected invoice fields", () => {
    const result = invoiceParser("document-id", "PDF without invoice data");

    assert.equal(invoiceSchema.safeParse(result).success, false);
});
