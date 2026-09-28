# Adding and editing topics

Every topic is a plain JavaScript object registered from a file in
`assets/js/content/ds/` (data structures) or `assets/js/content/algo/` (algorithms).
After adding a new file run `python3 tools/build.py` so `index.html` loads it, then
`node tools/validate.js` to check it.

Reference files to copy from:
- `assets/js/content/ds/builtins.js` → `list` (static data-structure page)
- `assets/js/content/algo/searching.js` → `binary-search` (animated page with 3 variants + editable input)

---

## Writing style

- Direct and plain. Short sentences. The reader already knows this and wants a fast refresher.
- `summary`: 1–3 sentences. What it is, the core idea, when to use it.
- Inline markdown in any text field: `` `code` `` and `**bold**` only.
- `notes`: 3–5 key facts. `tips`: 1–3 interview tips / gotchas. `problems`: 3–6 LeetCode-style names, e.g. `'200. Number of Islands'`.

## Python code rules (the right-hand editor)

- Idiomatic, correct, runnable Python 3. Standard library only.
- **Every line ≤ 64 characters** (the editor is ~64 columns wide). Put long comments on their own line above the code.
- Comment every meaningful line, either at the end (`x.append(4)   # to the end, O(1)`) or on the line above.
- Keep end-of-line comments aligned to a common column inside a block.
- 4-space indentation, no tabs. Leading/trailing blank lines and common indentation are stripped automatically.
- Data structures: show how to create it, then each operation one per line grouped under
  `# --- create ---`, `# --- add ---`, `# --- remove ---`, ... headers.
- Algorithms: one clean function (plus a tiny helper if needed). No `print` noise.

### Anchors: linking animation frames to code lines

Put `#@name` at the very end of a line to name it. Markers are removed before display.
A line can have several: `#@a,b`. It can also follow a normal comment:

```python
    while lo <= hi:                 # window not empty  #@loop
```

Frames refer to lines by anchor name (preferred) or 1-based number, or an array of either.

---

## Entry schema

```js
DSA.addDS({ ... })    // data structure
DSA.addAlgo({ ... })  // algorithm
```

| field | type | notes |
|---|---|---|
| `id` | string | lowercase-dashes, unique, e.g. `'merge-sort'` |
| `title` | string | e.g. `'Merge Sort'` |
| `category` | string | DS: `Python Built-ins`, `Linear`, `Linked Lists`, `Trees`, `Graphs`, `Advanced`. Algo: `Searching`, `Sorting`, `Techniques`, `Linked List Patterns`, `Trees`, `Graphs`, `Backtracking`, `Dynamic Programming`, `Math & Bits` |
| `order` | number | sort order inside the category |
| `tags` | string[] | extra search words |
| `summary` | string | shown under the title |
| `complexity` | object | **required, needs time and space.** Algorithms: `{ time: { best, avg, worst } \| 'O(n)', space: 'O(1)', stable?, inPlace?, note? }`. Data structures: `{ time: { Access: 'O(1)', Search: 'O(n)', ... }, space: 'O(n)' }` (any labels) |
| `ops` | array | data structures: `[{ op: 'x.append(v)', time: 'O(1)', note?: 'amortized' }]` |
| `space` | string | data structures: overall space, e.g. `'O(n)'` |
| `code` | string | Python source (template literal) |
| `file` | string | optional editor tab name without `.py` (default: id with underscores) |
| `visual` / `visuals` | view / view[] | static picture (data structures) |
| `visualCaption` | string | one or two sentences under a static picture |
| `trace` | `(input, util) => frames` | makes the page animated |
| `input` | object | `{ default: {...}, random?: () => ({...}), fields?: [{ key, label, type: 'array'\|'number'\|'text', max?, min? }] }` — `fields` makes inputs editable |
| `legend` | object \| false | override legend labels `{ visited: 'Seen' }`, or `false` to hide |
| `notes`, `tips`, `problems` | string[] | cards under the stage |
| `variants` | array | `[{ id, label, ...any field above }]` — each variant overrides the base fields. Use for iterative vs recursive, BFS vs DFS, Lomuto vs Hoare, memo vs tabulation. **Give each variant its own `summary`, `complexity` (if different), `code` and `trace`.** |

## Frames

```js
trace(input) {
  const t = DSA.tracer();
  t.step('anchor', 'Plain-English caption of what just happened.', {
    view: { type: 'array', ... },        // or views: [view, view]
    vars: { lo: 0, hi: 9 },              // debugger "Variables" panel (JS values → Python repr)
    aux:  [{ label: 'queue', kind: 'queue', items: ['A', 'B'] }],  // chip rows under the picture
  });
  return t.frames;
}
```

