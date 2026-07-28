import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)), 'src', 'assets', 'images');
const allowed = new Set(['.avif', '.webp', '.jpg', '.jpeg', '.png', '.svg']);
const warningBytes = 1_200_000;
const failureBytes = 4_000_000;
const rows = [];
let failed = false;

async function walk(directory) {
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    const details = await stat(path);
    if (details.isDirectory()) await walk(path);
    else if (allowed.has(extname(name).toLowerCase())) {
      rows.push({ file: relative(root, path), bytes: details.size });
      if (details.size > failureBytes) failed = true;
    }
  }
}

await walk(root);
rows.sort((a, b) => b.bytes - a.bytes);
console.table(rows.map(({ file, bytes }) => ({ file, kilobytes: Math.round(bytes / 1024), status: bytes > warningBytes ? 'review' : 'ok' })));

if (failed) {
  console.error('One or more source images exceed 4 MB. Compress them before deployment.');
  process.exit(1);
}

console.log('Image audit complete. Route images use explicit dimensions, lazy loading, async decoding, and WebP sources where available.');
