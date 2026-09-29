import { readFileSync } from "node:fs"
import { PDFParse, TextResult } from "pdf-parse";

export class PdfParserRepository {

    async parseFile(filePath: Buffer<ArrayBufferLike>): Promise<TextResult> {
        const buffer = readFileSync(filePath);
        const parser = new PDFParse({ data: buffer });
        const text = await parser.getText();

        return text;
    }
}