import { json } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function GET() {
  const folder = path.join(__dirname, '../../../data/2023');
  const challenges = await fs.readdir(folder);
  return json(
    await Promise.all(
      challenges
        .sort((a, b) => Number(a) - Number(b))
        .map(async (id) => {
          const { label } = JSON.parse(
            await fs.readFile(path.join(folder, id, 'metadata.json'), 'utf-8')
          );
          return {
            id,
            name: label,
            url: `/challenge/${id}`,
          };
        })
    )
  );
}
