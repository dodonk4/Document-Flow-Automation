import { Document, DocumentProps } from "../domain/Document.ts"

export interface IDocumentRepository{
    saveFile(props: DocumentProps): Promise<Document>
    findAllDocuments(): Promise<Document[]>
    findByHash(hash: string): Promise<Document | null>
}