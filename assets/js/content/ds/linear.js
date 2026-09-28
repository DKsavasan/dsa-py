/* Data Structures · Linear (stack, queue/deque, heap, matrix) */
(function () {

  /* -------------------------------------------------------------- stack */
  DSA.addDS({
    id: 'stack',
    title: 'Stack',
    category: 'Linear',
    order: 1,
    tags: ['stack', 'lifo', 'push', 'pop', 'monotonic stack', 'parentheses'],
    summary: 'Last in, first out (LIFO). In Python a plain list is the stack: `append` pushes onto the top (the right end), `pop` takes it back off, `x[-1]` peeks. All O(1).',
    ops: [
      { op: 'stack.append(x)', time: 'O(1)', note: 'push; amortized' },
      { op: 'stack.pop()', time: 'O(1)', note: 'IndexError if empty' },
      { op: 'stack[-1]', time: 'O(1)', note: 'peek' },
      { op: 'if stack:  /  len(stack)', time: 'O(1)' },
      { op: 'x in stack', time: 'O(n)', note: 'a stack is for the top only' },
    ],
    space: 'O(n)',
    complexity: { time: {"Push": "O(1)", "Pop": "O(1)", "Peek": "O(1)", "Search": "O(n)"}, space: 'O(n)' },
    visual: { type: 'stack', items: [2, 7, 4, { v: 9, s: 'new' }], title: 'stack' },
    visualCaption: '`stack = [2, 7, 4]`, then `stack.append(9)` puts 9 on top. `stack[-1]` peeks at 9; `stack.pop()` removes it again.',
    code: `
from collections import deque

# --- create ---
stack = []                  # a plain list is the stack
stack = [2, 7, 4]           # bottom ... top (right end)

# --- push ---
stack.append(9)             # onto the top, O(1)

# --- peek ---
stack[-1]                   # 9, top without removing
# stack[-1] on an empty list raises IndexError

# --- pop ---
stack.pop()                 # 9, remove + return top, O(1)

# --- check ---
if stack:                   # non-empty list is truthy
    top = stack[-1]         # safe peek
len(stack)                  # 3
not stack                   # False; True when empty

# --- deque works too (same right-end API) ---
d = deque([2, 7, 4])        # also O(1) at the left end
d.append(9)                 # push
d.pop()                     # 9

# --- pattern: matching brackets ---
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}  # close -> open
    st = []                         # unmatched openers
    for ch in s:
        if ch in pairs:             # a closing bracket
            if not st or st.pop() != pairs[ch]:
                return False        # no opener or wrong one
        else:
            st.append(ch)           # an opener: push it
    return not st                   # all openers closed?

# --- pattern: monotonic stack (next greater) ---
def next_greater(nums):
    res = [-1] * len(nums)          # -1 = nothing greater
    st = []                         # indices; values drop
    for i, x in enumerate(nums):
        while st and nums[st[-1]] < x:  # x beats the top
            res[st.pop()] = x       # so x is its answer
        st.append(i)                # wait for a bigger one
    return res
`,
    notes: [
      'LIFO: the last item pushed is the first popped. The right end of a list is the top.',
      'Uses: undo, iterative DFS, matching brackets, evaluating expressions, backtracking state.',
      '**Monotonic stack**: keep items in increasing (or decreasing) order and pop while the new item breaks it. Each index is pushed and popped once, so O(n) total. Answers "next greater / smaller element".',
      'Recursion uses the call stack. Swap in an explicit list to avoid `RecursionError` (limit ~1000).',
    ],
    tips: [
      'Always check `if stack` before `stack[-1]` or `stack.pop()`.',
      'Push indices, not values, when you need distances or widths (Daily Temperatures, Largest Rectangle).',
    ],
    problems: ['20. Valid Parentheses', '155. Min Stack', '739. Daily Temperatures', '150. Evaluate Reverse Polish Notation', '496. Next Greater Element I', '84. Largest Rectangle in Histogram'],
  });

  /* ------------------------------------------------------ queue & deque */
  DSA.addDS({
    id: 'queue-deque',
    title: 'Queue & Deque',
    category: 'Linear',
    order: 2,
    tags: ['queue', 'deque', 'fifo', 'bfs', 'popleft', 'appendleft', 'double-ended queue', 'sliding window'],
    file: 'queue_deque',
    summary: 'A queue is first in, first out (FIFO). Use `collections.deque`: O(1) adds and removes at **both** ends. `append` + `popleft` is a queue (every BFS); a list would pay O(n) for `pop(0)`.',
    ops: [
      { op: 'q.append(x)  /  q.appendleft(x)', time: 'O(1)' },
      { op: 'q.pop()  /  q.popleft()', time: 'O(1)', note: 'IndexError if empty' },
      { op: 'q[0]  /  q[-1]', time: 'O(1)', note: 'peek front / back' },
      { op: 'q[i]', time: 'O(n)', note: 'O(1) near the ends, slow in the middle' },
      { op: 'q.rotate(k)', time: 'O(k)' },
      { op: 'x in q  /  q.remove(x)', time: 'O(n)' },
      { op: 'list.pop(0)  /  list.insert(0, x)', time: 'O(n)', note: 'shifts every item: why deque exists' },
    ],
    space: 'O(n)',
    complexity: { time: {"Append (either end)": "O(1)", "Pop (either end)": "O(1)", "Peek": "O(1)", "Index middle": "O(n)"}, space: 'O(n)' },
    visuals: [
      {
        type: 'array',
        title: 'both ends are O(1)',
        rows: [
          {
            label: 'add',
            items: [null, 3, 5, 8, 2, null],
            pointers: [{ i: 0, label: 'appendleft', s: 'frontier' }, { i: 5, label: 'append', s: 'frontier' }],
            showIndex: false,
          },
          {
            label: 'remove',
            items: [null, 3, 5, 8, 2, null],
            states: [null, 'active', null, null, 'active', null],
            pointers: [{ i: 1, label: 'popleft' }, { i: 4, label: 'pop' }],
            showIndex: false,
          },
        ],
      },
      {
        type: 'array',
        title: 'maxlen 3: appending 6 drops 5',
        rows: [
          { label: 'before', items: [5, 8, 2], states: ['removed'], showIndex: false },
          { label: 'after', items: [8, 2, 6], states: [null, null, 'new'], showIndex: false },
        ],
      },
    ],
    visualCaption: 'The dashed slots show where `appendleft` and `append` land; `popleft` and `pop` take from the ends (`q[0]` and `q[-1]` peek at them). With `maxlen=3`, appending to a full deque silently drops the item at the other end.',
    code: `
from collections import deque

# --- create ---
q = deque()                 # empty
q = deque([3, 5, 8])        # from an iterable; left = front
w = deque(maxlen=3)         # bounded: keeps the last 3

# --- add ---
q.append(2)                 # to the back (right), O(1)
q.appendleft(1)             # to the front (left), O(1)
q.extend([4, 6])            # many to the back
q.extendleft([0])           # many to the front

# --- peek ---
q[0]                        # 0, front
q[-1]                       # 6, back

# --- remove ---
q.popleft()                 # 0, dequeue from the front
q.popleft()                 # 1
q.pop()                     # 6, from the back
q.remove(8)                 # first 8, O(n)

# --- check ---
len(q)                      # 4 -> deque([3, 5, 2, 4])
if q:                       # empty deque is falsy
    front = q[0]            # safe peek

# --- rotate ---
r = deque([1, 2, 3, 4])
r.rotate(1)                 # deque([4, 1, 2, 3])
r.rotate(-1)                # deque([1, 2, 3, 4]) again

# --- sliding window with maxlen ---
for x in [5, 8, 2, 6]:
    w.append(x)             # when full, oldest drops off
list(w)                     # [8, 2, 6], the last 3

# --- why not a list? ---
xs = [1, 2, 3]
xs.pop(0)                   # works, but O(n): shifts all

# --- BFS: the classic queue ---
graph = {"a": ["b", "c"], "b": ["d"], "c": [], "d": []}
q = deque(["a"])            # start node
seen = {"a"}                # mark when you enqueue
while q:                    # until nothing is waiting
    node = q.popleft()      # oldest first (FIFO)
    for nb in graph[node]:  # each neighbour
        if nb not in seen:  # not queued before
            seen.add(nb)    # mark it now
            q.append(nb)    # visit it later
`,
    notes: [
      'FIFO queue: `append` to enqueue, `popleft` to dequeue. That is every BFS.',
      '`deque` is a doubly linked list of fixed-size blocks: both ends are O(1), indexing the middle is O(n).',
      '`deque(maxlen=k)` keeps only the last k items. Great for "last k events" windows.',
      '`queue.Queue` adds thread locking. In interviews use `deque`.',
    ],
    tips: [
      'Mark nodes as seen when you **enqueue** them, not when you dequeue, or the same node gets queued twice.',
      'Sliding window max: a deque of indices with decreasing values. Pop smaller values off the back, expired indices off the front.',
    ],
    problems: ['933. Number of Recent Calls', '102. Binary Tree Level Order Traversal', '994. Rotting Oranges', '239. Sliding Window Maximum', '641. Design Circular Deque', '232. Implement Queue using Stacks'],
  });

  /* --------------------------------------------------------------- heap */
  // Visual helpers: a heap list drawn as a tree (with index badges) and as an array.
  function heapTree(arr, opt) {
    opt = opt || {};
    const lab = opt.label || ((v) => v);
    const ids = arr.map((v, i) => 'h' + i);
    const mk = (i) => (i < arr.length ? { id: ids[i], v: lab(arr[i], i), left: mk(2 * i + 1), right: mk(2 * i + 2) } : null);
    const states = {}, badges = {}, pointers = {};
    arr.forEach((_, i) => (badges[ids[i]] = String(i)));
    Object.keys(opt.states || {}).forEach((i) => (states[ids[i]] = opt.states[i]));
    Object.keys(opt.pointers || {}).forEach((i) => (pointers[ids[i]] = opt.pointers[i]));
    return { type: 'tree', title: opt.title, root: mk(0), states, badges, pointers };
  }
  function heapArray(arr, opt) {
    opt = opt || {};
    return { type: 'array', title: opt.title, rows: [{ label: opt.name || 'h', items: arr.map(opt.label || ((v) => v)), states: opt.states, pointers: opt.arrPointers || [] }] };
  }
  const idxStates = { 0: 'compare', 1: 'active', 3: 'frontier', 4: 'frontier' };
  const idxPointers = [
    { i: 0, label: 'parent', s: 'compare' },
    { i: 1, label: 'i' },
    { i: 3, label: '2i+1', s: 'frontier' },
    { i: 4, label: '2i+2', s: 'frontier' },
  ];

  const minHeap = [1, 4, 3, 7, 5, 8, 6];
  const maxStored = [-9, -7, -8, -3, -5, -2, -4];
  const pq = [[1, 1, 'fix'], [1, 3, 'run'], [3, 2, 'nap'], [2, 0, 'eat'], [2, 4, 'mail']];
  const tup = (t) => `${t[0]},${t[1]},${t[2]}`;

  const HEAP_NOTES = [
    'Stored as a plain list. For index `i`: children are `2i+1` and `2i+2`, parent is `(i-1)//2`.',
    'Only `h[0]` is guaranteed. `h[1]` is not the second smallest, and the list is not sorted.',
    '`heapify` is O(n), cheaper than n pushes (O(n log n)).',
    'No decrease-key: push the new entry and skip stale ones when they pop (lazy deletion).',
  ];

  DSA.addDS({
    id: 'heap',
    title: 'Heap / Priority Queue',
    category: 'Linear',
    order: 3,
    tags: ['heap', 'heapq', 'priority queue', 'min-heap', 'max-heap', 'top k', 'binary heap', 'heapify'],
    summary: 'A list kept in heap order: every parent is ≤ its children, so the smallest item is always `h[0]`. `heapq` pushes and pops in O(log n). Use it whenever you repeatedly need the current minimum (top k, scheduling, Dijkstra).',
    ops: [
      { op: 'heapq.heapify(h)', time: 'O(n)', note: 'in place' },
      { op: 'heapq.heappush(h, x)', time: 'O(log n)', note: 'sift up' },
      { op: 'heapq.heappop(h)', time: 'O(log n)', note: 'sift down; IndexError if empty' },
      { op: 'h[0]', time: 'O(1)', note: 'peek the smallest' },
      { op: 'heappushpop  /  heapreplace', time: 'O(log n)', note: 'push + pop in one sift' },
      { op: 'heapq.nlargest(k, xs)', time: 'O(n log k)', note: 'also nsmallest' },
      { op: 'x in h  /  remove any item', time: 'O(n)', note: 'a heap only knows its top' },
    ],
    space: 'O(n)',
    complexity: { time: {"Peek min": "O(1)", "Push": "O(log n)", "Pop": "O(log n)", "Heapify": "O(n)"}, space: 'O(n)' },
    notes: HEAP_NOTES,
    tips: [
      'Top k largest: keep a **min**-heap of size k and pop when it grows past k. O(n log k).',
      'Two heaps (a max-heap for the low half, a min-heap for the high half) give a running median.',
    ],
    problems: ['215. Kth Largest Element in an Array', '703. Kth Largest Element in a Stream', '347. Top K Frequent Elements', '23. Merge k Sorted Lists', '295. Find Median from Data Stream', '1046. Last Stone Weight'],
    variants: [
      {
        id: 'min-heap',
        label: 'Min-heap',
        summary: 'A list kept in heap order: every parent is ≤ its children, so the smallest item is always `h[0]`. `heapq` pushes and pops in O(log n). Use it whenever you repeatedly need the current minimum.',
        visuals: [
          heapTree(minHeap, { title: 'tree view (badge = list index)', states: idxStates }),
          heapArray(minHeap, { title: 'the list heapq actually stores', states: idxStates, arrPointers: idxPointers }),
        ],
        notes: ['The tree is only a way to read the list. Node `i = 1` (value 4) has children at `2i+1 = 3` and `2i+2 = 4`, and its parent is at `(i-1)//2 = 0`. Every parent is ≤ its children.'].concat(HEAP_NOTES),
        code: `
import heapq

# --- create ---
h = []                      # a heap is just a list
h = [5, 7, 8, 1, 4, 3, 6]
heapq.heapify(h)            # in place, O(n): [1, 4, 3, ...]

# --- add ---
heapq.heappush(h, 2)        # O(log n), sifts up

# --- peek ---
h[0]                        # 1, smallest; IndexError if empty

# --- remove ---
heapq.heappop(h)            # 1, pops the smallest, O(log n)
# push x then pop smallest, in one sift
heapq.heappushpop(h, 0)     # 0: x itself if x <= h[0]
# pop smallest then push x; size stays the same
heapq.heapreplace(h, 9)     # 2

# --- top k from a list ---
nums = [5, 1, 9, 3, 7]
heapq.nlargest(2, nums)     # [9, 7]
heapq.nsmallest(2, nums)    # [1, 3]
heapq.nlargest(1, ["aa", "b"], key=len)  # ['aa']

# --- k largest with a size-k min-heap ---
top = []                    # best k seen so far
for x in nums:
    heapq.heappush(top, x)  # add the new item
    if len(top) > 2:        # more than k = 2 items:
        heapq.heappop(top)  # drop the smallest
top[0]                      # 7, the 2nd largest

# --- index math (0-based) ---
i = 1
2 * i + 1, 2 * i + 2        # (3, 4): children of i
(i - 1) // 2                # 0: parent of i
`,
      },
      {
        id: 'max-heap',
        label: 'Max-heap',
        summary: '`heapq` only does min-heaps. For a max-heap, store `-x`: the smallest `-x` is the largest `x`. Negate again when you read it back.',
        visuals: [
          heapTree([9, 7, 8, 3, 5, 2, 4], { title: 'what you mean: a max-heap', states: { 0: 'max' } }),
          heapArray(maxStored, { title: 'what heapq stores: a min-heap of negatives', states: { 0: 'max' }, arrPointers: [{ i: 0, label: '-h[0] = 9', s: 'max' }] }),
        ],
        code: `
import heapq

# heapq is min-only: store -x to get a max-heap
# --- create ---
nums = [3, 9, 2, 7, 5, 8, 4]
h = [-x for x in nums]      # negate every value
heapq.heapify(h)            # min of -x = max of x

# --- add ---
heapq.heappush(h, -6)       # push -x

# --- peek ---
-h[0]                       # 9, the largest; negate back

# --- remove ---
-heapq.heappop(h)           # 9, pops the largest

# --- tuples: negate only the sort key ---
freq = {"a": 3, "b": 5}
h = [(-cnt, w) for w, cnt in freq.items()]
heapq.heapify(h)            # most frequent on top
cnt, w = heapq.heappop(h)   # (-5, 'b')
-cnt, w                     # (5, 'b')

# --- k smallest with a size-k max-heap ---
top = []                    # negated, size <= 3
for x in nums:
    heapq.heappush(top, -x) # store -x
    if len(top) > 3:        # more than k = 3 items:
        heapq.heappop(top)  # drop the largest x
sorted(-y for y in top)     # [2, 3, 4], the 3 smallest
`,
        notes: [
          'Push `-x`, pop and negate. `-h[0]` is the largest value. The same trick works on tuples: negate only the part you sort by, e.g. `(-count, word)`.',
          'Negation only works for numbers. For strings, wrap them in a class with a reversed `__lt__`.',
          'Python 3.14 adds `heapq.heappush_max`, `heappop_max` and `heapify_max`. Negation works on every version.',
          'Keep the sign straight: push `-x`, read `-h[0]`, pop `-heappop(h)`.',
        ],
      },
      {
        id: 'priority-tuples',
        label: 'Priority tuples',
        summary: 'Push tuples `(priority, count, item)`. Tuples compare left to right, so the lowest priority pops first; the unique counter breaks ties in insertion order and stops Python from ever comparing the items.',
        visuals: [
          heapTree(pq, { title: 'tree view: (priority, count, item)', label: tup, states: { 0: 'active', 1: 'compare' } }),
          heapArray(pq, { title: 'the list heapq actually stores', label: tup, name: 'pq', states: { 0: 'active', 1: 'compare' }, arrPointers: [{ i: 0, label: 'pops first' }] }),
        ],
        code: `
import heapq
from itertools import count

# --- create ---
pq = []                     # heap of (priority, n, item)
tie = count()               # 0, 1, 2, ...: unique tie-breaker

# --- add ---
def push(item, priority):
    # lower number = served first
    heapq.heappush(pq, (priority, next(tie), item))

push("eat", 2)              # (2, 0, 'eat')
push("fix", 1)              # (1, 1, 'fix')
push("nap", 3)              # (3, 2, 'nap')
push("run", 1)              # (1, 3, 'run'): ties with fix
push("mail", 2)             # (2, 4, 'mail')

# --- peek ---
pq[0][2]                    # 'fix'

# --- remove ---
prio, _, item = heapq.heappop(pq)  # (1, 1, 'fix')
heapq.heappop(pq)[2]        # 'run': same priority, later n

# --- why the counter? ---
# on equal priorities Python compares the next field;
# (1, {"a": 1}) < (1, {"b": 2}) raises TypeError
# (1, 0, {"a": 1}) < (1, 1, {"b": 2}) is fine: 0 < 1

# --- Dijkstra style: (distance, node) ---
dist_heap = [(0, "A")]      # start at distance 0
d, node = heapq.heappop(dist_heap)  # closest first
`,
        notes: [
          '`fix` and `run` both have priority 1. The counter decides: `fix` (1) was pushed before `run` (3), so it pops first.',
          'Tuples compare item by item: priority first, then the counter. The item itself is never compared because counters are unique.',
          'Without a counter, equal priorities compare the items: fine for strings and ints, a TypeError for dicts or custom nodes.',
          'To change a priority, push a new tuple and ignore stale ones on pop (keep a `removed` set or check a `dist` dict).',
          'For `(dist, node)` in Dijkstra the node is usually an int or str, so no counter is needed.',
        ],
      },
    ],
  });

  /* ------------------------------------------------------------- matrix */
  const grid = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
  ];
  const sq = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  const rot = [[7, 4, 1], [8, 5, 2], [9, 6, 3]];

  DSA.addDS({
    id: 'matrix',
    title: '2D Grid / Matrix',
    category: 'Linear',
    order: 4,
    tags: ['matrix', 'grid', '2d array', 'neighbors', 'neighbours', 'directions', 'transpose', 'rotate', 'zip'],
    summary: 'A list of rows: `m[r][c]` is row `r`, column `c`. Most grid problems are "visit each cell and look at its 4 neighbours", so learn the create, bounds-check and `DIRS` idioms by heart.',
    ops: [
      { op: 'm[r][c]  /  m[r][c] = v', time: 'O(1)' },
      { op: '[[0] * C for _ in range(R)]', time: 'O(R·C)' },
      { op: 'visit every cell', time: 'O(R·C)' },
      { op: 'neighbours of one cell', time: 'O(1)', note: '4 (or 8) bounds checks' },
      { op: 'zip(*m)', time: 'O(R·C)', note: 'transpose' },
      { op: '[row[:] for row in m]', time: 'O(R·C)', note: 'copy' },
    ],
    space: 'O(R·C)',
    complexity: { time: {"Access": "O(1)", "Neighbours": "O(1)", "Scan all": "O(R·C)", "Transpose / rotate": "O(R·C)"}, space: 'O(R·C)' },
    visuals: [
      {
        type: 'grid',
        title: 'cell (1, 2) and its 4 neighbours',
        cells: grid,
        rowLabels: [0, 1, 2, 3],
        colLabels: [0, 1, 2, 3, 4],
        states: { '1,2': 'active', '0,2': 'frontier', '2,2': 'frontier', '1,1': 'frontier', '1,3': 'frontier', r1: 'active', c2: 'active' },
      },
      { type: 'grid', title: 'original 3 × 3', cells: sq, states: { '2,0': 'active', '1,0': 'read', '0,0': 'read' } },
      { type: 'grid', title: 'rotated 90° clockwise', cells: rot, states: { '0,0': 'active', '0,1': 'read', '0,2': 'read' } },
    ],
    visualCaption: 'Neighbours are `(r-1, c)`, `(r+1, c)`, `(r, c-1)`, `(r, c+1)`; skip any outside `0 <= r < R` and `0 <= c < C`. Rotating clockwise turns the first column, read bottom-up, into the first row.',
    code: `
import copy

# --- create ---
R, C = 3, 4                 # rows, cols
m = [[0] * C for _ in range(R)]  # R independent rows
# WRONG: [[0] * C] * R repeats ONE row R times
m = [[1, 2, 3, 4],          # literal, row by row
     [5, 6, 7, 8],
     [9, 10, 11, 12]]

# --- read / write ---
R, C = len(m), len(m[0])    # 3 rows, 4 cols
m[1][2]                     # 7: row 1, col 2
m[-1][-1]                   # 12, bottom-right
m[1][2] = 70                # write one cell

# --- iterate ---
for r in range(R):          # row by row
    for c in range(C):      # then across the row
        m[r][c]             # visit cell (r, c)
for row in m:               # rows directly
    sum(row)                # e.g. row sums
col2 = [row[2] for row in m]  # one column: [3, 70, 11]
for col in zip(*m):         # columns as tuples
    sum(col)                # e.g. column sums

# --- 4-direction neighbours ---
DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]  # up down left right
r, c = 1, 2
for dr, dc in DIRS:
    nr, nc = r + dr, c + dc           # candidate cell
    if 0 <= nr < R and 0 <= nc < C:   # inside the grid?
        m[nr][nc]                     # safe to use

# --- transform ---
t = [list(col) for col in zip(*m)]     # transpose: C x R
cw = [list(r) for r in zip(*m[::-1])]  # rotate 90 clockwise
ccw = [list(r) for r in zip(*m)][::-1]  # 90 counter-clockwise
flat = [x for row in m for x in row]   # flatten, row by row

# --- copy ---
alias = m                   # same object, not a copy
shallow = m[:]              # new outer list, SAME rows
deep = [row[:] for row in m]  # new rows: safe to edit
deep = copy.deepcopy(m)     # works for any nesting
`,
    notes: [
      '`[[0] * C] * R` makes R references to one row: writing `m[0][0]` changes every row. Always use a comprehension.',
      '`zip(*m)` unpacks the rows as arguments, so it walks the columns. Wrap in `list` to get lists, not tuples.',
      'Cell `(r, c)` flattens to index `r * C + c`; back again with `divmod(i, C)`.',
      'For 8 directions add the diagonals: `(-1, -1), (-1, 1), (1, -1), (1, 1)`.',
    ],
    tips: [
      'In-place rotate of an n × n matrix: transpose (swap `m[i][j]` and `m[j][i]` for `j > i`), then reverse each row.',
      'Grid BFS/DFS: mark cells visited (a set of `(r, c)`, or overwrite the cell) before you push them.',
      'Get `R` and `C` once at the top, and guard for an empty grid: `if not m or not m[0]`.',
    ],
    problems: ['200. Number of Islands', '48. Rotate Image', '54. Spiral Matrix', '73. Set Matrix Zeroes', '994. Rotting Oranges', '867. Transpose Matrix'],
  });
})();
