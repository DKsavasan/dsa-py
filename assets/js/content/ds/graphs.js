/* Data Structures · Graphs (representations, union-find) */
(function () {
  /* one small undirected graph shared by all three representations */
  const POS = { 0: [8, 50], 1: [40, 12], 2: [40, 88], 3: [82, 12], 4: [82, 88] };
  const EDGES = [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 4, 3], [3, 4, 1]];
  const N = 5;
  const graphView = (weighted, extra) => Object.assign({
    type: 'graph',
    width: 420,
    height: 230,
    nodes: Object.keys(POS).map((id) => ({ id, x: POS[id][0], y: POS[id][1] })),
    edges: EDGES.map(([u, v, w]) => (weighted ? { from: String(u), to: String(v), w } : { from: String(u), to: String(v) })),
  }, extra || {});
  const adj = {};
  for (let i = 0; i < N; i++) adj[i] = [];
  EDGES.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
  Object.values(adj).forEach((a) => a.sort((x, y) => x - y));
  const matrix = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (adj[i].includes(j) ? 1 : 0)));
  const labels = [0, 1, 2, 3, 4];
  // one comparison table for all three representations
  const OPS = [
    { op: 'neighbours of u', time: 'O(deg u)', note: 'adj list · matrix O(V) · edge list O(E)' },
    { op: 'edge u–v exists?', time: 'O(deg u)', note: 'adj list (O(1) with sets) · matrix O(1) · edge list O(E)' },
    { op: 'add edge', time: 'O(1)', note: 'all three' },
    { op: 'remove edge', time: 'O(deg u)', note: 'adj list · matrix O(1) · edge list O(E)' },
    { op: 'visit everything (BFS/DFS)', time: 'O(V + E)', note: 'adj list · matrix O(V²)' },
    { op: 'sort edges by weight', time: 'O(E log E)', note: 'edge list (Kruskal)' },
  ];

  DSA.addDS({
    id: 'graph',
    title: 'Graph',
    category: 'Graphs',
    order: 1,
    tags: ['adjacency list', 'adjacency matrix', 'edge list', 'defaultdict', 'vertices', 'edges', 'directed', 'weighted'],
    ops: OPS,
    space: 'O(V + E)',
    summary: 'Nodes (vertices) joined by edges, optionally directed and weighted. Pick the representation by what you do most: walk neighbours (list), test one edge (matrix), or process edges one by one (edge list).',
    notes: [
      'The cost table is for the adjacency list; each row\'s note gives the matrix and edge-list costs.',
      'V = number of nodes, E = number of edges. Sparse graphs (E ≈ V) are the norm in interviews: use an adjacency list.',
      'Undirected edges are stored twice (u → v and v → u). Directed edges once.',
      'Grids are implicit graphs: neighbours of `(r, c)` are the 4 cells around it. No need to build anything.',
      'Trees are connected acyclic graphs with V − 1 edges.',
    ],
    tips: [
      'Always ask: directed? weighted? can there be cycles, self-loops, duplicate edges? disconnected parts?',
      'Loop over `range(n)`, not over `g`, when some nodes may have no edges.',
    ],
    problems: ['200. Number of Islands', '133. Clone Graph', '207. Course Schedule', '323. Number of Connected Components in an Undirected Graph', '997. Find the Town Judge', '1584. Min Cost to Connect All Points'],
    variants: [
      {
        id: 'adjacency-list',
        legend: { active: 'node 1', frontier: 'its neighbours' },
        label: 'Adjacency list',
        summary: 'Map each node to the list of its neighbours. `defaultdict(list)` builds it from an edge list in two lines. The default choice: O(V + E) space and neighbours come for free.',
        space: 'O(V + E)',
        complexity: { time: {"Add edge": "O(1)", "Has edge?": "O(deg)", "Neighbours": "O(deg)", "Visit all": "O(V + E)"}, space: 'O(V + E)' },
        visuals: [
          graphView(false, { title: 'undirected, 5 nodes, 6 edges', states: { 1: 'active', 0: 'frontier', 2: 'frontier', 3: 'frontier' } }),
          { type: 'kv', title: 'g = adjacency list', layout: 'col', keyLabel: 'node', entries: labels.map((i) => [i, '[' + adj[i].join(', ') + ']']), states: { 1: 'active' } },
        ],
        visualCaption: 'Each node keys a list of its neighbours. `g[1]` is `[0, 2, 3]`. Each undirected edge appears in two lists, so the lists hold 2E entries in total.',
        code: `
from collections import defaultdict

# --- create: from an edge list ---
n = 5
edges = [(0, 1), (0, 2), (1, 2), (1, 3), (2, 4), (3, 4)]

g = defaultdict(list)           # node -> list of neighbours
for u, v in edges:
    g[u].append(v)
    g[v].append(u)              # undirected: both ways
# directed: only g[u].append(v)
# nodes are 0..n-1? g = [[] for _ in range(n)] works too

# weighted: store (neighbour, weight) pairs
wg = defaultdict(list)
for u, v, w in [(0, 1, 4), (0, 2, 1), (1, 2, 2)]:
    wg[u].append((v, w))
    wg[v].append((u, w))

# --- query ---
g[1]                            # neighbours: [0, 2, 3]
len(g[1])                       # degree of 1: 3
3 in g[1]                       # edge 1-3? O(deg)
# fast edge checks: defaultdict(set) and g[u].add(v)

# --- add / remove ---
g[0].append(4)                  # add edge 0-4, O(1)
g[4].append(0)
g[0].remove(4)                  # remove edge, O(deg)
g[4].remove(0)

# --- iterate ---
for u in range(n):              # every node, even isolated
    for v in g[u]:              # every edge (twice here)
        pass
for v, w in wg[0]:              # weighted neighbours
    pass
`,
      },
      {
        id: 'adjacency-matrix',
        legend: { active: 'node 1 / m[1][3]', frontier: 'its neighbours' },
        label: 'Adjacency matrix',
        summary: 'An n × n grid where `m[u][v]` is 1 (or the weight) if there is an edge u → v. Edge lookups are O(1) but it always costs O(V²) space, so use it for small or dense graphs.',
        space: 'O(V²)',
        complexity: { time: {"Add edge": "O(1)", "Has edge?": "O(1)", "Neighbours": "O(V)", "Visit all": "O(V²)"}, space: 'O(V²)' },
        visuals: [
          graphView(false, { title: 'undirected, 5 nodes, 6 edges', states: { 1: 'active', 0: 'frontier', 2: 'frontier', 3: 'frontier' } }),
          { type: 'grid', title: 'm[u][v]', cells: matrix, rowLabels: labels, colLabels: labels, states: { r1: 'active', '1,0': 'frontier', '1,2': 'frontier', '1,3': 'active' } },
        ],
        visualCaption: 'Row 1 lists every possible neighbour of node 1; the 1s are its edges. `m[1][3]` answers "is there an edge 1–3?" in O(1). Undirected graphs give a symmetric matrix.',
        code: `
# --- create ---
n = 5
edges = [(0, 1), (0, 2), (1, 2), (1, 3), (2, 4), (3, 4)]
m = [[0] * n for _ in range(n)]     # n x n zeros
for u, v in edges:
    m[u][v] = m[v][u] = 1           # undirected: symmetric
# directed: only m[u][v] = 1

# weighted: weight in the cell, inf = no edge
INF = float("inf")
wm = [[INF] * n for _ in range(n)]
for i in range(n):
    wm[i][i] = 0                    # distance to itself
wm[0][1] = wm[1][0] = 4             # edge 0-1, weight 4

# --- query ---
m[1][3] == 1                        # edge 1-3? O(1)
[v for v in range(n) if m[1][v]]    # neighbours: [0, 2, 3]
sum(m[1])                           # degree of 1: 3

# --- add / remove ---
m[2][3] = m[3][2] = 1               # add edge 2-3, O(1)
m[2][3] = m[3][2] = 0               # remove it, O(1)
`,
      },
      {
        id: 'edge-list',
        legend: { active: 'cheapest edges' },
        label: 'Edge list',
        summary: 'Just a list of `(u, v, w)` tuples. Useless for "who are my neighbours?", but perfect when an algorithm processes edges one at a time: **Kruskal** (sort by weight) and **Bellman-Ford** (relax every edge).',
        space: 'O(E)',
        complexity: { time: {"Add edge": "O(1)", "Has edge?": "O(E)", "Neighbours": "O(E)", "Sort edges": "O(E log E)"}, space: 'O(E)' },
        visuals: [
          graphView(true, { title: 'weighted, undirected' }),
          {
            type: 'array',
            title: 'edges.sort(key=lambda e: e[2])',
            showIndex: false,
            rows: [{ label: 'edges', items: EDGES.slice().sort((a, b) => a[2] - b[2]).map(([u, v, w]) => ({ v: `(${u},${v},${w})`, s: w <= 1 ? 'active' : null })) }],
          },
        ],
        visualCaption: 'The same graph as six tuples, sorted by weight the way Kruskal consumes them: cheapest edges first. Node count `n` is stored separately.',
        code: `
from collections import defaultdict

# --- create ---
# (u, v, weight) tuples: the rawest form
edges = [(0, 1, 4), (0, 2, 1), (1, 2, 2),
         (1, 3, 5), (2, 4, 3), (3, 4, 1)]
n = 5                           # node count kept separately

# --- add / scan ---
edges.append((0, 4, 7))         # add an edge, O(1)
for u, v, w in edges:           # every edge once, O(E)
    pass

# --- Kruskal: cheapest edges first ---
edges.sort(key=lambda e: e[2])  # O(E log E)

# --- Bellman-Ford: relax every edge V-1 times ---
dist = [float("inf")] * n
dist[0] = 0                     # source
for _ in range(n - 1):
    for u, v, w in edges:       # edges treated as u -> v
        if dist[u] + w < dist[v]:
            dist[v] = dist[u] + w

# --- convert to an adjacency list ---
g = defaultdict(list)
for u, v, w in edges:
    g[u].append((v, w))
    g[v].append((u, w))         # undirected
`,
      },
    ],
  });

  /* ---------- union-find ---------- */
  const T = (v, kids) => ({ id: String(v), v, children: kids || [] });
  const parent = [0, 0, 0, 2, 4, 4, 4, 6];

  DSA.addDS({
    id: 'union-find',
    title: 'Union-Find (Disjoint Set)',
    category: 'Graphs',
    order: 2,
    tags: ['dsu', 'disjoint set union', 'path compression', 'union by rank', 'connected components', 'kruskal'],
    summary: 'Tracks which items are in the same group. Each group is a tree stored in a `parent` array; the root names the group. With path compression and union by rank, `find` and `union` are effectively O(1).',
    ops: [
      { op: 'DSU(n)', time: 'O(n)' },
      { op: 'find(x)', time: 'O(α(n))', note: 'amortized; α(n) ≤ 4 for any real n' },
      { op: 'union(a, b)', time: 'O(α(n))', note: 'returns False if already joined' },
      { op: 'connected(a, b)', time: 'O(α(n))' },
      { op: 'count (components)', time: 'O(1)', note: 'kept up to date by union' },
    ],
    space: 'O(n)',
    complexity: { time: {"Find": "O(α(n))", "Union": "O(α(n))", "Connected": "O(α(n))"}, space: 'O(n)' },
    visuals: [
      { type: 'tree', title: 'set {0, 1, 2, 3}', levelGap: 58, scale: 0.85, root: T(0, [T(1), T(2, [T(3)])]), states: { 0: 'found', 2: 'visited', 3: 'active' }, edgeStates: { 3: 'active', 2: 'active' } },
      { type: 'tree', title: 'set {4, 5, 6, 7}', levelGap: 58, scale: 0.85, root: T(4, [T(5), T(6, [T(7)])]), states: { 4: 'found' } },
      { type: 'array', title: 'dsu.parent', items: parent, states: parent.map((p, i) => (p === i ? 'found' : null)) },
    ],
    legend: { found: 'root', active: 'find(3)', visited: 'path to root' },
    visualCaption: 'After the six unions below: two sets, each a tree whose root is its own parent. `find(3)` walks 3 → 2 → 0, then path compression sets `parent[3] = 0` so the next lookup is one hop.',
    code: `
# --- create ---
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))  # everyone is a root
        self.rank = [0] * n           # rough tree height
        self.count = n                # number of sets

    # --- find: root of x's set ---
    def find(self, x):
        if self.parent[x] != x:
            # path compression: link x straight to the root
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    # --- union: merge two sets ---
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False              # same set (a cycle!)
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra           # ra = the taller tree
        self.parent[rb] = ra          # short under tall
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1        # equal: grows by one
        self.count -= 1               # two sets became one
        return True

    # --- query ---
    def connected(self, a, b):
        return self.find(a) == self.find(b)

# --- use ---
dsu = DSU(8)
for a, b in [(0, 1), (2, 3), (0, 2), (4, 5), (6, 7), (4, 6)]:
    dsu.union(a, b)
dsu.parent                      # [0, 0, 0, 2, 4, 4, 4, 6]
dsu.count                       # 2
dsu.connected(1, 3)             # True (compresses 3)
dsu.connected(3, 5)             # False
dsu.union(3, 7)                 # True: one set left
dsu.union(1, 5)                 # False: already joined
`,
    notes: [
      'Each set is a tree of parent pointers. `find` climbs to the root; two items are connected when their roots match.',
      'Path compression + union by rank → O(α(n)) amortized, where α is the inverse Ackermann function (≤ 4). Either trick alone gives O(log n).',
      '`union` returning False means a and b were already connected: that detects a cycle in an undirected graph (Redundant Connection, Kruskal).',
      'It only merges; you cannot split a set. Keys are not 0..n−1? Use dicts: `parent.setdefault(x, x)`.',
    ],
    tips: [
      'Keep `count` and decrement it on every successful union: the number of components with no extra pass.',
      'Iterative find (path halving): `while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]`. No recursion limit worries.',
      'Union by size (`size[ra] += size[rb]`) works just as well and gives set sizes for free.',
    ],
    problems: ['547. Number of Provinces', '684. Redundant Connection', '323. Number of Connected Components in an Undirected Graph', '721. Accounts Merge', '1584. Min Cost to Connect All Points', '990. Satisfiability of Equality Equations'],
  });
})();
