import { InvoiceDTO } from "../schemas/invoiceSchema";

/**
 * Normaliza montos en formato numérico argentino/español ("1.218.920,00" o "1218920,00")
 * a un number nativo de JavaScript.
 */
function parseSpanishAmount(amountStr: string): number {
    if (!amountStr) return 0;
    // Remueve puntos de miles y cambia la coma decimal por punto
    const clean = amountStr.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
}

export function invoiceParser(documentId: string, rawText: string): InvoiceDTO {
    // Razón Social / Nombre
    const nameMatch = rawText.match(/Apellido y Nombre \/ Razón Social:\s*([\s\S]*?)(?=\s*Condición frente al IVA)/i);
    let issuerName = '';
    if (nameMatch && nameMatch[1]) {
        // Limpia saltos de línea y espacios sobrantes generados por la extracción del PDF
        issuerName = nameMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Número de comprobante (Punto de Venta + Número)
    const posMatch = rawText.match(/Punto de Venta:\s*(\d{5})/i);
    const numberMatch = rawText.match(/Comp\.?\s*Nro:\s*(\d{8})/i);
    const invoiceNumber = (posMatch && numberMatch)
        ? `${posMatch[1]}-${numberMatch[1]}`
        : '';

    // Extraer Importe Total robusto
    // Soporta: "Importe Total: USD | 5855,50", "Importe Total: $ | 1218920,00", "Importe Total: $ 2167425,00", etc.
    const totalRegex = /Importe\s+Total:\s*(?:USD|\$)?\s*(?:\|\s*)?([\d.,]+)/i;
    const totalMatch = rawText.match(totalRegex);
    
    let total = 0;
    if (totalMatch && totalMatch[1]) {
        total = parseSpanishAmount(totalMatch[1]);
    }

    return {
        documentId,
        invoiceNumber,
        issuerName,
        total,
    };
}