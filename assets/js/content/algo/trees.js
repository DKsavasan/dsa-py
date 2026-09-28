/* Algorithms · Trees */
(function () {
  const U = DSA.util;

  /* ---------- shared helpers ---------- */
  // Python-ish value for the Variables panel.
  const N = (n) => (n ? { raw: `TreeNode(${n.v})` } : null);
  const nm = (n) => (n ? String(n.v) : 'None');
  const pyInf = (x) => (x === Infinity ? 'inf' : x === -Infinity ? '-inf' : String(x));
  const inf = (x) => (x === Infinity ? '∞' : x === -Infinity ? '-∞' : String(x));
  function tv(root, o) {
    o = o || {};
    return { type: 'tree', root, states: o.states || {}, badges: o.badges || {}, pointers: o.pointers || {}, edgeStates: o.edgeStates || {} };
  }
  function nodesOf(root) {
    const out = [];
    const walk = (n) => { if (!n) return; out.push(n); walk(n.left); walk(n.right); };
    walk(root);
    return out;
  }
  const stackRow = (label, items) => ({ label, kind: 'stack', items: items.map((v, i) => ({ v, s: i === items.length - 1 ? 'active' : null })) });

  /* =====================================================================
   * DFS traversals
   * ===================================================================== */
  const DFS_TREE = [1, 2, 3, 4, 5, null, 6];

  function dfsRecursive(order) {
    return function () {
      const root = U.treeFromLevel(DFS_TREE);
      const t = DSA.tracer();
      const out = [], calls = [], done = new Set();
      const snap = (cur) => {
        const states = {};
        calls.forEach((n) => { if (n) states[n.id] = 'frontier'; });
        done.forEach((id) => (states[id] = 'visited'));
        if (cur) states[cur.id] = 'active';
        return tv(root, { states });
      };
      const S = (line, msg, cur) => t.step(line, msg, {
        view: snap(cur),
        vars: { node: N(cur), out: out.slice() },
        aux: [{ label: 'out', kind: 'list', items: out.slice() }, stackRow('call stack', calls.map((n) => `dfs(${nm(n)})`))],
      });
      t.step('init', 'Start with an empty `out` list.', { view: snap(null), vars: { out: [] }, aux: [{ label: 'out', kind: 'list', items: [] }, stackRow('call stack', [])] });
      calls.push(root);
      S('call', `Call \`dfs(root)\`: root is ${root.v}.`, root);
      calls.pop();

      const dfs = (node, parent, side) => {
        calls.push(node);
        if (!node) {
          S(['base', 'ret'], `\`node\` is None (${side} child of ${parent.v}). Nothing here, return.`, null);
          calls.pop();
          return;
        }
        const visit = (why) => {
          out.push(node.v);
          done.add(node.id);
          S('visit', `${why} Append ${node.v}: out = ${U.py(out)}.`, node);
        };
        const goLeft = (pre) => {
          S('left', `${pre}${node.left ? `call \`dfs(${node.left.v})\`.` : `${node.v} has no left child, so \`dfs(None)\`.`}`, node);
          dfs(node.left, node, 'left');
        };
        const goRight = (pre) => {
          S('right', `${pre}${node.right ? `call \`dfs(${node.right.v})\`.` : `${node.v} has no right child, so \`dfs(None)\`.`}`, node);
          dfs(node.right, node, 'right');
        };
        if (order === 'pre') {
          visit(`In \`dfs(${node.v})\`. Preorder visits the node first.`);
          goLeft('Then the left subtree: ');
          goRight(`Back in \`dfs(${node.v})\`, left side done. Now the right: `);
        } else if (order === 'in') {
          goLeft(`In \`dfs(${node.v})\`. Inorder goes left first: `);
          visit(`Back in \`dfs(${node.v})\`, left side done. Inorder visits the node in the middle.`);
          goRight('Now the right subtree: ');
        } else {
          goLeft(`In \`dfs(${node.v})\`. Postorder goes left first: `);
          goRight(`Back in \`dfs(${node.v})\`, left side done. Now the right: `);
          visit(`Back in \`dfs(${node.v})\`, both subtrees done. Postorder visits the node last.`);
        }
        calls.pop();
      };
      dfs(root, null, 'root');
      t.step('done', `\`dfs(root)\` has returned. Return out = ${U.py(out)}.`, {
        view: snap(null), vars: { out: out.slice(), return: out.slice() },
        aux: [{ label: 'out', kind: 'list', items: out.map((v) => ({ v, s: 'found' })) }, stackRow('call stack', [])],
      });
      return t.frames;
    };
  }

  function dfsCode(fn, lines) {
    return `
# TreeNode has .val, .left, .right
def ${fn}(root):
    out = []                           #@init
    def dfs(node):
        if not node:                   # fell off the tree  #@base
            return                     #@ret
${lines}
    dfs(root)                          #@call
    return out                         #@done
`;
  }
  const L_VISIT = '        out.append(node.val)           # visit the node  #@visit';
  const L_LEFT = '        dfs(node.left)                 # left subtree  #@left';
  const L_RIGHT = '        dfs(node.right)                # right subtree  #@right';

  DSA.addAlgo({
    id: 'tree-dfs',
    title: 'DFS Traversals',
    category: 'Trees',
    order: 1,
    tags: ['preorder', 'inorder', 'postorder', 'depth first', 'traversal', 'recursion', 'stack'],
    summary: 'Walk a binary tree depth first. The three orders differ only in **when** you record the node: before its children (pre), between them (in), or after them (post).',
    complexity: { time: 'O(n)', space: 'O(h)', note: 'h = tree height: O(log n) balanced, O(n) for a chain. Space is the recursion depth.' },
    legend: { active: 'current', frontier: 'on call stack', visited: 'in out', found: 'result' },
    notes: [
      'Preorder: node, left, right. Inorder: left, node, right. Postorder: left, right, node.',
      'Inorder of a **BST** gives the values in sorted order.',
      'Every node is entered once, and every `None` child costs one extra call: O(n) total.',
      'Python recursion limit is about 1000. A degenerate tree deeper than that needs the iterative version or `sys.setrecursionlimit`.',
    ],
    tips: [
      'Pick the order by what you need: preorder to copy/serialize a tree, inorder for sorted BST output, postorder when a node needs its children\'s answers first (height, delete, subtree sums).',
      'Quick one-liner: `return inorder(r.left) + [r.val] + inorder(r.right) if r else []`. Fine to say, but it copies lists, so O(n²) worst case.',
    ],
    problems: ['144. Binary Tree Preorder Traversal', '94. Binary Tree Inorder Traversal', '145. Binary Tree Postorder Traversal', '230. Kth Smallest Element in a BST', '297. Serialize and Deserialize Binary Tree', '105. Construct Binary Tree from Preorder and Inorder'],
    input: { default: {} },
    variants: [
      {
        id: 'preorder',
        label: 'Preorder',
        summary: 'Preorder visits **node, then left subtree, then right subtree**. The root comes first, so it is the natural order for copying or serializing a tree.',
        code: dfsCode('preorder', [L_VISIT, L_LEFT, L_RIGHT].join('\n')),
        trace: dfsRecursive('pre'),
      },
      {
        id: 'inorder',
        label: 'Inorder',
        summary: 'Inorder visits **left subtree, then node, then right subtree**. On a binary search tree this yields the values in sorted order.',
        code: dfsCode('inorder', [L_LEFT, L_VISIT, L_RIGHT].join('\n')),
        trace: dfsRecursive('in'),
      },
      {
        id: 'postorder',
        label: 'Postorder',
        summary: 'Postorder visits **left subtree, then right subtree, then node**. A node is handled only after both children, which is what you need for heights, sizes and deleting a tree.',
        code: dfsCode('postorder', [L_LEFT, L_RIGHT, L_VISIT].join('\n')),
        trace: dfsRecursive('post'),
      },
      {
        id: 'inorder-iterative',
        label: 'Inorder (stack)',
        file: 'inorder_iterative',
        summary: 'Inorder (**left, node, right**) without recursion. Push nodes while walking left; when you cannot go further, pop one, record it, then move to its right child.',
        complexity: { time: 'O(n)', space: 'O(h)', note: 'The explicit stack holds at most one root-to-leaf path.' },
        legend: { active: 'node', frontier: 'on stack', visited: 'in out', found: 'result' },
        code: `
# TreeNode has .val, .left, .right
def inorder(root):
    out, stack = [], []                #@init
    node = root                        #@start
    while node or stack:               # work left to do  #@loop
        while node:                    # slide down-left  #@inner
            stack.append(node)         # come back to it later  #@push
            node = node.left           #@goleft
        node = stack.pop()             # leftmost unvisited node  #@pop
        out.append(node.val)           # left side done: visit  #@visit
        node = node.right              # then its right side  #@goright
    return out                         #@done
`,
        trace() {
          const root = U.treeFromLevel(DFS_TREE);
          const t = DSA.tracer();
          const out = [], stack = [], done = new Set();
          let node = null;
          const S = (line, msg, extra) => {
            const states = {};
            stack.forEach((n) => (states[n.id] = 'frontier'));
            done.forEach((id) => (states[id] = 'visited'));
            if (node) states[node.id] = 'active';
            t.step(line, msg, {
              view: tv(root, { states }),
              vars: Object.assign({ node: N(node), stack: stack.map((n) => n.v), out: out.slice() }, extra || {}),
              aux: [{ label: 'stack', kind: 'stack', items: stack.map((n) => n.v) }, { label: 'out', kind: 'list', items: out.slice() }],
            });
          };
          S('init', 'Empty `out` and an empty stack.');
          node = root;
          S('start', `\`node\` starts at the root, ${root.v}.`);
          while (true) {
            const go = !!(node || stack.length);
            S('loop', go ? (node ? `\`node\` is ${node.v}, so keep going.` : `\`node\` is None but the stack has ${stack.length} node${stack.length > 1 ? 's' : ''}, so keep going.`) : '`node` is None and the stack is empty. Every node is visited.');
            if (!go) break;
            while (node) {
              stack.push(node);
              S('push', `Push ${node.v}. We visit it after its left subtree.`);
              const from = node;
              node = node.left;
              S('goleft', node ? `Move left: ${from.v} → ${node.v}.` : `${from.v} has no left child: \`node = None\`.`);
            }
            S('inner', '`node` is None: we are as far left as we can go.');
            node = stack.pop();
            S('pop', `Pop ${node.v}. Everything left of it is already in \`out\`.`);
            out.push(node.v);
            done.add(node.id);
            S('visit', `Visit ${node.v}: out = ${U.py(out)}.`);
            const from = node;
            node = node.right;
            S('goright', node ? `Move to the right child of ${from.v}: \`node = ${node.v}\`.` : `${from.v} has no right child: \`node = None\`. The next pop gives its ancestor.`);
          }
          S('done', `Return out = ${U.py(out)} (left, node, right).`, { return: out.slice() });
          return t.frames;
        },
      },
    ],
  });

  /* =====================================================================
   * BFS level order
   * ===================================================================== */
  const LEVEL_TREE = [1, 2, 3, 4, 5, null, 6, null, null, 7];

  DSA.addAlgo({
    id: 'level-order',
    title: 'BFS Level Order',
    category: 'Trees',
    order: 2,
    tags: ['bfs', 'breadth first', 'queue', 'deque', 'levels', 'layer'],
    summary: 'Visit the tree one level at a time with a queue. Snapshot `len(q)` at the start of each level so you know exactly how many nodes belong to it.',
    complexity: { time: 'O(n)', space: 'O(w)', note: 'w = widest level, up to about n/2 for a full tree.' },
    legend: { active: 'current', frontier: 'in queue', visited: 'done' },
    notes: [
      'Use `collections.deque`: `popleft()` is O(1). `list.pop(0)` is O(n).',
      '`for _ in range(len(q))` reads the size once, so children appended during the loop wait for the next level.',
      'Right side view = last value of each level. Zigzag = reverse every other level.',
    ],
    tips: [
      'Any question that says "level", "row", "depth by depth" or "closest to the root" is BFS.',
      'Without the inner `for`, you still get BFS order, just not grouped by level.',
    ],
    problems: ['102. Binary Tree Level Order Traversal', '199. Binary Tree Right Side View', '103. Zigzag Level Order Traversal', '637. Average of Levels in Binary Tree', '111. Minimum Depth of Binary Tree'],
    input: { default: {} },
    code: `
from collections import deque

def level_order(root):
    if not root:
        return []
    out, q = [], deque([root])         #@init
    while q:                           # one pass per level  #@loop
        level = []                     #@level
        # len(q) is read once: exactly this level's nodes
        for _ in range(len(q)):        #@for
            node = q.popleft()         # oldest first (FIFO)  #@pop
            level.append(node.val)     #@visit
            if node.left:
                q.append(node.left)    # next level  #@pushl
            if node.right:
                q.append(node.right)   #@pushr
        out.append(level)              # level finished  #@add
    return out                         #@done
`,
    trace() {
      const root = U.treeFromLevel(LEVEL_TREE);
      const t = DSA.tracer();
      const out = [], q = [], done = new Set();
      let level = [], node = null;
      const S = (line, msg, extra) => {
        const states = {};
        q.forEach((n) => (states[n.id] = 'frontier'));
        done.forEach((id) => (states[id] = 'visited'));
        if (node) states[node.id] = 'active';
        t.step(line, msg, {
          view: tv(root, { states }),
          vars: Object.assign({ node: N(node), level: level.slice(), out: U.clone(out) }, extra || {}),
          aux: [
            { label: 'q', kind: 'queue', items: q.map((n) => n.v) },
            { label: 'level', kind: 'list', items: level.slice() },
            { label: 'out', kind: 'list', items: out.map((l) => l.slice()) },
          ],
        });
      };
      q.push(root);
      S('init', `Put the root (${root.v}) in the queue. \`out\` is empty.`);
      let depth = 0;
      while (true) {
        S('loop', q.length ? `The queue has ${q.length} node${q.length > 1 ? 's' : ''}: start level ${depth}.` : 'The queue is empty: every level is done.');
        if (!q.length) break;
        level = [];
        S('level', `New empty \`level\` list for level ${depth}.`);
        const size = q.length;
        S('for', `\`len(q)\` is ${size}, so this level has exactly ${size} node${size > 1 ? 's' : ''}: ${q.map((n) => n.v).join(', ')}.`, { 'len(q)': size });
        for (let k = 0; k < size; k++) {
          node = q.shift();
          S('pop', `Pop ${node.v} from the front.`);
          level.push(node.v);
          done.add(node.id);
          S('visit', `Add ${node.v} to this level: level = ${U.py(level)}.`);
          if (node.left) {
            q.push(node.left);
            S('pushl', `Queue its left child ${node.left.v} for the next level.`);
          }
          if (node.right) {
            q.push(node.right);
            S('pushr', `Queue its right child ${node.right.v} for the next level.`);
          }
        }
        node = null;
        out.push(level.slice());
        S('add', `Level ${depth} done. out = ${U.py(out)}.`);
        depth++;
      }
      level = [];
      S('done', `Return ${out.length} levels: ${U.py(out)}.`, { return: U.clone(out) });
      return t.frames;
    },
  });

  /* =====================================================================
   * Maximum depth
   * ===================================================================== */
  const DEPTH_TREE = [1, 2, 3, 4, 5, null, 6, null, null, 7];

  DSA.addAlgo({
    id: 'max-depth',
    title: 'Maximum Depth',
    category: 'Trees',
    order: 3,
    tags: ['height', 'depth', 'recursion', 'bfs', 'postorder'],
    summary: 'The number of nodes on the longest root-to-leaf path. Either ask each child for its depth and add one, or count the levels with BFS.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    notes: [
      'Depth of an empty tree is 0; a single node is 1 (LeetCode counts nodes, not edges).',
      'The recursive version is postorder: a node can answer only after both children have.',
      'Same shape solves diameter, balanced check and max path sum: return a height, update a global answer on the way up.',
    ],
    tips: [
      'Minimum depth is **not** `1 + min(left, right)`: a missing child is not a leaf. Use BFS and stop at the first leaf.',
      'Write the recursive one-liner first: `return 1 + max(f(r.left), f(r.right)) if r else 0`.',
    ],
    problems: ['104. Maximum Depth of Binary Tree', '111. Minimum Depth of Binary Tree', '110. Balanced Binary Tree', '543. Diameter of Binary Tree', '124. Binary Tree Maximum Path Sum'],
    input: { default: {} },
    variants: [
      {
        id: 'recursive-dfs',
        label: 'Recursive DFS',
        summary: 'Ask each subtree for its depth, take the larger one and add 1 for the current node. An empty subtree has depth 0.',
        complexity: { time: 'O(n)', space: 'O(h)', note: 'h = height; recursion depth.' },
        legend: { active: 'current call', frontier: 'waiting on a child', visited: 'returned' },
        code: `
# TreeNode has .val, .left, .right
def max_depth(root):
    if not root:                       # empty tree  #@base
        return 0                       #@zero
    left = max_depth(root.left)        # depth of left subtree  #@left
    right = max_depth(root.right)      # depth of right subtree  #@right
    return 1 + max(left, right)        # +1 for root itself  #@ret
`,
        trace() {
          const root = U.treeFromLevel(DEPTH_TREE);
          const t = DSA.tracer();
          const calls = [], badges = {}, done = new Set();
          const S = (line, msg, cur, vars) => {
            const states = {};
            calls.forEach((c) => { if (c.n) states[c.n.id] = 'frontier'; });
            done.forEach((id) => (states[id] = 'visited'));
            if (cur) states[cur.id] = 'active';
            t.step(line, msg, {
              view: tv(root, { states, badges: Object.assign({}, badges) }),
              vars: Object.assign({ root: N(cur) }, vars),
              aux: [stackRow('call stack', calls.map((c) => `max_depth(${nm(c.n)})` + (c.left != null && c.right == null ? `  left=${c.left}` : '')))],
            });
          };
          const rec = (node, parent, side) => {
            const fr = { n: node, left: null, right: null };
            calls.push(fr);
            if (!node) {
              S(['base', 'zero'], `\`max_depth(None)\` (${side} child of ${parent.v}): empty, return 0.`, null, { return: 0 });
              calls.pop();
              return 0;
            }
            S('left', `\`max_depth(${node.v})\`: not empty. First get the left depth: \`max_depth(${nm(node.left)})\`.`, node, {});
            fr.left = rec(node.left, node, 'left');
            S('right', `Back in ${node.v}: left = ${fr.left}. Now the right: \`max_depth(${nm(node.right)})\`.`, node, { left: fr.left });
            fr.right = rec(node.right, node, 'right');
            const d = 1 + Math.max(fr.left, fr.right);
            badges[node.id] = 'd=' + d;
            done.add(node.id);
            S('ret', `left = ${fr.left}, right = ${fr.right}. Return 1 + max(${fr.left}, ${fr.right}) = ${d}.`, node, { left: fr.left, right: fr.right, return: d });
            calls.pop();
            return d;
          };
          rec(root, null, 'root');
          return t.frames;
        },
      },
      {
        id: 'bfs',
        label: 'BFS (count levels)',
        file: 'max_depth_bfs',
        summary: 'Process the tree level by level with a queue and count the levels. The count when the queue empties is the depth.',
        complexity: { time: 'O(n)', space: 'O(w)', note: 'w = widest level.' },
        legend: { active: 'current', frontier: 'in queue', visited: 'done' },
        code: `
from collections import deque

def max_depth(root):
    if not root:
        return 0
    q, depth = deque([root]), 0        #@init
    while q:                           # one pass = one level  #@loop
        depth += 1                     # entering a new level  #@inc
        for _ in range(len(q)):        # this level's nodes  #@for
            node = q.popleft()         #@pop
            if node.left:
                q.append(node.left)    #@pushl
            if node.right:
                q.append(node.right)   #@pushr
    return depth                       # levels counted  #@done
`,
        trace() {
          const root = U.treeFromLevel(DEPTH_TREE);
          const t = DSA.tracer();
          const q = [], done = new Set(), badges = {};
          let depth = 0, node = null;
          const S = (line, msg, extra) => {
            const states = {};
            q.forEach((n) => (states[n.id] = 'frontier'));
            done.forEach((id) => (states[id] = 'visited'));
            if (node) states[node.id] = 'active';
            t.step(line, msg, {
              view: tv(root, { states, badges: Object.assign({}, badges) }),
              vars: Object.assign({ depth, node: N(node) }, extra || {}),
              aux: [{ label: 'q', kind: 'queue', items: q.map((n) => n.v) }],
            });
          };
          q.push(root);
          S('init', `Queue holds the root (${root.v}). \`depth = 0\`.`);
          while (true) {
            node = null;
            S('loop', q.length ? `${q.length} node${q.length > 1 ? 's' : ''} waiting: there is another level.` : `Queue is empty: no more levels.`);
            if (!q.length) break;
            depth++;
            S('inc', `Start level ${depth}: \`depth = ${depth}\`.`);
            const size = q.length;
            S('for', `This level has ${size} node${size > 1 ? 's' : ''}: ${q.map((n) => n.v).join(', ')}.`, { 'len(q)': size });
            for (let k = 0; k < size; k++) {
              node = q.shift();
              done.add(node.id);
              badges[node.id] = 'd=' + depth;
              S('pop', `Pop ${node.v}. It sits at depth ${depth}.`);
              if (node.left) { q.push(node.left); S('pushl', `Queue left child ${node.left.v}.`); }
              if (node.right) { q.push(node.right); S('pushr', `Queue right child ${node.right.v}.`); }
            }
          }
          S('done', `Counted ${depth} levels. Return ${depth}.`, { return: depth });
          return t.frames;
        },
      },
    ],
  });

  /* =====================================================================
   * BST search & insert
   * ===================================================================== */
  const BST_VALUES = [8, 3, 10, 1, 6, 14, 4, 7, 13];
  const numIn = (x, d) => { const v = Math.round(Number(x)); return Number.isFinite(v) ? Math.max(-99, Math.min(999, v)) : d; };
  // all variants share one field (the form is built once per page)
  let flip = 0;
  const bstInput = (d) => ({
    default: { val: d },
    // alternate: a value in the tree, then one that is missing
    random: () => ({ val: flip++ % 2 ? BST_VALUES[U.randInt(0, BST_VALUES.length - 1)] : [0, 2, 5, 9, 11, 12, 15][U.randInt(0, 6)] }),
    fields: [{ key: 'val', label: 'value', type: 'number' }],
  });
  const pathStates = (path, cur, curState) => {
    const s = {};
    path.forEach((n) => (s[n.id] = 'visited'));
    if (cur) s[cur.id] = curState || 'active';
    return s;
  };

  DSA.addAlgo({
    id: 'bst-operations',
    title: 'BST Search & Insert',
    category: 'Trees',
    order: 4,
    tags: ['binary search tree', 'bst', 'search', 'insert', 'lookup'],
    summary: 'In a binary search tree, everything left of a node is smaller and everything right is bigger. Search and insert compare with the node and go down one side, so they cost O(h).',
    complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(n)' }, space: 'O(1)' },
    legend: { active: 'current', visited: 'path taken' },
    notes: [
      'Cost is the height h: O(log n) when balanced, O(n) when the tree is a chain (sorted inserts).',
      'Python has no built-in balanced BST. Use `bisect` on a sorted list, `heapq`, or `sortedcontainers.SortedList` in practice.',
      'Inorder traversal of a BST is sorted; that is how to check or use it.',
    ],
    tips: [
      'Recursive insert returns the (possibly new) subtree root and the parent re-links it: `root.left = insert(root.left, val)`. No parent pointer needed.',
      'Delete: 0 children, remove; 1 child, splice it in; 2 children, copy the inorder successor (min of right subtree) and delete that.',
    ],
    problems: ['700. Search in a Binary Search Tree', '701. Insert into a Binary Search Tree', '450. Delete Node in a BST', '235. LCA of a Binary Search Tree', '98. Validate Binary Search Tree'],
    variants: [
      {
        id: 'search-iterative',
        label: 'Search (loop)',
        file: 'search_bst',
        summary: 'Start at the root. If the target is smaller go left, if bigger go right, until you hit it or fall off the tree.',
        complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(n)' }, space: 'O(1)' },
        input: bstInput(7),
        code: `
# TreeNode has .val, .left, .right
def search_bst(root, target):
    node = root                        #@init
    while node:                        # until we fall off  #@loop
        if target == node.val:         #@cmp
            return node                # found it  #@found
        if target < node.val:          #@lt
            node = node.left           # smaller: go left  #@left
        else:
            node = node.right          # bigger: go right  #@right
    return None                        # not in the tree  #@none
`,
        trace(inp) {
          const target = numIn(inp.val, 7);
          const root = U.bstFrom(BST_VALUES);
          const t = DSA.tracer();
          const path = [];
          let node = root;
          const S = (line, msg, st, extra) => t.step(line, msg, {
            view: tv(root, { states: pathStates(path, node, st) }),
            vars: Object.assign({ target, node: N(node) }, extra || {}),
          });
          S('init', `Start at the root, ${root.v}.`);
          while (true) {
            S('loop', node ? `\`node\` is ${node.v}, not None: keep looking.` : `\`node\` is None: we fell off the tree.`);
            if (!node) break;
            S('cmp', `Is ${target} == ${node.v}? ${target === node.v ? 'Yes.' : 'No.'}`, 'compare');
            if (target === node.v) {
              S('found', `Found ${target}. Return this node.`, 'found', { return: N(node) });
              return t.frames;
            }
            S('lt', `Is ${target} < ${node.v}? ${target < node.v ? 'Yes' : 'No'}.`, 'compare');
            path.push(node);
            const from = node;
            if (target < node.v) {
              node = node.left;
              S('left', `${target} < ${from.v}, so it can only be in the left subtree. \`node = ${nm(node)}\`.`);
            } else {
              node = node.right;
              S('right', `${target} > ${from.v}, so it can only be in the right subtree. \`node = ${nm(node)}\`.`);
            }
          }
          S('none', `${target} is not in the tree. Return None.`, null, { return: null });
          return t.frames;
        },
      },
      {
        id: 'search-recursive',
        label: 'Search (recursive)',
        file: 'search_bst',
        summary: 'Same walk, written recursively: return the node if it matches (or None if empty), otherwise search the one side that can hold the target.',
        complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(n)' }, space: 'O(h)', note: 'Recursion depth. Each call just returns its child\'s answer.' },
        input: bstInput(7),
        code: `
# TreeNode has .val, .left, .right
def search_bst(root, target):
    # base: empty subtree, or this is the node
    if not root or root.val == target:  #@base
        return root                     # the node, or None  #@ret
    if target < root.val:               #@lt
        return search_bst(root.left, target)   #@left
    return search_bst(root.right, target)      #@right
`,
        trace(inp) {
          const target = numIn(inp.val, 7);
          const root = U.bstFrom(BST_VALUES);
          const t = DSA.tracer();
          const calls = [];
          let hit = null;
          const S = (line, msg, cur, st, extra) => {
            const states = pathStates(calls.filter((n) => n && n !== cur), cur, st);
            if (hit) states[hit.id] = 'found';
            t.step(line, msg, {
              view: tv(root, { states }),
              vars: Object.assign({ target, root: N(cur) }, extra || {}),
              aux: [stackRow('call stack', calls.map((n) => `search_bst(${nm(n)})`))],
            });
          };
          const rec = (node, parent) => {
            calls.push(node);
            if (!node) {
              S(['base', 'ret'], `Empty subtree under ${parent.v}: ${target} is not here. Return None.`, null, null, { return: null });
              calls.pop();
              return null;
            }
            if (node.v === target) {
              hit = node;
              S(['base', 'ret'], `${node.v} == ${target}: base case. Return this node.`, node, 'found', { return: N(node) });
              calls.pop();
              return node;
            }
            S('base', `${node.v} != ${target}, not a base case.`, node, 'compare');
            const goLeft = target < node.v;
            S('lt', `Is ${target} < ${node.v}? ${goLeft ? 'Yes' : 'No'}.`, node, 'compare');
            const line = goLeft ? 'left' : 'right';
            S(line, `Recurse into the ${line} subtree: \`search_bst(${nm(goLeft ? node.left : node.right)})\`.`, node);
            const r = rec(goLeft ? node.left : node.right, node);
            const top = calls.length === 1;
            S(line, `Back in \`search_bst(${node.v})\`: return ${r ? `node ${r.v}` : 'None'} ${top ? 'as the final answer' : 'straight up'}.`, node, null, { return: N(r) });
            calls.pop();
            return r;
          };
          const res = rec(root, null);
          const fin = {};
          if (res) fin[res.id] = 'found';
          t.step('ret', res ? `Result: the node with value ${res.v}.` : `Result: None. ${target} is not in the tree.`, {
            view: tv(root, { states: fin }), vars: { target, return: N(res) }, aux: [stackRow('call stack', [])],
          });
          return t.frames;
        },
      },
      {
        id: 'insert',
        label: 'Insert',
        file: 'insert_bst',
        summary: 'Walk down exactly like search. When you reach an empty spot, create the node there. Each call returns its subtree root so the parent can re-link it.',
        complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(n)' }, space: 'O(h)', note: 'Recursion depth. The iterative version is O(1) space.' },
        legend: { active: 'current', visited: 'path taken', new: 'new node' },
        input: bstInput(5),
        code: `
# TreeNode has .val, .left, .right
def insert(root, val):
    if not root:                       # found the empty spot  #@base
        return TreeNode(val)           # new leaf  #@new
    if val < root.val:                 #@cmp
        root.left = insert(root.left, val)    #@left
    elif val > root.val:
        root.right = insert(root.right, val)  #@right
    return root                        # same node, relinked  #@ret
`,
        trace(inp) {
          const val = numIn(inp.val, 5);
          const root = U.bstFrom(BST_VALUES);
          const t = DSA.tracer();
          const calls = [];
          let fresh = null;
          const S = (line, msg, cur, st, extra) => {
            const states = pathStates(calls.filter((n) => n && n !== cur), cur, st);
            if (fresh) states[fresh.id] = 'new';
            t.step(line, msg, {
              view: tv(root, { states, edgeStates: fresh ? { [fresh.id]: 'new' } : {} }),
              vars: Object.assign({ val, root: N(cur) }, extra || {}),
              aux: [stackRow('call stack', calls.map((n) => `insert(${nm(n)})`))],
            });
          };
          const rec = (node, parent, side) => {
            calls.push(node);
            if (!node) {
              S('base', `\`root\` is None: this is the empty ${side} spot under ${parent.v}.`, null);
              fresh = { id: String(val), v: val, left: null, right: null };
              S('new', `Create \`TreeNode(${val})\` and return it to ${parent.v}.`, null, null, { return: N(fresh) });
              calls.pop();
              return fresh;
            }
            const rel = val < node.v ? '<' : val > node.v ? '>' : '==';
            S('cmp', `Compare ${val} with ${node.v}: ${val} ${rel} ${node.v}.`, node, 'compare');
            if (val < node.v) {
              S('left', `Go left: \`insert(${nm(node.left)}, ${val})\`.`, node);
              const child = rec(node.left, node, 'left');
              const isNew = !node.left;
              node.left = child;
              S('left', isNew ? `Link it: \`${node.v}.left = ${child.v}\`. The new node is attached.` : `\`${node.v}.left\` gets back ${child.v}, the same node as before.`, node);
            } else if (val > node.v) {
              S('right', `Go right: \`insert(${nm(node.right)}, ${val})\`.`, node);
              const child = rec(node.right, node, 'right');
              const isNew = !node.right;
              node.right = child;
              S('right', isNew ? `Link it: \`${node.v}.right = ${child.v}\`. The new node is attached.` : `\`${node.v}.right\` gets back ${child.v}, the same node as before.`, node);
            }
            S('ret', rel === '==' ? `${val} is already in the tree: change nothing, return ${node.v}.` : `Return ${node.v} to ${parent ? parent.v : 'the caller'}.`, node, null, { return: N(node) });
            calls.pop();
            return node;
          };
          rec(root, null, 'root');
          const st = {};
          if (fresh) st[fresh.id] = 'new';
          t.step('ret', fresh ? `Done. ${val} is now a leaf, and the root is still ${root.v}.` : `Done. Nothing was inserted.`, {
            view: tv(root, { states: st, edgeStates: fresh ? { [fresh.id]: 'new' } : {} }), vars: { val, return: N(root) }, aux: [stackRow('call stack', [])],
          });
          return t.frames;
        },
      },
    ],
  });

  /* =====================================================================
   * Validate BST
   * ===================================================================== */
  function validateTrace(level) {
    return function () {
      const root = U.treeFromLevel(level);
      const t = DSA.tracer();
      const calls = [], badges = {}, states = {};
      const S = (line, msg, cur, vars, extraStates) => {
        const st = Object.assign({}, states);
        calls.forEach((c) => { if (c.n && c.n !== cur && !st[c.n.id]) st[c.n.id] = 'frontier'; });
        if (cur && !st[cur.id]) st[cur.id] = 'active';
        Object.assign(st, extraStates || {});
        t.step(line, msg, {
          view: tv(root, { states: st, badges: Object.assign({}, badges) }),
          vars: Object.assign({ node: N(cur) }, vars),
          aux: [stackRow('call stack', calls.map((c) => `check(${nm(c.n)}, ${inf(c.lo)}, ${inf(c.hi)})`))],
        });
      };
      const check = (node, lo, hi, parent, side) => {
        calls.push({ n: node, lo, hi });
        // raw text: the tracer's JSON copy would turn inf into null
        const vars = { low: { raw: pyInf(lo) }, high: { raw: pyInf(hi) } };
        if (!node) {
          S(['base', 'true'], `Empty ${side} child of ${parent.v}: nothing to break. Return True.`, null, Object.assign(vars, { return: true }));
          calls.pop();
          return true;
        }
        badges[node.id] = `(${inf(lo)},${inf(hi)})`;
        const ok = lo < node.v && node.v < hi;
        if (!ok) {
          states[node.id] = 'bad';
          S(['cmp', 'bad'], `Is ${inf(lo)} < ${node.v} < ${inf(hi)}? No! ${node.v} ${node.v <= lo ? `must be greater than ${inf(lo)}` : `must be less than ${inf(hi)}`}. Return False.`, node, Object.assign(vars, { return: false }));
          calls.pop();
          return false;
        }
        S('cmp', `Is ${inf(lo)} < ${node.v} < ${inf(hi)}? Yes, ${node.v} is inside its window.`, node, vars);
        S('left', `Left subtree must stay below ${node.v}: \`check(${nm(node.left)}, ${inf(lo)}, ${node.v})\`.`, node, vars);
        const L = check(node.left, lo, node.v, node, 'left');
        if (!L) {
          states[node.id] = 'bad';
          S('left', `The left side of ${node.v} returned False, so \`and\` skips the right side. Return False.`, node, Object.assign(vars, { return: false }));
          calls.pop();
          return false;
        }
        S('right', `Left side of ${node.v} is valid. Right subtree must stay above ${node.v}: \`check(${nm(node.right)}, ${node.v}, ${inf(hi)})\`.`, node, vars);
        const R = check(node.right, node.v, hi, node, 'right');
        if (!R) {
          states[node.id] = 'bad';
          S('right', `The right side of ${node.v} returned False. Return False.`, node, Object.assign(vars, { return: false }));
          calls.pop();
          return false;
        }
        states[node.id] = 'visited';
        calls.pop();
        return true;
      };
      calls.push({ n: root, lo: -Infinity, hi: Infinity });
      S('call', `Start at the root with the widest window: (-inf, inf).`, root, { low: { raw: '-inf' }, high: { raw: 'inf' } });
      calls.pop();
      const res = check(root, -Infinity, Infinity, null, 'root');
      const fin = {};
      nodesOf(root).forEach((n) => (fin[n.id] = res ? 'found' : states[n.id] === 'bad' ? 'bad' : 'dim'));
      t.step('call', res ? 'Every node sat inside its window. Return True: this is a valid BST.' : `Return False: not a valid BST. The bad node is deep in the tree, so checking only parent/child pairs would have missed it.`, {
        view: tv(root, { states: fin, badges: Object.assign({}, badges) }), vars: { return: res }, aux: [stackRow('call stack', [])],
      });
      return t.frames;
    };
  }

  const VALIDATE_CODE = `
# TreeNode has .val, .left, .right
def is_valid_bst(root):
    # every node must sit strictly inside (low, high)
    def check(node, low, high):
        if not node:                   # empty subtree is fine  #@base
            return True                #@true
        if not low < node.val < high:  # outside its window  #@cmp
            return False               #@bad
        # left kids < node.val < right kids
        return (check(node.left, low, node.val) and    #@left
                check(node.right, node.val, high))     #@right
    return check(root, float("-inf"), float("inf"))    #@call
`;

  DSA.addAlgo({
    id: 'validate-bst',
    title: 'Validate BST',
    category: 'Trees',
    order: 5,
    tags: ['binary search tree', 'bounds', 'range', 'recursion', 'is valid'],
    summary: 'Pass each node a window `(low, high)` it must fit in. Going left tightens `high` to the parent\'s value; going right tightens `low`. One node outside its window makes the tree invalid.',
    complexity: { time: 'O(n)', space: 'O(h)', note: 'Every node checked once; recursion depth is the height.' },
    legend: { active: 'checking', frontier: 'on call stack', visited: 'subtree valid', bad: 'out of range', found: 'valid' },
    notes: [
      'Comparing a node only with its direct children is the classic bug: a value can be fine for its parent and still break a grandparent\'s rule.',
      'The badge on each node is its window `(low, high)`. Every value must be strictly inside.',
      'Alternative: inorder traversal must be strictly increasing. Keep `prev` and compare as you go.',
    ],
    tips: [
      'Use `float("-inf")` / `float("inf")` for open bounds (or `None` checks). Don\'t use `0` or `2**31` style sentinels.',
      'Ask about duplicates. The strict `<` here rejects them; some versions allow equal values on one side.',
    ],
    problems: ['98. Validate Binary Search Tree', '230. Kth Smallest Element in a BST', '99. Recover Binary Search Tree', '1373. Maximum Sum BST in Binary Tree'],
    input: { default: {} },
    variants: [
      {
        id: 'invalid',
        label: 'Invalid tree',
        summary: 'Pass each node a window `(low, high)` it must fit in. Here 9 is a correct right child of 6, but it sits in 8\'s **left** subtree, so it must be below 8. Only the bounds catch that.',
        code: VALIDATE_CODE,
        trace: validateTrace([8, 3, 10, 1, 6, null, 14, null, null, 4, 9]),
      },
      {
        id: 'valid',
        label: 'Valid tree',
        summary: 'Pass each node a window `(low, high)` it must fit in. Going left tightens `high` to the parent\'s value; going right tightens `low`. Every node fits, so the answer is True.',
        code: VALIDATE_CODE.replace('  #@bad', ''),
        trace: validateTrace([8, 3, 10, 1, 6, null, 14, null, null, 4, 7]),
      },
    ],
  });

  /* =====================================================================
   * Lowest common ancestor
   * ===================================================================== */
  const LCA_BST = [6, 2, 8, 0, 4, 7, 9, 3, 5];
  const LCA_TREE = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4];
  // p / q labels above the nodes (skipped on the root: no room above it)
  const ptrs = (root, o) => {
    const p = {};
    Object.keys(o).forEach((lab) => { const n = o[lab]; if (!n || n === root) return; p[n.id] = p[n.id] ? [].concat(p[n.id], lab) : lab; });
    return p;
  };

  DSA.addAlgo({
    id: 'lca',
    title: 'Lowest Common Ancestor',
    category: 'Trees',
    order: 6,
    tags: ['lca', 'ancestor', 'binary search tree', 'recursion', 'split point'],
    summary: 'The lowest common ancestor of `p` and `q` is the deepest node that has both of them in its subtree (a node counts as its own descendant).',
    complexity: { time: 'O(n)', space: 'O(h)' },
    notes: [
      'A node is its own ancestor: if `q` is under `p`, the answer is `p`.',
      'BST: the LCA is the first node whose value lies between `p` and `q`: the place their paths split.',
      'Plain binary tree: postorder. A node that gets non-None from **both** sides is the answer.',
    ],
    tips: [
      'Say which version you have: BST (use values, O(h), O(1) space) or general tree (O(n)).',
      'With parent pointers it becomes "intersection of two linked lists": walk up from both.',
    ],
    problems: ['235. LCA of a Binary Search Tree', '236. LCA of a Binary Tree', '1650. LCA of a Binary Tree III', '1644. LCA of a Binary Tree II'],
    variants: [
      {
        id: 'bst',
        label: 'BST',
        file: 'lca_bst',
        summary: 'In a BST, compare values. If `p` and `q` are both smaller than the node, go left; both bigger, go right. Otherwise they split here, so this node is the LCA.',
        complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(n)' }, space: 'O(1)', note: 'O(h) steps down one path.' },
        legend: { active: 'node', visited: 'passed', found: 'LCA' },
        input: {
          default: { p: 3, q: 5 },
          random: () => { const a = U.shuffle(LCA_BST); return { p: a[0], q: a[1] }; },
          fields: [{ key: 'p', label: 'p', type: 'number' }, { key: 'q', label: 'q', type: 'number' }],
        },
        code: `
# TreeNode has .val, .left, .right
def lca_bst(root, p, q):
    node = root                                    #@init
    while node:                                    #@loop
        if p.val < node.val and q.val < node.val:  #@small
            node = node.left      # both on the left  #@left
        elif p.val > node.val and q.val > node.val:  #@big
            node = node.right     # both on the right  #@right
        else:
            return node           # paths split here  #@found
`,
        trace(inp) {
          const P = Number(inp.p), Q = Number(inp.q);
          if (!LCA_BST.includes(P) || !LCA_BST.includes(Q)) throw new Error('p and q must be values in the tree: ' + LCA_BST.slice().sort((a, b) => a - b).join(', '));
          const root = U.bstFrom(LCA_BST);
          const find = (v) => nodesOf(root).find((n) => n.v === v);
          const p = find(P), q = find(Q);
          const t = DSA.tracer();
          const path = [];
          let node = root;
          const S = (line, msg, st, extra) => {
            const states = pathStates(path, node, st);
            t.step(line, msg, {
              view: tv(root, { states, pointers: ptrs(root, { p, q }) }),
              vars: Object.assign({ 'p.val': P, 'q.val': Q, node: N(node) }, extra || {}),
            });
          };
          S('init', `Start at the root, ${root.v}. Looking for the split point of ${P} and ${Q}.`);
          while (node) {
            S('loop', `\`node\` is ${node.v}, not None: keep going.`);
            const small = P < node.v && Q < node.v;
            S('small', `Both smaller than ${node.v}? ${P} < ${node.v} ${P < node.v ? 'yes' : 'no'}, ${Q} < ${node.v} ${Q < node.v ? 'yes' : 'no'}.`, 'compare');
            if (small) {
              path.push(node);
              node = node.left;
              S('left', `Both are in the left subtree. Move to ${node.v}.`);
              continue;
            }
            const big = P > node.v && Q > node.v;
            S('big', `Both bigger than ${node.v}? ${P} > ${node.v} ${P > node.v ? 'yes' : 'no'}, ${Q} > ${node.v} ${Q > node.v ? 'yes' : 'no'}.`, 'compare');
            if (big) {
              path.push(node);
              node = node.right;
              S('right', `Both are in the right subtree. Move to ${node.v}.`);
              continue;
            }
            S('found', node.v === P || node.v === Q ? `${node.v} is one of the targets and the other is below it. Return ${node.v}.` : `${P} and ${Q} go different ways at ${node.v}. It is the lowest common ancestor. Return ${node.v}.`, 'found', { return: N(node) });
            break;
          }
          return t.frames;
        },
      },
      {
        id: 'binary-tree',
        label: 'Binary tree',
        file: 'lca',
        summary: 'For any binary tree: each call returns `p` or `q` if it finds one in its subtree, else None. The first node that gets a non-None answer from **both** sides is the LCA.',
        complexity: { time: 'O(n)', space: 'O(h)', note: 'May visit every node; recursion depth is the height.' },
        legend: { active: 'current call', frontier: 'on call stack', visited: 'returned', found: 'LCA' },
        input: {
          default: { p: 6, q: 4 },
          random: () => { const a = U.shuffle(LCA_TREE.filter((v) => v != null)); return { p: a[0], q: a[1] }; },
          fields: [{ key: 'p', label: 'p', type: 'number' }, { key: 'q', label: 'q', type: 'number' }],
        },
        code: `
# TreeNode has .val, .left, .right
def lca(root, p, q):
    if not root or root is p or root is q:  #@base
        return root        # None, or one of the targets  #@ret
    left = lca(root.left, p, q)             #@left
    right = lca(root.right, p, q)           #@right
    if left and right:     # one target on each side  #@both
        return root        # so root is the LCA  #@split
    return left or right   # pass up what was found  #@pass
`,
        trace(inp) {
          const vals = LCA_TREE.filter((v) => v != null);
          const P = Number(inp.p), Q = Number(inp.q);
          if (!vals.includes(P) || !vals.includes(Q)) throw new Error('p and q must be values in this tree: ' + vals.slice().sort((a, b) => a - b).join(', '));
          const root = U.treeFromLevel(LCA_TREE);
          const find = (v) => nodesOf(root).find((n) => n.v === v);
          const p = find(P), q = find(Q);
          const t = DSA.tracer();
          const calls = [], badges = {}, states = {};
          const S = (line, msg, cur, vars, fin) => {
            const st = Object.assign({}, states);
            calls.forEach((c) => { if (c.n && c.n !== cur) st[c.n.id] = 'frontier'; });
            if (cur) st[cur.id] = 'active';
            if (fin) st[fin.id] = 'found';
            t.step(line, msg, {
              view: tv(root, { states: st, badges: Object.assign({}, badges), pointers: ptrs(root, { p, q }) }),
              vars: Object.assign({ root: N(cur), p: N(p), q: N(q) }, vars || {}),
              aux: [stackRow('call stack', calls.map((c) => `lca(${nm(c.n)})` + (c.left !== undefined && c.right === undefined ? ` left=${nm(c.left)}` : '')))],
            });
          };
          const rec = (node, parent, side) => {
            const fr = { n: node };
            calls.push(fr);
            if (!node) {
              S(['base', 'ret'], `Empty ${side} child of ${parent.v}: return None.`, null, { return: null });
              calls.pop();
              return null;
            }
            if (node === p || node === q) {
              badges[node.id] = '↑' + node.v;
              states[node.id] = 'visited';
              S(['base', 'ret'], `${node.v} is ${node === p ? 'p' : 'q'}. Return it; no need to look below.`, node, { return: N(node) });
              calls.pop();
              return node;
            }
            S('left', `${node.v} is not a target. Search left: \`lca(${nm(node.left)})\`.`, node);
            fr.left = rec(node.left, node, 'left');
            S('right', `Back in ${node.v}: left = ${nm(fr.left)}. Search right: \`lca(${nm(node.right)})\`.`, node, { left: N(fr.left) });
            fr.right = rec(node.right, node, 'right');
            const vars = { left: N(fr.left), right: N(fr.right) };
            if (fr.left && fr.right) {
              badges[node.id] = '↑' + node.v;
              states[node.id] = 'found';
              S(['both', 'split'], `left = ${fr.left.v} and right = ${fr.right.v}: one target on each side. ${node.v} is the LCA; return it.`, node, Object.assign(vars, { return: N(node) }), node);
              calls.pop();
              return node;
            }
            const r = fr.left || fr.right;
            states[node.id] = 'visited';
            if (r) badges[node.id] = '↑' + r.v;
            S('pass', `left = ${nm(fr.left)}, right = ${nm(fr.right)}: not both. Return ${r ? r.v : 'None'} to ${parent ? parent.v : 'the caller'}.`, node, Object.assign(vars, { return: N(r) }));
            calls.pop();
            return r;
          };
          const ans = rec(root, null, 'root');
          const st = Object.assign({}, states);
          st[ans.id] = 'found';
          t.step('pass', `Answer: ${ans.v}. Both ${p.v} and ${q.v} are in its subtree, and no lower node has both.`, {
            view: tv(root, { states: st, badges: Object.assign({}, badges), pointers: ptrs(root, { p, q }) }),
            vars: { p: N(p), q: N(q), return: N(ans) }, aux: [stackRow('call stack', [])],
          });
          return t.frames;
        },
      },
    ],
  });
})();
