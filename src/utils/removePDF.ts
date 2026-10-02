import fs from 'node:fs/promises';
export async function removePDF(filePath: string): Promise<void> {
  await fs.rm(filePath, { force: true });
}