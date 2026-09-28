/* Algorithms · Math & Bits */
(function () {
  const U = DSA.util;
  let BIT_INPUT;

  const num = (x, lo, hi, d) => {
    let v = Math.trunc(Number(x));
    if (!isFinite(v)) v = d;
    return Math.max(lo, Math.min(hi, v));
  };
  const capNote = (raw, used, what) => (Number(raw) !== used ? `(${what} capped at ${used} so the picture stays readable.) ` : '');

  /* ---------- bit helpers ---------- */
  // bits of x, most significant first, padded to w
  const bitsOf = (x, w) => Array.from({ length: w }, (_, i) => (x >> (w - 1 - i)) & 1);
  const widthFor = (...xs) => {
    const L = Math.max(1, ...xs.map((x) => Math.max(0, x).toString(2).length));
    return Math.max(4, Math.ceil(L / 4) * 4);
  };
  const bin = (x) => ({ raw: `'${x < 0 ? '-0b' + (-x).toString(2) : '0b' + x.toString(2)}'` });
  // one array row showing the bits of x; states indexed by bit position (0 = lowest)
  const bitRow = (label, x, w, byBit) => ({
    label,
    items: bitsOf(x, w),
    states: bitsOf(x, w).map((_, i) => (byBit ? byBit[w - 1 - i] : null) || null),
    showIndex: false,
  });
  const lowBit = (x) => (x & -x);
  const bitIndex = (p) => Math.round(Math.log2(p));

  /* =====================================================================
   * Bit tricks
   * ===================================================================== */
  function countBitsTrace(inp) {
    const n0 = num(inp.n, 0, 65535, 44);
    const note = capNote(inp.n, n0, 'n');
    const w = widthFor(n0);
    const t = DSA.tracer();
    const title = `${w}-bit view, lowest bit on the right`;
    let n = n0, count = 0;
    t.step('init', note + `n = ${n0} = ${bin(n0).raw}. count = 0.`, { view: { type: 'array', title, rows: [bitRow(`n = ${n}`, n, w)] }, vars: { n, 'bin(n)': bin(n), count } });
    while (true) {
      t.step('loop', n ? `n = ${n} is not 0: it still has set bits.` : 'n is 0: every set bit has been cleared.', { view: { type: 'array', title, rows: [bitRow(`n = ${n}`, n, w)] }, vars: { n, 'bin(n)': bin(n), count } });
      if (!n) break;
      const lb = bitIndex(lowBit(n));
      const m1 = n - 1;
      const res = n & m1;
      // n: lowest set bit active; n-1: that bit and everything below flip
      const nStates = { [lb]: 'active' };
      const mStates = {};
      for (let k = 0; k <= lb; k++) mStates[k] = 'swap';
      t.step('clear', `n - 1 = ${m1} flips the lowest set bit (bit ${lb}) and every bit below it. AND-ing keeps only bits set in both, so bit ${lb} is gone: ${n} & ${m1} = ${res}.`, {
        view: { type: 'array', title, rows: [bitRow(`n = ${n}`, n, w, nStates), bitRow(`n - 1 = ${m1}`, m1, w, mStates), bitRow(`n & (n-1) = ${res}`, res, w, { [lb]: 'removed' })] },
        vars: { n: res, 'bin(n)': bin(res), count },
      });
      n = res;
      count++;
      t.step('inc', `One set bit removed, count = ${count}.`, { view: { type: 'array', title, rows: [bitRow(`n = ${n}`, n, w)] }, vars: { n, 'bin(n)': bin(n), count } });
    }
    t.step('done', `Return ${count}. The loop ran once per **set** bit, not once per bit. Same as \`(${n0}).bit_count()\` or \`bin(${n0}).count('1')\`.`, { view: { type: 'array', title, rows: [bitRow(`n = ${n0}`, n0, w, Object.fromEntries(bitsOf(n0, w).map((b, i) => [w - 1 - i, b ? 'found' : null])))] }, vars: { n, count, return: count } });
    return t.frames;
  }

  function singleNumberTrace(inp) {
    let nums = (inp.nums || []).map((x) => num(x, 0, 255, 0)).slice(0, 10);
    if (!nums.length) nums = [0];
    const w = widthFor(...nums);
    const t = DSA.tracer();
    const title = `bits (${w}-bit), lowest on the right`;
    const arr = (i, st) => ({ type: 'array', label: 'nums', items: nums, states: nums.map((_, k) => (k === i ? st || 'active' : i != null && k < i ? 'done' : null)), pointers: i != null ? [{ i, label: 'v' }] : [] });
    let x = 0;
    t.step('init', 'x = 0. XOR with 0 changes nothing, so it is the identity.', { views: [arr(null), { type: 'array', title, rows: [bitRow('x = 0', 0, w)] }], vars: { nums, x } });
    nums.forEach((v, i) => {
      t.step('loop', `v = ${v}.`, { views: [arr(i), { type: 'array', title, rows: [bitRow(`x = ${x}`, x, w), bitRow(`v = ${v}`, v, w)] }], vars: { x, v } });
      const nx = x ^ v;
      const flips = {};
      for (let k = 0; k < w; k++) if ((v >> k) & 1) flips[k] = 'swap';
      t.step('xor', `x ^= ${v}: every 1-bit of v flips the same bit of x. ${x} ^ ${v} = ${nx}.${nums.slice(0, i).includes(v) ? ` ${v} was seen before, so this undoes it.` : ''}`, {
        views: [arr(i), { type: 'array', title, rows: [bitRow(`x = ${x}`, x, w), bitRow(`v = ${v}`, v, w, flips), bitRow(`x ^ v = ${nx}`, nx, w, flips)] }],
        vars: { x: nx, v },
      });
      x = nx;
    });
    const st = nums.map((v) => (v === x ? 'found' : 'dim'));
    t.step('done', `Return ${x}. Every value that appears twice cancelled itself (a ^ a == 0); only the single one is left. O(n) time, O(1) space.`, { views: [{ type: 'array', label: 'nums', items: nums, states: st }, { type: 'array', title, rows: [bitRow(`x = ${x}`, x, w)] }], vars: { x, return: x } });
    return t.frames;
  }

  function powerOfTwoTrace(inp) {
    const n = num(inp.n, -65535, 65535, 44);
    const note = capNote(inp.n, n, 'n');
    const t = DSA.tracer();
    const w = widthFor(Math.abs(n));
    const title = `${w}-bit view, lowest bit on the right`;
    t.step('check', note + (n <= 0 ? `${n} <= 0: zero and negatives are never powers of two.` : `${n} > 0, keep going.`), { view: { type: 'array', title, rows: [bitRow(`n = ${n}`, Math.max(0, n), w)] }, vars: { n } });
    if (n <= 0) {
      t.step(3, 'Return False.', { view: { type: 'array', title, rows: [bitRow(`n = ${n}`, 0, w)] }, vars: { n, return: false } });
      return t.frames;
    }
    const ones = bitsOf(n, w).reduce((a, b) => a + b, 0);
    const lb = bitIndex(lowBit(n));
    const m1 = n - 1, res = n & m1;
    const flip = {};
    for (let k = 0; k <= lb; k++) flip[k] = 'swap';
    t.step('ret', `n - 1 = ${m1} flips bit ${lb} (the lowest set bit) and every bit below it.`, { view: { type: 'array', title, rows: [bitRow(`n = ${n}`, n, w, { [lb]: 'active' }), bitRow(`n - 1 = ${m1}`, m1, w, flip)] }, vars: { n, 'bin(n)': bin(n), 'n - 1': m1 } });
    const ok = res === 0;
    const rs = {};
    for (let k = 0; k < w; k++) if ((res >> k) & 1) rs[k] = 'bad';
    t.step('ret', ok ? `${n} & ${m1} = 0: n had exactly one set bit, so it is a power of two (2^${lb}). Return True.` : `${n} & ${m1} = ${res} != 0: n has ${ones} set bits, so it is not a power of two. Return False.`, {
      view: { type: 'array', title, rows: [bitRow(`n = ${n}`, n, w), bitRow(`n - 1 = ${m1}`, m1, w), bitRow(`n & (n-1) = ${res}`, res, w, ok ? {} : rs)] },
      vars: { n, 'n & (n - 1)': res, return: ok },
    });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'bit-manipulation',
    title: 'Bit Tricks',
    category: 'Math & Bits',
    order: 1,
    tags: ['bits', 'xor', 'and', 'bitmask', 'popcount', 'hamming weight', 'power of two', 'brian kernighan'],
    summary: 'A handful of bitwise identities solve a whole class of problems in O(1) extra space. The two workhorses: `n & (n - 1)` clears the lowest set bit, and `a ^ a == 0`.',
    complexity: { time: 'O(number of bits)', space: 'O(1)' },
    notes: [
      '`x & 1` odd?  ·  `x >> 1` is `x // 2`  ·  `1 << k` is `2**k`  ·  `x | (1 << k)` set bit k  ·  `x & ~(1 << k)` clear it  ·  `(x >> k) & 1` read it.',
      '`x & (x - 1)` drops the lowest set bit. `x & -x` isolates it (Fenwick trees use this).',
      'XOR: `a ^ a == 0`, `a ^ 0 == a`, order does not matter. Great for "find the odd one out" and swaps.',
      '`bin(10)` → `\'0b1010\'`, `int(\'1010\', 2)` → 10, `f\'{x:08b}\'` pads, `x.bit_count()` (3.10+) counts ones, `x.bit_length()` gives the width.',
      'Python ints are unbounded and negative numbers act as infinite two\'s complement, so mask with `& 0xFFFFFFFF` when a problem assumes 32 bits.',
    ],
    tips: [
      'In Python `&`, `|`, `^` bind **tighter** than `==` (unlike C), but add parentheses anyway for readers.',
      'Subsets as bitmasks: `for mask in range(1 << n)` and test `mask >> i & 1`.',
    ],
    problems: ['191. Number of 1 Bits', '136. Single Number', '231. Power of Two', '338. Counting Bits', '268. Missing Number', '190. Reverse Bits'],
    input: (BIT_INPUT = {
      default: { n: 44, nums: [4, 1, 2, 1, 2] },
      random: () => {
        const n = Math.random() < 0.5 ? 1 << U.randInt(1, 7) : U.randInt(3, 255);
        const pairs = U.randArray(U.randInt(2, 3), 1, 15);
        const single = U.randArray(1, 1, 15).find((v) => !pairs.includes(v)) || 0;
        return { n, nums: U.shuffle(pairs.concat(pairs, [single])) };
      },
      fields: [
        { key: 'n', label: 'n', type: 'number' },
        { key: 'nums', label: 'nums (single number)', type: 'array', max: 9, min: 1 },
      ],
    }),
    variants: [
      {
        id: 'count-bits',
        label: 'Count bits',
        file: 'count_bits',
        summary: 'Count the 1-bits (popcount / Hamming weight). `n &= n - 1` wipes out the lowest set bit each loop, so the loop runs once per **set** bit instead of once per bit (Brian Kernighan\'s trick).',
        complexity: { time: 'O(set bits)', space: 'O(1)' },
        code: `
def count_bits(n):
    count = 0                                          #@init
    while n:                    # until no set bits left  #@loop
        n &= n - 1              # drop the lowest set bit  #@clear
        count += 1                                     #@inc
    return count                # == n.bit_count() (3.10+)  #@done
`,
        legend: { active: 'Lowest set bit', swap: 'Flipped by n - 1', removed: 'Cleared', found: 'Counted' },
        input: Object.assign({}, BIT_INPUT, { fields: [BIT_INPUT.fields[0]] }),
        trace: countBitsTrace,
      },
      {
        id: 'single-number',
        label: 'Single number (XOR)',
        file: 'single_number',
        summary: 'Every number appears twice except one. XOR everything together: pairs cancel (`a ^ a == 0`), XOR is order-independent, and `0` is the identity, so only the single number survives.',
        complexity: { time: 'O(n)', space: 'O(1)' },
        code: `
def single_number(nums):
    x = 0                                              #@init
    for v in nums:                                     #@loop
        x ^= v                  # a ^ a == 0, a ^ 0 == a  #@xor
    return x                    # the pairs cancelled  #@done

# one-liner: functools.reduce(operator.xor, nums)
`,
        legend: { active: 'Current v', done: 'Seen', swap: 'Flipped bits', found: 'Single number', dim: 'Cancelled out' },
        input: Object.assign({}, BIT_INPUT, { fields: [BIT_INPUT.fields[1]] }),
        trace: singleNumberTrace,
      },
      {
        id: 'power-of-two',
        label: 'Power of two',
        file: 'power_of_two',
        summary: 'A power of two has exactly one set bit. `n - 1` turns that bit off and every bit below it on, so `n & (n - 1)` is 0 only for powers of two.',
        complexity: { time: 'O(1)', space: 'O(1)' },
        code: `
def is_power_of_two(n):
    if n <= 0:                                         #@check
        return False            # 0 and negatives
    # one set bit: n - 1 clears it and sets all below
    return (n & (n - 1)) == 0                          #@ret

# also: n > 0 and n.bit_count() == 1
`,
        legend: { active: 'Lowest set bit', swap: 'Flipped by n - 1', bad: 'Still set' },
        input: Object.assign({}, BIT_INPUT, { fields: [BIT_INPUT.fields[0]] }),
        trace: powerOfTwoTrace,
      },
    ],
  });

  /* =====================================================================
   * GCD (Euclid)
   * ===================================================================== */
  const gcdIn = (inp) => ({ a: num(Math.abs(Number(inp.a)), 0, 999999, 462), b: num(Math.abs(Number(inp.b)), 0, 999999, 1071) });
  const gcdGrid = (rows, active, found) => ({
    type: 'grid', title: 'each step: (a, b) becomes (b, a % b)',
    cells: rows.map((r) => r.slice()),
    colLabels: ['a', 'b', 'a % b'],
    rowLabels: rows.map((_, i) => `#${i + 1}`),
    states: Object.assign(
      active != null ? { [active + ',0']: 'active', [active + ',1']: 'active', [active + ',2']: rows[active][2] === '' ? null : 'new' } : {},
      found != null ? { [found + ',0']: 'found', [found + ',1']: 'done' } : {},
    ),
  });

  DSA.addAlgo({
    id: 'gcd',
    title: 'GCD (Euclid)',
    category: 'Math & Bits',
    order: 2,
    legend: { active: 'Current (a, b)', new: 'a % b', found: 'gcd', done: 'b == 0' },
    tags: ['gcd', 'lcm', 'euclid', 'euclidean algorithm', 'modulo', 'math.gcd'],
    summary: 'Greatest common divisor by Euclid\'s rule: `gcd(a, b) == gcd(b, a % b)`, and `gcd(a, 0) == a`. The numbers shrink at least by half every two steps, so it is O(log min(a, b)).',
    complexity: { time: 'O(log min(a, b))', space: 'O(1)' },
    notes: [
      'Use the built-in: `math.gcd(a, b)` (any number of args since 3.9). `math.lcm` exists since 3.9.',
      '`lcm(a, b) = a // gcd(a, b) * b` (divide first to keep numbers small).',
      'Order does not matter: if `a < b`, the first step just swaps them (`a % b == a`).',
      'gcd of a list: `functools.reduce(math.gcd, nums)`.',
    ],
    tips: [
      'Why it works: any d dividing a and b also divides `a - k*b`, i.e. `a % b`, and vice versa.',
      'Fractions: reduce `p/q` by dividing both by `gcd(p, q)`. Also `fractions.Fraction`.',
    ],
    problems: ['1979. Find Greatest Common Divisor of Array', '1071. Greatest Common Divisor of Strings', '914. X of a Kind in a Deck of Cards', '365. Water and Jug Problem', '149. Max Points on a Line'],
    input: {
      default: { a: 462, b: 1071 },
      random: () => {
        const g = U.randInt(2, 15);
        return { a: g * U.randInt(2, 40), b: g * U.randInt(2, 40) };
      },
      fields: [
        { key: 'a', label: 'a', type: 'number' },
        { key: 'b', label: 'b', type: 'number' },
      ],
    },
    variants: [
      {
        id: 'iterative',
        label: 'Iterative',
        summary: 'Replace `(a, b)` with `(b, a % b)` until `b` is 0. Then `a` is the gcd. The tuple assignment updates both at once.',
        complexity: { time: 'O(log min(a, b))', space: 'O(1)' },
        code: `
def gcd(a, b):
    while b:                    # stop when b == 0  #@loop
        a, b = b, a % b         # gcd(a, b) == gcd(b, a % b)  #@step
    return a                    # same as math.gcd(a, b)  #@done
`,
        trace(inp) {
          let { a, b } = gcdIn(inp);
          const t = DSA.tracer();
          const rows = [[a, b, '']];
          t.step('loop', b ? `b = ${b} is not 0, keep going.` : 'b is 0 already.', { view: gcdGrid(rows, 0), vars: { a, b } });
          while (b) {
            const r = a % b;
            rows[rows.length - 1][2] = r;
            const na = b, nb = r;
            t.step('step', `${a} % ${b} = ${r}. New pair: (a, b) = (${na}, ${nb}).${a < b ? ' a < b, so this step just swapped them.' : ''}`, { view: gcdGrid(rows, rows.length - 1), vars: { a: na, b: nb } });
            a = na; b = nb;
            rows.push([a, b, '']);
            t.step('loop', b ? `b = ${b} is not 0, keep going.` : 'b is 0: stop.', { view: gcdGrid(rows, rows.length - 1), vars: { a, b } });
          }
          t.step('done', `Return ${a}. gcd(${gcdIn(inp).a}, ${gcdIn(inp).b}) = ${a} after ${rows.length - 1} step${rows.length === 2 ? '' : 's'}.`, { view: gcdGrid(rows, null, rows.length - 1), vars: { a, b, return: a } });
          return t.frames;
        },
      },
      {
        id: 'recursive',
        label: 'Recursive',
        summary: 'The same rule as a one-line recursion. The base case `b == 0` returns `a`; every other call hands `(b, a % b)` down. Depth is O(log min(a, b)), so recursion is safe here.',
        complexity: { time: 'O(log min(a, b))', space: 'O(log min(a, b))', note: 'Space is the recursion depth.' },
        code: `
def gcd(a, b):
    if b == 0:                  # base case  #@base
        return a                                       #@ret
    return gcd(b, a % b)        # same answer, smaller pair  #@rec
`,
        trace(inp) {
          let { a, b } = gcdIn(inp);
          const t = DSA.tracer();
          const rows = [[a, b, '']];
          const stack = [`gcd(${a}, ${b})`];
          const aux = () => [{ label: 'call stack', kind: 'stack', items: stack.map((s, i) => ({ v: s, s: i === stack.length - 1 ? 'active' : null })) }];
          while (true) {
            t.step('base', b === 0 ? `b == 0: base case.` : `b = ${b}, not 0.`, { view: gcdGrid(rows, rows.length - 1), vars: { a, b }, aux: aux() });
            if (b === 0) break;
            const r = a % b;
            rows[rows.length - 1][2] = r;
            t.step('rec', `${a} % ${b} = ${r}. Call gcd(${b}, ${r}).`, { view: gcdGrid(rows, rows.length - 1), vars: { a, b }, aux: aux() });
            a = b; b = r;
            rows.push([a, b, '']);
            stack.push(`gcd(${a}, ${b})`);
          }
          t.step('ret', `Return ${a}. Each waiting call returns it unchanged, so gcd(${gcdIn(inp).a}, ${gcdIn(inp).b}) = ${a}.`, { view: gcdGrid(rows, null, rows.length - 1), vars: { a, b, return: a }, aux: aux() });
          return t.frames;
        },
      },
    ],
  });

  /* =====================================================================
   * Sieve of Eratosthenes
   * ===================================================================== */
  DSA.addAlgo({
    id: 'sieve',
    title: 'Sieve of Eratosthenes',
    category: 'Math & Bits',
    order: 3,
    tags: ['primes', 'sieve', 'prime numbers', 'isqrt', 'count primes'],
    summary: 'Find every prime up to `n`. Assume all are prime, then for each prime `p` cross out its multiples. Start at `p * p` (smaller multiples were crossed by smaller primes) and stop once `p * p > n`.',
    complexity: { time: 'O(n log log n)', space: 'O(n)' },
    notes: [
      'Outer loop only to `isqrt(n)`: a composite ≤ n always has a factor ≤ √n.',
      'Inner loop starts at `p * p`; `2p, 3p, …` below that already fell to 2, 3, ….',
      'Slice assignment is the fast Python idiom: `is_prime[p*p::p] = [False] * len(range(p*p, n + 1, p))`.',
      'Single number check: trial division up to `isqrt(n)`, O(√n).',
    ],
    tips: [
      'Use a sieve when you need many primes or many checks; trial division for one check.',
      'Smallest-prime-factor sieve (store `spf[m] = p`) lets you factor any number ≤ n in O(log n).',
    ],
    problems: ['204. Count Primes', '762. Prime Number of Set Bits', '2523. Closest Prime Numbers in Range', '952. Largest Component Size by Common Factor'],
    input: {
      default: { n: 30 },
      random: () => ({ n: U.randInt(15, 40) }),
      fields: [{ key: 'n', label: 'n', type: 'number' }],
    },
    legend: { pivot: 'Prime p', active: 'Current', removed: 'Not prime', found: 'Prime', bad: 'Skip (not prime)' },
    code: `
from math import isqrt

def primes_up_to(n):                   # n >= 2
    is_prime = [True] * (n + 1)                        #@init
    is_prime[0] = is_prime[1] = False                  #@zero
    for p in range(2, isqrt(n) + 1):   # p * p <= n  #@loop
        if is_prime[p]:                                #@check
            # smaller multiples were crossed already
            for m in range(p * p, n + 1, p):           #@inner
                is_prime[m] = False                    #@cross
    return [i for i, ok in enumerate(is_prime) if ok]  #@done
`,
    trace(inp) {
      const n = num(inp.n, 2, 40, 30);
      const note = capNote(inp.n, n, 'n');
      const t = DSA.tracer();
      const isPrime = new Array(n + 1).fill(true);
      const COLS = 10;
      const rowsN = Math.floor(n / COLS) + 1;
      const confirmed = new Set();
      const g = (extra) => {
        const cells = [], states = {};
        for (let r = 0; r < rowsN; r++) {
          const row = [];
          for (let c = 0; c < COLS; c++) {
            const v = r * COLS + c;
            row.push(v <= n ? v : null);
            if (v <= n) {
              if (!isPrime[v]) states[r + ',' + c] = 'removed';
              else if (confirmed.has(v)) states[r + ',' + c] = 'found';
            }
          }
          cells.push(row);
        }
        Object.entries(extra || {}).forEach(([v, s]) => { states[Math.floor(v / COLS) + ',' + (v % COLS)] = s; });
        return { type: 'grid', title: `numbers 0 to ${n}`, cells, states };
      };
      const lim = Math.floor(Math.sqrt(n));
      const primesVar = () => ({ raw: String(isPrime.filter(Boolean).length) + ' still True' });
      t.step('init', note + `Assume every number 0..${n} is prime.`, { view: g(), vars: { n, is_prime: primesVar() } });
      isPrime[0] = isPrime[1] = false;
      t.step('zero', '0 and 1 are not prime by definition.', { view: g(), vars: { n, is_prime: primesVar() } });
      for (let p = 2; p <= lim; p++) {
        t.step('loop', `p = ${p} (only up to isqrt(${n}) = ${lim}, since ${lim + 1}² = ${(lim + 1) * (lim + 1)} > ${n}).`, { view: g({ [p]: 'active' }), vars: { n, p } });
        if (!isPrime[p]) {
          t.step('check', `${p} was already crossed out (it is a multiple of a smaller prime). Its multiples are crossed too. Skip.`, { view: g({ [p]: 'bad' }), vars: { n, p } });
          continue;
        }
        confirmed.add(p);
        t.step('check', `${p} is still True, so it is prime. Cross out its multiples from ${p}² = ${p * p}.`, { view: g({ [p]: 'pivot' }), vars: { n, p } });
        for (let m = p * p; m <= n; m += p) {
          const was = isPrime[m];
          isPrime[m] = false;
          t.step(['inner', 'cross'], `m = ${m} = ${p} × ${m / p}: not prime.${was ? '' : ' (Already crossed by a smaller prime.)'}`, { view: g({ [p]: 'pivot', [m]: 'active' }), vars: { n, p, m } });
        }
      }
      for (let v = 2; v <= n; v++) if (isPrime[v]) confirmed.add(v);
      const primes = isPrime.map((ok, i) => (ok ? i : null)).filter((x) => x != null);
      t.step('done', `Everything still True is prime: ${primes.length} prime${primes.length === 1 ? '' : 's'} up to ${n}.`, { view: g(), vars: { n, return: primes } });
      return t.frames;
    },
  });

  /* =====================================================================
   * Fast exponentiation
   * ===================================================================== */
  DSA.addAlgo({
    id: 'fast-power',
    title: 'Fast Exponentiation',
    category: 'Math & Bits',
    order: 4,
    tags: ['binary exponentiation', 'exponentiation by squaring', 'pow', 'modpow', 'power'],
    summary: 'Compute `a ** b` in O(log b) multiplications. Walk the bits of `b` from the lowest: square `a` each step (a, a², a⁴, a⁸, …) and multiply it into the result whenever the current bit is 1.',
    complexity: { time: 'O(log b)', space: 'O(1)' },
    notes: [
      'Built-in: `pow(a, b, m)` does modular fast power in C. `pow(a, -1, m)` gives the modular inverse (3.8+).',
      'For a modulus, reduce after every multiply: `result = result * a % m`, `a = a * a % m`.',
      '13 = 0b1101, so a¹³ = a⁸ · a⁴ · a¹: one factor per 1-bit.',
      'Same idea works for matrices (Fibonacci in O(log n)) or any associative operation.',
    ],
    tips: [
      'LeetCode 50 (Pow(x, n)): handle negative n with `x = 1 / x; n = -n`.',
      'In Python `a ** b` is already fast for ints; interviewers want to see the squaring loop.',
    ],
    problems: ['50. Pow(x, n)', '372. Super Pow', '1922. Count Good Numbers', '509. Fibonacci Number'],
    input: {
      default: { a: 3, b: 13 },
      random: () => ({ a: U.randInt(2, 5), b: U.randInt(5, 30) }),
      fields: [
        { key: 'a', label: 'a', type: 'number' },
        { key: 'b', label: 'b', type: 'number' },
      ],
    },
    legend: { active: 'Current bit', compare: 'Current bit is 0', found: 'Bit 1: multiplied in', dim: 'Bit 0: skipped' },
    code: `
def fast_pow(a, b):                # b >= 0
    result = 1                                         #@init
    while b > 0:                                       #@loop
        if b & 1:                  # lowest bit is 1  #@bit
            result *= a            # use this power of a  #@mul
        a *= a                     # a, a^2, a^4, a^8, ...  #@sq
        b >>= 1                    # move to the next bit  #@shift
    return result                  # pow(a, b, m) for mod  #@done
`,
    trace(inp) {
      const a0 = num(inp.a, -10, 10, 3), b0 = num(inp.b, 0, 40, 13);
      const note = Number(inp.a) !== a0 || Number(inp.b) !== b0 ? `(capped to a = ${a0}, b = ${b0} so the numbers stay readable.) ` : '';
      const t = DSA.tracer();
      const W = Math.max(1, b0.toString(2).length);
      const bits = b0.toString(2).padStart(W, '0').split('').map(Number); // MSB first
      const base = a0 < 0 ? `(${a0})` : String(a0);
      const powers = bits.map((_, i) => `${base}^${2 ** (W - 1 - i)}`);
      // k = index of the bit being looked at (0 = lowest)
      const v = (k, cur) => {
        const st = bits.map((bt, i) => {
          const pos = W - 1 - i;
          if (pos === k) return cur || 'active';
          if (pos < k) return bt ? 'found' : 'dim';
          return null;
        });
        return { type: 'array', title: `exponent ${b0} in binary · read right to left`, rows: [
          { label: 'bits of b', items: bits, states: st, pointers: k >= 0 && k < W ? [{ i: W - 1 - k, label: 'b & 1' }] : [], showIndex: false },
          { label: 'a at that bit', items: powers, states: st, showIndex: false },
        ] };
      };
      let a = BigInt(a0), b = b0, result = 1n, k = 0;
      const vars = (extra) => Object.assign({ a: { raw: String(a) }, b, 'bin(b)': { raw: `'0b${b.toString(2)}'` }, result: { raw: String(result) } }, extra || {});
      t.step('init', note + `result = 1. We will read the bits of b = ${b0} from the lowest one up.`, { view: v(0), vars: vars() });
      while (true) {
        t.step('loop', b > 0 ? `b = ${b} > 0: bits remain.` : 'b = 0: all bits used.', { view: v(k), vars: vars() });
        if (!(b > 0)) break;
        const bit = b & 1;
        t.step('bit', bit ? `Lowest bit of b is 1: this power of a is part of the answer.` : `Lowest bit of b is 0: skip this power.`, { view: v(k, bit ? 'found' : 'compare'), vars: vars() });
        if (bit) {
          const before = result;
          result *= a;
          t.step('mul', `result = ${before} × ${powers[W - 1 - k]} (= ${a}) = ${result}.`, { view: v(k, 'found'), vars: vars() });
        }
        const pa = a;
        a *= a;
        t.step('sq', `Square a: ${pa}² = ${a}, which is ${base}^${2 ** (k + 1)}, ready for the next bit.`, { view: v(k, bit ? 'found' : 'dim'), vars: vars() });
        b >>= 1;
        k++;
        t.step('shift', `Shift b right: b = ${b} (0b${b.toString(2)}). The bit we used is gone.`, { view: v(k), vars: vars() });
      }
      t.step('done', `Return ${result} = ${base}^${b0}, using ${k} squarings instead of ${Math.max(0, b0 - 1)} multiplications.`, { view: v(W), vars: vars({ return: { raw: String(result) } }) });
      return t.frames;
    },
  });
})();
