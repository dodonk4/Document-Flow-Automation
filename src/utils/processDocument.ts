import { Document } from "../domain/Document.ts";
import { Invoice } from "../domain/Invoice.ts";
import { AppError } from "../domain/errors/AppError.ts";
import { prisma } from "../infrastructure/database/config.ts";
import { PdfParserRepository } from "../infrastructure/repositories/PdfParserRespository.ts";
import { PrismaDocumentRepository } from "../infrastructure/repositories/PrismaDocumentRepository.ts";
import { PrismaInvoiceRepository } from "../infrastructure/repositories/PrismaInvoiceRepository.ts";
import { validateSchema } from "../middleware/validateSchema.ts";
import { InvoiceDTO, invoiceSchema } from "../schemas/invoiceSchema.ts";
import { invoiceParser } from "./invoiceParser.ts";

export async function extractInvoice(
    pdfExtractor: PdfParserRepository,
    documentId: string,
    fileBuffer: Buffer
): Promise<InvoiceDTO> {
    let text: string;
    try {
        const result = await pdfExtractor.parseFile(fileBuffer);
        text = result.text;
    } catch {
        throw new AppError("No se pudo leer el contenido del PDF.", 422, "INVALID_PDF_CONTENT");
    }

    const parsedInvoice = invoiceParser(documentId, text);
    return validateSchema(invoiceSchema, parsedInvoice);
}

export async function saveDocumentAndInvoice(document: Document, parsedInvoice: InvoiceDTO): Promise<void> {
    const invoice = Invoice.create(parsedInvoice);

    await prisma.$transaction(async (tx) => {
        const documentRepository = new PrismaDocumentRepository(tx);
        const invoiceRepository = new PrismaInvoiceRepository(tx);

        await documentRepository.saveFile(document);
        await invoiceRepository.saveInvoice(invoice);
    });
}
