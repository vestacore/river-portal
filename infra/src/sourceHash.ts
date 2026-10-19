import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import * as path from 'node:path';

const skip = new Set(['node_modules', '.next', 'bin', '.git']);

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir).sort()) {
    if (skip.has(name) || name.startsWith('.DS_')) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
}

/** Content hash of everything that goes into an image — the web image by default — so unchanged sources never rebuild. */
export function sourceHash(repoRoot: string, app = 'apps/web', dockerfile = 'Dockerfile'): string {
  const files: string[] = [];
  for (const entry of [app, 'packages']) walk(path.join(repoRoot, entry), files);
  files.push(...['package.json', 'package-lock.json', '.npmrc', dockerfile, 'cloudbuild.yaml'].map((f) => path.join(repoRoot, f)));
  const hash = createHash('sha256');
  for (const file of files) hash.update(path.relative(repoRoot, file)).update('\0').update(readFileSync(file));
  return hash.digest('hex').slice(0, 16);
}
