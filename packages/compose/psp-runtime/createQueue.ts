/** A queue of timed events, earliest first (a binary heap): the clock of the demo's history. */
export function createQueue() {
  const heap: Array<{ at: number; order: number; run: () => void }> = [];
  let order = 0;
  const less = (a: number, b: number) => heap[a]!.at < heap[b]!.at || (heap[a]!.at === heap[b]!.at && heap[a]!.order < heap[b]!.order);
  const swap = (a: number, b: number) => { const t = heap[a]!; heap[a] = heap[b]!; heap[b] = t; };
  return {
    push(at: number, run: () => void) {
      heap.push({ at, order: order++, run });
      let i = heap.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (!less(i, p)) break; swap(i, p); i = p; }
    },
    pop() {
      if (heap.length === 0) return undefined;
      const top = heap[0]!;
      const last = heap.pop()!;
      if (heap.length > 0) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < heap.length && less(l, m)) m = l;
          if (r < heap.length && less(r, m)) m = r;
          if (m === i) break;
          swap(i, m); i = m;
        }
      }
      return top;
    },
    get size() { return heap.length; },
  };
}
