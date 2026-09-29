import { Status } from "./Status"


export interface DocumentProps {
    id: string,
    filename: string,
    hash: string,
    status: Status,
    errorMessage: string | null,
    createdAt: Date
}

export class Document {

    constructor(private readonly props: DocumentProps) { }
    static create(props: {
        id: string,
        filename: string,
        hash: string,
        status: Status,
        errorMessage: string | null,
    }): Document {
        return new Document({
            ...props,
            createdAt: new Date(),
        })
    }

    static reconstitute(props: DocumentProps) {
        return new Document(props);
    }

    get id(): string {
        return this.props.id;
    }

    get filename(): string {
        return this.props.filename;
    }

    get hash(): string {
        return this.props.hash;
    }

    get status(): Status {
        return this.props.status;
    }

    get errorMessage(): string | null {
        return this.props.errorMessage;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }
}