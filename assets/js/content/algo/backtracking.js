/* Algorithms · Backtracking */
(function () {
  const U = DSA.util;

  /* ---------- shared helpers ---------- */
  const lst = (a) => '[' + a.join(',') + ']';
  const mk = (id, v, elabel) => { const n = { id, v, children: [] }; if (elabel != null) n.elabel = elabel; return n; };
  function idsOf(root) {
    const out = [];
    const walk = (n) => { out.push(n.id); n.children.forEach(walk); };
    walk(root);
    return out;
  }
  /* Recursion tree view: unseen nodes hidden, current call active,
   * its ancestors (the current path) in blue, finished nodes keep their state. */
  function rview(root, all, seen, stack, marks, title) {
    const states = Object.assign({}, marks), edgeStates = {};
    stack.forEach((n, i) => {
      const last = i === stack.length - 1;
      states[n.id] = last ? 'active' : 'frontier';
      edgeStates[n.id] = last ? 'active' : 'frontier';
    });
    return { type: 'tree', title, root, states, edgeStates, hidden: all.filter((id) => !seen.has(id)) };
  }
  const listRow = (label, items, states) => ({ label, kind: 'list', items, states });
  // small editable nums: numbers only, distinct, at most 3
  const clean3 = (a, d) => {
    const out = [...new Set((Array.isArray(a) ? a : []).map(Number).filter((x) => Number.isFinite(x)).map((x) => Math.max(-99, Math.min(99, Math.round(x)))))].slice(0, 3);
    return out.length ? out : d.slice();
  };
  const numsInput = (d) => ({
    default: { nums: d },
    random: () => ({ nums: U.randArray(3, 1, 9) }),
    fields: [{ key: 'nums', label: 'nums', type: 'array', max: 3 }],
  });

  /* =====================================================================
   * Subsets
   * ===================================================================== */
  DSA.addAlgo({
    id: 'subsets',
    title: 'Subsets',
    category: 'Backtracking',
    order: 1,
    tags: ['power set', 'backtracking', 'combinations', 'choose skip', '2^n'],
    summary: 'Generate all 2ⁿ subsets. Backtracking grows one subset at a time and records every node of the recursion tree; the iterative version doubles the list for each number.',
    complexity: { time: 'O(n · 2ⁿ)', space: 'O(n)', note: '2ⁿ subsets, each copied in O(n). Space excludes the output.' },
    notes: [
      'n numbers give 2ⁿ subsets: each number is either in or out.',
      'Append a **copy**: `res.append(path[:])`. Appending `path` itself stores one list that keeps changing.',
      'Starting the loop at `start` (not 0) means you only pick numbers to the right, so `[1, 2]` and `[2, 1]` are not both produced.',
      'With duplicates (Subsets II): sort, then skip `nums[i] == nums[i - 1]` when `i > start`.',
    ],
    tips: [
      'The backtracking template is: choose, recurse, un-choose. Say it out loud and the code writes itself.',
      '`itertools.combinations(nums, k)` for every k also works if the interviewer allows the library.',
    ],
    problems: ['78. Subsets', '90. Subsets II', '77. Combinations', '1863. Sum of All Subset XOR Totals', '784. Letter Case Permutation'],
    input: numsInput([1, 2, 3]),
    variants: [
      {
        id: 'backtracking',
        label: 'Backtracking',
        summary: 'Every call is one subset: record it, then try adding each number **after** `start`, recurse, and pop it again. The recursion tree has exactly one node per subset.',
        legend: { active: 'current call', frontier: 'current path', found: 'recorded' },
        code: `
def subsets(nums):
    res, path = [], []                 #@init
    def backtrack(start):
        res.append(path[:])            # every node is a subset  #@record
        for i in range(start, len(nums)):  #@for
            path.append(nums[i])       # choose nums[i]  #@choose
            backtrack(i + 1)           # only look right  #@recurse
            path.pop()                 # un-choose  #@undo
    backtrack(0)                       #@call
    return res                         #@done
`,
        trace(inp) {
          const nums = clean3(inp.nums, [1, 2, 3]);
          const n = nums.length;
          let k = 0;
          const build = (start, p) => {
            const node = mk('s' + k++, lst(p));
            for (let i = start; i < n; i++) node.children.push(build(i + 1, p.concat(nums[i])));
            return node;
          };
          const root = build(0, []);
          const all = idsOf(root);
          const t = DSA.tracer();
          const res = [], path = [], seen = new Set(), stack = [], marks = {};
          const S = (line, msg, vars) => t.step(line, msg, {
            view: rview(root, all, seen, stack, marks, 'recursion tree'),
            vars: Object.assign({ path: path.slice() }, vars),
            aux: [listRow('path', path.slice()), listRow('res', res.map((r) => r.slice()), res.length && stack.length ? { [res.length - 1]: 'found' } : {})],
          });
          S('init', `\`res\` and \`path\` start empty. nums = ${U.py(nums)}.`, {});
          S('call', 'Call `backtrack(0)`: every index is still available.', {});
          const bt = (start, node) => {
            seen.add(node.id);
            stack.push(node);
            res.push(path.slice());
            S('record', `Record ${U.py(path)}. res now has ${res.length} subset${res.length > 1 ? 's' : ''}.`, { start });
            node.children.forEach((child, j) => {
              const i = start + j;
              path.push(nums[i]);
              S('choose', `i = ${i}: choose ${nums[i]}. path = ${U.py(path)}.`, { start, i });
              S('recurse', `Call \`backtrack(${i + 1})\`: keep extending ${U.py(path)} with numbers after index ${i}.`, { start, i });
              bt(i + 1, child);
              path.pop();
              S('undo', `Back in ${U.py(path)}: pop ${nums[i]}. path = ${U.py(path)}.`, { start, i });
            });
            S('for', start >= n ? `start = ${start}: no numbers left to add. Return.` : `Tried every i from ${start} to ${n - 1}. Return.`, { start });
            stack.pop();
            marks[node.id] = 'found';
          };
          bt(0, root);
          S('done', `Done: ${res.length} subsets = 2^${n}. Return res.`, { return: res.map((r) => r.slice()) });
          return t.frames;
        },
      },
      {
        id: 'iterative',
        label: 'Iterative',
        file: 'subsets_iterative',
        summary: 'Start with `[[]]`. For each number, copy every subset you have so far and add the number to the copy. The list doubles each time: 1, 2, 4, 8.',
        legend: { active: 'current num', read: 'copied from', new: 'just added' },
        code: `
def subsets(nums):
    res = [[]]                         # just the empty set  #@init
    for num in nums:                   #@for
        # range is fixed first, so new subsets aren't reused
        for i in range(len(res)):      #@inner
            res.append(res[i] + [num])  # copy + add num  #@add
    # one-liner: res += [s + [num] for s in res]
    return res                         # 2 ** n subsets  #@done
`,
        trace(inp) {
          const nums = clean3(inp.nums, [1, 2, 3]);
          const t = DSA.tracer();
          const res = [[]];
          const n = nums.length;
          // res drawn as a table: one row per subset, one cell per item
          const view = (ni, rowStates) => {
            const states = {};
            Object.keys(rowStates).forEach((r) => {
              states['r' + r] = rowStates[r];
              for (let c = 0; c < n; c++) states[r + ',' + c] = rowStates[r];
            });
            const cells = res.map((sub) => U.range(Math.max(n, 1)).map((c) => (c < sub.length ? sub[c] : '')));
            return [
              { type: 'array', title: 'nums', items: nums, states: ni != null ? { [ni]: 'active' } : {}, pointers: ni != null ? [{ i: ni, label: 'num' }] : [] },
              { type: 'grid', title: 'res', cells, rowLabels: res.map((_, r) => `res[${r}]`), states },
            ];
          };
          const S = (line, msg, ni, rs, vars) => t.step(line, msg, { views: view(ni, rs || {}), vars: Object.assign({ res: U.clone(res) }, vars) });
          S('init', '`res` holds one subset: the empty list.', null, {}, {});
          nums.forEach((num, ni) => {
            S('for', `num = ${num}. Every existing subset gets a twin that includes ${num}.`, ni, {}, { num });
            const size = res.length;
            S('inner', `\`len(res)\` is ${size} right now, so loop i = 0..${size - 1}. The copies we add won't be revisited.`, ni, {}, { num, 'len(res)': size });
            for (let i = 0; i < size; i++) {
              res.push(res[i].concat(num));
              S('add', `res[${i}] = ${U.py(res[i])} + [${num}] → append ${U.py(res[res.length - 1])}.`, ni, { [i]: 'read', [res.length - 1]: 'new' }, { num, i });
            }
          });
          S('for', 'No numbers left.', null, {}, {});
          S('done', `Return all ${res.length} subsets.`, null, {}, { return: U.clone(res) });
          return t.frames;
        },
      },
    ],
  });

  /* =====================================================================
   * Permutations
   * ===================================================================== */
  DSA.addAlgo({
    id: 'permutations',
    title: 'Permutations',
    category: 'Backtracking',
    order: 2,
    tags: ['permute', 'backtracking', 'used', 'arrangements', 'n!'],
    summary: 'Build every ordering one position at a time. At each level try every number that is not already used; when the path is full, record it.',
    complexity: { time: 'O(n · n!)', space: 'O(n)', note: 'n! leaves, each copied in O(n). Space is the path, `used` and recursion depth.' },
    legend: { active: 'current call', frontier: 'current path', visited: 'explored', found: 'recorded', bad: 'already used' },
    notes: [
      'n distinct numbers have n! orderings. Level d of the tree has n · (n-1) · ... choices.',
      '`used[i]` (or a set) says which numbers are already in the path, in O(1).',
      'Undo in reverse order of doing: `path.pop()` then `used[i] = False`.',
      'With duplicates (Permutations II): sort, and skip `nums[i] == nums[i-1]` when `nums[i-1]` is not used.',
    ],
    tips: [
      'Swap version: swap `nums[start]` with each `nums[i]`, recurse on `start + 1`, swap back. No `used` array, O(1) extra space.',
      '`list(itertools.permutations(nums))` is the one-liner (returns tuples).',
    ],
    problems: ['46. Permutations', '47. Permutations II', '31. Next Permutation', '60. Permutation Sequence', '784. Letter Case Permutation'],
    input: numsInput([1, 2, 3]),
    code: `
def permute(nums):
    res, path = [], []                 #@init
    used = [False] * len(nums)         # nums[i] in path?  #@used
    def backtrack():
        if len(path) == len(nums):     # full length  #@full
            res.append(path[:])        # copy it  #@record
            return
        for i in range(len(nums)):     #@for
            if used[i]:                # already in the path  #@check
                continue               #@skip
            used[i] = True             # choose nums[i]  #@choose
            path.append(nums[i])       #@choose2
            backtrack()                #@recurse
            path.pop()                 # undo, in reverse  #@undo
            used[i] = False            #@undo2
    backtrack()                        #@call
    return res                         #@done
`,
    trace(inp) {
      const nums = clean3(inp.nums, [1, 2, 3]);
      const n = nums.length;
      let k = 0;
      const build = (p, u) => {
        const node = mk('p' + k++, lst(p));
        if (p.length < n) for (let i = 0; i < n; i++) if (!u[i]) { u[i] = true; node.children.push(build(p.concat(nums[i]), u)); u[i] = false; }
        return node;
      };
      const root = build([], []);
      const all = idsOf(root);
      const t = DSA.tracer();
      const res = [], path = [], used = nums.map(() => false), seen = new Set(), stack = [], marks = {};
      const S = (line, msg, vars, usedSt) => t.step(line, msg, {
        view: rview(root, all, seen, stack, marks, 'recursion tree'),
        vars: Object.assign({ path: path.slice(), used: used.slice() }, vars),
        aux: [
          { label: 'nums', kind: 'list', items: nums.slice(), states: Object.assign({}, ...used.map((u, i) => (u ? { [i]: 'visited' } : {})), usedSt || {}) },
          { label: 'used', kind: 'list', items: used.slice(), states: usedSt || {} },
          listRow('path', path.slice()),
          listRow('res', res.map((r) => r.slice())),
        ],
      });
      S('init', `Empty \`res\` and \`path\`. nums = ${U.py(nums)}.`, {});
      S('used', `\`used\` = ${U.py(used.map(() => false))}: nothing picked yet.`, {});
      S('call', 'Call `backtrack()` on the empty path.', {});
      const bt = (node) => {
        seen.add(node.id);
        stack.push(node);
        if (path.length === n) {
          res.push(path.slice());
          marks[node.id] = 'found';
          S(['full', 'record'], `path ${U.py(path)} has length ${n}: a full permutation. Record it and return.`, {});
          stack.pop();
          return;
        }
        let j = 0;
        for (let i = 0; i < n; i++) {
          if (used[i]) {
            S(['check', 'skip'], `i = ${i}: ${nums[i]} is already in ${U.py(path)}. Skip it.`, { i }, { [i]: 'bad' });
            continue;
          }
          used[i] = true;
          path.push(nums[i]);
          S(['choose', 'choose2'], `i = ${i}: ${nums[i]} is free. Mark it used, path = ${U.py(path)}.`, { i }, { [i]: 'active' });
          S('recurse', `Recurse to fill position ${path.length}.`, { i }, { [i]: 'active' });
          bt(node.children[j++]);
          path.pop();
          used[i] = false;
          S(['undo', 'undo2'], `Back: remove ${nums[i]} and free it. path = ${U.py(path)}.`, { i });
        }
        S('for', `Tried every i for path ${U.py(path)}. Return.`, {});
        stack.pop();
        marks[node.id] = 'visited';
      };
      bt(root);
      delete marks[root.id];
      S('done', `Done: ${res.length} permutations (${n}! = ${res.length}).`, { return: res.map((r) => r.slice()) });
      return t.frames;
    },
  });

  /* =====================================================================
   * Combination sum
   * ===================================================================== */
  const CS = { candidates: [2, 3, 5], target: 6 };

  DSA.addAlgo({
    id: 'combination-sum',
    title: 'Combination Sum',
    category: 'Backtracking',
    order: 3,
    tags: ['backtracking', 'target sum', 'reuse', 'prune', 'unbounded'],
    summary: 'Find every combination of candidates (each usable any number of times) that adds up to the target. Recurse with the remaining amount; stop at 0 (found) or below 0 (prune).',
    complexity: { time: 'O(n^(T/m))', space: 'O(T/m)', note: 'T = target, m = smallest candidate: the deepest path has T/m picks.' },
    legend: { active: 'current call', frontier: 'current path', visited: 'explored', found: 'remaining 0', bad: 'pruned' },
    notes: [
      'Each node shows `remaining`; the edge label is the candidate picked.',
      'Passing `i` (not `i + 1`) lets the same candidate be picked again. Starting at `start` stops `[2, 3]` and `[3, 2]` both showing up.',
      'Sort the candidates and `break` as soon as `candidates[i] > remaining` to prune whole branches, not one node at a time.',
    ],
    tips: [
      'Combination Sum II (each number once): sort, pass `i + 1`, skip equal neighbours.',
      'If only the **count** of ways is asked, this is the coin change DP, not backtracking.',
    ],
    problems: ['39. Combination Sum', '40. Combination Sum II', '216. Combination Sum III', '377. Combination Sum IV', '518. Coin Change II'],
    input: { default: CS },
    code: `
def combination_sum(candidates, target):
    res, path = [], []                 #@init
    def backtrack(start, remaining):
        if remaining == 0:             # exact hit  #@hit
            res.append(path[:])        #@record
            return
        if remaining < 0:              # overshot: prune  #@over
            return                     #@prune
        for i in range(start, len(candidates)):  #@for
            path.append(candidates[i])  # choose  #@choose
            # pass i, not i + 1: it may be reused
            backtrack(i, remaining - candidates[i])  #@recurse
            path.pop()                 # un-choose  #@undo
    backtrack(0, target)               #@call
    return res                         #@done
`,
    trace() {
      const { candidates, target } = CS;
      const n = candidates.length;
      let k = 0;
      const build = (start, rem, el) => {
        const node = mk('c' + k++, rem, el);
        if (rem > 0) for (let i = start; i < n; i++) node.children.push(build(i, rem - candidates[i], candidates[i]));
        return node;
      };
      const root = build(0, target, null);
      const all = idsOf(root);
      const t = DSA.tracer();
      const res = [], path = [], seen = new Set(), stack = [], marks = {};
      const S = (line, msg, vars) => t.step(line, msg, {
        view: rview(root, all, seen, stack, marks, 'remaining at each call'),
        vars: Object.assign({ path: path.slice() }, vars),
        aux: [listRow('path', path.slice()), listRow('res', res.map((r) => r.slice()))],
      });
      S('init', `candidates = ${U.py(candidates)}, target = ${target}. Empty \`res\` and \`path\`.`, {});
      S('call', `Call \`backtrack(0, ${target})\`.`, { start: 0, remaining: target });
      const bt = (start, rem, node) => {
        seen.add(node.id);
        stack.push(node);
        const vars = { start, remaining: rem };
        if (rem === 0) {
          res.push(path.slice());
          marks[node.id] = 'found';
          S(['hit', 'record'], `remaining is 0: ${path.join(' + ')} = ${target}. Record ${U.py(path)} and return.`, vars);
          stack.pop();
          return;
        }
        if (rem < 0) {
          marks[node.id] = 'bad';
          S(['over', 'prune'], `remaining is ${rem}: ${path.join(' + ')} overshoots ${target}. Prune: return.`, vars);
          stack.pop();
          return;
        }
        S(['hit', 'over'], `remaining = ${rem}: not 0, not negative. Try candidates from index ${start} (${candidates.slice(start).join(', ')}).`, vars);
        node.children.forEach((child, j) => {
          const i = start + j;
          path.push(candidates[i]);
          S('choose', `i = ${i}: pick ${candidates[i]}. path = ${U.py(path)}.`, Object.assign({ i }, vars));
          S('recurse', `Call \`backtrack(${i}, ${rem} - ${candidates[i]} = ${rem - candidates[i]})\`.`, Object.assign({ i }, vars));
          bt(i, rem - candidates[i], child);
          path.pop();
          S('undo', `Back at remaining ${rem}: pop ${candidates[i]}. path = ${U.py(path)}.`, Object.assign({ i }, vars));
        });
        S('for', `Tried candidates ${candidates.slice(start).join(', ')} at remaining ${rem}. Return.`, vars);
        stack.pop();
        marks[node.id] = 'visited';
      };
      bt(0, target, root);
      delete marks[root.id];
      S('done', `Return ${res.length} combinations: ${U.py(res)}.`, { return: res.map((r) => r.slice()) });
      return t.frames;
    },
  });

  /* =====================================================================
   * N-Queens
   * ===================================================================== */
  DSA.addAlgo({
    id: 'n-queens',
    title: 'N-Queens',
    category: 'Backtracking',
    order: 4,
    tags: ['queens', 'chess', 'backtracking', 'constraint', 'diagonals', 'board'],
    summary: 'Place one queen per row. For each column, check the column and both diagonals with O(1) set lookups; place, recurse to the next row, and remove the queen on the way back.',
    complexity: { time: 'O(n!)', space: 'O(n)', note: 'Row r has at most n - r safe columns. Space: three sets, `queens` and recursion depth.' },
    legend: { active: 'current row', path: 'queen', compare: 'safe to try', bad: 'attacked', swap: 'attacker', removed: 'backtrack', found: 'solution' },
    notes: [
      'One queen per row, so only columns and diagonals need checking.',
      'Cells on the same down-right diagonal share `r - c`; cells on the same down-left (anti) diagonal share `r + c`.',
      'Three sets make the safety check O(1) instead of scanning the board.',
      'n = 4 has 2 solutions, n = 8 has 92.',
    ],
    tips: [
      'Build output boards at the end: `["." * c + "Q" + "." * (n - c - 1) for c in qs]`.',
      'For N-Queens II (count only), return a number instead of building boards.',
    ],
    problems: ['51. N-Queens', '52. N-Queens II', '37. Sudoku Solver', '79. Word Search'],
    input: { default: {} },
    code: `
def solve_n_queens(n):
    res, queens = [], []    # queens[r] = column in row r  #@init
    cols, diag, anti = set(), set(), set()
    def place(r):
        if r == n:                     # every row has a queen  #@full
            res.append(queens[:])      #@record
            return
        for c in range(n):             # try each column  #@for
            if c in cols or r - c in diag or r + c in anti:  #@check
                continue               # attacked: skip  #@skip
            queens.append(c)           # place at (r, c)  #@place
            cols.add(c)                #@p2
            diag.add(r - c)            # down-right diagonal  #@p3
            anti.add(r + c)            # down-left diagonal  #@p4
            place(r + 1)               # next row  #@recurse
            queens.pop()               # backtrack  #@remove
            cols.remove(c)             #@r2
            diag.remove(r - c)         #@r3
            anti.remove(r + c)         #@r4
    place(0)                           #@call
    return res                         #@done
`,
    trace() {
      const n = 4;
      const t = DSA.tracer();
      const res = [], queens = [], cols = new Set(), diag = new Set(), anti = new Set();
      const board = (o) => {
        o = o || {};
        const cells = Array.from({ length: n }, () => Array(n).fill(''));
        const states = {};
        queens.forEach((c, r) => { cells[r][c] = 'Q'; states[r + ',' + c] = o.found ? 'found' : 'path'; });
        if (o.row != null && o.row < n) states['r' + o.row] = 'active';
        if (o.attacker) states[o.attacker.join(',')] = 'swap';
        if (o.tryCell) {
          cells[o.tryCell[0]][o.tryCell[1]] = o.bad ? '✕' : '?';
          states[o.tryCell.join(',')] = o.bad ? 'bad' : 'compare';
        }
        if (o.removed) { cells[o.removed[0]][o.removed[1]] = 'Q'; states[o.removed.join(',')] = 'removed'; }
        return { type: 'grid', cells, rowLabels: U.range(n).map((r) => 'r' + r), colLabels: U.range(n).map((c) => 'c' + c), states };
      };
      const setRow = (label, s) => ({ label, kind: 'set', items: [...s].sort((a, b) => a - b) });
      const S = (line, msg, vars, o) => t.step(line, msg, {
        view: board(o),
        vars: Object.assign({ n }, vars),
        aux: [
          listRow('queens', queens.slice()),
          setRow('cols', cols), setRow('diag r-c', diag), setRow('anti r+c', anti),
          listRow('res', res.map((r) => r.slice())),
        ],
      });
      S('init', 'Empty board. `queens[r]` will hold the column of the queen in row r.', {}, {});
      S('call', 'Call `place(0)`: start with row 0.', { r: 0 }, { row: 0 });
      const place = (r) => {
        if (r === n) {
          res.push(queens.slice());
          S(['full', 'record'], `r = ${n}: all ${n} rows have a queen. Record solution ${U.py(queens)}.`, { r }, { found: true });
          return;
        }
        for (let c = 0; c < n; c++) {
          const vars = { r, c, 'r - c': r - c, 'r + c': r + c };
          let why = null, att = null;
          if (cols.has(c)) { why = `column ${c} is in \`cols\``; att = [queens.indexOf(c), c]; }
          else if (diag.has(r - c)) { why = `r - c = ${r - c} is in \`diag\``; const qr = queens.findIndex((qc, i) => i - qc === r - c); att = [qr, queens[qr]]; }
          else if (anti.has(r + c)) { why = `r + c = ${r + c} is in \`anti\``; const qr = queens.findIndex((qc, i) => i + qc === r + c); att = [qr, queens[qr]]; }
          if (why) {
            S(['check', 'skip'], `(${r}, ${c}): ${why}, attacked by the queen at (${att[0]}, ${att[1]}). Skip.`, vars, { row: r, tryCell: [r, c], bad: true, attacker: att });
            continue;
          }
          S('check', `(${r}, ${c}): column ${c}, diag ${r - c} and anti ${r + c} are all free. Safe.`, vars, { row: r, tryCell: [r, c] });
          queens.push(c); cols.add(c); diag.add(r - c); anti.add(r + c);
          S(['place', 'p2', 'p3', 'p4'], `Place a queen at (${r}, ${c}). Record column ${c}, diag ${r - c}, anti ${r + c}.`, vars, { row: r });
          S('recurse', `Move on to row ${r + 1}.`, vars, { row: r + 1 });
          place(r + 1);
          queens.pop(); cols.delete(c); diag.delete(r - c); anti.delete(r + c);
          S(['remove', 'r2', 'r3', 'r4'], `Back in row ${r}: remove the queen at (${r}, ${c}) and free its column and diagonals. Try the next column.`, vars, { row: r, removed: [r, c] });
        }
        S('for', r === 0 ? 'Row 0: tried every column. The search is complete.' : `Row ${r}: no more columns to try. Dead end here, return to row ${r - 1}.`, { r }, { row: r });
      };
      place(0);
      S('done', `Return ${res.length} solutions: ${res.map((q) => U.py(q)).join(' and ')} (column per row).`, { return: res.map((q) => q.slice()) }, {});
      return t.frames;
    },
  });
})();
