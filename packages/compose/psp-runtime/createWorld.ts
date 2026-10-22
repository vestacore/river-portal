import { pspStand } from './data/pspStand.ts';
import type { StandData } from './types/Stand.ts';
import type { World } from './types/World.ts';

/** A world of one stand: its hierarchy, people, contracts, connections and integration — and no history yet. */
export function createWorld(startedAt: string, stand: StandData = pspStand): World {
  const copy = <T>(items: readonly T[]): T[] => items.map((x) => structuredClone(x));
  return {
    stand: stand.id, startedAt, version: 0,
    providers: [...stand.providers], feeRecipient: stand.feeRecipient,
    units: copy(stand.units),
    profiles: Object.fromEntries(stand.profiles.map((p) => [p.unitId, structuredClone(p)])),
    settings: copy(stand.settings), rules: copy(stand.rules),
    people: copy(stand.people), grants: copy(stand.grants), requests: copy(stand.requests),
    tariffs: copy(stand.tariffs), contracts: copy(stand.contracts), acquiring: copy(stand.acquiring),
    streams: new Map(), log: [],
    views: { orders: new Map(), invoices: new Map(), sessions: new Map(), payments: new Map(), settlements: new Map() },
    journal: [], scenarios: new Map(), caches: { payer: new Map(), merchantAmounts: new Map() },
    alerts: [], onboarding: [], keys: copy(stand.keys), endpoints: copy(stand.endpoints), deliveries: [], apiLog: [],
    insights: [], audit: [], payKeys: {}, routeWeights: {}, heldPayouts: [], lostSettlement: [], failing: stand.failing.map((f) => ({ ...f })), netted: [], quirks: {}, counters: {}, swarmAt: null, quiet: true,
  };
}
