import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export async function saveToLocalFolder(
  base64Data: string,
  mimeType: string,
  prompt: string,
  provider: string
): Promise<string> {
  const baseDir = process.env.LOCAL_OUTPUT_DIR ||
    path.join(os.homedir(), 'Desktop', 'outputs');
  await fs.mkdir(baseDir, { recursive: true });

  const ext = mimeType.startsWith('image/') ? mimeType.split('/')[1]
            : mimeType.startsWith('video/') ? mimeType.split('/')[1]
            : 'bin';
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const safePrompt = (prompt || 'output').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  const filename = `${ts}_${provider}_${safePrompt}.${ext}`;
  const filePath = path.join(baseDir, filename);

  const buf = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filePath, buf);
  return `file://${filePath}`;
}
