/* Algorithms · Linked List Patterns */
(function () {
  const U = DSA.util;
  const node = (v) => ({ raw: v == null ? 'None' : `ListNode(${v})` });
  const listRepr = (vals) => (vals.length ? vals.join(' → ') : 'None');
  const listInput = (max) => ({ key: 'nums', label: 'values', type: 'array', max: max || 7, min: 1 });
  const cleanVals = (arr, max, fallback) => {
    const v = (arr || []).slice(0, max);
    return v.length ? v : fallback.slice();
  };
  // pointers helper: {id: label} merged into {id: [labels]}
  function ptrs(list) {
    const out = {};
    list.forEach(([id, label]) => {
      if (id === undefined) return;
      const key = id === null ? 'null' : id;
      out[key] = out[key] ? [].concat(out[key], label) : label;
    });
    return out;
  }
  const LISTNODE = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next
`;

  /* ====================================================================
   * Reverse a linked list
   * ==================================================================== */
  const revInput = {
    default: { nums: [1, 2, 3, 4, 5] },
    random: () => ({ nums: U.randArray(U.randInt(4, 6), 1, 9) }),
    fields: [listInput(7)],
  };

  DSA.addAlgo({
    id: 'reverse-linked-list',
    title: 'Reverse a Linked List',
    category: 'Linked List Patterns',
    order: 1,
    tags: ['reverse', 'prev curr next', 'pointer manipulation', 'in place'],
    summary: 'Flip every `next` arrow so the list runs backwards. The last node becomes the new head.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    notes: [
      'Save `curr.next` **before** you overwrite it, or you lose the rest of the list.',
      'The loop ends when `curr` is None; `prev` is then the new head.',
      'Python tuple assignment does it in one line: `curr.next, prev, curr = prev, curr, curr.next`.',
      'Recursion uses O(n) stack; Python\'s default limit is about 1000 frames.',
    ],
    tips: [
      'Draw three boxes (`prev`, `curr`, `nxt`) and move them one step at a time before coding.',
      'Reverse a sub-range (92) or in groups of k (25) with the same three pointers plus a node before the range.',
    ],
    problems: ['206. Reverse Linked List', '92. Reverse Linked List II', '25. Reverse Nodes in k-Group', '234. Palindrome Linked List', '143. Reorder List'],
    input: revInput,
    variants: [
      {
        id: 'iterative',
        label: 'Iterative',
        summary: 'Walk the list once with three pointers: `prev` (already reversed part), `curr` (node being flipped) and `nxt` (the rest, saved before flipping).',
        complexity: { time: 'O(n)', space: 'O(1)' },
        legend: { visited: 'Reversed part', active: 'curr' },
        code: LISTNODE + `
def reverse_list(head):
    prev, curr = None, head         # nothing reversed yet  #@init
    while curr:                     #@loop
        nxt = curr.next             # save the rest  #@save
        curr.next = prev            # flip the arrow  #@flip
        prev = curr                 # prev steps forward  #@prev
        curr = nxt                  # curr steps forward  #@curr
    return prev                     # new head  #@done
`,
        trace(inp) {
          const vals = cleanVals(inp.nums, 7, [1, 2, 3]);
          const n = vals.length;
          const ids = vals.map((_, i) => 'n' + i);
          const next = vals.map((_, i) => (i + 1 < n ? i + 1 : null));
          const t = DSA.tracer();
          const view = (prev, curr, nxt, o) => {
            o = o || {};
            const nodes = vals.map((v, i) => ({ id: ids[i], v, s: i === curr ? 'active' : prev != null && i <= prev ? 'visited' : null }));
            const links = next.map((j, i) => ({ from: ids[i], to: j == null ? null : ids[j], s: o.hot === i ? 'active' : null }));
            const p = ptrs([[prev == null ? null : ids[prev], 'prev'], [curr == null ? undefined : ids[curr], 'curr'], [nxt == null ? undefined : ids[nxt], 'nxt']]);
            return { type: 'linked', nodes, links, pointers: p, nullLeft: true };
          };
          const vv = (prev, curr, nxt) => {
            const o = { prev: node(prev == null ? null : vals[prev]), curr: node(curr == null ? null : vals[curr]) };
            if (nxt !== undefined) o.nxt = node(nxt == null ? null : vals[nxt]);
            return o;
          };
          let prev = null, curr = 0, nxt;
          t.step('init', `\`prev = None\`, \`curr = head\` (${vals[0]}). Nothing is reversed yet.`, { view: view(prev, curr), vars: vv(prev, curr) });
          while (true) {
            t.step('loop', curr != null ? `\`curr\` is ${vals[curr]}, not None: keep going.` : '`curr` is None: every arrow is flipped.', { view: view(prev, curr, nxt), vars: vv(prev, curr, nxt) });
            if (curr == null) break;
            nxt = next[curr];
            t.step('save', `\`nxt = curr.next\` = ${nxt == null ? 'None' : vals[nxt]}. Save it before the link is overwritten.`, { view: view(prev, curr, nxt), vars: vv(prev, curr, nxt) });
            next[curr] = prev;
            t.step('flip', `\`curr.next = prev\`: ${vals[curr]} now points to ${prev == null ? 'None' : vals[prev]}.`, { view: view(prev, curr, nxt, { hot: curr }), vars: vv(prev, curr, nxt) });
            prev = curr;
            t.step('prev', `\`prev = curr\` (${vals[prev]}). The reversed part now starts at ${vals[prev]}.`, { view: view(prev, curr, nxt), vars: vv(prev, curr, nxt) });
            curr = nxt;
            t.step('curr', curr == null ? '`curr = nxt` = None. We just flipped the last node.' : `\`curr = nxt\` (${vals[curr]}). Move on to the next node.`, { view: view(prev, curr, nxt), vars: vv(prev, curr, nxt) });
          }
          const rev = vals.slice().reverse();
          const result = { type: 'linked', title: 'result', nodes: rev.map((v, i) => ({ id: 'r' + i, v, s: 'found' })), pointers: { r0: 'head' } };
          t.step('done', `Return \`prev\` (${vals[prev]}), the new head: ${listRepr(rev)}.`, { views: [view(prev, null, null), result], vars: Object.assign(vv(prev, null, null), { return: node(vals[prev]) }) });
          return t.frames;
        },
      },
      {
        id: 'recursive',
        label: 'Recursive',
        summary: 'Reverse the rest of the list first, then hook the current node onto its end. The work happens **on the way back** up the call stack.',
        complexity: { time: 'O(n)', space: 'O(n)', note: 'One stack frame per node.' },
        legend: { visited: 'Already reversed', active: 'head (this call)' },
        code: LISTNODE + `
def reverse_list(head):
    if not head or not head.next:   # 0 or 1 node  #@base
        return head                 # it is the new head  #@ret
    # reverse everything after head first
    new_head = reverse_list(head.next)  #@rec
    head.next.next = head           # next node points back  #@back
    head.next = None                # head is now the tail  #@cut
    return new_head                 # pass it up unchanged  #@up
`,
        trace(inp) {
          const vals = cleanVals(inp.nums, 7, [1, 2, 3]);
          const n = vals.length;
          const ids = vals.map((_, i) => 'n' + i);
          const next = vals.map((_, i) => (i + 1 < n ? i + 1 : null));
          const t = DSA.tracer();
          const stack = [];
          let newHead = null;
          const aux = () => [{ label: 'call stack', kind: 'stack', items: stack.map((i, k) => ({ v: `reverse_list(${vals[i]})`, s: k === stack.length - 1 ? 'active' : null })) }];
          const view = (h, o) => {
            o = o || {};
            const nodes = vals.map((v, i) => ({ id: ids[i], v, s: i === h ? 'active' : o.revFrom != null && i >= o.revFrom ? 'visited' : null }));
            const links = next.map((j, i) => ({ from: ids[i], to: j == null ? null : ids[j], s: o.hot === i ? 'active' : null }));
            const p = ptrs([[ids[h], 'head'], [newHead == null ? undefined : ids[newHead], 'new_head']]);
            return { type: 'linked', nodes, links, pointers: p };
          };
          const vv = (h, extra) => Object.assign({ head: node(vals[h]), new_head: node(newHead == null ? null : vals[newHead]) }, extra || {});
          const rec = (h) => {
            stack.push(h);
            const last = next[h] == null;
            t.step('base', last ? `\`head = ${vals[h]}\` and \`head.next\` is None: base case.` : `\`head = ${vals[h]}\` has a next node (${vals[next[h]]}), so not the base case.`, { view: view(h, { revFrom: newHead == null ? null : h + 1 }), vars: vv(h), aux: aux() });
            if (last) {
              newHead = h;
              t.step('ret', `Return ${vals[h]}. The last node is the new head.`, { view: view(h), vars: vv(h, { return: node(vals[h]) }), aux: aux() });
              stack.pop();
              return h;
            }
            t.step('rec', `Call \`reverse_list(${vals[h + 1]})\` to reverse everything after ${vals[h]}.`, { view: view(h), vars: vv(h), aux: aux() });
            rec(h + 1);
            // back in this call
            next[h + 1] = h;
            t.step('back', `Back in \`reverse_list(${vals[h]})\` with \`new_head = ${vals[newHead]}\`. \`head.next.next = head\`: ${vals[h + 1]} now points back to ${vals[h]}.`, { view: view(h, { revFrom: h + 1, hot: h + 1 }), vars: vv(h), aux: aux() });
            next[h] = null;
            t.step('cut', `\`head.next = None\`: ${vals[h]} is the tail of the reversed part (${listRepr(vals.slice(h).reverse())}).`, { view: view(h, { revFrom: h + 1, hot: h }), vars: vv(h), aux: aux() });
            t.step('up', h === 0 ? `Return \`new_head\` (${vals[newHead]}). That was the first call, so we are done.` : `Return \`new_head\` (${vals[newHead]}) to the caller unchanged.`, { view: view(h, { revFrom: h }), vars: vv(h, { return: node(vals[newHead]) }), aux: aux() });
            stack.pop();
            return newHead;
          };
          rec(0);
          const rev = vals.slice().reverse();
          const last = t.frames[t.frames.length - 1];
          last.views = [last.view, { type: 'linked', title: 'result', nodes: rev.map((v, i) => ({ id: 'r' + i, v, s: 'found' })), pointers: { r0: 'head' } }];
          delete last.view;
          last.msg += ` Result: ${listRepr(rev)}.`;
          return t.frames;
        },
      },
    ],
  });

  /* ====================================================================
   * Fast & slow pointers
   * ==================================================================== */
  DSA.addAlgo({
    id: 'fast-slow-pointers',
    title: 'Fast & Slow Pointers',
    category: 'Linked List Patterns',
    order: 2,
    tags: ['tortoise and hare', 'floyd', 'cycle detection', 'middle of linked list', 'runner'],
    summary: 'Move one pointer one step and another two steps at a time. When `fast` reaches the end, `slow` is in the middle. If there is a cycle, `fast` laps `slow` and they meet.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    notes: [
      'Loop guard `while fast and fast.next` stops safely at both odd and even lengths.',
      'Even length: this version returns the **second** middle. Start `fast = head.next` for the first.',
      'Compare nodes with `is`, not values: two nodes can hold the same value.',
      'Cycle start (142): after they meet, move one pointer back to `head`; step both by one. They meet at the start of the cycle.',
    ],
    tips: [
      'A `set` of seen nodes also detects a cycle, but costs O(n) space. Floyd is O(1).',
      'Palindrome list: find the middle, reverse the second half, compare.',
    ],
    problems: ['876. Middle of the Linked List', '141. Linked List Cycle', '142. Linked List Cycle II', '234. Palindrome Linked List', '287. Find the Duplicate Number', '202. Happy Number'],
    variants: [
      {
        id: 'middle',
        label: 'Find middle',
        file: 'middle_node',
        summary: '`fast` moves two steps for every one step of `slow`. When `fast` runs out of list, `slow` has covered half of it.',
        legend: { active: 'slow', frontier: 'fast', found: 'Middle' },
        input: {
          default: { nums: [1, 2, 3, 4, 5, 6] },
          random: () => ({ nums: U.range(U.randInt(5, 7)).map((i) => i + 1) }),
          fields: [listInput(8)],
        },
        code: `
# ListNode has .val and .next
def middle_node(head):
    slow = fast = head              # both start at head  #@init
    while fast and fast.next:       # fast can take 2 steps  #@loop
        slow = slow.next            # 1 step  #@slow
        fast = fast.next.next       # 2 steps  #@fast
    return slow                     # the middle node  #@done
`,
        trace(inp) {
          const vals = cleanVals(inp.nums, 8, [1, 2, 3]);
          const n = vals.length;
          const ids = vals.map((_, i) => 'n' + i);
          const t = DSA.tracer();
          const view = (s, f, done) => ({
            type: 'linked',
            nodes: vals.map((v, i) => ({ id: ids[i], v, s: i === s ? (done ? 'found' : 'active') : i === f ? 'frontier' : null })),
            pointers: ptrs([[ids[s], 'slow'], [f != null && f < n ? ids[f] : undefined, 'fast']]),
          });
          const vv = (s, f) => ({ slow: node(vals[s]), fast: node(f != null && f < n ? vals[f] : null) });
          let s = 0, f = 0;
          t.step('init', `\`slow\` and \`fast\` both start at the head (${vals[0]}).`, { view: view(s, f), vars: vv(s, f) });
          while (true) {
            const ok = f < n && f + 1 < n;
            const msg = f >= n ? '`fast` is None: it fell off the end. Stop.'
              : !ok ? `\`fast.next\` is None: \`fast\` (${vals[f]}) is the last node. Stop.`
                : `\`fast\` (${vals[f]}) and \`fast.next\` (${vals[f + 1]}) exist, so \`fast\` can jump two.`;
            t.step('loop', msg, { view: view(s, f), vars: vv(s, f) });
            if (!ok) break;
            s += 1;
            t.step('slow', `\`slow\` steps once to ${vals[s]}.`, { view: view(s, f), vars: vv(s, f) });
            f += 2;
            t.step('fast', f < n ? `\`fast\` jumps two to ${vals[f]}.` : '`fast` jumps two, past the last node: now None.', { view: view(s, f), vars: vv(s, f) });
          }
          t.step('done', `Return \`slow\` (${vals[s]}), index ${s} of ${n}. ${n % 2 ? 'Odd length: the exact middle.' : 'Even length: the second of the two middle nodes.'}`, { view: view(s, f, true), vars: Object.assign(vv(s, f), { return: node(vals[s]) }) });
          return t.frames;
        },
      },
      {
        id: 'cycle',
        label: 'Detect cycle',
        file: 'has_cycle',
        summary: 'Floyd\'s cycle detection. Inside a loop, `fast` gains one node on `slow` every step, so it must land on `slow`. With no loop, `fast` simply reaches the end.',
        legend: { active: 'slow', frontier: 'fast', found: 'They meet' },
        input: {
          default: { nums: [1, 2, 3, 4, 5, 6], pos: 2 },
          random: () => {
            const n = U.randInt(5, 7);
            return { nums: U.range(n).map((i) => i + 1), pos: Math.random() < 0.6 ? U.randInt(0, n - 2) : -1 };
          },
          fields: [listInput(8), { key: 'pos', label: 'tail links to index (-1 = none)', type: 'number' }],
        },
        code: `
# ListNode has .val and .next
def has_cycle(head):
    slow = fast = head              # both start at head  #@init
    while fast and fast.next:       # no end reached yet  #@loop
        slow = slow.next            # 1 step  #@slow
        fast = fast.next.next       # 2 steps  #@fast
        if slow is fast:            # fast caught up  #@meet
            return True             # there is a cycle  #@yes
    return False                    # fast hit the end  #@no
`,
        trace(inp) {
          const vals = cleanVals(inp.nums, 8, [1, 2, 3]);
          const n = vals.length;
          let pos = inp.pos === undefined || inp.pos === '' ? 2 : Math.floor(+inp.pos);
          if (!(pos >= 0 && pos < n)) pos = -1;
          const ids = vals.map((_, i) => 'n' + i);
          const nx = (i) => (i == null ? null : i + 1 < n ? i + 1 : pos >= 0 ? pos : null);
          const links = vals.map((_, i) => (i + 1 < n ? { from: ids[i], to: ids[i + 1] } : pos >= 0 ? { from: ids[i], to: ids[pos], curve: 'below', s: 'active' } : { from: ids[i], to: null }));
          const t = DSA.tracer();
          const view = (s, f, meet) => ({
            type: 'linked',
            nodes: vals.map((v, i) => ({ id: ids[i], v, s: meet && i === s ? 'found' : i === s ? 'active' : i === f ? 'frontier' : null })),
            links,
            pointers: ptrs([[ids[s], 'slow'], [f != null ? ids[f] : undefined, 'fast']]),
          });
          const vv = (s, f) => ({ slow: node(vals[s]), fast: node(f == null ? null : vals[f]) });
          let s = 0, f = 0;
          t.step('init', `Both start at the head (${vals[0]}). ${pos >= 0 ? `The tail (${vals[n - 1]}) links back to ${vals[pos]}, making a cycle.` : 'The tail points to None.'}`, { view: view(s, f), vars: vv(s, f) });
          let steps = 0;
          while (true) {
            const ok = f != null && nx(f) != null;
            const msg = f == null ? '`fast` is None: it ran off the end.'
              : !ok ? `\`fast.next\` is None: \`fast\` (${vals[f]}) is the last node.`
                : `\`fast\` (${vals[f]}) and \`fast.next\` (${vals[nx(f)]}) exist. Keep going.`;
            t.step('loop', msg, { view: view(s, f), vars: vv(s, f) });
            if (!ok) break;
            s = nx(s);
            t.step('slow', `\`slow\` steps to ${vals[s]}.`, { view: view(s, f), vars: vv(s, f) });
            const mid = nx(f);
            f = nx(mid);
            t.step('fast', f == null ? `\`fast\` jumps ${vals[mid]} → None.` : `\`fast\` jumps ${vals[mid]} → ${vals[f]}${f <= mid ? ' (around the cycle)' : ''}.`, { view: view(s, f), vars: vv(s, f) });
            const meet = s === f;
            t.step('meet', meet ? `\`slow is fast\`: both are on node ${vals[s]}.` : `\`slow\` (${vals[s]}) is not \`fast\` (${f == null ? 'None' : vals[f]}).`, { view: view(s, f, meet), vars: vv(s, f) });
            if (meet) {
              t.step('yes', `They met, so the list has a cycle. Return True.`, { view: view(s, f, true), vars: Object.assign(vv(s, f), { return: true }) });
              return t.frames;
            }
            if (++steps > 40) break;
          }
          t.step('no', '`fast` reached the end, so there is no cycle. Return False.', { view: view(s, f), vars: Object.assign(vv(s, f), { return: false }) });
          return t.frames;
        },
      },
    ],
  });

  /* ====================================================================
   * Merge two sorted lists
   * ==================================================================== */
  DSA.addAlgo({
    id: 'merge-two-lists',
    title: 'Merge Two Sorted Lists',
    category: 'Linked List Patterns',
    order: 3,
    tags: ['merge', 'dummy node', 'sentinel', 'tail pointer', 'sorted'],
    summary: 'Splice two sorted lists into one by repeatedly taking the smaller head. A **dummy** node in front means the head needs no special case; `tail` marks where the next node goes.',
    complexity: { time: 'O(n + m)', space: 'O(1)', note: 'Nodes are relinked, not copied.' },
    legend: { dim: 'Already taken', active: 'Current head', new: 'Just linked', found: 'Merged' },
    notes: [
      '`dummy = ListNode()` removes the "is the result empty?" check. Return `dummy.next`.',
      'When one list runs out, attach the other in one step: `tail.next = a or b`.',
      'Take from `a` on ties (`<=`) to keep the merge stable.',
      'Same step powers merge sort on linked lists (148) and merging k lists with a heap (23).',
    ],
    tips: [
      'Reach for a dummy head whenever the first node of the output might change (remove, partition, merge).',
      'Recursive version is shorter but uses O(n + m) stack.',
    ],
    problems: ['21. Merge Two Sorted Lists', '23. Merge k Sorted Lists', '148. Sort List', '86. Partition List', '2. Add Two Numbers'],
    file: 'merge_two_lists',
    input: {
      default: { a: [1, 4, 6], b: [2, 4, 7] },
      random: () => {
        const mk = () => U.randArray(U.randInt(2, 4), 1, 15).sort((x, y) => x - y);
        return { a: mk(), b: mk() };
      },
      fields: [
        { key: 'a', label: 'a', type: 'array', max: 5 },
        { key: 'b', label: 'b', type: 'array', max: 5 },
      ],
    },
    code: LISTNODE + `
def merge_two_lists(a, b):
    dummy = tail = ListNode()           # fake head  #@init
    while a and b:                      # both have nodes  #@loop
        if a.val <= b.val:              # take the smaller  #@cmp
            tail.next, a = a, a.next    # link a, advance a  #@takea
        else:
            tail.next, b = b, b.next    # link b, advance b  #@takeb
        tail = tail.next                # move to the end  #@tail
    tail.next = a or b                  # attach the rest  #@rest
    return dummy.next                   # skip the dummy  #@done
`,
    trace(inp) {
      const A = (inp.a || []).slice(0, 5).sort((x, y) => x - y);
      const B = (inp.b || []).slice(0, 5).sort((x, y) => x - y);
      const t = DSA.tracer();
      let ia = 0, ib = 0;
      const out = []; // [{id, v}] taken, in order
      let linked = 0; // how many of out are linked from their predecessor
      let restAttached = false;
      const src = (vals, pre, idx, name, o) => {
        o = o || {};
        const nodes = vals.map((v, i) => ({ id: pre + i, v, s: i < idx ? 'dim' : i === idx && o.hot ? 'compare' : i === idx ? 'active' : null }));
        const pointers = idx < vals.length ? { [pre + idx]: name } : { null: name };
        return { type: 'linked', title: `list ${name}`, nodes, pointers };
      };
      const res = (o) => {
        o = o || {};
        const nodes = [{ id: 'd', v: 0, s: 'dim' }].concat(out.map((x, k) => ({ id: x.id, v: x.v, s: restAttached ? 'found' : o.newIdx === k ? 'new' : null })));
        const links = [];
        for (let k = 0; k < out.length; k++) if (k < linked) links.push({ from: k === 0 ? 'd' : out[k - 1].id, to: out[k].id, s: o.newIdx === k ? 'active' : null });
        if (restAttached) links.push({ from: out.length ? out[out.length - 1].id : 'd', to: null });
        const tailId = o.tailIdx == null || o.tailIdx < 0 ? 'd' : out[o.tailIdx].id;
        return { type: 'linked', title: 'merged (from dummy)', nodes, links, pointers: ptrs([['d', 'dummy'], [tailId, 'tail']]) };
      };
      let tailIdx = -1;
      // same scale for all three lists (the merged one may still shrink to fit)
      const scale = 0.95;
      const views = (o) => [src(A, 'a', ia, 'a', { hot: o && o.hotA }), src(B, 'b', ib, 'b', { hot: o && o.hotB }), res(Object.assign({ tailIdx }, o || {}))].map((v) => Object.assign(v, { scale }));
      const vv = () => ({ a: node(ia < A.length ? A[ia] : null), b: node(ib < B.length ? B[ib] : null), tail: { raw: tailIdx < 0 ? 'dummy' : `ListNode(${out[tailIdx].v})` } });
      t.step('init', '`dummy = tail = ListNode()`: a placeholder (val 0) before the real head, so the first append is like any other.', { views: views(), vars: vv() });
      while (true) {
        const both = ia < A.length && ib < B.length;
        const msg = both ? `\`a\` (${A[ia]}) and \`b\` (${B[ib]}) both have nodes.` : `\`${ia < A.length ? 'b' : 'a'}\` is None. Stop the loop.`;
        t.step('loop', msg, { views: views(), vars: vv() });
        if (!both) break;
        const takeA = A[ia] <= B[ib];
        t.step('cmp', `Is ${A[ia]} <= ${B[ib]}? ${takeA ? `Yes, take ${A[ia]} from \`a\`${A[ia] === B[ib] ? ' (ties go to a)' : ''}.` : `No, take ${B[ib]} from \`b\`.`}`, { views: views({ hotA: true, hotB: true }), vars: vv() });
        if (takeA) { out.push({ id: 'a' + ia, v: A[ia] }); ia++; } else { out.push({ id: 'b' + ib, v: B[ib] }); ib++; }
        linked = out.length;
        const k = out.length - 1;
        const from = tailIdx < 0 ? 'dummy' : out[tailIdx].v;
        t.step(takeA ? 'takea' : 'takeb', `\`tail.next\` = ${out[k].v} (${from} → ${out[k].v}). Advance \`${takeA ? 'a' : 'b'}\` to ${takeA ? (ia < A.length ? A[ia] : 'None') : ib < B.length ? B[ib] : 'None'}.`, { views: views({ newIdx: k }), vars: vv() });
        tailIdx = k;
        t.step('tail', `\`tail\` moves to ${out[k].v}, the last merged node.`, { views: views(), vars: vv() });
      }
      const restVals = ia < A.length ? A.slice(ia).map((v, i) => ({ id: 'a' + (ia + i), v })) : B.slice(ib).map((v, i) => ({ id: 'b' + (ib + i), v }));
      const which = ia < A.length ? 'a' : ib < B.length ? 'b' : null;
      restVals.forEach((x) => out.push(x));
      linked = out.length;
      if (which === 'a') ia = A.length; else if (which === 'b') ib = B.length;
      restAttached = true;
      t.step('rest', which ? `\`tail.next = a or b\`: hang the rest of \`${which}\` (${restVals.map((x) => x.v).join(' → ')}) on the end. It is already sorted and linked.` : '`tail.next = a or b`: both are None, so nothing is left.', { views: views(), vars: vv() });
      const merged = out.map((x) => x.v);
      t.step('done', merged.length ? `Return \`dummy.next\` (${merged[0]}): ${listRepr(merged)}.` : 'Both lists were empty. Return `dummy.next`, which is None.', { views: views(), vars: Object.assign(vv(), { return: node(merged.length ? merged[0] : null) }) });
      return t.frames;
    },
  });
})();
