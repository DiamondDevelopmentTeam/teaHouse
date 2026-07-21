import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(projectRoot, 'dist');
const expectedBase = process.env.VITE_BASE_PATH || '/teaHouse/';
const indexPath = join(distRoot, 'index.html');
const fallbackPath = join(distRoot, '404.html');

const fail = (message) => {
  throw new Error(`GitHub Pages verification failed: ${message}`);
};

if (!existsSync(indexPath)) fail('dist/index.html is missing');
if (!existsSync(fallbackPath)) fail('dist/404.html is missing');

const indexHtml = readFileSync(indexPath, 'utf8');
const fallbackHtml = readFileSync(fallbackPath, 'utf8');

if (!indexHtml.includes(`${expectedBase}assets/`)) {
  fail(`built assets do not use the expected base path ${expectedBase}`);
}

if (!indexHtml.includes(`${expectedBase}favicon.png`)) {
  fail('the favicon is not using the GitHub Pages base path');
}

if (!indexHtml.includes('https://diamonddevelopmentteam.github.io/teaHouse/og.png')) {
  fail('the social preview image does not use an absolute GitHub Pages URL');
}

if (!existsSync(join(distRoot, 'og.png'))) {
  fail('the social preview image is missing');
}

if (!fallbackHtml.includes(`var base = '${expectedBase}'`)) {
  fail('404.html does not redirect through the repository base path');
}

const localAssets = [
  ...indexHtml.matchAll(/(?:src|href)="(?<path>\/teaHouse\/assets\/[^"]+)"/g),
];

if (localAssets.length === 0) fail('no built CSS or JavaScript assets were found');

for (const match of localAssets) {
  const relativePath = decodeURIComponent(match.groups.path.slice(expectedBase.length));
  if (!existsSync(join(distRoot, relativePath))) {
    fail(`referenced asset is missing: ${match.groups.path}`);
  }
}

console.log('GitHub Pages build verified: base path, assets, router fallback, and favicon are present.');
