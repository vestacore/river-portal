/* River Portal Almanac: the interactive figures.
   A plain script with no dependencies, so the almanac also works when opened straight from the file system. */
(() => {
  'use strict';
  const A = window.ALMANAC;
  if (!A) return;

  /* ============================================================ helpers */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setAttrs(n, attrs) {
    if (!attrs) return;
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : String(v));
    }
  }
  function addKids(n, kids) {
    for (const k of kids.flat(Infinity)) if (k != null && k !== false) n.append(typeof k === 'object' ? k : String(k));
  }
  function h(tag, attrs, ...kids) { const n = document.createElement(tag); setAttrs(n, attrs); addKids(n, kids); return n; }
  function s(tag, attrs, ...kids) { const n = document.createElementNS(SVGNS, tag); setAttrs(n, attrs); addKids(n, kids); return n; }

  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const repo = (p) => '../../' + p.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  const repoLink = (label, path) => h('a', { href: repo(path), title: path, text: label });
  const pad2 = (n) => String(n).padStart(2, '0');
  const int = (n) => Math.round(n).toLocaleString('en-GB');
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage may be unavailable */ } },
  };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  /* Local wall-clock times, as minutes. Treated as UTC so no time zone can shift them. */
  const minutes = (iso) => { const [d, t] = iso.split('T'); const [y, m, dd] = d.split('-').map(Number); const [hh, mm] = t.split(':').map(Number); return Date.UTC(y, m - 1, dd, hh, mm) / 60000; };
  const when = (iso, long) => { const [d, t] = iso.split('T'); const [, m, dd] = d.split('-').map(Number); return `${dd} ${long ? MONTHS[m - 1] : MONTHS[m - 1].slice(0, 3)}, ${t}`; };
  const money = (minor, cur) => {
    const sym = A.currencies[cur] || cur + ' ';
    const v = minor / 100;
    const txt = v.toLocaleString('en-GB', { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 });
    return cur === 'PLN' ? `${txt} zł` : sym + txt;
  };
  /* Greedy label rows: returns a row index for each x so that labels in a row keep a minimum gap. */
  function rows(xs, gap, max) {
    const order = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
    const last = new Array(max).fill(-Infinity), out = new Array(xs.length).fill(0);
    for (const [x, i] of order) {
      let r = last.findIndex((l) => x - l >= gap);
      if (r < 0) r = last.indexOf(Math.min(...last));
      out[i] = r; last[r] = x;
    }
    return out;
  }
  const api = {};

  /* ============================================================ theme and paper */
  const root = document.documentElement;
  const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  const theme = () => root.dataset.theme || (darkMq.matches ? 'blueprint' : 'paper');
  const PAPERS = {
    paper: { seed: 1925, base: [232, 217, 187], light: [255, 250, 238], dark: [96, 74, 44], grain: 2.2, amp: [15, 7, 3.5], fibres: 0.6 },
    blueprint: { seed: 1925, base: [25, 60, 96], light: [190, 222, 252], dark: [6, 20, 38], grain: 2.6, amp: [9, 4.5, 2.4], fibres: 0.45 },
  };
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* The card's paper recipe (tools/cards/paper.html), made seamless: lattice noise wraps, and fibres and specks are drawn on every side. */
  function paperTile(size, P) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const rnd = mulberry32(P.seed);
    const gauss = () => { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
    const oct = [[4, P.amp[0]], [16, P.amp[1]], [64, P.amp[2]]].map(([n, amp]) => ({ n, amp, v: Float32Array.from({ length: n * n }, () => rnd() * 2 - 1) }));
    const img = ctx.createImageData(size, size), d = img.data;
    const sm = (t) => t * t * (3 - 2 * t);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let t = 0;
        for (const o of oct) {
          const fx = (x / size) * o.n, fy = (y / size) * o.n, x0 = fx | 0, y0 = fy | 0, x1 = (x0 + 1) % o.n, y1 = (y0 + 1) % o.n;
          const sx = sm(fx - x0), sy = sm(fy - y0), v = o.v, n = o.n;
          const a = v[y0 * n + x0], b = v[y0 * n + x1], cc = v[y1 * n + x0], dd = v[y1 * n + x1];
          t += ((a + (b - a) * sx) * (1 - sy) + (cc + (dd - cc) * sx) * sy) * o.amp;
        }
        const g = gauss() * P.grain, i = (y * size + x) * 4;
        d[i] = P.base[0] + t + g; d[i + 1] = P.base[1] + t * 0.97 + g; d[i + 2] = P.base[2] + t * 0.92 + g; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const k = size / 720, offs = [-size, 0, size];
    ctx.lineCap = 'round';
    const fibres = Math.round((size * size) / 2600 * P.fibres);
    for (let f = 0; f < fibres; f++) {
      const light = rnd() < 0.56, col = light ? P.light : P.dark, alpha = light ? 0.1 + rnd() * 0.16 : 0.07 + rnd() * 0.12;
      const x = rnd() * size, y = rnd() * size, len = (5 + rnd() * 24) * k, ang = rnd() * Math.PI * 2, bend = (rnd() - 0.5) * len * 0.5;
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len, cx = (x + x2) / 2 - Math.sin(ang) * bend, cy = (y + y2) / 2 + Math.cos(ang) * bend;
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha.toFixed(3)})`;
      ctx.lineWidth = (0.5 + rnd() * 0.7) * k;
      for (const ox of offs) for (const oy of offs) {
        if (Math.max(x, x2, cx) + ox < 0 || Math.min(x, x2, cx) + ox > size || Math.max(y, y2, cy) + oy < 0 || Math.min(y, y2, cy) + oy > size) continue;
        ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.quadraticCurveTo(cx + ox, cy + oy, x2 + ox, y2 + oy); ctx.stroke();
      }
    }
    const specks = Math.round((size * size) / 1900);
    for (let f = 0; f < specks; f++) {
      const x = rnd() * size, y = rnd() * size, r = (0.4 + rnd()) * k, dark = rnd() < 0.7, col = dark ? P.dark : P.light;
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(dark ? 0.1 + rnd() * 0.22 : 0.15 + rnd() * 0.2).toFixed(3)})`;
      for (const ox of offs) for (const oy of offs) {
        const px = x + ox, py = y + oy;
        if (px < -r || px > size + r || py < -r || py > size + r) continue;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    return c;
  }
  const paperCache = {}, paperReady = {};
  const TILE = 720;
  root.style.setProperty('--paper-size', TILE + 'px');
  function applyPaper() {
    const t = theme();
    const use = (url) => { if (theme() !== t) return; root.style.setProperty('--paper-img', url ? `url("${url}")` : 'none'); };
    // Never leave one theme's paper under the other theme's ink while a new sheet is being made.
    if (!paperReady[t]) root.style.setProperty('--paper-img', 'none');
    if (!paperCache[t]) {
      paperCache[t] = new Promise((resolve) => {
        const run = () => {
          try {
            const c = paperTile(Math.round(TILE * Math.min(2, window.devicePixelRatio || 1)), PAPERS[t]);
            if (c.toBlob) c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : c.toDataURL('image/jpeg', 0.88)), 'image/jpeg', 0.88);
            else resolve(c.toDataURL('image/jpeg', 0.88));
          } catch (e) { resolve(null); }
        };
        if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 700 }); else setTimeout(run, 40);
      });
    }
    paperCache[t].then((url) => { paperReady[t] = true; use(url); });
  }
  function themes() {
    const btn = $('#theme-toggle');
    const sync = () => btn && btn.setAttribute('aria-pressed', String(theme() === 'blueprint'));
    if (btn) btn.addEventListener('click', () => {
      const next = theme() === 'blueprint' ? 'paper' : 'blueprint';
      root.dataset.theme = next; store.set('river-almanac-theme', next); sync(); applyPaper();
    });
    const onSystem = () => { if (!store.get('river-almanac-theme')) { delete root.dataset.theme; sync(); applyPaper(); } };
    if (darkMq.addEventListener) darkMq.addEventListener('change', onSystem); else if (darkMq.addListener) darkMq.addListener(onSystem);
    sync(); applyPaper();
  }

  /* ============================================================ sheets: frames, zones, title blocks */
  const ZONE_LETTERS = 'ABCDEFGHJKLMNPQR';
  function zones(f) {
    const w = f.clientWidth, hh = f.clientHeight;
    if (!w || !hh) return;
    const nx = Math.max(4, Math.min(8, Math.round(w / 150))), ny = Math.max(3, Math.min(16, Math.round(hh / 260)));
    const key = nx + 'x' + ny;
    if (f.dataset.z === key) return;
    f.dataset.z = key;
    f.replaceChildren();
    for (let i = 0; i < nx; i++) for (const side of ['t', 'b']) {
      f.append(h('span', { class: `z z-${side}`, style: { left: `${((i + 0.5) / nx) * 100}%` }, text: String(i + 1) }));
      if (i) f.append(h('i', { class: `zt zt-${side}`, style: { left: `${(i / nx) * 100}%` } }));
    }
    for (let j = 0; j < ny; j++) for (const side of ['l', 'r']) {
      f.append(h('span', { class: `z z-${side}`, style: { top: `${((j + 0.5) / ny) * 100}%` }, text: ZONE_LETTERS[j] }));
      if (j) f.append(h('i', { class: `zt zt-${side}`, style: { top: `${(j / ny) * 100}%` } }));
    }
    for (const side of ['t', 'b', 'l', 'r']) f.append(h('b', { class: `cm cm-${side}` }));
  }
  function sheets() {
    const ro = 'ResizeObserver' in window ? new ResizeObserver((entries) => entries.forEach((e) => zones(e.target))) : null;
    for (const sheet of $$('.sheet')) {
      const f = h('div', { class: 'frame', 'aria-hidden': 'true' });
      sheet.prepend(f);
      zones(f);
      if (ro) ro.observe(f);
      sheet.append(h('div', { class: 'tblock', 'aria-hidden': 'true' },
        h('div', { class: 'tb-name' }, h('b', { text: 'River Portal' }), h('span', { text: `Almanac · ${A.meta.date} · rev. ${A.meta.rev}` })),
        h('div', null, h('span', { text: 'Sheet' }), h('strong', { text: `${sheet.dataset.no} / ${A.meta.last}` })),
        h('div', null, h('span', { text: 'Title' }), h('strong', { text: sheet.dataset.name })),
        h('div', null, h('span', { text: 'Drawn by' }), h('strong', { text: A.meta.drawn })),
        h('div', null, h('span', { text: 'Steward' }), h('strong', { text: A.meta.steward }))));
    }
  }

  /* ============================================================ register, scroll position, menu */
  function register() {
    const links = $$('.register a'), all = $$('.sheet'), mast = $('.mast'), menu = $('#menu-toggle');
    let queued = false;
    const update = () => {
      queued = false;
      const line = window.innerHeight * 0.35;
      let cur = all[0];
      for (const sh of all) if (sh.getBoundingClientRect().top <= line) cur = sh;
      for (const a of links) a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + cur.id));
    };
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    if (!menu || !mast) return;
    const close = () => { mast.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
    menu.addEventListener('click', () => { const open = !mast.classList.contains('open'); mast.classList.toggle('open', open); menu.setAttribute('aria-expanded', String(open)); });
    links.forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mast.classList.contains('open')) { close(); menu.focus(); } });
    document.addEventListener('click', (e) => { if (mast.classList.contains('open') && !mast.contains(e.target)) close(); });
  }

  /* ============================================================ glossary terms */
  function terms() {
    const byId = Object.fromEntries(A.glossary.map((g) => [g.id, g]));
    const dl = $('#glossary');
    if (dl) for (const g of A.glossary) dl.append(h('dt', { id: 'g-' + g.id, text: g.term }), h('dd', { html: md(g.def) }));
    let pop = null, owner = null;
    const close = () => { if (!pop) return; pop.remove(); pop = null; if (owner) owner.setAttribute('aria-expanded', 'false'); owner = null; };
    for (const t of $$('.term')) {
      const g = byId[t.dataset.term];
      if (!g) continue;
      t.setAttribute('role', 'button');
      t.setAttribute('aria-expanded', 'false');
      t.addEventListener('click', (e) => {
        e.preventDefault();
        if (owner === t) { close(); return; }
        close();
        owner = t;
        t.setAttribute('aria-expanded', 'true');
        pop = h('div', { class: 'pop', role: 'dialog', 'aria-label': g.term },
          h('span', { class: 'label', text: g.term }), h('p', { html: md(g.def) }), h('a', { href: '#g-' + g.id, text: 'Glossary →', onclick: close }));
        document.body.append(pop);
        const r = t.getBoundingClientRect(), vw = document.documentElement.clientWidth;
        const left = Math.max(12, Math.min(r.left, vw - pop.offsetWidth - 12));
        pop.style.left = left + window.scrollX + 'px';
        pop.style.top = r.bottom + window.scrollY + 8 + 'px';
      });
    }
    document.addEventListener('click', (e) => { if (pop && !pop.contains(e.target) && !e.target.closest('.term')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop) { const o = owner; close(); if (o) o.focus(); } });
  }

  /* ============================================================ 00 cover: the card, unfolded */
  function cover() {
    const host = $('#cover-net');
    if (!host) return;
    const W = 150, H = 106, X0 = 40, Y0 = 46;
    const cells = { '01': [0, 0], '02': [1, 0], '03': [2, 0], '04': [0, 1], '00': [1, 1], '05': [2, 1], '06': [0, 2], '07': [1, 2], '08': [2, 2], '09': [1, 3] };
    const bySheet = Object.fromEntries(A.sheets.map((sh) => [sh.no, sh]));
    const svg = s('svg', { viewBox: '0 0 540 530', role: 'group', 'aria-label': 'Fig. 0: the development card unfolded into ten sheets' });
    const cx = X0 + 1.5 * W, cy = Y0 + 1.5 * H;
    // construction: centre lines, circles through the card's corners and through the middle column, diagonals, compass arcs
    svg.append(s('path', { class: 'ln-dashdot', d: `M${X0 - 26} ${cy} H${X0 + 3 * W + 26} M${cx} ${Y0 - 8} V${Y0 + 4 * H + 16}` }));
    svg.append(s('circle', { class: 'ln-blue', cx, cy, r: Math.hypot(W / 2, H / 2) }));
    svg.append(s('circle', { class: 'ln-blue', cx, cy, r: Math.hypot(W / 2, H * 1.5), 'stroke-dasharray': '2 5' }));
    svg.append(s('path', { class: 'ln-blue', d: `M${X0 + W} ${Y0 + H} L${X0 + 2 * W} ${Y0 + 2 * H} M${X0 + 2 * W} ${Y0 + H} L${X0 + W} ${Y0 + 2 * H}` }));
    for (const [px, py, sx, sy] of [[X0 + W, Y0 + H, -1, -1], [X0 + 2 * W, Y0 + H, 1, -1], [X0 + W, Y0 + 2 * H, -1, 1], [X0 + 2 * W, Y0 + 2 * H, 1, 1]]) {
      const r = 18;
      svg.append(s('path', { class: 'ln-blue-solid', d: `M${px + sx * r} ${py} A${r} ${r} 0 0 ${sx * sy > 0 ? 1 : 0} ${px} ${py + sy * r}`, opacity: 0.7 }));
    }
    // panels
    for (const [no, [c, r]] of Object.entries(cells)) {
      const sh = bySheet[no], x = X0 + c * W, y = Y0 + r * H;
      const a = s('a', { href: '#' + sh.id, class: 'net-panel' + (no === '00' ? ' net-card' : ''), 'aria-label': `Sheet ${no}: ${sh.name}` });
      a.append(s('rect', { class: 'np', x, y, width: W, height: H }));
      a.append(s('text', { class: 'np-no', x: x + 10, y: y + 20, text: no }));
      a.append(s('text', { class: 'np-name', x: x + 10, y: y + H - 12, text: (no === '00' ? 'Card 001 · cover' : sh.short).toUpperCase() }));
      if (no === '00') {
        // the card in miniature: title, measured band, timeline, ladder
        a.append(s('rect', { class: 'f-ink', x: x + 34, y: y + 12, width: 62, height: 5 }), s('rect', { class: 'f-ink', x: x + 34, y: y + 21, width: 42, height: 3, opacity: 0.6 }));
        for (let i = 0; i < 5; i++) a.append(s('path', { class: 'ln-thin', d: `M${x + 10 + i * 27} ${y + 38} h20 m-20 -3 v6 m20 -6 v6` }));
        a.append(s('path', { class: 'ln-thin', d: `M${x + 10} ${y + 66} H${x + 100}` }));
        [[12, 6], [30, 9], [34, 4], [60, 7], [66, 2], [70, 12]].forEach(([o, w]) => a.append(s('rect', { class: 'f-ink', x: x + 10 + o, y: y + 60, width: w, height: 5 })));
        [4, 7, 2, 9, 0, 5].forEach((w, i) => a.append(s('rect', { class: 'f-red', x: x + 112, y: y + 46 + i * 6, width: w * 2 + 1, height: 3, opacity: 0.8 })));
      }
      svg.append(a);
    }
    // fold lines on the shared edges
    let folds = '';
    for (const [c, r] of Object.values(cells)) {
      const has = (cc, rr) => Object.values(cells).some(([a, b]) => a === cc && b === rr);
      if (has(c + 1, r)) folds += `M${X0 + (c + 1) * W} ${Y0 + r * H} v${H}`;
      if (has(c, r + 1)) folds += `M${X0 + c * W} ${Y0 + (r + 1) * H} h${W}`;
    }
    svg.append(s('path', { class: 'fold', d: folds }));
    // dimensions of the card: 297 × 210 mm
    const dy = Y0 - 18;
    svg.append(s('path', { class: 'ln-thin', d: `M${X0 + W} ${Y0 - 4} V${dy - 6} M${X0 + 2 * W} ${Y0 - 4} V${dy - 6} M${X0 + W} ${dy} H${X0 + 2 * W} M${X0 + W - 4} ${dy + 4} l8 -8 M${X0 + 2 * W - 4} ${dy + 4} l8 -8` }));
    svg.append(s('text', { class: 'tx tx-mid', x: cx, y: dy - 5, text: '297' }));
    const dx = X0 + 3 * W + 18;
    svg.append(s('path', { class: 'ln-thin', d: `M${X0 + 3 * W + 4} ${Y0 + H} H${dx + 6} M${X0 + 3 * W + 4} ${Y0 + 2 * H} H${dx + 6} M${dx} ${Y0 + H} V${Y0 + 2 * H} M${dx - 4} ${Y0 + H + 4} l8 -8 M${dx - 4} ${Y0 + 2 * H + 4} l8 -8` }));
    svg.append(s('text', { class: 'tx tx-mid', x: dx + 12, y: cy, transform: `rotate(90 ${dx + 12} ${cy})`, text: '210' }));
    // legend
    const ly = Y0 + 3 * H + 30;
    svg.append(s('path', { class: 'fold', d: `M${X0} ${ly} h26` }), s('text', { class: 'tx-m', x: X0 + 34, y: ly + 4, text: 'FOLD' }));
    svg.append(s('path', { class: 'ln-dashdot', d: `M${X0} ${ly + 20} h26` }), s('text', { class: 'tx-m', x: X0 + 34, y: ly + 24, text: 'CENTRE LINE' }));
    svg.append(s('path', { class: 'ln-blue', d: `M${X0} ${ly + 40} h26` }), s('text', { class: 'tx-m', x: X0 + 34, y: ly + 44, text: 'CONSTRUCTION' }));
    svg.append(s('text', { class: 'tx-m', x: X0 + 2 * W + 10, y: ly + 24, text: 'CARD 001 · A4 · MM' }), s('text', { class: 'tx-m', x: X0 + 2 * W + 10, y: ly + 40, text: 'UNFOLDED: 10 SHEETS' }));
    host.append(svg);
  }

  /* ============================================================ 01 the river: plan and section A–A */
  function riverFigure() {
    const host = $('#river-fig'), chipsHost = $('#river-parts'), panel = $('#river-panel');
    if (!host) return;
    const parts = A.river;
    const byId = Object.fromEntries(parts.map((p) => [p.id, p]));
    const offset = (pts, dist) => pts.map((p, i) => {
      const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dy / l, -dx / l]; };
      const n1 = i > 0 ? nrm(pts[i - 1], p) : null, n2 = i < pts.length - 1 ? nrm(p, pts[i + 1]) : null;
      if (!n1) return [p[0] + n2[0] * dist, p[1] + n2[1] * dist];
      if (!n2) return [p[0] + n1[0] * dist, p[1] + n1[1] * dist];
      const mx = n1[0] + n2[0], my = n1[1] + n2[1], ml = Math.hypot(mx, my), ux = mx / ml, uy = my / ml, k = dist / (ux * n1[0] + uy * n1[1]);
      return [p[0] + ux * k, p[1] + uy * k];
    });
    const pts = (a) => a.map((p) => p.map((v) => +v.toFixed(1)).join(',')).join(' ');
    const C = [[430, -10], [430, 110], [320, 220], [320, 330], [440, 450], [440, 604]];
    const L0 = offset(C, -40), R0 = offset(C, 40);
    const bay = [[280, 238], [206, 238], [190, 254], [190, 290], [206, 306], [280, 306]];
    const basin = [[470, 24], [548, 24], [566, 42], [566, 72], [548, 90], [470, 90]];
    const L = [...L0.slice(0, 3), ...bay, ...L0.slice(3)];
    const R = [R0[0], ...basin, ...R0.slice(1)];
    const hatch = (P, sgn) => {
      let d = '';
      for (let i = 0; i < P.length - 1; i++) {
        const [x1, y1] = P[i], [x2, y2] = P[i + 1], len = Math.hypot(x2 - x1, y2 - y1);
        if (len < 1) continue;
        const ux = (x2 - x1) / len, uy = (y2 - y1) / len, nx = uy * sgn, ny = -ux * sgn;
        for (let t = 4; t < len - 2; t += 7) d += `M${(x1 + ux * t).toFixed(1)} ${(y1 + uy * t).toFixed(1)}l${(nx * 9 + ux * 4).toFixed(1)} ${(ny * 9 + uy * 4).toFixed(1)}`;
      }
      return d;
    };
    const dia = (x, y, r) => `M${x} ${y - r} l${r} ${r} l${-r} ${r} l${-r} ${-r} z`;
    const chevron = (x, y, ux, uy) => { const nx = uy, ny = -ux; return `M${x - ux * 7 + nx * 6} ${y - uy * 7 + ny * 6} L${x} ${y} L${x - ux * 7 - nx * 6} ${y - uy * 7 - ny * 6}`; };
    const boat = (x, y, deg) => s('polygon', { class: 'f-warm', points: '-6,-11 3,-11 6,-8 6,11 -6,11', transform: `translate(${x} ${y}) rotate(${deg})`, stroke: 'none' });
    const q = Math.SQRT1_2;
    const chevrons = [[430, 46, 0, 1], [375, 165, -q, q], [320, 262, 0, 1], [414, 424, q, q], [440, 574, 0, 1]];
    const tide = 'M484 600 C 660 606, 742 540, 742 400 S 726 170, 690 128';
    const station = [258, 440];
    const svg = s('svg', { viewBox: '0 0 1160 640', 'aria-hidden': 'true' });
    svg.append(s('defs', null,
      s('clipPath', { id: 'rv-plan' }, s('rect', { x: 0, y: 0, width: 780, height: 612 })),
      s('pattern', { id: 'rv-ground', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, s('line', { class: 'hatch-ln', x1: 0, y1: 0, x2: 0, y2: 8 })),
      s('pattern', { id: 'rv-dots', width: 6, height: 6, patternUnits: 'userSpaceOnUse' }, s('circle', { class: 'dot-f', cx: 3, cy: 3, r: 0.9 })),
      s('marker', { id: 'rv-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' }, s('path', { class: 'f-red', d: 'M0 0 L8 4 L0 8 z' }))));
    // plan
    const plan = s('g', { 'clip-path': 'url(#rv-plan)' });
    plan.append(s('polygon', { class: 'f-water', points: pts([...L, ...R.slice().reverse()]) }));
    plan.append(s('path', { class: 'hatch-ln-2', d: hatch(L, -1) + hatch(R, 1) }));
    plan.append(s('polyline', { class: 'ln', points: pts(L) }), s('polyline', { class: 'ln', points: pts(R) }));
    plan.append(s('polyline', { class: 'ln-dashdot', points: pts(C) }));
    plan.append(s('path', { class: 'ln-blue-solid', d: chevrons.map((c) => chevron(...c)).join('') }));
    plan.append(s('path', { class: 'ln-blue-solid', d: 'M660 14 L600 30 L566 50 M672 118 L612 98 L566 64 M646 236 L520 214 L426 171' }));
    plan.append(s('path', { class: 'f-blue', d: dia(660, 14, 5) + dia(672, 118, 5) + dia(646, 236, 5) }));
    plan.append(boat(374, 384, -45), boat(440, 526, 0));
    plan.append(s('path', { class: 'ln', 'stroke-width': 2.4, d: 'M400 492 H480' }), s('rect', { class: 'f-ink', x: 392, y: 488, width: 8, height: 8 }), s('rect', { class: 'f-ink', x: 480, y: 488, width: 8, height: 8 }));
    plan.append(s('circle', { class: 'ln', cx: station[0], cy: station[1], r: 9 }), s('path', { class: 'f-ink', d: `M${station[0]} ${station[1] - 5} l5 8 h-10 z` }));
    for (const [x, y] of [[150, 180], [120, 392], [230, 492], [96, 262]]) plan.append(s('path', { class: 'ln-thin f-paper', d: dia(x, y, 5) }));
    for (const [x, y] of [[640, 196], [612, 318], [660, 420]]) plan.append(s('rect', { class: 'ln-thin f-paper', x: x - 4, y: y - 4, width: 8, height: 8 }));
    plan.append(s('path', { class: 'ln-thin', 'stroke-dasharray': '3 3', d: 'M400 584 H338' }), s('path', { class: 'f-teal', d: dia(330, 584, 6) }));
    plan.append(s('path', { class: 'ln f-paper', d: dia(440, 598, 7) }));
    plan.append(s('path', { class: 'ln-red', 'stroke-dasharray': '6 4', d: tide, 'marker-end': 'url(#rv-arrow)' }));
    plan.append(s('path', { class: 'ln-thin', 'stroke-dasharray': '10 4 2 4', d: 'M376 556 H504' }), s('path', { class: 'f-ink', d: 'M372 551 l8 0 l-4 8 z M500 551 l8 0 l-4 8 z' }));
    plan.append(s('text', { class: 'tx-b', x: 366, y: 546, text: 'A' }), s('text', { class: 'tx-b', x: 505, y: 546, text: 'A' }));
    svg.append(plan);
    svg.append(s('text', { class: 'tx-m', x: 28, y: 632, text: 'PLAN · THE RIVER FROM ABOVE · NOT TO SCALE' }));
    // section A–A
    const bed = [[810, 250], [890, 250], [922, 380], [1018, 380], [1050, 250], [1150, 250]];
    svg.append(s('text', { class: 'tx-b', x: 820, y: 40, text: 'SECTION A–A' }), s('text', { class: 'tx-m', x: 820, y: 56, text: 'ACROSS THE CHANNEL, NEAR THE MOUTH' }));
    svg.append(s('polygon', { fill: 'url(#rv-ground)', points: pts([...bed, [1150, 420], [810, 420]]) }));
    svg.append(s('polygon', { class: 'f-water', points: '895.4,272 1044.6,272 1022.4,362 917.6,362' }));
    svg.append(s('polygon', { fill: 'url(#rv-dots)', class: 'ln-thin', points: '917.6,362 1022.4,362 1018,380 922,380' }));
    svg.append(s('polyline', { class: 'ln', 'stroke-width': 2, points: pts(bed) }));
    svg.append(s('path', { class: 'ln-blue-solid', d: 'M895.4 272 H1044.6' }), s('path', { class: 'ln-blue-solid', d: 'M964 258 h12 l-6 8 z M962 278 h16 M965 283 h10' }));
    svg.append(s('path', { class: 'ln-blue', d: 'M930 268 V226 M970 256 V226 M1010 268 V226' }), s('path', { class: 'f-blue', d: 'M926 230 l4 -8 l4 8 z M966 230 l4 -8 l4 8 z M1006 230 l4 -8 l4 8 z' }));
    svg.append(s('path', { class: 'ln-thin', d: 'M810 420 H1150 M810 250 V420 M1150 250 V420' }));

    // the numbered parts: label, leader, balloon and a highlight of the feature
    const geo = {
      left: { lab: [28, 130], dir: 'r', to: [300, 150], hl: () => s('polygon', { class: 'hl hl-fill', points: pts([[0, 0], [390, 0], [390, 93.4], [280, 203.4], ...bay, [280, 346.6], [400, 466.6], [400, 612], [0, 612]]) }) },
      right: { lab: [560, 262], dir: 'l', to: [470, 300], hl: () => s('polygon', { class: 'hl hl-fill', points: pts([[470, 0], [780, 0], [780, 612], [480, 612], [480, 433.4], [360, 313.4], [360, 236.6], [470, 126.6], ...basin.slice().reverse()]) }) },
      stream: { lab: [28, 40], dir: 'r', to: [428, 70], hl: () => s('polyline', { class: 'hl hl-stroke', points: pts(C) }) },
      springs: { lab: [690, 22], dir: 'l', to: [662, 16], hl: () => s('path', { class: 'hl hl-stroke', d: 'M660 14 L600 30 L566 50 M672 118 L612 98 L566 64 M646 236 L520 214 L426 171' }) },
      basins: { lab: [592, 150], dir: 'l', to: [540, 92], hl: () => s('polyline', { class: 'hl hl-stroke', points: pts(basin) }) },
      boats: { lab: [28, 330], dir: 'r', to: [368, 380], hl: () => s('path', { class: 'hl hl-stroke', d: 'M366 372 l14 14 M440 512 v28' }) },
      pools: { lab: [28, 230], dir: 'r', to: [212, 270], hl: () => s('polyline', { class: 'hl hl-stroke', points: pts(bay) }) },
      tolls: { lab: [560, 470], dir: 'l', to: [490, 492], hl: () => s('path', { class: 'hl hl-stroke', d: 'M394 492 H486' }) },
      keepers: { lab: [28, 430], dir: 'r', to: [250, 440], hl: () => s('circle', { class: 'hl hl-stroke', cx: station[0], cy: station[1], r: 13 }) },
      mouth: { lab: [28, 540], dir: 'r', to: [324, 584], hl: () => s('path', { class: 'hl hl-stroke', d: dia(330, 584, 10) + dia(440, 598, 11) }) },
      tide: { lab: [560, 530], dir: 'r', to: [741, 536], hl: () => s('path', { class: 'hl hl-stroke', d: tide }) },
      current: { lab: [560, 360], dir: 'l', to: [416, 420], hl: () => s('path', { class: 'hl hl-stroke', d: chevrons.map((c) => chevron(...c)).join('') }) },
      surface: { lab: [820, 160], dir: 'd', to: [930, 272], hl: () => s('path', { class: 'hl hl-stroke', d: 'M895.4 272 H1044.6' }) },
      sediment: { lab: [960, 476], dir: 'u', to: [972, 372], hl: () => s('polygon', { class: 'hl hl-stroke', points: '917.6,362 1022.4,362 1018,380 922,380' }) },
      bed: { lab: [820, 476], dir: 'u', to: [902, 330], hl: () => s('polyline', { class: 'hl hl-stroke', points: pts(bed) }) },
      clear: { lab: [1016, 188], dir: 'd', to: [1000, 318], hl: () => s('polygon', { class: 'hl hl-stroke', points: '895.4,272 1044.6,272 1022.4,362 917.6,362' }) },
    };
    const groups = {};
    const order = ['left', 'right', 'stream', 'springs', 'basins', 'boats', 'pools', 'tolls', 'keepers', 'mouth', 'tide', 'current', 'surface', 'sediment', 'bed', 'clear'];
    for (const id of order) {
      const p = byId[id], g = geo[id];
      const t1 = p.name.toUpperCase(), t2 = p.meaning;
      const [lx, ly] = g.lab, [tx, ty] = g.to;
      const tw = Math.max(t1.length, t2.length) * 7.2;
      let from;
      if (g.dir === 'r') from = [lx + tw + 8, ly - 4];
      else if (g.dir === 'l') from = [lx - 26, ly - 4];
      else if (g.dir === 'd') from = [lx + 24, ly + 22];
      else from = [lx + 24, ly - 16];
      const elbow = g.dir === 'r' ? `L${from[0] + 10} ${from[1]}` : g.dir === 'l' ? `L${from[0] - 10} ${from[1]}` : '';
      const grp = s('g', { class: 'hot', 'data-id': id });
      grp.append(g.hl());
      grp.append(s('path', { class: 'leader', d: `M${from[0]} ${from[1]} ${elbow} L${tx} ${ty}` }), s('circle', { class: 'f-red', cx: tx, cy: ty, r: 2 }));
      grp.append(s('g', { class: 'bal', transform: `translate(${lx - 14} ${ly - 4})` }, s('circle', { r: 9 }), s('text', { text: String(p.n) })));
      grp.append(s('text', { class: 'tx-b', x: lx, y: ly, text: t1 }), s('text', { class: 'tx-m', x: lx, y: ly + 15, text: t2 }));
      grp.addEventListener('click', () => select(id));
      groups[id] = grp;
      svg.append(grp);
    }
    host.append(svg);

    const chips = {};
    for (const p of parts) {
      const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: () => select(p.id) }, h('b', { text: pad2(p.n) }), p.name);
      chips[p.id] = b;
      chipsHost.append(b);
    }
    function select(id) {
      const p = byId[id];
      for (const [k, g] of Object.entries(groups)) g.classList.toggle('on', k === id);
      for (const [k, b] of Object.entries(chips)) b.setAttribute('aria-pressed', String(k === id));
      const planned = /planned|specification only/.test(p.status);
      panel.replaceChildren(
        h('div', { class: 'rp-head' },
          h('div', { class: 'rp-n', text: `Part ${pad2(p.n)} of ${parts.length}` }),
          h('div', { class: 'rp-name', text: p.name }),
          h('div', { class: 'rp-meaning', text: p.meaning }),
          h('span', { class: 'rp-status' + (planned ? ' is-planned' : ''), text: p.status })),
        field('In the river', p.river), field('In the portal', p.portal), field('In the code', p.code, true), field('In the studio', p.studio),
        h('div', { class: 'rp-links' }, h('span', { class: 'label', text: 'In the specification' }), p.spec.map((path) => repoLink(path.split('/').pop().replace(/\.md$/, ''), path))));
    }
    function field(label, text, isMd) { return h('div', { class: 'rp-field' }, h('span', { class: 'label', text: label }), h('p', isMd ? { html: md(text) } : { text })); }
    select('left');
  }

  /* ============================================================ 02 timeline */
  function timeline() {
    const T = A.timeline, chart = $('#tl-chart'), chipsHost = $('#tl-chips'), panel = $('#tl-panel');
    if (!chart) return;
    const D = T.directives, VW = 1200, VH = 272, X0 = 40, X1 = 1160;
    const t0 = minutes(T.start), t1 = minutes(T.end), dT = D.map((d) => minutes(d.at));
    const clockX = (t) => X0 + ((t - t0) / (t1 - t0)) * (X1 - X0);
    const step = (X1 - X0 - 130) / (D.length - 1);
    const kT = [t0, ...dT, t1], kX = [X0, ...dT.map((_, i) => X0 + 20 + i * step), X1];
    const storyX = (t) => {
      for (let i = 0; i < kT.length - 1; i++) {
        if (t <= kT[i + 1] || i === kT.length - 2) { const f = kT[i + 1] === kT[i] ? 0 : Math.max(0, Math.min(1, (t - kT[i]) / (kT[i + 1] - kT[i]))); return kX[i] + f * (kX[i + 1] - kX[i]); }
      }
      return X1;
    };
    let alpha = 0, sel = 0;
    const X = (t) => (1 - alpha) * clockX(t) + alpha * storyX(t);
    const byHash = Object.fromEntries(T.commits.map((c) => [c.hash, c]));

    function draw() {
      const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}`, 'aria-hidden': 'true' });
      svg.append(s('defs', null, s('pattern', { id: 'tl-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, s('line', { class: 'hatch-ln-2', x1: 0, y1: 0, x2: 0, y2: 6 }))));
      const ax = X(minutes(T.away.from)), bx = X(minutes(T.away.to));
      svg.append(s('rect', { class: 'tl-away', x: ax, y: 44, width: Math.max(0, bx - ax), height: 104 }));
      if (bx - ax > 190) svg.append(s('text', { class: 'tx-m tx-mid', x: (ax + bx) / 2, y: 100, text: T.away.label.toUpperCase() }));
      const midnight = X(minutes('2026-09-25T00:00'));
      svg.append(s('path', { class: 'ln-faint', 'stroke-dasharray': '2 4', d: `M${midnight} 40 V170` }));
      // phases
      T.phases.forEach((p, i) => {
        const a = X(minutes(D.find((d) => d.id === p.from).at)), nx = T.phases[i + 1];
        const b = nx ? X(minutes(D.find((d) => d.id === nx.from).at)) : X1;
        svg.append(s('path', { class: 'ln-thin', d: `M${a + 1.5} 34 V28 H${b - 1.5} V34` }));
        const label = p.name.toUpperCase();
        if (b - a > label.length * 6.6 + 14) svg.append(s('text', { class: 'tx-m', x: a + 6, y: 21, text: label }));
      });
      // axis, ticks and days
      svg.append(s('line', { class: 'ln', x1: X0, y1: 170, x2: X1, y2: 170 }));
      for (let t = t0; t <= t1; t += 180) {
        const x = X(t), hh = Math.round(((t / 60) % 24 + 24) % 24);
        svg.append(s('line', { class: 'ln-thin', x1: x, y1: 165, x2: x, y2: 175 }));
        if (alpha < 0.5) svg.append(s('text', { class: 'tx-m tx-mid', x, y: 189, opacity: 1 - alpha * 2, text: pad2(hh) + ':00' }));
      }
      [['2026-09-24T15:00', '24 SEP', 'start'], ['2026-09-25T00:00', '25 SEP', 'middle'], ['2026-09-26T00:00', '26 SEP', 'end']].forEach(([at, label, anchor]) =>
        svg.append(s('text', { class: 'tx-b', x: X(minutes(at)), y: 206, 'text-anchor': anchor, text: label })));
      // working windows and the compaction
      const cur = D[sel].id;
      T.windows.forEach((w) => {
        const a = X(minutes(w.from)), b = X(minutes(w.to));
        const r = s('rect', { class: `tl-win${w.kind === 'reflection' ? ' refl' : ''}${w.open ? ' open' : ''}${w.m === cur ? ' on' : ''}`, x: a, y: 112, width: Math.max(2.5, b - a), height: 14 });
        r.addEventListener('click', () => select(D.findIndex((d) => d.id === w.m)));
        r.style.cursor = 'pointer';
        svg.append(r);
      });
      const cx = X(minutes(T.compaction));
      svg.append(s('path', { class: 'ln-red', d: `M${cx - 4} 97 l8 8 m0 -8 l-8 8` }));
      // commits
      const cX = T.commits.map((c) => X(minutes(c.at))), cRow = rows(cX, 64, 4), acc = D[sel].accepted || [];
      T.commits.forEach((c, i) => {
        const x = cX[i], y = 226 + cRow[i] * 13, on = acc.includes(c.hash);
        svg.append(s('line', { class: 'tl-commit', x1: x, y1: 160, x2: x, y2: 180 }));
        svg.append(s('path', { class: 'ln-faint', d: `M${x} 180 V${y - 9}` }));
        svg.append(s('text', { class: 'tx-m' + (on ? ' tx-red' : ''), x: x + 3, y, text: c.hash }));
      });
      // directives
      const dX = dT.map(X), dRow = rows(dX, 30, 2);
      D.forEach((d, i) => {
        const x = dX[i], g = s('g', { class: 'tl-dir' + (i === sel ? ' on' : '') });
        g.append(s('line', { class: 'ln-thin stem', x1: x, y1: 86, x2: x, y2: 112 }));
        if (dRow[i]) g.append(s('line', { class: 'ln-faint', x1: x, y1: 55, x2: x, y2: 70 }));
        g.append(s('path', { class: 'dia', d: `M${x} 71 l7 7 l-7 7 l-7 -7 z` }));
        g.append(s('text', { class: 'tx-b tx-mid', x, y: dRow[i] ? 51 : 64, text: d.id }));
        g.append(s('rect', { x: x - 12, y: 40, width: 24, height: 50, fill: 'transparent' }));
        g.addEventListener('click', () => select(i));
        svg.append(g);
      });
      chart.replaceChildren(svg);
    }

    const chips = D.map((d, i) => h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: () => select(i) }, h('b', { text: d.id }), d.title));
    chipsHost.append(...chips);
    chipsHost.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); select(sel + (e.key === 'ArrowRight' ? 1 : -1)); chips[sel].focus();
    });

    function renderPanel() {
      const d = D[sel], phase = [...T.phases].reverse().find((p) => D.findIndex((x) => x.id === p.from) <= sel);
      const acc = (d.accepted || []).map((hash) => byHash[hash]).filter(Boolean);
      const see = (d.plates || []).map((id) => {
        const p = A.plates.find((x) => x.id === id);
        return p ? h('button', { class: 'chip', type: 'button', onclick: () => api.showPlate && api.showPlate(id, true) }, p.title) : null;
      });
      panel.replaceChildren(
        h('div', { class: 'tl-head' },
          h('div', null,
            h('div', { class: 'tl-meta', html: `<b>${esc(d.id)}</b> · ${esc(when(d.at, true))} · ${int(d.chars)} characters · ${esc(phase ? phase.name : '')}` }),
            h('h3', { class: 'tl-title', text: d.title })),
          h('div', { class: 'tl-nav' },
            h('button', { class: 'btn', type: 'button', disabled: sel === 0, onclick: () => select(sel - 1), text: '‹ Previous' }),
            h('button', { class: 'btn', type: 'button', disabled: sel === D.length - 1, onclick: () => select(sel + 1), text: 'Next ›' }))),
        h('div', { class: 'tl-body' },
          h('div', null,
            h('span', { class: 'label', text: 'The steward asked' }), h('blockquote', { class: 'tl-asked', text: d.asked }),
            h('span', { class: 'label', text: 'What I did' }), h('p', { text: d.did }),
            h('p', { class: 'mine', text: d.learnt })),
          h('div', null,
            h('span', { class: 'label', text: 'Figures' }),
            h('div', { class: 'tl-figures' }, d.figures.map(([v, c]) => h('div', null, h('b', { text: v }), h('span', { text: c })))),
            h('span', { class: 'label', text: 'Left behind' }),
            h('ul', { class: 'tl-left' }, d.left.map(([label, path]) => h('li', null, repoLink(label, path)))),
            h('span', { class: 'label', text: 'Accepted in' }),
            acc.length
              ? acc.map((c) => h('p', { class: 'tl-commit-line', html: `<b>${c.hash}</b> · ${esc(when(c.at))} · “${esc(c.msg)}” · ${int(c.files)} ${c.files === 1 ? 'file' : 'files'}, +${int(c.add)}${c.del ? ' −' + int(c.del) : ''}` }))
              : h('p', { class: 'tl-commit-line', text: 'Not committed yet: this almanac waits for the steward’s reading.' }),
            see.length ? [h('span', { class: 'label', text: 'On the plates' }), h('div', { class: 'tl-see' }, see)] : null)));
    }
    function select(i) {
      sel = Math.max(0, Math.min(D.length - 1, i));
      chips.forEach((c, k) => c.setAttribute('aria-pressed', String(k === sel)));
      draw(); renderPanel();
    }
    const scaleBtns = $$('.tl-controls [data-scale]');
    scaleBtns.forEach((b) => b.addEventListener('click', () => {
      scaleBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const target = b.dataset.scale === 'story' ? 1 : 0;
      if (reduced()) { alpha = target; draw(); return; }
      const from = alpha, start = performance.now(), dur = 700;
      const tick = (now) => {
        const k = Math.min(1, (now - start) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        alpha = from + (target - from) * e; draw();
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    select(0);
  }

  /* ============================================================ 03 plates */
  function plates() {
    const P = A.plates, tabs = $('#plate-sets'), viewer = $('#plate-viewer'), strip = $('#plate-strip');
    if (!viewer) return;
    const setName = (id) => (A.plateSets.find((x) => x.id === id) || {}).name || '';
    tabs.setAttribute('role', 'group');
    const tabBtns = A.plateSets.map((st) => h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false', 'data-set': st.id, text: st.name, onclick: () => show(P.findIndex((p) => p.set === st.id)) }));
    tabs.append(...tabBtns);
    viewer.setAttribute('tabindex', '0');
    viewer.setAttribute('aria-label', 'Plate viewer. Use the left and right arrow keys to move between plates.');
    viewer.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
    });
    let cur = 0;
    const preload = (p) => { const im = new Image(); im.src = `assets/plates/${p.id}.webp`; };

    function show(i) {
      cur = (i + P.length) % P.length;
      const p = P[cur];
      tabBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === p.set)));
      renderViewer(p);
      renderStrip(p);
      preload(P[(cur + 1) % P.length]);
      preload(P[(cur - 1 + P.length) % P.length]);
    }
    api.showPlate = (id, scroll) => {
      const i = P.findIndex((p) => p.id === id);
      if (i < 0) return;
      show(i);
      if (scroll) $('#plates').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    };

    function renderViewer(p) {
      const portrait = p.h > p.w;
      const stage = h('div', { class: 'plate-stage' + (portrait ? ' is-portrait' : '') },
        h('img', { src: `assets/plates/${p.id}.webp`, alt: `${p.title}: a screenshot of the demo portal`, width: p.w, height: p.h, decoding: 'async' }));
      const svg = s('svg', { class: 'plate-svg', viewBox: `0 0 ${p.w} ${p.h}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      const veil = s('path', { class: 'plate-veil', 'fill-rule': 'evenodd', d: '' });
      svg.append(veil);
      const box = (r) => { const m = 5; const x = Math.max(0, r[0] - m), y = Math.max(0, r[1] - m); return [x, y, Math.min(p.w, r[0] + r[2] + m) - x, Math.min(p.h, r[1] + r[3] + m) - y]; };
      const rects = p.notes.map((n) => { const [x, y, w, hh] = box(n.r); const r = s('rect', { class: 'plate-rect', x, y, width: w, height: hh }); svg.append(r); return r; });
      stage.append(svg);
      const placed = [];
      const balloons = p.notes.map((n, i) => {
        let x = Math.max(2.5, Math.min(97.5, ((n.r[0] + 2) / p.w) * 100)), y = Math.max(3, Math.min(97, ((n.r[1] + 2) / p.h) * 100));
        while (placed.some(([px, py]) => Math.abs(px - x) < 3.2 && Math.abs(py - y) < 3.2)) x = Math.min(97.5, x + 3.6);
        placed.push([x, y]);
        const b = h('button', { class: 'balloon', type: 'button', style: { left: x + '%', top: y + '%' }, 'aria-label': `Note ${i + 1}: ${n.t}`, text: String(i + 1) });
        stage.append(b);
        return b;
      });
      const items = p.notes.map((n, i) => h('button', { type: 'button', 'aria-pressed': 'false' }, h('span', { class: 'pn-n', text: String(i + 1) }), h('span', null, h('b', { text: n.t }), h('span', { class: 'pn-d', text: n.d }))));
      let pinned = -1;
      const light = (i) => {
        rects.forEach((r, k) => r.classList.toggle('on', k === i));
        balloons.forEach((b, k) => b.classList.toggle('on', k === i));
        items.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', String(k === pinned)); });
        if (i < 0) { svg.classList.remove('has-focus'); return; }
        const [x, y, w, hh] = box(p.notes[i].r);
        veil.setAttribute('d', `M0 0H${p.w}V${p.h}H0Z M${x} ${y}h${w}v${hh}h${-w}Z`);
        svg.classList.add('has-focus');
      };
      [balloons, items].forEach((list) => list.forEach((el, i) => {
        el.addEventListener('mouseenter', () => light(i));
        el.addEventListener('mouseleave', () => light(pinned));
        el.addEventListener('focus', () => light(i));
        el.addEventListener('blur', () => light(pinned));
        el.addEventListener('click', () => { pinned = pinned === i ? -1 : i; light(pinned); if (list === balloons) items[i].scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); });
      }));
      const who = p.as ? `Signed in as <b>${esc(p.as)}</b>` : 'Public, not signed in';
      viewer.replaceChildren(
        h('div', { class: 'plate-head' },
          h('div', null, h('div', { class: 'plate-no', text: `Plate ${pad2(cur + 1)} of ${P.length} · ${setName(p.set)}` }), h('h3', { text: p.title })),
          h('div', { class: 'plate-meta', html: `${who} · ${esc(p.profile)} · <code>${esc(p.path)}</code>` })),
        h('div', { class: 'plate-stage-wrap' }, stage),
        h('div', { class: 'plate-side' },
          h('p', { class: 'plate-lead', text: p.lead }),
          h('ol', { class: 'plate-notes' }, items.map((b) => h('li', null, b))),
          h('div', { class: 'plate-nav' },
            h('button', { class: 'btn', type: 'button', text: '‹ Previous', onclick: () => show(cur - 1) }),
            h('button', { class: 'btn', type: 'button', text: 'Next plate ›', onclick: () => show(cur + 1) }))));
    }
    function renderStrip(p) {
      strip.replaceChildren(...P.map((q, i) => (q.set === p.set ? h('button', { type: 'button', 'aria-current': String(i === cur), 'aria-label': `Plate ${i + 1}: ${q.title}`, onclick: () => show(i) },
        h('img', { src: `assets/plates/thumbs/${q.id}.webp`, alt: '', width: 150, height: 92 }), h('span', { text: `${pad2(i + 1)} · ${q.title}` })) : null)).filter(Boolean));
    }
    show(0);
  }

  /* ============================================================ 04a one request down the river */
  /* The portal's redaction, copied from packages/foundation/privacy/redactPii.ts. */
  const emailPattern = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
  const phonePattern = /\+?\d[\d\s().-]{6,}\d/g;
  const handlePattern = /(^|\s)@[\w.]{3,}/g;
  const streetPattern = /(?<![\p{L}])(вул\.|вулиця|просп\.|провулок|пров\.|street|st\.|avenue|road|rd\.)\s*[\p{L}\p{N}'’ .-]{2,40}?\s*\d+[\p{L}]?/giu;
  function redactPii(text, names) {
    let out = text.replace(emailPattern, '[…]').replace(phonePattern, '[…]').replace(handlePattern, '$1[…]').replace(streetPattern, '[…]');
    for (const name of names) {
      for (const word of name.trim().split(/\s+/)) {
        if (word.length < 2) continue;
        const stem = word.length >= 6 ? word.slice(0, -2) : word.length === 5 ? word.slice(0, -1) : word;
        const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        out = out.replace(new RegExp(`(?<![\\p{L}])${escaped}[\\p{L}'’]{0,4}(?![\\p{L}])`, 'giu'), '[…]');
      }
    }
    return out;
  }

  function flowExample() {
    const host = $('#flow-example');
    if (!host) return;
    const F = A.flowExample, steps = F.steps, B = F.baseline;
    const all = [];
    steps.forEach((st, si) => (st.events || []).forEach((e) => all.push({ si, at: e[0], type: e[1], vis: e[2], note: e[3] })));
    all.forEach((e, i) => { e.seq = i + 1; });
    const approvals = [22800, 35150];
    let cur = 0, shown = 0, timer = null;
    const prev = {};

    const rail = h('div', { class: 'fx-rail', role: 'group', 'aria-label': 'Steps' },
      steps.map((st, i) => h('button', { type: 'button', 'aria-label': `Step ${i}: ${st.title}`, title: `${i} · ${st.title}`, onclick: () => go(i) })));
    const back = h('button', { class: 'btn', type: 'button', text: '‹ Back', onclick: () => go(cur - 1) });
    const next = h('button', { class: 'btn', type: 'button', text: 'Next step ›', onclick: () => go(cur + 1) });
    const replay = h('button', { class: 'btn', type: 'button', text: 'Replay from the log', title: 'Rebuild every view by replaying the events from the first one', onclick: () => replayLog() });
    const stepBox = h('div', { class: 'fx-step', 'aria-live': 'polite' });
    const logList = h('ol', { 'aria-label': 'Events in the log' });
    const logCount = h('span', { class: 'label' });
    const privBox = h('div', { class: 'fx-private' });
    const views = { olena: h('div', { class: 'view panel' }), james: h('div', { class: 'view panel' }), studio: h('div', { class: 'view panel' }), public: h('div', { class: 'view panel' }) };
    host.append(
      h('div', { class: 'fx-controls' }, rail, back, next, replay),
      stepBox,
      h('div', { class: 'fx-grid' },
        h('div', { class: 'fx-log' }, h('div', { class: 'fx-log-head' }, h('span', { class: 'label', text: 'The log · append only' }), logCount), logList, privBox),
        h('div', { class: 'fx-views' }, views.olena, views.james, views.studio, views.public)),
      redactionPanel());

    function project(events) {
      const has = (t) => events.some((e) => e.type === t);
      const count = (t) => events.filter((e) => e.type === t).length;
      const received = B.received + (has('gift.Received') ? 500 : 0);
      const approved = count('costRecord.Approved');
      const costs = B.costs + approvals.slice(0, approved).reduce((a, b) => a + b, 0) / 100;
      const wall = has('gratitudeNote.Written');
      return {
        olena: [
          ['You sent your request', has('need.Submitted')], ['We received it; a coordinator will be in touch', has('need.Acknowledged')], ['A coordinator reviewed it', has('need.Triaged')],
          ['Help has been found for you', has('need.Matched')], ['Your help is on its way', has('need.DeliveryStarted')], ['Your help has been delivered', has('need.Delivered')], ['You confirmed it arrived: thank you', has('need.Confirmed')],
        ],
        ask: has('deliveryConfirmation.Requested') && !has('need.Confirmed'),
        james: [['Promised', has('gift.Pledged')], ['Received', has('gift.Received')], ['On its way to a need', has('gift.Allocated')], ['Delivered', has('gift.Delivered')], ['Thanked', has('gift.Acknowledged')]],
        thanked: has('gift.Acknowledged'), report: has('publication.Published'),
        studio: [
          [has('need.Submitted') && !has('need.Matched') ? 1 : 0, 'requests to review or match'],
          [has('gift.Pledged') && !has('gift.Received') ? 1 : 0, 'gifts promised, not yet received'],
          [has('flow.Formed') && !has('consignment.Delivered') ? 1 : 0, 'deliveries planned or on the way'],
          [count('costRecord.Submitted') - approved, 'costs awaiting approval'],
          [has('deliveryConfirmation.Requested') && !has('deliveryConfirmation.Recorded') ? 1 : 0, 'deliveries awaiting confirmation'],
          [has('report.Generated') && !has('publication.Published') ? 1 : 0, 'reports in draft'],
        ],
        pub: [
          [int(B.requests + count('need.Submitted')), 'requests received', has('need.Submitted')],
          ['£' + int(received), 'money received', has('gift.Received')],
          ['£' + costs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'spent on delivery', approved > 0],
          [Math.round((costs / received) * 100) + '%', 'of money received spent on delivery', approved > 0 || has('gift.Received')],
          [int(B.confirmed + (has('need.Confirmed') ? 1 : 0)), 'deliveries confirmed', has('need.Confirmed')],
          [int(B.reports + (has('publication.Published') ? 1 : 0)), 'reports published', has('publication.Published')],
        ],
        wall,
      };
    }
    const miniSteps = (list) => {
      const firstOpen = list.findIndex(([, done]) => !done);
      return h('ol', { class: 'steps-mini' }, list.map(([t, done], i) => h('li', { class: done ? (i === firstOpen - 1 || (firstOpen < 0 && i === list.length - 1) ? 'done now' : 'done') : '', text: t })));
    };
    function paint(v, node, content) {
      const html = content.map((c) => (typeof c === 'string' ? c : c.outerHTML)).join('');
      if (prev[v] === html) return;
      const changed = prev[v] !== undefined;
      prev[v] = html;
      node.innerHTML = html;
      if (changed && !reduced()) { node.classList.remove('flash'); void node.offsetWidth; node.classList.add('flash'); }
    }
    function renderViews(events) {
      const p = project(events);
      paint('olena', views.olena, [
        h('span', { class: 'label', text: 'Olena’s tracking page' }), miniSteps(p.olena),
        p.ask ? h('p', { class: 'wall', text: 'Did it arrive? Yes, I received the help.' }) : null].filter(Boolean));
      paint('james', views.james, [
        h('span', { class: 'label', text: 'James’s ‘My river’' }), miniSteps(p.james),
        p.thanked ? h('p', { class: 'wall', text: redactPii(F.redaction[0].text, F.redaction[0].names.split(',')) }) : null,
        p.report ? h('p', { class: 'quiet', text: 'Report: “Help arrived: power and heating”' }) : null].filter(Boolean));
      paint('studio', views.studio, [
        h('span', { class: 'label', text: 'The coordinator’s studio' }),
        h('div', { class: 'counters' }, p.studio.map(([n, t]) => h('div', { class: n ? 'up' : '' }, h('b', { text: String(n) }), h('span', { text: t }))))]);
      paint('public', views.public, [
        h('span', { class: 'label', text: 'The public site' }),
        h('div', { class: 'counters' }, p.pub.map(([n, t, up]) => h('div', { class: up ? 'up' : '' }, h('b', { text: n }), h('span', { text: t })))),
        p.wall ? h('p', { class: 'wall', text: redactPii(F.redaction[0].text, F.redaction[0].names.split(',')) }) : h('p', { class: 'quiet', text: 'Includes the organisation’s earlier work; red figures are this request’s share.' })]);
    }
    function renderLog(events, fresh) {
      logList.replaceChildren(...(events.length ? events.map((e) => h('li', { class: fresh(e) ? 'new' : '' },
        h('span', { class: 'sq', text: '#' + pad2(e.seq) }), h('span', { class: 'tm', text: e.at }), h('span', { class: 'ev', text: e.type }),
        h('span', { class: `vis vis-${e.vis}`, text: e.vis }), e.note ? h('span', { class: 'pl', text: e.note }) : null)) : [h('li', { class: 'empty', text: 'No events yet.' })]));
      logCount.textContent = `${events.length} ${events.length === 1 ? 'event' : 'events'}`;
      logList.scrollTop = logList.scrollHeight;
    }
    function renderPrivate() {
      const docs = steps.slice(0, cur + 1).flatMap((st) => st.private || []);
      privBox.replaceChildren(h('span', { class: 'label', html: '<span class="vis vis-private">private</span> Documents kept outside the log' }),
        docs.length ? h('ul', null, docs.map(([k, v]) => h('li', null, h('b', { text: k }), h('span', { text: v })))) : h('p', { class: 'none', text: 'None yet.' }));
    }
    function go(i) {
      if (timer) { clearInterval(timer); timer = null; }
      cur = Math.max(0, Math.min(steps.length - 1, i));
      const st = steps[cur], events = all.filter((e) => e.si <= cur);
      shown = events.length;
      [...rail.children].forEach((b, k) => { b.classList.toggle('done', k < cur); if (k === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      back.disabled = cur === 0; next.disabled = cur === steps.length - 1;
      stepBox.replaceChildren(h('div', { class: 'fx-n', text: pad2(cur) }),
        h('div', null, h('h4', { text: st.title }), st.who ? h('div', { class: 'fx-who', text: st.who }) : null, h('p', { text: st.text })));
      renderLog(events, (e) => e.si === cur);
      renderPrivate();
      renderViews(events);
    }
    function replayLog() {
      if (timer) { clearInterval(timer); timer = null; }
      const target = all.filter((e) => e.si <= cur);
      if (reduced() || !target.length) { go(cur); return; }
      let k = 0;
      for (const v of Object.keys(prev)) delete prev[v];
      renderViews([]); renderLog([], () => false);
      timer = setInterval(() => {
        k += 1;
        const part = target.slice(0, k);
        renderLog(part, (e) => e.seq === k);
        renderViews(part);
        if (k >= target.length) { clearInterval(timer); timer = null; }
      }, 170);
    }
    function redactionPanel() {
      const presets = F.redaction;
      const text = h('textarea', { id: 'rd-text', rows: 4, spellcheck: 'false' });
      const names = h('input', { id: 'rd-names', type: 'text', autocomplete: 'off', spellcheck: 'false' });
      const out = h('div', { class: 'out', id: 'rd-out', 'aria-live': 'polite' });
      const note = h('p', { class: 'rd-note' });
      const chips = presets.map((pr) => h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', text: pr.label, onclick: () => load(pr) }));
      const update = () => {
        const red = redactPii(text.value, names.value.split(',').filter((x) => x.trim()));
        out.innerHTML = esc(red).replace(/\[…\]/g, '<mark>[…]</mark>');
      };
      function load(pr) {
        text.value = pr.text; names.value = pr.names; note.textContent = pr.note || 'Contact details are removed by pattern; names and places come from the private record and are matched by their stems.';
        chips.forEach((c, i) => c.setAttribute('aria-pressed', String(presets[i] === pr)));
        update();
      }
      text.addEventListener('input', update); names.addEventListener('input', update);
      const panel = h('div', { class: 'redact panel' },
        h('h4', null, 'Try it: redaction, as used at step 10'),
        h('p', { class: 'quiet', text: 'This is the portal’s own function, copied from packages/foundation/privacy/redactPii.ts. Change the text or the names and watch what would reach the public.' }),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Examples' }, chips),
        h('div', { class: 'redact-grid' },
          h('div', null,
            h('div', { class: 'rd-field' }, h('label', { class: 'label', for: 'rd-text', text: 'Thanks, as written' }), text),
            h('div', { class: 'rd-field' }, h('label', { class: 'label', for: 'rd-names', text: 'Names and places to remove, from the private record' }), names)),
          h('div', null, h('span', { class: 'label', text: 'As it reaches the public' }), out, note)));
      load(presets[0]);
      return panel;
    }
    go(0);
  }

  /* ============================================================ 04b three organisations */
  const INK = '#1c2228';
  function luminance(hex) {
    const n = Number.parseInt(hex.slice(1), 16);
    const ch = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
  }
  const contrastRatio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  function profilesExample() {
    const host = $('#profiles-example');
    if (!host) return;
    const PR = A.profiles;
    let cur = PR.length - 1, prevRows = null;
    const tabs = PR.map((p, i) => h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false', text: p.label, onclick: () => pick(i) }));
    const card = h('div', { class: 'pf-card' });
    // DP-06
    const amount = h('input', { type: 'number', min: '0', step: '0.01', value: '18500', 'aria-label': 'Amount' });
    const currency = h('select', { 'aria-label': 'Currency' }, ['UAH', 'GBP', 'EUR', 'USD', 'PLN'].map((c) => h('option', { value: c, text: c })));
    const byCarrier = h('input', { type: 'radio', name: 'pf-by', value: 'carrier', checked: true });
    const byCoord = h('input', { type: 'radio', name: 'pf-by', value: 'coordinator' });
    const dpOut = h('div', { class: 'verdict', 'aria-live': 'polite' });
    // floor
    const days = h('input', { type: 'number', step: '1', 'aria-label': 'Delay in days' });
    const floorOut = h('div', { class: 'verdict', 'aria-live': 'polite' });
    // contrast
    const colour = h('input', { type: 'color', 'aria-label': 'Accent colour' });
    const sample = h('span', { class: 'sample-btn', text: 'Ask for help' });
    const contrastOut = h('div', { class: 'verdict', 'aria-live': 'polite' });
    host.append(
      h('div', { class: 'pf-tabs', role: 'group', 'aria-label': 'Organisation profile' }, tabs),
      h('div', { class: 'pf-grid' }, card,
        h('div', { class: 'checks' },
          h('div', { class: 'check panel' },
            h('h4', null, h('span', { class: 'label', text: 'DP-06' }), 'Who approves this cost?'),
            h('p', { text: 'A cost is converted into the reporting currency at the rate in settings, and the rate is stored with it. A coordinator approves at once only within the limit; a carrier’s cost always waits.' }),
            h('div', { class: 'check-form' },
              h('label', null, h('span', { class: 'label', text: 'Amount' }), amount),
              h('label', null, h('span', { class: 'label', text: 'Currency' }), currency),
              h('fieldset', null, h('legend', { class: 'label', text: 'Recorded by' }),
                h('label', { class: 'radio' }, byCarrier, 'a carrier, on the way'), h('label', { class: 'radio' }, byCoord, 'a coordinator, at dispatch'))),
            dpOut),
          h('div', { class: 'check panel' },
            h('h4', null, h('span', { class: 'label', text: 'Floor' }), 'The safety delay before a public report'),
            h('p', { text: 'Stories from a conflict zone wait before they are published. A profile or an administrator may make the wait longer, never shorter than the floor.' }),
            h('div', { class: 'check-form' }, h('label', null, h('span', { class: 'label', text: 'Delay, in days' }), days)),
            floorOut),
          h('div', { class: 'check panel' },
            h('h4', null, h('span', { class: 'label', text: 'Contrast' }), 'The accent colour'),
            h('p', { text: 'The accent fills the main buttons, which carry dark text. The registry refuses a colour below 4.5 : 1 against that text.' }),
            h('div', { class: 'check-form' }, h('label', null, h('span', { class: 'label', text: 'Accent' }), colour), sample),
            contrastOut))));

    function checkCost() {
      const p = PR[cur], cur2 = currency.value, rate = p.rates[cur2];
      const minor = Math.round((Number.parseFloat(amount.value) || 0) * 100);
      if (!(minor > 0)) { dpOut.className = 'verdict no'; dpOut.innerHTML = '<strong>Enter an amount above zero.</strong>'; return; }
      if (rate == null) { dpOut.className = 'verdict no'; dpOut.innerHTML = `<strong>Refused: no conversion rate for ${esc(cur2)}.</strong>`; return; }
      const rep = Math.round(minor * rate), within = rep <= p.limitMinor, carrier = byCarrier.checked;
      let cls, head, events;
      if (!carrier && within) { cls = 'verdict'; head = 'Approved at once, by the lead coordinator'; events = '<code>costRecord.Submitted</code> (team) and <code>costRecord.Approved</code> (public, as the lead coordinator)'; }
      else if (within) { cls = 'verdict wait'; head = 'Waits for approval; a coordinator may approve it'; events = '<code>costRecord.Submitted</code> (team); the approval comes later'; }
      else { cls = 'verdict no'; head = 'Waits for the Finance Steward'; events = '<code>costRecord.Submitted</code> (team); only the Finance Steward, or an administrator acting as one, may approve'; }
      dpOut.className = cls;
      dpOut.innerHTML = `<strong>${head}</strong>${events}<span class="calc">${esc(money(minor, cur2))} × ${rate} = ${esc(money(rep, p.currency))} · limit ${esc(money(p.limitMinor, p.currency))} · ${within ? 'within' : 'above'} the limit</span>`;
    }
    function checkFloor() {
      const v = Number(days.value), p = PR[cur];
      if (days.value === '' || !Number.isFinite(v)) { floorOut.className = 'verdict no'; floorOut.innerHTML = '<strong>Refused (<code>number</code>)</strong>That is not a number.'; return; }
      if (v < 14) { floorOut.className = 'verdict no'; floorOut.innerHTML = `<strong>Refused (<code>floor</code>)</strong>${int(v)} days is below the floor of 14. Floors can be made stricter, never looser.`; return; }
      if (v > 120) { floorOut.className = 'verdict no'; floorOut.innerHTML = '<strong>Refused (<code>range</code>)</strong>The registry allows at most 120 days.'; return; }
      floorOut.className = 'verdict';
      floorOut.innerHTML = `<strong>Accepted: ${int(v)} days</strong>A report about a delivery waits at least this long.${v === p.delay ? ' This is the profile’s own value.' : ` The profile’s value is ${p.delay}.`}`;
    }
    function checkContrast() {
      const c = colour.value, r = contrastRatio(c, INK), ok = r >= 4.5;
      sample.style.background = c;
      contrastOut.className = ok ? 'verdict' : 'verdict no';
      contrastOut.innerHTML = `<strong>${ok ? 'Accepted' : 'Refused (<code>contrast</code>)'}: ${r.toFixed(2)} : 1</strong>${ok ? 'Dark text stays readable on this colour.' : 'Dark text would be hard to read on this colour. The studio will not save it.'}`;
    }
    [amount, currency].forEach((el) => el.addEventListener('input', checkCost));
    [byCarrier, byCoord].forEach((el) => el.addEventListener('change', checkCost));
    days.addEventListener('input', checkFloor);
    colour.addEventListener('input', checkContrast);

    function pick(i) {
      cur = i;
      const p = PR[i], sym = A.currencies[p.currency];
      tabs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i)));
      const rowsData = [
        ['Reporting currency', `${p.currency} (${sym})`],
        ['Suggested amounts', p.amounts.map((a) => money(a * 100, p.currency)).join(' · ')],
        ['Costs a lead coordinator approves alone', 'up to ' + money(p.limitMinor, p.currency)],
        ['Safety delay before a public report', `${p.delay} days`],
        ['We reply within', `${p.reply} days`],
        ['Working since', String(p.founded)],
        ['Areas served', p.areas],
      ];
      card.replaceChildren(
        h('div', { class: 'pf-shot' }, h('img', { src: `assets/plates/${p.img}.webp`, alt: `The home page of ${p.org}, the ${p.label.toLowerCase()} profile`, width: 800, height: 489 })),
        h('div', { class: 'pf-id' }, h('span', { class: 'pf-swatch', style: { background: p.accent } }), h('div', null, h('h4', { text: p.org }), h('p', { text: `“${p.tagline}”` }))),
        h('p', { class: 'quiet', text: p.about }),
        h('table', { class: 'pf-table' }, h('tbody', null, rowsData.map(([k, v], r) => h('tr', null, h('th', { scope: 'row', text: k }), h('td', { class: prevRows && prevRows[r] !== v ? 'changed' : '', text: v }))))),
        h('span', { class: 'label', text: 'Home page sections, in order' }),
        h('ol', { class: 'pf-sections' }, p.sections.map((sct) => h('li', { text: A.sectionNames[sct] }))));
      prevRows = rowsData.map((r) => r[1]);
      currency.value = p.currency === 'GBP' ? 'UAH' : currency.value;
      days.value = String(p.delay);
      colour.value = p.accent;
      checkCost(); checkFloor(); checkContrast();
    }
    pick(cur);
  }

  /* ============================================================ 05 method: words, topology, ladder, defects */
  function words() {
    const host = $('#words-fig');
    if (!host) return;
    const total = A.words.reduce((a, w) => a + w.n, 0), max = A.words[0].n / 0.74;
    const bar = (name, small, n, unit, cls, path) => h('div', { class: 'wb' + (cls ? ' ' + cls : '') },
      h('div', { class: 'wb-name' }, path ? repoLink(name, path) : name, h('small', { text: small })),
      h('div', { class: 'wb-bar' }, h('i', { style: { width: `${Math.max(0.6, (n / max) * 100)}%` } }), h('em', { style: { left: `calc(${Math.max(0.6, (n / max) * 100)}% + 8px)` }, text: `${int(n)} ${unit}` })));
    host.append(
      ...A.words.map((w) => bar(w.name, w.what, w.n, w.unit, '', w.path)),
      bar('code', '412 files', 11701, 'lines', 'code'),
      h('p', { class: 'wb-scale', text: `Drawn to one scale, one word against one line. The comparison is loose; the proportion is the point: ${int(total)} words lead, 11,701 lines follow.` }));
  }

  function topology() {
    const host = $('#topology'), panel = $('#topology-panel');
    if (!host) return;
    const P = A.packages, byId = Object.fromEntries(P.map((p) => [p.id, p]));
    const users = (id) => P.filter((p) => p.deps.includes(id)).map((p) => p.id);
    host.append(h('div', { class: 'graph graph-bg' }));
    const btns = {};
    for (const layer of A.layers) {
      const row = h('div', { class: 'topo-row' }, h('span', { class: 'label', text: `${layer.name} · ${layer.n}` }), h('div', { class: 'topo-pkgs' },
        P.filter((p) => p.layer === layer.id).map((p) => (btns[p.id] = h('button', { class: 'pkg', type: 'button', 'aria-pressed': 'false', onclick: () => select(p.id) }, p.id, h('small', { text: ` ${int(p.lines)}` }))))));
      host.append(row);
    }
    const edges = s('svg', { class: 'topo-edges', 'aria-hidden': 'true' });
    host.append(edges);
    let sel = null;
    function drawEdges() {
      edges.replaceChildren();
      if (!sel) return;
      const box = host.getBoundingClientRect();
      const at = (id, where) => { const r = btns[id].getBoundingClientRect(); return [r.left - box.left + r.width / 2, where === 'top' ? r.top - box.top : r.bottom - box.top]; };
      edges.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      const curve = (a, b) => { const my = (a[1] + b[1]) / 2; return `M${a[0]} ${a[1]} C${a[0]} ${my} ${b[0]} ${my} ${b[0]} ${b[1]}`; };
      for (const d of byId[sel].deps) edges.append(s('path', { d: curve(at(sel, 'bottom'), at(d, 'top')) }));
      for (const u of users(sel)) edges.append(s('path', { class: 'user', d: curve(at(u, 'bottom'), at(sel, 'top')) }));
    }
    function select(id) {
      sel = id;
      const p = byId[id], us = users(id);
      host.classList.add('has-sel');
      for (const [k, b] of Object.entries(btns)) {
        b.classList.toggle('is-sel', k === id); b.classList.toggle('is-dep', p.deps.includes(k)); b.classList.toggle('is-user', us.includes(k));
        b.setAttribute('aria-pressed', String(k === id));
      }
      const list = (ids) => (ids.length ? ids.map((x) => '@river/' + x).join(', ') : 'nothing');
      panel.replaceChildren(
        h('span', { class: 'label', text: `${A.layers.find((l) => l.id === p.layer).name} · layer ${A.layers.find((l) => l.id === p.layer).n}` }),
        h('div', { class: 'pk-name', text: id === 'web' || id === 'infra' ? (id === 'web' ? 'apps/web' : 'infra') : '@river/' + id }),
        h('p', { text: p.purpose }),
        h('dl', null,
          h('dt', { text: 'Size' }), h('dd', { text: `${int(p.files)} files · ${int(p.lines)} lines` }),
          h('dt', { text: 'Uses' }), h('dd', { text: list(p.deps) }),
          h('dt', { text: 'Used by' }), h('dd', { text: list(us) }),
          p.ext ? [h('dt', { text: 'External' }), h('dd', { text: p.ext.join(', ') })] : null,
          h('dt', { text: 'Folder' }), h('dd', null, repoLink(p.dir + '/', p.dir + '/'))),
        h('div', { class: 'key' }, h('span', null, h('i', { class: 'k-dep' }), 'what it uses'), h('span', null, h('i', { class: 'k-user' }), 'what uses it')));
      drawEdges();
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => drawEdges()).observe(host);
    select('flows');
  }

  function ladder() {
    const host = $('#ladder'), panel = $('#ladder-panel');
    if (!host) return;
    const L = A.ladder, y = (n) => 432 - (n - 1) * 48;
    const svg = s('svg', { viewBox: '0 0 580 470', role: 'group', 'aria-label': 'The ladder of checks' });
    svg.append(s('path', { class: 'ln', 'stroke-width': 2, d: 'M78 18 V456 M192 18 V456' }));
    svg.append(s('path', { class: 'ln-thin', d: `M52 ${y(1)} V${y(5)} M48 ${y(1)} h8 M48 ${y(5)} h8` }));
    svg.append(s('text', { class: 'tx-m tx-mid', x: 38, y: (y(1) + y(5)) / 2, transform: `rotate(-90 38 ${(y(1) + y(5)) / 2})`, text: 'ALL GREEN FIRST' }));
    svg.append(s('text', { class: 'tx-m', x: 440, y: 14, text: 'DEFECTS FOUND' }));
    const groups = L.map((r) => {
      const yy = y(r.n);
      const g = s('g', { class: 'rung focusable', tabindex: '0', role: 'button', 'aria-label': `Rung ${r.n}: ${r.name}. ${r.found == null ? '' : r.found + ' defects found.'}` });
      g.append(s('rect', { class: 'hit', x: 20, y: yy - 22, width: 530, height: 44 }), s('rect', { class: 'focus-ring', x: 22, y: yy - 21, width: 526, height: 42 }));
      g.append(s('line', { class: 'rung-bar', x1: 78, y1: yy, x2: 192, y2: yy }));
      g.append(s('text', { class: 'tx-b', x: 210, y: yy - 2, text: `${r.n}  ${r.name.toUpperCase()}` }), s('text', { class: 'tx-m', x: 210, y: yy + 13, text: r.cost }));
      if (r.found > 0) {
        g.append(s('rect', { class: 'f-red', x: 440, y: yy - 8, width: r.found * 11, height: 12 }), s('text', { class: 'tx-b tx-red', x: 446 + r.found * 11, y: yy + 2, text: String(r.found) }));
      } else g.append(s('text', { class: 'tx-m', x: 440, y: yy + 2, text: r.found === 0 ? '0 · green' : '—' }));
      const pickIt = () => select(r.n);
      g.addEventListener('click', pickIt);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickIt(); } });
      svg.append(g);
      return g;
    });
    host.append(svg);
    function select(n) {
      const r = L[n - 1];
      groups.forEach((g, i) => g.classList.toggle('on', i === n - 1));
      panel.replaceChildren(
        h('span', { class: 'label', text: `Rung ${r.n} of ${L.length}` }), h('h4', { text: r.name }),
        h('dl', null,
          h('dt', { text: 'Cost' }), h('dd', { text: r.cost }),
          h('dt', { text: 'Automated' }), h('dd', { text: r.auto }),
          h('dt', { text: 'Finds' }), h('dd', { text: r.finds }),
          h('dt', { text: 'Example' }), h('dd', { text: r.example }),
          h('dt', { text: 'Iteration 04' }), h('dd', { text: r.found == null ? 'acceptance by commit' : r.found ? `${r.found} defects` : 'nothing: green' })));
    }
    select(6);
  }

  function defects() {
    const host = $('#defects'), filters = $('#defect-filters');
    if (!host) return;
    const C = Object.fromEntries(A.defectClasses.map((c) => [c.id, c.name]));
    const rungName = { 6: 'walk', 8: 'screenshots' };
    const cards = A.defects.map((d) => h('article', { class: 'defect panel', 'data-cls': d.cls, 'data-rung': d.rung },
      h('div', { class: 'd-top' }, h('b', { text: '#' + pad2(d.n) }), h('span', { text: `${C[d.cls]} · ${rungName[d.rung]}` })),
      h('h4', { text: d.t }), h('p', { text: d.d }), h('p', { class: 'd-fix', text: d.fix })));
    host.append(...cards);
    const opts = [['all', `All ${A.defects.length}`], ...A.defectClasses.map((c) => [c.id, `${c.name} ${A.defects.filter((d) => d.cls === c.id).length}`]), ['r6', `Found by walking ${A.defects.filter((d) => d.rung === 6).length}`], ['r8', `Found in screenshots ${A.defects.filter((d) => d.rung === 8).length}`]];
    const btns = opts.map(([k, label]) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(k === 'all'), text: label, onclick: () => apply(k) }));
    filters.append(...btns);
    function apply(k) {
      btns.forEach((b, i) => b.setAttribute('aria-pressed', String(opts[i][0] === k)));
      cards.forEach((c) => { c.hidden = !(k === 'all' || c.dataset.cls === k || (k === 'r6' && c.dataset.rung === '6') || (k === 'r8' && c.dataset.rung === '8')); });
    }
  }

  /* ============================================================ 06 strata */
  function strata() {
    const host = $('#strata');
    if (!host) return;
    const list = A.strata.slice().reverse();
    list.forEach((st, i) => host.append(h('details', { class: 'stratum', open: i === 0 },
      h('summary', null, h('span', { class: 'st-m', text: st.m }), h('span', { class: 'st-t', text: st.title }), h('span', { class: 'st-i', 'aria-hidden': 'true' })),
      h('div', { class: 'st-body' },
        h('div', null, h('span', { class: 'label', text: 'What I understood' }), h('p', { text: st.understood })),
        h('div', null, h('span', { class: 'label', text: 'What I had missed' }), h('p', { text: st.missed })),
        h('div', null, h('span', { class: 'label', text: 'Where it went' }), h('p', { text: st.went }))))));
  }

  /* ============================================================ 07 materials */
  function materials() {
    const host = $('#materials-map'), panel = $('#materials-panel');
    if (!host) return;
    const M = A.materials, N = Object.fromEntries(M.nodes.map((n) => [n.id, n]));
    const BW = 170, BH = 56, hw = BW / 2, hh = BH / 2;
    const svg = s('svg', { viewBox: '0 0 1080 510', 'aria-hidden': 'true' });
    for (const c of M.columns) svg.append(s('text', { class: 'mcol tx-mid', x: c.x, y: 30, text: c.name.toUpperCase() }));
    svg.append(s('path', { class: 'ln-faint', d: M.columns.map((c) => `M${c.x - hw} 40 H${c.x + hw}`).join('') }));
    const route = (a, b) => {
      const A1 = N[a], B1 = N[b];
      if (a === 'walk' && b === 'meta') return `M${A1.x + hw} ${A1.y + 8} H848 Q858 ${A1.y + 8} 858 ${A1.y + 18} V470 Q858 480 848 480 H${B1.x + 10} Q${B1.x} 480 ${B1.x} 470 V${B1.y + hh}`;
      if (a === 'adr' && b === 'sdlc') return `M${A1.x + hw} ${A1.y + 10} H400 Q410 ${A1.y + 10} 410 ${A1.y + 20} V272 Q410 282 420 282 H836 Q846 282 846 292 V372 Q846 382 856 382 H${B1.x - hw}`;
      if (a === 'meta' && b === 'sdlc') return `M${A1.x + hw} ${A1.y + 8} H${B1.x - hw}`;
      if (a === 'spec' && b === 'almanac') return `M${A1.x} ${A1.y - hh} V72 Q${A1.x} 62 ${A1.x + 10} 62 H${B1.x - 10} Q${B1.x} 62 ${B1.x} 72 V${B1.y - hh}`;
      if (a === 'directives' && b === 'almanac') return `M${A1.x} ${A1.y - hh} V60 Q${A1.x} 50 ${A1.x + 10} 50 H${B1.x + 20} Q${B1.x + 30} 50 ${B1.x + 30} 60 V${B1.y - hh}`;
      if (A1.x === B1.x) { const x = A1.x + hw, bend = x + 22; return `M${x} ${A1.y + (B1.y > A1.y ? 10 : -10)} C${bend} ${A1.y} ${bend} ${B1.y} ${x} ${B1.y + (B1.y > A1.y ? -10 : 10)}`; }
      const x1 = A1.x + hw, x2 = B1.x - hw, mx = (x1 + x2) / 2;
      return `M${x1} ${A1.y} C${mx} ${A1.y} ${mx} ${B1.y} ${x2} ${B1.y}`;
    };
    const edgeEls = M.edges.map(([a, b, label]) => {
      const p = s('path', { class: 'medge', d: route(a, b), 'marker-end': 'url(#mt-arrow)' });
      return { a, b, label, p };
    });
    svg.append(s('defs', null, s('marker', { id: 'mt-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto' }, s('path', { class: 'f-ink', d: 'M0 1 L7 4 L0 7 z', opacity: 0.55 }))));
    edgeEls.forEach((e) => svg.append(e.p));
    const labels = edgeEls.map((e) => { const t = s('text', { class: 'medge-label tx-mid', text: e.label }); svg.append(t); return t; });
    const nodeEls = {};
    for (const n of M.nodes) {
      const g = s('g', { class: 'mnode focusable', tabindex: '0', role: 'button', 'aria-label': `${n.label}: ${n.sub}` });
      g.append(s('path', { class: 'mbox', d: `M${n.x - hw} ${n.y - hh} H${n.x + hw - 10} L${n.x + hw} ${n.y - hh + 10} V${n.y + hh} H${n.x - hw} Z` }));
      g.append(s('rect', { class: 'focus-ring', x: n.x - hw - 4, y: n.y - hh - 4, width: BW + 8, height: BH + 8 }));
      g.append(s('text', { class: 'tx-h', x: n.x - hw + 12, y: n.y - 3, text: n.label }), s('text', { class: 'tx-m', x: n.x - hw + 12, y: n.y + 15, text: n.sub.toUpperCase() }));
      g.addEventListener('click', () => select(n.id));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.id); } });
      nodeEls[n.id] = g;
      svg.append(g);
    }
    host.append(svg);
    function select(id) {
      const n = N[id];
      host.classList.add('has-sel');
      const near = new Set();
      edgeEls.forEach((e, i) => {
        const on = e.a === id || e.b === id;
        e.p.classList.toggle('on', on);
        labels[i].classList.toggle('on', on);
        if (on) {
          near.add(e.a === id ? e.b : e.a);
          const len = e.p.getTotalLength(), pt = e.p.getPointAtLength(len / 2);
          labels[i].setAttribute('x', pt.x); labels[i].setAttribute('y', pt.y - 5);
        }
      });
      for (const [k, g] of Object.entries(nodeEls)) { g.classList.toggle('on', k === id); g.classList.toggle('near', near.has(k)); }
      const from = M.edges.filter((e) => e[1] === id).map((e) => N[e[0]].label), to = M.edges.filter((e) => e[0] === id).map((e) => N[e[1]].label);
      const col = M.columns.find((c) => c.x === n.x);
      panel.replaceChildren(
        h('div', null, h('span', { class: 'label', text: col ? col.name : '' }), h('h4', { text: n.label }), h('span', { class: 'label', text: n.sub })),
        h('div', null, h('p', { text: n.desc }),
          h('p', { class: 'flows', html: `${from.length ? `<b>Fed by</b> ${esc(from.join(', '))}` : ''}${from.length && to.length ? ' · ' : ''}${to.length ? `<b>Feeds</b> ${esc(to.join(', '))}` : ''}` }),
          n.links.length ? h('ul', null, n.links.map(([label, path]) => h('li', null, repoLink(label, path)))) : h('p', { class: 'quiet', text: 'Quoted on sheet 02; not kept as a file.' })));
    }
    select('spec');
  }

  /* ============================================================ 08 steward and model */
  function amplification() {
    const host = $('#amplification');
    if (!host) return;
    const R = A.amplification, maxC = Math.max(...R.map((r) => r.chars)), maxL = Math.max(...R.map((r) => r.add));
    host.append(h('div', { class: 'amp-head' }, h('span', { text: 'Directive' }), h('span', { style: { textAlign: 'right' }, text: 'Characters in' }), h('span', { style: { textAlign: 'center' }, text: 'Lines per character' }), h('span', { text: 'Lines added' }), h('span', { text: 'Accepted in' })));
    for (const r of R) {
      host.append(h('div', { class: 'amp-row', 'data-note': `${int(r.chars)} characters → ${int(r.add)} lines added, ${int(r.files)} files · ${r.commits}` },
        h('span', { class: 'm', text: r.m }),
        h('div', { class: 'amp-in' }, h('i', { style: { width: `${(r.chars / maxC) * 100}%` }, title: `${int(r.chars)} characters` })),
        h('div', { class: 'amp-mid' }, `× ${(r.add / r.chars).toFixed(1)}`, h('small', { text: `${int(r.chars)} → ${int(r.add)}` })),
        h('div', { class: 'amp-out' }, h('i', { style: { width: `${(r.add / maxL) * 100}%` }, title: `${int(r.add)} lines added` })),
        h('div', { class: 'amp-note' }, r.commits, h('small', { text: `${int(r.files)} files · ${r.out}` }))));
    }
    host.append(h('div', { class: 'amp-scale' }, h('span'), h('span', { text: `bar = ${int(maxC)} characters` }), h('span'), h('span', { text: `bar = ${int(maxL)} lines` }), h('span')));
  }
  function ownWords() {
    const host = $('#own-words');
    if (host) host.append(...A.ownWords.map((q) => h('blockquote', { text: q })));
  }

  /* ============================================================ start */
  const run = (name, fn) => { try { fn(); } catch (e) { console.error(`Almanac: ${name} failed`, e); } };
  run('themes', themes);
  run('sheets', sheets);
  run('register', register);
  run('terms', terms);
  run('cover', cover);
  run('river', riverFigure);
  run('plates', plates);
  run('timeline', timeline);
  run('flow', flowExample);
  run('profiles', profilesExample);
  run('words', words);
  run('topology', topology);
  run('ladder', ladder);
  run('defects', defects);
  run('strata', strata);
  run('materials', materials);
  run('amplification', amplification);
  run('own words', ownWords);
})();
