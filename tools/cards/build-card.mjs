#!/usr/bin/env node
// Development cards (reflections/cards/): renders a card's data file into an A4-landscape PDF with the
// layout in tools/cards/template.html, in the locally installed Google Chrome (headless, over the
// DevTools Protocol). No dependencies. See tools/README.md.
//
//   node tools/cards/build-card.mjs <card.json> [--out=<file.pdf>] [--png[=<file.png>]]
//   node tools/cards/build-card.mjs --paper [--seed=<n>] [--base=<r,g,b>]
//
// The PDF goes to the data file's "output" (relative to the data file), unless --out is given.
// --png also writes a preview image (next to the PDF unless a path is given).
// --paper regenerates tools/cards/paper.jpg. CHROME=<path> selects another Chrome or Chromium binary.
// Exits with 1 when a text block overflows its box or IBM Plex did not load (the files are still written).
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name) => { const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`)); return hit === undefined ? undefined : hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true; };
const chromePath = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withChrome(url, work) {
  const profile = mkdtempSync(join(tmpdir(), 'river-card-'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  chrome.on('error', (e) => { console.error(`Could not start Chrome at ${chromePath} (${e.message}). Set CHROME=<path>.`); process.exit(2); });
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
  }
  if (!target) { chrome.kill(); throw new Error('Chrome did not start'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let seq = 0; const pending = new Map(); const listeners = []; const errors = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else if (msg.method) listeners.forEach((l) => l(msg));
  });
  const send = (method, params = {}) => new Promise((ok, fail) => {
    const id = ++seq; pending.set(id, (m) => (m.error ? fail(new Error(`${method}: ${m.error.message}`)) : ok(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
  listeners.push((m) => { if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text); });
  try {
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1123, height: 794, deviceScaleFactor: 2, mobile: false });
    const loaded = new Promise((r) => listeners.push((m) => m.method === 'Page.loadEventFired' && r()));
    await send('Page.navigate', { url });
    await loaded;
    return await work({ send, evaluate, errors });
  } finally {
    ws.close(); chrome.kill();
    setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
  }
}

async function buildPaper() {
  const seed = Number(option('seed') ?? 1925);
  const base = typeof option('base') === 'string' ? option('base').split(',').map(Number) : [232, 217, 187];
  const out = join(here, 'paper.jpg');
  await withChrome(pathToFileURL(join(here, 'paper.html')).href, async ({ evaluate }) => {
    const dataUrl = await evaluate(`makePaper(${JSON.stringify({ seed, base })})`);
    writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  });
  console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB, seed ${seed}, base ${base.join(',')})`);
}

const required = ['kicker', 'title', 'subtitle', 'identity', 'measured', 'task', 'observations', 'ownWords', 'nextTime', 'ladder', 'timeline', 'titleBlock'];

async function buildCard(dataPath) {
  let data;
  try { data = JSON.parse(readFileSync(dataPath, 'utf8')); } catch (e) { throw new Error(`Cannot read ${dataPath}: ${e.message}`); }
  const missing = required.filter((key) => !(key in data));
  if (missing.length > 0) throw new Error(`${basename(dataPath)} lacks: ${missing.join(', ')} (see tools/README.md)`);
  const out = typeof option('out') === 'string' ? resolve(option('out')) : resolve(dirname(dataPath), data.output ?? `${basename(dataPath, '.json')}.pdf`);
  const png = option('png') === undefined ? null : typeof option('png') === 'string' ? resolve(option('png')) : out.replace(/\.pdf$/i, '.png');
  const html = readFileSync(join(here, 'template.html'), 'utf8')
    .replace('<!--BASE-->', `<base href="${pathToFileURL(here + '/').href}">`)
    .replace('<!--DATA-->', `<script id="card-data" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
  const tmp = mkdtempSync(join(tmpdir(), 'river-card-page-'));
  const page = join(tmp, 'card.html');
  writeFileSync(page, html);
  const warnings = [];
  try {
    await withChrome(pathToFileURL(page).href, async ({ send, evaluate, errors }) => {
      const fontsOk = await evaluate(`Promise.all(['400 10pt "IBM Plex Sans"', '600 10pt "IBM Plex Sans"', 'italic 400 10pt "IBM Plex Sans"', '400 10pt "IBM Plex Mono"']
        .map((f) => document.fonts.load(f, 'Aa Яя 0'))).then(() => document.fonts.ready).then(() => document.fonts.check('600 10pt "IBM Plex Sans"') && document.fonts.check('10pt "IBM Plex Mono"'))`);
      await sleep(300);
      const state = await evaluate(`({ error: document.body.dataset.error ?? null, rendered: document.body.dataset.rendered === 'yes',
        overflow: [...document.querySelectorAll('[data-fit]')].filter((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).map((e) => e.dataset.fit) })`);
      if (state.error || !state.rendered) throw new Error(`The template could not render this card:\n${state.error ?? errors.join('\n')}`);
      if (!fontsOk) warnings.push('IBM Plex did not load (offline?); the PDF uses fallback fonts.');
      for (const box of state.overflow) warnings.push(`Text overflows the "${box}" box: shorten it, or adjust the box in template.html.`);
      const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 });
      writeFileSync(out, Buffer.from(pdf.data, 'base64'));
      if (png) {
        const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1122.52, height: 793.7, scale: 1 } });
        writeFileSync(png, Buffer.from(shot.data, 'base64'));
      }
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB)${png ? `\nWrote ${png}` : ''}`);
  for (const w of warnings) console.warn(`Warning: ${w}`);
  if (warnings.length > 0) process.exitCode = 1;
}

const dataPath = args.find((a) => !a.startsWith('--'));
try {
  if (option('paper')) await buildPaper();
  else if (dataPath) await buildCard(resolve(dataPath));
  else { console.error('Usage: node tools/cards/build-card.mjs <card.json> [--out=<file.pdf>] [--png[=<file.png>]]\n       node tools/cards/build-card.mjs --paper [--seed=<n>] [--base=<r,g,b>]'); process.exitCode = 2; }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
