import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Saves the generated file
 * @param content - The content of the file to save.
 * @param fileName - The name of the file to save.
 */
export function saveFile(content: string, fileName: string) {
  // Ensure the directory exists before writing the file
  const dir = path.dirname(fileName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Write the content to the file
  fs.writeFileSync(fileName, content);
}
