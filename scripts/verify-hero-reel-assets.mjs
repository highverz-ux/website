import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const reelPaths = [...index.matchAll(/(?:src|data-src)="(\/assets\/creators\/reels\/[^\"]+\.mp4)"/g)]
  .map((match) => decodeURIComponent(match[1].replace(/^\//, '')));

if (reelPaths.length < 2) {
  throw new Error('Hero carousel does not declare its reel sources.');
}

const tracked = new Set(
  execFileSync('git', ['ls-files', '--', ...reelPaths], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean),
);

const missing = reelPaths.filter((reel) => !fs.existsSync(path.join(root, reel)) || !tracked.has(reel));
if (missing.length) {
  throw new Error(`Hero reel assets are missing from Git: ${missing.join(', ')}`);
}

console.log(`Hero reel asset check passed (${reelPaths.length} tracked videos).`);
