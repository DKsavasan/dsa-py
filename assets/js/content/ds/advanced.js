/* Data Structures · Advanced (segment tree, Fenwick tree, LRU cache) */
(function () {
  const NUMS = [5, 3, 7, 1, 4, 6, 2, 8];

  /* ---------- segment tree (iterative, t[1] = root, leaves at n..2n-1) ---------- */
  const n = NUMS.length;
  const t = new Array(2 * n).fill(0);
  NUMS.forEach((x, i) => (t[n + i] = x));
  for (let i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];
  const lo = (i) => { while (i < n) i *= 2; return i - n; };
  const hi = (i) => { while (i < n) i = 2 * i + 1; return i - n; };
  const rangeOf = (i) => (i >= n ? String(i - n) : `${lo(i)}-${hi(i)}`);
  const segNode = (i) => (i >= 2 * n ? null : { id: 't' + i, v: t[i], left: segNode(2 * i), right: segNode(2 * i + 1) });
  const TAKEN = [5, 6, 14]; // nodes summed by query(2, 7)
  const segBadges = {};
  for (let i = 1; i < n; i++) segBadges['t' + i] = rangeOf(i); // leaves: see the nums row
  const segStates = {};
  TAKEN.forEach((i) => (segStates['t' + i] = 'found'));

  DSA.addDS({
    id: 'segment-tree',
    title: 'Segment Tree',
    category: 'Advanced',
    order: 1,
    tags: ['range query', 'range sum', 'range min', 'point update', 'interval tree'],
    summary: 'A binary tree over an array where each node stores the answer (sum, min, max) for one range. Any range splits into O(log n) nodes, so both range queries and point updates are O(log n).',
    ops: [
      { op: 'SegTree(nums)', time: 'O(n)', note: 'build parents bottom-up' },
      { op: 'update(i, val)', time: 'O(log n)', note: 'fix the leaf, then each ancestor' },
      { op: 'query(l, r)', time: 'O(log n)', note: 'half-open [l, r)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Build": "O(n)", "Point update": "O(log n)", "Range query": "O(log n)"}, space: 'O(n)' },
    visuals: [
      {
        type: 'tree',
        title: 'node = range sum, badge = range',
        levelGap: 62,
        root: segNode(1),
        states: segStates,
        badges: segBadges,
      },
      {
        type: 'array',
        title: 'nums and the flat array t',
        rows: [
          { label: 'nums', items: NUMS, ranges: [{ l: 2, r: 6, label: 'query(2, 7) = 20' }], states: { 2: 'read', 3: 'read', 4: 'read', 5: 'read', 6: 'read' } },
          { label: 't[i]', items: t.slice(0, n).map((x, i) => (i === 0 ? null : x)), states: { 5: 'found', 6: 'found' } },
          { label: 't[8+i]', items: t.slice(n), states: { 6: 'found' } },
        ],
      },
    ],
    legend: { found: 'summed', read: 'in range' },
    visualCaption: '`query(2, 7)` needs indices 2..6. It adds just three nodes: `t[5]` (2-3) + `t[6]` (4-5) + `t[14]` (6) = 8 + 10 + 2 = 20. `update(i)` changes one leaf and its log n ancestors.',
    code: `
# --- create ---
class SegTree:
    def __init__(self, nums):
        self.n = n = len(nums)
        self.t = [0] * (2 * n)          # t[1] is the root
        self.t[n:] = nums               # leaves at n .. 2n-1
        for i in range(n - 1, 0, -1):   # parents, bottom-up
            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]

    # --- point update: nums[i] = val ---
    def update(self, i, val):
        i += self.n                     # jump to the leaf
        self.t[i] = val
        while i > 1:
            i //= 2                     # climb to the parent
            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]

    # --- range query: sum(nums[l:r]), r exclusive ---
    def query(self, l, r):
        res = 0
        l, r = l + self.n, r + self.n   # leaf positions
        while l < r:
            if l & 1:                   # l's parent pokes out
                res += self.t[l]        # left: take l alone
                l += 1
            if r & 1:                   # same on the right:
                r -= 1                  # take r-1 alone
                res += self.t[r]
            l, r = l // 2, r // 2       # up one level
        return res

# --- use ---
st = SegTree([5, 3, 7, 1, 4, 6, 2, 8])
st.query(2, 7)                  # 7+1+4+6+2 = 20
st.update(3, 10)                # nums[3]: 1 -> 10
st.query(0, 8)                  # 45
# min instead of sum: swap + for min, 0 for inf
`,
    notes: [
      'Each node covers a range; the root covers everything and the leaves are single elements. Any query range splits into at most ~2 log n nodes.',
      'Iterative layout: `t[1]` is the root, the kids of `i` are `2i` and `2i+1`, leaves sit at `n..2n-1`. Size 2n. The recursive version uses 4n.',
      'Works for any associative op: sum, min, max, gcd. Swap `+` and the identity (`0` for sum, `inf` for min).',
      'No updates? A prefix-sum array answers range sums in O(1). Range **updates** need lazy propagation (recursive version).',
    ],
    tips: [
      'Half-open `[l, r)` keeps the loop clean. For inclusive `r`, call `query(l, r + 1)`.',
      'Only need prefix sums with point updates? A Fenwick tree is less code.',
    ],
    problems: ['307. Range Sum Query - Mutable', '315. Count of Smaller Numbers After Self', '699. Falling Squares', '732. My Calendar III', '218. The Skyline Problem'],
  });

  /* ---------- Fenwick tree ---------- */
  const bit = [0];
  for (let i = 1; i <= n; i++) {
    const low = i & -i;
    let s = 0;
    for (let k = i - low + 1; k <= i; k++) s += NUMS[k - 1];
    bit.push({ v: s, sub: low === 1 ? String(i) : `${i - low + 1}-${i}` });
  }
  bit[0] = null;

  DSA.addDS({
    id: 'fenwick-tree',
    title: 'Fenwick Tree (BIT)',
    category: 'Advanced',
    order: 2,
    tags: ['binary indexed tree', 'bit', 'prefix sum', 'range sum', 'lowbit', 'i & -i'],
    summary: 'A 1-indexed array where `t[i]` stores the sum of the last `i & -i` elements ending at `i`. Prefix sums and point updates both take O(log n), in about ten lines.',
    ops: [
      { op: 'BIT(nums)', time: 'O(n log n)', note: 'n adds; an O(n) build exists' },
      { op: 'add(i, delta)', time: 'O(log n)' },
      { op: 'prefix(i)', time: 'O(log n)', note: 'sum of nums[1..i]' },
      { op: 'range_sum(l, r)', time: 'O(log n)', note: 'prefix(r) - prefix(l - 1)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Build": "O(n log n)", "Update": "O(log n)", "Prefix sum": "O(log n)", "Range sum": "O(log n)"}, space: 'O(n)' },
    visual: {
      type: 'array',
      rows: [
        { label: 'nums', items: [null, ...NUMS], ranges: [{ l: 1, r: 7, label: 'prefix(7) = 28' }] },
        { label: 't', items: bit, states: { 4: 'found', 6: 'found', 7: 'found' } },
      ],
    },
    legend: { found: 'summed' },
    visualCaption: 'Small labels under `t` show which 1-based indices each cell covers. `prefix(7)` hops 7 → 6 → 4 → 0 by stripping the lowest set bit: `t[7] + t[6] + t[4] = 2 + 10 + 16 = 28`.',
    code: `
# --- create ---
class BIT:
    def __init__(self, nums):
        self.n = len(nums)
        self.t = [0] * (self.n + 1)   # 1-indexed, t[0] unused
        for i, x in enumerate(nums):
            self.add(i + 1, x)        # O(n log n) build

    # --- point update: nums[i] += delta ---
    def add(self, i, delta):          # i is 1-based
        while i <= self.n:
            self.t[i] += delta
            i += i & -i               # next cell covering i

    # --- prefix sum: nums[1] + ... + nums[i] ---
    def prefix(self, i):
        s = 0
        while i > 0:
            s += self.t[i]
            i -= i & -i               # drop the lowest set bit
        return s

    # --- range sum: nums[l..r], inclusive ---
    def range_sum(self, l, r):
        return self.prefix(r) - self.prefix(l - 1)

# --- use ---
bit = BIT([5, 3, 7, 1, 4, 6, 2, 8])
bit.prefix(7)                   # 5+3+7+1+4+6+2 = 28
bit.range_sum(3, 7)             # 7+1+4+6+2 = 20
bit.add(4, 9)                   # nums[4]: 1 -> 10
# to set a value: add(i, new - old), keep old in a list
`,
    notes: [
      '`i & -i` isolates the lowest set bit: `12 = 0b1100` → `4`. Cell `t[i]` covers indices `(i - (i & -i), i]`.',
      'Query strips low bits going down (7 → 6 → 4 → 0). Update adds them going up (4 → 8 → 16 ...). Both touch ≤ log n cells.',
      '1-indexed on purpose: `0 & -0 == 0`, so index 0 would loop forever.',
      'Only for invertible ops like sum or xor (range = prefix difference). Range min/max needs a segment tree.',
    ],
    tips: [
      'Counting inversions / "smaller after self": walk right to left, `prefix(rank - 1)` then `add(rank, 1)`.',
      'Compress big values first: `rank = {v: i + 1 for i, v in enumerate(sorted(set(nums)))}`.',
    ],
    problems: ['307. Range Sum Query - Mutable', '315. Count of Smaller Numbers After Self', '493. Reverse Pairs', '1649. Create Sorted Array through Instructions', '308. Range Sum Query 2D - Mutable'],
  });

  /* ---------- LRU cache ---------- */
  // capacity 2: put(1, 'a'), put(2, 'b'), get(1)  ->  recency: 1, 2
  const dllView = {
    type: 'linked',
    doubly: true,
    title: 'head.next = most recent, tail.prev = least recent',
    nodes: [{ id: 'h', v: 'H' }, { id: 'n1', v: '1:a', s: 'active' }, { id: 'n2', v: '2:b', s: 'bad' }, { id: 't', v: 'T' }],
    links: [{ from: 'h', to: 'n1' }, { from: 'n1', to: 'n2' }, { from: 'n2', to: 't' }],
    pointers: { h: 'head', n1: 'MRU', n2: 'LRU', t: 'tail' },
  };
  const mapView = { type: 'kv', scale: 0.85, title: 'self.map: key -> node', keyLabel: 'key', valLabel: 'node', entries: [[1, '→ 1:a'], [2, '→ 2:b']], states: { 1: 'active', 2: 'bad' } };

  DSA.addDS({
    id: 'lru-cache',
    title: 'LRU Cache',
    category: 'Advanced',
    order: 3,
    tags: ['least recently used', 'OrderedDict', 'move_to_end', 'lru_cache', 'cache', 'eviction', 'design'],
    summary: 'A fixed-size key-value cache that evicts the **least recently used** key when full. A hash map finds entries in O(1); a doubly linked list keeps them in recency order so moving and evicting are O(1) too.',
    ops: [
      { op: 'get(key)', time: 'O(1)', note: 'also marks key as most recent' },
      { op: 'put(key, value)', time: 'O(1)', note: 'insert or update, then maybe evict' },
      { op: 'evict least recent', time: 'O(1)' },
    ],
    space: 'O(capacity)',
    complexity: { time: {"get": "O(1)", "put": "O(1)", "Evict": "O(1)"}, space: 'O(capacity)' },
    legend: { active: 'just used', bad: 'next to evict' },
    notes: [
      'Needs two things in O(1): find by key (dict) and reorder by recency (doubly linked list). Neither does both alone.',
      '`OrderedDict` is a dict plus a doubly linked list inside: `move_to_end(k)` and `popitem(last=False)` are O(1).',
      'Nodes store their key so eviction can delete the dict entry.',
      '`@functools.lru_cache(maxsize=None)` (or `@functools.cache`) memoizes a function. Arguments must be hashable: pass tuples, not lists.',
    ],
    tips: [
      'Interviewers often ask for the hand-rolled version after you show `OrderedDict`. Know both.',
      'Sentinel head and tail remove every None check from `_remove` and `_add_front`.',
    ],
    problems: ['146. LRU Cache', '460. LFU Cache', '1756. Design Most Recently Used Queue', '432. All O`one Data Structure'],
    variants: [
      {
        id: 'ordereddict',
        label: 'OrderedDict',
        summary: 'The short version. `OrderedDict` keeps keys in order: `move_to_end(key)` marks a key as most recent and `popitem(last=False)` drops the oldest, both O(1).',
        visuals: [
          {
            type: 'array',
            title: 'self.data, oldest -> newest',
            scale: 0.65,
            showIndex: false,
            items: [{ v: '2:b', s: 'bad' }, { v: '1:a', s: 'active' }],
            pointers: [{ i: 0, label: 'oldest' }, { i: 1, label: 'newest' }],
          },
        ],
        visualCaption: 'Capacity 2 after `put(1)`, `put(2)`, `get(1)`: `move_to_end` sent key 1 to the end. `put(3)` then evicts key 2 with `popitem(last=False)`.',
        code: `
from collections import OrderedDict
from functools import lru_cache

# --- create ---
class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.data = OrderedDict()  # oldest first, newest last

    # --- get: read + mark as most recent ---
    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)    # now newest, O(1)
        return self.data[key]

    # --- put: insert/update, evict if over capacity ---
    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)    # newest at the end
        if len(self.data) > self.cap:
            self.data.popitem(last=False)  # drop the oldest

# --- use ---
c = LRUCache(2)
c.put(1, "a")
c.put(2, "b")
c.get(1)                        # 'a'; 1 is now newest
c.put(3, "c")                   # full: evicts 2
c.get(2)                        # -1

# --- memoize a function: built in ---
@lru_cache(maxsize=None)        # unbounded, same as @cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
`,
      },
      {
        id: 'dict-dll',
        label: 'dict + linked list',
        summary: 'The by-hand version: a dict maps each key to its node, and a doubly linked list with sentinels keeps nodes from most recent (front) to least recent (back).',
        visuals: [dllView, mapView],
        visualCaption: 'Capacity 2 after `put(1)`, `put(2)`, `get(1)`: node 1 was unlinked and re-added at the front. `put(3)` then evicts `tail.prev` (key 2) from both the list and the map.',
        code: `
# --- create ---
class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val   # key needed to evict
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                   # key -> Node
        # sentinels: head.next = newest, tail.prev = oldest
        self.head, self.tail = Node(), Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    # --- list helpers, both O(1) ---
    def _remove(self, node):
        node.prev.next = node.next      # neighbours skip node
        node.next.prev = node.prev

    def _add_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node      # old first points back
        self.head.next = node

    # --- get ---
    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)              # move to the front:
        self._add_front(node)           # now most recent
        return node.val

    # --- put ---
    def put(self, key, value):
        if key in self.map:             # drop the old node
            self._remove(self.map[key])
        node = Node(key, value)
        self.map[key] = node
        self._add_front(node)
        if len(self.map) > self.cap:
            lru = self.tail.prev        # least recently used
            self._remove(lru)
            del self.map[lru.key]       # why nodes keep keys

# --- use ---
c = LRUCache(2)
c.put(1, "a")
c.put(2, "b")
c.get(1)                        # 'a'; 1 moves to the front
c.put(3, "c")                   # full: evicts 2
c.get(2)                        # -1
`,
      },
    ],
  });
})();
