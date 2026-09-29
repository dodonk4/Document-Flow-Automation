import { randomUUID } from "node:crypto";
import { Request } from "express";
import { PdfParserRepository } from "../../infrastructure/repositories/PdfParserRespository";
import { SHA256Hasher } from "../../infrastructure/repositories/SHA256Hasher";
import { IDocumentRepository } from "../../interfaces/IDocumentRepository.ts";
import { Document } from "../../domain/Document.ts";

export class ProcessDocumentUseCase{
    constructor (
        private readonly hasherProvider: SHA256Hasher,
        private readonly pdfExtractor: PdfParserRepository,
        private readonly documentRepository: IDocumentRepository

    ){}

    async execute(req: Request){
        if(!req.file?.buffer){
            throw new Error("Buffer doesn't exist");
        }
        const hash = await this.hasherProvider.hashFile(req.file?.buffer);
        
        const repeatedDocument = await this.documentRepository.findByHash(hash);

        if(repeatedDocument){
            throw new Error("File already saved");
        }

        const document = Document.create({
            id: randomUUID(),
            filename: req.file?.filename,
            hash,
            status: "PENDING",
            errorMessage: null
        })

        const documentSaved = await this.documentRepository.saveFile(document);

        const data = await this.pdfExtractor.parseFile(req.file?.buffer);

        
    }
}