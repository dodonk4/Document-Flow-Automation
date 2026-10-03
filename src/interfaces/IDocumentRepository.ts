import { Document, DocumentProps } from "../domain/Document.ts"

export interface IDocumentRepository{
    saveFile(props: DocumentProps): Promise<Document>
    findAllDocuments(): Promise<Document[]>
    findById(id: string): Promise<Document | null>
    findByHash(hash: string): Promise<Document | null>
}