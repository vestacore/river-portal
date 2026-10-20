import { expireInvoices } from './expireInvoices.ts';
import { expireSessions } from './expireSessions.ts';
import { refreshSwarm } from './refreshSwarm.ts';
import { runPayouts } from './runPayouts.ts';
import type { World } from './types/World.ts';

const last = new WeakMap<World, { tick: number; swarmVersion: number }>();

/**
 * The clock of a live demo, run when someone looks: attempts nobody finished are closed, checkouts left
 * unpaid are withdrawn, due shares are paid out, and the swarm takes another look when the world has changed. At most every twenty seconds.
 */
export function tickWorld(world: World, at: string): void {
  const now = Date.parse(at);
  const state = last.get(world) ?? { tick: 0, swarmVersion: -1 };
  if (now - state.tick < 20_000) return;
  state.tick = now;
  expireSessions(world, at);
  expireInvoices(world, at);
  runPayouts(world, at);
  if (world.version !== state.swarmVersion) { refreshSwarm(world, at); state.swarmVersion = world.version; }
  last.set(world, state);
}
