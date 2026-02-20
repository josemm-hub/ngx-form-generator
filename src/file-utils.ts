import * as fs from 'node:fs';

/**
 * Saves the generated file
 * @param content - The content of the file to save.
 * @param fileName - The name of the file to save.
 */
export function saveFile(content: string, fileName: string) {
  fs.writeFileSync(fileName, content);
}
