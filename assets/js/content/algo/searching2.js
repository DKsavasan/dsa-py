/* Algorithms · Searching (linear search, binary search on the answer) */
(function () {
  const U = DSA.util;
  const nums0 = (inp) => (inp.nums || []).map(Number).filter((x) => isFinite(x));

  /* ================= Linear search ================= */

  // i: index being checked; seen: indices already checked
  function lview(nums, i, st, label) {
    const states = nums.map((_, k) => (i != null && k < i ? 'visited' : null));
    if (i != null && i >= 0 && i < nums.length) states[i] = st || 'active';
    const pointers = i != null && i >= 0 && i < nums.length ? [{ i, label: label || 'i', s: st === 'found' ? 'found' : null }] : [];
    return { type: 'array', items: nums, states, pointers };
  }

  const linInput = {
    default: { nums: [7, 3, 9, 4, 1, 8, 5, 6], target: 5 },
    // every third shuffle picks a target that is not in the list
    random: (() => {
      let calls = 0;
      return () => {
        const nums = U.randArray(U.randInt(6, 9), 1, 20, Math.random() < 0.5);
        const miss = U.range(20).map((x) => x + 1).filter((x) => !nums.includes(x));
        const target = calls++ % 3 === 2 && miss.length ? miss[U.randInt(0, miss.length - 1)] : nums[U.randInt(0, nums.length - 1)];
        return { nums, target };
      };
    })(),
    fields: [
      { key: 'nums', label: 'nums', type: 'array', max: 12 },
      { key: 'target', label: 'target', type: 'number' },
    ],
  };

  DSA.addAlgo({
    id: 'linear-search',
    title: 'Linear Search',
    category: 'Searching',
    order: 1,
    tags: ['scan', 'sequential', 'in', 'index', 'enumerate', 'next'],
    summary: 'Check every item from left to right until one matches. Works on **any** list, sorted or not. It is what `x in list` and `list.index(x)` do under the hood.',
    complexity: { time: { best: 'O(1)', avg: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
    notes: [
      '`x in nums` on a list or tuple is O(n). On a `set` or `dict` it is O(1) on average.',
      '`nums.index(x)` returns the **first** match and raises `ValueError` if missing.',
      '`next((i for i, x in enumerate(nums) if x == t), -1)` gives "first match or default" in one pass.',
      'If you search the same list many times, build a `set` or a `{value: index}` dict once.',
    ],
    tips: [
      '`if x in nums: i = nums.index(x)` scans twice. Fine for small lists, but say so.',
      'Sorted input? Binary search is O(log n). Unsorted and searched once? Linear is the right call.',
    ],
    problems: ['1. Two Sum', '217. Contains Duplicate', '485. Max Consecutive Ones', '1480. Running Sum of 1d Array'],
    input: linInput,
    variants: [
      {
        id: 'loop',
        label: 'Loop',
        summary: 'Walk the list with `enumerate` so you get the index and the value together. Return the index of the first match, or -1 after the loop.',
        code: `
def linear_search(nums, target):
    for i, x in enumerate(nums):     # index and value  #@loop
        if x == target:              # match?  #@cmp
            return i                 # first match wins  #@found
    return -1                        # checked everything  #@notfound
`,
        trace(inp) {
          const nums = nums0(inp), target = Number(inp.target);
          const t = DSA.tracer();
          for (let i = 0; i < nums.length; i++) {
            const x = nums[i];
            t.step('loop', i === 0 ? `Start at index 0: \`i = 0\`, \`x = ${x}\`.` : `Next item: \`i = ${i}\`, \`x = ${x}\`.`, { view: lview(nums, i), vars: { target, i, x } });
            const eq = x === target;
            t.step('cmp', eq ? `Is ${x} == ${target}? Yes.` : `Is ${x} == ${target}? No, move on.`, { view: lview(nums, i, eq ? 'found' : 'compare'), vars: { target, i, x } });
            if (eq) {
              t.step('found', `Found ${target} at index ${i}. Return ${i}; the rest of the list is never looked at.`, { view: lview(nums, i, 'found'), vars: { target, i, x, return: i } });
              return t.frames;
            }
          }
          t.step('loop', nums.length ? `No items left: the loop ends after checking all ${nums.length}.` : 'The list is empty, so the loop body never runs.', { view: lview(nums, nums.length), vars: { target } });
          t.step('notfound', `${target} is not in the list. Return -1.`, { view: lview(nums, nums.length), vars: { target, return: -1 } });
          return t.frames;
        },
      },
      {
        id: 'builtins',
        label: 'Built-ins',
        summary: 'Let Python do the scan: `in` checks membership, `.index()` finds the position. Both are O(n) loops in C. A generator with `next(..., -1)` does it in one pass with a default.',
        notes: [
          '`in` + `.index()` is two scans in the worst case. Still O(n), just 2n.',
          '`.index(x, start, stop)` can limit the search to a slice without copying.',
          '`next(gen, default)` returns the default instead of raising `StopIteration`.',
          'Counting matches: `nums.count(x)`. All positions: `[i for i, x in enumerate(nums) if x == t]`.',
        ],
        code: `
def linear_search(nums, target):
    if target not in nums:           # scan 1: membership  #@in
        return -1                    #@notfound
    return nums.index(target)        # scan 2: first index  #@index

# same result in one pass: generator + default
def linear_search_next(nums, target):
    return next((i for i, x in enumerate(nums)  #@next1
                 if x == target), -1)           #@next2
`,
        trace(inp) {
          const nums = nums0(inp), target = Number(inp.target);
          const t = DSA.tracer();
          const k = nums.indexOf(target);
          const stop = k < 0 ? nums.length : k + 1;
          for (let i = 0; i < stop; i++) {
            const eq = nums[i] === target;
            t.step('in', `\`in\` checks nums[${i}] = ${nums[i]}: ${eq ? `equals ${target}, so \`in\` is True and stops here` : 'no match'}.`, { view: lview(nums, i, eq ? 'found' : 'compare', 'in'), vars: { target } });
          }
          if (k < 0) {
            t.step('in', nums.length ? `\`in\` checked all ${nums.length} items: False. So \`target not in nums\` is True.` : 'Empty list: `in` is False right away.', { view: lview(nums, nums.length), vars: { target } });
            t.step('notfound', `Return -1. \`.index()\` is never called (it would raise \`ValueError\`).`, { view: lview(nums, nums.length), vars: { target, return: -1 } });
            t.step(['next1', 'next2'], `The \`next()\` version: the generator yields nothing, so \`next\` returns the default, -1.`, { view: lview(nums, nums.length), vars: { target, return: -1 } });
            return t.frames;
          }
          for (let i = 0; i <= k; i++) {
            const eq = i === k;
            t.step('index', `\`.index()\` starts over at 0 and checks nums[${i}] = ${nums[i]}${eq ? `: match. Return ${k}.` : '.'}`, { view: lview(nums, i, eq ? 'found' : 'read', '.index'), vars: eq ? { target, return: k } : { target } });
          }
          t.step(['next1', 'next2'], `Same answer in one pass: the generator yields ${k} at the first match and \`next\` takes it. Checked ${k + 1} items instead of ${2 * (k + 1)}.`, { view: lview(nums, k, 'found', 'i'), vars: { target, i: k, x: target, return: k } });
          return t.frames;
        },
      },
    ],
  });

  /* ================= Binary search on the answer ================= */

  const ceilDiv = (p, k) => Math.ceil(p / k);

  function prepKoko(inp) {
    const piles = (inp.piles || []).map((x) => Math.max(1, Math.min(30, Math.round(Number(x)) || 1)));
    if (!piles.length) piles.push(1);
    let h = Math.round(Number(inp.h));
    const fixed = !(h >= piles.length);
    if (fixed) h = piles.length;
    return { piles, h, fixed };
  }

  DSA.addAlgo({
    id: 'binary-search-answer',
    title: 'Binary Search on the Answer',
    category: 'Searching',
    order: 3,
    tags: ['koko', 'eating bananas', 'monotonic', 'predicate', 'minimize', 'capacity', 'search space'],
    summary: 'When the answer is a number in a known range and a check `can(k)` flips from False to True exactly once, binary search the **range of answers** instead of an array. Koko Eating Bananas: find the slowest speed that finishes all piles in `h` hours.',
    complexity: { time: 'O(n log m)', space: 'O(1)', note: '`m` is the size of the answer range (here `max(piles)`). Each of the log m steps runs an O(n) check.' },
    notes: [
      'Needs a **monotonic** check: if speed k works, every speed > k works too.',
      'Pick the bounds so the answer is surely inside: slowest possible is 1, fastest needed is `max(piles)`.',
      'Minimising? When `can(mid)` is True keep mid: `hi = mid`. Else `lo = mid + 1`. Loop `while lo < hi`, answer is `lo`.',
      'Integer ceiling without floats: `(p + k - 1) // k` or `-(-p // k)`.',
    ],
    tips: [
      'Spot it from phrases like "minimum capacity", "smallest max", "at least / at most within D days".',
      'Write `can(x)` first and test it on a couple of values by hand, then wrap the binary search around it.',
    ],
    problems: ['875. Koko Eating Bananas', '1011. Capacity To Ship Packages Within D Days', '410. Split Array Largest Sum', '1482. Minimum Number of Days to Make m Bouquets', '69. Sqrt(x)'],
    legend: { bad: 'Too slow', visited: 'Fast enough', compare: 'Checking' },
    input: {
      default: { piles: [3, 6, 7, 11], h: 8 },
      random: () => {
        const piles = U.randArray(U.randInt(3, 6), 2, 16, false);
        const sum = piles.reduce((a, b) => a + b, 0);
        return { piles, h: U.randInt(piles.length, Math.max(piles.length, Math.min(sum - 1, piles.length * 3))) };
      },
      fields: [
        { key: 'piles', label: 'piles', type: 'array', max: 8 },
        { key: 'h', label: 'h', type: 'number' },
      ],
    },
    code: `
def min_eating_speed(piles, h):
    def can(k):
        # hours at speed k: ceil(p / k) per pile
        return sum((p + k - 1) // k for p in piles) <= h  #@can

    lo, hi = 1, max(piles)             # answer is in [lo, hi]  #@init
    while lo < hi:                     # 2+ candidates left  #@loop
        mid = (lo + hi) // 2           #@mid
        if can(mid):                   # fast enough?  #@check
            hi = mid                   # yes: try slower  #@left
        else:
            lo = mid + 1               # no: need faster  #@right
    return lo                          # smallest k that works  #@done
`,
    trace(inp) {
      const { piles, h, fixed } = prepKoko(inp);
      const t = DSA.tracer();
      const M = Math.max(...piles);
      const speeds = U.range(M).map((i) => i + 1);
      // known[k] = 'bad' | 'visited' once a check has told us
      const known = {};
      const rangeView = (lo, hi, mid, midSt) => {
        const states = speeds.map((k) => (k < lo ? 'bad' : k > hi ? 'visited' : known[k] || null));
        if (mid != null) states[mid - 1] = midSt || 'compare';
        const pointers = [{ i: lo - 1, label: 'lo' }];
        if (mid != null) pointers.push({ i: mid - 1, label: 'mid', s: 'compare' });
        pointers.push({ i: hi - 1, label: 'hi' });
        return { type: 'array', title: 'candidate speeds k', items: speeds, states, pointers, range: [lo - 1, hi - 1], showIndex: false };
      };
      const pileView = (k, st) => {
        const rows = [{ label: 'piles', items: piles }];
        rows.push({ label: k == null ? 'hours' : `hrs @${k}`, items: k == null ? piles.map(() => null) : piles.map((p) => ceilDiv(p, k)), states: k == null ? null : piles.map(() => st) });
        return { type: 'array', title: `piles · h = ${h}`, rows };
      };
      let lo = 1, hi = M;
      t.step('init', `${fixed ? `(h must be at least len(piles), so h = ${h}.) ` : ''}Speed 1 is the slowest possible and ${M} (the biggest pile) always finishes in ${piles.length} hours. Search k in [1, ${M}].`, { views: [rangeView(lo, hi), pileView(null)], vars: { h, lo, hi } });
      while (true) {
        t.step('loop', lo < hi ? `\`lo < hi\` (${lo} < ${hi}): more than one candidate left.` : `\`lo == hi == ${lo}\`: one candidate left, so it is the answer.`, { views: [rangeView(lo, hi), pileView(null)], vars: { h, lo, hi } });
        if (lo >= hi) break;
        const mid = (lo + hi) >> 1;
        t.step('mid', `Try the middle speed: mid = (${lo} + ${hi}) // 2 = ${mid}.`, { views: [rangeView(lo, hi, mid), pileView(null)], vars: { h, lo, hi, mid } });
        const hrs = piles.map((p) => ceilDiv(p, mid));
        const total = hrs.reduce((a, b) => a + b, 0);
        const ok = total <= h;
        t.step('can', `At k = ${mid}: hours = ${hrs.join(' + ')} = ${total}. ${total} ${ok ? '<=' : '>'} ${h}, so \`can(${mid})\` is ${ok ? 'True' : 'False'}.`, { views: [rangeView(lo, hi, mid, ok ? 'found' : 'bad'), pileView(mid, ok ? 'found' : 'bad')], vars: { h, lo, hi, mid, k: mid, hours: total, 'can(mid)': ok } });
        if (ok) {
          for (let k = mid; k <= M; k++) known[k] = 'visited';
          hi = mid;
          t.step(['check', 'left'], `${mid} works, so every faster speed works too. The answer is ${mid} or slower: \`hi = ${hi}\`.`, { views: [rangeView(lo, hi), pileView(mid, 'found')], vars: { h, lo, hi, mid } });
        } else {
          for (let k = 1; k <= mid; k++) known[k] = 'bad';
          lo = mid + 1;
          t.step(['check', 'right'], `${mid} is too slow, and so is anything slower. Go faster: \`lo = ${lo}\`.`, { views: [rangeView(lo, hi), pileView(mid, 'bad')], vars: { h, lo, hi, mid } });
        }
      }
      const hrs = piles.map((p) => ceilDiv(p, lo));
      const total = hrs.reduce((a, b) => a + b, 0);
      const fin = rangeView(lo, hi, lo, 'found');
      fin.pointers = [{ i: lo - 1, label: 'lo = hi', s: 'found' }];
      t.step('done', `Return ${lo}. At speed ${lo} Koko needs ${total} hours (≤ ${h})${lo > 1 ? `; at ${lo - 1} she would not make it` : ''}.`, { views: [fin, pileView(lo, 'found')], vars: { h, lo, hi, return: lo } });
      return t.frames;
    },
  });
})();
