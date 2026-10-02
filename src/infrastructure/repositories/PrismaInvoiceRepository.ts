import { Prisma, PrismaClient } from "../../../generated/prisma/client.ts";
import { Invoice, InvoiceProps } from "../../domain/Invoice.ts";
import { IInvoiceRepository } from "../../interfaces/IInvoiceRepository.ts";

export class PrismaInvoiceRepository implements IInvoiceRepository {
    constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) { }

    async saveInvoice(props: InvoiceProps): Promise<Invoice> {
        const invoice = await this.prisma.invoice.create({
            data: {
                id: props.id,
                documentId: props.documentId,
                invoiceNumber: props.invoiceNumber,
                issuerName: props.issuerName,
                total: props.total,
                createdAt: props.createdAt
            }
        });

        return new Invoice({
            id: invoice.id,
            documentId: invoice.documentId,
            invoiceNumber: invoice.invoiceNumber,
            issuerName: invoice.issuerName,
            total: invoice.total.toNumber(),
            createdAt: invoice.createdAt
        });
    }

    async findAllInvoices(): Promise<Invoice[]> {
        const invoices = await this.prisma.invoice.findMany();

        return invoices.map(invoice => new Invoice({
            id: invoice.id,
            documentId: invoice.documentId,
            invoiceNumber: invoice.invoiceNumber,
            issuerName: invoice.issuerName,
            total: invoice.total.toNumber(),
            createdAt: invoice.createdAt
        }));
    }

    async findById(id: string): Promise<Invoice | null> {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });

        if (!invoice) {
            return null;
        }

        return new Invoice({
            id: invoice.id,
            documentId: invoice.documentId,
            invoiceNumber: invoice.invoiceNumber,
            issuerName: invoice.issuerName,
            total: invoice.total.toNumber(),
            createdAt: invoice.createdAt
        });
    }

    async findManyByDocumentId(id: string): Promise<Invoice[]> {
        const invoices = await this.prisma.invoice.findMany({
            where: { documentId: id }
        });

        return invoices.map(invoice => new Invoice({
            id: invoice.id,
            documentId: invoice.documentId,
            invoiceNumber: invoice.invoiceNumber,
            issuerName: invoice.issuerName,
            total: invoice.total.toNumber(),
            createdAt: invoice.createdAt
        }));
    }
}
