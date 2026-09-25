#!/usr/bin/env node
// Picks a dependency version following the supply-chain policy (adr/records/ADR-0007; meta/process/Dependency Register.md):
// take the latest stable major.minor line, step back two lines in release order (crossing a
// major boundary if needed) and use the highest stable patch of that line. Usage: node tools/pick-version.mjs <pkg> [<pkg> ...]
import { execFileSync } from 'node:child_process';

const stable = (v) => /^\d+\.\d+\.\d+$/.test(v);
const parse = (v) => v.split('.').map(Number);

function pick(pkg) {
  const raw = execFileSync('npm', ['view', pkg, 'versions', 'dist-tags.latest', 'time', '--json'], { encoding: 'utf8' });
  const info = JSON.parse(raw);
  const latest = info['dist-tags.latest'];
  const versions = info.versions.filter(stable);
  // Distinct stable major.minor lines up to latest, newest first; step back two lines
  // (crossing a major boundary when the latest major has fewer than three minors).
  const [lmaj, lmin] = parse(latest);
  const lines = [...new Set(versions.map(parse)
    .filter(([a, b]) => a < lmaj || (a === lmaj && b <= lmin))
    .map(([a, b]) => `${a}.${b}`))]
    .sort((x, y) => { const [a1, b1] = parse(x), [a2, b2] = parse(y); return a2 - a1 || b2 - b1; });
  const line = lines[Math.min(2, lines.length - 1)];
  const chosen = versions.filter((v) => v.startsWith(line + '.'))
    .sort((x, y) => parse(y)[2] - parse(x)[2])[0];
  return { pkg, latest, chosen, published: info.time[chosen]?.slice(0, 10) };
}

for (const pkg of process.argv.slice(2)) {
  try { const r = pick(pkg); console.log(`${r.pkg}\tlatest ${r.latest}\tchosen ${r.chosen}\t(${r.published})`); }
  catch (e) { console.log(`${pkg}\tERROR ${e.message.split('\n')[0]}`); }
}
