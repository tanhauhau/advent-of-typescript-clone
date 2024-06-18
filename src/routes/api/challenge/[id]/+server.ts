import { json } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function GET({ params }) {
  const folder = path.join(__dirname, '../../../../data/2023', params.id);
  const metadata = JSON.parse(await fs.readFile(path.join(folder, 'metadata.json'), 'utf-8'));
  const prompt = await marked(await fs.readFile(path.join(folder, 'prompt.md'), 'utf-8'));
  const tests = await fs.readFile(path.join(folder, 'tests.ts'), 'utf-8');
  const user = await fs.readFile(path.join(folder, 'user.ts'), 'utf-8');
  return json({
    metadata,
    prompt,
    tests,
    user,
  });
}
