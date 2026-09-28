/* dsa.py — registry + helpers shared by every content file.
 * Content files call DSA.addDS({...}) or DSA.addAlgo({...}).
 * See CONTRIBUTING.md for the full entry schema.
 */
(function (root) {
  'use strict';
  const DSA = root.DSA || (root.DSA = {});
  DSA.ds = [];
  DSA.algo = [];

  // Sidebar order of categories. Unknown categories are appended at the end.
  DSA.categoryOrder = {
    ds: ['Python Built-ins', 'Linear', 'Linked Lists', 'Trees', 'Graphs', 'Advanced'],
    algo: ['Searching', 'Sorting', 'Techniques', 'Linked List Patterns', 'Trees', 'Graphs', 'Backtracking', 'Dynamic Programming', 'Math & Bits'],
  };

  function add(kind, e) {
    if (!e || !e.id) throw new Error('entry needs an id');
    e.kind = kind;
    e.order = e.order == null ? 100 : e.order;
    DSA[kind].push(e);
    return e;
  }
  DSA.addDS = (e) => add('ds', e);
  DSA.addAlgo = (e) => add('algo', e);

  // structuredClone keeps Infinity / -Infinity (JSON would turn them into null)
  const clone = (x) => (x === undefined ? undefined : typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x)));

  /* ---------- tracer: collects animation frames ----------
   * const t = DSA.tracer();
   * t.step('anchor', 'What happens', { view, vars, aux });
   * return t.frames;
   */
  DSA.tracer = function (limit) {
    const frames = [];
    const max = limit || 700;
    return {
      frames,
      step(line, msg, o) {
        if (frames.length >= max) return;
        o = o || {};
        const f = { line, msg: msg || '' };
        if (o.view) f.view = clone(o.view);
        if (o.views) f.views = clone(o.views);
        if (o.vars) f.vars = clone(o.vars);
        if (o.aux) f.aux = clone(o.aux);
        if (o.out !== undefined) f.out = clone(o.out);
        frames.push(f);
      },
    };
  };

  /* ---------- general utils ---------- */
  const U = (DSA.util = {});
  U.clone = clone;
  U.range = (n) => Array.from({ length: n }, (_, i) => i);
  U.randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  U.randArray = (n, lo = 1, hi = 50, unique = true) => {
    const out = [];
    const seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 1000) {
      const v = U.randInt(lo, hi);
      if (unique && seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    return out;
  };
  U.shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Give array items stable ids so the renderer can animate them moving.
  U.withIds = (arr) => arr.map((v, i) => ({ v, id: 'k' + i }));
  // Python-ish repr for the variables panel.
  U.py = function py(x) {
    if (x === null || x === undefined) return 'None';
    if (x === true) return 'True';
    if (x === false) return 'False';
    if (x === Infinity) return "inf";
    if (x === -Infinity) return "-inf";
    if (typeof x === 'string') return "'" + x + "'";
    if (Array.isArray(x)) return '[' + x.map(py).join(', ') + ']';
    if (typeof x === 'object') {
      if ('v' in x && 'id' in x && Object.keys(x).length <= 3) return py(x.v);
      return '{' + Object.keys(x).map((k) => py(k) + ': ' + py(x[k])).join(', ') + '}';
    }
    return String(x);
  };

  /* Binary tree from a level-order list (LeetCode style, null = missing).
   * Node ids: String(value) when all values are unique, else 'n<index>'. */
  U.treeFromLevel = function (arr) {
    if (!arr.length || arr[0] == null) return null;
    const vals = arr.filter((v) => v != null);
    const unique = new Set(vals).size === vals.length;
    const mk = (v, i) => ({ id: unique ? String(v) : 'n' + i, v, left: null, right: null });
    const rootNode = mk(arr[0], 0);
    const q = [rootNode];
    let i = 1;
    while (q.length && i < arr.length) {
      const node = q.shift();
      if (i < arr.length && arr[i] != null) { node.left = mk(arr[i], i); q.push(node.left); }
      i++;
      if (i < arr.length && arr[i] != null) { node.right = mk(arr[i], i); q.push(node.right); }
      i++;
    }
    return rootNode;
  };
  // Insert values into a BST (ids = String(value)).
  U.bstFrom = function (values) {
    let r = null;
    const ins = (node, v) => {
      if (!node) return { id: String(v), v, left: null, right: null };
      if (v < node.v) node.left = ins(node.left, v);
      else if (v > node.v) node.right = ins(node.right, v);
      return node;
    };
    values.forEach((v) => (r = ins(r, v)));
    return r;
  };

  /* Ready-made graphs (node x/y are 0..100). Copy with U.clone before editing. */
  U.graphs = {
    // undirected, 7 nodes
    basic: {
      nodes: [
        { id: 'A', x: 12, y: 50 }, { id: 'B', x: 34, y: 18 }, { id: 'C', x: 34, y: 82 },
        { id: 'D', x: 58, y: 18 }, { id: 'E', x: 58, y: 82 }, { id: 'F', x: 82, y: 34 }, { id: 'G', x: 88, y: 78 },
      ],
      edges: [
        { from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'E' },
        { from: 'B', to: 'E' }, { from: 'D', to: 'F' }, { from: 'E', to: 'G' }, { from: 'F', to: 'G' },
      ],
    },
    // undirected, weighted
    weighted: {
      nodes: [
        { id: 'A', x: 10, y: 50 }, { id: 'B', x: 32, y: 16 }, { id: 'C', x: 32, y: 84 },
        { id: 'D', x: 60, y: 16 }, { id: 'E', x: 60, y: 84 }, { id: 'F', x: 88, y: 50 },
      ],
      edges: [
        { from: 'A', to: 'B', w: 4 }, { from: 'A', to: 'C', w: 2 }, { from: 'B', to: 'C', w: 1 },
        { from: 'B', to: 'D', w: 5 }, { from: 'C', to: 'E', w: 8 }, { from: 'C', to: 'D', w: 9 },
        { from: 'D', to: 'E', w: 2 }, { from: 'D', to: 'F', w: 6 }, { from: 'E', to: 'F', w: 3 },
      ],
    },
    // directed acyclic (course schedule style)
    dag: {
      directed: true,
      nodes: [
        { id: 'A', x: 10, y: 25 }, { id: 'B', x: 10, y: 75 }, { id: 'C', x: 38, y: 25 },
        { id: 'D', x: 38, y: 75 }, { id: 'E', x: 66, y: 50 }, { id: 'F', x: 90, y: 50 },
      ],
      edges: [
        { from: 'A', to: 'C' }, { from: 'B', to: 'C' }, { from: 'B', to: 'D' },
        { from: 'C', to: 'E' }, { from: 'D', to: 'E' }, { from: 'E', to: 'F' },
      ],
    },
  };
  // Adjacency list (sorted neighbours) from a graph object.
  U.adj = function (g, directed) {
    const d = directed == null ? !!g.directed : directed;
    const a = {};
    g.nodes.forEach((n) => (a[n.id] = []));
    g.edges.forEach((e) => {
      a[e.from].push(e.w == null ? e.to : [e.to, e.w]);
      if (!d) a[e.to].push(e.w == null ? e.from : [e.from, e.w]);
    });
    Object.keys(a).forEach((k) => a[k].sort((x, y) => String(x).localeCompare(String(y))));
    return a;
  };
})(typeof window !== 'undefined' ? window : globalThis);
