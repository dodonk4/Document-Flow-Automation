import { readFileSync } from "node:fs"
import { PDFParse, TextResult } from "pdf-parse";

export class PdfParserRepository {

    async parseFile(buffer: Buffer<ArrayBufferLike>): Promise<TextResult> {

        const parser = new PDFParse({ data: buffer });
        const text = await parser.getText();

        return text;
    }
}