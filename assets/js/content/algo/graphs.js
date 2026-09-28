/* Algorithms · Graphs */
(function () {
  const U = DSA.util;

  /* ================= shared helpers ================= */

  // Graph with a sorted adjacency list attached.
  function mk(def) {
    const g = U.clone(def);
    g.adj = U.adj(g);
    return g;
  }
  // Edge key: 'A-B' (undirected, sorted) or 'A>B' (directed).
  const ek = (g, u, v) => (g.directed ? u + '>' + v : u < v ? u + '-' + v : v + '-' + u);
  // Graph view. o = { ns: {id: state}, es: {edgeKey: state}, badges, ptr, title }
  function gview(g, o) {
    o = o || {};
    const ns = o.ns || {}, es = o.es || {}, bd = o.badges || {};
    const v = {
      type: 'graph',
      directed: !!g.directed,
      nodes: g.nodes.map((n) => {
        const m = { id: n.id, x: n.x, y: n.y };
        if (ns[n.id]) m.s = ns[n.id];
        if (bd[n.id] != null) m.badge = bd[n.id];
        return m;
      }),
      edges: g.edges.map((e) => {
        const m = { from: e.from, to: e.to };
        if (e.w != null) m.w = e.w;
        const s = es[ek(g, e.from, e.to)];
        if (s) m.s = s;
        return m;
      }),
    };
    if (g.width) v.width = g.width;
    if (g.height) v.height = g.height;
    if (o.ptr && Object.keys(o.ptr).length) v.pointers = o.ptr;
    if (o.title) v.title = o.title;
    return v;
  }
  // Pointer map from [id, label] pairs (null ids ignored, labels merged).
  function ptrs(pairs) {
    const p = {};
    pairs.forEach(([id, lab]) => {
      if (id == null) return;
      p[id] = p[id] ? [].concat(p[id], lab) : lab;
    });
    return p;
  }
  // Python literal of one value / a tuple.
  const pv = (x) => (typeof x === 'string' ? `'${x}'` : x === Infinity ? 'inf' : String(x));
  const tup = (...a) => '(' + a.map(pv).join(', ') + ')';
  const f = (x) => (x === Infinity ? 'inf' : String(x)); // number in captions
  const q = (x) => `'${x}'`;
  // Keep only defined vars (so the panel shows what exists in Python).
  const vars = (o) => {
    const r = {};
    Object.keys(o).forEach((k) => { if (o[k] !== undefined) r[k] = o[k]; });
    return r;
  };
  const list = (a) => '[' + a.map(pv).join(', ') + ']';
  // Frames are JSON-cloned (Infinity -> null), so draw inf as the string '∞'.
  const inf = (x) => (x === Infinity ? '∞' : x);
  const infMap = (o) => Object.fromEntries(Object.keys(o).map((k) => [k, inf(o[k])]));

  // Python source of the graph dict, packed to fit the editor.
  function pyGraph(adj, name) {
    name = name || 'graph';
    const items = Object.keys(adj).map((k) => `'${k}': [` + adj[k].map((x) => (Array.isArray(x) ? `('${x[0]}', ${x[1]})` : `'${x}'`)).join(', ') + ']');
    const head = name + ' = {';
    const pad = ' '.repeat(head.length);
    const lines = [];
    let cur = head;
    items.forEach((it, i) => {
      const piece = it + (i === items.length - 1 ? '}' : ',');
      const fresh = cur === head || cur === pad;
      if (!fresh && cur.length + 1 + piece.length > 62) { lines.push(cur); cur = pad + piece; }
      else cur += (fresh ? '' : ' ') + piece;
    });
    lines.push(cur);
    return lines.join('\n');
  }

  /* ---------- heapq (same list order as CPython) ---------- */
  function lt(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] < b[i]) return true;
      if (a[i] > b[i]) return false;
    }
    return a.length < b.length;
  }
  function siftdown(h, start, pos) {
    const item = h[pos];
    while (pos > start) {
      const pp = (pos - 1) >> 1;
      if (lt(item, h[pp])) { h[pos] = h[pp]; pos = pp; continue; }
      break;
    }
    h[pos] = item;
  }
  function siftup(h, pos) {
    const end = h.length, start = pos, item = h[pos];
    let c = 2 * pos + 1;
    while (c < end) {
      const r = c + 1;
      if (r < end && !lt(h[c], h[r])) c = r;
      h[pos] = h[c];
      pos = c;
      c = 2 * pos + 1;
    }
    h[pos] = item;
    siftdown(h, start, pos);
  }
  const hpush = (h, x) => { h.push(x); siftdown(h, 0, h.length - 1); };
  const hpop = (h) => {
    const last = h.pop();
    if (!h.length) return last;
    const top = h[0];
    h[0] = last;
    siftup(h, 0);
    return top;
  };
  const heapify = (h) => { for (let i = (h.length >> 1) - 1; i >= 0; i--) siftup(h, i); };
  const heapAux = (h, label) => ({ label: label || 'heap', kind: 'list', items: h.map((x) => ({ v: tup(...x), s: null })), states: h.length ? { 0: 'min' } : {} });

  /* ---------- graphs used on these pages ---------- */
  const GB = mk(U.graphs.basic);      // undirected, 7 nodes
  const GW = mk(U.graphs.weighted);   // undirected, weighted, 6 nodes
  const GD = mk(U.graphs.dag);        // DAG, 6 nodes
  const GBF = mk({                    // directed, one negative edge
    directed: true,
    nodes: [
      { id: 'S', x: 6, y: 50 }, { id: 'A', x: 40, y: 12 }, { id: 'B', x: 40, y: 88 },
      { id: 'C', x: 74, y: 12 }, { id: 'D', x: 94, y: 62 },
    ],
    edges: [
      { from: 'S', to: 'A', w: 6 }, { from: 'S', to: 'B', w: 4 }, { from: 'A', to: 'C', w: 2 },
      { from: 'B', to: 'A', w: -3 }, { from: 'B', to: 'D', w: 5 }, { from: 'C', to: 'D', w: 1 },
    ],
  });
  const GFW = mk({                    // directed, 4 nodes (Floyd-Warshall)
    directed: true, width: 360, height: 250,
    nodes: [{ id: 'A', x: 8, y: 10 }, { id: 'B', x: 92, y: 10 }, { id: 'C', x: 92, y: 90 }, { id: 'D', x: 8, y: 90 }],
    edges: [
      { from: 'A', to: 'B', w: 3 }, { from: 'A', to: 'D', w: 7 }, { from: 'B', to: 'A', w: 8 }, { from: 'B', to: 'C', w: 2 },
      { from: 'C', to: 'A', w: 5 }, { from: 'C', to: 'D', w: 1 }, { from: 'D', to: 'A', w: 2 },
    ],
  });
  const GCD = mk({                    // directed with a cycle D -> E -> F -> D
    directed: true,
    nodes: [
      { id: 'A', x: 6, y: 42 }, { id: 'B', x: 34, y: 10 }, { id: 'C', x: 82, y: 10 },
      { id: 'D', x: 34, y: 68 }, { id: 'E', x: 82, y: 68 }, { id: 'F', x: 58, y: 98 },
    ],
    edges: [
      { from: 'A', to: 'B' }, { from: 'A', to: 'D' }, { from: 'B', to: 'C' }, { from: 'D', to: 'C' },
      { from: 'D', to: 'E' }, { from: 'E', to: 'F' }, { from: 'F', to: 'D' },
    ],
  });
  const GCU = mk({                    // undirected ring A-B-D-E-F-C-A plus tail D-G
    nodes: [
      { id: 'A', x: 6, y: 50 }, { id: 'B', x: 32, y: 12 }, { id: 'C', x: 32, y: 88 },
      { id: 'D', x: 62, y: 12 }, { id: 'E', x: 86, y: 54 }, { id: 'F', x: 62, y: 88 }, { id: 'G', x: 94, y: 10 },
    ],
    edges: [
      { from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'F' },
      { from: 'D', to: 'E' }, { from: 'D', to: 'G' }, { from: 'E', to: 'F' },
    ],
  });

  /* ================= BFS ================= */

  const BFS_CODE = `
from collections import deque

def bfs(graph, start):
    visited = {start}               # mark when queued  #@init
    queue = deque([start])          # FIFO queue  #@initq
    order = []                      # visit order  #@inito
    while queue:                    # until nothing waits  #@loop
        node = queue.popleft()      # oldest first  #@pop
        order.append(node)          #@visit
        for nei in graph[node]:     # neighbours, sorted
            if nei not in visited:  #@check
                visited.add(nei)    # mark now, not on pop  #@mark
                queue.append(nei)   # wait at the back  #@push
    return order                    #@done

${pyGraph(GB.adj)}
bfs(graph, 'A')   # ['A', 'B', 'C', 'D', 'E', 'F', 'G']  #@call
`;

  function traceBFS() {
    const g = GB, adj = g.adj, start = 'A';
    const t = DSA.tracer();
    const visited = new Set(), queue = [], order = [], tree = {};
    let node, nei, act = null;
    const step = (line, msg) => {
      const ns = {};
      visited.forEach((u) => (ns[u] = queue.includes(u) ? 'frontier' : 'visited'));
      if (node) ns[node] = 'active';
      const es = Object.assign({}, tree);
      if (act) es[act] = 'active';
      t.step(line, msg, {
        view: gview(g, { ns, es, ptr: ptrs([[node, 'node'], [nei, 'nei']]) }),
        vars: vars({ start, node, nei, order: order.slice() }),
        aux: [
          { label: 'queue', kind: 'queue', items: queue.slice() },
          { label: 'visited', kind: 'set', items: [...visited] },
          { label: 'order', kind: 'list', items: order.slice() },
        ],
      });
    };
    step('call', 'Call `bfs(graph, \'A\')`. The graph is a dict: each node maps to a list of its neighbours.');
    visited.add(start); queue.push(start);
    step(['init', 'initq', 'inito'], `Mark ${q(start)} visited and put it in the queue. Mark on enqueue so no node is queued twice.`);
    for (;;) {
      step('loop', queue.length ? `The queue holds ${list(queue)}, so keep going.` : 'The queue is empty: every reachable node has been visited.');
      if (!queue.length) break;
      node = queue.shift(); nei = undefined; act = null;
      order.push(node);
      step(['pop', 'visit'], `Pop ${q(node)} from the front (it waited longest) and add it to \`order\`.`);
      for (const n of adj[node]) {
        nei = n; act = ek(g, node, n);
        const seen = visited.has(n);
        step('check', seen ? `${q(n)} is already in \`visited\`, skip it.` : `${q(n)} is not visited yet: first time we reach it.`);
        if (!seen) {
          visited.add(n); queue.push(n); tree[ek(g, node, n)] = 'tree';
          step(['mark', 'push'], `Mark ${q(n)} and append it to the back of the queue. ${q(node)}–${q(n)} becomes a tree edge.`);
        }
      }
      act = null; nei = undefined;
    }
    node = undefined;
    t.step('done', `Return ${list(order)}: nodes in order of distance from ${q(start)} (1 hop, then 2 hops, ...).`, {
      view: gview(g, { ns: Object.fromEntries(order.map((u) => [u, 'visited'])), es: tree }),
      vars: { start, order: order.slice(), return: order.slice() },
      aux: [{ label: 'order', kind: 'list', items: order.slice() }],
    });
    return t.frames;
  }

  const SP_CODE = `
from collections import deque

def shortest_path(graph, start, goal):
    parent = {start: None}          # doubles as visited  #@init
    queue = deque([start])          #@initq
    while queue:                    #@loop
        node = queue.popleft()      #@pop
        if node == goal:            # first reach = shortest  #@goal
            break
        for nei in graph[node]:
            if nei not in parent:   #@check
                parent[nei] = node  # we came from node  #@mark
                queue.append(nei)   #@push
    if goal not in parent:          #@reach
        return []                   # unreachable
    path, node = [], goal           #@back0
    while node is not None:         # walk back to start  #@back
        path.append(node)           #@append
        node = parent[node]         #@up
    return path[::-1]               # start -> goal  #@done

${pyGraph(GB.adj)}
shortest_path(graph, 'A', 'G')   # ['A', 'B', 'E', 'G']  #@call
`;

  function traceSP() {
    const g = GB, adj = g.adj, start = 'A', goal = 'G';
    const t = DSA.tracer();
    const parent = new Map(), queue = [], popped = new Set(), tree = {};
    let node, nei, act = null, kvHi = null, path, pathSet = new Set(), pathEdges = {};
    const step = (line, msg) => {
      const ns = {};
      parent.forEach((_, u) => (ns[u] = queue.includes(u) ? 'frontier' : popped.has(u) ? 'visited' : 'frontier'));
      pathSet.forEach((u) => (ns[u] = 'path'));
      if (node && !path) ns[node] = 'active';
      const es = Object.assign({}, tree, pathEdges);
      if (act) es[act] = 'active';
      const kvStates = {};
      if (kvHi) kvStates[kvHi[0]] = kvHi[1];
      t.step(line, msg, {
        views: [
          gview(g, { ns, es, ptr: ptrs([[goal, 'goal'], [node, 'node'], [nei, 'nei']]) }),
          { type: 'kv', title: 'parent', entries: [...parent].map(([k, v]) => [k, v == null ? 'None' : v]), states: kvStates },
        ],
        vars: vars({ start, goal, node, nei, path: path ? path.slice() : undefined }),
        aux: [{ label: 'queue', kind: 'queue', items: queue.slice() }],
      });
    };
    step('call', 'Call `shortest_path(graph, \'A\', \'G\')`. Unweighted graph, so BFS finds the path with the fewest edges.');
    parent.set(start, null); queue.push(start); kvHi = [start, 'new'];
    step(['init', 'initq'], `\`parent = {'A': None}\` marks ${q(start)} as seen and remembers where each node came from.`);
    for (;;) {
      kvHi = null;
      step('loop', queue.length ? `Queue: ${list(queue)}.` : 'Queue is empty.');
      if (!queue.length) break;
      node = queue.shift(); popped.add(node); nei = undefined; act = null;
      if (node === goal) {
        step(['pop', 'goal'], `Pop ${q(node)}. It is the goal. BFS reaches nodes in order of distance, so this is the shortest route. Break.`);
        break;
      }
      step(['pop', 'goal'], `Pop ${q(node)}. Not the goal, so look at its neighbours.`);
      for (const n of adj[node]) {
        nei = n; act = ek(g, node, n); kvHi = null;
        const seen = parent.has(n);
        step('check', seen ? `${q(n)} is already in \`parent\`, skip.` : `${q(n)} is new.`);
        if (!seen) {
          parent.set(n, node); queue.push(n); tree[ek(g, node, n)] = 'tree'; kvHi = [n, 'new'];
          step(['mark', 'push'], `\`parent['${n}'] = '${node}'\`: we reached ${q(n)} from ${q(node)}. Queue it.`);
        }
      }
      nei = undefined; act = null;
    }
    nei = undefined; act = null;
    step('reach', `${q(goal)} is in \`parent\`, so it is reachable.`);
    path = []; node = goal;
    step('back0', `Rebuild the path backwards, starting from ${q(goal)}.`);
    for (;;) {
      kvHi = node != null ? [node, 'path'] : null;
      step('back', node != null ? `\`node = '${node}'\`, not None: keep walking.` : '`node` is None: we walked past the start.');
      if (node == null) break;
      path.push(node); pathSet.add(node);
      const p = parent.get(node);
      step(['append', 'up'], p != null ? `Append ${q(node)}. Its parent is ${q(p)}, step back there.` : `Append ${q(node)}. It is the start, its parent is None.`);
      if (p != null) pathEdges[ek(g, node, p)] = 'path';
      node = p;
    }
    node = undefined;
    const res = path.slice().reverse();
    t.step('done', `Reverse it: ${list(res)}. ${res.length - 1} edges, the fewest possible.`, {
      views: [
        gview(g, { ns: Object.fromEntries([...parent.keys()].map((u) => [u, pathSet.has(u) ? 'path' : 'visited'])), es: Object.assign({}, tree, pathEdges) }),
        { type: 'kv', title: 'parent', entries: [...parent].map(([k, v]) => [k, v == null ? 'None' : v]), states: Object.fromEntries([...pathSet].map((u) => [u, 'path'])) },
      ],
      vars: { start, goal, path: path.slice(), return: res },
    });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'bfs',
    title: 'Breadth-First Search',
    category: 'Graphs',
    order: 1,
    tags: ['bfs', 'queue', 'deque', 'level order', 'shortest path', 'unweighted', 'traversal'],
    summary: 'Explore a graph in rings: first every node 1 edge away, then 2, and so on. A FIFO queue (`collections.deque`) holds the nodes waiting their turn.',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    notes: [
      'Use `deque.popleft()`, never `list.pop(0)` (that is O(n)).',
      'Mark a node visited **when you enqueue it**, not when you pop it. Otherwise it can be queued many times.',
      'BFS gives the shortest path in an **unweighted** graph. For weights use Dijkstra.',
      'Level by level: loop `for _ in range(len(queue))` inside the `while` to process one ring at a time.',
      'Adjacency list as a dict of lists; build it with `defaultdict(list)` from an edge list.',
    ],
    tips: [
      'Grid problems are graphs: neighbours are the 4 cells `(r±1, c)`, `(r, c±1)`.',
      'Multi-source BFS: put all sources in the queue at the start (Rotting Oranges, 01 Matrix).',
    ],
    problems: ['102. Binary Tree Level Order Traversal', '127. Word Ladder', '994. Rotting Oranges', '542. 01 Matrix', '1091. Shortest Path in Binary Matrix', '133. Clone Graph'],
    legend: { frontier: 'In queue' },
    variants: [
      {
        id: 'traversal',
        label: 'Traversal',
        file: 'bfs',
        summary: 'Explore a graph in rings: first every node 1 edge away, then 2, and so on. A FIFO queue (`collections.deque`) holds the nodes waiting their turn; a `visited` set stops repeats.',
        code: BFS_CODE,
        trace: traceBFS,
      },
      {
        id: 'shortest-path',
        label: 'Shortest path',
        file: 'shortest_path',
        summary: 'In an **unweighted** graph the first time BFS reaches a node is along a path with the fewest edges. Store each node\'s `parent`, then walk back from the goal to rebuild the path.',
        complexity: { time: 'O(V + E)', space: 'O(V)', note: 'Path rebuild is O(path length).' },
        code: SP_CODE,
        trace: traceSP,
      },
    ],
  });

  /* ================= DFS ================= */

  const DFS_REC = `
def dfs(graph, start):
    visited, order = set(), []      #@init

    def visit(node):
        visited.add(node)           # mark on entry  #@mark
        order.append(node)          #@visit
        for nei in graph[node]:     #@for
            if nei not in visited:  #@check
                visit(nei)          # go deeper first  #@recurse

    visit(start)                    #@start
    return order                    #@done

${pyGraph(GB.adj)}
dfs(graph, 'A')   # ['A', 'B', 'D', 'F', 'G', 'E', 'C']  #@call
`;

  function traceDFSRec() {
    const g = GB, adj = g.adj, start = 'A';
    const t = DSA.tracer();
    const visited = new Set(), order = [], stack = [], finished = new Set(), tree = {};
    let nei, act = null;
    const step = (line, msg) => {
      const ns = {};
      visited.forEach((u) => (ns[u] = finished.has(u) ? 'done' : 'frontier'));
      const node = stack[stack.length - 1];
      if (node) ns[node] = 'active';
      const es = Object.assign({}, tree);
      if (act) es[act] = 'active';
      t.step(line, msg, {
        view: gview(g, { ns, es, ptr: ptrs([[node, 'node'], [nei, 'nei']]) }),
        vars: vars({ node, nei, order: order.slice() }),
        aux: [
          { label: 'call stack', kind: 'stack', items: stack.map((u, i) => ({ v: `visit('${u}')`, s: i === stack.length - 1 ? 'active' : null })) },
          { label: 'order', kind: 'list', items: order.slice() },
        ],
      });
    };
    const visit = (node) => {
      stack.push(node); nei = undefined; act = null;
      visited.add(node); order.push(node);
      step(['mark', 'visit'], `Enter \`visit('${node}')\`: mark ${q(node)} and add it to \`order\`.`);
      for (const n of adj[node]) {
        nei = n; act = ek(g, node, n);
        if (visited.has(n)) {
          step('check', `${q(n)} is already visited, skip.`);
        } else {
          tree[ek(g, node, n)] = 'tree';
          step(['check', 'recurse'], `${q(n)} is new: call \`visit('${n}')\` now. ${q(node)} waits on the call stack.`);
          visit(n);
          nei = n; act = null;
        }
      }
      nei = undefined; act = null;
      const caller = stack[stack.length - 2];
      step('for', caller ? `${q(node)} has no neighbours left. Return to \`visit('${caller}')\`.` : `${q(node)} has no neighbours left. The first call returns.`);
      finished.add(node); stack.pop();
    };
    step('call', 'Call `dfs(graph, \'A\')`. DFS goes as deep as it can before backing up.');
    step('init', 'Empty `visited` set and `order` list. The nested `visit` shares them.');
    step('start', `Start the search: \`visit('${start}')\`.`);
    visit(start);
    t.step('done', `Return ${list(order)}. Each branch was followed to its end before trying the next one.`, {
      view: gview(g, { ns: Object.fromEntries(order.map((u) => [u, 'done'])), es: tree }),
      vars: { order: order.slice(), return: order.slice() },
      aux: [{ label: 'call stack', kind: 'stack', items: [] }, { label: 'order', kind: 'list', items: order.slice() }],
    });
    return t.frames;
  }

  const DFS_IT = `
def dfs(graph, start):
    visited, order = set(), []      #@init
    stack = [start]                 # LIFO: list end is the top  #@initq
    while stack:                    #@loop
        node = stack.pop()          # newest first  #@pop
        if node in visited:         # pushed twice: skip  #@seen
            continue
        visited.add(node)           # mark when popped  #@mark
        order.append(node)          #@visit
        # reversed, so the smallest neighbour ends on top
        for nei in reversed(graph[node]):
            if nei not in visited:  #@check
                stack.append(nei)   #@push
    return order                    #@done

${pyGraph(GB.adj)}
dfs(graph, 'A')   # ['A', 'B', 'D', 'F', 'G', 'E', 'C']  #@call
`;

  function traceDFSIt() {
    const g = GB, adj = g.adj, start = 'A';
    const t = DSA.tracer();
    const visited = new Set(), order = [], stack = [], tree = {}, via = {};
    let node, nei, act = null;
    const step = (line, msg) => {
      const ns = {};
      stack.forEach((u) => { if (!visited.has(u)) ns[u] = 'frontier'; });
      visited.forEach((u) => (ns[u] = 'visited'));
      if (node) ns[node] = 'active';
      const es = Object.assign({}, tree);
      if (act) es[act] = 'active';
      t.step(line, msg, {
        view: gview(g, { ns, es, ptr: ptrs([[node, 'node'], [nei, 'nei']]) }),
        vars: vars({ start, node, nei, order: order.slice() }),
        aux: [
          { label: 'stack', kind: 'stack', items: stack.map((u, i) => ({ v: u, s: visited.has(u) ? 'dim' : null })) },
          { label: 'visited', kind: 'set', items: [...visited] },
        ],
      });
    };
    step('call', 'Call `dfs(graph, \'A\')`. Same idea as recursion, but with our own stack.');
    stack.push(start);
    step(['init', 'initq'], `Stack starts with ${q(start)}. \`list.append\` / \`list.pop\` are both O(1) at the end.`);
    for (;;) {
      step('loop', stack.length ? `Stack: ${list(stack)} (top is the right end).` : 'The stack is empty: done.');
      if (!stack.length) break;
      node = stack.pop(); nei = undefined; act = null;
      if (visited.has(node)) {
        step(['pop', 'seen'], `Pop ${q(node)}. It was pushed twice and is already visited, so skip it.`);
        node = undefined;
        continue;
      }
      step(['pop', 'seen'], `Pop ${q(node)} from the top. Not visited yet.`);
      visited.add(node); order.push(node);
      if (via[node]) tree[ek(g, via[node], node)] = 'tree';
      step(['mark', 'visit'], `Mark ${q(node)} and add it to \`order\`: ${list(order)}.`);
      for (const n of adj[node].slice().reverse()) {
        nei = n; act = ek(g, node, n);
        if (visited.has(n)) step('check', `${q(n)} is already visited, skip.`);
        else {
          stack.push(n); via[n] = node;
          step(['check', 'push'], `${q(n)} is not visited: push it. Stack: ${list(stack)}.`);
        }
      }
      nei = undefined; act = null;
    }
    node = undefined;
    t.step('done', `Return ${list(order)}: the same order as the recursive version, thanks to \`reversed\`.`, {
      view: gview(g, { ns: Object.fromEntries(order.map((u) => [u, 'visited'])), es: tree }),
      vars: { start, order: order.slice(), return: order.slice() },
      aux: [{ label: 'stack', kind: 'stack', items: [] }, { label: 'visited', kind: 'set', items: [...visited] }],
    });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'dfs',
    title: 'Depth-First Search',
    category: 'Graphs',
    order: 2,
    tags: ['dfs', 'stack', 'recursion', 'backtrack', 'traversal', 'connected components'],
    summary: 'Follow one path as deep as it goes, then back up and try the next branch. Uses a stack: the call stack (recursion) or an explicit list.',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    notes: [
      'Recursive DFS is shortest to write. Python\'s default recursion limit is ~1000, so deep graphs need the iterative version or `sys.setrecursionlimit`.',
      'Iterative DFS with "mark on pop" may push a node more than once; the `if node in visited: continue` check handles it.',
      'DFS is the base for cycle detection, topological sort, connected components and path finding.',
      'Count components: loop over every node and start a DFS from each unvisited one.',
    ],
    tips: [
      'On a grid, mark cells in place (e.g. set to `\'#\'`) instead of keeping a `visited` set, if you may modify the input.',
      'Say whether you mark on push or on pop; interviewers like hearing that you know the difference.',
    ],
    problems: ['200. Number of Islands', '547. Number of Provinces', '133. Clone Graph', '797. All Paths From Source to Target', '841. Keys and Rooms'],
    variants: [
      {
        id: 'recursive',
        label: 'Recursive',
        file: 'dfs',
        summary: 'Follow one path as deep as it goes, then back up and try the next branch. The recursive version uses the call stack: each `visit(node)` waits while its child is explored.',
        complexity: { time: 'O(V + E)', space: 'O(V)', note: 'Space is the recursion depth, up to V.' },
        legend: { frontier: 'On call stack', done: 'Finished' },
        code: DFS_REC,
        trace: traceDFSRec,
      },
      {
        id: 'iterative',
        label: 'Iterative',
        file: 'dfs_iterative',
        summary: 'Same traversal with an explicit stack (a plain list). Pop the top, skip it if already visited, otherwise mark it and push its unvisited neighbours.',
        complexity: { time: 'O(V + E)', space: 'O(V + E)', note: 'A node can sit on the stack more than once, so the stack can hold up to E entries.' },
        legend: { frontier: 'On stack' },
        code: DFS_IT,
        trace: traceDFSIt,
      },
    ],
  });

  /* ================= Grid: number of islands ================= */

  const GRID = [
    ['1', '1', '0', '0', '1'],
    ['1', '0', '0', '1', '1'],
    ['0', '0', '1', '0', '0'],
    ['0', '1', '1', '0', '0'],
  ];
  const GRID_PY = `grid = [['1', '1', '0', '0', '1'],
        ['1', '0', '0', '1', '1'],
        ['0', '0', '1', '0', '0'],
        ['0', '1', '1', '0', '0']]
num_islands(grid)   # 3  #@callg`;
  const DIRS = [[1, 0, 'down'], [-1, 0, 'up'], [0, 1, 'right'], [0, -1, 'left']];
  const cellStr = (r, c) => `(${r}, ${c})`;

  // Shared state + drawing for both island variants.
  function islandState() {
    const s = {
      grid: GRID.map((r) => r.slice()),
      rows: GRID.length, cols: GRID[0].length,
      island: new Set(), done: new Set(), queue: [], onStack: [],
      cursor: null, cur: null, probe: null,
    };
    s.view = () => {
      const st = {};
      for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) if (s.grid[r][c] === '0') st[r + ',' + c] = 'dim';
      s.done.forEach((k) => (st[k] = 'done'));
      s.island.forEach((k) => (st[k] = 'visited'));
      s.queue.forEach(([r, c]) => (st[r + ',' + c] = 'frontier'));
      s.onStack.forEach(([r, c]) => (st[r + ',' + c] = 'frontier'));
      if (s.cursor) { st['r' + s.cursor[0]] = 'active'; st['c' + s.cursor[1]] = 'active'; }
      if (s.probe && s.probe[0] >= 0 && s.probe[0] < s.rows && s.probe[1] >= 0 && s.probe[1] < s.cols) st[s.probe[0] + ',' + s.probe[1]] = 'compare';
      if (s.cur) st[s.cur[0] + ',' + s.cur[1]] = 'active';
      return { type: 'grid', cells: s.grid, rowLabels: U.range(s.rows), colLabels: U.range(s.cols), states: st };
    };
    return s;
  }

  const ISL_BFS = `
from collections import deque

def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0                       #@init

    def bfs(r, c):
        grid[r][c] = '#'            # mark visited in place  #@seed
        queue = deque([(r, c)])
        while queue:                #@while
            i, j = queue.popleft()  #@pop
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                x, y = i + di, j + dj   # 4 neighbours
                if (0 <= x < rows and 0 <= y < cols  #@check
                        and grid[x][y] == '1'):  #@check2
                    # land in the same island: mark and queue
                    grid[x][y] = '#'  #@mark
                    queue.append((x, y))  #@push

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':   # land not seen yet  #@scan
                count += 1          # a new island  #@count
                bfs(r, c)           # mark all of it  #@call2
    return count                    #@done

${GRID_PY}
`;

  function traceIslandsBFS() {
    const s = islandState();
    const t = DSA.tracer();
    let count, r, c, i, j, x, y;
    const step = (line, msg) => t.step(line, msg, {
      view: s.view(),
      vars: vars({ count, r, c, i, j, x, y }),
      aux: [{ label: 'queue', kind: 'queue', items: s.queue.map(([a, b]) => cellStr(a, b)) }],
    });
    step('callg', "Call `num_islands(grid)`. `'1'` is land, `'0'` is water. Islands connect up, down, left and right.");
    count = 0;
    step('init', `rows = ${s.rows}, cols = ${s.cols}, count = 0.`);
    for (r = 0; r < s.rows; r++) {
      for (c = 0; c < s.cols; c++) {
        s.cursor = [r, c]; s.cur = null; s.probe = [r, c];
        const v = s.grid[r][c];
        if (v !== '1') {
          step('scan', `grid[${r}][${c}] is '${v}': ${v === '0' ? 'water' : 'already marked as part of an island'}. Skip.`);
          continue;
        }
        s.probe = [r, c];
        step('scan', `grid[${r}][${c}] is '1': unseen land, so a new island starts here.`);
        count++;
        step('count', `count = ${count}. Now mark the whole island so none of it is counted again.`);
        s.probe = null;
        s.grid[r][c] = '#'; s.island.add(r + ',' + c); s.queue = [[r, c]];
        step('seed', `\`bfs(${r}, ${c})\`: set the cell to '#' (visited) and queue it.`);
        for (;;) {
          i = j = x = y = undefined;
          if (!s.queue.length) break;
          [i, j] = s.queue.shift(); s.cur = [i, j];
          step('pop', `Pop ${cellStr(i, j)}. Check its 4 neighbours: down, up, right, left.`);
          for (const [di, dj, name] of DIRS) {
            x = i + di; y = j + dj; s.probe = [x, y];
            const inb = x >= 0 && x < s.rows && y >= 0 && y < s.cols;
            if (!inb) { step(['check', 'check2'], `${name}: ${cellStr(x, y)} is off the grid.`); continue; }
            const g = s.grid[x][y];
            if (g !== '1') { step(['check', 'check2'], `${name}: ${cellStr(x, y)} is '${g}': ${g === '0' ? 'water' : 'already marked'}.`); continue; }
            step(['check', 'check2'], `${name}: ${cellStr(x, y)} is '1': land touching this island.`);
            s.grid[x][y] = '#'; s.island.add(x + ',' + y); s.queue.push([x, y]); s.probe = null;
            step(['mark', 'push'], `Mark ${cellStr(x, y)} '#' and queue it.`);
          }
          s.probe = null;
        }
        s.cur = null;
        step('while', `Queue empty: island ${count} is fully marked (${s.island.size} cell${s.island.size > 1 ? 's' : ''}).`);
        s.island.forEach((k) => s.done.add(k)); s.island.clear();
        step('call2', `\`bfs\` returns. Continue scanning from ${cellStr(r, c)}.`);
      }
    }
    s.cursor = null; r = c = undefined;
    t.step('done', `Scanned every cell. Return ${count}: each island was counted once, at its first cell.`, {
      view: s.view(), vars: { count, return: count },
    });
    return t.frames;
  }

  const ISL_DFS = `
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])

    def dfs(i, j):
        if not (0 <= i < rows and 0 <= j < cols):  #@oob
            return                  # off the grid
        if grid[i][j] != '1':       #@water
            return                  # water or already seen
        grid[i][j] = '#'            # mark visited in place  #@mark
        dfs(i + 1, j)               # down
        dfs(i - 1, j)               # up
        dfs(i, j + 1)               # right
        dfs(i, j - 1)               # left

    count = 0                       #@init
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':   # land not seen yet  #@scan
                count += 1          # a new island  #@count
                dfs(r, c)           # sink all of it  #@call2
    return count                    #@done

${GRID_PY}
`;

  function traceIslandsDFS() {
    const s = islandState();
    const t = DSA.tracer();
    let count, r, c;
    const calls = [];
    const step = (line, msg, extra) => {
      const top = calls[calls.length - 1];
      // calls that got past the checks: deepest one is current, the rest wait
      const land = calls.filter((x) => x[2]);
      s.onStack = land.slice(0, -1);
      s.cur = land.length ? land[land.length - 1] : null;
      t.step(line, msg, {
        view: s.view(),
        vars: vars(Object.assign({ count, r, c }, top ? { i: top[0], j: top[1] } : {}, extra || {})),
        aux: [{ label: 'call stack', kind: 'stack', items: calls.map(([a, b], k) => ({ v: `dfs(${a}, ${b})`, s: k === calls.length - 1 ? 'active' : null })) }],
      });
    };
    const dfs = (i, j, name) => {
      calls.push([i, j, false]);
      const pre = name ? `${name}: ` : '';
      if (!(i >= 0 && i < s.rows && j >= 0 && j < s.cols)) {
        s.probe = null;
        step('oob', `${pre}\`dfs(${i}, ${j})\` is off the grid. Return.`);
        calls.pop(); return;
      }
      const g = s.grid[i][j];
      if (g !== '1') {
        s.probe = [i, j];
        step('water', `${pre}\`dfs(${i}, ${j})\` finds '${g}' (${g === '0' ? 'water' : 'already marked'}). Return.`);
        s.probe = null;
        calls.pop(); return;
      }
      s.grid[i][j] = '#'; s.island.add(i + ',' + j); s.probe = null;
      calls[calls.length - 1][2] = true;
      step('mark', `${pre}\`dfs(${i}, ${j})\` is land. Mark it '#', then try down, up, right, left.`);
      for (const [di, dj, nm] of DIRS) {
        dfs(i + di, j + dj, nm);
      }
      calls.pop();
    };
    step('callg', "Call `num_islands(grid)`. `'1'` is land, `'0'` is water. Islands connect up, down, left and right.");
    count = 0;
    step('init', 'count = 0. Scan the grid row by row.');
    for (r = 0; r < s.rows; r++) {
      for (c = 0; c < s.cols; c++) {
        s.cursor = [r, c]; s.cur = null; s.probe = [r, c];
        const v = s.grid[r][c];
        if (v !== '1') {
          step('scan', `grid[${r}][${c}] is '${v}': ${v === '0' ? 'water' : 'already part of a counted island'}. Skip.`);
          continue;
        }
        s.probe = [r, c];
        step('scan', `grid[${r}][${c}] is '1': unseen land, a new island.`);
        count++;
        step('count', `count = ${count}. Now sink the whole island with DFS.`);
        s.probe = null;
        dfs(r, c, null);
        s.cur = null; s.onStack = [];
        s.island.forEach((k) => s.done.add(k));
        const n = s.island.size; s.island.clear();
        step('call2', `\`dfs(${r}, ${c})\` returned: island ${count} is fully marked (${n} cell${n > 1 ? 's' : ''}).`);
      }
    }
    s.cursor = null; r = c = undefined;
    t.step('done', `Return ${count}. Every cell is visited at most twice (scan + DFS), so O(rows × cols).`, {
      view: s.view(), vars: { count, return: count },
    });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'grid-islands',
    title: 'Flood Fill / Number of Islands',
    category: 'Graphs',
    order: 3,
    tags: ['flood fill', 'islands', 'grid', 'matrix', 'connected components', 'bfs', 'dfs'],
    summary: 'Treat a grid as a graph: each cell links to its 4 neighbours. Scan every cell; each unseen `\'1\'` starts a new island, then BFS or DFS marks all land connected to it.',
    complexity: { time: 'O(rows · cols)', space: 'O(rows · cols)', note: 'Worst case the queue or recursion holds the whole grid.' },
    notes: [
      'Counting islands = counting connected components in a grid.',
      'Mark cells when you first reach them (set to `\'#\'` or `\'0\'`), or keep a `seen` set if you must not change the input.',
      'Check bounds first, then the value: `0 <= x < rows and 0 <= y < cols and grid[x][y] == \'1\'`.',
      'For 8-direction problems add the 4 diagonals to the neighbour list.',
    ],
    tips: [
      'Recursive DFS can hit the recursion limit on a 1000 × 1000 grid; BFS with a deque is safer.',
      'Flood Fill (733) is the same code with a colour check instead of `\'1\'`.',
    ],
    problems: ['200. Number of Islands', '733. Flood Fill', '695. Max Area of Island', '463. Island Perimeter', '130. Surrounded Regions', '417. Pacific Atlantic Water Flow'],
    legend: { visited: 'Current island', done: 'Counted island', frontier: 'Waiting', compare: 'Checking' },
    variants: [
      {
        id: 'bfs',
        label: 'BFS',
        file: 'islands_bfs',
        summary: 'Scan every cell; each unseen `\'1\'` starts a new island. BFS from it with a deque, marking each land cell `\'#\'` when it is queued, until the whole island is marked.',
        code: ISL_BFS,
        trace: traceIslandsBFS,
      },
      {
        id: 'dfs',
        label: 'DFS',
        file: 'islands_dfs',
        summary: 'Scan every cell; each unseen `\'1\'` starts a new island. A recursive `dfs(i, j)` returns on water or off-grid cells, otherwise marks the cell and recurses in 4 directions.',
        complexity: { time: 'O(rows · cols)', space: 'O(rows · cols)', note: 'Space is the recursion depth; a snake-shaped island can make it the whole grid.' },
        code: ISL_DFS,
        trace: traceIslandsDFS,
      },
    ],
  });

  /* ================= Topological sort ================= */

  const KAHN = `
from collections import deque

def topo_sort(graph):
    indeg = {u: 0 for u in graph}   #@indeg0
    for u in graph:
        for v in graph[u]:
            indeg[v] += 1           # one more prerequisite  #@count
    # nodes with no prerequisites can go first
    queue = deque(u for u in graph if indeg[u] == 0)  #@queue
    order = []
    while queue:                    #@loop
        u = queue.popleft()         #@pop
        order.append(u)             #@out
        for v in graph[u]:
            indeg[v] -= 1           # u is done: drop u -> v  #@dec
            if indeg[v] == 0:       # all prerequisites done  #@zero
                queue.append(v)     #@push
    # fewer than n nodes out: a cycle blocked the rest
    if len(order) < len(graph):     #@len
        return []
    return order                    #@done

${pyGraph(GD.adj)}
topo_sort(graph)   # ['A', 'B', 'C', 'D', 'E', 'F']  #@call
`;

  function traceKahn() {
    const g = GD, adj = g.adj, nodes = Object.keys(adj);
    const t = DSA.tracer();
    const indeg = {}, queue = [], order = [], gone = {};
    let u, v, act = null;
    const step = (line, msg) => {
      const ns = {};
      queue.forEach((x) => (ns[x] = 'frontier'));
      order.forEach((x) => (ns[x] = 'done'));
      if (u) ns[u] = 'active';
      if (v && act) ns[v] = ns[v] || 'compare';
      const es = Object.assign({}, gone);
      if (act) es[act] = 'active';
      t.step(line, msg, {
        view: gview(g, { ns, es, badges: Object.assign({}, indeg), ptr: ptrs([[u, 'u'], [v, 'v']]) }),
        vars: vars({ u, v, indeg: Object.keys(indeg).length ? Object.assign({}, indeg) : undefined, order: order.slice() }),
        aux: [{ label: 'queue', kind: 'queue', items: queue.slice() }, { label: 'order', kind: 'list', items: order.slice() }],
      });
    };
    step('call', 'Call `topo_sort(graph)`. An edge `u -> v` means "u must come before v" (like a course prerequisite).');
    nodes.forEach((x) => (indeg[x] = 0));
    step('indeg0', 'Every node starts with in-degree 0. The badges show `indeg`.');
    for (const a of nodes) {
      for (const b of adj[a]) {
        act = ek(g, a, b); indeg[b]++;
        step('count', `Edge ${a} → ${b}: \`indeg['${b}']\` becomes ${indeg[b]}.`);
      }
    }
    act = null;
    nodes.forEach((x) => { if (indeg[x] === 0) queue.push(x); });
    step('queue', `${list(queue)} have in-degree 0: nothing must come before them. Queue them.`);
    for (;;) {
      u = undefined; v = undefined;
      step('loop', queue.length ? `Queue: ${list(queue)}.` : 'Queue is empty.');
      if (!queue.length) break;
      u = queue.shift(); order.push(u);
      step(['pop', 'out'], `Pop ${q(u)} and add it to \`order\`. Everything it depends on is already placed.`);
      for (const b of adj[u]) {
        v = b; act = ek(g, u, b); indeg[b]--;
        const z = indeg[b] === 0;
        step(['dec', 'zero'], `Remove edge ${u} → ${b}: \`indeg['${b}']\` = ${indeg[b]}. ${z ? 'Zero, so it is ready.' : 'Still waiting on another node.'}`);
        gone[act] = 'dim';
        if (z) {
          queue.push(b); act = null;
          step('push', `Queue ${q(b)}.`);
        }
      }
      act = null; v = undefined;
    }
    step('len', `\`len(order)\` = ${order.length} = number of nodes, so there is no cycle.`);
    t.step('done', `Return ${list(order)}. Every edge points from left to right in this order.`, {
      view: gview(g, { ns: Object.fromEntries(nodes.map((x) => [x, 'done'])), badges: Object.fromEntries(order.map((x, k) => [x, '#' + (k + 1)])) }),
      vars: { order: order.slice(), return: order.slice() },
      aux: [{ label: 'order', kind: 'list', items: order.slice() }],
    });
    return t.frames;
  }

  const TOPO_DFS = `
def topo_sort(graph):
    visited, post = set(), []       #@init

    def dfs(u):
        visited.add(u)              #@mark
        for v in graph[u]:
            if v not in visited:    #@check
                dfs(v)              #@recurse
        post.append(u)              # after all it points to  #@post

    for u in graph:                 # cover every component  #@outer
        if u not in visited:
            dfs(u)                  #@call2
    return post[::-1]               # reverse post-order  #@done

${pyGraph(GD.adj)}
topo_sort(graph)   # ['B', 'D', 'A', 'C', 'E', 'F']  #@call
`;

  function traceTopoDFS() {
    const g = GD, adj = g.adj, nodes = Object.keys(adj);
    const t = DSA.tracer();
    const visited = new Set(), post = [], stack = [], tree = {};
    let v, act = null, outerU;
    const step = (line, msg) => {
      const ns = {};
      visited.forEach((x) => (ns[x] = post.includes(x) ? 'done' : 'frontier'));
      const u = stack[stack.length - 1];
      if (u) ns[u] = 'active';
      const es = Object.assign({}, tree);
      if (act) es[act] = 'active';
      t.step(line, msg, {
        view: gview(g, { ns, es, ptr: ptrs([[u || outerU, 'u'], [v, 'v']]) }),
        vars: vars({ u: u || outerU, v, post: post.slice() }),
        aux: [
          { label: 'call stack', kind: 'stack', items: stack.map((x, i) => ({ v: `dfs('${x}')`, s: i === stack.length - 1 ? 'active' : null })) },
          { label: 'post', kind: 'list', items: post.slice() },
        ],
      });
    };
    const dfs = (u) => {
      stack.push(u); v = undefined; act = null;
      visited.add(u);
      step('mark', `Enter \`dfs('${u}')\`: mark ${q(u)} visited.`);
      for (const b of adj[u]) {
        v = b; act = ek(g, u, b);
        if (visited.has(b)) step('check', `${q(b)} is already visited. ${post.includes(b) ? 'It is already in `post`.' : ''}`);
        else {
          tree[act] = 'tree';
          step(['check', 'recurse'], `${q(b)} is not visited: \`dfs('${b}')\`.`);
          dfs(b);
          v = b; act = null;
        }
      }
      v = undefined; act = null;
      post.push(u);
      step('post', `All of ${q(u)}'s successors are finished, so append ${q(u)}: post = ${list(post)}.`);
      stack.pop();
    };
    step('call', 'Call `topo_sort(graph)`. Idea: a node is finished only after everything it points to, so reversed finish order is a valid order.');
    step('init', 'Empty `visited` set and `post` list.');
    for (const u of nodes) {
      outerU = u;
      if (visited.has(u)) { step('outer', `${q(u)} is already visited, skip.`); continue; }
      step('outer', `${q(u)} is not visited yet.`);
      step('call2', `Start \`dfs('${u}')\`.`);
      dfs(u);
    }
    outerU = undefined;
    const res = post.slice().reverse();
    t.step('done', `\`post\` = ${list(post)}. Reversed: ${list(res)}. Every edge points left to right.`, {
      view: gview(g, { ns: Object.fromEntries(nodes.map((x) => [x, 'done'])), es: tree, badges: Object.fromEntries(res.map((x, k) => [x, '#' + (k + 1)])) }),
      vars: { post: post.slice(), return: res },
      aux: [{ label: 'post', kind: 'list', items: post.slice() }, { label: 'result', kind: 'list', items: res }],
    });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'topological-sort',
    title: 'Topological Sort',
    category: 'Graphs',
    order: 4,
    tags: ['topo', 'kahn', 'dag', 'in-degree', 'course schedule', 'dependencies', 'ordering'],
    summary: 'Order the nodes of a directed acyclic graph (DAG) so every edge `u -> v` has `u` before `v`. Used for build orders, course schedules and task dependencies.',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    notes: [
      'Only DAGs have a topological order. Many orders can be valid.',
      'Kahn: if `len(order) < n` at the end, the leftover nodes are on a cycle.',
      'DFS: a node goes into `post` only after all its descendants, so `post[::-1]` is a valid order.',
      'DFS alone does not detect cycles; add the gray/black colouring (see Cycle Detection).',
    ],
    tips: [
      'Course Schedule: build `graph[pre].append(course)`, then Kahn. Answer is `len(order) == numCourses`.',
      'Need the smallest order lexicographically? Use a min-heap instead of the deque in Kahn.',
    ],
    problems: ['207. Course Schedule', '210. Course Schedule II', '269. Alien Dictionary', '310. Minimum Height Trees', '1203. Sort Items by Groups Respecting Dependencies'],
    variants: [
      {
        id: 'kahn',
        label: 'Kahn (BFS)',
        file: 'topo_kahn',
        summary: 'Count incoming edges (in-degree). Nodes with in-degree 0 are ready: queue them, output one, and "remove" its edges. Any node that drops to 0 becomes ready. Output shorter than n means a cycle.',
        legend: { frontier: 'Ready (in queue)', done: 'Output', dim: 'Removed edge' },
        code: KAHN,
        trace: traceKahn,
      },
      {
        id: 'dfs',
        label: 'DFS post-order',
        file: 'topo_dfs',
        summary: 'Run DFS from every unvisited node. Append a node to `post` when all its successors are finished. Reversed `post` is a topological order.',
        complexity: { time: 'O(V + E)', space: 'O(V)', note: 'Space is the recursion depth plus the visited set.' },
        legend: { frontier: 'On call stack', done: 'Finished' },
        code: TOPO_DFS,
        trace: traceTopoDFS,
      },
    ],
  });

  /* ================= Dijkstra ================= */

  const DIJ = `
import heapq

def dijkstra(graph, src):
    dist = {u: float('inf') for u in graph}  #@init
    dist[src] = 0                   #@init2
    heap = [(0, src)]               # (distance, node)  #@heap
    while heap:                     #@loop
        d, u = heapq.heappop(heap)  # closest first  #@pop
        if d > dist[u]:             # stale entry: skip  #@stale
            continue
        for v, w in graph[u]:
            nd = d + w              # path through u  #@nd
            if nd < dist[v]:        # shorter: update  #@cmp
                dist[v] = nd        #@relax
                heapq.heappush(heap, (nd, v))  #@push
    return dist                     #@done

${pyGraph(GW.adj)}
dijkstra(graph, 'A')
# {'A': 0, 'B': 3, 'C': 2, 'D': 8, 'E': 10, 'F': 13}  #@call
`;

  function traceDijkstra() {
    const g = GW, adj = g.adj, nodes = Object.keys(adj), src = 'A';
    const t = DSA.tracer();
    const dist = {}, heap = [], settled = new Set(), par = {};
    let d, u, v, w, nd, act = null, kvS = {}, stale = false;
    const step = (line, msg) => {
      const ns = {};
      heap.forEach(([, x]) => { if (!settled.has(x)) ns[x] = 'frontier'; });
      settled.forEach((x) => (ns[x] = 'visited'));
      if (v && act) ns[v] = 'compare';
      if (u) ns[u] = stale ? 'bad' : 'active';
      const es = {};
      Object.keys(par).forEach((x) => (es[ek(g, par[x], x)] = 'tree'));
      if (act) es[act] = 'active';
      t.step(line, msg, {
        views: [
          gview(g, { ns, es, badges: infMap(dist), ptr: ptrs([[u, 'u'], [v, 'v']]) }),
          { type: 'kv', title: 'dist', entries: nodes.filter((x) => x in dist).map((x) => [x, inf(dist[x])]), states: kvS },
        ],
        vars: vars({ src, d, u, v, w, nd }),
        aux: [heapAux(heap)],
      });
    };
    step('call', 'Call `dijkstra(graph, \'A\')`. Each neighbour comes as `(node, weight)`. All weights must be ≥ 0.');
    nodes.forEach((x) => (dist[x] = Infinity)); dist[src] = 0; heap.push([0, src]); kvS = { [src]: 'new' };
    step(['init', 'init2', 'heap'], `Every distance starts at inf, except \`dist['${src}'] = 0\`. The heap holds \`(distance, node)\` pairs, smallest first.`);
    for (;;) {
      kvS = {}; u = undefined; d = undefined; stale = false;
      step('loop', heap.length ? `Heap has ${heap.length} entr${heap.length > 1 ? 'ies' : 'y'}. The smallest is on top.` : 'Heap is empty: every reachable node is settled.');
      if (!heap.length) break;
      [d, u] = hpop(heap);
      if (d > dist[u]) {
        stale = true;
        step(['pop', 'stale'], `Pop ${tup(d, u)}. But \`dist['${u}']\` is already ${dist[u]} < ${d}: this is an old entry. Skip it.`);
        continue;
      }
      settled.add(u); kvS = { [u]: 'visited' };
      step(['pop', 'stale'], `Pop ${tup(d, u)}: the closest unsettled node. ${d} == \`dist['${u}']\`, so ${q(u)} is final.`);
      for (const [b, wt] of adj[u]) {
        v = b; w = wt; nd = d + wt; act = ek(g, u, b); kvS = { [b]: 'compare' };
        const better = nd < dist[b];
        step(['nd', 'cmp'], `Edge ${u}–${b} (w=${wt}): nd = ${d} + ${wt} = ${nd}. ${better ? `${nd} < ${f(dist[b])}: shorter!` : `Not less than ${f(dist[b])}, no change.`}`);
        if (better) {
          dist[b] = nd; par[b] = u; hpush(heap, [nd, b]); kvS = { [b]: 'new' };
          step(['relax', 'push'], `\`dist['${b}'] = ${nd}\` and push ${tup(nd, b)}. Any older entry for ${q(b)} stays in the heap and is skipped later.`);
        }
      }
      v = w = nd = undefined; act = null;
    }
    const es = {};
    Object.keys(par).forEach((x) => (es[ek(g, par[x], x)] = 'tree'));
    t.step('done', `Return \`dist\`. The dark edges form the shortest-path tree from ${q(src)}.`, {
      views: [
        gview(g, { ns: Object.fromEntries(nodes.map((x) => [x, 'visited'])), es, badges: infMap(dist) }),
        { type: 'kv', title: 'dist', entries: nodes.map((x) => [x, inf(dist[x])]), states: {} },
      ],
      vars: { src, return: Object.assign({}, dist) },
      aux: [heapAux(heap)],
    });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'dijkstra',
    title: "Dijkstra's Algorithm",
    category: 'Graphs',
    order: 5,
    tags: ['shortest path', 'heapq', 'priority queue', 'weighted', 'greedy', 'sssp'],
    summary: 'Shortest distances from one source in a graph with **non-negative** weights. Always expand the closest unsettled node, taken from a min-heap of `(distance, node)`.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)', note: 'With lazy deletion the heap can hold up to E entries.' },
    notes: [
      'Python has no decrease-key. Push a new `(dist, node)` and skip stale entries with `if d > dist[u]: continue`.',
      'Once a node is popped with its current distance it is final: no later path can be shorter (weights ≥ 0).',
      'Negative edges break it; use Bellman-Ford instead.',
      'Keep a `parent` dict (set it when you relax) to rebuild the actual path.',
    ],
    tips: [
      'Tuples compare element by element, so `(dist, node)` sorts by distance first.',
      'Only need one target? You can `return d` as soon as you pop it.',
      'Unweighted graph? Plain BFS is simpler and O(V + E).',
    ],
    problems: ['743. Network Delay Time', '1514. Path with Maximum Probability', '1631. Path With Minimum Effort', '787. Cheapest Flights Within K Stops', '1976. Number of Ways to Arrive at Destination'],
    legend: { frontier: 'In heap', visited: 'Settled', compare: 'Relaxing', bad: 'Stale entry', min: 'Heap top', tree: 'Best path edge', new: 'Updated' },
    code: DIJ,
    trace: traceDijkstra,
  });

  /* ================= Bellman-Ford ================= */

  const BF = `
def bellman_ford(graph, src):
    dist = {u: float('inf') for u in graph}  #@init
    dist[src] = 0                   #@init2
    # a shortest path has at most V-1 edges
    for i in range(len(graph) - 1):  #@round
        for u in graph:
            for v, w in graph[u]:   # every edge u -> v
                if dist[u] + w < dist[v]:  #@cmp
                    dist[v] = dist[u] + w  # relax  #@relax
    # one more pass: still improving = negative cycle
    for u in graph:
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:  #@neg
                return None         # negative cycle
    return dist                     #@done

${pyGraph(GBF.adj)}
bellman_ford(graph, 'S')
# {'S': 0, 'A': 1, 'B': 4, 'C': 3, 'D': 4}  #@call
`;

  function traceBF() {
    const g = GBF, adj = g.adj, nodes = Object.keys(adj), src = 'S';
    const t = DSA.tracer();
    const dist = {}, par = {};
    let i, u, v, w, act = null, kvS = {}, edgeS = 'active';
    const step = (line, msg) => {
      const ns = {};
      nodes.forEach((x) => { if (dist[x] !== undefined && dist[x] !== Infinity) ns[x] = 'visited'; });
      if (v) ns[v] = 'compare';
      if (u) ns[u] = 'active';
      const es = {};
      Object.keys(par).forEach((x) => (es[ek(g, par[x], x)] = 'tree'));
      if (act) es[act] = edgeS;
      t.step(line, msg, {
        views: [
          gview(g, { ns, es, badges: infMap(dist), ptr: ptrs([[u, 'u'], [v, 'v']]) }),
          { type: 'kv', title: 'dist', entries: nodes.filter((x) => x in dist).map((x) => [x, inf(dist[x])]), states: kvS },
        ],
        vars: vars({ src, i, u, v, w }),
      });
    };
    step('call', 'Call `bellman_ford(graph, \'S\')`. Directed graph, and edge B → A has weight -3. Dijkstra would not handle that.');
    nodes.forEach((x) => (dist[x] = Infinity)); dist[src] = 0; kvS = { [src]: 'new' };
    step(['init', 'init2'], `All distances inf, \`dist['${src}'] = 0\`.`);
    for (i = 0; i < nodes.length - 1; i++) {
      let changed = 0;
      u = v = w = undefined; act = null; kvS = {};
      step('round', `Round i = ${i} of ${nodes.length - 1}. Relax every edge once. After round i, paths of up to i + 1 edges are correct.`);
      for (const a of nodes) {
        for (const [b, wt] of adj[a]) {
          u = a; v = b; w = wt; act = ek(g, a, b); edgeS = 'active'; kvS = { [b]: 'compare' };
          const cand = dist[a] + wt;
          const better = cand < dist[b];
          let msg;
          if (dist[a] === Infinity) msg = `${a} → ${b}: \`dist['${a}']\` is inf, nothing to offer yet.`;
          else msg = `${a} → ${b} (w=${wt}): ${dist[a]} + ${wt} = ${cand}. ${better ? `Less than ${f(dist[b])}.` : `Not less than ${f(dist[b])}.`}`;
          step('cmp', msg);
          if (better) {
            dist[b] = cand; par[b] = a; changed++; kvS = { [b]: 'new' };
            step('relax', `Relax: \`dist['${b}'] = ${cand}\`.`);
          }
        }
      }
      if (!changed) {
        u = v = w = undefined; act = null; kvS = {};
        step('round', `Nothing changed in round ${i}, so later rounds will not change anything either (real code can \`break\` here).`);
      }
    }
    i = undefined;
    for (const a of nodes) {
      for (const [b, wt] of adj[a]) {
        u = a; v = b; w = wt; act = ek(g, a, b); edgeS = 'active'; kvS = {};
        step('neg', `Check ${a} → ${b}: ${dist[a]} + ${wt} = ${dist[a] + wt} ≥ ${dist[b]}. No improvement.`);
      }
    }
    u = v = w = undefined; act = null;
    step('done', `No edge can still improve, so there is no negative cycle. Return \`dist\`.`);
    t.frames[t.frames.length - 1].vars.return = Object.assign({}, dist);
    return t.frames;
  }

  DSA.addAlgo({
    id: 'bellman-ford',
    title: 'Bellman-Ford',
    category: 'Graphs',
    order: 6,
    tags: ['shortest path', 'negative weights', 'negative cycle', 'relaxation', 'sssp', 'dp'],
    summary: 'Shortest distances from one source when edges can be **negative**. Relax every edge V-1 times; if an edge can still be relaxed after that, there is a negative cycle.',
    complexity: { time: 'O(V · E)', space: 'O(V)' },
    notes: [
      'A shortest path without cycles uses at most V-1 edges, so V-1 rounds are enough.',
      'Edge order changes how fast it converges, not the answer.',
      'Stop early if a whole round changes nothing.',
      'Negative cycle reachable from the source means "shortest distance" is undefined (-∞).',
    ],
    tips: [
      '"At most k stops" (LeetCode 787): run k+1 rounds and relax from a **copy** of last round\'s `dist`, so one round adds at most one edge.',
      'All weights non-negative? Dijkstra is much faster.',
    ],
    problems: ['787. Cheapest Flights Within K Stops', '743. Network Delay Time', '1334. Find the City With the Smallest Number of Neighbors'],
    legend: { visited: 'Reached', compare: 'Relaxing', tree: 'Best path edge', new: 'Updated' },
    code: BF,
    trace: traceBF,
  });

  /* ================= Floyd-Warshall ================= */

  const FW = `
def floyd_warshall(graph):
    nodes = list(graph)
    idx = {u: i for i, u in enumerate(nodes)}
    n, INF = len(nodes), float('inf')
    dist = [[INF] * n for _ in range(n)]
    for u in graph:
        dist[idx[u]][idx[u]] = 0    # zero to itself
        for v, w in graph[u]:
            dist[idx[u]][idx[v]] = w  # direct edge  #@build
    # allow k as a stop on the way from i to j
    for k in range(n):              #@k
        for i in range(n):
            for j in range(n):
                through_k = dist[i][k] + dist[k][j]  #@via
                if through_k < dist[i][j]:  #@cmp
                    dist[i][j] = through_k  #@relax
    return dist                     #@done

${pyGraph(GFW.adj)}
floyd_warshall(graph)   # all-pairs distances  #@call
`;

  function traceFW() {
    const g = GFW, adj = g.adj, nodes = Object.keys(adj), n = nodes.length;
    const t = DSA.tracer();
    const dist = nodes.map(() => nodes.map(() => Infinity));
    let k, i, j, via, relaxed = false;
    const step = (line, msg, showMatrix) => {
      const st = {};
      if (k != null) {
        for (let x = 0; x < n; x++) { st[k + ',' + x] = 'read'; st[x + ',' + k] = 'read'; }
      }
      if (i != null && j != null) {
        st[i + ',' + k] = 'compare'; st[k + ',' + j] = 'compare';
        st[i + ',' + j] = relaxed ? 'new' : 'active';
        st['r' + i] = 'active'; st['c' + j] = 'active';
      }
      const ns = {};
      if (j != null) ns[nodes[j]] = 'compare';
      if (k != null) ns[nodes[k]] = 'pivot';
      if (i != null) ns[nodes[i]] = 'active';
      const views = [gview(g, { ns, ptr: ptrs([[i != null ? nodes[i] : null, 'i'], [k != null ? nodes[k] : null, 'k'], [j != null ? nodes[j] : null, 'j']]) })];
      if (showMatrix !== false) views.push({ type: 'grid', title: 'dist[i][j]  (row i = from, col j = to)', cells: dist.map((r) => r.map(inf)), rowLabels: nodes, colLabels: nodes, states: st });
      t.step(line, msg, { views, vars: vars({ n, k, i, j, through_k: via === Infinity ? { raw: 'inf' } : via }) });
    };
    step('call', 'Call `floyd_warshall(graph)`: shortest distance between **every** pair of nodes.', false);
    nodes.forEach((u, a) => {
      dist[a][a] = 0;
      adj[u].forEach(([v, w]) => (dist[a][nodes.indexOf(v)] = w));
    });
    step('build', 'Start with direct edges only: 0 on the diagonal, the edge weight where an edge exists, inf elsewhere.');
    for (k = 0; k < n; k++) {
      i = j = via = undefined;
      step('k', `k = ${k} (${nodes[k]}): from now on paths may also go through ${nodes[k]}. Row and column ${nodes[k]} are shaded.`);
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          via = dist[i][k] + dist[k][j]; relaxed = false;
          const cur = dist[i][j];
          const ni = nodes[i], nk = nodes[k], nj = nodes[j];
          let msg = `${ni} → ${nk} → ${nj}: ${f(dist[i][k])} + ${f(dist[k][j])} = ${f(via)}. `;
          if (via < cur) msg += `Beats ${f(cur)}!`;
          else if (i === k || j === k) msg += `${ni === nk ? ni : nj} is k itself, so nothing changes.`;
          else msg += `Not better than ${f(cur)}.`;
          step(['via', 'cmp'], msg);
          if (via < cur) {
            dist[i][j] = via; relaxed = true;
            step('relax', `\`dist[${ni}][${nj}] = ${via}\` (was ${f(cur)}), going via ${nk}.`);
            relaxed = false;
          }
        }
      }
    }
    k = i = j = via = undefined;
    step('done', 'Return `dist`. Row i, column j is the shortest distance from i to j.');
    t.frames[t.frames.length - 1].vars.return = { raw: '[' + dist.map((r) => list(r)).join(', ') + ']' };
    return t.frames;
  }

  DSA.addAlgo({
    id: 'floyd-warshall',
    title: 'Floyd-Warshall',
    category: 'Graphs',
    order: 7,
    tags: ['all pairs shortest path', 'apsp', 'dp', 'matrix', 'transitive closure'],
    summary: 'Shortest distance between **all pairs** of nodes. Dynamic programming: for each node `k`, check if going through `k` shortens the path from `i` to `j`.',
    complexity: { time: 'O(V³)', space: 'O(V²)' },
    notes: [
      '`k` must be the **outer** loop. After step k, `dist[i][j]` is the best path using only nodes 0..k as stops.',
      'Handles negative edges. A negative number on the diagonal (`dist[i][i] < 0`) means a negative cycle.',
      'Good for small V (a few hundred). For one source use Dijkstra or Bellman-Ford.',
      'Swap `+`/`min` for `and`/`or` to get reachability (transitive closure).',
    ],
    tips: [
      '`float(\'inf\') + 5` is still `inf`, so no special case is needed for missing edges.',
      'Build `dist` with a list comprehension, not `[[INF] * n] * n` (that copies the same row n times).',
    ],
    problems: ['1334. Find the City With the Smallest Number of Neighbors', '399. Evaluate Division', '1462. Course Schedule IV', '2976. Minimum Cost to Convert String I'],
    legend: { pivot: 'k (via)', active: 'i / dist[i][j]', compare: 'j / dist[i][k], dist[k][j]', read: 'Row / column k', new: 'Updated' },
    code: FW,
    trace: traceFW,
  });

  /* ================= Minimum spanning tree ================= */

  const KRUSKAL = `
def kruskal(graph):
    parent = {u: u for u in graph}  # every node alone  #@init

    def find(x):                    # root of x's set
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x

    # each undirected edge once, cheapest first
    edges = sorted((w, u, v) for u in graph  #@sort
                   for v, w in graph[u] if u < v)  #@sort2
    mst, total = [], 0
    for w, u, v in edges:           #@for
        ru, rv = find(u), find(v)   #@find
        if ru == rv:                # same tree: a cycle  #@same
            continue
        parent[ru] = rv             # union the two sets  #@union
        mst.append((u, v, w))       #@take
        total += w
        if len(mst) == len(graph) - 1:  #@full
            break                   # V-1 edges: done
    return mst, total               #@done

${pyGraph(GW.adj)}
kruskal(graph)   # 5 edges, total 13  #@call
`;

  function traceKruskal() {
    const g = GW, adj = g.adj, nodes = Object.keys(adj);
    const t = DSA.tracer();
    const parent = {};
    const edges = [];
    nodes.forEach((a) => adj[a].forEach(([b, w]) => { if (a < b) edges.push([w, a, b]); }));
    edges.sort((x, y) => (lt(x, y) ? -1 : lt(y, x) ? 1 : 0));
    const est = {}; // edge index -> state
    const mst = [];
    let total, w, u, v, ru, rv, cur = -1, kvS = {}, sorted = false;
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const step = (line, msg) => {
      const ns = {}, es = {};
      mst.forEach(([a, b]) => { ns[a] = 'visited'; ns[b] = 'visited'; es[ek(g, a, b)] = 'tree'; });
      Object.keys(est).forEach((k) => { if (est[k] === 'bad') es[ek(g, edges[k][1], edges[k][2])] = 'bad'; });
      if (cur >= 0 && !est[cur]) { const [, a, b] = edges[cur]; es[ek(g, a, b)] = 'active'; ns[a] = 'active'; ns[b] = 'active'; }
      const aux = [];
      if (sorted) aux.push({ label: 'edges', kind: 'list', items: edges.map((e, k) => ({ v: tup(...e), s: est[k] === 'tree' ? 'tree' : est[k] === 'bad' ? 'bad' : k === cur ? 'active' : k < cur ? null : null })) });
      aux.push({ label: 'mst', kind: 'list', items: mst.map((e) => tup(...e)) });
      t.step(line, msg, {
        views: [
          gview(g, { ns, es }),
          { type: 'kv', title: 'parent (union-find)', entries: nodes.filter((x) => x in parent).map((x) => [x, parent[x]]), states: kvS },
        ],
        vars: vars({ w, u, v, ru, rv, total }),
        aux,
      });
    };
    step('call', 'Call `kruskal(graph)`. Goal: connect all nodes with the cheapest set of edges (no cycles).');
    nodes.forEach((x) => (parent[x] = x));
    step('init', 'Union-find: each node starts in its own set (`parent[x] = x`).');
    sorted = true;
    step(['sort', 'sort2'], `Take each edge once (\`u < v\`) as \`(w, u, v)\` and sort: cheapest first. ${edges.length} edges.`);
    total = 0;
    for (cur = 0; cur < edges.length; cur++) {
      [w, u, v] = edges[cur]; ru = rv = undefined; kvS = {};
      step('for', `Next cheapest edge: ${u}–${v} with weight ${w}.`);
      ru = find(u); rv = find(v);
      kvS = { [u]: 'compare', [v]: 'compare' };
      if (ru === rv) {
        est[cur] = 'bad';
        step(['find', 'same'], `find(${q(u)}) = ${q(ru)} and find(${q(v)}) = ${q(rv)}: same set. ${u} and ${v} are already connected, so this edge would make a cycle. Skip.`);
        continue;
      }
      step(['find', 'same'], `find(${q(u)}) = ${q(ru)}, find(${q(v)}) = ${q(rv)}: different sets, so the edge is safe.`);
      parent[ru] = rv; est[cur] = 'tree'; mst.push([u, v, w]); total += w; kvS = { [ru]: 'new' };
      step(['union', 'take'], `Union: \`parent['${ru}'] = '${rv}'\`. Take ${u}–${v}. total = ${total}, ${mst.length} edge${mst.length > 1 ? 's' : ''}.`);
      kvS = {};
      if (mst.length === nodes.length - 1) {
        step('full', `${mst.length} edges = V - 1: every node is connected. Stop.`);
        break;
      }
    }
    cur = -1; w = u = v = ru = rv = undefined;
    step('done', `Return the ${mst.length} edges, total weight ${total}.`);
    t.frames[t.frames.length - 1].vars.return = { raw: `([${mst.map((e) => tup(...e)).join(', ')}], ${total})` };
    return t.frames;
  }

  const PRIM = `
import heapq

def prim(graph, start):
    seen = {start}                  # nodes in the tree  #@init
    heap = [(w, start, v) for v, w in graph[start]]  #@init2
    heapq.heapify(heap)             # cheapest edge on top  #@init3
    mst, total = [], 0
    while heap and len(mst) < len(graph) - 1:  #@loop
        w, u, v = heapq.heappop(heap)  #@pop
        if v in seen:               # both ends in the tree  #@seen
            continue
        seen.add(v)                 # cheapest way out  #@add
        mst.append((u, v, w))
        total += w
        for nxt, w2 in graph[v]:
            if nxt not in seen:     # edge leaves the tree  #@check
                heapq.heappush(heap, (w2, v, nxt))  #@push
    return mst, total               #@done

${pyGraph(GW.adj)}
prim(graph, 'A')   # 5 edges, total 13  #@call
`;

  function tracePrim() {
    const g = GW, adj = g.adj, nodes = Object.keys(adj), start = 'A';
    const t = DSA.tracer();
    const seen = new Set(), heap = [], mst = [], skipped = {};
    let total, w, u, v, nxt, w2, act = null, actS = 'active', newNode = null;
    const step = (line, msg) => {
      const ns = {}, es = {};
      heap.forEach(([, a, b]) => (es[ek(g, a, b)] = 'frontier'));
      Object.keys(skipped).forEach((k) => (es[k] = 'bad'));
      mst.forEach(([a, b]) => (es[ek(g, a, b)] = 'tree'));
      if (act) es[act] = actS;
      seen.forEach((x) => (ns[x] = 'visited'));
      if (newNode) ns[newNode] = 'active';
      t.step(line, msg, {
        view: gview(g, { ns, es, ptr: ptrs([[newNode, 'v'], [nxt, 'nxt']]) }),
        vars: vars({ w, u, v, total, nxt, w2 }),
        aux: [heapAux(heap), { label: 'mst', kind: 'list', items: mst.map((e) => tup(...e)) }, { label: 'seen', kind: 'set', items: [...seen] }],
      });
    };
    step('call', `Call \`prim(graph, '${start}')\`. Grow one tree from ${q(start)}, always adding the cheapest edge that leaves it.`);
    seen.add(start); newNode = start;
    step('init', `The tree starts as just ${q(start)}.`);
    adj[start].forEach(([b, wt]) => heap.push([wt, start, b]));
    step('init2', `Put every edge out of ${q(start)} in a list as \`(w, u, v)\`.`);
    heapify(heap);
    step('init3', 'Heapify: the cheapest edge moves to index 0. O(n).');
    total = 0; newNode = null;
    for (;;) {
      act = null; skipped.cur = undefined;
      const go = heap.length && mst.length < nodes.length - 1;
      step('loop', go ? `Heap is not empty and the tree has ${mst.length} of ${nodes.length - 1} edges.` : heap.length ? `The tree has ${mst.length} = V - 1 edges: done.` : 'Heap is empty.');
      if (!go) break;
      [w, u, v] = hpop(heap); act = ek(g, u, v); actS = 'active'; nxt = w2 = undefined; newNode = v;
      if (seen.has(v)) {
        actS = 'bad';
        step(['pop', 'seen'], `Pop ${tup(w, u, v)}. ${q(v)} is already in the tree, so this edge would make a cycle. Skip.`);
        newNode = null;
        continue;
      }
      step(['pop', 'seen'], `Pop ${tup(w, u, v)}: the cheapest edge leaving the tree. ${q(v)} is not in the tree yet.`);
      seen.add(v); mst.push([u, v, w]); total += w; act = null;
      step('add', `Add ${q(v)} and edge ${u}–${v}. total = ${total}.`);
      for (const [b, wt] of adj[v]) {
        nxt = b; w2 = wt;
        if (seen.has(b)) { step('check', `${q(b)} is already in the tree, so ${v}–${b} does not leave it. Skip.`); continue; }
        hpush(heap, [wt, v, b]); act = ek(g, v, b); actS = 'active';
        step(['check', 'push'], `${q(b)} is outside: push ${tup(wt, v, b)}.`);
        act = null;
      }
      nxt = w2 = undefined; newNode = null;
    }
    w = u = v = undefined; act = null; newNode = null;
    step('done', `Return the ${mst.length} edges, total weight ${total}. Same total as Kruskal.`);
    t.frames[t.frames.length - 1].vars.return = { raw: `([${mst.map((e) => tup(...e)).join(', ')}], ${total})` };
    return t.frames;
  }

  DSA.addAlgo({
    id: 'mst',
    title: 'Minimum Spanning Tree',
    category: 'Graphs',
    order: 8,
    tags: ['mst', 'kruskal', 'prim', 'union find', 'dsu', 'heapq', 'greedy', 'spanning tree'],
    summary: 'Connect every node of a weighted undirected graph using V-1 edges with the smallest total weight. Two greedy algorithms: Kruskal (sort edges + union-find) and Prim (grow from a node with a heap).',
    complexity: { time: 'O(E log E)', space: 'O(V + E)' },
    notes: [
      'Cut property: the cheapest edge crossing any split of the nodes is safe to take. Both algorithms rely on it.',
      'Kruskal fits edge lists and sparse graphs. Prim fits adjacency lists and dense graphs.',
      'If the graph is disconnected there is no spanning tree: Kruskal ends with fewer than V-1 edges.',
      'Union-find with path compression + union by rank/size is almost O(1) per operation.',
    ],
    tips: [
      'Points on a plane (Min Cost to Connect All Points): the graph is complete, so Prim with O(V²) or a heap is the usual answer.',
      'Write `find` iteratively with path halving; it avoids recursion limits.',
    ],
    problems: ['1584. Min Cost to Connect All Points', '1135. Connecting Cities With Minimum Cost', '1168. Optimize Water Distribution in a Village', '1489. Find Critical and Pseudo-Critical Edges in MST'],
    variants: [
      {
        id: 'kruskal',
        label: 'Kruskal',
        file: 'kruskal',
        summary: 'Sort all edges by weight. Take each edge unless its ends are already connected (checked with union-find). Stop at V-1 edges.',
        complexity: { time: 'O(E log E)', space: 'O(V + E)', note: 'Sorting dominates; union-find is nearly O(1) per call.' },
        legend: { tree: 'MST edge', bad: 'Rejected (cycle)', visited: 'In MST', active: 'Current edge', compare: 'find()', new: 'Union' },
        code: KRUSKAL,
        trace: traceKruskal,
      },
      {
        id: 'prim',
        label: 'Prim',
        file: 'prim',
        summary: 'Start from one node. Keep a min-heap of edges leaving the tree; pop the cheapest, and if its far end is new, add it and push that node\'s edges.',
        complexity: { time: 'O(E log E)', space: 'O(E)', note: 'Lazy version: the heap can hold every edge.' },
        legend: { tree: 'MST edge', frontier: 'In heap', bad: 'Skipped', visited: 'In tree', active: 'Newest', min: 'Heap top' },
        code: PRIM,
        trace: tracePrim,
      },
    ],
  });

  /* ================= Cycle detection ================= */

  const CYC_DIR = `
WHITE, GRAY, BLACK = 0, 1, 2        # new / on path / done

def has_cycle(graph):
    color = {u: WHITE for u in graph}  #@init

    def dfs(u):
        color[u] = GRAY             # u is on the current path  #@gray
        for v in graph[u]:
            if color[v] == GRAY:    # back edge: cycle  #@back
                return True         #@found
            if color[v] == WHITE and dfs(v):  #@white
                return True         # pass it up  #@up
        color[u] = BLACK            # fully explored, safe  #@black
        return False                #@ret

    for u in graph:
        if color[u] == WHITE and dfs(u):  #@outer
            return True             #@yes
    return False

${pyGraph(GCD.adj)}
has_cycle(graph)   # True: D -> E -> F -> D  #@call
`;

  function traceCycleDir() {
    const g = GCD, adj = g.adj, nodes = Object.keys(adj);
    const t = DSA.tracer();
    const NAME = ['WHITE', 'GRAY', 'BLACK'];
    const color = {}, stack = [], tree = {};
    let v, act = null, actS = 'active', cyc = null, outerU, ret;
    const step = (line, msg) => {
      const ns = {};
      Object.keys(color).forEach((x) => { if (color[x] === 1) ns[x] = 'frontier'; else if (color[x] === 2) ns[x] = 'done'; });
      const u = stack[stack.length - 1];
      if (u) ns[u] = 'active';
      const es = Object.assign({}, tree);
      if (cyc) { cyc.nodes.forEach((x) => (ns[x] = 'bad')); cyc.edges.forEach((k) => (es[k] = 'bad')); }
      if (act) es[act] = actS;
      const kvS = {};
      Object.keys(color).forEach((x) => (kvS[x] = color[x] === 1 ? 'frontier' : color[x] === 2 ? 'done' : null));
      if (cyc) cyc.nodes.forEach((x) => (kvS[x] = 'bad'));
      t.step(line, msg, {
        views: [
          gview(g, { ns, es, ptr: ptrs([[u || outerU, 'u'], [v, 'v']]) }),
          { type: 'kv', title: 'color', entries: nodes.filter((x) => x in color).map((x) => [x, NAME[color[x]]]), states: kvS },
        ],
        vars: vars({ u: u || outerU, v, return: ret }),
        aux: [{ label: 'call stack', kind: 'stack', items: stack.map((x, i) => ({ v: `dfs('${x}')`, s: i === stack.length - 1 ? 'active' : null })) }],
      });
    };
    const dfs = (u) => {
      stack.push(u); v = undefined; act = null;
      color[u] = 1;
      step('gray', `Enter \`dfs('${u}')\`: colour ${q(u)} GRAY. GRAY = on the path we are exploring right now.`);
      for (const b of adj[u]) {
        v = b; act = ek(g, u, b); actS = 'active';
        if (color[b] === 1) {
          const from = stack.indexOf(b);
          const path = stack.slice(from);
          cyc = { nodes: path, edges: path.map((x, i) => ek(g, x, path[i + 1] || b)) };
          actS = 'bad';
          step('back', `${q(b)} is GRAY: it is on the current path, so ${u} → ${b} is a back edge. Cycle: ${path.concat(b).join(' → ')}.`);
          step('found', 'Return True.');
          stack.pop();
          return true;
        }
        if (color[b] === 2) {
          step('white', `${q(b)} is BLACK: already fully explored, no path from it comes back here. Not a cycle, skip.`);
          continue;
        }
        tree[act] = 'tree';
        step('white', `${q(b)} is WHITE (unvisited): explore it with \`dfs('${b}')\`.`);
        const r = dfs(b);
        v = b; act = null;
        if (r) {
          step('up', `\`dfs('${b}')\` found a cycle. \`dfs('${u}')\` returns True too.`);
          stack.pop();
          return true;
        }
      }
      v = undefined; act = null;
      color[u] = 2;
      step(['black', 'ret'], `Every edge out of ${q(u)} is done and none closed a loop. Colour it BLACK, return False.`);
      stack.pop();
      return false;
    };
    step('call', 'Call `has_cycle(graph)` on a directed graph. A cycle exists if DFS ever reaches a node that is still on the current path.');
    nodes.forEach((x) => (color[x] = 0));
    step('init', 'Every node starts WHITE (not visited).');
    for (const u of nodes) {
      outerU = u;
      if (color[u] !== 0) { step('outer', `${q(u)} is ${NAME[color[u]]}, skip.`); continue; }
      step('outer', `${q(u)} is WHITE: run \`dfs('${u}')\`.`);
      if (dfs(u)) {
        outerU = u; ret = true;
        step('yes', 'A cycle was found. Return True.');
        return t.frames;
      }
    }
    outerU = undefined; ret = false;
    step('no', 'No back edge anywhere. Return False.');
    return t.frames;
  }

  const CYC_UND = `
def has_cycle(graph):
    parent = {u: u for u in graph}  # union-find, all alone  #@init

    def find(x):                    # root of x's set
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x

    for u in graph:
        for v in graph[u]:
            if u > v:               # seen as (v, u) already  #@skip
                continue
            ru, rv = find(u), find(v)  #@find
            if ru == rv:            # already connected  #@same
                return True         # this edge closes a loop  #@found
            parent[ru] = rv         # union: merge the sets  #@union
    return False

${pyGraph(GCU.adj)}
has_cycle(graph)   # True: E-F closes A-B-D-E-F-C  #@call
`;

  function traceCycleUnd() {
    const g = GCU, adj = g.adj, nodes = Object.keys(adj);
    const t = DSA.tracer();
    const parent = {}, joined = [];
    let u, v, ru, rv, act = null, actS = 'active', kvS = {}, cyc = null, ret;
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const step = (line, msg) => {
      const ns = {}, es = {};
      joined.forEach(([a, b]) => { es[ek(g, a, b)] = 'tree'; ns[a] = 'visited'; ns[b] = 'visited'; });
      if (u) ns[u] = 'active';
      if (v) ns[v] = 'compare';
      if (cyc) { cyc.nodes.forEach((x) => (ns[x] = 'bad')); cyc.edges.forEach((k) => (es[k] = 'bad')); }
      if (act) es[act] = actS;
      t.step(line, msg, {
        views: [
          gview(g, { ns, es, ptr: ptrs([[u, 'u'], [v, 'v']]) }),
          { type: 'kv', title: 'parent (union-find)', entries: nodes.filter((x) => x in parent).map((x) => [x, parent[x]]), states: kvS },
        ],
        vars: vars({ u, v, ru, rv, return: ret }),
      });
    };
    step('call', 'Call `has_cycle(graph)` on an undirected graph. Idea: an edge whose two ends are already connected closes a loop.');
    nodes.forEach((x) => (parent[x] = x));
    step('init', 'Union-find: every node is its own set.');
    for (const a of nodes) {
      for (const b of adj[a]) {
        u = a; v = b; ru = rv = undefined; act = ek(g, a, b); actS = 'active'; kvS = {};
        if (a > b) {
          step('skip', `(${q(a)}, ${q(b)}): already handled as (${q(b)}, ${q(a)}). Skip.`);
          continue;
        }
        ru = find(a); rv = find(b); kvS = { [a]: 'compare', [b]: 'compare' };
        if (ru === rv) {
          // path between a and b along joined edges
          const nb = {};
          joined.forEach(([x, y]) => { (nb[x] = nb[x] || []).push(y); (nb[y] = nb[y] || []).push(x); });
          const prev = { [a]: null }, qq = [a];
          while (qq.length) { const x = qq.shift(); (nb[x] || []).forEach((y) => { if (!(y in prev)) { prev[y] = x; qq.push(y); } }); }
          const path = [];
          for (let x = b; x != null; x = prev[x]) path.push(x);
          cyc = { nodes: path, edges: path.slice(1).map((x, i) => ek(g, x, path[i])) };
          actS = 'bad';
          step(['find', 'same'], `find(${q(a)}) = ${q(ru)}, find(${q(b)}) = ${q(rv)}: same set. ${a} and ${b} are already connected by other edges.`);
          ret = true;
          step('found', `So edge ${a}–${b} closes a loop: ${path.slice().reverse().join('–')}–${a}. Return True.`);
          return t.frames;
        }
        step(['find', 'same'], `find(${q(a)}) = ${q(ru)}, find(${q(b)}) = ${q(rv)}: different sets, no loop yet.`);
        parent[ru] = rv; joined.push([a, b]); kvS = { [ru]: 'new' };
        step('union', `Union: \`parent['${ru}'] = '${rv}'\`. ${a} and ${b} are now in one set.`);
      }
    }
    u = v = ru = rv = undefined; act = null; ret = false;
    step('no', 'Every edge joined two separate sets. Return False.');
    return t.frames;
  }

  DSA.addAlgo({
    id: 'cycle-detection',
    title: 'Cycle Detection',
    category: 'Graphs',
    order: 9,
    tags: ['cycle', 'back edge', 'three colours', 'white gray black', 'union find', 'dsu', 'deadlock'],
    summary: 'Does the graph contain a loop? Directed graphs: DFS with 3 colours, a cycle is an edge back to a node still on the path. Undirected graphs: union-find, a cycle is an edge whose ends are already connected.',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    notes: [
      'Directed: a visited-set alone is not enough. Reaching a BLACK node (finished) is fine; only a GRAY node (on the current path) means a cycle.',
      'Undirected: a single visited-set works if you ignore the edge back to your parent: `dfs(v, parent=u)`.',
      'Kahn\'s topological sort also detects directed cycles: fewer than V nodes come out.',
      'A tree is a connected undirected graph with exactly V-1 edges and no cycle.',
    ],
    tips: [
      'Course Schedule = "does this directed graph have a cycle?". Use colours or Kahn.',
      'Redundant Connection (684) is exactly the union-find version: return the first edge whose ends share a root.',
    ],
    problems: ['207. Course Schedule', '802. Find Eventual Safe States', '684. Redundant Connection', '261. Graph Valid Tree', '1971. Find if Path Exists in Graph'],
    variants: [
      {
        id: 'directed',
        label: 'Directed (3 colours)',
        file: 'cycle_directed',
        summary: 'DFS with three colours. WHITE = not visited, GRAY = on the current DFS path, BLACK = fully explored. An edge into a GRAY node is a back edge, which means a cycle.',
        legend: { frontier: 'GRAY (on path)', done: 'BLACK (done)', bad: 'Cycle' },
        code: CYC_DIR,
        trace: traceCycleDir,
      },
      {
        id: 'undirected',
        label: 'Undirected (union-find)',
        file: 'cycle_undirected',
        summary: 'Process each edge once. If both ends already have the same union-find root, they are already connected, so this edge closes a cycle. Otherwise union their sets.',
        complexity: { time: 'O(E · α(V))', space: 'O(V)', note: 'α is the inverse Ackermann function: effectively constant.' },
        legend: { tree: 'Unioned edge', visited: 'Joined', bad: 'Cycle', compare: 'v', new: 'Union' },
        code: CYC_UND,
        trace: traceCycleUnd,
      },
    ],
  });
})();
