/* Algorithms · Dynamic Programming */
(function () {
  const U = DSA.util;

  /* ---------- small shared helpers ---------- */
  // clamp a user number into [lo, hi] (integers only)
  const num = (x, lo, hi, d) => {
    let v = Math.trunc(Number(x));
    if (!isFinite(v)) v = d;
    return Math.max(lo, Math.min(hi, v));
  };
  const capNote = (raw, used, what) => (Number(raw) !== used ? `(${what} capped at ${used} so the picture stays readable.) ` : '');
  const ints = (a, lo, hi) => (a || []).map((x) => num(x, lo, hi, lo));
  const txt = (s, max) => String(s == null ? '' : s).replace(/\s+/g, '').slice(0, max);
  const q = (s) => `'${s}'`;
  const fmtInf = (x) => (x === Infinity ? 'inf' : String(x));
  // 2D grid of states → { 'r,c': state }
  const cellStates = (fn, rows, cols) => {
    const s = {};
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const v = fn(r, c); if (v) s[r + ',' + c] = v; }
    return s;
  };
  const randWord = (alpha, lo, hi) => Array.from({ length: U.randInt(lo, hi) }, () => alpha[U.randInt(0, alpha.length - 1)]).join('');

  /* =====================================================================
   * Fibonacci: naive / memo / table / two variables
   * ===================================================================== */
  function fibTree(n, memo) {
    let k = 0;
    const solved = new Set();
    const go = (x) => {
      const node = { id: 'c' + k++, v: x, children: [] };
      if (memo && solved.has(x)) { node.hit = true; return node; }
      if (x > 1) {
        node.children.push(go(x - 1));
        node.children.push(go(x - 2));
        if (memo) solved.add(x);
      }
      return node;
    };
    return go(n);
  }
  const treeIds = (root) => { const out = []; (function w(nd) { out.push(nd.id); nd.children.forEach(w); })(root); return out; };

  function fibNaiveTrace(inp) {
    const n = num(inp.n, 0, 6, 5);
    const note = capNote(inp.n, n, 'n');
    const root = fibTree(n, false);
    const ids = treeIds(root);
    const shown = new Set(), fin = {}, badges = {}, stack = [], solvedN = {};
    let calls = 0;
    const t = DSA.tracer();
    const view = () => {
      const states = Object.assign({}, fin);
      const edgeStates = {};
      stack.forEach((nd, i) => { states[nd.id] = i === stack.length - 1 ? 'active' : 'frontier'; edgeStates[nd.id] = 'active'; });
      return { type: 'tree', title: `call tree for n = ${n} · badge = value returned`, root, levelGap: 58, hidden: ids.filter((id) => !shown.has(id)), states, badges: Object.assign({}, badges), edgeStates };
    };
    const aux = () => [{ label: 'call stack', kind: 'stack', items: stack.map((nd, i) => ({ v: `fib(${nd.v})`, s: i === stack.length - 1 ? 'active' : null })) }];
    const step = (line, msg, vars) => t.step(line, msg, { view: view(), vars, aux: aux() });
    const finish = (nd, again) => { stack.pop(); fin[nd.id] = again ? 'bad' : 'done'; solvedN[nd.v] = (solvedN[nd.v] || 0) + 1; };
    const go = (nd) => {
      const x = nd.v;
      shown.add(nd.id);
      stack.push(nd);
      calls++;
      const again = solvedN[x] > 0;
      step('call', (calls === 1 ? note : '') + (again ? `Call fib(${x}) **again**. It was already solved once, but plain recursion has no memory, so it redoes the whole subtree.` : `Call fib(${x}).`), { n: x });
      step('base', x <= 1 ? `${x} <= 1: base case.` : `${x} > 1, not a base case.`, { n: x });
      if (x <= 1) {
        badges[nd.id] = x;
        step('ret_base', `fib(${x}) = ${x}. Return ${x} to the caller.`, { n: x, return: x });
        finish(nd, again);
        return x;
      }
      step('rec', `Need fib(${x - 1}) + fib(${x - 2}). Python evaluates the left call first: fib(${x - 1}).`, { n: x });
      const a = go(nd.children[0]);
      step('rec', `Back in fib(${x}): fib(${x - 1}) returned ${a}. Now call fib(${x - 2}).`, { n: x, 'fib(n - 1)': a });
      const b = go(nd.children[1]);
      const res = a + b;
      badges[nd.id] = res;
      step('rec', `fib(${x}) = ${a} + ${b} = ${res}. Return ${res}.`, { n: x, 'fib(n - 1)': a, 'fib(n - 2)': b, return: res });
      finish(nd, again);
      return res;
    };
    const r = go(root);
    const wasted = Object.values(fin).filter((s) => s === 'bad').length;
    fin[root.id] = 'found';
    step('rec', `fib(${n}) = ${r}. It took ${calls} call${calls > 1 ? 's' : ''} for ${n <= 1 ? 1 : n + 1} distinct subproblem${n <= 1 ? '' : 's'}.` + (wasted ? ` The ${wasted} red call${wasted === 1 ? ' is' : 's are'} repeated work, and that grows like O(2^n).` : ' No repeats yet: try a bigger n.'), { n, return: r });
    return t.frames;
  }

  function fibMemoTrace(inp) {
    const n = num(inp.n, 0, 8, 5);
    const note = capNote(inp.n, n, 'n');
    const root = fibTree(n, true);
    const ids = treeIds(root);
    const shown = new Set(), fin = {}, badges = {}, stack = [];
    const memo = [];                    // [k, v] pairs in insertion order
    let kvStates = {};
    const t = DSA.tracer();
    // picture: keys 2..n laid out up front, grey until stored
    const memoView = () => {
      const entries = [], st = {};
      for (let k = 2; k <= n; k++) {
        const e = memo.find((x) => x[0] === k);
        entries.push([k, e ? e[1] : '']);
        st[k] = kvStates[k] || (e ? null : 'dim');
      }
      return { type: 'kv', title: 'memo · grey = not stored yet', entries, states: st };
    };
    const memoRaw = () => ({ raw: '{' + memo.map(([k, v]) => `${k}: ${v}`).join(', ') + '}' });
    const views = () => {
      const states = Object.assign({}, fin);
      const edgeStates = {};
      stack.forEach((nd, i) => { states[nd.id] = i === stack.length - 1 ? 'active' : 'frontier'; edgeStates[nd.id] = 'active'; });
      return [
        { type: 'tree', title: `calls for n = ${n} · badge = value returned`, root, levelGap: 54, hidden: ids.filter((id) => !shown.has(id)), states, badges: Object.assign({}, badges), edgeStates },
        memoView(),
      ];
    };
    const aux = () => [{ label: 'call stack', kind: 'stack', items: stack.map((nd, i) => ({ v: `go(${nd.v})`, s: i === stack.length - 1 ? 'active' : null })) }];
    const step = (line, msg, vars) => { t.step(line, msg, { views: views(), vars: Object.assign({ memo: memoRaw() }, vars), aux: aux() }); kvStates = {}; };
    step('init', note + 'Empty cache. It will map k → fib(k) once each value is solved.', { n });
    step('done', `Start the recursion with go(${n}).`, { n });
    const go = (nd) => {
      const k = nd.v;
      shown.add(nd.id);
      stack.push(nd);
      step('call', `Call go(${k}).`, { k });
      const has = memo.some((e) => e[0] === k);
      if (has) {
        const v = memo.find((e) => e[0] === k)[1];
        kvStates = { [k]: 'found' };
        step('hit', `${k} is in memo already. No recursion needed.`, { k });
        badges[nd.id] = v;
        kvStates = { [k]: 'found' };
        step('ret_hit', `Cache hit: return memo[${k}] = ${v} in O(1). This whole subtree is skipped.`, { k, return: v });
        stack.pop();
        fin[nd.id] = 'found';
        return v;
      }
      step('hit', `${k} is not in memo yet.`, { k });
      step('base', k <= 1 ? `${k} <= 1: base case.` : `${k} > 1, not a base case.`, { k });
      if (k <= 1) {
        badges[nd.id] = k;
        step('ret_base', `Return ${k}.`, { k, return: k });
        stack.pop();
        fin[nd.id] = 'done';
        return k;
      }
      step('rec', `Solve go(${k - 1}) first.`, { k });
      const a = go(nd.children[0]);
      step('rec', `go(${k - 1}) returned ${a}. Now go(${k - 2}).`, { k, 'go(k - 1)': a });
      const b = go(nd.children[1]);
      memo.push([k, a + b]);
      badges[nd.id] = a + b;
      kvStates = { [k]: 'new' };
      step('rec', `Store memo[${k}] = ${a} + ${b} = ${a + b}. Any later go(${k}) is now a lookup.`, { k, 'go(k - 1)': a, 'go(k - 2)': b });
      step('ret', `Return memo[${k}] = ${a + b}.`, { k, return: a + b });
      stack.pop();
      fin[nd.id] = 'done';
      return a + b;
    };
    const r = go(root);
    fin[root.id] = fin[root.id] || 'done';
    step('done', `fib(${n}) = ${r} using ${ids.length} call${ids.length > 1 ? 's' : ''} instead of exponentially many. Each value is computed once; green nodes were cache hits.`, { n, return: r });
    return t.frames;
  }

  function fibTableTrace(inp) {
    const n = num(inp.n, 0, 15, 5);
    const note = capNote(inp.n, n, 'n');
    const t = DSA.tracer();
    t.step('small', note + (n <= 1 ? `n = ${n} <= 1, so the answer is just n.` : `n = ${n} > 1, so build the table.`), { view: { type: 'array', label: 'dp', items: [] }, vars: { n } });
    if (n <= 1) {
      t.step(3, `Return ${n}.`, { view: { type: 'array', label: 'dp', items: [] }, vars: { n, return: n } });
      return t.frames;
    }
    const dp = new Array(n + 1).fill(0);
    const v = (states, ptr) => ({ type: 'array', label: 'dp', items: dp.slice(), states, pointers: ptr != null ? [{ i: ptr, label: 'i' }] : [] });
    const known = (upto) => dp.map((_, j) => (j <= upto ? 'done' : 'dim'));
    t.step('init', `\`dp = [0] * ${n + 1}\`: one slot for each fib(0)..fib(${n}).`, { view: v(dp.map(() => 'dim')), vars: { n, dp } });
    dp[1] = 1;
    const s0 = known(1);
    s0[1] = 'new';
    t.step('base', 'Base cases: dp[0] = 0 (already), dp[1] = 1.', { view: v(s0), vars: { n, dp } });
    for (let i = 2; i <= n; i++) {
      const s = known(i - 1);
      s[i] = 'active';
      t.step('loop', `i = ${i}. dp[${i - 1}] and dp[${i - 2}] are already filled because we go small to big.`, { view: v(s, i), vars: { n, dp, i } });
      dp[i] = dp[i - 1] + dp[i - 2];
      const s2 = known(i - 1);
      s2[i - 1] = 'read'; s2[i - 2] = 'read'; s2[i] = 'active';
      t.step('fill', `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`, { view: v(s2, i), vars: { n, dp, i } });
    }
    const sf = known(n);
    sf[n] = 'found';
    t.step('done', `Return dp[${n}] = ${dp[n]}. No recursion, no stack: a single loop over ${n - 1} value${n === 2 ? '' : 's'}.`, { view: v(sf), vars: { n, dp, return: dp[n] } });
    return t.frames;
  }

  function fibTwoVarTrace(inp) {
    const n = num(inp.n, 0, 15, 5);
    const note = capNote(inp.n, n, 'n');
    const seq = [0, 1];
    for (let i = 2; i <= n + 1; i++) seq.push(seq[i - 1] + seq[i - 2]);
    const t = DSA.tracer();
    // after k iterations: a = fib(k), b = fib(k + 1)
    const v = (k, st) => ({
      type: 'array', title: 'the sequence · only a and b are kept in memory',
      items: seq.map((x, i) => (i <= k + 1 ? x : null)),
      states: seq.map((_, i) => (i < k ? 'dim' : i === k || i === k + 1 ? st || 'active' : null)),
      pointers: [{ i: k, label: 'a' }, { i: k + 1, label: 'b' }],
    });
    t.step('init', note + '`a, b = 0, 1`: fib(0) and fib(1).', { view: v(0), vars: { n, a: 0, b: 1 } });
    let a = 0, b = 1;
    for (let k = 0; k < n; k++) {
      t.step('loop', `Iteration ${k + 1} of ${n}.`, { view: v(k), vars: { n, _: k, a, b } });
      const na = b, nb = a + b;
      a = na; b = nb;
      t.step('step', `Right side first: (b, a + b) = (${na}, ${na === 0 ? 0 : nb - na} + ${na}) = (${na}, ${nb}). Then assign: a = ${a}, b = ${b}. The old a is dropped.`, { view: v(k + 1, 'new'), vars: { n, _: k, a, b } });
    }
    t.step('loop', `Loop ran ${n} time${n === 1 ? '' : 's'}; stop.`, { view: v(n), vars: { n, a, b } });
    const fv = v(n);
    fv.states[n] = 'found';
    t.step('done', `a = fib(${n}) = ${a}. Same O(n) time, only O(1) memory.`, { view: fv, vars: { n, a, b, return: a } });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'fibonacci',
    title: 'Fibonacci: Memo vs Table',
    category: 'Dynamic Programming',
    order: 1,
    tags: ['dp', 'memoization', 'tabulation', 'lru_cache', 'cache', 'top-down', 'bottom-up', 'recursion tree'],
    summary: 'The smallest DP example. `fib(n) = fib(n - 1) + fib(n - 2)`. Plain recursion recomputes the same subproblems again and again. Cache them (top-down) or fill a table from small to big (bottom-up) and it becomes O(n).',
    complexity: { time: 'O(n)', space: 'O(n)' },
    notes: [
      'DP = recursion + reuse. Two ingredients: **overlapping subproblems** and **optimal substructure**.',
      'Top-down (memo): write the recursion, add a cache. Bottom-up (table): pick an order where every dependency is already filled.',
      '`@functools.cache` (3.9+) or `@lru_cache(maxsize=None)` turns a pure recursive function into a memoized one in one line.',
      'If `dp[i]` only reads the last k entries, keep just k variables: O(1) space.',
    ],
    tips: [
      'State the recurrence and base cases out loud before coding. The code is then mechanical.',
      'Python recursion depth is ~1000 by default. For big n prefer bottom-up (or `sys.setrecursionlimit`).',
    ],
    problems: ['509. Fibonacci Number', '1137. N-th Tribonacci Number', '70. Climbing Stairs', '746. Min Cost Climbing Stairs'],
    input: {
      default: { n: 5 },
      random: () => ({ n: U.randInt(3, 6) }),
      fields: [{ key: 'n', label: 'n', type: 'number' }],
    },
    variants: [
      {
        id: 'naive-recursion',
        label: 'Naive recursion',
        summary: 'Direct translation of the formula. Each call makes two more calls, so the call tree roughly doubles per level. The same `fib(k)` is solved many times (red nodes). Tree capped at n = 6.',
        complexity: { time: 'O(2^n)', space: 'O(n)', note: 'Space is the recursion depth. Time is the number of nodes in the call tree (~1.6^n).' },
        code: `
def fib(n):                                    #@call
    if n <= 1:                  # base cases  #@base
        return n                # fib(0)=0, fib(1)=1  #@ret_base
    # two calls per call: exponential blow-up
    return fib(n - 1) + fib(n - 2)             #@rec
`,
        legend: { active: 'Current call', frontier: 'Waiting on stack', done: 'Returned', bad: 'Repeated work', found: 'Answer' },
        trace: fibNaiveTrace,
      },
      {
        id: 'memoization',
        label: 'Memoization',
        summary: 'Top-down DP. Same recursion, but every answer goes into a dict. The second time `go(k)` is asked, it is a dictionary lookup (green), so each `k` is solved once. Tree capped at n = 8.',
        complexity: { time: 'O(n)', space: 'O(n)', note: 'n cache entries plus O(n) recursion depth.' },
        code: `
def fib(n):
    memo = {}                           # k -> fib(k)  #@init
    def go(k):                                         #@call
        if k in memo:                   # solved before?  #@hit
            return memo[k]              # cache hit, O(1)  #@ret_hit
        if k <= 1:                      # base cases  #@base
            return k                                   #@ret_base
        # solve once, store, reuse forever
        memo[k] = go(k - 1) + go(k - 2)                #@rec
        return memo[k]                                 #@ret
    return go(n)                                       #@done

# one-liner version: put @functools.cache on the naive fib
`,
        legend: { active: 'Current call', frontier: 'Waiting on stack', done: 'Solved', found: 'Cache hit', new: 'Just stored', dim: 'Not stored yet' },
        trace: fibMemoTrace,
      },
      {
        id: 'tabulation',
        label: 'Tabulation',
        summary: 'Bottom-up DP. Allocate `dp[0..n]`, set the base cases, then fill left to right. Every cell only reads cells that are already done. No recursion at all.',
        complexity: { time: 'O(n)', space: 'O(n)' },
        code: `
def fib(n):
    if n <= 1:                          #@small
        return n
    dp = [0] * (n + 1)                  # dp[i] = fib(i)  #@init
    dp[1] = 1                           # dp[0] is already 0  #@base
    for i in range(2, n + 1):           # small to big  #@loop
        dp[i] = dp[i - 1] + dp[i - 2]   # both are known  #@fill
    return dp[n]                                       #@done
`,
        legend: { active: 'Current', read: 'Read', new: 'Just written', done: 'Filled', dim: 'Not yet', found: 'Answer' },
        trace: fibTableTrace,
      },
      {
        id: 'constant-space',
        label: 'Two variables',
        summary: 'Each value only needs the previous two, so drop the table and keep a sliding pair `a, b`. The tuple assignment builds the right side before assigning, so no temp variable is needed.',
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: `
def fib(n):
    a, b = 0, 1                  # fib(0), fib(1)  #@init
    for _ in range(n):           # slide the pair n times  #@loop
        a, b = b, a + b          # rhs is built first  #@step
    return a                     # a == fib(n)  #@done
`,
        legend: { active: 'a, b', new: 'a, b (just moved)', dim: 'Forgotten', found: 'Answer' },
        trace: fibTwoVarTrace,
      },
    ],
  });

  /* =====================================================================
   * Climbing Stairs
   * ===================================================================== */
  DSA.addAlgo({
    id: 'climbing-stairs',
    title: 'Climbing Stairs',
    category: 'Dynamic Programming',
    order: 2,
    tags: ['dp', '1d dp', 'fibonacci', 'count ways'],
    summary: 'Count the ways to climb `n` steps taking 1 or 2 at a time. The last move into step `i` came from `i - 1` or `i - 2`, so `ways(i) = ways(i - 1) + ways(i - 2)`. It is Fibonacci in disguise.',
    complexity: { time: 'O(n)', space: 'O(n)', note: 'O(1) with two variables, like Fibonacci.' },
    notes: [
      'Think "what was the **last** move?" That split gives the recurrence for most counting DPs.',
      '`dp[0] = 1`: there is exactly one way to be at the bottom (do nothing).',
      'With steps from a set S: `dp[i] = sum(dp[i - s] for s in S if s <= i)`.',
      'Counting ways adds the options; min cost takes `min` over them (746. Min Cost Climbing Stairs).',
    ],
    tips: [
      'Mention the O(1) space version: `a, b = b, a + b`.',
      'Answers grow fast. Python ints never overflow, but other languages need `% MOD`.',
    ],
    problems: ['70. Climbing Stairs', '746. Min Cost Climbing Stairs', '91. Decode Ways', '1137. N-th Tribonacci Number'],
    input: {
      default: { n: 5 },
      random: () => ({ n: U.randInt(3, 10) }),
      fields: [{ key: 'n', label: 'n', type: 'number' }],
    },
    code: `
def climb_stairs(n):               # n >= 1
    dp = [0] * (n + 1)             # dp[i] = ways to reach i  #@init
    dp[0] = dp[1] = 1              # ground, first step  #@base
    for i in range(2, n + 1):                          #@loop
        # last move: 1 step from i-1, or 2 steps from i-2
        dp[i] = dp[i - 1] + dp[i - 2]                  #@fill
    return dp[n]                                       #@done
`,
    trace(inp) {
      const n = num(inp.n, 1, 15, 5);
      const note = capNote(inp.n, n, 'n');
      const t = DSA.tracer();
      const dp = new Array(n + 1).fill(0);
      const v = (states, i) => ({ type: 'array', label: 'dp', title: 'ways to reach each step', items: dp.slice(), states, pointers: i != null ? [{ i, label: 'i' }] : [] });
      const known = (upto) => dp.map((_, j) => (j <= upto ? 'done' : 'dim'));
      t.step('init', note + `One slot per step 0..${n}. Step 0 is the ground.`, { view: v(dp.map(() => 'dim')), vars: { n, dp } });
      dp[0] = dp[1] = 1;
      const s0 = known(1);
      s0[0] = s0[1] = 'new';
      t.step('base', 'One way to be on the ground (do nothing). One way to reach step 1 (a single 1-step).', { view: v(s0), vars: { n, dp } });
      for (let i = 2; i <= n; i++) {
        const s = known(i - 1);
        s[i] = 'active';
        t.step('loop', `i = ${i}: how many ways to land on step ${i}?`, { view: v(s, i), vars: { n, dp, i } });
        dp[i] = dp[i - 1] + dp[i - 2];
        const s2 = known(i - 1);
        s2[i - 1] = s2[i - 2] = 'read';
        s2[i] = 'active';
        t.step('fill', `Arrive by a 1-step from ${i - 1} (${dp[i - 1]} ways) or a 2-step from ${i - 2} (${dp[i - 2]} ways). dp[${i}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`, { view: v(s2, i), vars: { n, dp, i } });
      }
      const sf = known(n);
      sf[n] = 'found';
      t.step('done', `Return dp[${n}] = ${dp[n]} distinct way${dp[n] === 1 ? '' : 's'}.`, { view: v(sf), vars: { n, dp, return: dp[n] } });
      return t.frames;
    },
  });

  /* =====================================================================
   * House Robber
   * ===================================================================== */
  DSA.addAlgo({
    id: 'house-robber',
    title: 'House Robber',
    category: 'Dynamic Programming',
    order: 3,
    tags: ['dp', '1d dp', 'take or skip', 'max sum non-adjacent'],
    summary: 'Max sum with no two adjacent picks. At house `i` you either skip it (keep `dp[i - 1]`) or rob it and add to the best from two back (`dp[i - 2] + nums[i]`). Take the max.',
    complexity: { time: 'O(n)', space: 'O(n)', note: 'O(1) with two variables: `prev, curr = curr, max(curr, prev + x)`.' },
    notes: [
      'Classic **take or skip** DP: `dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])`.',
      '`dp[i]` is the best for the prefix `nums[:i + 1]`, not "robbing house i". That keeps the recurrence simple.',
      'Only the last two values are read, so two variables are enough.',
      'Circular street (213): run it twice, on `nums[1:]` and `nums[:-1]`, and take the max.',
    ],
    tips: [
      'Handle length 1 (and 0 if allowed) before touching `nums[1]`.',
      'Greedy "take every other house" fails: [2, 1, 1, 2] → best is 4 (first and last).',
    ],
    problems: ['198. House Robber', '213. House Robber II', '337. House Robber III', '740. Delete and Earn', '2560. House Robber IV'],
    input: {
      default: { nums: [2, 7, 9, 3, 1] },
      random: () => ({ nums: U.randArray(U.randInt(5, 8), 1, 12, false) }),
      fields: [{ key: 'nums', label: 'nums', type: 'array', max: 10, min: 1 }],
    },
    code: `
def rob(nums):
    if len(nums) == 1:                                 #@one
        return nums[0]
    dp = [0] * len(nums)            # dp[i] = best for 0..i  #@init
    dp[0] = nums[0]                 # only one house  #@b0
    dp[1] = max(nums[0], nums[1])   # the richer of two  #@b1
    for i in range(2, len(nums)):                      #@loop
        # skip house i, or rob it on top of dp[i - 2]
        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])    #@fill
    return dp[-1]                                      #@done
`,
    trace(inp) {
      const nums = ints(inp.nums, -99, 999).slice(0, 10);
      if (!nums.length) nums.push(0);
      const n = nums.length;
      const t = DSA.tracer();
      const dp = new Array(n).fill(null);
      const v = (ns, ds, i) => ({ type: 'array', rows: [
        { label: 'nums', items: nums, states: ns || {} },
        { label: 'dp', items: dp.slice(), states: ds || {}, pointers: i != null ? [{ i, label: 'i' }] : [] },
      ] });
      t.step('one', n === 1 ? 'Only one house.' : `${n} houses, so we need the table.`, { view: v(), vars: { nums } });
      if (n === 1) {
        t.step(3, `Return nums[0] = ${nums[0]}.`, { view: v({ 0: 'found' }), vars: { nums, return: nums[0] } });
        return t.frames;
      }
      dp.fill(0);
      t.step('init', `\`dp = [0] * ${n}\`. dp[i] will hold the best loot using houses 0..i.`, { view: v({}, dp.map(() => 'dim')), vars: { nums, dp } });
      dp[0] = nums[0];
      const dim = (from) => dp.map((_, j) => (j >= from ? 'dim' : null));
      t.step('b0', `With one house, rob it: dp[0] = ${nums[0]}.`, { view: v({ 0: 'read' }, Object.assign(dim(1), { 0: 'new' })), vars: { nums, dp } });
      dp[1] = Math.max(nums[0], nums[1]);
      t.step('b1', `Houses 0 and 1 are adjacent, so take the richer: max(${nums[0]}, ${nums[1]}) = ${dp[1]}.`, { view: v({ 0: 'read', 1: 'read' }, Object.assign(dim(2), { 1: 'new' })), vars: { nums, dp } });
      for (let i = 2; i < n; i++) {
        t.step('loop', `House ${i} holds ${nums[i]}.`, { view: v({ [i]: 'active' }, Object.assign(dim(i), { [i]: 'active' }), i), vars: { nums, dp, i } });
        const skip = dp[i - 1], take = dp[i - 2] + nums[i];
        dp[i] = Math.max(skip, take);
        const ds = dim(i + 1);
        ds[i - 1] = 'read'; ds[i - 2] = 'read'; ds[i] = 'active';
        t.step('fill', `Skip it: dp[${i - 1}] = ${skip}. Rob it: dp[${i - 2}] + ${nums[i]} = ${take}. dp[${i}] = max(${skip}, ${take}) = ${dp[i]}${take > skip ? ' (rob)' : take < skip ? ' (skip)' : ''}.`, { view: v({ [i]: 'read' }, ds, i), vars: { nums, dp, i } });
      }
      const ds = dp.map(() => null);
      ds[n - 1] = 'found';
      t.step('done', `Return dp[-1] = ${dp[n - 1]}, the best loot for the whole street.`, { view: v({}, ds), vars: { nums, dp, return: dp[n - 1] } });
      return t.frames;
    },
  });

  /* =====================================================================
   * Coin Change (min coins)
   * ===================================================================== */
  DSA.addAlgo({
    id: 'coin-change',
    title: 'Coin Change',
    category: 'Dynamic Programming',
    order: 4,
    tags: ['dp', 'unbounded knapsack', 'min coins', 'change making'],
    summary: 'Fewest coins that sum to `amount` (unlimited coins of each kind). `dp[a]` is the answer for amount `a`; try every coin as the last one: `dp[a] = min(dp[a - c] + 1)`.',
    complexity: { time: 'O(amount · k)', space: 'O(amount)', note: 'k = number of coin types.' },
    notes: [
      'Unbounded: each coin can be reused, so `dp[a - c]` may already include coin `c`.',
      'Start with `dp[0] = 0` and everything else `inf` (unreachable). Answer `inf` → return -1.',
      'Greedy (largest coin first) is wrong in general: coins [1, 3, 4], amount 6 → greedy 3 coins, DP 2 (3 + 3).',
      'Counting combinations instead (518): `dp[a] += dp[a - c]`, with the **coin loop outside** so orders are not double counted.',
    ],
    tips: [
      '`float(\'inf\') + 1` is still `inf`, so no special casing is needed inside the loop.',
      'BFS over amounts also works (shortest path in coins), same complexity.',
    ],
    problems: ['322. Coin Change', '518. Coin Change II', '279. Perfect Squares', '983. Minimum Cost For Tickets', '377. Combination Sum IV'],
    input: {
      default: { coins: [1, 2, 5], amount: 11 },
      random: () => {
        const coins = U.randArray(U.randInt(2, 3), 1, 6).sort((a, b) => a - b);
        return { coins, amount: U.randInt(5, 12) };
      },
      fields: [
        { key: 'coins', label: 'coins', type: 'array', max: 4, min: 1 },
        { key: 'amount', label: 'amount', type: 'number' },
      ],
    },
    code: `
def coin_change(coins, amount):
    INF = float('inf')
    # dp[a] = fewest coins that sum to a
    dp = [0] + [INF] * amount                          #@init
    for a in range(1, amount + 1):                     #@loop
        for c in coins:
            if c <= a:                  # coin fits  #@fits
                # last coin c + best way to make a - c
                dp[a] = min(dp[a], dp[a - c] + 1)      #@take
    return dp[amount] if dp[amount] != INF else -1     #@done
`,
    trace(inp) {
      const amount = num(inp.amount, 0, 12, 11);
      const coins = [...new Set(ints(inp.coins, 1, 12))].slice(0, 4);
      if (!coins.length) coins.push(1);
      const note = capNote(inp.amount, amount, 'amount');
      const t = DSA.tracer();
      const dp = [0].concat(new Array(amount).fill(Infinity));
      // Infinity does not survive the frame deep-copy (JSON), so draw it as a string
      const v = (states, ptrs) => ({ type: 'array', label: 'dp', title: 'fewest coins for each amount', items: dp.map((x) => (x === Infinity ? '∞' : x)), states, pointers: ptrs || [] });
      const dpv = () => ({ raw: '[' + dp.map(fmtInf).join(', ') + ']' });
      const aux = (ci) => [{ label: 'coins', kind: 'list', items: coins.map((c, i) => ({ v: c, s: i === ci ? 'active' : null })) }];
      t.step('init', note + `dp[0] = 0 (no coins for amount 0). Every other amount starts at inf: not reachable yet.`, { view: v({}), vars: { coins, amount, dp: dpv() }, aux: aux() });
      for (let a = 1; a <= amount; a++) {
        const base = dp.map((_, j) => (j > a ? 'dim' : null));
        t.step('loop', `Amount a = ${a}. Try each coin as the last coin used.`, { view: v(Object.assign(base.slice(), { [a]: 'active' }), [{ i: a, label: 'a' }]), vars: { coins, amount, dp: dpv(), a }, aux: aux() });
        coins.forEach((c, ci) => {
          if (c > a) {
            t.step('fits', `Coin ${c} > ${a}: it does not fit, skip.`, { view: v(Object.assign(base.slice(), { [a]: 'active' }), [{ i: a, label: 'a' }]), vars: { coins, amount, dp: dpv(), a, c }, aux: aux(ci) });
            return;
          }
          const before = dp[a], cand = dp[a - c] + 1;
          dp[a] = Math.min(before, cand);
          const s = base.slice();
          s[a - c] = 'read';
          s[a] = 'active';
          const why = cand === Infinity ? `dp[${a - c}] is inf, so coin ${c} cannot help` : cand < before ? `better, update` : `no improvement`;
          t.step(['fits', 'take'], `Coin ${c} fits. dp[${a}] = min(${fmtInf(before)}, dp[${a - c}] + 1 = ${fmtInf(cand)}) = ${fmtInf(dp[a])}: ${why}.`, { view: v(s, [{ i: a, label: 'a' }, { i: a - c, label: 'a - c', s: 'compare' }]), vars: { coins, amount, dp: dpv(), a, c }, aux: aux(ci) });
        });
      }
      const ans = dp[amount] === Infinity ? -1 : dp[amount];
      t.step('done', ans === -1 ? `dp[${amount}] is still inf: ${amount} cannot be made from these coins. Return -1.` : `Return dp[${amount}] = ${ans} coin${ans === 1 ? '' : 's'}.`, { view: v({ [amount]: ans === -1 ? 'bad' : 'found' }), vars: { coins, amount, dp: dpv(), return: ans }, aux: aux() });
      return t.frames;
    },
  });

  /* =====================================================================
   * 0/1 Knapsack
   * ===================================================================== */
  const knapIn = (inp) => {
    const cap = num(inp.cap, 0, 7, 7);
    let w = ints(inp.weights, 1, 9), val = ints(inp.values, 0, 99);
    const n = Math.min(w.length, val.length, 5);
    w = w.slice(0, n); val = val.slice(0, n);
    if (!n) { w = [1]; val = [1]; }
    return { weights: w, values: val, cap, note: capNote(inp.cap, cap, 'cap') };
  };
  DSA.addAlgo({
    id: 'knapsack',
    title: '0/1 Knapsack',
    category: 'Dynamic Programming',
    order: 5,
    tags: ['dp', '2d dp', 'take or skip', 'subset', 'capacity'],
    summary: 'Pick items (each at most once) to maximize value without exceeding capacity. For each item and each capacity, either skip the item or take it and use the best answer for the remaining capacity.',
    complexity: { time: 'O(n · W)', space: 'O(n · W)', note: 'W = capacity. Pseudo-polynomial: it depends on the number W, not its bit length.' },
    notes: [
      'Recurrence: `dp[i][w] = max(dp[i-1][w], dp[i-1][w - wt] + val)` if the item fits.',
      'Row `i` only reads row `i - 1`, so one 1D array is enough if you loop capacity **backwards**.',
      'Unbounded knapsack (reuse items) = same 1D loop but **forwards**.',
      'Many problems are knapsack in disguise: Partition Equal Subset Sum, Target Sum, Last Stone Weight II.',
    ],
    tips: [
      'Say which loop is outside: items outside, capacity inside.',
      'For "is sum S reachable?", use a boolean dp (or a bitset int: `bits |= bits << x`).',
    ],
    problems: ['416. Partition Equal Subset Sum', '494. Target Sum', '1049. Last Stone Weight II', '474. Ones and Zeroes', '322. Coin Change'],
    input: {
      default: { weights: [1, 3, 4, 5], values: [1, 4, 5, 7], cap: 7 },
      random: () => {
        const n = U.randInt(3, 4);
        return { weights: U.randArray(n, 1, 5, false), values: U.randArray(n, 1, 9, false), cap: U.randInt(5, 7) };
      },
      fields: [
        { key: 'weights', label: 'weights', type: 'array', max: 5, min: 1 },
        { key: 'values', label: 'values', type: 'array', max: 5, min: 1 },
        { key: 'cap', label: 'cap', type: 'number' },
      ],
    },
    variants: [
      {
        id: '2d-table',
        label: '2D table',
        summary: 'Build `dp[i][w]` = best value using the first `i` items with capacity `w`. Each cell looks straight up (skip the item) and up-left by the item\'s weight (take it).',
        complexity: { time: 'O(n · W)', space: 'O(n · W)' },
        code: `
def knapsack(weights, values, cap):
    n = len(weights)
    # dp[i][w] = best value, first i items, capacity w
    dp = [[0] * (cap + 1) for _ in range(n + 1)]       #@init
    for i in range(1, n + 1):
        wt, val = weights[i - 1], values[i - 1]  # item i  #@item
        for w in range(cap + 1):
            dp[i][w] = dp[i - 1][w]        # skip item i  #@skip
            if wt <= w:                    # item fits  #@fits
                take = dp[i - 1][w - wt] + val         #@take
                dp[i][w] = max(dp[i][w], take)         #@max
    return dp[n][cap]                                  #@done
`,
        trace(inp) {
          const { weights, values, cap, note } = knapIn(inp);
          const n = weights.length;
          const t = DSA.tracer();
          const dp = Array.from({ length: n + 1 }, () => new Array(cap + 1).fill(0));
          const rowLabels = ['none'].concat(weights.map((w, i) => `w=${w} v=${values[i]}`));
          const colLabels = U.range(cap + 1);
          // cells after (ci, cw) in fill order are still untouched
          const g = (ci, cw, extra) => {
            const st = cellStates((r, c) => (r > ci || (r === ci && c > cw) ? 'dim' : null), n + 1, cap + 1);
            return { type: 'grid', title: 'best value · row = items so far, column = capacity', cells: dp.map((r) => r.slice()), rowLabels, colLabels, states: Object.assign(st, extra || {}) };
          };
          t.step('init', note + `(n + 1) × (cap + 1) = ${n + 1} × ${cap + 1} table of zeros. Row 0 = no items, so every capacity is worth 0.`, { view: g(0, cap), vars: { n, cap } });
          for (let i = 1; i <= n; i++) {
            const wt = weights[i - 1], val = values[i - 1];
            t.step('item', `Item ${i}: weight ${wt}, value ${val}. Fill row ${i}.`, { view: g(i - 1, cap, { ['r' + i]: 'active' }), vars: { n, cap, i, wt, val } });
            for (let w = 0; w <= cap; w++) {
              dp[i][w] = dp[i - 1][w];
              const base = { ['r' + i]: 'active', ['c' + w]: 'active', [i + ',' + w]: 'active', [(i - 1) + ',' + w]: 'read' };
              if (wt > w) {
                t.step(['skip', 'fits'], `w = ${w}: weight ${wt} > ${w}, the item cannot fit. Copy from above: dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}.`, { view: g(i, w, base), vars: { i, wt, val, w, 'dp[i][w]': dp[i][w] } });
                continue;
              }
              t.step('skip', `w = ${w}: skipping gives dp[${i - 1}][${w}] = ${dp[i][w]}. Weight ${wt} <= ${w}, so also try taking it.`, { view: g(i, w, base), vars: { i, wt, val, w, 'dp[i][w]': dp[i][w] } });
              const take = dp[i - 1][w - wt] + val;
              const skip = dp[i][w];
              dp[i][w] = Math.max(skip, take);
              const st = { ['r' + i]: 'active', ['c' + w]: 'active', [i + ',' + w]: 'active', [(i - 1) + ',' + w]: 'read', [(i - 1) + ',' + (w - wt)]: 'read' };
              t.step(['take', 'max'], `take = dp[${i - 1}][${w - wt}] + ${val} = ${take}. dp[${i}][${w}] = max(${skip}, ${take}) = ${dp[i][w]}${take > skip ? ' (take it)' : ' (skip it)'}.`, { view: g(i, w, st), vars: { i, wt, val, w, take, 'dp[i][w]': dp[i][w] } });
            }
          }
          t.step('done', `Return dp[${n}][${cap}] = ${dp[n][cap]}: best value using any of the ${n} item${n === 1 ? '' : 's'} with capacity ${cap}.`, { view: g(n, cap, { [n + ',' + cap]: 'found' }), vars: { n, cap, return: dp[n][cap] } });
          return t.frames;
        },
      },
      {
        id: '1d-array',
        label: '1D array',
        legend: { active: 'dp[w] being updated', read: 'dp[w - wt] (old value)', new: 'Updated for this item', done: 'Item done', found: 'Answer' },
        summary: 'Row `i` only reads row `i - 1`, so keep one row and overwrite it. Loop capacity **from high to low**: then `dp[w - wt]` (to the left) still holds the old, "without this item" value, so no item is used twice.',
        complexity: { time: 'O(n · W)', space: 'O(W)' },
        notes: [
          'Why backwards? Going left to right, `dp[w - wt]` might already include this item, so it could be taken twice. That is the **unbounded** knapsack.',
          'The inner loop stops at `wt`: smaller capacities cannot fit the item and keep their old value for free.',
          'Same trick for Partition Equal Subset Sum: `for s in range(target, x - 1, -1): dp[s] |= dp[s - x]`.',
          'Unbounded knapsack / coin change: loop capacity forwards.',
        ],
        code: `
def knapsack(weights, values, cap):
    dp = [0] * (cap + 1)            # dp[w] = best, capacity w  #@init
    for wt, val in zip(weights, values):               #@item
        # right to left: dp[w - wt] is still last row's
        # value, so this item is used at most once
        for w in range(cap, wt - 1, -1):               #@loop
            dp[w] = max(dp[w], dp[w - wt] + val)       #@max
    return dp[cap]                                     #@done
`,
        trace(inp) {
          const { weights, values, cap, note } = knapIn(inp);
          const n = weights.length;
          const t = DSA.tracer();
          const dp = new Array(cap + 1).fill(0);
          const v = (states, ptrs) => ({ type: 'array', label: 'dp', title: 'best value for each capacity', items: dp.slice(), states, pointers: ptrs || [] });
          const aux = (cur) => [{ label: 'items (wt, val)', kind: 'list', items: weights.map((w, i) => ({ v: `(${w}, ${values[i]})`, s: i === cur ? 'active' : i < cur ? 'done' : null })) }];
          t.step('init', note + `One row of ${cap + 1} zeros: with no items every capacity is worth 0.`, { view: v({}), vars: { cap, dp }, aux: aux(-1) });
          weights.forEach((wt, k) => {
            const val = values[k];
            t.step('item', `Item (weight ${wt}, value ${val}). ${wt > cap ? `Too heavy for any capacity, nothing changes.` : `Update capacities ${cap} down to ${wt}.`}`, { view: v({}), vars: { cap, dp, wt, val }, aux: aux(k) });
            for (let w = cap; w >= wt; w--) {
              const before = dp[w], take = dp[w - wt] + val;
              const s = {};
              for (let j = w + 1; j <= cap; j++) s[j] = 'new';
              s[w - wt] = 'read';
              s[w] = 'active';
              t.step('loop', `w = ${w}.`, { view: v(s, [{ i: w, label: 'w' }, { i: w - wt, label: 'w - wt', s: 'compare' }]), vars: { cap, dp, wt, val, w }, aux: aux(k) });
              dp[w] = Math.max(before, take);
              t.step('max', `dp[${w}] = max(${before}, dp[${w - wt}] + ${val} = ${take}) = ${dp[w]}. dp[${w - wt}] is left of w, not updated yet for this item, so it is the "without this item" value.`, { view: v(s, [{ i: w, label: 'w' }, { i: w - wt, label: 'w - wt', s: 'compare' }]), vars: { cap, dp, wt, val, w }, aux: aux(k) });
            }
          });
          t.step('done', `Return dp[${cap}] = ${dp[cap]}.`, { view: v({ [cap]: 'found' }), vars: { cap, dp, return: dp[cap] }, aux: aux(n) });
          return t.frames;
        },
      },
    ],
  });

  /* =====================================================================
   * Longest Common Subsequence
   * ===================================================================== */
  DSA.addAlgo({
    id: 'lcs',
    title: 'Longest Common Subsequence',
    category: 'Dynamic Programming',
    order: 6,
    tags: ['dp', '2d dp', 'strings', 'lcs', 'diff', 'backtrack'],
    summary: '`dp[i][j]` = LCS length of the prefixes `a[:i]` and `b[:j]`. If the last chars match, extend the diagonal by 1; otherwise drop a char from one string and take the better. Walk back from the corner to rebuild the string.',
    complexity: { time: 'O(m · n)', space: 'O(m · n)', note: 'Length only: two rows are enough, O(min(m, n)).' },
    notes: [
      'Extra row and column of zeros = empty prefix. That removes all edge checks.',
      'Match: `dp[i-1][j-1] + 1`. No match: `max(dp[i-1][j], dp[i][j-1])`.',
      'Rebuild by walking back: diagonal on a match, else toward the larger neighbour.',
      'Subsequence ≠ substring. Longest common **substring** resets to 0 on mismatch.',
    ],
    tips: [
      'Indices are off by one: `dp[i][j]` compares `a[i - 1]` and `b[j - 1]`.',
      'Related: Edit Distance, Shortest Common Supersequence (`m + n - lcs`), Delete Operation for Two Strings.',
    ],
    problems: ['1143. Longest Common Subsequence', '583. Delete Operation for Two Strings', '1092. Shortest Common Supersequence', '712. Minimum ASCII Delete Sum', '97. Interleaving String'],
    input: {
      default: { a: 'abcbdab', b: 'bdcaba' },
      random: () => ({ a: randWord('abcd', 4, 7), b: randWord('abcd', 3, 6) }),
      fields: [
        { key: 'a', label: 'a', type: 'text' },
        { key: 'b', label: 'b', type: 'text' },
      ],
    },
    code: `
def lcs(a, b):
    m, n = len(a), len(b)
    # dp[i][j] = LCS length of a[:i] and b[:j]
    dp = [[0] * (n + 1) for _ in range(m + 1)]         #@init
    for i in range(1, m + 1):                          #@row
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:       # chars match  #@cmp
                dp[i][j] = dp[i - 1][j - 1] + 1        #@diag
            else:                          # drop one char
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  #@max
    # walk back from the corner to rebuild one LCS
    i, j, out = m, n, []                               #@walk
    while i > 0 and j > 0:                             #@wloop
        if a[i - 1] == b[j - 1]:                       #@bmatch
            out.append(a[i - 1])        # part of the LCS  #@take
            i, j = i - 1, j - 1                        #@move
        elif dp[i - 1][j] >= dp[i][j - 1]:             #@bup
            i -= 1                      # go up  #@up
        else:
            j -= 1                      # go left  #@left
    return ''.join(reversed(out))                      #@done
`,
    trace(inp) {
      const a = txt(inp.a, 7), b = txt(inp.b, 7);
      const note = String(inp.a || '').length > 7 || String(inp.b || '').length > 7 ? '(strings capped at 7 chars.) ' : '';
      const m = a.length, n = b.length;
      const t = DSA.tracer();
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      const rowLabels = ["''"].concat(a.split(''));
      const colLabels = ["''"].concat(b.split(''));
      const g = (ci, cj, extra) => {
        const st = cellStates((r, c) => (r > 0 && c > 0 && (r > ci || (r === ci && c > cj)) ? 'dim' : null), m + 1, n + 1);
        return { type: 'grid', title: 'LCS length for each pair of prefixes', cells: dp.map((r) => r.slice()), rowLabels, colLabels, states: Object.assign(st, extra || {}) };
      };
      t.step('init', note + `${m + 1} × ${n + 1} table of zeros. Row 0 and column 0 are the empty prefix: LCS with '' is 0.`, { view: g(0, n), vars: { a, b, m, n } });
      for (let i = 1; i <= m; i++) {
        t.step('row', `Row i = ${i}: prefix ${q(a.slice(0, i))}, newest char ${q(a[i - 1])}.`, { view: g(i - 1, n, { ['r' + i]: 'active' }), vars: { m, n, i } });
        for (let j = 1; j <= n; j++) {
          const ca = a[i - 1], cb = b[j - 1];
          const st = { ['r' + i]: 'active', ['c' + j]: 'active', [i + ',' + j]: 'active' };
          if (ca === cb) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
            st['r' + i] = st['c' + j] = 'found';
            st[(i - 1) + ',' + (j - 1)] = 'read';
            t.step(['cmp', 'diag'], `${q(ca)} == ${q(cb)}: extend the diagonal. dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}.`, { view: g(i, j, st), vars: { i, j, 'a[i-1]': ca, 'b[j-1]': cb, 'dp[i][j]': dp[i][j] } });
          } else {
            const up = dp[i - 1][j], left = dp[i][j - 1];
            dp[i][j] = Math.max(up, left);
            st[(i - 1) + ',' + j] = 'read';
            st[i + ',' + (j - 1)] = 'read';
            t.step(['cmp', 'max'], `${q(ca)} != ${q(cb)}: best of dropping one char. dp[${i}][${j}] = max(up ${up}, left ${left}) = ${dp[i][j]}.`, { view: g(i, j, st), vars: { i, j, 'a[i-1]': ca, 'b[j-1]': cb, 'dp[i][j]': dp[i][j] } });
          }
        }
      }
      let i = m, j = n;
      const out = [];
      const path = { [m + ',' + n]: 'path' };
      const pv = (extra) => g(m, n, Object.assign({}, path, extra || {}));
      const aux = () => [{ label: 'out', kind: 'list', items: out.slice(), quote: true }];
      t.step('walk', `Table done: LCS length is dp[${m}][${n}] = ${dp[m][n]}. Now walk back from the corner to recover the characters.`, { view: pv({ [m + ',' + n]: 'found' }), vars: { i, j, out }, aux: aux() });
      while (true) {
        t.step('wloop', i > 0 && j > 0 ? `i = ${i}, j = ${j}: both still > 0.` : `Hit the edge (i = ${i}, j = ${j}). Stop.`, { view: pv({ [i + ',' + j]: 'active' }), vars: { i, j, out }, aux: aux() });
        if (!(i > 0 && j > 0)) break;
        const ca = a[i - 1], cb = b[j - 1];
        if (ca === cb) {
          out.push(ca);
          path[i + ',' + j] = 'found';
          const ex = { [i + ',' + j]: 'found', ['r' + i]: 'found', ['c' + j]: 'found' };
          i--; j--;
          path[i + ',' + j] = 'path';
          t.step(['bmatch', 'take', 'move'], `${q(ca)} == ${q(cb)}: this char is in the LCS. Append it, move diagonally to (${i}, ${j}).`, { view: pv(Object.assign(ex, { [i + ',' + j]: 'active' })), vars: { i, j, out }, aux: aux() });
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
          const ex = { [(i - 1) + ',' + j]: 'read', [i + ',' + (j - 1)]: 'read' };
          const u = dp[i - 1][j], l = dp[i][j - 1];
          i--;
          path[i + ',' + j] = 'path';
          t.step(['bup', 'up'], `${q(ca)} != ${q(cb)}. Up (${u}) >= left (${l}), so the value came from above: i = ${i}.`, { view: pv(Object.assign(ex, { [i + ',' + j]: 'active' })), vars: { i, j, out }, aux: aux() });
        } else {
          const ex = { [(i - 1) + ',' + j]: 'read', [i + ',' + (j - 1)]: 'read' };
          const u = dp[i - 1][j], l = dp[i][j - 1];
          j--;
          path[i + ',' + j] = 'path';
          t.step(['bup', 'left'], `${q(ca)} != ${q(cb)}. Left (${l}) > up (${u}), so move left: j = ${j}.`, { view: pv(Object.assign(ex, { [i + ',' + j]: 'active' })), vars: { i, j, out }, aux: aux() });
        }
      }
      const res = out.slice().reverse().join('');
      t.step('done', `\`out\` was built backwards. Reverse it: return ${q(res)} (length ${res.length}).`, { view: pv(), vars: { i, j, out, return: res }, aux: aux() });
      return t.frames;
    },
  });

  /* =====================================================================
   * Edit Distance
   * ===================================================================== */
  DSA.addAlgo({
    id: 'edit-distance',
    title: 'Edit Distance',
    category: 'Dynamic Programming',
    order: 7,
    tags: ['dp', '2d dp', 'strings', 'levenshtein', 'insert delete replace'],
    summary: 'Fewest inserts, deletes and replaces to turn `a` into `b` (Levenshtein). `dp[i][j]` = cost for `a[:i]` → `b[:j]`. Equal chars are free (diagonal); otherwise 1 + the cheapest of the three neighbours.',
    complexity: { time: 'O(m · n)', space: 'O(m · n)', note: 'Two rows are enough for the number alone.' },
    notes: [
      'Up `dp[i-1][j]` = delete `a[i-1]`. Left `dp[i][j-1]` = insert `b[j-1]`. Diagonal `dp[i-1][j-1]` = replace (or free if equal).',
      'Base cases: `dp[i][0] = i` (delete everything), `dp[0][j] = j` (insert everything).',
      'Same table shape as LCS. With only insert/delete allowed the answer is `m + n - 2 * lcs`.',
    ],
    tips: [
      'Draw the 3 arrows into a cell and name each operation before coding.',
      'One Edit Distance (161) needs no table: a single linear scan.',
    ],
    problems: ['72. Edit Distance', '583. Delete Operation for Two Strings', '161. One Edit Distance', '1143. Longest Common Subsequence'],
    input: {
      default: { a: 'horse', b: 'ros' },
      random: () => {
        const pairs = [['kitten', 'sitting'], ['sunday', 'saturd'], ['intent', 'execut'], ['flaw', 'lawn'], ['cat', 'cut'], ['park', 'spake']];
        return Math.random() < 0.5 ? (([a, b]) => ({ a, b }))(pairs[U.randInt(0, pairs.length - 1)]) : { a: randWord('abc', 3, 6), b: randWord('abc', 3, 6) };
      },
      fields: [
        { key: 'a', label: 'a', type: 'text' },
        { key: 'b', label: 'b', type: 'text' },
      ],
    },
    code: `
def min_distance(a, b):
    m, n = len(a), len(b)
    # dp[i][j] = edits to turn a[:i] into b[:j]
    dp = [[0] * (n + 1) for _ in range(m + 1)]         #@init
    for i in range(m + 1):
        dp[i][0] = i                    # delete all i  #@col0
    for j in range(n + 1):
        dp[0][j] = j                    # insert all j  #@row0
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:                   #@cmp
                dp[i][j] = dp[i - 1][j - 1]  # free  #@same
            else:
                dp[i][j] = 1 + min(                    #@diff
                    dp[i - 1][j],       # delete a[i-1]
                    dp[i][j - 1],       # insert b[j-1]
                    dp[i - 1][j - 1],   # replace
                )
    return dp[m][n]                                    #@done
`,
    trace(inp) {
      const a = txt(inp.a, 7), b = txt(inp.b, 7);
      const note = String(inp.a || '').length > 7 || String(inp.b || '').length > 7 ? '(strings capped at 7 chars.) ' : '';
      const m = a.length, n = b.length;
      const t = DSA.tracer();
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      const rowLabels = ["''"].concat(a.split(''));
      const colLabels = ["''"].concat(b.split(''));
      let doneCol = false, doneRow = false;
      const g = (ci, cj, extra) => {
        const st = cellStates((r, c) => {
          if (c === 0 && r > 0) return doneCol ? null : 'dim';
          if (r === 0 && c > 0) return doneRow ? null : 'dim';
          if (r === 0 && c === 0) return null;
          return r > ci || (r === ci && c > cj) ? 'dim' : null;
        }, m + 1, n + 1);
        return { type: 'grid', title: 'edits for each pair of prefixes (row = a, column = b)', cells: dp.map((r) => r.slice()), rowLabels, colLabels, states: Object.assign(st, extra || {}) };
      };
      t.step('init', note + `${m + 1} × ${n + 1} table. Turn ${q(a)} into ${q(b)}.`, { view: g(0, n), vars: { a, b, m, n } });
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      doneCol = true;
      const cs = {};
      for (let i = 0; i <= m; i++) cs[i + ',0'] = 'new';
      t.step('col0', `Column 0: turning ${q(a.slice(0, Math.min(m, 3)))}${m > 3 ? '…' : ''} into '' takes i deletes, so dp[i][0] = i.`, { view: g(0, n, cs), vars: { m, n, i: m } });
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      doneRow = true;
      const rs = {};
      for (let j = 0; j <= n; j++) rs['0,' + j] = 'new';
      t.step('row0', `Row 0: turning '' into b[:j] takes j inserts, so dp[0][j] = j.`, { view: g(0, n, rs), vars: { m, n, j: n } });
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const ca = a[i - 1], cb = b[j - 1];
          const st = { ['r' + i]: 'active', ['c' + j]: 'active', [i + ',' + j]: 'active', [(i - 1) + ',' + (j - 1)]: 'read' };
          if (ca === cb) {
            dp[i][j] = dp[i - 1][j - 1];
            st['r' + i] = st['c' + j] = 'found';
            t.step(['cmp', 'same'], `${q(ca)} == ${q(cb)}: no edit needed. dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}.`, { view: g(i, j, st), vars: { i, j, 'a[i-1]': ca, 'b[j-1]': cb, 'dp[i][j]': dp[i][j] } });
          } else {
            const del = dp[i - 1][j], ins = dp[i][j - 1], rep = dp[i - 1][j - 1];
            const best = Math.min(del, ins, rep);
            dp[i][j] = 1 + best;
            st[(i - 1) + ',' + j] = 'read';
            st[i + ',' + (j - 1)] = 'read';
            const op = rep === best ? `replace ${q(ca)}→${q(cb)}` : del === best ? `delete ${q(ca)}` : `insert ${q(cb)}`;
            t.step(['cmp', 'diff'], `${q(ca)} != ${q(cb)}: 1 + min(delete ${del}, insert ${ins}, replace ${rep}) = ${dp[i][j]} (${op}).`, { view: g(i, j, st), vars: { i, j, 'a[i-1]': ca, 'b[j-1]': cb, 'dp[i][j]': dp[i][j] } });
          }
        }
      }
      t.step('done', `Return dp[${m}][${n}] = ${dp[m][n]}: ${q(a)} → ${q(b)} takes ${dp[m][n]} edit${dp[m][n] === 1 ? '' : 's'}.`, { view: g(m, n, { [m + ',' + n]: 'found' }), vars: { m, n, return: dp[m][n] } });
      return t.frames;
    },
  });

  /* =====================================================================
   * Longest Increasing Subsequence
   * ===================================================================== */
  const lisIn = (inp) => {
    const nums = ints(inp.nums, -999, 999).slice(0, 10);
    if (!nums.length) nums.push(0);
    return nums;
  };
  DSA.addAlgo({
    id: 'lis',
    title: 'Longest Increasing Subsequence',
    category: 'Dynamic Programming',
    order: 8,
    tags: ['dp', 'lis', 'patience sorting', 'bisect', 'binary search'],
    summary: 'Length of the longest strictly increasing subsequence. The O(n²) DP asks "what is the best run ending here?"; the O(n log n) version keeps the smallest possible tail for every length and binary searches it.',
    complexity: { time: 'O(n²)', space: 'O(n)' },
    notes: [
      'Subsequence: keep order, may skip elements. Strictly increasing uses `<` / `bisect_left`; non-decreasing uses `<=` / `bisect_right`.',
      '`dp[i]` = length of the best run **ending at** i, so the answer is `max(dp)`, not `dp[-1]`.',
      '`tails` is always sorted, which is why binary search works on it.',
      '`tails` is not an actual subsequence. To rebuild one, store a parent index per element.',
    ],
    tips: [
      'Start with O(n²), then offer the `bisect` version as the follow-up.',
      'Russian Doll Envelopes (354): sort by width asc and height **desc**, then LIS on heights.',
    ],
    problems: ['300. Longest Increasing Subsequence', '354. Russian Doll Envelopes', '673. Number of Longest Increasing Subsequence', '1671. Minimum Number of Removals to Make Mountain Array', '334. Increasing Triplet Subsequence'],
    input: {
      default: { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
      random: () => ({ nums: U.randArray(U.randInt(6, 9), 1, 30) }),
      fields: [{ key: 'nums', label: 'nums', type: 'array', max: 10, min: 1 }],
    },
    variants: [
      {
        id: 'dp-n2',
        label: 'DP O(n²)',
        summary: '`dp[i]` = length of the longest increasing subsequence that **ends at** `nums[i]`. For each earlier `j` with a smaller value, `nums[i]` can extend that run: `dp[i] = max(dp[i], dp[j] + 1)`.',
        complexity: { time: 'O(n²)', space: 'O(n)' },
        code: `
def length_of_lis(nums):
    # dp[i] = longest increasing run that ends at nums[i]
    dp = [1] * len(nums)                # each number alone  #@init
    for i in range(len(nums)):                         #@outer
        for j in range(i):              # every earlier index
            if nums[j] < nums[i]:       # i can follow j  #@cmp
                dp[i] = max(dp[i], dp[j] + 1)          #@upd
    return max(dp)                                     #@done
`,
        trace(inp) {
          const nums = lisIn(inp);
          const n = nums.length;
          const t = DSA.tracer();
          const dp = new Array(n).fill(1);
          const v = (ns, ds, ptr) => ({ type: 'array', rows: [
            { label: 'nums', items: nums, states: ns || {}, pointers: ptr || [] },
            { label: 'dp', items: dp.slice(), states: ds || {} },
          ] });
          t.step('init', 'Every number on its own is an increasing run of length 1.', { view: v(), vars: { nums, dp } });
          for (let i = 0; i < n; i++) {
            const later = (s) => { for (let k = i + 1; k < n; k++) s[k] = 'dim'; return s; };
            t.step('outer', i === 0 ? `i = 0: nothing before it, dp[0] stays 1.` : `i = ${i} (nums[${i}] = ${nums[i]}). Look at every earlier j.`, { view: v(later({ [i]: 'active' }), later({ [i]: 'active' }), [{ i, label: 'i' }]), vars: { nums, dp, i } });
            for (let j = 0; j < i; j++) {
              const ptr = [{ i, label: 'i' }, { i: j, label: 'j', s: 'compare' }];
              if (nums[j] < nums[i]) {
                const before = dp[i];
                dp[i] = Math.max(dp[i], dp[j] + 1);
                t.step(['cmp', 'upd'], `${nums[j]} < ${nums[i]}: ${nums[i]} can extend the run ending at j = ${j}. dp[${i}] = max(${before}, ${dp[j]} + 1) = ${dp[i]}.`, { view: v(later({ [i]: 'active', [j]: 'compare' }), later({ [i]: 'active', [j]: 'read' }), ptr), vars: { nums, dp, i, j } });
              } else {
                t.step('cmp', `${nums[j]} >= ${nums[i]}: cannot extend, skip.`, { view: v(later({ [i]: 'active', [j]: 'compare' }), later({ [i]: 'active' }), ptr), vars: { nums, dp, i, j } });
              }
            }
          }
          const best = Math.max(...dp);
          const ds = {};
          dp.forEach((d, k) => { if (d === best) ds[k] = 'found'; });
          t.step('done', `Return max(dp) = ${best}. The best run can end anywhere, so take the max, not dp[-1].`, { view: v({}, ds), vars: { nums, dp, return: best } });
          return t.frames;
        },
      },
      {
        id: 'patience-nlogn',
        label: 'Patience O(n log n)',
        file: 'lis_bisect',
        legend: { active: 'Current x', compare: 'First tail >= x', read: 'Smaller tails', new: 'Appended', swap: 'Replaced', found: 'Final tails' },
        summary: 'Keep `tails[k]` = the smallest tail value of any increasing subsequence of length `k + 1`. For each `x`, `bisect_left` finds the first tail `>= x`: replace it (a smaller tail is always better) or append if `x` is bigger than all.',
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        code: `
from bisect import bisect_left

def length_of_lis(nums):
    # tails[k] = smallest tail of a run of length k + 1
    tails = []                                         #@init
    for x in nums:                                     #@loop
        k = bisect_left(tails, x)       # first tail >= x  #@bis
        if k == len(tails):                            #@end
            tails.append(x)             # longest run grows  #@app
        else:
            tails[k] = x                # smaller tail  #@rep
    return len(tails)                                  #@done
`,
        trace(inp) {
          const nums = lisIn(inp);
          const t = DSA.tracer();
          const tails = [];
          const v = (xi, ts, tp) => ({ type: 'array', rows: [
            { label: 'nums', items: nums, states: nums.map((_, i) => (i === xi ? 'active' : xi != null && i > xi ? 'dim' : null)), pointers: xi != null ? [{ i: xi, label: 'x' }] : [] },
            { label: 'tails', items: tails.length ? tails.slice() : [null], states: ts || {}, pointers: tp || [] },
          ] });
          t.step('init', '`tails` starts empty. It stays sorted the whole time.', { view: v(), vars: { nums, tails } });
          nums.forEach((x, xi) => {
            t.step('loop', `x = ${x}.`, { view: v(xi), vars: { tails, x } });
            let k = 0;
            while (k < tails.length && tails[k] < x) k++;
            const ts = {};
            for (let z = 0; z < k; z++) ts[z] = 'read';
            t.step('bis', k === tails.length ? `bisect_left(tails, ${x}) = ${k}: every tail is smaller than ${x}.` : `bisect_left(tails, ${x}) = ${k}: tails[${k}] = ${tails[k]} is the first tail >= ${x}.`, { view: v(xi, Object.assign(ts, k < tails.length ? { [k]: 'compare' } : {}), [{ i: k, label: 'k' }]), vars: { tails, x, k } });
            t.step('end', k === tails.length ? `k == len(tails) == ${k}: ${x} extends the longest run.` : `k = ${k} < len(tails) = ${tails.length}.`, { view: v(xi, k < tails.length ? { [k]: 'compare' } : {}, [{ i: k, label: 'k' }]), vars: { tails, x, k } });
            if (k === tails.length) {
              tails.push(x);
              t.step('app', `Append ${x}. A run of length ${tails.length} now exists.`, { view: v(xi, { [k]: 'new' }, [{ i: k, label: 'k' }]), vars: { tails, x, k } });
            } else {
              const old = tails[k];
              tails[k] = x;
              t.step('rep', `Replace ${old} with ${x}: a run of length ${k + 1} can now end in ${x}, which is easier to extend later.`, { view: v(xi, { [k]: 'swap' }, [{ i: k, label: 'k' }]), vars: { tails, x, k } });
            }
          });
          const ts = {};
          tails.forEach((_, i) => (ts[i] = 'found'));
          t.step('done', `Return len(tails) = ${tails.length}. (tails = [${tails.join(', ')}] is not necessarily a real subsequence, only the length is guaranteed.)`, { view: v(null, ts), vars: { tails, return: tails.length } });
          return t.frames;
        },
      },
    ],
  });

  /* =====================================================================
   * Unique Paths
   * ===================================================================== */
  DSA.addAlgo({
    id: 'unique-paths',
    title: 'Unique Paths',
    category: 'Dynamic Programming',
    order: 9,
    tags: ['dp', 'grid dp', '2d dp', 'combinatorics', 'robot paths'],
    summary: 'A robot in an `m × n` grid moves only right or down. Count the paths from top-left to bottom-right. Every cell is reached from above or from the left, so `dp[r][c] = dp[r - 1][c] + dp[r][c - 1]`.',
    complexity: { time: 'O(m · n)', space: 'O(m · n)', note: 'One row is enough: `row[c] += row[c - 1]`, O(n) space.' },
    notes: [
      'First row and first column are all 1: only one straight way to get there.',
      'Closed form: choose which of the `m + n - 2` moves go down: `math.comb(m + n - 2, m - 1)`.',
      'With obstacles (63): set blocked cells to 0 and start the first row/col with 1 only until the first obstacle.',
      'Min path sum (64) is the same loop with `min(...) + grid[r][c]`.',
    ],
    tips: [
      'Fill row by row so both neighbours (up, left) are already done.',
      'Mention the O(n) single-row version as a follow-up.',
    ],
    problems: ['62. Unique Paths', '63. Unique Paths II', '64. Minimum Path Sum', '120. Triangle', '221. Maximal Square'],
    input: {
      default: { m: 4, n: 5 },
      random: () => ({ m: U.randInt(2, 5), n: U.randInt(3, 6) }),
      fields: [
        { key: 'm', label: 'm (rows)', type: 'number' },
        { key: 'n', label: 'n (cols)', type: 'number' },
      ],
    },
    code: `
def unique_paths(m, n):
    # dp[r][c] = number of paths from (0, 0) to (r, c)
    dp = [[1] * n for _ in range(m)]   # edges: 1 way  #@init
    for r in range(1, m):                              #@row
        for c in range(1, n):
            # arrive from above or from the left
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]     #@fill
    return dp[m - 1][n - 1]                            #@done
`,
    trace(inp) {
      const m = num(inp.m, 1, 5, 4), n = num(inp.n, 1, 6, 5);
      const note = Number(inp.m) !== m || Number(inp.n) !== n ? `(grid capped at ${m} × ${n} so it stays readable.) ` : '';
      const t = DSA.tracer();
      const dp = Array.from({ length: m }, () => new Array(n).fill(1));
      const g = (cr, cc, extra) => {
        const st = cellStates((r, c) => (r > 0 && c > 0 && (r > cr || (r === cr && c > cc)) ? 'dim' : null), m, n);
        return { type: 'grid', title: 'number of paths into each cell', cells: dp.map((r) => r.slice()), rowLabels: U.range(m), colLabels: U.range(n), states: Object.assign(st, extra || {}) };
      };
      const edge = {};
      for (let c = 0; c < n; c++) edge['0,' + c] = 'new';
      for (let r = 0; r < m; r++) edge[r + ',0'] = 'new';
      t.step('init', note + `${m} × ${n} grid filled with 1. The top row and left column really are 1 (only straight moves reach them); the rest gets overwritten.`, { view: g(0, n - 1, edge), vars: { m, n } });
      for (let r = 1; r < m; r++) {
        t.step('row', `Row r = ${r}.`, { view: g(r - 1, n - 1, { ['r' + r]: 'active' }), vars: { m, n, r } });
        for (let c = 1; c < n; c++) {
          dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
          const st = { ['r' + r]: 'active', ['c' + c]: 'active', [r + ',' + c]: 'active', [(r - 1) + ',' + c]: 'read', [r + ',' + (c - 1)]: 'read' };
          t.step('fill', `dp[${r}][${c}] = above ${dp[r - 1][c]} + left ${dp[r][c - 1]} = ${dp[r][c]}.`, { view: g(r, c, st), vars: { m, n, r, c, 'dp[r][c]': dp[r][c] } });
        }
      }
      t.step('done', `Return dp[${m - 1}][${n - 1}] = ${dp[m - 1][n - 1]} path${dp[m - 1][n - 1] === 1 ? '' : 's'}.`, { view: g(m - 1, n - 1, { [(m - 1) + ',' + (n - 1)]: 'found', '0,0': 'path' }), vars: { m, n, return: dp[m - 1][n - 1] } });
      return t.frames;
    },
  });
})();