- One frame per meaningful line execution. Aim for 15–120 frames on the default input (hard cap 700).
- The caption says what happened **and why**, with real values: "`4 < 7`, so move `lo` to 5."
- Always pass the full picture in every frame (frames are snapshots, deep-copied).
- `vars` values: numbers, strings, booleans, null, arrays, objects. Use `{ raw: 'text' }` for pre-formatted text. `Infinity` shows as `inf`.
- `aux` rows: `{ label, kind: 'queue'|'stack'|'list'|'set', items: [...], states?: {index: state} }`. Items can be `{ v, s }`.
- End with a frame that shows the result (`vars.return`, `found` state, etc.).

## States (colours)

Put a state on cells/nodes/edges via `s: 'name'` or a `states` map.

`active` (current, orange) · `compare` (amber) · `swap` (rose) · `visited` (teal tint) · `frontier` (blue tint, waiting in queue/stack) ·
`done` / `sorted` (ink) · `found` (green) · `path` (dark green) · `pivot` (violet) · `min` / `max` (sky) · `bad` / `removed` (red tint) ·
`new` (lime) · `read` (light amber) · `range` (dashed blue band) · `dim` (faded, out of play) · `start` / `target` (outline only, nodes) · `tree` (ink edge).

## View types

All coordinates are computed for you. Values are displayed with `DSA.viz.fmt` (numbers, strings, `Infinity` → `∞`, arrays → `[1,2]`).

### array
```js
{ type: 'array',
  items: [5, 2, 9] | [{ v: 5, id: 'k0', s: 'active', sub: 'note' }],  // id → items glide when moved (use util.withIds)
  states: { 1: 'compare' } | ['dim', null, 'active'],
  pointers: [{ i: 0, label: 'lo', s?: 'frontier' }],                 // arrows under cells; i may be -1 or n
  range: [l, r],  ranges: [{ l, r, s?: 'range', label?: 'window' }],
  bars: false,        // true → vertical bars sized by value (sorting)
  showIndex: true,
  label: 'nums',
  rows: [ {label, items, states, pointers, range, ranges}, ... ]     // several arrays stacked (merge buffers, dp rows)
}
```
`null` / `''` items draw as empty dashed slots.

### graph
```js
{ type: 'graph', directed: false, width?: 520, height?: 310,
  nodes: [{ id: 'A', x: 10, y: 50, label?: 'A', s?: 'visited', badge?: 4 }],   // x, y in 0..100
  edges: [{ from: 'A', to: 'B', w?: 4, s?: 'tree', label?: 'x', curve?: 16 }],
  states?: { A: 'active' }, badges?: { A: 0 }, pointers?: { A: 'start' } }
```
Ready-made graphs: `util.graphs.basic`, `.weighted`, `.dag` (clone with `util.clone`). `util.adj(g)` gives a sorted adjacency list.

### tree
```js
{ type: 'tree',
  root: { id: '8', v: 8, left: {...} | null, right: {...} | null }   // binary
      | { id: 'r', v: '•', children: [ {...}, ... ], elabel?: 'c' }  // n-ary (trie, recursion tree)
  states?: { '8': 'active' }, badges?: { '8': 'h=2' }, pointers?: { '8': 'curr' },
  edgeStates?: { childId: 'active' },   // colour the edge into that child
  hidden?: ['id', ...] }                 // keep layout but don't draw (reveal a recursion tree step by step)
```
Helpers: `util.treeFromLevel([3, 9, 20, null, null, 15, 7])`, `util.bstFrom([8, 3, 10])`. Ids are `String(value)` when values are unique.

### grid (matrix, DP table)
```js
{ type: 'grid', cells: [[1, 0], [0, 1]], rowLabels?: [...], colLabels?: [...],
  states?: { '0,1': 'active', r0: 'active' /* row label */, c1: 'active' /* col label */ } }
```

### linked
```js
{ type: 'linked', nodes: [{ id: 'a', v: 1, s? }], doubly?: false,
  links?: [{ from: 'a', to: 'b' | null, s?: 'active', curve?: 'above' | 'below' }],  // default: a→b→…→None
  pointers?: { a: 'head', b: ['slow', 'fast'], null: 'prev' },   // null key draws a "None" ghost on the left
  nullLabel?: 'None' }
```

### stack (vertical)
`{ type: 'stack', items: [bottom, ..., top] | [{ v, id, s }], states?, title?: 'stack' }`

### buckets (hash table)
`{ type: 'buckets', buckets: [[{ k: 'cat', v: 3, s? }], [], ...], states?: { 2: 'active', '2,0': 'found' } }`

### kv (dict / distance table)
`{ type: 'kv', entries: [['A', 0], ['B', Infinity]], states?: { B: 'active' }, layout?: 'row' | 'col', keyLabel?, valLabel? }`

Every view accepts `title` (small caption above it).

## Checking your work

```bash
python3 tools/build.py            # refresh <script> list in index.html
node tools/validate.js [id]       # schema, anchors, traces on default + random inputs, renderers
python3 tools/shoot.py OUT a.merge-sort@12 d.heap a.dijkstra~1@20:dark   # screenshots (route[~variant][@steps][:dark][:mobile])
```
