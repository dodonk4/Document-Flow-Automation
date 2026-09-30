import express from "express";
import { SHA256Hasher } from "./infrastructure/repositories/SHA256Hasher";
import { ProcessDocumentUseCase } from "./core/processDocument/ProcessDocumentUseCase";
import { PdfParserRepository } from "./infrastructure/repositories/PdfParserRespository";
import { PrismaDocumentRepository } from "./infrastructure/repositories/PrismaDocumentRepository";
import { prisma } from "./infrastructure/database/config";
import { DocumentController } from "./api/controller";
import { createDocumentRouter } from "./api/router";

const app = express();
const port = process.env.PORT || 3000;

const hasherProvider = new SHA256Hasher();

const pdfExtractor = new PdfParserRepository();

const documentRepository = new PrismaDocumentRepository(prisma);

const processDocumentUseCase = new ProcessDocumentUseCase(
    hasherProvider,
    pdfExtractor,
    documentRepository
);

const documentController = new DocumentController(
    processDocumentUseCase
);

const documentRouter = createDocumentRouter(
    documentController
);

app.use('/api/documents', documentRouter);


app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Listening on port ${port}!`))