import { randomUUID } from "node:crypto";
import { Request } from "express";
import { PdfParserRepository } from "../../infrastructure/repositories/PdfParserRespository.ts";
import { SHA256Hasher } from "../../infrastructure/repositories/SHA256Hasher.ts";
import { IDocumentRepository } from "../../interfaces/IDocumentRepository.ts";
import { Document } from "../../domain/Document.ts";
import { invoiceParser } from "../../utils/invoiceParser.ts";
import { validateSchema } from "../../middleware/validateSchema.ts";
import { InvoiceDTO, invoiceSchema } from "../../schemas/invoiceSchema.ts";
import { AppError } from "../../domain/errors/AppError.ts";
import { savePdfToStorage } from "../../utils/savePDF.ts";
import { removePDF } from "../../utils/removePDF.ts";
import { prisma } from "../../infrastructure/database/config.ts";
import { PrismaDocumentRepository } from "../../infrastructure/repositories/PrismaDocumentRepository.ts";
import { PrismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository.ts";
import { Invoice } from "../../domain/Invoice.ts";

export class ProcessDocumentUseCase {
    constructor(
        private readonly hasherProvider: SHA256Hasher,
        private readonly pdfExtractor: PdfParserRepository,
        private readonly documentRepository: IDocumentRepository

    ) { }

    // async execute(req: Request): Promise<TextResult>{
    async execute(req: Request): Promise<InvoiceDTO> {
        if (!req.file?.buffer) {
            throw new Error("Buffer doesn't exist");
        }
        const hash = await this.hasherProvider.hashFile(req.file?.buffer);

        const repeatedDocument = await this.documentRepository.findByHash(hash);

        if (repeatedDocument) {
            throw new AppError("File already saved", 400, "FILE_ALREADY_SAVED");
        }

        const document = Document.create({
            id: randomUUID(),
            filename: req.file?.originalname,
            hash,
            status: "PENDING",
            errorMessage: null
        })

        const data = await this.pdfExtractor.parseFile(req.file?.buffer);

        const parsedInvoice = invoiceParser(document.id, data.text);

        const createdInvoice = Invoice.create(parsedInvoice);

        validateSchema(invoiceSchema, parsedInvoice);

        const savedFilePath = await savePdfToStorage({
            fileBuffer: req.file.buffer,
            name: req.file?.originalname,
        });

        const executeAtomicTransaction = async () => {
            prisma.$transaction(async (tx) => {
                const documentRepository2 = new PrismaDocumentRepository(tx);
                const invoiceRepository = new PrismaInvoiceRepository(tx);

                try {
                    await documentRepository2.saveFile(document);
                    await invoiceRepository.saveInvoice(createdInvoice);
                } catch (saveError) {
                    try {
                        await removePDF(savedFilePath);
                    } catch (cleanupError) {
                        throw new AppError(
                            "Saving the document failed, and the saved PDF could not be removed",
                            500,
                            "PERSISTENCE_ERROR"
                        );
                    }

                    throw saveError;
                }
            })
        }

        await executeAtomicTransaction();

        return parsedInvoice;
    }
}