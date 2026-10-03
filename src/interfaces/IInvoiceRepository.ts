import { Invoice, InvoiceProps } from "../domain/Invoice"

export interface IInvoiceRepository {
    saveInvoice(props: InvoiceProps): Promise<Invoice>
    findAllInvoices(): Promise<Invoice[]>
    findById(id: string): Promise<Invoice | null>
    findManyByDocumentId(id: string): Promise<Invoice[]>
}