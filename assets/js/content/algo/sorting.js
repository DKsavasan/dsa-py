/* Algorithms · Sorting */
(function () {
  const U = DSA.util;
  const py = U.py;

  /* ---------- shared helpers ---------- */
  const prep = (inp) => (inp.nums || []).map(Number).filter((x) => isFinite(x));
  const vals = (a) => a.map((o) => o.v);
  // bar view of item objects {v, id}
  const bars = (items, states, pointers, extra) => Object.assign({ type: 'array', bars: true, items, states: states || {}, pointers: pointers || [] }, extra || {});
  // states map: every index in `sorted` gets 'sorted', then `extra` wins
  const withSorted = (n, sorted, extra) => {
    const s = {};
    for (let k = 0; k < n; k++) if (sorted.has(k)) s[k] = 'sorted';
    return Object.assign(s, extra || {});
  };
  const allSorted = (n) => U.range(n).map(() => 'sorted');
  const sortInput = (def, max) => ({
    default: { nums: def },
    random: () => ({ nums: U.randArray(U.randInt(6, 9), 1, 50, Math.random() < 0.5) }),
    fields: [{ key: 'nums', label: 'nums', type: 'array', max: max || 10 }],
  });
  // frames for an empty list
  function emptyFrames(line, doneLine) {
    const t = DSA.tracer();
    const v = { type: 'array', items: [], label: 'nums' };
    t.step(line, 'The list is empty.', { view: v, vars: { nums: [] } });
    t.step(doneLine, 'Nothing to sort. Return `[]`.', { view: v, vars: { return: [] } });
    return t.frames;
  }

  /* ================= Bubble sort ================= */
  DSA.addAlgo({
    id: 'bubble-sort',
    title: 'Bubble Sort',
    category: 'Sorting',
    order: 1,
    tags: ['swap', 'adjacent', 'early exit', 'quadratic', 'simple sort'],
    summary: 'Walk the list comparing neighbours and swap any pair that is out of order. Each pass carries the largest remaining value to the end. Stop as soon as a pass makes no swaps.',
    complexity: { time: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)' }, space: 'O(1)', stable: true, inPlace: true, note: 'Best case O(n) comes from the `swapped` flag: one clean pass proves the list is sorted.' },
    notes: [
      'After pass `i`, the last `i + 1` items are in their final places, so the inner loop shrinks.',
      'Stable: it only swaps when `>`, never when equal.',
      'Mostly a teaching sort. Its one real strength: detecting an already sorted list in O(n).',
    ],
    tips: [
      'Forget the `swapped` flag and the best case becomes O(n²). Interviewers ask about it.',
      'Python swap is one line: `a[i], a[j] = a[j], a[i]` (no temp variable).',
    ],
    problems: ['912. Sort an Array', '283. Move Zeroes', '905. Sort Array By Parity', '75. Sort Colors'],
    input: sortInput([5, 1, 4, 2, 8, 3, 7, 6]),
    code: `
def bubble_sort(nums):
    n = len(nums)
    for i in range(n - 1):              # pass i  #@pass
        swapped = False                 #@flag
        # the last i items are already in place
        for j in range(n - 1 - i):
            if nums[j] > nums[j + 1]:   # out of order?  #@cmp
                # swap the pair
                nums[j], nums[j + 1] = nums[j + 1], nums[j]  #@swap
                swapped = True          #@mark
        if not swapped:                 # clean pass: sorted  #@check
            break                       #@stop
    return nums                         #@done
`,
    trace(inp) {
      const a = U.withIds(prep(inp));
      const n = a.length;
      if (!n) return emptyFrames('pass', 'done');
      const t = DSA.tracer();
      const sorted = new Set();
      const ptr = (j) => [{ i: j, label: 'j' }, { i: j + 1, label: 'j+1' }];
      let i = 0;
      if (n === 1) t.step('pass', '`range(0)` is empty: one item is already sorted.', { view: bars(a), vars: { nums: vals(a), n } });
      for (i = 0; i < n - 1; i++) {
        let swapped = false;
        const last = n - 1 - i;
        t.step(['pass', 'flag'], i === 0 ? `Pass 0: compare neighbours from index 0 up to ${last}. \`swapped = False\`.` : `Pass ${i}: the last ${i} item${i > 1 ? 's are' : ' is'} final, so stop at index ${last}. \`swapped = False\`.`, { view: bars(a, withSorted(n, sorted), [], { range: [0, last] }), vars: { nums: vals(a), n, i, swapped } });
        for (let j = 0; j < last; j++) {
          const x = a[j].v, y = a[j + 1].v;
          t.step('cmp', x > y ? `nums[${j}] = ${x} > nums[${j + 1}] = ${y}: out of order.` : `${x} <= ${y}: already in order, no swap.`, { view: bars(a, withSorted(n, sorted, { [j]: 'compare', [j + 1]: 'compare' }), ptr(j), { range: [0, last] }), vars: { nums: vals(a), n, i, swapped, j } });
          if (x > y) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            swapped = true;
            t.step(['swap', 'mark'], `Swap: ${y} moves left, ${x} moves right. \`swapped = True\`.`, { view: bars(a, withSorted(n, sorted, { [j]: 'swap', [j + 1]: 'swap' }), ptr(j), { range: [0, last] }), vars: { nums: vals(a), n, i, swapped, j } });
          }
        }
        if (swapped) {
          sorted.add(last);
          t.step('check', `Pass ${i} made swaps. ${a[last].v} has bubbled to index ${last} and is final. Next pass.`, { view: bars(a, withSorted(n, sorted)), vars: { nums: vals(a), n, i, swapped } });
        } else {
          U.range(n).forEach((k) => sorted.add(k));
          t.step('check', `Pass ${i} made no swaps: every neighbour pair is in order.`, { view: bars(a, withSorted(n, sorted)), vars: { nums: vals(a), n, i, swapped } });
          t.step('stop', `Break early${n - 2 - i > 0 ? `, skipping ${n - 2 - i} pass${n - 2 - i > 1 ? 'es' : ''}` : ''}.`, { view: bars(a, allSorted(n)), vars: { nums: vals(a), n, i, swapped } });
          break;
        }
      }
      t.step('done', `Return the sorted list ${py(vals(a))}.`, { view: bars(a, allSorted(n)), vars: { nums: vals(a), return: vals(a) } });
      return t.frames;
    },
  });

  /* ================= Selection sort ================= */
  DSA.addAlgo({
    id: 'selection-sort',
    title: 'Selection Sort',
    category: 'Sorting',
    order: 2,
    tags: ['minimum', 'swap', 'quadratic', 'simple sort'],
    summary: 'Find the smallest item in the unsorted part and swap it to the front. Repeat for each slot. Always O(n²) comparisons but at most n - 1 swaps.',
    complexity: { time: { best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)' }, space: 'O(1)', stable: false, inPlace: true, note: 'Not stable: the long-distance swap can jump an item over an equal one.' },
    notes: [
      'Left part `nums[:i]` is sorted and final; the rest is unsorted.',
      'Always does n(n-1)/2 comparisons, even on sorted input. No early exit.',
      'Fewest writes of the simple sorts (n - 1 swaps). Useful when writes are expensive.',
      'Example of instability: `[2a, 2b, 1]` → the first swap moves `2a` behind `2b`.',
    ],
    tips: [
      'Pythonic min index of a slice: `min(range(i, n), key=nums.__getitem__)`.',
      'Kth smallest by "select the min k times" is O(nk). A heap or quickselect does better.',
    ],
    problems: ['912. Sort an Array', '215. Kth Largest Element in an Array', '1051. Height Checker'],
    input: sortInput([29, 10, 14, 37, 13, 5, 22, 18]),
    code: `
def selection_sort(nums):
    n = len(nums)
    for i in range(n - 1):              # fill slot i  #@pass
        min_i = i                       # smallest so far  #@init
        for j in range(i + 1, n):       # scan the rest
            if nums[j] < nums[min_i]:   #@cmp
                min_i = j               # new minimum  #@newmin
        # move the minimum into slot i
        nums[i], nums[min_i] = nums[min_i], nums[i]  #@swap
    return nums                         #@done
`,
    trace(inp) {
      const a = U.withIds(prep(inp));
      const n = a.length;
      if (!n) return emptyFrames('pass', 'done');
      const t = DSA.tracer();
      const sorted = new Set();
      const P = (i, j, m) => {
        const p = [{ i, label: 'i' }];
        if (m != null) p.push({ i: m, label: 'min_i', s: 'min' });
        if (j != null) p.push({ i: j, label: 'j', s: 'compare' });
        return p;
      };
      if (n === 1) t.step('pass', '`range(0)` is empty: one item is already sorted.', { view: bars(a), vars: { nums: vals(a), n } });
      for (let i = 0; i < n - 1; i++) {
        let m = i;
        t.step(['pass', 'init'], `Slot ${i}: assume nums[${i}] = ${a[i].v} is the smallest. \`min_i = ${i}\`.`, { view: bars(a, withSorted(n, sorted, { [i]: 'min' }), P(i, null, m), { range: [i, n - 1] }), vars: { nums: vals(a), i, min_i: m } });
        for (let j = i + 1; j < n; j++) {
          const lt = a[j].v < a[m].v;
          t.step('cmp', `Is nums[${j}] = ${a[j].v} < ${a[m].v}? ${lt ? 'Yes.' : 'No.'}`, { view: bars(a, withSorted(n, sorted, { [m]: 'min', [j]: 'compare' }), P(i, j, m), { range: [i, n - 1] }), vars: { nums: vals(a), i, min_i: m, j } });
          if (lt) {
            m = j;
            t.step('newmin', `New minimum ${a[m].v} at index ${j}: \`min_i = ${j}\`.`, { view: bars(a, withSorted(n, sorted, { [m]: 'min' }), P(i, j, m), { range: [i, n - 1] }), vars: { nums: vals(a), i, min_i: m, j } });
          }
        }
        const same = m === i;
        const mv = a[m].v;
        [a[i], a[m]] = [a[m], a[i]];
        sorted.add(i);
        t.step('swap', same ? `The minimum ${mv} is already at index ${i}; swapping it with itself changes nothing. Slot ${i} is final.` : `Swap the minimum ${mv} (index ${m}) into slot ${i}. Slot ${i} is final.`, { view: bars(a, withSorted(n, sorted, same ? {} : { [i]: 'swap', [m]: 'swap' }), P(i, null, m)), vars: { nums: vals(a), i, min_i: m } });
      }
      t.step('done', `Only one item is left and it must be the largest. Return ${py(vals(a))}.`, { view: bars(a, allSorted(n)), vars: { nums: vals(a), return: vals(a) } });
      return t.frames;
    },
  });

  /* ================= Insertion sort ================= */
  DSA.addAlgo({
    id: 'insertion-sort',
    title: 'Insertion Sort',
    category: 'Sorting',
    order: 3,
    tags: ['shift', 'nearly sorted', 'online', 'quadratic', 'simple sort'],
    summary: 'Grow a sorted prefix one item at a time: take the next value, shift bigger items right, drop the value into the gap. Fast on small or nearly sorted lists.',
    complexity: { time: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)' }, space: 'O(1)', stable: true, inPlace: true, note: 'Work is O(n + inversions). Sorted input: O(n). Reversed: O(n²).' },
    notes: [
      '`nums[:i]` is always sorted (but not final: later items may slide in).',
      'Stable: the `>` test stops at an equal item, so the new one lands after it.',
      'Online: it can sort items as they arrive.',
      'Timsort (Python\'s `sort`) uses insertion sort on short runs of ~32–64 items.',
    ],
    tips: [
      'In real Python code, `bisect.insort(sorted_list, x)` inserts into a sorted list (O(log n) search, O(n) shift).',
      'Mention it for "nearly sorted" or "each item is at most k away" inputs.',
    ],
    problems: ['147. Insertion Sort List', '912. Sort an Array', '35. Search Insert Position'],
    input: sortInput([6, 3, 8, 2, 9, 1, 5, 4]),
    code: `
def insertion_sort(nums):
    for i in range(1, len(nums)):
        key = nums[i]                    # value to insert  #@key
        j = i - 1                        # last sorted index  #@init
        # shift bigger items one slot right
        while j >= 0 and nums[j] > key:  #@cmp
            nums[j + 1] = nums[j]        #@shift
            j -= 1                       #@dec
        nums[j + 1] = key                # drop key in the gap  #@place
    return nums                          #@done
`,
    trace(inp) {
      const a = U.withIds(prep(inp));
      const n = a.length;
      if (!n) return emptyFrames('key', 'done');
      const t = DSA.tracer();
      // The key's bar is drawn in the gap. Python's list holds a copy of
      // the shifted value there, which is what `pylist` shows.
      const pylist = (gap, i) => {
        const v = vals(a);
        if (gap < i) v[gap] = v[gap + 1];
        return v;
      };
      const S = (i, gap, extra) => {
        const s = {};
        for (let k = 0; k <= i; k++) s[k] = 'visited';
        for (let k = i + 1; k < n; k++) s[k] = null;
        s[gap] = 'active';
        return Object.assign(s, extra || {});
      };
      if (n === 1) t.step('key', '`range(1, 1)` is empty: one item is already sorted.', { view: bars(a), vars: { nums: vals(a) } });
      for (let i = 1; i < n; i++) {
        const key = a[i].v;
        let gap = i;
        t.step('key', `Take \`key = nums[${i}] = ${key}\`. Everything left of index ${i} is sorted.`, { view: bars(a, S(i, gap), [{ i, label: 'i' }], { range: [0, i] }), vars: { nums: pylist(gap, i), i, key } });
        let j = i - 1;
        t.step('init', `\`j = ${j}\`: start comparing with the item just left of it.`, { view: bars(a, S(i, gap, { [j]: 'compare' }), [{ i: j, label: 'j' }], { range: [0, i] }), vars: { nums: pylist(gap, i), i, key, j } });
        while (true) {
          const ok = j >= 0 && a[j].v > key;
          const msg = j < 0 ? '`j = -1`: reached the front, stop.' : ok ? `nums[${j}] = ${a[j].v} > ${key}: shift it right.` : `nums[${j}] = ${a[j].v} <= ${key}: stop here.`;
          t.step('cmp', msg, { view: bars(a, S(i, gap, j >= 0 ? { [j]: 'compare' } : {}), j >= 0 ? [{ i: j, label: 'j' }] : [], { range: [0, i] }), vars: { nums: pylist(gap, i), i, key, j } });
          if (!ok) break;
          // move the bigger item right by swapping it with the held key
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          gap = j;
          j -= 1;
          t.step(['shift', 'dec'], `\`nums[${j + 2}] = ${a[j + 2].v}\`: ${a[j + 2].v} moves one slot right. The gap is now at ${gap}. \`j = ${j}\`.`, { view: bars(a, S(i, gap, { [j + 2]: 'swap' }), j >= 0 ? [{ i: j, label: 'j' }] : [], { range: [0, i] }), vars: { nums: pylist(gap, i), i, key, j } });
        }
        t.step('place', gap === i ? `Nothing was bigger, so ${key} stays at index ${i}.` : `Put ${key} into the gap at index ${j + 1}. Now \`nums[:${i + 1}]\` is sorted.`, { view: bars(a, S(i, -1, { [gap]: 'found' }), [{ i: j + 1, label: 'j+1' }], { range: [0, i] }), vars: { nums: vals(a), i, key, j } });
      }
      t.step('done', `Every item has been inserted. Return ${py(vals(a))}.`, { view: bars(a, allSorted(n)), vars: { nums: vals(a), return: vals(a) } });
      return t.frames;
    },
  });

  /* ================= Merge sort ================= */
  const MERGE_CODE = `
def merge(left, right):
    out, i, j = [], 0, 0                 #@minit
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:          # <= keeps it stable  #@mcmp
            out.append(left[i])          #@takeL
            i += 1                       #@incL
        else:
            out.append(right[j])         #@takeR
            j += 1                       #@incR
    out.extend(left[i:])                 # add leftovers  #@rest
    out.extend(right[j:])                #@rest2
    return out                           #@mret
`;

  /* Run merge(L, R) on item objects, emitting frames.
   * ctx(rowsView, vars) must return the frame options (views, aux...). */
  function runMerge(t, L, R, ctx) {
    const out = [];
    let i = 0, j = 0;
    const total = L.length + R.length;
    const rows = (hl) => {
      hl = hl || {};
      const outItems = out.map((o) => o.v);
      while (outItems.length < total) outItems.push(null);
      const oStates = {};
      if (hl.newFrom != null) for (let k = hl.newFrom; k < out.length; k++) oStates[k] = 'new';
      return {
        type: 'array', title: 'merge(left, right)',
        rows: [
          { label: 'left', items: vals(L), states: L.map((_, k) => (k < i ? 'dim' : hl.L === k ? hl.s : null)), pointers: [{ i, label: 'i' }] },
          { label: 'right', items: vals(R), states: R.map((_, k) => (k < j ? 'dim' : hl.R === k ? hl.s : null)), pointers: [{ i: j, label: 'j' }] },
          { label: 'out', items: outItems, states: oStates },
        ],
      };
    };
    const vars = () => ({ left: vals(L), right: vals(R), out: vals(out), i, j });
    t.step('minit', `Merge ${py(vals(L))} and ${py(vals(R))}. \`out = []\`, \`i = j = 0\`.`, ctx(rows(), vars()));
    while (i < L.length && j < R.length) {
      const x = L[i].v, y = R[j].v;
      if (x <= y) {
        const ci = i, cj = j;
        out.push(L[i]); i++;
        const r = rows({ newFrom: out.length - 1 });
        r.rows[1].states[cj] = 'compare';
        t.step(['mcmp', 'takeL', 'incL'], x === y ? `left[${ci}] = ${x} == right[${cj}] = ${y}: a tie. Take the left one first, so equal items keep their order (stable).` : `left[${ci}] = ${x} <= right[${cj}] = ${y}: append ${x} from left. \`i = ${i}\`.`, ctx(r, vars()));
      } else {
        const ci = i, cj = j;
        out.push(R[j]); j++;
        const r = rows({ newFrom: out.length - 1 });
        r.rows[0].states[ci] = 'compare';
        t.step(['mcmp', 'takeR', 'incR'], `left[${ci}] = ${x} > right[${cj}] = ${y}: append ${y} from right. \`j = ${j}\`.`, ctx(r, vars()));
      }
    }
    const from = out.length;
    const restL = L.slice(i), restR = R.slice(j);
    out.push(...restL, ...restR);
    const side = restL.length ? 'left' : 'right';
    const rest = restL.length ? restL : restR;
    i = L.length; j = R.length;
    t.step(['rest', 'rest2'], rest.length ? `${side === 'left' ? 'right' : 'left'} is used up. Copy what is left of ${side}: ${py(vals(rest))}.` : 'Both sides are used up; the extends add nothing.', ctx(rows({ newFrom: from }), vars()));
    return out;
  }

  DSA.addAlgo({
    id: 'merge-sort',
    title: 'Merge Sort',
    category: 'Sorting',
    order: 4,
    tags: ['divide and conquer', 'merge', 'stable', 'n log n', 'recursion', 'linked list sort'],
    summary: 'Split the list in half, sort each half, then merge the two sorted halves by repeatedly taking the smaller front item. Guaranteed O(n log n) and stable.',
    complexity: { time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' }, space: 'O(n)', stable: true, inPlace: false },
    notes: [
      'log n levels of splitting, and each level merges n items in total: O(n log n) every time.',
      'The merge is the key skill: two pointers, take the smaller, then copy the leftovers.',
      '`<=` in the merge (take left on ties) is what makes it stable.',
      'Great for linked lists (no extra array needed) and external sorting of huge files.',
    ],
    tips: [
      '"Count inversions" and "count of smaller numbers after self" are merge sort with a counter in the merge.',
      'Standard library merge of sorted iterables: `heapq.merge(a, b)` (lazy).',
    ],
    problems: ['912. Sort an Array', '88. Merge Sorted Array', '21. Merge Two Sorted Lists', '148. Sort List', '315. Count of Smaller Numbers After Self', '493. Reverse Pairs'],
    input: sortInput([38, 27, 43, 3, 9, 82, 10, 27]),
    variants: [
      {
        id: 'top-down',
        label: 'Top-down (recursive)',
        summary: 'Recursive: split in half with slices, sort each half with a recursive call, return the merge. The bars show each returned piece drawn back in its place.',
        complexity: { time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' }, space: 'O(n)', stable: true, inPlace: false, note: 'O(n) for the merged lists plus O(log n) recursion depth. The slices copy, but the total per level is still O(n).' },
        code: `
def merge_sort(nums):
    if len(nums) <= 1:                   # 0 or 1 item: sorted  #@base
        return nums                      #@baseret
    mid = len(nums) // 2                 #@mid
    left = merge_sort(nums[:mid])        # sort each half  #@left
    right = merge_sort(nums[mid:])       #@right
    return merge(left, right)            # merge the halves  #@merge
` + MERGE_CODE,
        trace(inp) {
          const main = U.withIds(prep(inp));
          const n = main.length;
          if (!n) return emptyFrames('base', 'baseret');
          const t = DSA.tracer();
          const stack = [];
          let done = false;
          const aux = () => [{ label: 'call stack', kind: 'stack', items: stack.map((s, k) => ({ v: s, s: k === stack.length - 1 ? 'active' : null })) }];
          const mainView = (lo, hi, extra) => {
            const s = {};
            for (let k = 0; k < n; k++) if (done) s[k] = 'sorted'; else if (k < lo || k >= hi) s[k] = 'dim';
            return bars(main, Object.assign(s, extra || {}), [], { ranges: done ? [] : [{ l: lo, r: hi - 1 }], title: 'returned pieces drawn in place' });
          };
          function ms(lo, hi) {
            const cur = vals(main.slice(lo, hi));
            stack.push(`merge_sort(${py(cur)})`);
            if (hi - lo <= 1) {
              t.step(['base', 'baseret'], `${py(cur)} has ${cur.length} item: already sorted, return it.`, { views: [mainView(lo, hi, { [lo]: 'found' })], vars: { nums: cur, return: cur }, aux: aux() });
              stack.pop();
              return;
            }
            const mid = (hi - lo) >> 1;
            const mv = { nums: cur, mid };
            t.step(['base', 'mid'], `${py(cur)} has ${cur.length} items. Split at \`mid = ${mid}\`: ${py(cur.slice(0, mid))} and ${py(cur.slice(mid))}.`, { views: [mainView(lo, hi)], vars: mv, aux: aux() });
            t.step('left', `Recurse on the left half ${py(cur.slice(0, mid))}.`, { views: [mainView(lo, lo + mid)], vars: mv, aux: aux() });
            ms(lo, lo + mid);
            const left = main.slice(lo, lo + mid);
            t.step('right', `Left half came back sorted: ${py(vals(left))}. Now recurse on the right half ${py(cur.slice(mid))}.`, { views: [mainView(lo + mid, hi)], vars: Object.assign({ left: vals(left) }, mv), aux: aux() });
            ms(lo + mid, hi);
            const right = main.slice(lo + mid, hi);
            const mv2 = { nums: cur, mid, left: vals(left), right: vals(right) };
            t.step('merge', `Right half came back sorted: ${py(vals(right))}. Merge the two halves.`, { views: [mainView(lo, hi)], vars: mv2, aux: aux() });
            stack.push('merge(left, right)');
            const out = runMerge(t, left, right, (rows, vars) => ({ views: [mainView(lo, hi), rows], vars, aux: aux() }));
            stack.pop();
            main.splice(lo, hi - lo, ...out);
            const top = stack.length === 1;
            if (top) done = true;
            const hl = {};
            for (let k = lo; k < hi; k++) hl[k] = 'sorted';
            t.step(['mret', 'merge'], top ? `The top call returns ${py(vals(out))}. Fully sorted.` : `\`merge\` returns ${py(vals(out))}, and this call returns it to its caller.`, { views: [mainView(lo, hi, hl)], vars: Object.assign({}, mv2, { return: vals(out) }), aux: aux() });
            stack.pop();
          }
          ms(0, n);
          if (n === 1) t.step(['base', 'baseret'], 'Done: a single item is its own sorted list.', { views: [bars(main, allSorted(1))], vars: { return: vals(main) } });
          return t.frames;
        },
      },
      {
        id: 'bottom-up',
        label: 'Bottom-up (iterative)',
        summary: 'No recursion: treat every item as a sorted run of 1, then merge neighbouring runs of width 1, 2, 4, ... until one run covers the list.',
        complexity: { time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' }, space: 'O(n)', stable: true, inPlace: false, note: 'O(n) buffer for the merge, but no recursion stack.' },
        code: `
def merge_sort(nums):
    n, width = len(nums), 1              # runs of size 1  #@init
    while width < n:                     # until one run left  #@loop
        # merge neighbour runs nums[lo:mid] and nums[mid:hi]
        for lo in range(0, n, 2 * width):
            mid = min(lo + width, n)     #@lo
            hi = min(lo + 2 * width, n)  #@hi
            nums[lo:hi] = merge(nums[lo:mid], nums[mid:hi])  #@merge
        width *= 2                       # runs double in size  #@double
    return nums                          #@done
` + MERGE_CODE,
        trace(inp) {
          const a = U.withIds(prep(inp));
          const n = a.length;
          if (!n) return emptyFrames('init', 'done');
          const t = DSA.tracer();
          // run boundaries drawn as bands
          const runBands = (w) => {
            const r = [];
            for (let s = 0; s < n; s += w) r.push({ l: s, r: Math.min(s + w, n) - 1 });
            return r;
          };
          const V = (w, lo, mid, hi, extra) => {
            const s = {};
            if (lo != null) for (let k = 0; k < n; k++) if (k < lo || k >= hi) s[k] = 'dim';
            const ranges = lo == null ? runBands(w) : [{ l: lo, r: mid - 1, label: 'left' }].concat(hi > mid ? [{ l: mid, r: hi - 1, label: 'right', s: 'range' }] : []);
            const p = lo == null ? [] : [{ i: lo, label: 'lo' }, { i: mid, label: 'mid' }];
            return bars(a, Object.assign(s, extra || {}), p.filter((q) => q.i < n), { ranges });
          };
          let width = 1;
          t.step('init', `\`n = ${n}\`, \`width = 1\`: every single item is a sorted run.`, { views: [V(width)], vars: { nums: vals(a), n, width } });
          while (true) {
            t.step('loop', width < n ? `\`width = ${width} < ${n}\`: there are still several runs. Merge them in pairs.` : `\`width = ${width} >= ${n}\`: one run covers the whole list.`, { views: [V(width)], vars: { nums: vals(a), n, width } });
            if (width >= n) break;
            for (let lo = 0; lo < n; lo += 2 * width) {
              const mid = Math.min(lo + width, n), hi = Math.min(lo + 2 * width, n);
              const base = { nums: vals(a), width, lo, mid, hi };
              t.step(['lo', 'hi'], hi > mid ? `\`lo = ${lo}\`: merge nums[${lo}:${mid}] = ${py(vals(a.slice(lo, mid)))} with nums[${mid}:${hi}] = ${py(vals(a.slice(mid, hi)))}.` : `\`lo = ${lo}\`: nums[${lo}:${mid}] has no neighbour run (nums[${mid}:${hi}] is empty).`, { views: [V(width, lo, mid, hi)], vars: base });
              const out = runMerge(t, a.slice(lo, mid), a.slice(mid, hi), (rows, vars) => ({ views: [V(width, lo, mid, hi), rows], vars: Object.assign({ width, lo, mid, hi }, vars) }));
              a.splice(lo, hi - lo, ...out);
              const hl = {};
              for (let k = lo; k < hi; k++) hl[k] = 'found';
              t.step(['mret', 'merge'], `\`merge\` returns ${py(vals(out))}. Write it back into nums[${lo}:${hi}].`, { views: [V(width, lo, lo + out.length, lo + out.length, hl)], vars: { nums: vals(a), width, lo, mid, hi } });
            }
            width *= 2;
            t.step('double', `All pairs merged. \`width = ${width}\`: runs are now up to ${width} long.`, { views: [V(width)], vars: { nums: vals(a), n, width } });
          }
          t.step('done', `Return ${py(vals(a))}.`, { views: [bars(a, allSorted(n))], vars: { nums: vals(a), return: vals(a) } });
          return t.frames;
        },
      },
    ],
  });

  /* ================= Quick sort ================= */
  const QS_DRIVER = (split, left, right) => `
def quick_sort(nums, lo=0, hi=None):
    if hi is None:
        hi = len(nums) - 1               # first call  #@init
    if lo < hi:                          # 2+ items to sort  #@base
        p = partition(nums, lo, hi)      # ${split}  #@part
        quick_sort(nums, ${left}  #@left
        quick_sort(nums, ${right}  #@right
    return nums                          #@done
`;

  function qsTrace(inp, hoare) {
    const a = U.withIds(prep(inp));
    const n = a.length;
    if (!n) return emptyFrames('init', 'done');
    const t = DSA.tracer();
    const fin = new Set(); // final positions
    const stack = [];
    const aux = () => [{ label: 'call stack', kind: 'stack', items: stack.map((s, k) => ({ v: s, s: k === stack.length - 1 ? 'active' : null })) }];
    // P: partition state for colouring
    const view = (lo, hi, P, extra) => {
      const s = {};
      for (let k = 0; k < n; k++) {
        if (fin.has(k)) s[k] = 'sorted';
        else if (lo != null && (k < lo || k > hi)) s[k] = 'dim';
      }
      const ptrs = [];
      if (P) {
        if (hoare) {
          for (let k = lo; k < P.i && k <= hi; k++) s[k] = 'visited';
          for (let k = Math.max(P.j + 1, lo); k <= hi; k++) s[k] = 'frontier';
          a.forEach((o, k) => { if (o.id === P.pid && k >= lo && k <= hi) s[k] = 'pivot'; });
        } else {
          for (let k = lo; k < P.i; k++) s[k] = 'visited';
          for (let k = P.i; k < (P.j == null ? hi : P.j); k++) s[k] = 'frontier';
          if (!P.placed) s[hi] = 'pivot';
        }
        if (P.i != null && P.i >= 0 && P.i < n) ptrs.push({ i: P.i, label: 'i' });
        if (P.j != null && P.j >= 0 && P.j < n) ptrs.push({ i: P.j, label: 'j', s: 'compare' });
      }
      Object.assign(s, extra || {});
      return bars(a, s, ptrs, { ranges: lo != null && lo <= hi ? [{ l: lo, r: hi }] : [] });
    };

    function partitionLomuto(lo, hi) {
      stack.push(`partition(lo=${lo}, hi=${hi})`);
      const pivot = a[hi].v;
      const P = { i: lo, j: null };
      t.step('pivot', `Pivot = last item, nums[${hi}] = ${pivot}.`, { view: view(lo, hi, { i: null, j: null }), vars: { lo, hi, pivot }, aux: aux() });
      t.step('pinit', `\`i = ${lo}\`: the next slot for an item smaller than ${pivot}.`, { view: view(lo, hi, P), vars: { lo, hi, pivot, i: P.i }, aux: aux() });
      for (let j = lo; j < hi; j++) {
        P.j = j;
        const lt = a[j].v < pivot;
        t.step('pcmp', `Is nums[${j}] = ${a[j].v} < ${pivot}? ${lt ? 'Yes: it belongs on the left.' : 'No: leave it on the right side.'}`, { view: view(lo, hi, P, { [j]: 'compare' }), vars: { lo, hi, pivot, i: P.i, j }, aux: aux() });
        if (lt) {
          const i = P.i;
          [a[i], a[j]] = [a[j], a[i]];
          P.i++;
          P.j = j + 1;
          t.step(['pswap', 'pinc'], i === j ? `i == j == ${i}: swapping with itself. \`i = ${P.i}\`.` : `Swap nums[${i}] and nums[${j}]: ${a[i].v} joins the small side. \`i = ${P.i}\`.`, { view: view(lo, hi, P, i === j ? {} : { [i]: 'swap', [j]: 'swap' }), vars: { lo, hi, pivot, i: P.i, j }, aux: aux() });
        }
      }
      P.j = hi;
      const i = P.i;
      [a[i], a[hi]] = [a[hi], a[i]];
      P.placed = true;
      t.step('pfinal', i === hi ? `Nothing was bigger than ${pivot}, so it stays at index ${hi}.` : `Swap the pivot into index ${i}: everything left is < ${pivot}, everything right is >= ${pivot}.`, { view: view(lo, hi, P, { [i]: 'pivot' }), vars: { lo, hi, pivot, i }, aux: aux() });
      fin.add(i);
      t.step('pret', `Return ${i}. The pivot ${pivot} is now in its final place.`, { view: view(lo, hi, null), vars: { lo, hi, pivot, return: i }, aux: aux() });
      stack.pop();
      return i;
    }

    function partitionHoare(lo, hi) {
      stack.push(`partition(lo=${lo}, hi=${hi})`);
      const m = (lo + hi) >> 1;
      const pivot = a[m].v;
      const P = { i: lo - 1, j: hi + 1, pid: a[m].id };
      t.step('pivot', `Pivot = middle value, nums[${m}] = ${pivot}.`, { view: view(lo, hi, { i: null, j: null, pid: P.pid }), vars: { lo, hi, pivot }, aux: aux() });
      t.step('pinit', `\`i = ${lo - 1}\`, \`j = ${hi + 1}\`: both start just outside the range and step in before each check.`, { view: view(lo, hi, P), vars: { lo, hi, pivot, i: P.i, j: P.j }, aux: aux() });
      while (true) {
        const i0 = P.i + 1;
        P.i = i0;
        while (a[P.i].v < pivot) P.i++;
        t.step(['incI', 'scanL'], P.i === i0 ? `\`i = ${P.i}\`: nums[${P.i}] = ${a[P.i].v} is not < ${pivot}, so i stops right away.` : `Move i right past items < ${pivot}. It stops at \`i = ${P.i}\` (value ${a[P.i].v}).`, { view: view(lo, hi, P, { [P.i]: 'compare' }), vars: { lo, hi, pivot, i: P.i, j: P.j }, aux: aux() });
        const j0 = P.j - 1;
        P.j = j0;
        while (a[P.j].v > pivot) P.j--;
        t.step(['decJ', 'scanR'], P.j === j0 ? `\`j = ${P.j}\`: nums[${P.j}] = ${a[P.j].v} is not > ${pivot}, so j stops right away.` : `Move j left past items > ${pivot}. It stops at \`j = ${P.j}\` (value ${a[P.j].v}).`, { view: view(lo, hi, P, { [P.i]: 'compare', [P.j]: 'compare' }), vars: { lo, hi, pivot, i: P.i, j: P.j }, aux: aux() });
        const crossed = P.i >= P.j;
        t.step('cross', crossed ? `\`i = ${P.i} >= j = ${P.j}\`: the pointers met. Split after index ${P.j}.` : `\`i = ${P.i} < j = ${P.j}\`: both found an item on the wrong side.`, { view: view(lo, hi, P, crossed ? {} : { [P.i]: 'compare', [P.j]: 'compare' }), vars: { lo, hi, pivot, i: P.i, j: P.j }, aux: aux() });
        if (crossed) {
          const s = {};
          for (let k = lo; k <= hi; k++) s[k] = k <= P.j ? 'visited' : 'frontier';
          t.step('pret', `Return ${P.j}. nums[${lo}..${P.j}] are all <= ${pivot}, nums[${P.j + 1}..${hi}] are all >= ${pivot}.`, { view: view(lo, hi, null, s), vars: { lo, hi, pivot, return: P.j }, aux: aux() });
          stack.pop();
          return P.j;
        }
        const x = a[P.i].v, y = a[P.j].v;
        [a[P.i], a[P.j]] = [a[P.j], a[P.i]];
        t.step('pswap', `Swap them: ${y} goes left, ${x} goes right.`, { view: view(lo, hi, P, { [P.i]: 'swap', [P.j]: 'swap' }), vars: { lo, hi, pivot, i: P.i, j: P.j }, aux: aux() });
      }
    }

    function qs(lo, hi, first) {
      stack.push(`quick_sort(lo=${lo}, hi=${hi})`);
      if (first) t.step('init', `First call: \`hi\` is None, so \`hi = ${hi}\`. Sort nums[0..${hi}].`, { view: view(lo, hi, null), vars: { nums: vals(a), lo, hi }, aux: aux() });
      if (lo >= hi) {
        if (lo === hi) fin.add(lo);
        t.step('base', lo === hi ? `\`lo == hi == ${lo}\`: one item, already in place.` : `\`lo = ${lo} > hi = ${hi}\`: empty range, nothing to do.`, { view: view(lo, hi, null), vars: { lo, hi }, aux: aux() });
        stack.pop();
        return;
      }
      t.step('base', `\`lo = ${lo} < hi = ${hi}\`: ${hi - lo + 1} items, so partition them.`, { view: view(lo, hi, null), vars: { nums: vals(a), lo, hi }, aux: aux() });
      const p = hoare ? partitionHoare(lo, hi) : partitionLomuto(lo, hi);
      t.step('part', hoare ? `\`p = ${p}\`. Left part nums[${lo}..${p}], right part nums[${p + 1}..${hi}].` : `\`p = ${p}\`. Sort each side of the pivot.`, { view: view(lo, hi, null), vars: { nums: vals(a), lo, hi, p }, aux: aux() });
      const L = hoare ? [lo, p] : [lo, p - 1];
      t.step('left', `Recurse on the left: \`quick_sort(nums, ${L[0]}, ${L[1]})\`.`, { view: view(L[0], L[1], null), vars: { nums: vals(a), lo, hi, p }, aux: aux() });
      qs(L[0], L[1]);
      t.step('right', `Left side done. Recurse on the right: \`quick_sort(nums, ${p + 1}, ${hi})\`.`, { view: view(p + 1, hi, null), vars: { nums: vals(a), lo, hi, p }, aux: aux() });
      qs(p + 1, hi);
      stack.pop();
    }
    qs(0, n - 1, true);
    U.range(n).forEach((k) => fin.add(k));
    t.step('done', `The top call returns. Every item is in its final place: ${py(vals(a))}.`, { view: bars(a, allSorted(n)), vars: { nums: vals(a), return: vals(a) }, aux: aux() });
    return t.frames;
  }

  DSA.addAlgo({
    id: 'quick-sort',
    title: 'Quick Sort',
    category: 'Sorting',
    order: 5,
    tags: ['partition', 'pivot', 'divide and conquer', 'lomuto', 'hoare', 'quickselect', 'in place'],
    summary: 'Pick a pivot, partition so smaller items go left and bigger go right, then sort each side recursively. In place and fast in practice; O(n²) only with consistently bad pivots.',
    complexity: { time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)' }, space: 'O(log n)', stable: false, inPlace: true, note: 'Space is the recursion depth: O(log n) on average, O(n) worst case.' },
    notes: [
      'All the work is in `partition`. The recursion just calls it on each side.',
      'Worst case O(n²): already sorted input with first/last pivot, or many duplicates with Lomuto.',
      'Fix bad pivots with `random.randint(lo, hi)` (swap it to the pivot slot first) or median-of-three.',
      'Quickselect (k-th smallest) partitions but recurses into **one** side only: O(n) average.',
    ],
    tips: [
      'Not stable. If the interviewer needs stability, say merge sort (or Python\'s `sorted`).',
      'Recurse on the smaller side and loop on the bigger one to cap the stack at O(log n).',
      'Many duplicates? Use 3-way partition (Dutch national flag): `< pivot | == pivot | > pivot`.',
    ],
    problems: ['912. Sort an Array', '215. Kth Largest Element in an Array', '75. Sort Colors', '973. K Closest Points to Origin', '324. Wiggle Sort II'],
    input: sortInput([35, 12, 48, 7, 26, 41, 19, 30]),
    variants: [
      {
        id: 'lomuto',
        label: 'Lomuto partition',
        summary: 'Lomuto: the **last** item is the pivot. One index `i` marks where the small side ends; scan `j` across and swap every small item into place. Finally swap the pivot to `i`. Simple to write from memory.',
        legend: { visited: '< pivot', frontier: '≥ pivot' },
        notes: [
          'After partition the pivot is in its **final** position, so recurse on `[lo, p-1]` and `[p+1, hi]`.',
          'Invariant: `nums[lo:i] < pivot`, `nums[i:j] >= pivot`, `nums[j:hi]` not seen yet.',
          'All-equal input makes every split 0 / n-1: O(n²). Hoare or 3-way partition avoid that.',
          'Quickselect reuses this exact `partition`.',
        ],
        code: QS_DRIVER('pivot lands at p', 'lo, p - 1)      # left of pivot', 'p + 1, hi)      # right of pivot') + `
def partition(nums, lo, hi):
    pivot = nums[hi]                     # last item  #@pivot
    i = lo                               # next small slot  #@pinit
    for j in range(lo, hi):
        if nums[j] < pivot:              # belongs on the left  #@pcmp
            nums[i], nums[j] = nums[j], nums[i]  #@pswap
            i += 1                       #@pinc
    # pivot goes between the two sides
    nums[i], nums[hi] = nums[hi], nums[i]  #@pfinal
    return i                             # pivot's final index  #@pret
`,
        trace: (inp) => qsTrace(inp, false),
      },
      {
        id: 'hoare',
        label: 'Hoare partition',
        summary: 'Hoare: pivot is the **middle** value. `i` walks right, `j` walks left, and each pair of wrong-side items is swapped until they cross. Fewer swaps than Lomuto and handles duplicates well.',
        legend: { visited: '≤ pivot', frontier: '≥ pivot' },
        notes: [
          'Returns a split index `j`, **not** the pivot\'s position. Recurse on `[lo, p]` and `[p+1, hi]`.',
          'Using `[lo, p-1]` here is a classic bug: it can skip items.',
          'Items equal to the pivot stop both pointers, so duplicates spread evenly over both sides.',
          'About 3x fewer swaps than Lomuto on average.',
        ],
        code: QS_DRIVER('split point', 'lo, p)          # p stays on the left', 'p + 1, hi)      # the right part') + `
def partition(nums, lo, hi):
    pivot = nums[(lo + hi) // 2]         # middle value  #@pivot
    i, j = lo - 1, hi + 1                # start outside  #@pinit
    while True:
        i += 1                           #@incI
        while nums[i] < pivot:           # skip smalls  #@scanL
            i += 1
        j -= 1                           #@decJ
        while nums[j] > pivot:           # skip bigs  #@scanR
            j -= 1
        if i >= j:                       # crossed: split at j  #@cross
            return j                     #@pret
        nums[i], nums[j] = nums[j], nums[i]  #@pswap
`,
        trace: (inp) => qsTrace(inp, true),
      },
    ],
  });

  /* ================= Heap sort ================= */
  DSA.addAlgo({
    id: 'heap-sort',
    title: 'Heap Sort',
    category: 'Sorting',
    order: 6,
    tags: ['heap', 'heapify', 'sift down', 'priority queue', 'in place', 'n log n'],
    summary: 'Turn the list into a max-heap in place, then repeatedly swap the root (the max) to the end and sift the new root down. O(n log n) worst case with O(1) extra space.',
    complexity: { time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' }, space: 'O(1)', stable: false, inPlace: true, note: 'Building the heap bottom-up is O(n); the n extractions cost O(log n) each.' },
    notes: [
      'Array as a tree: children of `i` are `2i + 1` and `2i + 2`, parent is `(i - 1) // 2`.',
      'Build: sift down every parent from `n // 2 - 1` back to 0. That is O(n), not O(n log n).',
      'Each extract moves the max to `end`, which is then final. The heap shrinks by one.',
      'Not stable, and jumps around memory, so it is usually slower than quick sort in practice.',
    ],
    tips: [
      'In Python you rarely write this: `heapq` gives a **min**-heap (`heapify`, `heappush`, `heappop`).',
      '`heapq.nlargest(k, nums)` / `nsmallest` for top-k. For a max-heap push negated values.',
    ],
    problems: ['912. Sort an Array', '215. Kth Largest Element in an Array', '347. Top K Frequent Elements', '1046. Last Stone Weight', '23. Merge k Sorted Lists'],
    input: sortInput([4, 10, 3, 5, 1, 8, 6, 2]),
    legend: { active: 'Sinking node (i)', max: 'Biggest of the three' },
    code: `
def heap_sort(nums):
    n = len(nums)
    # 1) build a max-heap: sift down each parent, last first
    for i in range(n // 2 - 1, -1, -1):
        sift_down(nums, i, n)                    #@build
    # 2) swap the max to the end, shrink the heap, repair
    for end in range(n - 1, 0, -1):
        nums[0], nums[end] = nums[end], nums[0]  #@swapEnd
        sift_down(nums, 0, end)                  #@fix
    return nums                                  #@done

def sift_down(nums, i, size):
    while True:
        big, l, r = i, 2 * i + 1, 2 * i + 2      # kids  #@sinit
        if l < size and nums[l] > nums[big]:     #@lcmp
            big = l
        if r < size and nums[r] > nums[big]:     #@rcmp
            big = r
        if big == i:                             # heap ok  #@sstop
            return
        nums[i], nums[big] = nums[big], nums[i]  #@sswap
        i = big                                  # go down  #@snext
`,
    trace(inp) {
      const a = U.withIds(prep(inp));
      const n = a.length;
      if (!n) return emptyFrames('build', 'done');
      const t = DSA.tracer();
      const buildTree = (size) => {
        const mk = (k) => (k < size ? { id: a[k].id, v: a[k].v, left: mk(2 * k + 1), right: mk(2 * k + 2) } : null);
        return mk(0);
      };
      // ist: {index: state}; ptr: {index: label}
      const views = (size, ist, ptr, phase) => {
        ist = ist || {};
        const tStates = {}, badges = {}, tPtr = {};
        for (let k = 0; k < size; k++) {
          badges[a[k].id] = k;
          if (ist[k]) tStates[a[k].id] = ist[k];
        }
        Object.keys(ptr || {}).forEach((k) => { if (k < size) tPtr[a[k].id] = ptr[k]; });
        const s = {};
        for (let k = size; k < n; k++) s[k] = 'sorted';
        Object.assign(s, ist);
        const p = Object.keys(ptr || {}).map((k) => ({ i: +k, label: ptr[k] }));
        return [
          { type: 'tree', title: phase || `max-heap: nums[0:${size}]`, root: buildTree(size), states: tStates, badges, pointers: tPtr },
          bars(a, s, p, { ranges: size < n && size > 0 ? [{ l: 0, r: size - 1, label: 'heap' }] : [] }),
        ];
      };
      function sift(i, size, vv) {
        while (true) {
          const l = 2 * i + 1, r = 2 * i + 2;
          let big = i;
          if (l < size && a[l].v > a[big].v) big = l;
          if (r < size && a[r].v > a[big].v) big = r;
          const kids = [l, r].filter((k) => k < size);
          const st = { [i]: 'active' };
          kids.forEach((k) => (st[k] = 'compare'));
          if (big !== i) st[big] = 'max';
          const kidTxt = kids.map((k) => `${a[k].v}`).join(' and ');
          const v = Object.assign({}, vv, { i, size, big, l, r });
          t.step(['sinit', 'lcmp', 'rcmp'], kids.length ? `Node ${a[i].v} (index ${i}) vs its child${kids.length > 1 ? 'ren' : ''} ${kidTxt}: the biggest is ${a[big].v}${big === i ? ' (the parent)' : ` at index ${big}`}.` : `Node ${a[i].v} (index ${i}) has no children inside the heap (size ${size}).`, { views: views(size, st, { [i]: 'i' }), vars: v });
          if (big === i) {
            t.step('sstop', `\`big == i\`: ${a[i].v} is at least as big as its children. Heap rule holds; stop.`, { views: views(size, { [i]: 'found' }, { [i]: 'i' }), vars: v });
            return;
          }
          const x = a[i].v, y = a[big].v;
          [a[i], a[big]] = [a[big], a[i]];
          t.step(['sswap', 'snext'], `Swap ${x} down with ${y}. Continue sifting from index ${big}.`, { views: views(size, { [i]: 'swap', [big]: 'swap' }, { [big]: 'i' }), vars: Object.assign({}, v, { i: big }) });
          i = big;
        }
      }
      if (n === 1) t.step('build', '`range(-1, -1, -1)` is empty: a single item is already a heap.', { views: views(1, {}), vars: { nums: vals(a), n } });
      for (let i = (n >> 1) - 1; i >= 0; i--) {
        t.step('build', `Build phase: \`sift_down(nums, ${i}, ${n})\` on parent ${a[i].v} at index ${i}.`, { views: views(n, { [i]: 'active' }, { [i]: 'i' }, 'building the max-heap'), vars: { nums: vals(a), n, i } });
        sift(i, n, { nums: vals(a) });
      }
      if (n > 1) t.step('build', `Max-heap built: every parent >= its children, so the max ${a[0].v} is at the root.`, { views: views(n, { 0: 'max' }), vars: { nums: vals(a), n } });
      for (let end = n - 1; end > 0; end--) {
        const mx = a[0].v;
        [a[0], a[end]] = [a[end], a[0]];
        t.step('swapEnd', `Swap the max ${mx} to index ${end}. It is final; the heap is now nums[0:${end}].`, { views: views(end, { 0: 'swap', [end]: 'swap' }), vars: { nums: vals(a), end } });
        t.step('fix', `The new root ${a[0].v} may break the heap rule. \`sift_down(nums, 0, ${end})\`.`, { views: views(end, { 0: 'active' }, { 0: 'i' }), vars: { nums: vals(a), end } });
        sift(0, end, { nums: vals(a), end });
      }
      const all = {};
      U.range(n).forEach((k) => (all[k] = 'sorted'));
      const vFinal = views(n, all);
      vFinal[0].title = 'sorted list as a tree';
      vFinal[1].ranges = [];
      t.step('done', `The heap is down to one item, the minimum, already at index 0. Return ${py(vals(a))}.`, { views: vFinal, vars: { nums: vals(a), return: vals(a) } });
      return t.frames;
    },
  });

  /* ================= Counting sort ================= */
  DSA.addAlgo({
    id: 'counting-sort',
    title: 'Counting Sort',
    category: 'Sorting',
    order: 7,
    tags: ['non-comparison', 'count', 'prefix sum', 'integer sort', 'linear'],
    summary: 'For small integer ranges: count how many times each value appears, turn counts into end positions with a prefix sum, then place each item directly. No comparisons at all.',
    complexity: { time: 'O(n + k)', space: 'O(n + k)', stable: true, inPlace: false, note: '`k` is the value range, `max - min + 1`. Great when k is small; wasteful when k ≫ n.' },
    notes: [
      'Beats the O(n log n) comparison bound because it never compares items.',
      'Subtract `lo = min(nums)` so negative numbers and offset ranges work.',
      'Prefix sums: after them, `count[v]` = how many items are `<= v`, i.e. one past the last slot for v.',
      'Walking `nums` **backwards** in the placing loop keeps equal items in order (stable). Radix sort relies on that.',
    ],
    tips: [
      'Quick version when you only have plain ints: `for v, c in enumerate(count): out += [v + lo] * c`.',
      '`collections.Counter(nums)` is the dict version when the range is big but values repeat.',
      'Bucket-by-count problems (top-k frequent) use the same idea with a list of lists.',
    ],
    problems: ['75. Sort Colors', '1122. Relative Sort Array', '274. H-Index', '347. Top K Frequent Elements', '1051. Height Checker'],
    input: {
      default: { nums: [4, 2, 2, 8, 3, 3, 1, 5] },
      random: () => ({ nums: U.randArray(U.randInt(6, 9), 0, 9, false) }),
      fields: [{ key: 'nums', label: 'nums (ints 0–20)', type: 'array', max: 10 }],
    },
    legend: { visited: 'Placed', read: 'Current x' },
    code: `
def counting_sort(nums):
    lo, hi = min(nums), max(nums)        # value range  #@range
    count = [0] * (hi - lo + 1)          # one slot per value  #@alloc
    for x in nums:
        count[x - lo] += 1               # tally  #@tally
    # prefix sums: count[v] = how many items are <= v
    for v in range(1, len(count)):
        count[v] += count[v - 1]         #@prefix
    out = [0] * len(nums)                #@oalloc
    # walk backwards so equal items keep order (stable)
    for x in reversed(nums):
        count[x - lo] -= 1               # x's last slot  #@dec
        out[count[x - lo]] = x           #@place
    return out                           #@done
`,
    trace(inp) {
      const nums = prep(inp).map((x) => Math.max(0, Math.min(20, Math.round(x))));
      const n = nums.length;
      if (!n) return emptyFrames('range', 'done');
      const t = DSA.tracer();
      const lo = Math.min(...nums), hi = Math.max(...nums);
      const k = hi - lo + 1;
      const count = U.range(k).map(() => 0);
      let out = null;
      const V = (o) => {
        o = o || {};
        const rows = [
          { label: 'nums', items: nums, states: o.ns || {}, pointers: o.np != null ? [{ i: o.np, label: 'x' }] : [] },
          { label: 'count', items: count.map((c, i) => ({ v: c, sub: `v=${i + lo}` })), states: o.cs || {} },
        ];
        if (out) rows.push({ label: 'out', items: out.map((x) => (x === null ? null : x)), states: o.os || {}, pointers: o.op != null ? [{ i: o.op, label: 'slot', s: 'found' }] : [] });
        return { type: 'array', rows };
      };
      const ov = () => (out ? out.map((x) => (x === null ? 0 : x)) : undefined);
      t.step('range', `Smallest value ${lo}, largest ${hi}. So there are ${k} possible values.`, { view: V(), vars: { lo, hi } });
      t.step('alloc', `\`count = [0] * ${k}\`. Slot \`x - lo\` counts value x (the small label under each slot).`, { view: V(), vars: { lo, hi, count: count.slice() } });
      nums.forEach((x, i) => {
        count[x - lo]++;
        t.step('tally', `x = ${x}: \`count[${x - lo}]\` becomes ${count[x - lo]}.`, { view: V({ np: i, ns: { [i]: 'read' }, cs: { [x - lo]: 'active' } }), vars: { lo, hi, x, count: count.slice() } });
      });
      for (let v = 1; v < k; v++) {
        const before = count[v];
        count[v] += count[v - 1];
        t.step('prefix', `\`count[${v}] += count[${v - 1}]\`: ${before} + ${count[v - 1]} = ${count[v]}. That many items are <= ${v + lo}.`, { view: V({ cs: { [v - 1]: 'read', [v]: 'active' } }), vars: { lo, hi, v, count: count.slice() } });
      }
      if (k === 1) t.step('prefix', `Only one possible value, so there are no prefix sums to add.`, { view: V(), vars: { lo, hi, count: count.slice() } });
      out = nums.map(() => null);
      t.step('oalloc', `\`out = [0] * ${n}\`. Each count now marks one past the last slot for its value.`, { view: V(), vars: { lo, hi, count: count.slice(), out: ov() } });
      const filled = {};
      for (let i = n - 1; i >= 0; i--) {
        const x = nums[i];
        count[x - lo]--;
        const pos = count[x - lo];
        out[pos] = x;
        filled[pos] = 'visited';
        t.step(['dec', 'place'], `x = ${x} (index ${i}): \`count[${x - lo}]\` drops to ${pos}, so \`out[${pos}] = ${x}\`.`, { view: V({ np: i, ns: { [i]: 'read' }, cs: { [x - lo]: 'active' }, os: Object.assign({}, filled, { [pos]: 'new' }), op: pos }), vars: { lo, hi, x, count: count.slice(), out: ov() } });
      }
      const allS = {};
      out.forEach((_, i) => (allS[i] = 'sorted'));
      t.step('done', `Every item is placed. Return ${py(out)}.`, { view: V({ os: allS }), vars: { lo, hi, return: out.slice() } });
      return t.frames;
    },
  });

  /* ================= Radix sort ================= */
  DSA.addAlgo({
    id: 'radix-sort',
    title: 'Radix Sort',
    category: 'Sorting',
    order: 8,
    tags: ['lsd', 'digits', 'buckets', 'non-comparison', 'integer sort', 'linear'],
    summary: 'Sort non-negative integers one digit at a time, least significant first. Each pass drops numbers into 10 buckets by the current digit, then reads the buckets back in order. The passes must be stable.',
    complexity: { time: 'O(d · (n + b))', space: 'O(n + b)', stable: true, inPlace: false, note: '`d` = number of digits in the max, `b` = base (10 here). Linear in n when d is small.' },
    notes: [
      'LSD (least significant digit first) works because each pass is stable: ties on this digit keep the order from earlier digits.',
      'Digit of `x` at place `exp`: `(x // exp) % 10`.',
      'Negatives: sort them separately (on `-x`), reverse, and put them in front.',
      'Beats comparison sorts only when d is small relative to log n.',
    ],
    tips: [
      'Strings of equal length sort the same way, one character at a time from the right.',
      'Mention it for "sort n integers in O(n)" or "maximum gap" style questions.',
    ],
    problems: ['164. Maximum Gap', '912. Sort an Array', '2343. Query Kth Smallest Trimmed Number'],
    input: {
      default: { nums: [170, 45, 75, 90, 802, 24, 2, 66] },
      random: () => ({ nums: U.randArray(U.randInt(6, 8), 1, 999, true) }),
      fields: [{ key: 'nums', label: 'nums (0–999)', type: 'array', max: 10 }],
    },
    code: `
def radix_sort(nums):
    exp = 1                                  # 1s, 10s, ...  #@init
    while max(nums) // exp > 0:              # digits left?  #@loop
        buckets = [[] for _ in range(10)]    # one per digit  #@buckets
        for x in nums:
            d = (x // exp) % 10              # current digit  #@digit
            buckets[d].append(x)             # keeps order  #@drop
        # read buckets 0..9 back in order
        nums = [x for b in buckets for x in b]  #@collect
        exp *= 10                            #@next
    return nums                              #@done
`,
    trace(inp) {
      let a = U.withIds(prep(inp).map((x) => Math.max(0, Math.min(999, Math.round(Math.abs(x))))));
      const n = a.length;
      if (!n) return emptyFrames('init', 'done');
      const t = DSA.tracer();
      const mx = Math.max(...vals(a));
      // grid rows = biggest bucket in this pass (fixed within a pass)
      const depthFor = (e) => {
        const c = U.range(10).map(() => 0);
        a.forEach((o) => c[Math.floor(o.v / e) % 10]++);
        return Math.max(1, ...c);
      };
      let depth = 1;
      let buckets = null;
      const place = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands' };
      const V = (exp, o) => {
        o = o || {};
        const items = a.map((it, i) => ({ v: it.v, id: it.id, sub: exp && Math.floor(mx / exp) > 0 ? `d=${Math.floor(it.v / exp) % 10}` : null }));
        // (no pointer: it would overlap the digit label under the cell)
        const arr = { type: 'array', title: exp && place[exp] ? `nums · ${place[exp]} digit below` : 'nums', items, states: o.ns || {} };
        const cells = U.range(depth).map((r) => U.range(10).map((d) => (buckets && buckets[d][r] != null ? buckets[d][r].v : '')));
        const gs = {};
        if (o.col != null) gs['c' + o.col] = 'active';
        if (o.cell) gs[o.cell] = 'new';
        if (o.gAll) U.range(10).forEach((d) => (buckets[d] || []).forEach((_, r) => (gs[r + ',' + d] = o.gAll)));
        const grid = { type: 'grid', title: 'buckets[0] … buckets[9]', cells, colLabels: U.range(10), states: gs };
        return [arr, grid];
      };
      let exp = 1;
      t.step('init', `\`exp = 1\`: start with the ones digit. Largest value is ${mx}, so ${String(mx).length} pass${String(mx).length > 1 ? 'es' : ''}.`, { views: V(exp), vars: { nums: vals(a), exp } });
      while (true) {
        const more = Math.floor(mx / exp) > 0;
        t.step('loop', more ? `\`${mx} // ${exp} = ${Math.floor(mx / exp)} > 0\`: the ${place[exp]} digit still matters.` : `\`${mx} // ${exp} = 0\`: no digits left. Stop.`, { views: V(more ? exp : null), vars: { nums: vals(a), exp } });
        if (!more) break;
        buckets = U.range(10).map(() => []);
        depth = depthFor(exp);
        t.step('buckets', `Make 10 empty buckets, one per digit 0–9.`, { views: V(exp), vars: { nums: vals(a), exp } });
        a.forEach((o, i) => {
          const d = Math.floor(o.v / exp) % 10;
          buckets[d].push(o);
          t.step(['digit', 'drop'], `x = ${o.v}: ${place[exp]} digit is \`(${o.v} // ${exp}) % 10 = ${d}\`. Append to bucket ${d}.`, { views: V(exp, { np: i, ns: { [i]: 'read' }, col: d, cell: `${buckets[d].length - 1},${d}` }), vars: { nums: vals(a), exp, x: o.v, d } });
        });
        a = [].concat(...buckets);
        t.step('collect', `Read the buckets from 0 to 9: ${py(vals(a))}. Now sorted by the last ${String(exp).length} digit${exp > 1 ? 's' : ''}.`, { views: V(exp, { gAll: 'visited' }), vars: { nums: vals(a), exp } });
        exp *= 10;
        buckets = null;
        t.step('next', `\`exp = ${exp}\`: move to the next digit.`, { views: V(Math.floor(mx / exp) > 0 ? exp : null), vars: { nums: vals(a), exp } });
      }
      t.step('done', `Return ${py(vals(a))}.`, { views: V(null, { ns: vals(a).map(() => 'sorted') }), vars: { return: vals(a) } });
      return t.frames;
    },
  });

  /* ================= Python's sort() ================= */
  const NAMES = ['cat', 'bob', 'ann', 'dan', 'fay', 'eve', 'hal', 'gus'];
  DSA.addAlgo({
    id: 'python-sort',
    title: "Python's sort()",
    category: 'Sorting',
    order: 99,
    file: 'python_sort',
    tags: ['sorted', 'list.sort', 'key', 'lambda', 'reverse', 'timsort', 'stable', 'cmp_to_key', 'itemgetter', 'multi-key'],
    summary: 'In real code and most interviews, just call `sorted(xs)` or `xs.sort()`. Both are **Timsort**: O(n log n), stable, and very fast on partly sorted data. Control the order with `key=` and `reverse=`.',
    complexity: { time: { best: 'O(n)', avg: 'O(n log n)', worst: 'O(n log n)' }, space: 'O(n)', stable: true, inPlace: true, note: '`list.sort()` sorts in place (returns None). `sorted()` builds a new list and takes any iterable.' },
    notes: [
      '`key=f` calls `f` once per item and sorts by the results. Tuples compare item by item, so `key=lambda p: (a, b)` sorts by a, then b.',
      'Descending on a number inside a tuple key: negate it, `(-age, name)`. For strings use two stable sorts instead.',
      '`reverse=True` keeps equal items in their original order (it does not just flip the result).',
      'Stable means you can sort by the secondary key first, then by the primary key.',
      '`cmp_to_key` turns an old `cmp(a, b)` function (negative / 0 / positive) into a key.',
    ],
    tips: [
      '`xs.sort()` returns **None**. `xs = xs.sort()` is a classic bug.',
      '`operator.itemgetter(1)` and `attrgetter("age")` are faster, cleaner keys than lambdas.',
      'Custom comparisons like "Largest Number" (179) need `cmp_to_key`.',
    ],
    problems: ['179. Largest Number', '56. Merge Intervals', '252. Meeting Rooms', '1636. Sort Array by Increasing Frequency', '937. Reorder Data in Log Files', '406. Queue Reconstruction by Height'],
    input: {
      default: { ages: [25, 31, 25, 19, 31, 25] },
      random: () => ({ ages: U.range(U.randInt(5, 7)).map(() => [19, 25, 31, 40][U.randInt(0, 3)]) }),
      fields: [{ key: 'ages', label: 'ages (names are fixed)', type: 'array', max: 8 }],
    },
    legend: { compare: 'Same age', visited: 'Same age', pivot: 'Same age', new: 'Same age' },
    code: `
from functools import cmp_to_key

people = [("cat", 25), ("bob", 31), ("ann", 25),
          ("dan", 19), ("fay", 31), ("eve", 25)]  #@data

# sorted() returns a NEW list; key is called once per item
by_age = sorted(people, key=lambda p: p[1])  #@sorted
# stable: equal ages keep their original order

# .sort() works in place and returns None
people.sort(key=lambda p: p[1], reverse=True)  #@reverse

# multi-key: age descending, then name ascending
people.sort(key=lambda p: (-p[1], p[0]))  #@multi

# old-style comparator: <0 means a first, >0 means b first
def cmp(a, b):
    return a[1] - b[1]                   # by age ascending  #@cmp
people.sort(key=cmp_to_key(cmp))  #@cmpsort
`,
    trace(inp) {
      const ages = (inp.ages || []).map((x) => Math.round(Number(x))).filter((x) => isFinite(x)).slice(0, NAMES.length);
      if (!ages.length) ages.push(25);
      const t = DSA.tracer();
      const P = ages.map((age, i) => ({ v: `${NAMES[i]} ${age}`, id: 'p' + i, name: NAMES[i], age }));
      const lbl = (arr, key) => arr.map((o) => ({ v: o.v, id: o.id, sub: key ? key(o) : null }));
      const tupRepr = (arr) => ({ raw: '[' + arr.map((o) => `('${o.name}', ${o.age})`).join(', ') + ']' });
      // colour groups of equal age so ties are easy to follow
      const tieStates = (arr) => {
        const cnt = {};
        arr.forEach((o) => (cnt[o.age] = (cnt[o.age] || 0) + 1));
        const tied = Object.keys(cnt).filter((k) => cnt[k] > 1).map(Number).sort((x, y) => x - y);
        const pal = ['compare', 'visited', 'pivot', 'new'];
        return arr.map((o) => (cnt[o.age] > 1 ? pal[tied.indexOf(o.age) % pal.length] : null));
      };
      const stableSort = (arr, cmp) => arr.map((o, i) => [o, i]).sort((x, y) => cmp(x[0], y[0]) || x[1] - y[1]).map((x) => x[0]);
      const tieNames = (arr) => {
        const g = {};
        arr.forEach((o) => (g[o.age] = g[o.age] || []).push(o.name));
        const k = Object.keys(g).filter((a) => g[a].length > 1);
        return k.length ? k.map((a) => `${g[a].join(', ')} (${a})`).join('; ') : null;
      };
      let people = P.slice();
      let byAge = null;
      const V = (o) => {
        o = o || {};
        const rows = [{ label: 'people', items: lbl(people, o.key), states: tieStates(people) }];
        if (byAge) rows.push({ label: 'by_age', items: lbl(byAge), states: tieStates(byAge) });
        return { type: 'array', rows };
      };
      const ties0 = tieNames(people);
      t.step('data', `A list of (name, age) tuples. ${ties0 ? `Same-age groups are coloured alike: ${ties0}.` : 'No two people share an age here, so stability has nothing to show.'}`, { view: V(), vars: { people: tupRepr(people) } });
      t.step('sorted', `\`key=lambda p: p[1]\` is called once per person. The keys (shown under each) are the ages: ${people.map((o) => o.age).join(', ')}.`, { view: V({ key: (o) => `key ${o.age}` }), vars: { people: tupRepr(people) } });
      byAge = stableSort(people, (x, y) => x.age - y.age);
      t.step('sorted', `Sort by age into a new list. Ties keep their original order: ${tieNames(byAge) || 'no ties'}. \`people\` is unchanged.`, { view: V(), vars: { people: tupRepr(people), by_age: tupRepr(byAge) } });
      people = stableSort(people, (x, y) => y.age - x.age);
      t.step('reverse', `In place, oldest first. With \`reverse=True\` ties are **still** in original order (${tieNames(people) || 'no ties'}), not flipped.`, { view: V(), vars: { people: tupRepr(people), by_age: tupRepr(byAge) } });
      t.step('multi', `The key is now a tuple \`(-age, name)\`, shown under each. Tuples compare the first item, then the second on a tie.`, { view: V({ key: (o) => `${-o.age},${o.name}` }), vars: { people: tupRepr(people), by_age: tupRepr(byAge) } });
      people = stableSort(people, (x, y) => y.age - x.age || (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
      t.step('multi', `Sorted by \`(-age, name)\`: age descending, then name A→Z inside each age. Now ties are ordered by name: ${tieNames(people) || 'no ties'}.`, { view: V(), vars: { people: tupRepr(people), by_age: tupRepr(byAge) } });
      t.step('cmp', '`cmp(a, b)` returns a negative number when a should come first, 0 for a tie, positive when b should come first.', { view: V(), vars: { people: tupRepr(people), by_age: tupRepr(byAge) } });
      people = stableSort(people, (x, y) => x.age - y.age);
      t.step('cmpsort', `\`cmp_to_key(cmp)\` wraps it as a key: same result as \`key=lambda p: p[1]\`. Youngest first; ties keep the current (name) order: ${tieNames(people) || 'no ties'}.`, { view: V(), vars: { people: tupRepr(people), by_age: tupRepr(byAge) } });
      return t.frames;
    },
  });
})();
