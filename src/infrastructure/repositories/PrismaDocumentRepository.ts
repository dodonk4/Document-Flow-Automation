import { Prisma, PrismaClient } from "../../../generated/prisma/client.ts";
import { Document, DocumentProps } from "../../domain/Document.ts";
import { IDocumentRepository } from "../../interfaces/IDocumentRepository.ts";

export class PrismaDocumentRepository implements IDocumentRepository {
    constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) { }

    async saveFile(props: DocumentProps): Promise<Document>{
        const document = await this.prisma.document.create({data: {
            id: props.id,
            hash: props.hash,
            filename: props.filename,
            status: props.status,
            errorMessage: props.errorMessage,
            createdAt: props.createdAt
        }});

        const response = Document.reconstitute(document);

        return response;
    }

    async findAllDocuments(): Promise<Document[]> {
        const documents = await this.prisma.document.findMany();

        const documentArray: Document[] = [];
        for (const document of documents) {
            const documentToPush = Document.reconstitute(document);
            documentArray.push(documentToPush);
        }

        return documentArray;
    }

    async findByHash(hash: string): Promise<Document | null> {
        const document = await this.prisma.document.findUnique({ where: { hash } });

        if (!document)
            return null;

        const response = Document.reconstitute(document);

        return response;
    }

}