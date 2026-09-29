interface InvoiceProps {
    id: string,
    documentId: string,
    invoiceNumber: string,
    issuerName: string,
    total: number,
    createdAt: Date
}

export class Invoice {
    constructor(private readonly props: InvoiceProps) { }

    static create(props: {
        id: string,
        documentId: string,
        invoiceNumber: string,
        issuerName: string,
        total: number
    }): Invoice {
        return new Invoice({
            ...props,
            createdAt: new Date()
        })
    }

    reconstitute(props: InvoiceProps){
        return new Invoice(props);
    }

    get id(): string {
        return this.props.id;
    }

    get documentId(): string {
        return this.props.documentId;
    }

    get invoiceNumber(): string {
        return this.props.invoiceNumber;
    }

    get issuerName(): string {
        return this.props.issuerName;
    }

    get total(): number {
        return this.props.total;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }
}