import { Request, Response } from "express";
import { ProcessDocumentUseCase } from "../core/processDocument/ProcessDocumentUseCase.ts";
import { IDocumentRepository } from "../interfaces/IDocumentRepository.ts";
import { IInvoiceRepository } from "../interfaces/IInvoiceRepository.ts";
import { AppError } from "../domain/errors/AppError.ts";
import { z } from "zod";

export class DocumentController {
    constructor(
        private readonly processDocumentUseCase: ProcessDocumentUseCase,
        private readonly documentRepository: IDocumentRepository,
        private readonly invoiceRepository: IInvoiceRepository
    ) { }

    processDocumentController = async (req: Request, res: Response): Promise<void> => {
        const response = await this.processDocumentUseCase.execute(req);
        res.status(201).json(response);
    }

    getDocumentController = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id;
        if (typeof id !== "string" || !z.uuid().safeParse(id).success) {
            throw new AppError("El identificador del documento no es válido.", 400, "INVALID_DOCUMENT_ID");
        }

        const document = await this.documentRepository.findById(id);

        if (!document) {
            throw new AppError("No se encontró el documento solicitado.", 404, "DOCUMENT_NOT_FOUND");
        }

        res.status(200).json({
            id: document.id,
            filename: document.filename,
            hash: document.hash,
            status: document.status,
            errorMessage: document.errorMessage,
            createdAt: document.createdAt,
        });
    }

    listInvoicesController = async (_req: Request, res: Response): Promise<void> => {
        const invoices = await this.invoiceRepository.findAllInvoices();

        res.status(200).json(invoices.map((invoice) => ({
            id: invoice.id,
            documentId: invoice.documentId,
            invoiceNumber: invoice.invoiceNumber,
            issuerName: invoice.issuerName,
            total: invoice.total,
            createdAt: invoice.createdAt,
        })));
    }
}