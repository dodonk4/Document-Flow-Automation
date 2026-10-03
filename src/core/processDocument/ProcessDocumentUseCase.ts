import { randomUUID } from "node:crypto";
import { Request } from "express";
import { PdfParserRepository } from "../../infrastructure/repositories/PdfParserRespository.ts";
import { SHA256Hasher } from "../../infrastructure/repositories/SHA256Hasher.ts";
import { IDocumentRepository } from "../../interfaces/IDocumentRepository.ts";
import { Document } from "../../domain/Document.ts";
import { InvoiceDTO, invoiceSchema } from "../../schemas/invoiceSchema.ts";
import { AppError } from "../../domain/errors/AppError.ts";
import { savePdfToStorage } from "../../utils/savePDF.ts";
import { removePDF } from "../../utils/removePDF.ts";
import { extractInvoice, saveDocumentAndInvoice } from "../../utils/processDocument.ts";

export class ProcessDocumentUseCase {
    constructor(
        private readonly hasherProvider: SHA256Hasher,
        private readonly pdfExtractor: PdfParserRepository,
        private readonly documentRepository: IDocumentRepository

    ) { }

    async execute(req: Request): Promise<InvoiceDTO> {
        if (!req.file?.buffer) {
            throw new AppError("Debe adjuntar un archivo PDF en el campo 'file'.", 400, "FILE_REQUIRED");
        }

        if (!req.file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
            throw new AppError("El archivo adjunto no es un PDF válido.", 400, "INVALID_PDF");
        }

        const hash = await this.hasherProvider.hashFile(req.file.buffer);

        const repeatedDocument = await this.documentRepository.findByHash(hash);

        if (repeatedDocument) {
            throw new AppError("El documento ya fue procesado anteriormente.", 409, "FILE_ALREADY_PROCESSED");
        }

        const document = Document.create({
            id: randomUUID(),
            filename: req.file.originalname,
            hash,
            status: "SUCCESS",
            errorMessage: null
        });

        const savedFilePath = await savePdfToStorage({
            fileBuffer: req.file.buffer,
            name: document.id,
        });

        let parsedInvoice: InvoiceDTO;
        
        try {
            parsedInvoice = await extractInvoice(
                this.pdfExtractor,
                document.id,
                req.file.buffer
            );

            await saveDocumentAndInvoice(document, parsedInvoice);
        } catch (error) {
            try {
                await removePDF(savedFilePath);
            } catch {
                throw new AppError(
                    "El procesamiento falló y no se pudo eliminar el PDF guardado.",
                    500,
                    "PROCESSING_CLEANUP_ERROR"
                );
            }

            if (isUniqueConstraintError(error)) {
                throw new AppError("El documento ya fue procesado anteriormente.", 409, "FILE_ALREADY_PROCESSED");
            }
            throw error;
        }

        return parsedInvoice;
    }
}

function isUniqueConstraintError(error: unknown): boolean {
    return typeof error === "object" && error !== null
        && "code" in error && error.code === "P2002";
}