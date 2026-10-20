/**
 * A small seeded random generator (mulberry32) for the demo's history: the same seed always gives the
 * same world. Chance enters the demo here and nowhere else.
 */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const chance = (p: number) => next() < p;
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!;
  const weighted = <K extends string>(weights: Partial<Record<K, number>>): K => {
    const entries = Object.entries(weights) as Array<[K, number]>;
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let point = next() * total;
    for (const [k, w] of entries) { point -= w; if (point < 0) return k; }
    return entries[0]![0];
  };
  return { next, int, chance, pick, weighted };
}
