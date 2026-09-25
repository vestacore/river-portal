#!/usr/bin/env node
// Verifies the package topology rules (adr/records/ADR-0002, ADR-0003) and regenerates the
// generated section of TOPOLOGY.md. Usage: node tools/check-topology.mjs [--write]
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, relative, dirname, resolve, sep } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const layers = { foundation: 0, record: 1, river: 2, assist: 2, surface: 3, compose: 4, apps: 5, infra: 5 };
const errors = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mts)$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

// Discover packages.
const packages = [];
for (const group of readdirSync(join(root, 'packages'))) {
  for (const name of readdirSync(join(root, 'packages', group))) {
    const dir = join(root, 'packages', group, name);
    if (existsSync(join(dir, 'package.json'))) packages.push({ dir, group });
  }
}
packages.push({ dir: join(root, 'apps', 'web'), group: 'apps' });
packages.push({ dir: join(root, 'infra'), group: 'infra' });

const byName = new Map();
for (const pkg of packages) {
  const manifest = JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf8'));
  pkg.name = manifest.name;
  pkg.manifest = manifest;
  pkg.layer = layers[pkg.group];
  pkg.declared = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})]);
  pkg.internal = [...pkg.declared].filter((d) => d.startsWith('@river/'));
  byName.set(pkg.name, pkg);
}

const builtins = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));
const bareName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

for (const pkg of packages) {
  const isLibrary = pkg.group !== 'apps' && pkg.group !== 'infra';
  const rel = (f) => relative(root, f);
  if (isLibrary) {
    if (!existsSync(join(pkg.dir, 'gate.ts'))) errors.push(`${pkg.name}: missing gate.ts`);
    const exp = pkg.manifest.exports;
    if (!exp || Object.keys(exp).length !== 1 || exp['.'] !== './gate.ts') errors.push(`${pkg.name}: package.json exports must be { ".": "./gate.ts" }`);
  }
  for (const file of walk(pkg.dir)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const spec = match[1] ?? match[2];
      if (spec.startsWith('.')) {
        const target = resolve(dirname(file), spec);
        if (!target.startsWith(pkg.dir + sep)) errors.push(`${rel(file)}: relative import escapes the package: ${spec}`);
        continue;
      }
      if (spec.startsWith('@/')) continue; // app-internal alias
      if (spec.startsWith('node:') || builtins.has(spec) || builtins.has(bareName(spec))) continue;
      const name = bareName(spec);
      if (name.startsWith('@river/')) {
        if (spec !== name) errors.push(`${rel(file)}: deep import ${spec}; import from the gate '${name}'`);
        const target = byName.get(name);
        if (!target) errors.push(`${rel(file)}: unknown package ${name}`);
        else if (target.layer > pkg.layer) errors.push(`${rel(file)}: upward dependency ${pkg.name} (${pkg.group}) → ${name} (${target.group})`);
      }
      if (!pkg.declared.has(name) && name !== pkg.name) errors.push(`${rel(file)}: ${name} is not declared in ${pkg.name}/package.json`);
    }
    // ADR-0003: outside types/ and data/, a file exports one value and no types.
    const local = relative(pkg.dir, file);
    if (isLibrary && local !== 'gate.ts' && !local.startsWith(`types${sep}`) && !local.startsWith(`data${sep}`) && !local.endsWith('.test.ts')) {
      const values = [...source.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/gm)].map((m) => m[1]);
      const types = [...source.matchAll(/^export\s+(?:type|interface)\s+(\w+)/gm)].map((m) => m[1]);
      if (values.length !== 1) errors.push(`${rel(file)}: must export exactly one public function (found ${values.length})`);
      if (types.length > 0) errors.push(`${rel(file)}: move exported types (${types.join(', ')}) into types/`);
      const expected = local.split(sep).pop().replace(/\.ts$/, '');
      if (values.length === 1 && values[0] !== expected && !(local === 'paths.ts')) errors.push(`${rel(file)}: exported '${values[0]}' should be named like the file '${expected}'`);
    }
  }
}

// Cycles in declared internal dependencies.
const state = new Map();
function visit(name, trail) {
  if (state.get(name) === 'done') return;
  if (state.get(name) === 'active') { errors.push(`cycle: ${[...trail, name].join(' → ')}`); return; }
  state.set(name, 'active');
  for (const dep of byName.get(name)?.internal ?? []) visit(dep, [...trail, name]);
  state.set(name, 'done');
}
for (const name of byName.keys()) visit(name, []);

// Generated section of TOPOLOGY.md.
const groups = ['foundation', 'record', 'river', 'assist', 'surface', 'compose', 'apps', 'infra'];
const id = (n) => n.replace('@river/', '').replace(/[^a-z0-9]/g, '_');
let mermaid = 'flowchart BT\n';
for (const group of groups) {
  const members = packages.filter((p) => p.group === group);
  if (members.length === 0) continue;
  mermaid += `  subgraph ${group}\n`;
  for (const p of members) mermaid += `    ${id(p.name)}["${p.name}"]\n`;
  mermaid += '  end\n';
}
for (const p of packages) {
  const direct = p.internal.filter((d) => !p.internal.some((o) => o !== d && reaches(o, d)));
  for (const d of direct) mermaid += `  ${id(p.name)} --> ${id(d)}\n`;
}
function reaches(from, to, seen = new Set()) {
  if (seen.has(from)) return false;
  seen.add(from);
  const deps = byName.get(from)?.internal ?? [];
  return deps.includes(to) || deps.some((d) => reaches(d, to, seen));
}
let table = '| Package | Layer | Directory | Purpose | Depends on (@river) | External |\n|---|---|---|---|---|---|\n';
for (const group of groups) {
  for (const p of packages.filter((x) => x.group === group)) {
    const external = [...p.declared].filter((d) => !d.startsWith('@river/')).join(', ') || '—';
    table += `| \`${p.name}\` | ${group} (${p.layer}) | \`${relative(root, p.dir)}\` | ${p.manifest.description ?? ''} | ${p.internal.map((d) => d.replace('@river/', '')).join(', ') || '—'} | ${external} |\n`;
  }
}
const generated = `<!-- generated:start (node tools/check-topology.mjs --write) -->\n\`\`\`mermaid\n${mermaid}\`\`\`\n\n${table}<!-- generated:end -->`;
const topologyPath = join(root, 'TOPOLOGY.md');
if (existsSync(topologyPath)) {
  const current = readFileSync(topologyPath, 'utf8');
  const next = current.replace(/<!-- generated:start[\s\S]*?<!-- generated:end -->/, generated);
  if (process.argv.includes('--write')) writeFileSync(topologyPath, next);
  else if (next !== current) errors.push('TOPOLOGY.md is out of date: run `node tools/check-topology.mjs --write`');
}

if (errors.length > 0) {
  console.error(`Topology check failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Topology OK: ${packages.length} packages, gates and layers respected.`);
