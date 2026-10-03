import fs from 'node:fs/promises';
import path from 'node:path';

interface SaveFileParams {
  fileBuffer: Buffer,
  name: string
}

export async function savePdfToStorage(props: SaveFileParams): Promise<string> {
  const storageDir = path.resolve(process.env.STORAGE_PATH || path.join(process.cwd(), 'storage'));
  
  const fileName = `${props.name}.pdf`;
  const fullPath = path.join(storageDir, fileName);

  try {
    await fs.mkdir(storageDir, { recursive: true });
    await fs.writeFile(fullPath, props.fileBuffer);

    return fullPath;
  } catch (error) {
    throw new Error(`Error al guardar el archivo en disco: ${(error as Error).message}`);
  }
}