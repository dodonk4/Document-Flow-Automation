export interface ExtractedInvoiceData {
    documentId: string,
    invoiceNumber: string;
    issuerName: string;
    total: number;
}

export function invoiceParser(rawText: string): ExtractedInvoiceData {

    const cuitMatch = rawText.match(/CUIT:\s*(\d{2})-?(\d{8})-?(\d{1})/);
    const documentId = cuitMatch ? cuitMatch[2] : '';

    const match = rawText.match(/Apellido y Nombre \/ Razón Social:\s*([\s\S]*?)(?=\s*Condición frente al IVA)/i);

    let issuerName = '';

    if (match && match[1]) {
        issuerName = match[1].replace(/\s+/g, ' ').trim();
    }

    const posMatch = rawText.match(/Punto de Venta:\s*(\d{5})/);
    const numberMatch = rawText.match(/Comp\. Nro:\s*(\d{8})/);

    const invoiceNumber = (posMatch && numberMatch)
        ? `${posMatch[1]}-${numberMatch[1]}`
        : '';

    const totalMatch = rawText.match(/Importe Total:\s*(?:[A-Z]{3})?\s*\|\s*([\d.,]+)/);
    let total = 0;

    if (totalMatch) {
        const rawTotal = totalMatch[1].replace(/\./g, '').replace(',', '.');
        total = parseFloat(rawTotal);
    }

    return {
        documentId,
        invoiceNumber,
        issuerName,
        total,
    };
}