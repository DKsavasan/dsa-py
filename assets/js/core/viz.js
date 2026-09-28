/* dsa.py — SVG renderers.
 * Every renderer is a pure function view -> {w, h, kids:[vnode]} so it can be
 * unit-tested in node. DSA.viz.mount(el, views) patches the DOM with keyed
 * reconciliation so shapes glide between frames instead of redrawing.
 *
 * View types: array, graph, tree, grid, linked, stack, buckets, kv
 * (see CONTRIBUTING.md for every field).
 */
(function (root) {
  'use strict';
  const DSA = root.DSA;
  const V = (DSA.viz = {});
  const MONO_W = 8.45; // px per char at 14px JetBrains Mono

  /* ---------- vnode helpers ---------- */
  function h(tag, a, kids) {
    const n = { tag, a: {}, kids: [] };
    if (a) {
      for (const k in a) {
        if (a[k] == null || a[k] === false) continue;
        if (k === 'key') n.key = a[k];
        else if (k === 'text') n.text = String(a[k]);
        else n.a[k] = a[k];
      }
    }
    if (kids) n.kids = kids.flat(3).filter(Boolean);
    return n;
  }
  const tr = (x, y) => `transform:translate(${r1(x)}px,${r1(y)}px)`;
  const r1 = (x) => Math.round(x * 10) / 10;
  const S = (s) => (s ? ' s-' + s : '');
  const fmt = (x) => {
    if (x === null || x === undefined) return '';
    if (typeof x === 'string') return x;
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '-∞';
    if (typeof x === 'boolean') return x ? 'T' : 'F';
    if (Array.isArray(x)) return '[' + x.map(fmt).join(',') + ']';
    if (typeof x === 'object') return fmt(x.v);
    return String(x);
  };
  V.fmt = fmt;
  const tw = (s, fs) => String(s).length * MONO_W * ((fs || 14) / 14);
  const stateOf = (states, i) => (states == null ? null : Array.isArray(states) ? states[i] : states[i]);

  /* ---------- array ---------- */
  function rArray(v) {
    const rows = v.rows || [{ label: v.label, items: v.items || [], states: v.states, pointers: v.pointers, range: v.range, ranges: v.ranges, showIndex: v.showIndex }];
    const bars = !!v.bars;
    const n = Math.max(1, ...rows.map((r) => (r.items || []).length));
    let minI = 0, maxI = n - 1;
    rows.forEach((r) => (r.pointers || []).forEach((p) => { minI = Math.min(minI, p.i); maxI = Math.max(maxI, p.i); }));
    const slots = maxI - minI + 1;
    const longest = Math.max(1, ...rows.flatMap((r) => (r.items || []).map((it) => fmt(it && typeof it === 'object' && !Array.isArray(it) ? it.v : it).length)));
    let C = slots > 12 ? Math.max(28, Math.floor(660 / slots) - 6) : 50;
    C = Math.max(C, Math.min(92, longest * MONO_W + 18));
    const gap = C < 40 ? 4 : 6;
    const fs = C < 36 ? 12 : 15;
    const labelW = rows.some((r) => r.label) ? Math.max(...rows.map((r) => tw(r.label || '', 13))) + 18 : 0;
    const pad = 10;
    const x0 = pad + labelW - minI * (C + gap);
    const X = (i) => x0 + i * (C + gap);
    const maxV = bars ? Math.max(1, ...rows.flatMap((r) => r.items.map((it) => Math.abs(+(it && typeof it === 'object' ? it.v : it)) || 0))) : 1;
    const BAR = 150;
    const kids = [];
    let y = pad;
    rows.forEach((row, ri) => {
      const items = row.items || [];
      const showIdx = row.showIndex !== false && v.showIndex !== false;
      const labTop = (row.ranges || []).some((rg) => rg.label) ? 16 : 0;
      const top = y + labTop + (showIdx ? 18 : 0);
      const cellH = bars ? BAR : C;
      // ranges (drawn first, behind cells)
      const ranges = row.ranges || (row.range ? [{ l: row.range[0], r: row.range[1] }] : []);
      ranges.forEach((rg, k) => {
        if (rg.l == null || rg.r == null || rg.r < rg.l) return;
        const w = (rg.r - rg.l + 1) * (C + gap) + gap;
        kids.push(h('rect', { key: `r${ri}-rg${k}`, class: 'range' + S(rg.s || 'range'), style: `${tr(X(rg.l) - gap, top - gap)};width:${w}px;height:${cellH + gap * 2}px`, rx: 12 }));
        if (rg.label) kids.push(h('text', { key: `r${ri}-rgl${k}`, class: 'range-label' + S(rg.s || 'range'), x: X(rg.l) - gap + 4, y: y + 11, text: rg.label }));
      });
      if (row.label) kids.push(h('text', { key: `r${ri}-lab`, class: 'row-label', x: pad, y: top + cellH / 2 + 5, text: row.label }));
      if (showIdx) items.forEach((_, i) => kids.push(h('text', { key: `r${ri}-ix${i}`, class: 'idx', x: X(i) + C / 2, y: y + labTop + 11, 'text-anchor': 'middle', text: i })));
      // cells in stable id order so the DOM order never changes (keeps transitions smooth)
      const cells = items.map((it, i) => {
        const o = it !== null && typeof it === 'object' && !Array.isArray(it) ? it : { v: it };
        return { o, i, id: o.id != null ? o.id : 'i' + i };
      });
      cells.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).forEach(({ o, i, id }) => {
        const st = o.s || stateOf(row.states, i);
        const label = fmt(o.v);
        const empty = o.v === null || o.v === undefined || o.v === '';
        if (bars) {
          const hh = Math.max(6, (Math.abs(+o.v) / maxV) * (BAR - 22));
          kids.push(h('g', { key: `r${ri}-c${id}`, class: 'cell bar' + S(st), style: tr(X(i), top) }, [
            h('rect', { x: 0, y: BAR - hh, width: C, height: hh, rx: Math.min(8, C / 4) }),
            h('text', { x: C / 2, y: BAR - hh - 6, 'text-anchor': 'middle', class: 'bar-val', style: `font-size:${fs - 2}px`, text: label }),
          ]));
        } else {
          kids.push(h('g', { key: `r${ri}-c${id}`, class: 'cell' + (empty ? ' empty' : '') + S(st), style: tr(X(i), top) }, [
            h('rect', { x: 0, y: 0, width: C, height: C, rx: Math.min(12, C / 4) }),
            h('text', { x: C / 2, y: C / 2 + fs * 0.36, 'text-anchor': 'middle', style: `font-size:${fs}px`, text: label }),
            o.sub != null ? h('text', { class: 'sub', x: C / 2, y: C + 13, 'text-anchor': 'middle', text: fmt(o.sub) }) : null,
          ]));
        }
      });
      // pointers
      const hasSub = items.some((it) => it && typeof it === 'object' && it.sub != null);
      let pBottom = top + cellH;
      const stackAt = {};
      (row.pointers || []).forEach((p) => {
        const k = (stackAt[p.i] = (stackAt[p.i] || 0) + 1) - 1;
        const py = top + cellH + (hasSub ? 20 : 6) + k * 20;
        pBottom = Math.max(pBottom, py + 22);
        kids.push(h('g', { key: `r${ri}-p-${p.label}`, class: 'ptr' + S(p.s), style: tr(X(p.i) + C / 2, py) }, [
          k === 0 ? h('path', { d: 'M0 0 L-5 7 L5 7 Z' }) : null,
          h('text', { x: 0, y: 19, 'text-anchor': 'middle', text: p.label }),
        ]));
      });
      y = Math.max(pBottom, top + cellH + ((row.items || []).some((it) => it && it.sub != null) ? 18 : 0)) + 16;
    });
    const w = X(maxI) + C + pad;
    return { w: Math.max(w, 120), h: y - 6, kids };
  }

  /* ---------- graph ---------- */
  function edgeGeom(ax, ay, bx, by, ra, rb, curve) {
    const dx = bx - ax, dy = by - ay;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    if (!curve) {
      return { x1: ax + ux * ra, y1: ay + uy * ra, x2: bx - ux * rb, y2: by - uy * rb, ang: Math.atan2(uy, ux), mx: (ax + bx) / 2, my: (ay + by) / 2 };
    }
    // quadratic curve bent to the left by `curve` px
    const cx = (ax + bx) / 2 - uy * curve, cy = (ay + by) / 2 + ux * curve;
    const d1 = Math.hypot(cx - ax, cy - ay), d2 = Math.hypot(bx - cx, by - cy);
    const sx = ax + ((cx - ax) / d1) * ra, sy = ay + ((cy - ay) / d1) * ra;
    const ex = bx - ((bx - cx) / d2) * rb, ey = by - ((by - cy) / d2) * rb;
    return { path: `M${r1(sx)} ${r1(sy)} Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}`, x2: ex, y2: ey, ang: Math.atan2(by - cy, bx - cx), mx: (ax + 2 * cx + bx) / 4, my: (ay + 2 * cy + by) / 4 };
  }
  function arrowHead(x, y, ang, size) {
    const s = size || 9;
    const a1 = ang + Math.PI - 0.42, a2 = ang + Math.PI + 0.42;
    return `M${r1(x)} ${r1(y)} L${r1(x + Math.cos(a1) * s)} ${r1(y + Math.sin(a1) * s)} L${r1(x + Math.cos(a2) * s)} ${r1(y + Math.sin(a2) * s)} Z`;
  }
  function drawEdge(key, g, e, directed, kids, labelKids) {
    const geom = edgeGeom(g.ax, g.ay, g.bx, g.by, g.ra, g.rb + (directed ? 2 : 0), e.curve);
    const cls = 'edge' + S(e.s);
    const parts = [];
    if (geom.path) parts.push(h('path', { d: geom.path, class: 'eline' }));
    else parts.push(h('line', { x1: r1(geom.x1), y1: r1(geom.y1), x2: r1(geom.x2), y2: r1(geom.y2), class: 'eline' }));
    if (directed) parts.push(h('path', { d: arrowHead(geom.x2, geom.y2, geom.ang), class: 'ehead' }));
    kids.push(h('g', { key, class: cls }, parts));
    const lab = e.w != null ? e.w : e.label;
    if (lab != null) {
      const t = fmt(lab);
      const w = tw(t, 12) + 10;
      labelKids.push(h('g', { key: key + '-w', class: 'wlabel' + S(e.s), style: tr(geom.mx, geom.my) }, [
        h('rect', { x: -w / 2, y: -10, width: w, height: 20, rx: 10 }),
        h('text', { x: 0, y: 4, 'text-anchor': 'middle', text: t }),
      ]));
    }
  }
  function nodeShape(label, R) {
    const L = label.length;
    if (L <= 3) return { w: R * 2, round: true };
    return { w: Math.max(R * 2, L * MONO_W + 18), round: false };
  }
  function drawNode(key, x, y, label, st, R, extra) {
    const t = fmt(label);
    const shp = nodeShape(t, R);
    const kids = [];
    if (shp.round) kids.push(h('circle', { cx: 0, cy: 0, r: R }));
    else kids.push(h('rect', { x: -shp.w / 2, y: -R, width: shp.w, height: R * 2, rx: R }));
    kids.push(h('text', { x: 0, y: 5, 'text-anchor': 'middle', text: t }));
    if (extra && extra.badge != null && extra.badge !== '') {
      const b = fmt(extra.badge);
      const bw = tw(b, 11) + 10;
      const side = extra.pointer != null && extra.pointer !== '';
      kids.push(h('g', { class: 'badge', style: side ? tr(shp.w / 2 + bw / 2 + 3, 0) : tr(shp.w / 2 - 4, -R - 6) }, [
        h('rect', { x: -bw / 2, y: -9, width: bw, height: 18, rx: 9 }),
        h('text', { x: 0, y: 4, 'text-anchor': 'middle', text: b }),
      ]));
    }
    if (extra && extra.pointer) {
      const p = [].concat(extra.pointer).join(', ');
      kids.push(h('g', { class: 'ptr', style: tr(0, -R - 8) }, [
        h('path', { d: 'M0 0 L-5 -7 L5 -7 Z' }),
        h('text', { x: 0, y: -11, 'text-anchor': 'middle', text: p }),
      ]));
    }
    return { vn: h('g', { key, class: 'node' + S(st), style: tr(x, y) }, kids), w: shp.w };
  }

  function rGraph(v) {
    const W = v.width || 520, H = v.height || 310, pad = 34, R = v.r || 21;
    const P = {};
    (v.nodes || []).forEach((n) => (P[n.id] = { x: pad + (n.x / 100) * (W - 2 * pad), y: pad + (n.y / 100) * (H - 2 * pad), n }));
    const edgeKids = [], labelKids = [], nodeKids = [];
    const has = new Set((v.edges || []).map((e) => e.from + '>' + e.to));
    (v.edges || []).forEach((e, i) => {
      const a = P[e.from], b = P[e.to];
      if (!a || !b) return;
      const directed = e.directed != null ? e.directed : !!v.directed;
      const ee = Object.assign({}, e);
      if (directed && ee.curve == null && has.has(e.to + '>' + e.from)) ee.curve = 16;
      drawEdge(`e-${e.from}-${e.to}-${i}`, { ax: a.x, ay: a.y, bx: b.x, by: b.y, ra: R, rb: R }, ee, directed, edgeKids, labelKids);
    });
    (v.nodes || []).forEach((n) => {
      const p = P[n.id];
      nodeKids.push(drawNode('n-' + n.id, p.x, p.y, n.label != null ? n.label : n.id, n.s || (v.states && v.states[n.id]), R, { badge: n.badge != null ? n.badge : v.badges && v.badges[n.id], pointer: v.pointers && v.pointers[n.id] }).vn);
    });
    return { w: W, h: H, kids: [...edgeKids, ...labelKids, ...nodeKids] };
  }

  /* ---------- tree (binary or n-ary) ---------- */
  function rTree(v) {
    const rootN = v.root;
    const R = 20, LG = v.levelGap || 70;
    const hidden = new Set(v.hidden || []);
    const states = v.states || {}, badges = v.badges || {}, pointers = v.pointers || {}, edgeStates = v.edgeStates || {};
    const list = [];
    if (!rootN) return { w: 200, h: 80, kids: [h('text', { key: 'empty', class: 'muted-t', x: 100, y: 45, 'text-anchor': 'middle', text: 'None (empty tree)' })] };
    const isBinary = !Array.isArray(rootN.children);
    let slot = 0, maxD = 0;
    let maxW = 2 * R;
    const assignIds = (n, path) => { if (n.id == null) n.__id = path; else n.__id = String(n.id); };
    if (isBinary) {
      const walk = (n, d, path, parent) => {
        if (!n) return;
        assignIds(n, path);
        walk(n.left, d + 1, path + 'L', n);
        const item = { n, d, parent, slot: slot++ };
        list.push(item);
        maxD = Math.max(maxD, d);
        maxW = Math.max(maxW, nodeShape(fmt(n.v), R).w);
        walk(n.right, d + 1, path + 'R', n);
      };
      walk(rootN, 0, 'r', null);
    } else {
      const walk = (n, d, path, parent) => {
        assignIds(n, path);
        const item = { n, d, parent };
        maxD = Math.max(maxD, d);
        maxW = Math.max(maxW, nodeShape(fmt(n.v), R).w);
        const ch = (n.children || []).filter(Boolean);
        const kidItems = ch.map((c, i) => walk(c, d + 1, path + '.' + i, n));
        if (!kidItems.length) item.slot = slot++;
        else item.slot = (kidItems[0].slot + kidItems[kidItems.length - 1].slot) / 2;
        list.push(item);
        return item;
      };
      walk(rootN, 0, 'r', null);
    }
    const XS = Math.max(isBinary ? 44 : 50, maxW + (isBinary ? 6 : 12));
    const padX = maxW / 2 + 14, padTop = Object.keys(pointers).length ? 62 : 40;
    const pos = {};
    list.forEach((it) => (pos[it.n.__id] = { x: padX + it.slot * XS, y: padTop + it.d * LG, it }));
    const edgeKids = [], labelKids = [], nodeKids = [];
    list.forEach((it) => {
      const id = it.n.__id;
      if (!it.parent || hidden.has(id)) return;
      const a = pos[it.parent.__id], b = pos[id];
      const e = { s: edgeStates[id] || it.n.es, label: it.n.elabel };
      drawEdge('te-' + id, { ax: a.x, ay: a.y, bx: b.x, by: b.y, ra: R, rb: R }, e, false, edgeKids, labelKids);
    });
    list.forEach((it) => {
      const id = it.n.__id;
      if (hidden.has(id)) return;
      const p = pos[id];
      nodeKids.push(drawNode('tn-' + id, p.x, p.y, it.n.label != null ? it.n.label : it.n.v, it.n.s || states[id], R, { badge: badges[id], pointer: pointers[id] }).vn);
    });
    const W = padX * 2 + Math.max(0, slot - 1) * XS;
    const H = padTop + maxD * LG + R + 16;
    return { w: Math.max(W, 160), h: H, kids: [...edgeKids, ...labelKids, ...nodeKids] };
  }

  /* ---------- grid / matrix / DP table ---------- */
  function rGrid(v) {
    const cells = v.cells || [];
    const rows = cells.length, cols = Math.max(1, ...cells.map((r) => r.length));
    const longest = Math.max(1, ...cells.flat().map((x) => fmt(x).length));
    let C = Math.max(26, Math.min(46, Math.floor(620 / (cols + 1))));
    C = Math.max(C, Math.min(80, longest * 7.6 + 12));
    const fs = C < 34 ? 11 : 13;
    const hasRL = !!v.rowLabels, hasCL = !!v.colLabels;
    const lw = hasRL ? Math.max(24, ...v.rowLabels.map((l) => tw(fmt(l), 12) + 12)) : 0;
    const th = hasCL ? 22 : 0;
    const pad = 8, gap = 3;
    const kids = [];
    const st = v.states || {};
    if (hasCL) v.colLabels.forEach((l, c) => kids.push(h('text', { key: `cl${c}`, class: 'idx' + S(st['c' + c]), x: pad + lw + c * (C + gap) + C / 2, y: pad + 12, 'text-anchor': 'middle', text: fmt(l) })));
    if (hasRL) v.rowLabels.forEach((l, r) => kids.push(h('text', { key: `rl${r}`, class: 'idx' + S(st['r' + r]), x: pad + lw - 8, y: pad + th + r * (C + gap) + C / 2 + 4, 'text-anchor': 'end', text: fmt(l) })));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = cells[r][c];
        const s = st[r + ',' + c];
        const t = fmt(val);
        kids.push(h('g', { key: `g${r}-${c}`, class: 'cell gcell' + (t === '' ? ' empty' : '') + S(s), style: tr(pad + lw + c * (C + gap), pad + th + r * (C + gap)) }, [
          h('rect', { x: 0, y: 0, width: C, height: C, rx: Math.min(8, C / 5) }),
          h('text', { x: C / 2, y: C / 2 + fs * 0.36, 'text-anchor': 'middle', style: `font-size:${fs}px`, text: t }),
        ]));
      }
    }
    return { w: pad * 2 + lw + cols * (C + gap), h: pad * 2 + th + rows * (C + gap), kids };
  }

  /* ---------- linked list ---------- */
  function rLinked(v) {
    const nodes = v.nodes || [];
    const dbl = !!v.doubly;
    const vw = Math.max(40, ...nodes.map((n) => tw(fmt(n.v), 15) + 18));
    const slotW = 22;
    const NW = vw + slotW + (dbl ? slotW : 0), NH = 44, G = 38;
    const pointers = v.pointers || {};
    const leftNull = !!v.nullLeft || pointers.null != null;
    const nullW = leftNull ? 70 : 0;
    const maxP = Math.max(0, ...Object.values(pointers).map((p) => [].concat(p).length));
    const top = 16 + maxP * 20 + (v.links || []).some((l) => l.curve === 'above') * 30;
    function idx(id) { return nodes.findIndex((n) => n.id === id); }
    const pad = 14;
    const X = (i) => pad + nullW + i * (NW + G);
    const kids = [];
    // links
    const links = v.links || nodes.map((n, i) => ({ from: n.id, to: i + 1 < nodes.length ? nodes[i + 1].id : null }));
    let bottom = top + NH + 10;
    links.forEach((l, k) => {
      const i = idx(l.from);
      if (i < 0) return;
      const sx = X(i) + NW - slotW / 2, sy = top + (dbl ? NH * 0.35 : NH / 2);
      const cls = 'edge link' + S(l.s);
      if (l.to == null) {
        if (i === nodes.length - 1 && !l.down) {
          const ex = X(i) + NW + G - 8;
          kids.push(h('g', { key: `l${l.from}`, class: cls }, [h('line', { x1: sx, y1: sy, x2: ex, y2: sy, class: 'eline' }), h('path', { d: arrowHead(ex, sy, 0, 8), class: 'ehead' })]));
          kids.push(h('text', { key: `lnull${l.from}`, class: 'null-t', x: ex + 6, y: sy + 5, text: v.nullLabel || 'None' }));
        } else {
          const ey = top + NH + 26;
          kids.push(h('g', { key: `l${l.from}`, class: cls }, [h('line', { x1: sx, y1: sy, x2: sx, y2: ey, class: 'eline' }), h('path', { d: arrowHead(sx, ey, Math.PI / 2, 8), class: 'ehead' })]));
          kids.push(h('text', { key: `lnull${l.from}`, class: 'null-t', x: sx, y: ey + 16, 'text-anchor': 'middle', text: v.nullLabel || 'None' }));
          bottom = Math.max(bottom, ey + 24);
        }
        return;
      }
      const j = idx(l.to);
      if (j < 0) return;
      if (j === i + 1 && !l.curve) {
        const ex = X(j) - 2;
        kids.push(h('g', { key: `l${l.from}`, class: cls }, [h('line', { x1: sx, y1: sy, x2: ex, y2: sy, class: 'eline' }), h('path', { d: arrowHead(ex, sy, 0, 8), class: 'ehead' })]));
      } else {
        const below = l.curve !== 'above';
        const tx = X(j) + (j < i ? NW * 0.6 : NW * 0.3);
        const yEdge = below ? top + NH : top;
        const sy2 = below ? top + NH : top;
        const lift = (below ? 1 : -1) * (26 + Math.abs(i - j) * 6);
        const d = `M${sx} ${sy2} C${sx} ${sy2 + lift} ${tx} ${yEdge + lift} ${tx} ${yEdge + (below ? 2 : -2)}`;
        kids.push(h('g', { key: `l${l.from}`, class: cls }, [h('path', { d, class: 'eline' }), h('path', { d: arrowHead(tx, yEdge + (below ? 2 : -2), below ? -Math.PI / 2 : Math.PI / 2, 8), class: 'ehead' })]));
        if (below) bottom = Math.max(bottom, top + NH + Math.abs(lift) + 8);
      }
    });
    if (dbl) {
      nodes.forEach((n, i) => {
        if (i === 0) return;
        const sx = X(i) + slotW / 2, sy = top + NH * 0.68;
        const ex = X(i - 1) + NW + 2;
        kids.push(h('g', { key: `pv${n.id}`, class: 'edge link prev' }, [h('line', { x1: sx, y1: sy, x2: ex, y2: sy, class: 'eline' }), h('path', { d: arrowHead(ex, sy, Math.PI, 8), class: 'ehead' })]));
      });
    }
    // null ghost at the left (useful for prev = None)
    if (leftNull) {
      kids.push(h('g', { key: 'ghost-null', class: 'ghost', style: tr(pad, top) }, [
        h('rect', { x: 0, y: 6, width: 52, height: NH - 12, rx: 10 }),
        h('text', { x: 26, y: NH / 2 + 5, 'text-anchor': 'middle', text: 'None' }),
      ]));
      const lab = pointers.null;
      if (lab != null) {
        [].concat(lab).forEach((p, k) => kids.push(h('g', { key: 'lp-' + p, class: 'ptr', style: tr(pad + 26, top - 6 - k * 20) }, [k === 0 ? h('path', { d: 'M0 0 L-5 -7 L5 -7 Z' }) : null, h('text', { x: 0, y: -11, 'text-anchor': 'middle', text: p })])));
      }
    }
    nodes.forEach((n, i) => {
      const st = n.s || (v.states && v.states[n.id]);
      const g = [];
      g.push(h('rect', { class: 'lnode', x: 0, y: 0, width: NW, height: NH, rx: 10 }));
      const vx = dbl ? slotW : 0;
      if (dbl) g.push(h('line', { class: 'div', x1: slotW, y1: 0, x2: slotW, y2: NH }), h('circle', { class: 'dot', cx: slotW / 2, cy: NH * 0.68, r: 3 }));
      g.push(h('line', { class: 'div', x1: vx + vw, y1: 0, x2: vx + vw, y2: NH }));
      g.push(h('circle', { class: 'dot', cx: NW - slotW / 2, cy: dbl ? NH * 0.35 : NH / 2, r: 3 }));
      g.push(h('text', { x: vx + vw / 2, y: NH / 2 + 5, 'text-anchor': 'middle', text: fmt(n.v) }));
      kids.push(h('g', { key: 'ln-' + n.id, class: 'cell lcell' + S(st), style: tr(X(i), top) }, g));
    });
    // pointers (head, curr, prev, slow, fast ...)
    Object.keys(pointers).forEach((id) => {
      if (id === 'null') return;
      const i = idx(id);
      if (i < 0) return;
      [].concat(pointers[id]).forEach((p, k) => kids.push(h('g', { key: 'lp-' + p, class: 'ptr', style: tr(X(i) + (NW - (dbl ? 0 : slotW)) / 2, top - 6 - k * 20) }, [k === 0 ? h('path', { d: 'M0 0 L-5 -7 L5 -7 Z' }) : null, h('text', { x: 0, y: -11, 'text-anchor': 'middle', text: p })])));
    });
    const lastId = nodes.length ? nodes[nodes.length - 1].id : null;
    const tailNull = links.some((l) => l.from === lastId && l.to == null && !l.down);
    const w = X(Math.max(0, nodes.length - 1)) + NW + (tailNull ? G + 44 : 12);
    return { w: Math.max(w, 120), h: bottom + 6, kids };
  }

  /* ---------- stack (vertical) ---------- */
  function rStack(v) {
    const items = v.items || [];
    const cap = Math.max(items.length, v.capacity || 0, 1);
    const longest = Math.max(4, ...items.map((it) => fmt(it && typeof it === 'object' && !Array.isArray(it) ? it.v : it).length));
    const W = Math.max(120, longest * MONO_W + 40), BH = 38, gap = 6, pad = 12;
    const H = pad * 2 + cap * (BH + gap) + 26;
    const kids = [];
    const baseY = H - pad - 26;
    kids.push(h('path', { key: 'tray', class: 'tray', d: `M${pad - 6} ${pad} V${baseY + 6} H${pad + W + 6} V${pad}` }));
    items.forEach((it, i) => {
      const o = it !== null && typeof it === 'object' && !Array.isArray(it) ? it : { v: it };
      const id = o.id != null ? o.id : 'i' + i;
      const y = baseY - (i + 1) * (BH + gap) + gap;
      kids.push(h('g', { key: 's-' + id, class: 'cell' + S(o.s || stateOf(v.states, i)), style: tr(pad, y) }, [
        h('rect', { x: 0, y: 0, width: W, height: BH, rx: 10 }),
        h('text', { x: W / 2, y: BH / 2 + 5, 'text-anchor': 'middle', text: fmt(o.v) }),
      ]));
      if (i === items.length - 1) kids.push(h('text', { key: 'toplab', class: 'ptr-t', x: pad + W + 14, y: y + BH / 2 + 5, text: '← top' }));
    });
    kids.push(h('text', { key: 'title', class: 'row-label', x: pad + W / 2, y: H - 8, 'text-anchor': 'middle', text: v.title || 'stack' }));
    return { w: pad * 2 + W + 70, h: H, kids };
  }

  /* ---------- hash buckets ---------- */
  function rBuckets(v) {
    const B = v.buckets || [];
    const st = v.states || {};
    const pad = 10, IW = 44, BH = 36, gapY = 8, gapX = 34;
    const kids = [];
    let maxX = 0;
    B.forEach((chain, b) => {
      const y = pad + b * (BH + gapY);
      kids.push(h('g', { key: 'b' + b, class: 'cell bidx' + S(st[b]), style: tr(pad, y) }, [h('rect', { x: 0, y: 0, width: IW, height: BH, rx: 8 }), h('text', { x: IW / 2, y: BH / 2 + 5, 'text-anchor': 'middle', text: b })]));
      let x = pad + IW + gapX;
      if (!chain || !chain.length) {
        kids.push(h('text', { key: 'bn' + b, class: 'null-t', x: pad + IW + 12, y: y + BH / 2 + 5, text: '—' }));
      }
      (chain || []).forEach((en, k) => {
        const t = en.label != null ? en.label : fmt(en.k) + (en.v !== undefined ? ': ' + fmt(en.v) : '');
        const w = tw(t, 14) + 20;
        const px = k === 0 ? pad + IW : x - gapX;
        kids.push(h('g', { key: `ba${b}-${k}`, class: 'edge link' }, [h('line', { x1: px + 2, y1: y + BH / 2, x2: x - 3, y2: y + BH / 2, class: 'eline' }), h('path', { d: arrowHead(x - 3, y + BH / 2, 0, 7), class: 'ehead' })]));
        kids.push(h('g', { key: `be${b}-${k}`, class: 'cell' + S(en.s || st[b + ',' + k]), style: tr(x, y) }, [h('rect', { x: 0, y: 0, width: w, height: BH, rx: 10 }), h('text', { x: w / 2, y: BH / 2 + 5, 'text-anchor': 'middle', text: t })]));
        x += w + gapX;
      });
      maxX = Math.max(maxX, x);
    });
    return { w: Math.max(maxX, 200), h: pad * 2 + B.length * (BH + gapY), kids };
  }

  /* ---------- key/value table ---------- */
  function rKV(v) {
    const E = v.entries || [];
    const st = v.states || {};
    const pad = 8;
    const kids = [];
    if ((v.layout || 'row') === 'row') {
      const colW = E.map(([k, val]) => Math.max(44, tw(fmt(k), 13) + 18, tw(fmt(val), 14) + 18));
      let x = pad + (v.keyLabel || v.valLabel ? 60 : 0);
      if (v.keyLabel) kids.push(h('text', { key: 'kl', class: 'row-label', x: pad, y: pad + 19, text: v.keyLabel }));
      if (v.valLabel) kids.push(h('text', { key: 'vl', class: 'row-label', x: pad, y: pad + 30 + 23, text: v.valLabel }));
      E.forEach(([k, val], i) => {
        const w = colW[i];
        kids.push(h('g', { key: 'kv-' + k, class: 'cell kv' + S(st[k]), style: tr(x, pad) }, [
          h('rect', { class: 'khead', x: 0, y: 0, width: w, height: 28, rx: 8 }),
          h('text', { class: 'ktext', x: w / 2, y: 19, 'text-anchor': 'middle', text: fmt(k) }),
          h('rect', { x: 0, y: 32, width: w, height: 38, rx: 10 }),
          h('text', { x: w / 2, y: 32 + 24, 'text-anchor': 'middle', text: fmt(val) }),
        ]));
        x += w + 5;
      });
      return { w: Math.max(x + pad, 120), h: pad * 2 + 70, kids };
    }
    const kw = Math.max(50, ...E.map(([k]) => tw(fmt(k), 13) + 20));
    const vw = Math.max(70, ...E.map(([, val]) => tw(fmt(val), 14) + 20));
    E.forEach(([k, val], i) => {
      const y = pad + i * 40;
      kids.push(h('g', { key: 'kv-' + k, class: 'cell kv' + S(st[k]), style: tr(pad, y) }, [
        h('rect', { class: 'khead', x: 0, y: 0, width: kw, height: 34, rx: 8 }),
        h('text', { class: 'ktext', x: kw / 2, y: 22, 'text-anchor': 'middle', text: fmt(k) }),
        h('rect', { x: kw + 4, y: 0, width: vw, height: 34, rx: 8 }),
        h('text', { x: kw + 4 + vw / 2, y: 22, 'text-anchor': 'middle', text: fmt(val) }),
      ]));
    });
    return { w: pad * 2 + kw + vw + 4, h: pad * 2 + E.length * 40, kids };
  }

  const RENDER = { array: rArray, graph: rGraph, tree: rTree, grid: rGrid, linked: rLinked, stack: rStack, buckets: rBuckets, kv: rKV };
  V.types = Object.keys(RENDER);

  // view -> svg vnode
  V.render = function (view) {
    const fn = RENDER[view.type];
    if (!fn) throw new Error('Unknown view type: ' + view.type);
    const out = fn(view);
    if (!isFinite(out.w) || !isFinite(out.h)) throw new Error('Renderer produced invalid size for ' + view.type);
    return h('svg', { key: 'svg-' + view.type, class: 'viz-svg viz-' + view.type, viewBox: `0 0 ${r1(out.w)} ${r1(out.h)}`, width: r1(out.w), height: r1(out.h), style: `--vw:${r1(out.w)}`, role: 'img', 'aria-label': view.title || view.type }, out.kids);
  };

  // collect all state names used in a view (for the legend)
  V.statesIn = function (view, acc) {
    acc = acc || new Set();
    const walk = (x) => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(walk);
      if ('label' in x && 'i' in x) return; // pointer colours are not legend states
      for (const k in x) {
        const val = x[k];
        if ((k === 's') && typeof val === 'string') acc.add(val);
        else if ((k === 'states' || k === 'edgeStates') && val && typeof val === 'object') Object.values(val).forEach((s) => typeof s === 'string' && acc.add(s));
        else if (typeof val === 'object') walk(val);
      }
    };
    walk(view);
    return acc;
  };

  /* ---------- DOM patching ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function create(vn) {
    const el = document.createElementNS(SVGNS, vn.tag);
    el.__key = vn.key;
    el.__tag = vn.tag;
    el.__a = {};
    update(el, vn, true);
    return el;
  }
  function update(el, vn, fresh) {
    const old = el.__a;
    for (const k in vn.a) if (old[k] !== vn.a[k]) el.setAttribute(k, vn.a[k]);
    for (const k in old) if (!(k in vn.a)) el.removeAttribute(k);
    el.__a = vn.a;
    if (vn.text != null) {
      if (el.textContent !== vn.text) el.textContent = vn.text;
    } else patchKids(el, vn.kids, fresh);
  }
  function patchKids(parent, vkids, fresh) {
    const existing = new Map();
    for (const c of Array.from(parent.childNodes)) if (c.__key != null) existing.set(c.__key, c);
    const used = new Set();
    let prev = null;
    vkids.forEach((vn, i) => {
      const key = vn.key != null ? vn.key : '#' + i + ':' + vn.tag;
      let el = existing.get(key);
      if (!el || el.__tag !== vn.tag || used.has(el)) {
        el = create(vn);
        el.__key = key;
        if (!fresh && vn.key != null) el.classList && el.classList.add('enter');
      } else update(el, vn, false);
      used.add(el);
      const want = prev ? prev.nextSibling : parent.firstChild;
      if (want !== el) parent.insertBefore(el, want);
      prev = el;
    });
    for (const c of Array.from(parent.childNodes)) if (!used.has(c)) parent.removeChild(c);
  }

  // Draw one or more views into a container (div). Keeps one <figure> per view slot.
  V.mount = function (container, views) {
    views = views || [];
    const figs = Array.from(container.children);
    views.forEach((view, i) => {
      let fig = figs[i];
      const sig = view.type;
      if (!fig || fig.__sig !== sig) {
        const nf = document.createElement('figure');
        nf.className = 'viz-fig';
        nf.__sig = sig;
        nf.innerHTML = '<figcaption></figcaption><div class="viz-scroll"></div>';
        if (fig) container.replaceChild(nf, fig); else container.appendChild(nf);
        fig = nf;
      }
      const cap = fig.firstChild;
      cap.textContent = view.title || '';
      cap.hidden = !view.title;
      const holder = fig.lastChild;
      const vn = V.render(view);
      let svg = holder.firstChild;
      if (!svg || svg.__tag !== 'svg') {
        holder.innerHTML = '';
        svg = create(vn);
        holder.appendChild(svg);
      } else update(svg, vn, false);
      // cap rendered size so small drawings don't blow up
      const w = +vn.a.width;
      svg.style.maxWidth = w * (view.scale || 1.15) + 'px';
    });
    for (let i = views.length; i < figs.length; i++) container.removeChild(figs[i]);
  };
})(typeof window !== 'undefined' ? window : globalThis);
