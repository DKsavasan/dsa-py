/* Data Structures · Python Built-ins (list) */
(function () {
  DSA.addDS({
    id: 'list',
    title: 'List (Dynamic Array)',
    category: 'Python Built-ins',
    order: 1,
    tags: ['array', 'dynamic array', 'append', 'slice'],
    summary: 'An ordered, resizable sequence stored in one contiguous block of memory. Reading or writing by index is instant. Adding or removing at the **end** is cheap; anywhere else shifts every element after it.',
    ops: [
      { op: 'x[i]  /  x[i] = v', time: 'O(1)' },
      { op: 'x.append(v)', time: 'O(1)', note: 'amortized: the array occasionally doubles' },
      { op: 'x.pop()', time: 'O(1)' },
      { op: 'x.pop(0)  /  x.insert(0, v)', time: 'O(n)', note: 'shifts everything; use deque instead' },
      { op: 'v in x  /  x.index(v)', time: 'O(n)' },
      { op: 'x[a:b]', time: 'O(k)', note: 'copies k = b - a items' },
      { op: 'x.sort()  /  sorted(x)', time: 'O(n log n)' },
      { op: 'len(x)', time: 'O(1)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Access": "O(1)", "Search": "O(n)", "Append / pop end": "O(1)", "Insert / delete": "O(n)"}, space: 'O(n)' },
    visual: {
      type: 'array',
      rows: [
        { label: 'x', items: [7, 3, 9, 1, 5, null, null, null], states: [null, null, 'active', null, null], pointers: [{ i: 2, label: 'x[2]' }, { i: 5, label: 'next append', s: 'frontier' }] },
      ],
    },
    visualCaption: 'Five items in a block with room for eight. `x[2]` jumps straight to its slot. `append` writes into the next free slot; when the block is full Python allocates a bigger one and copies everything over.',
    code: `
# --- create ---
x = []                  # empty list
x = [7, 3, 9, 1, 5]     # literal
x = [0] * 5             # [0, 0, 0, 0, 0]
x = list(range(5))      # [0, 1, 2, 3, 4]
# comprehension: squares of even numbers -> [0, 4, 16]
x = [n * n for n in range(5) if n % 2 == 0]
# 2D grid, 2 rows x 3 cols (never [[0] * 3] * 2)
grid = [[0] * 3 for _ in range(2)]

# --- read ---
x = [7, 3, 9, 1, 5]
x[0]                    # 7, first item
x[-1]                   # 5, last item
x[1:3]                  # [3, 9], end is exclusive
x[::-1]                 # reversed copy
len(x)                  # 5

# --- add ---
x.append(4)             # to the end, O(1)
x.extend([6, 8])        # many to the end
x.insert(0, 10)         # at index 0, O(n)

# --- remove ---
x.pop()                 # remove + return last, O(1)
x.pop(0)                # remove + return first, O(n)
x.remove(9)             # first 9; ValueError if missing
del x[1]                # delete by index
x.clear()               # empty it

# --- search ---
x = [7, 3, 9, 1, 5]
9 in x                  # True, O(n) scan
x.index(9)              # 2; ValueError if missing
x.count(3)              # 1

# --- sort / reorder ---
x.sort()                # in place, ascending
x.sort(reverse=True)    # in place, descending
y = sorted(x, key=abs)  # new list, custom key
x.reverse()             # in place

# --- loop ---
for i, v in enumerate(x):   # index + value
    print(i, v)
for a, b in zip(x, x[1:]):  # neighbouring pairs
    print(a, b)
`,
    notes: [
      'A list is an array of pointers, so it can hold mixed types.',
      'Treat the end of a list as a **stack**: `append` and `pop` are both O(1).',
      'Need fast pops from the front? Use `collections.deque`.',
      '`x[:]` or `x.copy()` makes a shallow copy. Nested lists need `copy.deepcopy`.',
    ],
    tips: [
      '`[[0] * n] * m` creates m references to one row. Always use a comprehension for 2D.',
      'Sorting with a key: `intervals.sort(key=lambda p: p[0])`.',
    ],
    problems: ['1. Two Sum', '26. Remove Duplicates from Sorted Array', '189. Rotate Array', '238. Product of Array Except Self'],
  });
})();
