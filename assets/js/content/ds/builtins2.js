/* Data Structures · Python Built-ins (str, tuple, dict, set) */
(function () {
  /* ---------------------------------------------------------------- str */
  DSA.addDS({
    id: 'string',
    title: 'String (str)',
    category: 'Python Built-ins',
    order: 2,
    tags: ['str', 'text', 'slice', 'split', 'join', 'f-string', 'ord', 'chr', 'immutable'],
    file: 'strings',
    summary: 'An **immutable** sequence of characters. Indexing and slicing work like a list, but every "change" builds a new string. Build long strings with `"".join(parts)`, not `+=` in a loop.',
    ops: [
      { op: 's[i]', time: 'O(1)' },
      { op: 's[a:b]', time: 'O(k)', note: 'copies k = b - a chars' },
      { op: 'len(s)', time: 'O(1)' },
      { op: 'sub in s  /  s.find(sub)', time: 'O(n·m)', note: 'worst case; usually close to O(n)' },
      { op: 's + t', time: 'O(n + m)', note: 'always a new string' },
      { op: '"".join(parts)', time: 'O(n)', note: 'n = total length' },
      { op: 's.split()  /  s.strip()', time: 'O(n)', note: 'also s.replace(a, b), s.lower()' },
      { op: 's == t', time: 'O(n)' },
      { op: 'sorted(s)', time: 'O(n log n)', note: 'returns a list of chars' },
    ],
    space: 'O(n)',
    complexity: { time: {"Access": "O(1)", "Search (in)": "O(n·m)", "Concatenate": "O(n + m)", "Slice": "O(k)"}, space: 'O(n)' },
    visual: {
      type: 'array',
      rows: [
        {
          label: 's',
          items: ['h', 'e', 'l', 'l', 'o'],
          states: ['active', 'read', 'read', 'read', 'active'],
          pointers: [{ i: 0, label: 's[0]' }, { i: 4, label: 's[-1]' }],
          ranges: [{ l: 1, r: 3, label: 's[1:4]' }],
        },
        { label: '"H" + s[1:]', items: ['H', 'e', 'l', 'l', 'o'], states: ['new'] },
      ],
    },
    visualCaption: '`s = "hello"`: `s[0]` is the first char, `s[-1]` the last. `s[1:4]` is `"ell"` (end is exclusive). `s[0] = "H"` is a TypeError, so you build a new string instead.',
    code: `
from collections import Counter

# --- create ---
s = "hello"                 # '' and "" are the same
s = str(42)                 # '42'
s = "ab" * 3                # 'ababab'
name, n = "Ada", 3          # values to format
s = f"{name} has {n} cats"  # 'Ada has 3 cats'
s = f"{3.14159:.2f}"        # '3.14', format spec after :
s = f"{n:03d}"              # '003', zero-padded to width 3
s = f"{n=}"                 # 'n=3', handy for debugging

# --- read / slice ---
s = "hello"                 # indices 0..4, or -5..-1
s[0]                        # 'h'
s[-1]                       # 'o', last char
s[1:4]                      # 'ell', end is exclusive
s[::-1]                     # 'olleh', reversed copy
len(s)                      # 5
# s[0] = "H" raises TypeError: str is immutable
s = "H" + s[1:]             # build a new string instead

# --- search ---
"ell" in s                  # True, substring test
s.find("l")                 # 2, first index; -1 if missing
s.rfind("l")                # 3, last index
s.index("e")                # 1; ValueError if missing
s.count("l")                # 2
s.startswith("He")          # True (also endswith)

# --- transform (always returns a NEW string) ---
"  hi  ".strip()            # 'hi' (also lstrip, rstrip)
"a,b,,c".split(",")         # ['a', 'b', '', 'c']
" a  b ".split()            # ['a', 'b'], any whitespace
"-".join(["a", "b", "c"])   # 'a-b-c', items must be str
s.replace("l", "L")         # 'HeLLo', every match
s.lower(), s.upper()        # ('hello', 'HELLO')
"7".zfill(3)                # '007'

# --- characters ---
"a".isalpha()               # True, letters only
"7".isdigit()               # True, 0-9
"a7".isalnum()              # True, letters or digits
" ".isspace()               # True
ord("a")                    # 97, char -> code point
chr(97)                     # 'a', code point -> char
ord("7") - ord("0")         # 7, digit char -> int
ord("c") - ord("a")         # 2, letter -> index 0..25

# --- build in a loop ---
parts = []                  # collect pieces in a list
for ch in "abc":            # any loop producing pieces
    parts.append(ch * 2)    # O(1) per piece
out = "".join(parts)        # 'aabbcc', one O(n) pass
# out += piece in a loop can copy out each time: O(n^2)

# --- iterate / sort / count ---
for i, ch in enumerate("hey"):  # index + char
    print(i, ch)                # 0 h, 1 e, 2 y
"".join(reversed("abc"))    # 'cba'
"".join(sorted("cab"))      # 'abc'; sorted() gives a list
Counter("banana")           # {'a': 3, 'n': 2, 'b': 1}
list("abc")                 # ['a', 'b', 'c'], editable
`,
    notes: [
      'Immutable: methods return new strings and there is no `s.append`. For many edits, use `chars = list(s)`, edit, then `"".join(chars)`.',
      'There is no char type. A character is just a string of length 1.',
      '`s == s[::-1]` is the one-line palindrome check.',
      '`s.split()` with no argument splits on runs of whitespace and drops empty pieces. `s.split(" ")` does not.',
    ],
    tips: [
      'CPython sometimes makes `+=` fast, but do not rely on it. Say "I will collect parts and join once".',
      'Letter counts: `Counter(s)` or a `[0] * 26` list indexed by `ord(c) - ord("a")`. Equal counts means anagrams.',
      '`string.ascii_lowercase` and `string.digits` save typing.',
    ],
    problems: ['125. Valid Palindrome', '242. Valid Anagram', '49. Group Anagrams', '3. Longest Substring Without Repeating Characters', '151. Reverse Words in a String', '14. Longest Common Prefix'],
  });

  /* -------------------------------------------------------------- tuple */
  DSA.addDS({
    id: 'tuple',
    title: 'Tuple',
    category: 'Python Built-ins',
    order: 3,
    tags: ['tuple', 'unpacking', 'swap', 'namedtuple', 'hashable', 'immutable'],
    file: 'tuples',
    summary: 'An **immutable**, ordered sequence. Use it for fixed groups of values (a point, a `(count, word)` pair), for returning several values, and wherever you need something **hashable**: dict keys and set members.',
    ops: [
      { op: 't[i]', time: 'O(1)' },
      { op: 't[a:b]', time: 'O(k)', note: 'new tuple of k items' },
      { op: 'x in t  /  t.index(x)', time: 'O(n)' },
      { op: 'a, b = b, a', time: 'O(1)' },
      { op: 'hash(t)', time: 'O(n)', note: 'only if every item is hashable' },
      { op: 't1 + t2', time: 'O(n + m)', note: 'new tuple' },
      { op: 't1 < t2', time: 'O(n)', note: 'item by item, left to right' },
      { op: 'len(t)', time: 'O(1)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Access": "O(1)", "Search": "O(n)", "Unpack": "O(n)", "Hash": "O(n)"}, space: 'O(n)' },
    visuals: [
      {
        type: 'array',
        title: 'unpack: one name per slot',
        rows: [
          { label: 't', items: [3, 7, 1] },
          { label: 'unpacked', items: [{ v: 3, sub: 'a' }, { v: 7, sub: 'b' }, { v: 1, sub: 'c' }], states: ['new', 'new', 'new'], showIndex: false },
        ],
      },
      {
        type: 'kv',
        title: '(row, col) tuples as dict keys',
        entries: [['(0, 0)', 0], ['(0, 1)', 1], ['(1, 1)', 2], ['(2, 1)', 3]],
        states: { '(1, 1)': 'active' },
        keyLabel: 'key',
        valLabel: 'value',
      },
    ],
    visualCaption: 'Unpacking assigns each slot to a name in one line. Because tuples are hashable, `(row, col)` pairs work as dict keys and set members; lists do not.',
    code: `
from collections import namedtuple

# --- create ---
t = (3, 7, 1)               # literal
t = 3, 7, 1                 # the commas make the tuple
e = ()                      # empty tuple
one = (5,)                  # one item needs the comma
num = (5)                   # just the int 5, not a tuple
t = tuple([3, 7, 1])        # from any iterable

# --- read ---
t[0]                        # 3
t[-1]                       # 1
t[1:]                       # (7, 1), slices are tuples
len(t)                      # 3
7 in t                      # True, O(n) scan
t.index(7), t.count(7)      # (1, 1)
# t[0] = 9 raises TypeError: tuples are immutable

# --- unpack ---
a, b, c = t                 # a=3, b=7, c=1
first, *rest = t            # first=3, rest=[7, 1] (a list)
a, b = b, a                 # swap, no temp variable
for x, y in [(0, 1), (2, 5)]:  # unpack each pair
    print(x + y)               # 1, then 7

def min_max(nums):
    return min(nums), max(nums)  # returns one tuple
lo, hi = min_max([4, 1, 9])      # lo=1, hi=9

# --- hashable: dict keys, set members ---
seen = {(0, 0), (1, 2)}     # visited grid cells
dist = {(0, 0): 0}          # dict keyed by (row, col)
key = tuple(sorted("eat"))  # ('a', 'e', 't'), anagram key
# {[1, 2]} raises TypeError: a list is unhashable

# --- compare / sort ---
(1, 5) < (2, 0)             # True, first items decide
pairs = [(2, "b"), (1, "z"), (2, "a")]
sorted(pairs)               # [(1,'z'), (2,'a'), (2,'b')]

# --- namedtuple ---
Point = namedtuple("Point", ["x", "y"])  # a tiny class
p = Point(3, 4)             # Point(x=3, y=4)
p.x, p[1]                   # (3, 4): by name or index
p = p._replace(x=0)         # new tuple with x changed
`,
    notes: [
      'The comma makes a tuple, not the parentheses: `x = 1,` is a tuple, `(5)` is an int.',
      'Immutable means the slots cannot be reassigned. A list inside a tuple can still change, and then the tuple is not hashable.',
      'Tuples compare item by item, so sorting `(priority, name)` pairs just works.',
      '`namedtuple` adds field names at no extra memory per instance. `@dataclass(frozen=True)` is the heavier alternative.',
    ],
    tips: [
      'Store visited grid cells as `(r, c)` tuples in a set.',
      'Group anagrams with `tuple(sorted(word))` or a tuple of 26 counts as the dict key.',
    ],
    problems: ['49. Group Anagrams', '36. Valid Sudoku', '200. Number of Islands', '939. Minimum Area Rectangle'],
  });

  /* --------------------------------------------------------------- dict */
  const dictBuckets = {
    type: 'buckets',
    title: 'lookup: hash the key, pick a bucket, compare',
    buckets: [
      [],
      [{ label: "'apple': 3" }],
      [],
      [{ label: "'kiwi': 1" }, { label: "'lime': 2" }],
      [],
      [{ label: "'fig': 5" }],
      [],
      [],
    ],
    states: { 3: 'active', '3,0': 'compare', '3,1': 'found' },
  };

  const DICT_NOTES = [
    'Keys must be hashable: str, int, float, tuple, frozenset. Lists, dicts and sets cannot be keys.',
    'Iteration order is insertion order. Overwriting a key keeps its original position.',
    '`k in d` is O(1); `v in d.values()` is an O(n) scan.',
    'Changing a dict while looping over it raises RuntimeError. Loop over `list(d)` if you need to delete.',
  ];

  DSA.addDS({
    id: 'dict',
    title: 'Dictionary (Hash Map)',
    category: 'Python Built-ins',
    order: 4,
    tags: ['dict', 'hash map', 'hash table', 'map', 'defaultdict', 'Counter', 'hashing', 'collision'],
    summary: 'Maps hashable keys to values with average O(1) lookup, insert and delete. Keeps insertion order (Python 3.7+).',
    ops: [
      { op: 'd[k]  /  d[k] = v', time: 'O(1)', note: 'average; reading a missing key raises KeyError' },
      { op: 'd.get(k, default)', time: 'O(1)' },
      { op: 'k in d', time: 'O(1)', note: 'checks keys, not values' },
      { op: 'del d[k]  /  d.pop(k)', time: 'O(1)' },
      { op: 'for k, v in d.items()', time: 'O(n)' },
      { op: 'sorted(d, key=d.get)', time: 'O(n log n)' },
      { op: 'Counter(xs)', time: 'O(n)' },
      { op: 'c.most_common(k)', time: 'O(n log k)', note: 'no k: full sort, O(n log n)' },
      { op: 'any op, all keys collide', time: 'O(n)', note: 'worst case; rare in practice' },
    ],
    space: 'O(n)',
    complexity: { time: {"Get / set": "O(1)", "Delete": "O(1)", "k in d": "O(1)", "Worst case": "O(n)"}, space: 'O(n)' },
    notes: DICT_NOTES,
    tips: [
      'Two Sum pattern: store what you have seen (`value -> index`) and look up the complement in O(1).',
      '`d[k] += 1` fails on a new key. Use `d[k] = d.get(k, 0) + 1` or a `defaultdict(int)` / `Counter`.',
    ],
    problems: ['1. Two Sum', '49. Group Anagrams', '347. Top K Frequent Elements', '560. Subarray Sum Equals K', '146. LRU Cache', '706. Design HashMap'],
    variants: [
      {
        id: 'dict',
        label: 'dict',
        summary: 'Maps hashable keys to values with average O(1) lookup, insert and delete. Keeps insertion order (Python 3.7+). The workhorse for counting, caching, and "have I seen this?" checks.',
        visual: dictBuckets,
        notes: ['Look up `"lime"`: hash the key, `% 8` picks bucket 3, then compare keys there until one is equal. Buckets stay short, so this is O(1) on average.'].concat(DICT_NOTES),
        code: `
# --- create ---
d = {}                          # empty dict
d = {"apple": 3, "kiwi": 1}     # literal
d = dict(a=1, b=2)              # {'a': 1, 'b': 2}
d = dict(zip("abc", range(3)))  # {'a': 0, 'b': 1, 'c': 2}
d = dict.fromkeys("ab", 0)      # {'a': 0, 'b': 0}
# comprehension: word -> length
d = {w: len(w) for w in ["hi", "hey"]}

# --- read ---
d = {"apple": 3, "kiwi": 1}
d["apple"]                      # 3; KeyError if missing
d.get("fig")                    # None if missing
d.get("fig", 0)                 # 0, your default
"kiwi" in d                     # True, checks keys, O(1)
len(d)                          # 2

# --- add / update ---
d["fig"] = 5                    # insert or overwrite
d["fig"] += 1                   # 6; key must already exist
d.setdefault("pear", 0)         # insert 0 only if missing
d.update({"kiwi": 9, "lime": 2})  # merge in, overwriting
d = d | {"plum": 4}             # 3.9+: new merged dict

# --- remove ---
d.pop("fig")                    # 6, remove + return
d.pop("nope", None)             # None, no KeyError
del d["lime"]                   # KeyError if missing
d.popitem()                     # ('plum', 4), last added

# --- loop ---
for k in d:                     # keys, insertion order
    print(k)
for k, v in d.items():          # key + value pairs
    print(k, v)
list(d.keys()), list(d.values())  # views -> lists

# --- sort by value ---
# keys ordered by value, largest first
top = sorted(d, key=d.get, reverse=True)
# (key, value) pairs ordered by value
pairs = sorted(d.items(), key=lambda kv: kv[1])
`,
      },
      {
        id: 'defaultdict-counter',
        label: 'defaultdict & Counter',
        summary: '`collections.defaultdict` creates a default value the first time a missing key is used. `Counter` is a dict of counts with extras like `most_common`. Both remove the "is the key there yet?" boilerplate.',
        visuals: [
          {
            type: 'kv',
            title: 'letter counts in banana',
            entries: [['a', 3], ['n', 2], ['b', 1]],
            states: { a: 'max' },
            keyLabel: 'key',
            valLabel: 'count',
          },
          {
            type: 'kv',
            title: 'anagram groups (new keys start as [])',
            layout: 'col',
            entries: [['aet', "['eat', 'tea']"], ['ant', "['tan']"]],
            states: { aet: 'active' },
          },
        ],
        code: `
from collections import defaultdict, Counter

# --- defaultdict: missing key -> factory() ---
count = defaultdict(int)        # missing key starts at 0
for ch in "banana":
    count[ch] += 1              # no KeyError, no if-check
groups = defaultdict(list)      # missing key starts at []
for w in ["eat", "tea", "tan"]:
    key = "".join(sorted(w))    # anagram signature
    groups[key].append(w)       # {'aet': [...], 'ant': [...]}
adj = defaultdict(set)          # graph: node -> neighbours
adj["a"].add("b")               # creates adj['a'] first
"z" in count                    # False; 'in' never inserts
count["z"]                      # 0, but now 'z' IS a key
# same thing on a plain dict, without the import
plain = {}
plain.setdefault("aet", []).append("eat")

# --- Counter: count hashable items ---
c = Counter([3, 1, 3, 3])       # {3: 3, 1: 1}
c = Counter("banana")           # {'a': 3, 'n': 2, 'b': 1}
c["a"]                          # 3
c["z"]                          # 0 for missing, no insert
c.most_common(2)                # [('a', 3), ('n', 2)]
c.update("aab")                 # add counts: a=5, b=2
c.subtract("a")                 # a=4; counts can hit 0 or < 0
c.total()                       # 3.10+: sum of counts, 8
list(c.elements())              # each key repeated count times

# --- Counter math ---
a, b = Counter("aab"), Counter("abc")
a + b                           # {'a': 3, 'b': 2, 'c': 1}
a - b                           # {'a': 1}, drops counts <= 0
a & b                           # {'a': 1, 'b': 1}, min
a | b                           # {'a': 2, 'b': 1, 'c': 1}, max
Counter("listen") == Counter("silent")  # True: anagrams
`,
        notes: [
          'A `Counter` is a dict from item to count. A `defaultdict(list)` starts every new key at `[]`, so grouping is one line: `groups[key].append(word)`.',
          '`defaultdict(f)` calls `f()` for a missing key on `d[k]`. `d.get(k)` and `k in d` do not create keys.',
          'Common factories: `int` (0), `list` ([]), `set` (set()), `lambda: float("inf")`.',
          '`Counter` returns 0 for missing keys instead of raising KeyError.',
          '`most_common()` with no argument returns every item sorted by count, highest first.',
        ],
        tips: [
          'Top K frequent: `Counter(nums).most_common(k)`. Mention the O(n) bucket-sort alternative if asked.',
          'A read like `if d[k]` on a defaultdict silently adds `k`. Use `k in d` for checks.',
        ],
      },
      {
        id: 'how-it-works',
        label: 'Under the hood',
        summary: 'A hash table turns a key into an index: `hash(key) % number_of_buckets`. Different keys can land in the same bucket (a **collision**); chaining keeps a short list per bucket. When it gets too full, it doubles and re-inserts everything.',
        visuals: [
          {
            type: 'buckets',
            title: '4 buckets, 4 keys: load 1.0 > 0.75, so resize',
            buckets: [[{ label: '12: 0' }, { label: '20: 2', s: 'compare' }], [], [], [{ label: '7: 1' }, { label: '3: 3', s: 'new' }]],
            states: { 0: 'compare', 3: 'active' },
          },
          {
            type: 'buckets',
            title: '8 buckets after the resize, then put 15 (15 % 8 = 7)',
            buckets: [[], [], [], [{ label: '3: 3' }], [{ label: '12: 0' }, { label: '20: 2' }], [], [], [{ label: '7: 1' }, { label: '15: 4', s: 'new' }]],
            states: { 7: 'active' },
          },
        ],
        code: `
class HashMap:
    """Hash table with chaining: bucket = [(key, val)]."""

    def __init__(self, cap=8):
        # one empty chain per bucket
        self.buckets = [[] for _ in range(cap)]
        self.size = 0                   # keys stored

    def _bucket(self, key):
        # hash() -> big int; % folds it into 0..cap-1
        i = hash(key) % len(self.buckets)
        return self.buckets[i]          # the chain to search

    def get(self, key, default=None):
        for k, v in self._bucket(key):  # scan one short chain
            if k == key:                # equal key: found
                return v                # its value
        return default                  # not stored

    def put(self, key, value):
        bucket = self._bucket(key)      # where key belongs
        for i, (k, _) in enumerate(bucket):
            if k == key:                # key already there
                bucket[i] = (key, value)  # overwrite value
                return                  # size unchanged
        bucket.append((key, value))     # new key, may collide
        self.size += 1                  # one more key
        # load factor = keys / buckets; high = long chains
        if self.size / len(self.buckets) > 0.75:
            self._resize()              # grow, O(n) but rare

    def remove(self, key):
        bucket = self._bucket(key)      # where key would be
        for i, (k, _) in enumerate(bucket):
            if k == key:                # found it
                del bucket[i]           # O(chain length)
                self.size -= 1          # one fewer key
                return True             # removed
        return False                    # key was not there

    def _resize(self):
        # take every pair out of the old table
        pairs = [p for b in self.buckets for p in b]
        n = 2 * len(self.buckets)       # double the buckets
        self.buckets = [[] for _ in range(n)]
        self.size = 0                   # put() counts again
        for k, v in pairs:              # re-insert everything:
            self.put(k, v)              # new cap, new index

# --- use it ---
# tiny capacity, to force a resize
m = HashMap(cap=4)
for i, k in enumerate([12, 7, 20, 3, 15]):
    m.put(k, i)                         # hash(int) == int
m.get(20)                               # 2
m.remove(7)                             # True
m.get(7, -1)                            # -1, gone
`,
        notes: [
          'Int keys hash to themselves, so the index is just `key % cap`. 12 and 20 collide in bucket 0 and chain. Adding 3 pushes the load factor past 0.75, so the table doubles and every key gets a new index.',
          'Average O(1) needs a good hash and a low load factor. Doubling on resize makes inserts amortized O(1).',
          'Equal objects must have equal hashes. That is why mutable types (list, dict, set) are unhashable.',
          'CPython actually uses **open addressing** (probe other slots on a collision) in a compact array, not chains. The O(1) idea is the same.',
          'String hashes are randomized per process, so the order of a **set** of strings can change between runs. Dict order is insertion order and does not.',
        ],
        tips: [
          'If asked to "design a hash map", write this class: buckets, `hash % cap`, chain scan, resize at a load factor.',
          'Worst case is O(n) per op when every key lands in one bucket. Say this when asked about guarantees.',
        ],
        problems: ['706. Design HashMap', '705. Design HashSet', '1. Two Sum', '380. Insert Delete GetRandom O(1)'],
      },
    ],
  });

  /* ---------------------------------------------------------------- set */
  DSA.addDS({
    id: 'set',
    title: 'Set (Hash Set)',
    category: 'Python Built-ins',
    order: 5,
    tags: ['set', 'hash set', 'frozenset', 'union', 'intersection', 'difference', 'membership', 'dedupe'],
    file: 'sets',
    summary: 'An unordered collection of unique, hashable items. A dict with keys only: O(1) average `add`, `remove` and `in`. Use it to dedupe and for fast "have I seen this?" checks.',
    ops: [
      { op: 's.add(x)', time: 'O(1)', note: 'average' },
      { op: 's.remove(x)  /  s.discard(x)', time: 'O(1)' },
      { op: 'x in s', time: 'O(1)', note: 'the reason to use a set' },
      { op: 'set(xs)', time: 'O(n)' },
      { op: 'a | b', time: 'O(n + m)' },
      { op: 'a & b', time: 'O(min(n, m))' },
      { op: 'a - b', time: 'O(n)', note: 'n = len(a)' },
      { op: 'a ^ b', time: 'O(n + m)' },
      { op: 'a <= b', time: 'O(n)', note: 'subset test, n = len(a)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Add / remove": "O(1)", "x in s": "O(1)", "Union": "O(n + m)", "Intersection": "O(min(n, m))"}, space: 'O(n)' },
    visuals: [
      {
        type: 'buckets',
        title: 'membership test for 4: bucket 4 % 8 = 4',
        buckets: [[], [{ k: 1 }], [], [{ k: 3 }], [{ k: 4, s: 'found' }, { k: 12 }], [], [], []],
        states: { 4: 'active' },
      },
      {
        type: 'array',
        title: 'set algebra',
        showIndex: false,
        rows: [
          { label: 'a', items: [1, 2, 3, 4], states: [null, null, 'found', 'found'], showIndex: false },
          { label: 'b', items: [3, 4, 5], states: ['found', 'found'], showIndex: false },
          { label: 'a & b', items: [3, 4], states: ['found', 'found'], showIndex: false },
          { label: 'a | b', items: [1, 2, 3, 4, 5], showIndex: false },
          { label: 'a - b', items: [1, 2], showIndex: false },
          { label: 'a ^ b', items: [1, 2, 5], showIndex: false },
        ],
      },
    ],
    visualCaption: 'Same hashing as a dict, but buckets hold keys only. Set algebra combines two sets; shared items (3, 4) are what `&` keeps and `^` drops.',
    code: `
# --- create ---
s = set()                   # empty set ({} is a dict!)
s = {3, 1, 4}               # literal
s = set([3, 1, 4, 1])       # {1, 3, 4}, duplicates dropped
s = set("hello")            # {'h', 'e', 'l', 'o'}
s = {x % 3 for x in range(9)}  # comprehension: {0, 1, 2}
fs = frozenset([1, 2])      # immutable + hashable

# --- add ---
s = {3, 1, 4}
s.add(5)                    # O(1); no-op if already there
s.update([6, 7])            # add many

# --- remove ---
s.remove(7)                 # KeyError if missing
s.discard(99)               # no error if missing
s.pop()                     # remove + return ANY item
s.clear()                   # empty it

# --- membership ---
s = {3, 1, 4}
4 in s                      # True, O(1) average
9 not in s                  # True
len(s)                      # 3

# --- set algebra: operators ---
a, b = {1, 2, 3, 4}, {3, 4, 5}
a | b                       # {1, 2, 3, 4, 5}, union
a & b                       # {3, 4}, intersection
a - b                       # {1, 2}, in a but not in b
a ^ b                       # {1, 2, 5}, in exactly one
a |= {6}                    # in place (also &=, -=, ^=)

# --- set algebra: methods (take any iterable) ---
a = {1, 2, 3, 4}
a.union([5], (6,))          # {1, 2, 3, 4, 5, 6}
a.intersection([3, 9])      # {3}
a.difference(b)             # {1, 2}
a.symmetric_difference(b)   # {1, 2, 5}

# --- compare ---
{1, 2} <= {1, 2, 3}         # True, subset (issubset)
{1, 2, 3} >= {1, 2}         # True, superset
{1, 2}.isdisjoint({3})      # True, nothing shared

# --- frozenset: a set you can hash ---
seen = {frozenset({1, 2})}  # a set of sets
frozenset({2, 1}) in seen   # True, order never matters
`,
    notes: [
      'A set is a dict without values: same hashing, same O(1) average, same "items must be hashable" rule.',
      'Unordered: never rely on iteration order. Use `sorted(s)` when order matters.',
      '`{}` is an empty **dict**. An empty set is `set()`.',
      'Operators need sets on both sides. Methods like `union` and `intersection` accept any iterable.',
    ],
    tips: [
      'Build the set once (O(n)) before a loop of lookups, never inside the loop.',
      'Dedupe but keep order: `list(dict.fromkeys(xs))`.',
    ],
    problems: ['217. Contains Duplicate', '128. Longest Consecutive Sequence', '349. Intersection of Two Arrays', '202. Happy Number', '36. Valid Sudoku'],
  });
})();
