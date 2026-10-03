import express from "express";
import { DocumentController } from "./controller.ts";
import { createDocumentRouter } from "./router.ts";
import { ProcessDocumentUseCase } from "../core/processDocument/ProcessDocumentUseCase.ts";
import { PdfParserRepository } from "../infrastructure/repositories/PdfParserRespository.ts";
import { PrismaDocumentRepository } from "../infrastructure/repositories/PrismaDocumentRepository.ts";
import { PrismaInvoiceRepository } from "../infrastructure/repositories/PrismaInvoiceRepository.ts";
import { SHA256Hasher } from "../infrastructure/repositories/SHA256Hasher.ts";
import { prisma } from "../infrastructure/database/config.ts";
import errorHandler from "../middleware/errorHandler.ts";

const hasherProvider = new SHA256Hasher();
const pdfExtractor = new PdfParserRepository();
const documentRepository = new PrismaDocumentRepository(prisma);
const invoiceRepository = new PrismaInvoiceRepository(prisma);
const processDocumentUseCase = new ProcessDocumentUseCase(
    hasherProvider,
    pdfExtractor,
    documentRepository
);
const documentController = new DocumentController(
    processDocumentUseCase,
    documentRepository,
    invoiceRepository
);

const app = express();
app.use('/api/documents', createDocumentRouter(documentController));
app.get('/api/invoices', documentController.listInvoicesController);
app.get('/', (_req, res) => res.send('DocumentFlow Automation API'));
app.use(errorHandler);

export { app };
