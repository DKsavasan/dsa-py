/* Algorithms · Searching */
(function () {
  const U = DSA.util;

  /* shared drawing for binary search frames */
  function view(nums, lo, hi, mid, extra) {
    extra = extra || {};
    const states = nums.map((_, i) => (i < lo || i > hi ? 'dim' : null));
    if (mid != null && mid >= 0 && mid < nums.length) states[mid] = extra.midState || 'active';
    if (extra.found != null) states[extra.found] = 'found';
    const pointers = [];
    if (lo != null) pointers.push({ i: lo, label: 'lo' });
    if (mid != null) pointers.push({ i: mid, label: 'mid', s: 'compare' });
    if (hi != null) pointers.push({ i: hi, label: 'hi' });
    return { type: 'array', items: nums, states, pointers, range: lo <= hi ? [lo, hi] : null };
  }

  const input = {
    default: { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 },
    random: () => {
      const nums = U.randArray(10, 1, 99).sort((a, b) => a - b);
      const target = Math.random() < 0.65 ? nums[U.randInt(0, 9)] : U.randInt(1, 99);
      return { nums, target };
    },
    fields: [
      { key: 'nums', label: 'nums', type: 'array', max: 16 },
      { key: 'target', label: 'target', type: 'number' },
    ],
  };
  const sortIn = (inp) => ({ nums: inp.nums.slice().sort((a, b) => a - b), target: inp.target });

  DSA.addAlgo({
    id: 'binary-search',
    title: 'Binary Search',
    category: 'Searching',
    order: 2,
    tags: ['bisect', 'lower bound', 'log n', 'sorted'],
    summary: 'Find a value in a **sorted** list by checking the middle and throwing away the half that cannot contain it. Every step halves the search space.',
    complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)' }, space: 'O(1)' },
    notes: [
      'Only works on sorted data (or anything monotonic: "is the answer ≤ x?").',
      'Use `lo <= hi` with `hi = len - 1` for "find exact". Use `lo < hi` with `hi = len` for "find boundary".',
      'In Python `(lo + hi) // 2` cannot overflow, so the `lo + (hi - lo) // 2` trick is optional.',
    ],
    tips: [
      'Say the invariant out loud: "the answer, if it exists, is always inside [lo, hi]".',
      'Binary search on the answer: search a range of possible answers when a check function is monotonic (Koko Eating Bananas, Capacity to Ship Packages).',
    ],
    problems: ['704. Binary Search', '35. Search Insert Position', '33. Search in Rotated Sorted Array', '875. Koko Eating Bananas', '34. First and Last Position'],
    input,
    variants: [
      {
        id: 'iterative',
        label: 'Iterative',
        summary: 'Find a value in a **sorted** list by checking the middle and throwing away the half that cannot contain it. The iterative version keeps two indices, `lo` and `hi`, and moves one of them each loop.',
        complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)' }, space: 'O(1)' },
        code: `
def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1          # search the whole list  #@init
    while lo <= hi:                     # window not empty yet  #@loop
        mid = (lo + hi) // 2            # middle index  #@mid
        if nums[mid] == target:         #@cmp
            return mid                  # found it  #@found
        elif nums[mid] < target:        #@lt
            lo = mid + 1                # target is on the right  #@right
        else:
            hi = mid - 1                # target is on the left  #@left
    return -1                           # not in the list  #@notfound
`,
        trace(inp) {
          const { nums, target } = sortIn(inp);
          const t = DSA.tracer();
          let lo = 0, hi = nums.length - 1;
          t.step('init', `Start with the whole list: \`lo = 0\`, \`hi = ${hi}\`.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi } });
          while (true) {
            t.step('loop', lo <= hi ? `\`lo (${lo}) <= hi (${hi})\`, so there is still something to search.` : `\`lo (${lo}) > hi (${hi})\`: the window is empty.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi } });
            if (lo > hi) break;
            const mid = (lo + hi) >> 1;
            t.step('mid', `Middle of [${lo}, ${hi}] is index ${mid}, value ${nums[mid]}.`, { view: view(nums, lo, hi, mid), vars: { target, lo, hi, mid } });
            t.step('cmp', `Is \`nums[${mid}] == ${target}\`? ${nums[mid]} ${nums[mid] === target ? '==' : '!='} ${target}.`, { view: view(nums, lo, hi, mid, { midState: 'compare' }), vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] } });
            if (nums[mid] === target) {
              t.step('found', `Found ${target} at index ${mid}. Return ${mid}.`, { view: view(nums, lo, hi, mid, { found: mid }), vars: { target, lo, hi, mid, return: mid } });
              return t.frames;
            }
            t.step('lt', `Is ${nums[mid]} < ${target}? ${nums[mid] < target ? 'Yes' : 'No'}.`, { view: view(nums, lo, hi, mid, { midState: 'compare' }), vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] } });
            if (nums[mid] < target) {
              lo = mid + 1;
              t.step('right', `Everything up to index ${mid} is too small. Move \`lo\` to ${lo}.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi, mid } });
            } else {
              hi = mid - 1;
              t.step('left', `Everything from index ${mid} on is too big. Move \`hi\` to ${hi}.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi, mid } });
            }
          }
          t.step('notfound', `${target} is not in the list. Return -1.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi, return: -1 } });
          return t.frames;
        },
      },
      {
        id: 'recursive',
        label: 'Recursive',
        summary: 'Same idea, written as a function that calls itself on one half. Each call gets its own `lo` and `hi`; the call stack replaces the loop.',
        complexity: { time: { best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)' }, space: 'O(log n)', note: 'Space is the recursion depth. Python has no tail-call optimisation.' },
        code: `
def binary_search(nums, target, lo=0, hi=None):
    if hi is None:
        hi = len(nums) - 1          # first call: whole list  #@init
    if lo > hi:                     # empty window  #@base
        return -1                   #@notfound
    mid = (lo + hi) // 2            #@mid
    if nums[mid] == target:         #@cmp
        return mid                  #@found
    if nums[mid] < target:          #@lt
        # search the right half
        return binary_search(nums, target, mid + 1, hi)  #@right
    # search the left half
    return binary_search(nums, target, lo, mid - 1)  #@left
`,
        trace(inp) {
          const { nums, target } = sortIn(inp);
          const t = DSA.tracer();
          const stack = [];
          const aux = () => [{ label: 'call stack', kind: 'stack', items: stack.map((s, i) => ({ v: s, s: i === stack.length - 1 ? 'active' : null })) }];
          let lo = 0, hi = nums.length - 1;
          stack.push(`bs(lo=0, hi=${hi})`);
          t.step('init', `First call: \`hi\` is None, so set it to ${hi}.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi }, aux: aux() });
          while (true) {
            t.step('base', lo > hi ? `\`lo > hi\` (${lo} > ${hi}): base case.` : `\`lo <= hi\` (${lo} <= ${hi}): keep going.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi }, aux: aux() });
            if (lo > hi) {
              t.step('notfound', `Not found. Return -1 and unwind ${stack.length} call${stack.length > 1 ? 's' : ''}.`, { view: view(nums, lo, hi, null), vars: { target, lo, hi, return: -1 }, aux: aux() });
              return t.frames;
            }
            const mid = (lo + hi) >> 1;
            t.step('mid', `mid = (${lo} + ${hi}) // 2 = ${mid}.`, { view: view(nums, lo, hi, mid), vars: { target, lo, hi, mid }, aux: aux() });
            t.step('cmp', `nums[${mid}] = ${nums[mid]}. ${nums[mid] === target ? 'Match.' : 'Not a match.'}`, { view: view(nums, lo, hi, mid, { midState: 'compare' }), vars: { target, lo, hi, mid }, aux: aux() });
            if (nums[mid] === target) {
              t.step('found', `Return ${mid}. Each waiting call passes it straight back up.`, { view: view(nums, lo, hi, mid, { found: mid }), vars: { target, lo, hi, mid, return: mid }, aux: aux() });
              return t.frames;
            }
            t.step('lt', `${nums[mid]} ${nums[mid] < target ? '<' : '>'} ${target}.`, { view: view(nums, lo, hi, mid, { midState: 'compare' }), vars: { target, lo, hi, mid }, aux: aux() });
            if (nums[mid] < target) {
              lo = mid + 1;
              stack.push(`bs(lo=${lo}, hi=${hi})`);
              t.step('right', `Recurse on the right half [${lo}, ${hi}].`, { view: view(nums, lo, hi, null), vars: { target, lo, hi }, aux: aux() });
            } else {
              hi = mid - 1;
              stack.push(`bs(lo=${lo}, hi=${hi})`);
              t.step('left', `Recurse on the left half [${lo}, ${hi}].`, { view: view(nums, lo, hi, null), vars: { target, lo, hi }, aux: aux() });
            }
          }
        },
      },
      {
        id: 'lower-bound',
        label: 'Lower bound (bisect)',
        file: 'lower_bound',
        summary: 'Find the **first index where `nums[i] >= target`**. This is exactly `bisect.bisect_left`. It answers "where would target go?" and is the template for most boundary questions.',
        complexity: { time: { best: 'O(log n)', avg: 'O(log n)', worst: 'O(log n)' }, space: 'O(1)' },
        notes: [
          '`hi` starts at `len(nums)` (exclusive) because the answer can be "after everything".',
          '`bisect_left` = first index ≥ target. `bisect_right` = first index > target.',
          'Count of target = `bisect_right(nums, t) - bisect_left(nums, t)`.',
          'Loop ends when `lo == hi`; that single index is the answer.',
        ],
        code: `
from bisect import bisect_left

def lower_bound(nums, target):
    lo, hi = 0, len(nums)            # hi is exclusive  #@init
    while lo < hi:                   # until lo meets hi  #@loop
        mid = (lo + hi) // 2         #@mid
        if nums[mid] < target:       # mid is too small  #@cmp
            lo = mid + 1             # answer is right of mid  #@right
        else:
            hi = mid                 # mid could be the answer  #@left
    return lo                        # == bisect_left(nums, x)  #@done
`,
        trace(inp) {
          const { nums, target } = sortIn(inp);
          const t = DSA.tracer();
          const v = (lo, hi, mid, st) => {
            const states = nums.map((_, i) => (i < lo || i >= hi ? 'dim' : null));
            if (mid != null) states[mid] = st || 'active';
            const pointers = [{ i: lo, label: 'lo' }];
            if (mid != null) pointers.push({ i: mid, label: 'mid', s: 'compare' });
            pointers.push({ i: hi, label: 'hi' });
            return { type: 'array', items: nums, states, pointers, range: lo < hi ? [lo, hi - 1] : null };
          };
          let lo = 0, hi = nums.length;
          t.step('init', `\`lo = 0\`, \`hi = ${hi}\` (one past the end).`, { view: v(lo, hi), vars: { target, lo, hi } });
          while (true) {
            t.step('loop', lo < hi ? `\`lo < hi\` (${lo} < ${hi}): keep narrowing.` : `\`lo == hi == ${lo}\`: done.`, { view: v(lo, hi), vars: { target, lo, hi } });
            if (lo >= hi) break;
            const mid = (lo + hi) >> 1;
            t.step('mid', `mid = ${mid}, value ${nums[mid]}.`, { view: v(lo, hi, mid), vars: { target, lo, hi, mid } });
            t.step('cmp', `Is ${nums[mid]} < ${target}? ${nums[mid] < target ? 'Yes' : 'No'}.`, { view: v(lo, hi, mid, 'compare'), vars: { target, lo, hi, mid } });
            if (nums[mid] < target) {
              lo = mid + 1;
              t.step('right', `Too small, so the answer is after ${mid}. \`lo = ${lo}\`.`, { view: v(lo, hi), vars: { target, lo, hi, mid } });
            } else {
              hi = mid;
              t.step('left', `${nums[mid]} >= ${target}, so index ${mid} might be the answer. Keep it: \`hi = ${hi}\`.`, { view: v(lo, hi), vars: { target, lo, hi, mid } });
            }
          }
          const states = nums.map((_, i) => (i === lo ? 'found' : 'dim'));
          t.step('done', lo < nums.length ? `Return ${lo}: nums[${lo}] = ${nums[lo]} is the first value >= ${target}.` : `Return ${lo}: every value is smaller than ${target}, so it would go at the end.`, { view: { type: 'array', items: nums, states, pointers: [{ i: lo, label: 'lo = hi', s: 'found' }] }, vars: { target, lo, hi, return: lo } });
          return t.frames;
        },
      },
    ],
  });
})();
