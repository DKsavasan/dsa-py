/* Data Structures · Trees (binary tree, BST, trie) */
(function () {
  const U = DSA.util;

  /* ---------- binary tree ---------- */
  DSA.addDS({
    id: 'binary-tree',
    title: 'Binary Tree',
    category: 'Trees',
    order: 1,
    tags: ['TreeNode', 'traversal', 'preorder', 'inorder', 'postorder', 'level order', 'height', 'depth'],
    summary: 'Nodes with at most two children, `left` and `right`. Almost every tree problem is a recursive walk: solve the left subtree, solve the right, combine at the node.',
    ops: [
      { op: 'build(level_order_list)', time: 'O(n)' },
      { op: 'preorder / inorder / postorder', time: 'O(n)', note: 'O(h) recursion stack' },
      { op: 'level_order (BFS)', time: 'O(n)', note: 'O(w) queue, w = widest level' },
      { op: 'height(root)  /  count(root)', time: 'O(n)' },
      { op: 'find a value', time: 'O(n)', note: 'no ordering to exploit' },
      { op: 'attach a child to a known node', time: 'O(1)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Traverse": "O(n)", "Search": "O(n)", "Height": "O(n)", "Recursion stack": "O(h)"}, space: 'O(n)' },
    visual: {
      type: 'tree',
      root: U.treeFromLevel([1, 2, 3, 4, 5, null, 6]),
      states: { 4: 'visited', 5: 'visited', 6: 'visited' },
      badges: { 1: 'd0', 2: 'd1', 3: 'd1', 4: 'd2', 5: 'd2', 6: 'd2' },
    },
    legend: { visited: 'leaf' },
    visualCaption: '`build([1, 2, 3, 4, 5, None, 6])`. Badges show depth (edges from the root). Leaves 4, 5, 6 have no children. Height is 3 counting nodes, 2 counting edges.',
    code: `
from collections import deque

# --- create ---
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left        # left child or None
        self.right = right      # right child or None

# by hand: 1 with children 2 and 3
root = TreeNode(1, TreeNode(2), TreeNode(3))

# from a LeetCode level-order list, None = no child
def build(vals):
    if not vals or vals[0] is None:
        return None
    root = TreeNode(vals[0])
    q = deque([root])           # parents waiting for kids
    i = 1                       # next value to place
    while q and i < len(vals):
        node = q.popleft()
        if vals[i] is not None:     # left child
            node.left = TreeNode(vals[i])
            q.append(node.left)
        i += 1
        # right child (the list may end after a left)
        if i < len(vals) and vals[i] is not None:
            node.right = TreeNode(vals[i])
            q.append(node.right)
        i += 1
    return root

root = build([1, 2, 3, 4, 5, None, 6])

# --- measure ---
def height(node):               # nodes on the longest path
    if not node:
        return 0                # empty tree
    return 1 + max(height(node.left), height(node.right))

def count(node):
    if not node:
        return 0
    return 1 + count(node.left) + count(node.right)

# --- DFS traversals ---
def preorder(n):                # root, left, right
    if not n:
        return []
    return [n.val] + preorder(n.left) + preorder(n.right)

def inorder(n):                 # left, root, right
    if not n:
        return []
    return inorder(n.left) + [n.val] + inorder(n.right)

def postorder(n):               # left, right, root
    if not n:
        return []
    return postorder(n.left) + postorder(n.right) + [n.val]

# preorder  -> [1, 2, 4, 5, 3, 6]
# inorder   -> [4, 2, 5, 1, 3, 6]
# postorder -> [4, 5, 2, 6, 3, 1]

# --- BFS: level order ---
def level_order(root):
    out, q = [], deque([root] if root else [])
    while q:
        level = []
        for _ in range(len(q)):         # exactly one level
            node = q.popleft()
            level.append(node.val)
            # queue the kids that exist
            q.extend(c for c in (node.left, node.right) if c)
        out.append(level)
    return out                  # [[1], [2, 3], [4, 5, 6]]

# --- leaf test ---
def is_leaf(n):
    return n.left is None and n.right is None
`,
    notes: [
      '**Depth** of a node = edges from the root. **Height** of a tree = longest root-to-leaf path (count nodes or edges; say which). A **leaf** has no children.',
      '**Full**: every node has 0 or 2 kids. **Complete**: all levels full except the last, filled left to right (a heap). **Perfect**: all leaves on one level, 2^h − 1 nodes. **Balanced**: subtree heights differ by ≤ 1 at every node, so h = O(log n).',
      'Recursion depth = height: O(log n) balanced, O(n) skewed. Python\'s default limit is 1000, so a long chain needs an iterative stack or `sys.setrecursionlimit`.',
      'Preorder copies/serializes a tree. Inorder of a BST is sorted. Postorder computes from the children up (height, subtree sums, deletes).',
    ],
    tips: [
      'Write the base case `if not node: return ...` first, then trust the recursive calls.',
      'BFS with `for _ in range(len(q))` handles one level per pass: level order, right side view, minimum depth.',
    ],
    problems: ['104. Maximum Depth of Binary Tree', '94. Binary Tree Inorder Traversal', '102. Binary Tree Level Order Traversal', '226. Invert Binary Tree', '110. Balanced Binary Tree', '543. Diameter of Binary Tree'],
  });

  /* ---------- BST ---------- */
  DSA.addDS({
    id: 'bst',
    title: 'Binary Search Tree',
    category: 'Trees',
    order: 2,
    tags: ['bst', 'search tree', 'successor', 'ordered', 'balanced', 'skewed'],
    summary: 'A binary tree where everything in a node\'s left subtree is smaller and everything in its right subtree is bigger. Search, insert and delete walk one root-to-leaf path, so they cost O(h): log n when balanced, n when skewed.',
    ops: [
      { op: 'search(root, x)', time: 'O(h)', note: 'h = log n balanced, n skewed' },
      { op: 'insert(root, x)', time: 'O(h)' },
      { op: 'delete(root, x)', time: 'O(h)', note: '3 cases: 0, 1 or 2 children' },
      { op: 'min / max', time: 'O(h)', note: 'leftmost / rightmost node' },
      { op: 'successor / predecessor', time: 'O(h)' },
      { op: 'inorder (sorted output)', time: 'O(n)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Search": "O(h)", "Insert": "O(h)", "Delete": "O(h)", "Balanced h": "O(log n)", "Skewed h": "O(n)"}, space: 'O(n)' },
    visuals: [
      {
        type: 'tree',
        title: 'balanced: height ~ log n, search(6) takes 3 steps',
        root: U.bstFrom([8, 4, 12, 2, 6, 10, 14]),
        states: { 8: 'visited', 4: 'visited', 6: 'found' },
        edgeStates: { 4: 'path', 6: 'path' },
      },
      {
        type: 'tree',
        title: 'skewed (sorted inserts): search(8) takes 4 steps',
        levelGap: 52,
        root: U.bstFrom([2, 4, 6, 8]),
        states: { 2: 'visited', 4: 'visited', 6: 'visited', 8: 'found' },
        edgeStates: { 4: 'path', 6: 'path', 8: 'path' },
      },
    ],
    visualCaption: 'Same operations, very different cost. Inserting sorted data never goes left, so the tree degrades to a chain and every search is O(n). Balanced trees (AVL, red-black) rotate to keep h = O(log n).',
    code: `
# --- create ---
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left        # every value here is smaller
        self.right = right      # every value here is bigger

# --- search ---
def search(node, target):
    while node and node.val != target:
        # smaller goes left, bigger goes right
        node = node.left if target < node.val else node.right
    return node                 # the node, or None

# --- insert ---
def insert(node, val):
    if not node:
        return TreeNode(val)    # reached an empty spot
    if val < node.val:
        node.left = insert(node.left, val)
    elif val > node.val:
        node.right = insert(node.right, val)
    return node                 # duplicates are ignored

# --- min / max ---
def min_node(node):
    while node.left:            # keep going left
        node = node.left
    return node
# max: same loop with .right

# --- delete ---
def delete(node, val):
    if not node:
        return None             # value not in the tree
    if val < node.val:
        node.left = delete(node.left, val)
    elif val > node.val:
        node.right = delete(node.right, val)
    else:
        # cases 1 + 2: zero or one child -> lift the child
        if not node.left:
            return node.right
        if not node.right:
            return node.left
        # case 3: two children -> copy the successor in
        succ = min_node(node.right)  # smallest on the right
        node.val = succ.val
        # then delete the successor from the right subtree
        node.right = delete(node.right, succ.val)
    return node

# --- inorder = sorted ---
def inorder(node):
    if not node:
        return []
    return inorder(node.left) + [node.val] + inorder(node.right)

# --- build + use ---
root = None
for v in [8, 4, 12, 2, 6, 10, 14]:
    root = insert(root, v)      # this order stays balanced
inorder(root)                   # [2, 4, 6, 8, 10, 12, 14]
search(root, 6).val             # 6
root = delete(root, 4)          # 2 kids: successor 6 moves up
`,
    notes: [
      'The rule holds for whole subtrees, not just direct children: every node left of 8 is < 8, even deep down.',
      'Every operation is O(h). Balanced h = log n; inserting sorted data gives a chain with h = n.',
      'Delete: **leaf** → remove it. **One child** → replace the node with that child. **Two children** → copy the inorder successor (min of the right subtree), then delete the successor.',
      'Python has no built-in balanced BST. For ordered data use `bisect` on a sorted list, or a heap if you only need the min/max.',
    ],
    tips: [
      'Validate a BST by passing `(lo, hi)` bounds down the recursion. Comparing a node only with its children is the classic bug.',
      'k-th smallest, sorted iteration, "closest value": inorder traversal, stop early.',
    ],
    problems: ['700. Search in a Binary Search Tree', '701. Insert into a Binary Search Tree', '450. Delete Node in a BST', '98. Validate Binary Search Tree', '230. Kth Smallest Element in a BST', '235. Lowest Common Ancestor of a BST'],
  });

  /* ---------- trie ---------- */
  const L = (id, v, kids, end) => ({ id, v, s: end ? 'found' : undefined, children: kids || [] });
  // words: cat, car, cart, dog
  const trieClass = L('root', '•', [
    L('c', 'c', [L('ca', 'a', [L('cat', 't', [], true), L('car', 'r', [L('cart', 't', [], true)], true)])]),
    L('d', 'd', [L('do', 'o', [L('dog', 'g', [], true)])]),
  ]);
  const E = (id) => ({ id, v: '$', s: 'found', children: [] });
  const trieDict = L('root', '{}', [
    L('c', 'c', [L('ca', 'a', [L('cat', 't', [E('cat$')]), L('car', 'r', [E('car$'), L('cart', 't', [E('cart$')])])])]),
    L('d', 'd', [L('do', 'o', [L('dog', 'g', [E('dog$')])])]),
  ]);

  DSA.addDS({
    id: 'trie',
    title: 'Trie (Prefix Tree)',
    category: 'Trees',
    order: 3,
    tags: ['prefix tree', 'autocomplete', 'word search', 'prefix', 'dictionary'],
    summary: 'A tree of characters: each path from the root spells a prefix, and words that share a prefix share nodes. Insert and lookup cost O(L) for a word of length L, no matter how many words are stored.',
    ops: [
      { op: 'insert(word)', time: 'O(L)' },
      { op: 'search(word)', time: 'O(L)', note: 'must end on an end-of-word node' },
      { op: 'starts_with(prefix)', time: 'O(L)' },
      { op: 'all words under a prefix', time: 'O(L + k)', note: 'k = size of that subtree' },
    ],
    space: 'O(total characters)',
    complexity: { time: {"Insert": "O(L)", "Search": "O(L)", "Starts with": "O(L)"}, space: 'O(total characters)' },
    legend: { found: 'end of word' },
    notes: [
      'Each edge is one character. Words sharing a prefix share the path, so "car" and "cart" cost 4 nodes, not 7.',
      'You need an **end marker**: "car" is a word, "ca" is not, yet both are paths in the trie.',
      'Time depends on the word length, not the word count. A `set` does exact lookup just as fast but cannot answer prefix queries.',
      'Grid + many words (Word Search II): build a trie of the words and walk it during the DFS, pruning as soon as the path leaves the trie.',
    ],
    tips: [
      'Store the whole word at its end node (`node["$"] = word`) so the DFS never rebuilds strings; delete it once found to avoid duplicates.',
      '`children = defaultdict(TrieNode)` shortens insert to `node = node.children[ch]`, but lookups must use `in` so they do not create nodes.',
    ],
    problems: ['208. Implement Trie (Prefix Tree)', '211. Design Add and Search Words Data Structure', '212. Word Search II', '648. Replace Words', '1268. Search Suggestions System', '14. Longest Common Prefix'],
    variants: [
      {
        id: 'class',
        label: 'TrieNode class',
        summary: 'A tree of characters: each path from the root spells a prefix, and words that share a prefix share nodes. Each `TrieNode` holds a `children` dict (char → node) and an `is_end` flag.',
        visual: { type: 'tree', root: trieClass, levelGap: 56 },
        visualCaption: 'Stores `cat`, `car`, `cart`, `dog`. Green nodes have `is_end = True`. `r` is both the end of "car" and the parent of the `t` in "cart".',
        code: `
# --- create ---
class TrieNode:
    def __init__(self):
        self.children = {}      # char -> TrieNode
        self.is_end = False     # a word ends at this node

class Trie:
    def __init__(self):
        self.root = TrieNode()  # stands for the empty prefix

    # --- insert ---
    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:     # new branch
                node.children[ch] = TrieNode()
            node = node.children[ch]        # step down
        node.is_end = True      # mark the last char

    # --- search ---
    def _walk(self, s):         # node at the end of s
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None     # path breaks: not stored
            node = node.children[ch]
        return node

    def search(self, word):     # exact word stored?
        node = self._walk(word)
        return node is not None and node.is_end

    def starts_with(self, prefix):  # any word with it?
        return self._walk(prefix) is not None

# --- use ---
t = Trie()
for w in ["cat", "car", "cart", "dog"]:
    t.insert(w)
t.search("car")                 # True
t.search("ca")                  # False: only a prefix
t.starts_with("ca")             # True
t.search("cow")                 # False: no 'o' under 'c'
`,
      },
      {
        id: 'dict-of-dicts',
        label: 'Nested dicts',
        summary: 'The compact interview version: the trie is just nested dicts, `{char: subtrie}`, with a special key `\'$\'` marking the end of a word. No classes, a few lines each.',
        visual: { type: 'tree', root: trieDict, levelGap: 52 },
        visualCaption: 'Same four words. Every dict level is a node; a `\'$\'` key under a node means a word ends there.',
        code: `
# --- create ---
END = "$"                       # key meaning "word ends here"
trie = {}                       # root: char -> subtrie

# --- insert ---
def insert(trie, word):
    node = trie
    for ch in word:
        node = node.setdefault(ch, {})  # step, create if new
    node[END] = True            # mark the end

# --- search ---
def walk(trie, s):              # subtrie at the end of s
    node = trie
    for ch in s:
        if ch not in node:
            return None         # path breaks
        node = node[ch]
    return node

def search(trie, word):
    node = walk(trie, word)
    return node is not None and END in node

def starts_with(trie, prefix):
    return walk(trie, prefix) is not None

# --- use ---
for w in ["cat", "car", "cart", "dog"]:
    insert(trie, w)
# {'c': {'a': {'t': {'$': True},
#              'r': {'$': True, 't': {'$': True}}}},
#  'd': {'o': {'g': {'$': True}}}}
search(trie, "car")             # True
search(trie, "ca")              # False
starts_with(trie, "do")         # True
`,
      },
    ],
  });
})();
