import { Request, Response } from "express";
import { ProcessDocumentUseCase } from "../core/processDocument/ProcessDocumentUseCase";
export class DocumentController{
    constructor(
        private readonly processDocumentUseCase: ProcessDocumentUseCase
    ){}

    processDocumentController = async (req: Request, res: Response): Promise<void> => {
        const response = await this.processDocumentUseCase.execute(req);
        res.status(201).send(response);
    }
}