/* Algorithms · Techniques */
(function () {
  const U = DSA.util;
  const fmtList = (a) => '[' + a.join(', ') + ']';
  const clampK = (k, n) => Math.max(1, Math.min(Math.floor(+k) || 1, Math.max(1, n)));
  // flat [a, b, c, d] -> [[a, b], [c, d]]
  const pairsOf = (flat) => {
    const out = [];
    for (let i = 0; i + 1 < (flat || []).length; i += 2) out.push([flat[i], flat[i + 1]]);
    return out;
  };
  // input fallbacks: variants share one form, so a key can be missing
  const arrOr = (x, def) => (Array.isArray(x) && x.length ? x : def.slice());
  const numOr = (x, def) => (x !== '' && x != null && isFinite(+x) ? +x : def);
  // a target that no pair in nums adds up to (for "not found" runs)
  const noPairTarget = (nums, lo, hi) => {
    const sums = new Set();
    nums.forEach((a, i) => nums.forEach((b, j) => { if (i < j) sums.add(a + b); }));
    for (let g = 0; g < 200; g++) { const t = U.randInt(lo, hi); if (!sums.has(t)) return t; }
    return hi * 3 + 1;
  };

  /* ====================================================================
   * Two pointers
   * ==================================================================== */
  function oppView(nums, l, r, o) {
    o = o || {};
    const states = nums.map((_, i) => (i < l || i > r ? 'dim' : null));
    if (o.cmp) { states[l] = 'compare'; states[r] = 'compare'; }
    if (o.found) { states[l] = 'found'; states[r] = 'found'; }
    const pointers = nums.length ? [{ i: l, label: 'l' }, { i: r, label: 'r' }] : [];
    return { type: 'array', items: nums, states, pointers, range: l <= r && nums.length ? [l, r] : null };
  }
  function sameView(nums, slow, fast, o) {
    o = o || {};
    const states = nums.map((_, i) => (i < slow ? 'done' : fast != null && i <= fast ? 'dim' : null));
    if (fast != null && fast < nums.length) states[fast] = o.fastState || 'active';
    if (o.wrote != null) states[o.wrote] = 'new';
    const pointers = [];
    if (nums.length) pointers.push({ i: slow, label: 'slow', s: 'found' });
    if (fast != null && fast < nums.length) pointers.push({ i: fast, label: 'fast', s: 'compare' });
    return { type: 'array', items: nums.slice(), states, pointers };
  }

  DSA.addAlgo({
    id: 'two-pointers',
    title: 'Two Pointers',
    category: 'Techniques',
    order: 1,
    tags: ['two sum ii', 'palindrome', 'remove duplicates', 'in place', 'slow fast'],
    summary: 'Walk two indices through an array instead of checking every pair. Each step moves one pointer based on a simple rule, so O(n²) pair checks become one O(n) pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    notes: [
      'Opposite ends: works when the array is **sorted** (or symmetric, like a palindrome check).',
      'Same direction: a `slow` write pointer and a `fast` read pointer let you filter a list **in place**.',
      'Every step moves at least one pointer and no pointer moves back, so the loop runs at most n times.',
    ],
    tips: [
      'Say why moving a pointer is safe: "if the sum is too small, `nums[l]` cannot pair with anything, because `nums[r]` is already the biggest left".',
      'Unsorted input and you need indices? Use a hash map instead (see Hash Map Lookup).',
    ],
    problems: ['167. Two Sum II', '125. Valid Palindrome', '15. 3Sum', '11. Container With Most Water', '26. Remove Duplicates from Sorted Array', '283. Move Zeroes'],
    variants: [
      {
        id: 'opposite-ends',
        label: 'Opposite ends',
        file: 'two_sum_sorted',
        summary: 'Find two numbers in a **sorted** list that add up to `target`. Start at both ends: if the sum is too small move `l` right, if too big move `r` left.',
        input: {
          default: { nums: [2, 3, 5, 7, 9, 12, 15, 18], target: 16 },
          random: () => {
            const nums = U.randArray(8, 1, 40).sort((a, b) => a - b);
            const i = U.randInt(0, 6), j = U.randInt(i + 1, 7);
            return { nums, target: Math.random() < 0.6 ? nums[i] + nums[j] : noPairTarget(nums, 5, 70) };
          },
          fields: [
            { key: 'nums', label: 'nums', type: 'array', max: 12 },
            { key: 'target', label: 'target', type: 'number' },
          ],
        },
        code: `
def two_sum_sorted(nums, target):
    l, r = 0, len(nums) - 1         # both ends  #@init
    while l < r:                    # pointers not crossed  #@loop
        s = nums[l] + nums[r]       # current pair sum  #@sum
        if s == target:             #@cmp
            return [l, r]           # found the pair  #@found
        if s < target:              #@lt
            l += 1                  # need a bigger sum  #@right
        else:
            r -= 1                  # need a smaller sum  #@left
    return []                       # no pair adds up  #@none
`,
        trace(inp) {
          const nums = arrOr(inp.nums, [2, 3, 5, 7, 9, 12, 15, 18]).slice().sort((a, b) => a - b);
          const target = numOr(inp.target, 16);
          const t = DSA.tracer();
          let l = 0, r = nums.length - 1;
          t.step('init', `Put \`l\` at index 0 and \`r\` at index ${r}, the two ends.`, { view: oppView(nums, l, r), vars: { target, l, r } });
          while (true) {
            t.step('loop', l < r ? `\`l (${l}) < r (${r})\`: there is still a pair to try.` : `\`l (${l}) >= r (${r})\`: the pointers met, no pairs left.`, { view: oppView(nums, l, r), vars: { target, l, r } });
            if (l >= r) break;
            const s = nums[l] + nums[r];
            t.step('sum', `\`s = nums[${l}] + nums[${r}] = ${nums[l]} + ${nums[r]} = ${s}\`.`, { view: oppView(nums, l, r, { cmp: true }), vars: { target, l, r, s } });
            t.step('cmp', `Is ${s} == ${target}? ${s === target ? 'Yes.' : 'No.'}`, { view: oppView(nums, l, r, { cmp: true }), vars: { target, l, r, s } });
            if (s === target) {
              t.step('found', `${nums[l]} + ${nums[r]} = ${target}. Return \`[${l}, ${r}]\`.`, { view: oppView(nums, l, r, { found: true }), vars: { target, l, r, s, return: [l, r] } });
              return t.frames;
            }
            t.step('lt', `Is ${s} < ${target}? ${s < target ? 'Yes, too small.' : 'No, too big.'}`, { view: oppView(nums, l, r, { cmp: true }), vars: { target, l, r, s } });
            if (s < target) {
              l++;
              t.step('right', `${nums[l - 1]} plus the biggest value left is still too small, so ${nums[l - 1]} is useless. Move \`l\` to ${l}.`, { view: oppView(nums, l, r), vars: { target, l, r, s } });
            } else {
              r--;
              t.step('left', `${nums[r + 1]} plus the smallest value left is still too big, so ${nums[r + 1]} is useless. Move \`r\` to ${r}.`, { view: oppView(nums, l, r), vars: { target, l, r, s } });
            }
          }
          t.step('none', `No two values add up to ${target}. Return \`[]\`.`, { view: oppView(nums, l, r), vars: { target, l, r, return: [] } });
          return t.frames;
        },
      },
      {
        id: 'same-direction',
        label: 'Same direction',
        file: 'remove_duplicates',
        summary: 'Remove duplicates from a **sorted** list in place. `fast` reads every value; `slow` marks where the next unique value gets written. Everything before `slow` is the answer.',
        legend: { done: 'Kept (unique)', new: 'Just written' },
        input: {
          default: { nums: [1, 1, 2, 3, 3, 3, 4, 5, 5] },
          random: () => {
            const nums = [];
            let v = U.randInt(0, 3);
            for (let k = 0; k < 9; k++) { nums.push(v); if (Math.random() < 0.55) v += U.randInt(1, 2); }
            return { nums };
          },
          fields: [{ key: 'nums', label: 'nums', type: 'array', max: 12 }],
        },
        code: `
def remove_duplicates(nums):
    slow = 0                        # next write slot  #@init
    for fast in range(len(nums)):   # read every value  #@loop
        # keep it if it differs from the last kept value
        if slow == 0 or nums[fast] != nums[slow - 1]:  #@cmp
            nums[slow] = nums[fast] # write it  #@write
            slow += 1               # one more unique value  #@inc
    return slow                     # nums[:slow] is unique  #@done
`,
        trace(inp) {
          const nums = arrOr(inp.nums, [1, 1, 2, 3, 3, 3, 4, 5, 5]).slice().sort((a, b) => a - b);
          const t = DSA.tracer();
          let slow = 0;
          t.step('init', '`slow = 0`: nothing kept yet, so the first unique value will go to index 0.', { view: sameView(nums, slow, null), vars: { slow } });
          for (let fast = 0; fast < nums.length; fast++) {
            t.step('loop', `\`fast = ${fast}\`: read \`nums[${fast}] = ${nums[fast]}\`.`, { view: sameView(nums, slow, fast), vars: { slow, fast } });
            const keep = slow === 0 || nums[fast] !== nums[slow - 1];
            const msg = slow === 0
              ? '`slow == 0`: the first value is always kept.'
              : keep
                ? `${nums[fast]} != ${nums[slow - 1]} (the last kept value, \`nums[${slow - 1}]\`). It is new, keep it.`
                : `${nums[fast]} == ${nums[slow - 1]} (the last kept value). Duplicate, skip it.`;
            const cmpView = sameView(nums, slow, fast, { fastState: 'compare' });
            if (slow > 0) cmpView.states[slow - 1] = keep ? 'compare' : 'bad';
            t.step('cmp', msg, { view: cmpView, vars: { slow, fast, 'nums[fast]': nums[fast] } });
            if (keep) {
              nums[slow] = nums[fast];
              t.step('write', slow === fast ? `Write ${nums[fast]} into index ${slow}. Same slot as \`fast\`, so nothing visibly moves.` : `Copy ${nums[fast]} from index ${fast} into index ${slow}, right after the last kept value.`, { view: sameView(nums, slow, fast, { wrote: slow }), vars: { slow, fast } });
              slow++;
              t.step('inc', `\`slow = ${slow}\`: \`nums[:${slow}]\` holds ${slow} unique value${slow > 1 ? 's' : ''}.`, { view: sameView(nums, slow, fast), vars: { slow, fast } });
            }
          }
          const states = nums.map((_, i) => (i < slow ? 'found' : 'dim'));
          t.step('done', `Return ${slow}. \`nums[:${slow}] = ${fmtList(nums.slice(0, slow))}\`. What is after index ${slow - 1 < 0 ? 0 : slow - 1} is leftover and ignored.`, { view: { type: 'array', items: nums, states, pointers: nums.length ? [{ i: slow, label: 'slow', s: 'found' }] : [] }, vars: { slow, return: slow } });
          return t.frames;
        },
      },
    ],
  });

  /* ====================================================================
   * Sliding window
   * ==================================================================== */
  function fixedView(nums, l, r, o) {
    o = o || {};
    const states = nums.map(() => null);
    if (o.win) for (let i = l; i <= r; i++) states[i] = o.win;
    if (o.add != null) states[o.add] = 'new';
    if (o.drop != null) states[o.drop] = 'removed';
    const v = { type: 'array', items: nums, states, ranges: l <= r ? [{ l, r, label: 'window' }] : [] };
    if (o.ptr != null) v.pointers = [{ i: o.ptr, label: 'i' }];
    return v;
  }
  const setRepr = (s) => ({ raw: s.size ? '{' + Array.from(s).map((c) => `'${c}'`).join(', ') + '}' : 'set()' });

  DSA.addAlgo({
    id: 'sliding-window',
    title: 'Sliding Window',
    category: 'Techniques',
    order: 2,
    tags: ['window', 'substring', 'subarray', 'k consecutive', 'longest substring'],
    summary: 'Keep a contiguous window `[left, right]` and update its state as it slides, instead of recomputing every subarray. Add what enters on the right, remove what leaves on the left.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    notes: [
      'Fixed size: slide by one, add `nums[i]`, subtract `nums[i - k]`. O(1) per step.',
      'Variable size: grow `right` every step; shrink `left` while the window is invalid.',
      'Each index enters and leaves the window at most once, so the total work is O(n) even with the inner `while`.',
      'Window state is usually a running sum, a `set`, a `Counter`, or a dict of last positions.',
    ],
    tips: [
      'Keywords: "contiguous", "substring", "subarray", "at most k", "longest / shortest".',
      'Negative numbers break "shrink while sum > target". Use prefix sums + hash map instead.',
    ],
    problems: ['643. Maximum Average Subarray I', '3. Longest Substring Without Repeating Characters', '424. Longest Repeating Character Replacement', '76. Minimum Window Substring', '209. Minimum Size Subarray Sum', '567. Permutation in String'],
    variants: [
      {
        id: 'fixed-size',
        label: 'Fixed size',
        file: 'max_sum_k',
        summary: 'Largest sum of `k` consecutive numbers. Sum the first `k`, then slide one step at a time: add the value entering on the right, subtract the one leaving on the left.',
        complexity: { time: 'O(n)', space: 'O(1)' },
        legend: { max: 'Best window so far', new: 'Enters', removed: 'Leaves' },
        input: {
          default: { nums: [4, 2, 1, 7, 8, 1, 2, 8, 1, 0], k: 3 },
          random: () => ({ nums: U.randArray(10, 0, 9, false), k: U.randInt(2, 4) }),
          fields: [
            { key: 'nums', label: 'nums', type: 'array', max: 14, min: 1 },
            { key: 'k', label: 'k', type: 'number' },
          ],
        },
        code: `
def max_sum_k(nums, k):
    window = sum(nums[:k])          # sum of the first k  #@init
    best = window                   # best so far  #@best0
    for i in range(k, len(nums)):   # i = new right edge  #@loop
        # add the value entering, drop the one leaving
        window += nums[i] - nums[i - k]  #@slide
        best = max(best, window)    #@best
    return best                     #@done
`,
        trace(inp) {
          const nums = arrOr(inp.nums, [4, 2, 1, 7, 8, 1, 2, 8, 1, 0]).slice();
          const n = nums.length;
          const k = clampK(numOr(inp.k, 3), n);
          const t = DSA.tracer();
          let window = nums.slice(0, k).reduce((a, b) => a + b, 0);
          t.step('init', `\`window = sum(nums[:${k}]) = ${nums.slice(0, k).join(' + ')} = ${window}\`.`, { view: fixedView(nums, 0, k - 1, { win: 'active' }), vars: { k, window } });
          let best = window, bl = 0;
          t.step('best0', `The first window is the best so far: \`best = ${best}\`.`, { view: fixedView(nums, 0, k - 1, { win: 'max' }), vars: { k, window, best } });
          for (let i = k; i < n; i++) {
            const l = i - k + 1;
            t.step('loop', `\`i = ${i}\`: slide right. The window becomes [${l}, ${i}].`, { view: fixedView(nums, l - 1, i - 1, { ptr: i }), vars: { k, window, best, i } });
            const old = window;
            window += nums[i] - nums[i - k];
            t.step('slide', `Add \`nums[${i}] = ${nums[i]}\`, drop \`nums[${i - k}] = ${nums[i - k]}\`: ${old} + ${nums[i]} - ${nums[i - k]} = ${window}.`, { view: fixedView(nums, l, i, { add: i, drop: i - k, ptr: i }), vars: { k, window, best, i } });
            const ob = best;
            best = Math.max(best, window);
            if (best > ob) bl = l;
            t.step('best', best > ob ? `\`max(${ob}, ${window}) = ${best}\`: new best window [${l}, ${i}].` : `\`max(${ob}, ${window}) = ${best}\`: no improvement.`, { view: fixedView(nums, l, i, { win: best > ob ? 'max' : null, ptr: i }), vars: { k, window, best, i } });
          }
          t.step('done', `Return ${best}: window [${bl}, ${bl + k - 1}] = ${fmtList(nums.slice(bl, bl + k))}.`, { view: fixedView(nums, bl, bl + k - 1, { win: 'found' }), vars: { k, window, best, return: best } });
          return t.frames;
        },
      },
      {
        id: 'variable-size',
        label: 'Variable size',
        file: 'longest_unique',
        summary: 'Longest substring without repeating characters. Grow `right` one char at a time. If the new char is already in the window, shrink from `left` until it is not. A `set` holds the chars in the window.',
        complexity: { time: 'O(n)', space: 'O(k)', note: 'k = size of the alphabet (distinct characters).' },
        legend: { bad: 'Duplicate', max: 'Best window so far', removed: 'Leaves', new: 'Enters' },
        input: {
          default: { s: 'abcbdeaf' },
          random: () => ({ s: Array.from({ length: U.randInt(7, 9) }, () => 'abcde'[U.randInt(0, 4)]).join('') }),
          fields: [{ key: 's', label: 's', type: 'text' }],
        },
        code: `
def longest_unique(s):
    seen = set()                    # chars in the window  #@init
    left = best = 0                 #@init2
    for right, ch in enumerate(s):  # grow on the right  #@loop
        while ch in seen:           # duplicate: shrink  #@dup
            seen.remove(s[left])    # drop the left char  #@remove
            left += 1               #@shrink
        seen.add(ch)                # window is valid again  #@add
        best = max(best, right - left + 1)  #@best
    return best                     #@done
`,
        trace(inp) {
          const s = String(inp.s == null ? 'abcbdeaf' : inp.s).slice(0, 14);
          const chars = s.split('');
          const t = DSA.tracer();
          const seen = new Set();
          let left = 0, best = 0, bl = 0;
          const view = (l, r, o) => {
            o = o || {};
            const states = chars.map((_, i) => (i < l ? 'dim' : null));
            if (o.win) for (let i = l; i <= r; i++) states[i] = o.win;
            if (o.cur != null) states[o.cur] = o.curState || 'active';
            if (o.bad != null) states[o.bad] = 'bad';
            if (o.drop != null) states[o.drop] = 'removed';
            const pointers = [];
            if (chars.length) pointers.push({ i: Math.min(l, chars.length), label: 'left' });
            if (o.cur != null) pointers.push({ i: o.cur, label: 'right', s: 'compare' });
            return { type: 'array', items: chars, states, pointers, ranges: l <= r ? [{ l, r, label: 'window' }] : [] };
          };
          const aux = (st) => [{ label: 'seen', kind: 'set', items: Array.from(seen).map((c) => ({ v: c, s: st && st[c] })) }];
          t.step(['init', 'init2'], 'Empty window: `seen = set()`, `left = 0`, `best = 0`.', { view: view(0, -1), vars: { seen: setRepr(seen), left, best }, aux: aux() });
          for (let right = 0; right < chars.length; right++) {
            const ch = chars[right];
            t.step('loop', `\`right = ${right}\`, \`ch = '${ch}'\`.`, { view: view(left, right - 1, { cur: right }), vars: { seen: setRepr(seen), left, best, right, ch }, aux: aux() });
            while (true) {
              const dup = seen.has(ch);
              const j = dup ? chars.lastIndexOf(ch, right - 1) : null;
              t.step('dup', dup ? `'${ch}' is already in the window (index ${j}). Shrink from the left.` : `'${ch}' is not in \`seen\`. The window stays valid.`, { view: view(left, right - 1, { cur: right, curState: 'compare', bad: j }), vars: { seen: setRepr(seen), left, best, right, ch }, aux: aux(dup ? { [ch]: 'bad' } : null) });
              if (!dup) break;
              const gone = chars[left];
              t.step('remove', `Remove \`s[${left}] = '${gone}'\` from \`seen\`.`, { view: view(left, right - 1, { cur: right, drop: left }), vars: { seen: setRepr(seen), left, best, right, ch }, aux: aux({ [gone]: 'removed' }) });
              seen.delete(gone);
              left++;
              t.step('shrink', `\`left = ${left}\`. The window is now [${left}, ${right - 1}].`, { view: view(left, right - 1, { cur: right }), vars: { seen: setRepr(seen), left, best, right, ch }, aux: aux() });
            }
            seen.add(ch);
            t.step('add', `Add '${ch}'. Window [${left}, ${right}] = '${chars.slice(left, right + 1).join('')}' has no repeats.`, { view: view(left, right, { cur: right, curState: 'new' }), vars: { seen: setRepr(seen), left, best, right, ch }, aux: aux({ [ch]: 'new' }) });
            const len = right - left + 1, ob = best;
            best = Math.max(best, len);
            if (best > ob) bl = left;
            t.step('best', best > ob ? `Length ${right} - ${left} + 1 = ${len} beats ${ob}. \`best = ${best}\`.` : `Length ${len} does not beat ${best}.`, { view: view(left, right, { win: best > ob ? 'max' : null, cur: right }), vars: { seen: setRepr(seen), left, best, right, ch }, aux: aux() });
          }
          const states = chars.map((_, i) => (i >= bl && i < bl + best ? 'found' : 'dim'));
          t.step('done', best ? `Return ${best}: '${chars.slice(bl, bl + best).join('')}' is the longest substring with no repeats.` : 'Empty string: return 0.', { view: { type: 'array', items: chars, states, ranges: best ? [{ l: bl, r: bl + best - 1, label: 'longest' }] : [] }, vars: { seen: setRepr(seen), left, best, return: best }, aux: aux() });
          return t.frames;
        },
      },
    ],
  });

  /* ====================================================================
   * Prefix sum
   * ==================================================================== */
  DSA.addAlgo({
    id: 'prefix-sum',
    title: 'Prefix Sum',
    category: 'Techniques',
    order: 3,
    tags: ['cumulative sum', 'range sum', 'running total', 'accumulate', 'subarray sum equals k'],
    summary: 'Precompute running totals so any range sum is one subtraction: `sum(nums[l:r+1]) == pre[r+1] - pre[l]`. Pair it with a hash map to count subarrays with a given sum.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    notes: [
      'Use `n + 1` slots with `pre[0] = 0` so the formula has no special case at `l = 0`.',
      '`itertools.accumulate(nums, initial=0)` builds the same list in one line.',
      'Works with negative numbers, unlike a shrinking sliding window.',
      '2D version: `P[r+1][c+1] = M[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]`.',
    ],
    tips: [
      'Seed the counts with `{0: 1}` so subarrays that start at index 0 are counted.',
      'Same trick with XOR, or with parity/modulo as the key (Subarray Sums Divisible by K).',
    ],
    problems: ['303. Range Sum Query - Immutable', '560. Subarray Sum Equals K', '724. Find Pivot Index', '238. Product of Array Except Self', '974. Subarray Sums Divisible by K', '304. Range Sum Query 2D'],
    variants: [
      {
        id: 'range-sum',
        label: 'Range sum',
        file: 'range_sums',
        summary: 'Build `pre` once in O(n), where `pre[i]` is the sum of the first `i` values. Then each query `sum(nums[l..r])` is `pre[r+1] - pre[l]`, O(1).',
        complexity: { time: 'O(n + q)', space: 'O(n)', note: 'q = number of queries. Each query is O(1).' },
        input: {
          default: { nums: [3, 1, 4, 1, 5, 9, 2, 6], queries: [1, 3, 2, 6, 0, 7] },
          random: () => {
            const nums = U.randArray(8, 1, 9, false);
            const queries = [];
            for (let q = 0; q < U.randInt(2, 3); q++) { const a = U.randInt(0, 7), b = U.randInt(0, 7); queries.push(Math.min(a, b), Math.max(a, b)); }
            return { nums, queries };
          },
          fields: [
            { key: 'nums', label: 'nums', type: 'array', max: 12, min: 1 },
            { key: 'queries', label: 'queries (l, r pairs)', type: 'array', max: 6 },
          ],
        },
        code: `
def range_sums(nums, queries):
    # pre[i] = sum(nums[:i]), so pre[0] = 0
    pre = [0] * (len(nums) + 1)     #@init
    for i, x in enumerate(nums):    #@loop
        pre[i + 1] = pre[i] + x     # running total  #@build
    ans = []                        #@ans
    for l, r in queries:            # inclusive [l, r]  #@q
        # sum(nums[l:r+1]) in O(1)
        ans.append(pre[r + 1] - pre[l])  #@answer
    return ans                      #@done
`,
        trace(inp) {
          const nums = arrOr(inp.nums, [3, 1, 4, 1, 5, 9, 2, 6]).slice(0, 12);
          const n = nums.length;
          let queries = pairsOf(inp.queries).map(([a, b]) => {
            a = Math.max(0, Math.min(n - 1, Math.floor(a) || 0)); b = Math.max(0, Math.min(n - 1, Math.floor(b) || 0));
            return a <= b ? [a, b] : [b, a];
          }).slice(0, 3);
          if (!queries.length) queries = [[0, n - 1]];
          const t = DSA.tracer();
          const pre = new Array(n + 1).fill(0);
          const ans = [];
          const view = (o) => {
            o = o || {};
            const ns = nums.map((_, i) => (o.nsI === i ? 'read' : null));
            const ps = pre.map((_, i) => (o.built != null && i <= o.built ? 'done' : null));
            if (o.newP != null) ps[o.newP] = 'new';
            if (o.readP != null) ps[o.readP] = 'read';
            if (o.hi != null) ps[o.hi] = 'active';
            if (o.lo != null) ps[o.lo] = 'compare';
            const nRow = { label: 'nums', items: nums, states: ns };
            if (o.nsI != null) nRow.pointers = [{ i: o.nsI, label: 'i' }];
            if (o.q) { nRow.ranges = [{ l: o.q[0], r: o.q[1], label: `[${o.q[0]}, ${o.q[1]}]` }]; nRow.pointers = [{ i: o.q[0], label: 'l' }, { i: o.q[1], label: 'r' }]; }
            const pRow = { label: 'pre', items: pre, states: ps };
            if (o.q) pRow.pointers = [{ i: o.q[0], label: 'l' }, { i: o.q[1] + 1, label: 'r+1' }];
            return { type: 'array', rows: [nRow, pRow] };
          };
          t.step('init', `\`pre\` has ${n + 1} slots, all 0. \`pre[0] = 0\` is the sum of nothing.`, { view: view({ built: 0 }), vars: { pre } });
          for (let i = 0; i < n; i++) {
            t.step('loop', `\`i = ${i}\`, \`x = ${nums[i]}\`.`, { view: view({ built: i, nsI: i }), vars: { pre, i, x: nums[i] } });
            pre[i + 1] = pre[i] + nums[i];
            t.step('build', `\`pre[${i + 1}] = pre[${i}] + ${nums[i]} = ${pre[i]} + ${nums[i]} = ${pre[i + 1]}\`.`, { view: view({ built: i, nsI: i, readP: i, newP: i + 1 }), vars: { pre, i, x: nums[i] } });
          }
          t.step('ans', `Built in one pass. Now answer ${queries.length} quer${queries.length > 1 ? 'ies' : 'y'}, each in O(1).`, { view: view({ built: n }), vars: { pre, ans } });
          for (const [l, r] of queries) {
            t.step('q', `Query \`l = ${l}\`, \`r = ${r}\`: sum of \`nums[${l}..${r}]\`.`, { view: view({ q: [l, r] }), vars: { pre, ans, l, r } });
            ans.push(pre[r + 1] - pre[l]);
            t.step('answer', `\`pre[${r + 1}] - pre[${l}] = ${pre[r + 1]} - ${pre[l]} = ${ans[ans.length - 1]}\`. The first ${l} values cancel out.`, { view: view({ q: [l, r], hi: r + 1, lo: l }), vars: { pre, ans, l, r } });
          }
          t.step('done', `Return \`${fmtList(ans)}\`.`, { view: view({ built: n }), vars: { pre, ans, return: ans } });
          return t.frames;
        },
      },
      {
        id: 'subarray-sum-k',
        label: 'Subarray sum = k',
        file: 'subarray_sum',
        summary: 'Count subarrays that sum to `k`. A subarray ending at `i` sums to `k` when some earlier prefix sum equals `total - k`. Keep a dict of how many times each prefix sum has appeared.',
        complexity: { time: 'O(n)', space: 'O(n)' },
        legend: { range: 'Subarray summing to k', found: 'Match in count' },
        input: {
          default: { nums: [1, 2, 1, 3, -1, 2, 1], k: 3 },
          random: () => ({ nums: Array.from({ length: 8 }, () => U.randInt(-2, 5)), k: U.randInt(2, 6) }),
          fields: [
            { key: 'nums', label: 'nums', type: 'array', max: 12 },
            { key: 'k', label: 'k', type: 'number' },
          ],
        },
        code: `
def subarray_sum(nums, k):
    # prefix sum -> how many times we have seen it
    count = {0: 1}                  # empty prefix: sum 0  #@init
    total = ans = 0                 #@init2
    for x in nums:                  #@loop
        total += x                  # prefix sum up to x  #@add
        # a subarray ending here sums to k exactly when an
        # earlier prefix sum equals total - k
        ans += count.get(total - k, 0)  #@look
        # record this prefix sum
        count[total] = count.get(total, 0) + 1  #@store
    return ans                      #@done
`,
        trace(inp) {
          const nums = (Array.isArray(inp.nums) ? inp.nums : [1, 2, 1, 3, -1, 2, 1]).slice(0, 12);
          const k = numOr(inp.k, 3);
          const n = nums.length;
          const t = DSA.tracer();
          const count = new Map([[0, 1]]);
          const prefix = new Array(n).fill(null); // running totals, for the picture
          let total = 0, ans = 0;
          const countRepr = () => ({ raw: '{' + Array.from(count).map(([a, b]) => `${a}: ${b}`).join(', ') + '}' });
          const view = (i, o) => {
            o = o || {};
            const ns = nums.map((_, j) => (i != null && j > i ? 'dim' : null));
            if (i != null && i < n) ns[i] = 'active';
            const nRow = { label: 'nums', items: nums, states: ns };
            if (i != null && i < n) nRow.pointers = [{ i, label: 'x' }];
            if (o.ranges) nRow.ranges = o.ranges;
            const pRow = { label: 'total', items: prefix.slice(), states: prefix.map((_, j) => (j === i && o.newTotal ? 'new' : null)) };
            const kvStates = {};
            if (o.kvKey != null && count.has(o.kvKey)) kvStates[o.kvKey] = o.kvState;
            return [
              { type: 'array', rows: [nRow, pRow] },
              { type: 'kv', title: 'count  (prefix sum → times seen)', entries: Array.from(count), states: kvStates },
            ];
          };
          t.step(['init', 'init2'], '`count = {0: 1}`: the empty prefix (sum 0) counts once, so subarrays starting at index 0 are found. `total = ans = 0`.', { views: view(null), vars: { k, total, ans, count: countRepr() } });
          for (let i = 0; i < n; i++) {
            const x = nums[i];
            t.step('loop', `\`x = nums[${i}] = ${x}\`.`, { views: view(i), vars: { k, total, ans, x, count: countRepr() } });
            total += x;
            prefix[i] = total;
            t.step('add', `\`total = ${total - x} + ${x} = ${total}\`: the sum of \`nums[0..${i}]\`.`, { views: view(i, { newTotal: true }), vars: { k, total, ans, x, count: countRepr() } });
            const need = total - k;
            const hits = count.get(need) || 0;
            // earlier prefix positions j with prefix == need; subarray = j+1..i (j = -1 for the empty prefix)
            const starts = [];
            if (need === 0) starts.push(0);
            for (let j = 0; j < i; j++) if (prefix[j] === need) starts.push(j + 1);
            ans += hits;
            const msg = hits
              ? `Need an earlier prefix of \`${total} - ${k} = ${need}\`. Seen ${hits} time${hits > 1 ? 's' : ''}, so ${hits} subarray${hits > 1 ? 's' : ''} ending here sum${hits > 1 ? '' : 's'} to ${k}: ${starts.map((s) => fmtList(nums.slice(s, i + 1))).join(', ')}. \`ans = ${ans}\`.`
              : `Need an earlier prefix of \`${total} - ${k} = ${need}\`. Not in \`count\`, so no subarray ending here sums to ${k}.`;
            t.step('look', msg, { views: view(i, { ranges: starts.map((s) => ({ l: s, r: i })), kvKey: need, kvState: 'found' }), vars: { k, total, ans, x, count: countRepr() } });
            count.set(total, (count.get(total) || 0) + 1);
            t.step('store', `\`count[${total}]\` becomes ${count.get(total)}. Later indices can use this prefix.`, { views: view(i, { kvKey: total, kvState: 'new' }), vars: { k, total, ans, x, count: countRepr() } });
          }
          t.step('done', `Return ${ans}: ${ans} subarray${ans === 1 ? '' : 's'} sum${ans === 1 ? 's' : ''} to ${k}.`, { views: view(null), vars: { k, total, ans, count: countRepr(), return: ans } });
          return t.frames;
        },
      },
    ],
  });

  /* ====================================================================
   * Hash map lookup (Two Sum)
   * ==================================================================== */
  DSA.addAlgo({
    id: 'hash-map-lookup',
    title: 'Hash Map Lookup (Two Sum)',
    category: 'Techniques',
    order: 4,
    tags: ['two sum', 'dict', 'complement', 'seen', 'one pass'],
    summary: 'Trade memory for time: store what you have seen in a dict so "have I seen the partner?" is O(1). For Two Sum, map value → index and look up `target - x` before storing `x`.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    notes: [
      'Look up **before** you store, so an element never pairs with itself.',
      'Works on unsorted input and returns original indices, unlike two pointers.',
      'Membership test `x in d` and `d[x]` are O(1) average.',
      '`d.get(key, default)` avoids a `KeyError`; `collections.Counter` counts in one line.',
    ],
    tips: [
      'Brute force is O(n²). Say it, then improve it with the dict.',
      'Duplicates: `[3, 3]` with target 6 works because the first 3 is stored before the second is checked.',
    ],
    problems: ['1. Two Sum', '49. Group Anagrams', '128. Longest Consecutive Sequence', '217. Contains Duplicate', '242. Valid Anagram', '380. Insert Delete GetRandom O(1)'],
    file: 'two_sum',
    input: {
      default: { nums: [11, 7, 3, 15, 2, 8, 6], target: 9 },
      random: () => {
        const nums = U.randArray(7, 1, 20);
        const i = U.randInt(0, 5), j = U.randInt(i + 1, 6);
        return { nums, target: Math.random() < 0.6 ? nums[i] + nums[j] : noPairTarget(nums, 2, 40) };
      },
      fields: [
        { key: 'nums', label: 'nums', type: 'array', max: 12 },
        { key: 'target', label: 'target', type: 'number' },
      ],
    },
    code: `
def two_sum(nums, target):
    seen = {}                       # value -> index  #@init
    for i, x in enumerate(nums):    #@loop
        need = target - x           # the partner we want  #@need
        if need in seen:            # O(1) lookup  #@check
            return [seen[need], i]  #@found
        seen[x] = i                 # remember x for later  #@store
    return []                       # no pair  #@none
`,
    trace(inp) {
      const nums = (inp.nums || []).slice();
      const target = numOr(inp.target, 9);
      const t = DSA.tracer();
      const seen = new Map();
      const view = (i, o) => {
        o = o || {};
        const states = nums.map((_, j) => (i != null && j < i ? 'visited' : null));
        if (i != null && i < nums.length) states[i] = o.cur || 'active';
        if (o.hit != null) states[o.hit] = 'found';
        const kvs = {};
        if (o.kv != null) kvs[o.kv] = o.kvState;
        return [
          { type: 'array', items: nums, states, pointers: i != null && i < nums.length ? [{ i, label: 'i' }] : [] },
          { type: 'kv', title: 'seen  (value → index)', entries: Array.from(seen), states: kvs },
        ];
      };
      const seenRepr = () => ({ raw: '{' + Array.from(seen).map(([a, b]) => `${a}: ${b}`).join(', ') + '}' });
      t.step('init', 'Start with an empty dict `seen`.', { views: view(null), vars: { target, seen: seenRepr() } });
      for (let i = 0; i < nums.length; i++) {
        const x = nums[i];
        t.step('loop', `\`i = ${i}\`, \`x = ${x}\`.`, { views: view(i), vars: { target, seen: seenRepr(), i, x } });
        const need = target - x;
        t.step('need', `\`need = ${target} - ${x} = ${need}\`.`, { views: view(i), vars: { target, seen: seenRepr(), i, x, need } });
        if (seen.has(need)) {
          t.step('check', `Is ${need} in \`seen\`? Yes, at index ${seen.get(need)}.`, { views: view(i, { kv: need, kvState: 'found', hit: seen.get(need) }), vars: { target, seen: seenRepr(), i, x, need } });
          const res = [seen.get(need), i];
          t.step('found', `\`nums[${res[0]}] + nums[${i}] = ${need} + ${x} = ${target}\`. Return \`[${res[0]}, ${i}]\`.`, { views: view(i, { cur: 'found', kv: need, kvState: 'found', hit: res[0] }), vars: { target, seen: seenRepr(), i, x, need, return: res } });
          return t.frames;
        }
        t.step('check', `Is ${need} in \`seen\`? No.`, { views: view(i, { cur: 'compare' }), vars: { target, seen: seenRepr(), i, x, need } });
        seen.set(x, i);
        t.step('store', `Store \`seen[${x}] = ${i}\` so a later value can pair with it.`, { views: view(i, { kv: x, kvState: 'new' }), vars: { target, seen: seenRepr(), i, x, need } });
      }
      t.step('none', `No pair adds up to ${target}. Return \`[]\`.`, { views: view(nums.length), vars: { target, seen: seenRepr(), return: [] } });
      return t.frames;
    },
  });

  /* ====================================================================
   * Kadane
   * ==================================================================== */
  DSA.addAlgo({
    id: 'kadane',
    title: "Kadane's Algorithm",
    category: 'Techniques',
    order: 5,
    tags: ['maximum subarray', 'max sum', 'dp', 'running sum'],
    summary: 'Largest sum of a contiguous subarray in one pass. At each index, either extend the current run or start a new one at this value, whichever is bigger. Track the best run seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    legend: { max: 'Best run so far', range: 'Current run' },
    notes: [
      '`cur` = best sum of a subarray that **ends at i**. `best` = best anywhere so far.',
      'A negative running sum only hurts what follows, so drop it and restart.',
      'Start from `nums[0]` (not 0) so an all-negative list returns its largest value.',
      'It is a 1D DP: `dp[i] = max(nums[i], dp[i-1] + nums[i])`, keeping only the last value.',
    ],
    tips: [
      'To return the subarray itself, remember the start index when you restart and copy it when `best` improves.',
      'Max product version: track both `cur_max` and `cur_min`, because a negative times a negative flips.',
    ],
    problems: ['53. Maximum Subarray', '152. Maximum Product Subarray', '918. Maximum Sum Circular Subarray', '121. Best Time to Buy and Sell Stock'],
    file: 'max_subarray',
    input: {
      default: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
      random: () => ({ nums: Array.from({ length: 9 }, () => U.randInt(-8, 8)) }),
      fields: [{ key: 'nums', label: 'nums', type: 'array', max: 14, min: 1 }],
    },
    code: `
def max_subarray(nums):
    # cur: best sum ending here, best: best overall
    best = cur = nums[0]            #@init
    for i in range(1, len(nums)):   #@loop
        # extend the current run, or start fresh at nums[i]
        cur = max(nums[i], cur + nums[i])  #@cur
        best = max(best, cur)       # keep the best run  #@best
    return best                     #@done
`,
    trace(inp) {
      const nums = (inp.nums || []).slice();
      if (!nums.length) nums.push(0);
      const t = DSA.tracer();
      let best = nums[0], cur = nums[0], start = 0, bs = 0, be = 0;
      const view = (i, o) => {
        o = o || {};
        const states = nums.map((_, j) => (j >= bs && j <= be ? (o.final ? 'found' : 'max') : o.final ? 'dim' : null));
        if (!o.final && i != null) states[i] = o.cur || 'active';
        const v = { type: 'array', items: nums, states };
        if (!o.final) {
          v.ranges = [{ l: start, r: i, label: 'cur run' }];
          v.pointers = [{ i, label: 'i' }];
        }
        return v;
      };
      t.step('init', `Start with the first value: \`best = cur = ${nums[0]}\`.`, { view: view(0), vars: { cur, best } });
      for (let i = 1; i < nums.length; i++) {
        const x = nums[i];
        t.step('loop', `\`i = ${i}\`, \`nums[${i}] = ${x}\`.`, { view: view(i - 1), vars: { cur, best, i } });
        const ext = cur + x, oc = cur;
        if (x > ext) {
          cur = x; start = i;
          t.step('cur', `Extending gives ${oc} + ${x} = ${ext}, but ${x} alone is bigger (the old run sum ${oc} is negative). Start a new run: \`cur = ${cur}\`.`, { view: view(i, { cur: 'new' }), vars: { cur, best, i } });
        } else {
          cur = ext;
          t.step('cur', `\`max(${x}, ${oc} + ${x}) = ${ext}\`: extend the run [${start}, ${i}]. \`cur = ${cur}\`.`, { view: view(i), vars: { cur, best, i } });
        }
        const ob = best;
        best = Math.max(best, cur);
        if (best > ob) { bs = start; be = i; }
        t.step('best', best > ob ? `${cur} > ${ob}: new \`best = ${best}\`, run [${bs}, ${be}].` : `${cur} <= ${ob}: \`best\` stays ${best}.`, { view: view(i), vars: { cur, best, i } });
      }
      t.step('done', `Return ${best}: \`nums[${bs}:${be + 1}] = ${fmtList(nums.slice(bs, be + 1))}\`.`, { view: view(null, { final: true }), vars: { cur, best, return: best } });
      return t.frames;
    },
  });

  /* ====================================================================
   * Monotonic stack
   * ==================================================================== */
  DSA.addAlgo({
    id: 'monotonic-stack',
    title: 'Monotonic Stack',
    category: 'Techniques',
    order: 6,
    tags: ['next greater element', 'stack', 'daily temperatures', 'histogram'],
    summary: 'A stack whose values stay sorted (here: decreasing). When a new value is bigger than the top, it is the "next greater element" for the top, so pop and record. Each index is pushed and popped once.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    legend: { frontier: 'On the stack (waiting)', compare: 'Checking top', found: 'Answer set' },
    notes: [
      'Store **indices**, not values, so you can write `res[j]` and compute distances (`i - j`).',
      'Decreasing stack → next **greater**. Increasing stack → next **smaller**.',
      'Amortised O(n): the inner `while` pops each index at most once over the whole run.',
      'Circular array: loop `i` over `range(2 * n)` and use `i % n`.',
    ],
    tips: [
      'Keywords: "next greater / smaller", "how many days until", "span", "largest rectangle".',
      'Use `<` vs `<=` on purpose: it decides what happens with equal values.',
    ],
    problems: ['496. Next Greater Element I', '739. Daily Temperatures', '503. Next Greater Element II', '84. Largest Rectangle in Histogram', '901. Online Stock Span', '42. Trapping Rain Water'],
    file: 'next_greater',
    input: {
      default: { nums: [2, 7, 3, 5, 4, 6, 8, 1] },
      random: () => ({ nums: Array.from({ length: 8 }, () => U.randInt(1, 9)) }),
      fields: [{ key: 'nums', label: 'nums', type: 'array', max: 12 }],
    },
    code: `
def next_greater(nums):
    res = [-1] * len(nums)          # -1 = no greater value  #@init
    stack = []                      # indices; values decrease  #@init2
    for i, x in enumerate(nums):    #@loop
        # x answers every smaller value waiting on the stack
        while stack and nums[stack[-1]] < x:  #@check
            res[stack.pop()] = x    #@pop
        stack.append(i)             # wait for a bigger one  #@push
    return res                      #@done
`,
    trace(inp) {
      const nums = (inp.nums || []).slice();
      const n = nums.length;
      const t = DSA.tracer();
      const res = new Array(n).fill(-1);
      const stack = [];
      const setAt = new Set();
      const view = (i, o) => {
        o = o || {};
        const ns = nums.map((_, j) => (i != null && j > i ? 'dim' : null));
        stack.forEach((j) => (ns[j] = 'frontier'));
        if (i != null && i < n) ns[i] = 'active';
        if (o.top != null) ns[o.top] = 'compare';
        const rs = res.map((_, j) => (setAt.has(j) ? 'found' : null));
        if (o.newRes != null) rs[o.newRes] = 'new';
        const nRow = { label: 'nums', items: nums, states: ns };
        if (i != null && i < n) nRow.pointers = [{ i, label: 'i' }];
        const sItems = stack.map((j, k) => ({ v: `nums[${j}]=${nums[j]}`, id: 's' + j, s: k === stack.length - 1 && o.top === j ? 'compare' : o.pushed === j ? 'new' : 'frontier' }));
        return [
          { type: 'array', rows: [nRow, { label: 'res', items: res.slice(), states: rs }] },
          { type: 'stack', items: sItems, capacity: 4 },
        ];
      };
      t.step(['init', 'init2'], `\`res\` starts as ${n} × -1. The stack starts empty.`, { views: view(null), vars: { res, stack } });
      for (let i = 0; i < n; i++) {
        const x = nums[i];
        t.step('loop', `\`i = ${i}\`, \`x = ${x}\`.`, { views: view(i), vars: { res, stack, i, x } });
        while (true) {
          if (!stack.length) {
            t.step('check', 'Stack is empty. Nothing is waiting.', { views: view(i), vars: { res, stack, i, x } });
            break;
          }
          const top = stack[stack.length - 1];
          if (nums[top] < x) {
            t.step('check', `Top is index ${top}, value ${nums[top]}. ${nums[top]} < ${x}, so ${x} is its next greater value.`, { views: view(i, { top }), vars: { res, stack, i, x } });
            stack.pop();
            res[top] = x;
            setAt.add(top);
            t.step('pop', `Pop ${top} and set \`res[${top}] = ${x}\`.`, { views: view(i, { newRes: top }), vars: { res, stack, i, x } });
          } else {
            t.step('check', `Top is index ${top}, value ${nums[top]}. ${nums[top]} >= ${x}: stop popping.`, { views: view(i, { top }), vars: { res, stack, i, x } });
            break;
          }
        }
        stack.push(i);
        t.step('push', `Push index ${i}. It waits for a bigger value to its right. Stack values stay decreasing.`, { views: view(i, { pushed: i }), vars: { res, stack, i, x } });
      }
      t.step('done', stack.length ? `Indices ${fmtList(stack)} never found a bigger value, so they keep -1. Return \`${fmtList(res)}\`.` : `Return \`${fmtList(res)}\`.`, { views: view(null), vars: { res, stack, return: res } });
      return t.frames;
    },
  });

  /* ====================================================================
   * Merge intervals
   * ==================================================================== */
  DSA.addAlgo({
    id: 'merge-intervals',
    title: 'Merge Intervals',
    category: 'Techniques',
    order: 7,
    tags: ['intervals', 'overlap', 'sort by start', 'meeting rooms'],
    summary: 'Sort intervals by start. Then walk once: if the next interval starts before the last merged one ends, extend that one; otherwise start a new interval.',
    complexity: { time: 'O(n log n)', space: 'O(n)', note: 'The sort dominates. The merge pass is O(n).' },
    legend: { done: 'Processed', compare: 'Last merged', new: 'Appended', active: 'Current' },
    notes: [
      'After sorting, only the **last** merged interval can overlap the next one.',
      '`a` and `b` overlap when `b.start <= a.end` (use `<` if touching ends should stay separate).',
      'Extend with `max(last_end, end)`: a later interval can sit fully inside the last one.',
      '`intervals.sort()` sorts lists by first item, then second. `key=lambda p: p[0]` also works.',
    ],
    tips: [
      'Meeting rooms / min arrows: sort by **end** instead, and count.',
      'Insert Interval: the list is already sorted, so it is one O(n) pass with no sort.',
    ],
    problems: ['56. Merge Intervals', '57. Insert Interval', '435. Non-overlapping Intervals', '252. Meeting Rooms', '253. Meeting Rooms II', '452. Minimum Number of Arrows'],
    file: 'merge',
    input: {
      default: { intervals: [1, 3, 8, 10, 2, 6, 15, 18, 9, 12, 17, 20] },
      random: () => {
        const out = [];
        for (let k = 0; k < 6; k++) { const s = U.randInt(0, 20); out.push(s, s + U.randInt(1, 5)); }
        return { intervals: out };
      },
      fields: [{ key: 'intervals', label: 'intervals (start, end pairs)', type: 'array', max: 16 }],
    },
    code: `
def merge(intervals):
    intervals.sort()                # by start, then end  #@sort
    out = []                        #@init
    for start, end in intervals:    #@loop
        # overlaps the last merged interval?
        if out and start <= out[-1][1]:  #@cmp
            # yes: stretch its end to cover this one
            out[-1][1] = max(out[-1][1], end)  #@extend
        else:
            # no: there is a gap, start a new interval
            out.append([start, end])  #@append
    return out                      #@done
`,
    trace(inp) {
      let iv = pairsOf(inp.intervals).map(([a, b]) => (a <= b ? [a, b] : [b, a])).slice(0, 8);
      const t = DSA.tracer();
      const raw = iv.map((p) => p.slice());
      iv = iv.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      const out = [];
      const view = (j, o) => {
        o = o || {};
        const is = iv.map((_, k) => (j != null && k < j ? 'done' : null));
        if (j != null && j < iv.length) is[j] = o.cur || 'active';
        const os = out.map(() => null);
        if (o.last && out.length) os[out.length - 1] = o.last;
        const iRow = { label: 'intervals', items: iv.map((p) => p.slice()), states: is };
        if (j != null && j < iv.length) iRow.pointers = [{ i: j, label: 'start, end' }];
        return { type: 'array', rows: [iRow, { label: 'out', items: out.map((p) => p.slice()), states: os }] };
      };
      const outR = () => out.map((p) => p.slice());
      t.step('sort', iv.length ? `Sort by start: ${raw.map((p) => `[${p[0]}, ${p[1]}]`).join(' ')} becomes ${iv.map((p) => `[${p[0]}, ${p[1]}]`).join(' ')}. Overlapping intervals are now neighbours.` : 'Nothing to sort.', { view: view(null), vars: { intervals: iv } });
      t.step('init', '`out = []` will hold the merged intervals.', { view: view(null), vars: { out: outR() } });
      iv.forEach(([s, e], j) => {
        t.step('loop', `Next interval: \`start = ${s}\`, \`end = ${e}\`.`, { view: view(j), vars: { out: outR(), start: s, end: e } });
        const last = out[out.length - 1];
        const overlap = !!last && s <= last[1];
        const msg = !last ? '`out` is empty, so there is nothing to merge with.'
          : overlap ? `${s} <= ${last[1]}, the end of [${last[0]}, ${last[1]}]: they overlap.`
            : `${s} > ${last[1]}, the end of [${last[0]}, ${last[1]}]: there is a gap.`;
        t.step('cmp', msg, { view: view(j, { cur: 'compare', last: 'compare' }), vars: { out: outR(), start: s, end: e } });
        if (overlap) {
          const oe = last[1];
          last[1] = Math.max(oe, e);
          t.step('extend', e <= oe ? `\`max(${oe}, ${e}) = ${oe}\`: [${s}, ${e}] sits inside, the end stays ${oe}.` : `\`max(${oe}, ${e}) = ${last[1]}\`: extend to [${last[0]}, ${last[1]}].`, { view: view(j, { last: 'active' }), vars: { out: outR(), start: s, end: e } });
        } else {
          out.push([s, e]);
          t.step('append', `Append [${s}, ${e}] as a new interval.`, { view: view(j, { last: 'new' }), vars: { out: outR(), start: s, end: e } });
        }
      });
      const fin = view(iv.length);
      fin.rows[1].states = out.map(() => 'found');
      t.step('done', `Return ${out.map((p) => `[${p[0]}, ${p[1]}]`).join(' ') || '[]'}: ${iv.length} interval${iv.length === 1 ? '' : 's'} merged into ${out.length}.`, { view: fin, vars: { out: outR(), return: outR() } });
      return t.frames;
    },
  });

  /* ====================================================================
   * Top K with a heap
   * ==================================================================== */
  // Exact copies of CPython heapq internals, so the array matches Python.
  function siftdown(h, start, pos) {
    const item = h[pos];
    while (pos > start) {
      const p = (pos - 1) >> 1;
      if (item.v < h[p].v) { h[pos] = h[p]; pos = p; continue; }
      break;
    }
    h[pos] = item;
  }
  function siftup(h, pos) {
    const end = h.length, start = pos, item = h[pos];
    let c = 2 * pos + 1;
    while (c < end) {
      const r = c + 1;
      if (r < end && !(h[c].v < h[r].v)) c = r;
      h[pos] = h[c];
      pos = c;
      c = 2 * pos + 1;
    }
    h[pos] = item;
    siftdown(h, start, pos);
  }
  function heapTree(h, i, states) {
    if (i >= h.length) return null;
    return { id: h[i].id, v: h[i].v, s: states[h[i].id] || null, left: heapTree(h, 2 * i + 1, states), right: heapTree(h, 2 * i + 2, states) };
  }

  DSA.addAlgo({
    id: 'top-k-heap',
    title: 'Top K with a Heap',
    category: 'Techniques',
    order: 8,
    tags: ['heapq', 'k largest', 'kth largest', 'priority queue', 'nlargest', 'min-heap'],
    summary: 'Keep the `k` largest values seen so far in a **min-heap** of size `k`. The root is the smallest of them, the one to beat. A bigger value replaces the root; anything else is skipped.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    legend: { min: 'heap[0] (smallest kept)', new: 'Just placed', compare: 'Checking' },
    notes: [
      'Python `heapq` is a **min**-heap on a plain list. `heap[0]` is always the smallest.',
      '`heapq.heapreplace(h, x)` = pop the min then push `x`, in one O(log k) step.',
      'One-liner: `heapq.nlargest(k, nums)` (and `nsmallest`). It uses this same idea.',
      'For k smallest, use a max-heap by pushing `-x`.',
      'After the loop, `heap[0]` is the **k-th largest** value.',
    ],
    tips: [
      'Why a min-heap for the largest? You need fast access to the weakest of your current top k.',
      'If k is close to n, `sorted(nums)[-k:]` is simpler; Quickselect gives O(n) average.',
    ],
    problems: ['215. Kth Largest Element in an Array', '347. Top K Frequent Elements', '703. Kth Largest Element in a Stream', '973. K Closest Points to Origin', '692. Top K Frequent Words'],
    file: 'top_k',
    input: {
      default: { nums: [3, 1, 5, 12, 2, 11, 8, 7], k: 3 },
      random: () => ({ nums: U.randArray(8, 1, 30), k: U.randInt(2, 4) }),
      fields: [
        { key: 'nums', label: 'nums', type: 'array', max: 12, min: 1 },
        { key: 'k', label: 'k', type: 'number' },
      ],
    },
    code: `
import heapq

def top_k(nums, k):
    heap = []                       # min-heap, size <= k  #@init
    for x in nums:                  #@loop
        if len(heap) < k:           # not full yet  #@size
            heapq.heappush(heap, x) # O(log k)  #@push
        elif x > heap[0]:           # beats the smallest kept  #@cmp
            heapq.heapreplace(heap, x)  # pop min, push x  #@replace
    return sorted(heap, reverse=True)   # biggest first  #@done
`,
    trace(inp) {
      const nums = arrOr(inp.nums, [3, 1, 5, 12, 2, 11, 8, 7]).slice(0, 12);
      const k = clampK(numOr(inp.k, 3), nums.length);
      const t = DSA.tracer();
      const heap = [];
      let uid = 0;
      const hv = () => heap.map((o) => o.v);
      const views = (i, o) => {
        o = o || {};
        const ns = nums.map((_, j) => (i != null && j < i ? 'dim' : null));
        if (i != null && i < nums.length) ns[i] = o.cur || 'active';
        const st = {};
        if (heap.length) st[heap[0].id] = 'min';
        if (o.newId) st[o.newId] = 'new';
        if (o.rootCmp && heap.length) st[heap[0].id] = 'compare';
        const nRow = { label: 'nums', items: nums, states: ns };
        if (i != null && i < nums.length) nRow.pointers = [{ i, label: 'x' }];
        return [
          { type: 'array', rows: [nRow, { label: 'heap', items: heap.map((h) => ({ v: h.v, id: h.id, s: st[h.id] || null })) }] },
          { type: 'tree', title: 'min-heap', root: heapTree(heap, 0, st) },
        ];
      };
      t.step('init', `Empty heap. It will keep the ${k} largest values seen.`, { views: views(null), vars: { k, heap: hv() } });
      nums.forEach((x, i) => {
        t.step('loop', `\`x = ${x}\`.`, { views: views(i), vars: { k, heap: hv(), x } });
        if (heap.length < k) {
          t.step('size', `\`len(heap) = ${heap.length} < ${k}\`: not full yet, just add it.`, { views: views(i), vars: { k, heap: hv(), x } });
          const item = { v: x, id: 'h' + uid++ };
          heap.push(item);
          siftdown(heap, 0, heap.length - 1);
          t.step('push', `\`heappush\`: ${x} goes at the end and sifts up past bigger parents. Smallest kept is now ${heap[0].v}.`, { views: views(i, { newId: item.id }), vars: { k, heap: hv(), x } });
        } else {
          t.step('size', `\`len(heap) = ${k}\`: the heap is full.`, { views: views(i), vars: { k, heap: hv(), x } });
          const root = heap[0].v;
          t.step('cmp', x > root ? `${x} > \`heap[0] = ${root}\`: it beats the smallest of the top ${k}.` : `${x} <= \`heap[0] = ${root}\`: not in the top ${k}. Skip it.`, { views: views(i, { rootCmp: true, cur: 'compare' }), vars: { k, heap: hv(), x } });
          if (x > root) {
            const item = { v: x, id: 'h' + uid++ };
            heap[0] = item;
            siftup(heap, 0);
            t.step('replace', `\`heapreplace\`: drop ${root}, put ${x} at the root, sift it down. Smallest kept is now ${heap[0].v}.`, { views: views(i, { newId: item.id }), vars: { k, heap: hv(), x } });
          }
        }
      });
      const res = hv().sort((a, b) => b - a);
      t.step('done', `The heap holds the ${k} largest values. Sorted big to small: \`${fmtList(res)}\`. \`heap[0] = ${heap[0].v}\` is the k-th largest (k = ${k}).`, { views: views(null), vars: { k, heap: hv(), return: res } });
      return t.frames;
    },
  });
})();
