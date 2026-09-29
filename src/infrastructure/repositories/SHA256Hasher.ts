import crypto from "node:crypto"

export class SHA256Hasher{
    async hashFile(fileBuffer: Buffer<ArrayBufferLike>): Promise<string>{
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        return hash;
    }
}