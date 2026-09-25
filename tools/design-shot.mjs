// Design review screenshots (meta: Iteration 02 — Drafting Table Design): full-page captures with real
// device emulation through the Chrome DevTools Protocol, plus horizontal-overflow diagnostics. No deps;
// uses the locally installed Google Chrome in headless mode with a throwaway profile.
// Usage: node tools/design-shot.mjs <url> <width> <out.png> [--mobile] [--reduce] [--height=900] [--scale=2]
//        [--first-screen] [--eval=<js>] [--cookie=<name>=<value>]
// --cookie sets a cookie for the page's origin before loading it, e.g. a demo session (river-session=…)
// to capture the studio or "My river" as a persona (adr/records/ADR-0021).
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, widthArg, out, ...flags] = process.argv.slice(2);
const width = Number(widthArg);
const mobile = flags.includes('--mobile');
const reduce = flags.includes('--reduce');
const viewportHeight = Number(flags.find((f) => f.startsWith('--height='))?.split('=')[1] ?? (mobile ? 844 : 900));
const scale = Number(flags.find((f) => f.startsWith('--scale='))?.split('=')[1] ?? 1);
const firstScreen = flags.includes('--first-screen');
const profile = mkdtempSync(join(tmpdir(), 'river-design-shot-'));
const port = 9333;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
}
if (!target) { chrome.kill(); throw new Error('Chrome did not start'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) listeners.forEach((l) => l(msg));
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
const once = (method) => new Promise((r) => listeners.push((m) => m.method === method && r(m)));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height: viewportHeight, deviceScaleFactor: scale, mobile });
if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
if (reduce) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
const cookieFlag = flags.find((f) => f.startsWith('--cookie='));
if (cookieFlag) {
  const [name, ...rest] = cookieFlag.slice('--cookie='.length).split('=');
  await send('Network.enable');
  await send('Network.setCookie', { name, value: rest.join('='), url: new URL(url).origin, httpOnly: true, sameSite: 'Lax' });
}
const loaded = once('Page.loadEventFired');
await send('Page.navigate', { url });
await loaded;
await sleep(2500);
// The Next.js development indicator is not part of the design.
await send('Runtime.evaluate', { expression: "document.querySelectorAll('nextjs-portal').forEach((e) => e.remove())" });

const diag = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1; })
      .slice(0, 12)
      .map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 4).join('.') : '') + ' → ' + Math.round(el.getBoundingClientRect().right));
    return { vw, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, offenders };
  })()`,
});
const info = diag.result.value;
const evalFlag = flags.find((f) => f.startsWith('--eval='));
if (evalFlag) {
  const r = await send('Runtime.evaluate', { returnByValue: true, expression: evalFlag.slice('--eval='.length) });
  info.eval = r.result.value ?? r.exceptionDetails?.text;
}
const shot = await send('Page.captureScreenshot', {
  format: 'png', captureBeyondViewport: true,
  clip: { x: 0, y: 0, width, height: firstScreen ? viewportHeight : Math.min(info.height, 16000), scale: 1 },
});
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log(JSON.stringify(info));
ws.close();
chrome.kill();
setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
