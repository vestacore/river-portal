import type { World } from './types/World.ts';

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A new id with a prefix (`ord`, `inv`, `ps`, `pay`, …): readable, unique in the world, deterministic in order. */
export function newId(world: World, prefix: string): string {
  const n = (world.counters[prefix] ?? 0) + 1;
  world.counters[prefix] = n;
  let x = Math.imul(n ^ 0x5bd1e995, 0x27d4eb2d) >>> 0;
  let tail = '';
  for (let i = 0; i < 6; i += 1) { tail += alphabet[x % 32]; x = Math.floor(x / 32) ^ (n * (i + 7)); x >>>= 0; }
  return `${prefix}_${tail}${n.toString(36).toUpperCase()}`;
}
