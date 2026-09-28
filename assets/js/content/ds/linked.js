/* Data Structures · Linked Lists (singly, doubly) */
(function () {
  DSA.addDS({
    id: 'singly-linked-list',
    title: 'Singly Linked List',
    category: 'Linked Lists',
    order: 1,
    tags: ['linked list', 'ListNode', 'node', 'pointer', 'dummy head', 'sentinel'],
    summary: 'A chain of nodes where each node holds a value and a pointer to the next one. Inserting or deleting next to a node you already hold is O(1); reaching the k-th node means walking from the head.',
    ops: [
      { op: 'head = ListNode(v, head)', time: 'O(1)', note: 'insert at head' },
      { op: 'insert_after(node, v)', time: 'O(1)', note: 'once you hold the node' },
      { op: 'append(head, v)', time: 'O(n)', note: 'O(1) if you keep a tail pointer' },
      { op: 'delete(head, v)', time: 'O(n)', note: 'the unlink is O(1); finding it is O(n)' },
      { op: 'find(head, v)  /  k-th node', time: 'O(n)' },
      { op: 'length(head)', time: 'O(n)', note: 'no stored size unless you track it' },
    ],
    space: 'O(n)',
    complexity: { time: {"Access": "O(n)", "Search": "O(n)", "Insert at head": "O(1)", "Delete (after node)": "O(1)"}, space: 'O(n)' },
    visuals: [
      {
        type: 'linked',
        title: 'head = build([3, 7, 1, 9])',
        scale: 0.8,
        nodes: [{ id: 'a', v: 3 }, { id: 'b', v: 7, s: 'active' }, { id: 'c', v: 1 }, { id: 'd', v: 9 }],
        pointers: { a: 'head', b: 'node' },
      },
      {
        type: 'linked',
        title: 'dummy head: every real node has a prev',
        nodes: [{ id: 'z', v: 0 }, { id: 'a', v: 3 }, { id: 'b', v: 7, s: 'removed' }, { id: 'c', v: 1 }, { id: 'd', v: 9 }],
        links: [{ from: 'z', to: 'a' }, { from: 'a', to: 'c', s: 'active', curve: 'below' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' }, { from: 'd', to: null }],
        pointers: { z: 'dummy', a: ['head', 'prev'] },
      },
    ],
    visualCaption: 'Each box is `val | next`. The last `next` is `None`. To delete `7`, stop at the node **before** it and set `prev.next = prev.next.next`. A dummy node in front means the head is never a special case.',
    code: `
# --- create ---
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val          # the payload
        self.next = next        # next node, None at the end

def build(values):
    dummy = tail = ListNode()   # placeholder before the head
    for v in values:
        tail.next = ListNode(v) # hang a new node off the tail
        tail = tail.next        # tail moves to the new node
    return dummy.next           # real head (None if empty)

head = build([3, 7, 1, 9])      # 3 -> 7 -> 1 -> 9 -> None

# --- traverse ---
node = head
while node:                     # stops after the last node
    print(node.val)
    node = node.next            # step forward

def to_list(head):              # handy for debugging
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out                  # [3, 7, 1, 9]

# --- length ---
def length(head):
    n = 0
    while head:                 # O(n): no len() for free
        n += 1
        head = head.next
    return n

# --- search ---
def find(head, target):
    # walk until a match or the end
    while head and head.val != target:
        head = head.next
    return head                 # the node, or None

# --- insert ---
head = ListNode(5, head)        # at head, O(1)

def insert_after(node, val):
    # new node takes over node's old next, O(1)
    node.next = ListNode(val, node.next)

def append(head, val):
    if not head:                # empty list: new node is head
        return ListNode(val)
    node = head
    while node.next:            # walk to the last node, O(n)
        node = node.next
    node.next = ListNode(val)
    return head

# --- delete ---
def delete(head, target):
    dummy = ListNode(0, head)   # so the head has a prev too
    prev = dummy
    while prev.next:
        if prev.next.val == target:
            # skip over the match: it is unlinked
            prev.next = prev.next.next
            break
        prev = prev.next
    return dummy.next           # head may have changed
`,
    notes: [
      'Nodes live anywhere in memory; only the `next` pointers hold the order. No index access.',
      'Insert/delete are O(1) **once you hold the node before the spot**. Finding that node is the O(n) part.',
      '**Dummy head**: `dummy = ListNode(0, head)` gives every real node a predecessor, so changing the head needs no special case. Return `dummy.next`.',
      'Python has no built-in linked list. `collections.deque` is a doubly linked list of blocks, O(1) at both ends.',
    ],
    tips: [
      'Rewire in the right order: save `nxt = node.next` before you overwrite it, or you lose the rest of the list.',
      'Guard every hop: `while fast and fast.next:` before touching `fast.next.next`.',
    ],
    problems: ['206. Reverse Linked List', '21. Merge Two Sorted Lists', '203. Remove Linked List Elements', '19. Remove Nth Node From End of List', '707. Design Linked List', '2. Add Two Numbers'],
  });

  const H = { id: 'h', v: 'H' };
  const T = { id: 't', v: 'T' };

  DSA.addDS({
    id: 'doubly-linked-list',
    title: 'Doubly Linked List',
    category: 'Linked Lists',
    order: 2,
    tags: ['linked list', 'prev', 'next', 'sentinel', 'lru', 'deque'],
    summary: 'Like a singly linked list, but every node also points back to the previous one. Given a node, you can unlink it in O(1) without searching for its predecessor. This is what makes an LRU cache O(1).',
    ops: [
      { op: 'push_front / push_back', time: 'O(1)' },
      { op: 'insert_after(node, new)', time: 'O(1)' },
      { op: 'remove(node)', time: 'O(1)', note: 'given the node itself' },
      { op: 'pop_front / pop_back', time: 'O(1)' },
      { op: 'find by value  /  k-th node', time: 'O(n)' },
    ],
    space: 'O(n)',
    complexity: { time: {"Access": "O(n)", "Search": "O(n)", "Insert (at node)": "O(1)", "Remove (node)": "O(1)"}, space: 'O(n)' },
    visuals: [
      {
        type: 'linked',
        doubly: true,
        title: 'sentinels H and T never hold data',
        nodes: [H, { id: 'a', v: 4 }, { id: 'b', v: 7, s: 'active' }, T],
        links: [{ from: 'h', to: 'a' }, { from: 'a', to: 'b' }, { from: 'b', to: 't' }],
        pointers: { h: 'head', b: 'node', t: 'tail' },
      },
      {
        type: 'linked',
        doubly: true,
        title: 'after remove(node)',
        scale: 0.75,
        nodes: [H, { id: 'a', v: 4, s: 'new' }, { id: 't', v: 'T', s: 'new' }],
        links: [{ from: 'h', to: 'a' }, { from: 'a', to: 't' }],
        pointers: { h: 'head', t: 'tail' },
      },
    ],
    visualCaption: 'Each box is `prev | val | next`. To remove `7`, its two neighbours point past it: `node.prev.next = node.next` and `node.next.prev = node.prev`. `7` is the last real node, but its `next` is still a node (the sentinel `T`), so there is no special case.',
    code: `
# --- create ---
class Node:
    def __init__(self, val=0):
        self.val = val
        self.prev = self.next = None    # links both ways

class DLL:
    def __init__(self):
        # sentinels: never hold data, never removed
        self.head, self.tail = Node(), Node()
        self.head.next = self.tail      # empty: H <-> T
        self.tail.prev = self.head
        self.size = 0

    # --- insert ---
    def insert_after(self, node, new):
        new.prev, new.next = node, node.next  # hook new in
        node.next.prev = new            # old next points back
        node.next = new                 # node points forward
        self.size += 1

    def push_front(self, new):
        self.insert_after(self.head, new)

    def push_back(self, new):
        self.insert_after(self.tail.prev, new)

    # --- remove ---
    def remove(self, node):             # O(1), no search
        node.prev.next = node.next      # left skips node
        node.next.prev = node.prev      # right skips node
        self.size -= 1
        return node

    def pop_back(self):
        if self.size == 0:
            raise IndexError("pop from empty list")
        return self.remove(self.tail.prev)

    # --- traverse ---
    def __iter__(self):
        node = self.head.next           # first real node
        while node is not self.tail:
            yield node.val
            node = node.next

# --- use ---
dll = DLL()
a = Node(7)
dll.push_back(Node(4))                  # H <-> 4 <-> T
dll.push_back(a)                        # H <-> 4 <-> 7 <-> T
dll.push_back(Node(2))                  # ... 7 <-> 2 <-> T
dll.remove(a)                           # O(1): we hold a
list(dll)                               # [4, 2]
`,
    notes: [
      'Each node knows its predecessor, so a node can unlink itself in O(1). A singly list needs the previous node for that.',
      '**Sentinel** head and tail mean every real node always has a non-None `prev` and `next`: no special cases for empty, first or last.',
      '**LRU cache** = dict (key → node) + this list ordered by recency. The dict finds the node in O(1), the list moves it to the front or drops the back in O(1).',
      '`collections.deque` is O(1) at both ends but has no O(1) removal from the middle. `OrderedDict` is a dict plus a doubly linked list.',
    ],
    tips: [
      'In `insert_after`, set the new node\'s own pointers first, then `node.next.prev = new` **before** `node.next = new`.',
      'For LRU, store the key inside the node so eviction can `del cache[node.key]`.',
    ],
    problems: ['146. LRU Cache', '460. LFU Cache', '707. Design Linked List', '1472. Design Browser History', '430. Flatten a Multilevel Doubly Linked List'],
  });
})();
