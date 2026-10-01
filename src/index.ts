import express from "express";
import { SHA256Hasher } from "./infrastructure/repositories/SHA256Hasher.ts";
import { ProcessDocumentUseCase } from "./core/processDocument/ProcessDocumentUseCase.ts";
import { PdfParserRepository } from "./infrastructure/repositories/PdfParserRespository.ts";
import { PrismaDocumentRepository } from "./infrastructure/repositories/PrismaDocumentRepository.ts";
import { prisma } from "./infrastructure/database/config.ts";
import { DocumentController } from "./api/controller.ts";
import { createDocumentRouter } from "./api/router.ts";

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