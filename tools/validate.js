#!/usr/bin/env node
/* Validate every content entry: schema, code anchors, traces, and renderers.
 * Usage: node tools/validate.js [idFilter]
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const ctx = { structuredClone, console, Math, JSON, Object, Array, Set, Map, Number, String, Boolean, Infinity, NaN, isFinite, Error, RegExp, Date, parseInt, parseFloat };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
const load = (p) => vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p });
['assets/js/core/registry.js', 'assets/js/core/highlight.js', 'assets/js/core/viz.js'].forEach(load);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [];
for (const sub of ['ds', 'algo']) {
  const dir = path.join(ROOT, 'assets/js/content', sub);
  if (fs.existsSync(dir)) fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort().forEach((f) => files.push(`assets/js/content/${sub}/${f}`));
}
let errors = 0, warnings = 0;
const err = (id, m) => { errors++; console.log(`  ✗ [${id}] ${m}`); };
const warn = (id, m) => { warnings++; console.log(`  ! [${id}] ${m}`); };
for (const f of files) {
  try { load(f); } catch (e) { err(f, 'failed to load: ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  if (!html.includes(f)) warn(f, 'not listed in index.html (run python3 tools/build.py)');
}
const DSA = ctx.DSA;
const filter = process.argv[2];
const seen = new Set();
let nFrames = 0, nTraces = 0;

function checkView(id, v, where) {
  if (!v || typeof v !== 'object') return err(id, `${where}: view is not an object`);
  if (!DSA.viz.types.includes(v.type)) return err(id, `${where}: unknown view type "${v.type}"`);
  try {
    const vn = DSA.viz.render(v);
    const w = +vn.a.width, h = +vn.a.height;
    if (!(w > 0 && h > 0)) err(id, `${where}: bad size ${w}x${h}`);
    if (w > 1400) warn(id, `${where}: very wide drawing (${Math.round(w)}px) — consider fewer items`);
    const s = JSON.stringify(vn);
    if (/NaN|undefined/.test(s)) err(id, `${where}: NaN/undefined in rendered SVG (${v.type})`);
  } catch (e) { err(id, `${where}: render threw: ${e.message}`); }
}

for (const kind of ['ds', 'algo']) {
  for (const e of DSA[kind]) {
    if (filter && !e.id.includes(filter)) continue;
    const id = kind + ':' + e.id;
    if (seen.has(id)) err(id, 'duplicate id');
    seen.add(id);
    if (!/^[a-z0-9-]+$/.test(e.id)) err(id, 'id must be lowercase letters, digits, dashes');
    ['title', 'category', 'summary'].forEach((k) => { if (!e[k]) err(id, `missing ${k}`); });
    if (kind === 'ds' && !e.ops) warn(id, 'no ops table');
    if (kind === 'algo' && !e.complexity && !(e.variants || []).every((v) => v.complexity)) warn(id, 'no complexity');
    const variants = e.variants && e.variants.length ? e.variants.map((v) => Object.assign({}, e, v)) : [e];
    const vids = new Set();
    variants.forEach((v, vi) => {
      const vid = id + (e.variants ? '/' + (v.id || vi) : '');
      if (e.variants) { if (!v.id || !v.label) err(vid, 'variant needs id and label'); if (vids.has(v.id)) err(vid, 'duplicate variant id'); vids.add(v.id); }
      const cx = v.complexity;
      if (!cx || !cx.time || !cx.space) err(vid, 'complexity needs both time and space');
      if (!v.code) return err(vid, 'no code');
      const parsed = DSA.parseCode(v.code);
      try { DSA.highlightPython(parsed.text); } catch (x) { err(vid, 'highlighter threw ' + x.message); }
      parsed.lines.forEach((l, i) => { if (l.length > 64) warn(vid, `code line ${i + 1} is ${l.length} chars (keep ≤ 64 so it fits the editor)`); if (/\t/.test(l)) err(vid, `tab character on line ${i + 1}`); });
      if (/#@/.test(parsed.text)) err(vid, 'unparsed #@ marker left in code (anchors must be at end of line)');
      if (typeof v.trace === 'function') {
        const inputs = [];
        const def = v.input && v.input.default ? v.input.default : {};
        inputs.push(['default', def]);
        if (v.input && v.input.random) for (let k = 0; k < 6; k++) inputs.push(['random#' + k, v.input.random()]);
        if (v.input && v.input.fields) v.input.fields.forEach((fl) => { if (!(fl.key in def)) err(vid, `input.default missing field ${fl.key}`); });
        const usedAnchors = new Set();
        for (const [name, inp] of inputs) {
          let frames;
          try { frames = v.trace(structuredClone(inp), DSA.util); } catch (x) { err(vid, `trace(${name}) threw: ${x.stack.split('\n').slice(0, 2).join(' | ')}  input=${JSON.stringify(inp)}`); continue; }
          nTraces++;
          if (!Array.isArray(frames) || frames.length < 2) { err(vid, `trace(${name}) returned ${frames && frames.length} frames`); continue; }
          if (frames.length >= 700) warn(vid, `trace(${name}) hit the 700 frame cap`);
          else if (frames.length > 260) warn(vid, `trace(${name}) has ${frames.length} frames (long; aim for < 200)`);
          nFrames += frames.length;
          frames.forEach((fr, i) => {
            const where = `trace(${name}) frame ${i}`;
            if (typeof fr.msg !== 'string' || !fr.msg) err(vid, `${where}: empty msg`);
            const lines = [].concat(fr.line == null ? [] : fr.line);
            if (!lines.length) warn(vid, `${where}: no line highlighted`);
            lines.forEach((l) => {
              if (typeof l === 'number') { if (l < 1 || l > parsed.lines.length) err(vid, `${where}: line ${l} out of range`); }
              else if (parsed.anchors[l] == null) err(vid, `${where}: unknown anchor "${l}" (have: ${Object.keys(parsed.anchors).join(', ')})`);
              else usedAnchors.add(l);
            });
            const views = fr.views || (fr.view ? [fr.view] : []);
            if (!views.length) err(vid, `${where}: no view`);
            if (name === 'default' || i % 3 === 0) views.forEach((vw, k) => checkView(vid, vw, `${where} view ${k}`));
            if (fr.aux && !Array.isArray(fr.aux)) err(vid, `${where}: aux must be an array`);
            if (fr.vars && (typeof fr.vars !== 'object' || Array.isArray(fr.vars))) err(vid, `${where}: vars must be an object`);
          });
        }
        Object.keys(parsed.anchors).forEach((a) => { if (!usedAnchors.has(a)) warn(vid, `anchor "${a}" is never highlighted`); });
      } else {
        const views = v.visuals || (v.visual ? [v.visual] : []);
        if (!views.length) err(vid, 'no visual and no trace');
        views.forEach((vw, k) => checkView(vid, vw, `visual ${k}`));
      }
    });
  }
}
console.log(`\n${DSA.ds.length} data structures, ${DSA.algo.length} algorithms, ${nTraces} traces run, ${nFrames} frames checked`);
console.log(errors ? `✗ ${errors} error(s), ${warnings} warning(s)` : `✓ no errors, ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
