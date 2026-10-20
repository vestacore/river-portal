import { demoContracts, demoTariffs } from './data/demoContracts.ts';
import { demoEndpoints, demoKeys } from './data/demoIntegration.ts';
import { demoGrants, demoPeople, demoRequests } from './data/demoPeople.ts';
import { demoRules, demoSettings } from './data/demoPolicies.ts';
import { demoProfiles } from './data/demoProfiles.ts';
import { demoUnits } from './data/demoUnits.ts';
import type { World } from './types/World.ts';

/** A world with the demo's hierarchy, people, contracts and integration — and no history yet. */
export function createWorld(startedAt: string): World {
  const copy = <T>(items: readonly T[]): T[] => items.map((x) => structuredClone(x));
  return {
    startedAt, version: 0,
    units: copy(demoUnits),
    profiles: Object.fromEntries(demoProfiles.map((p) => [p.unitId, structuredClone(p)])),
    settings: copy(demoSettings), rules: copy(demoRules),
    people: copy(demoPeople), grants: copy(demoGrants), requests: copy(demoRequests),
    tariffs: copy(demoTariffs), contracts: copy(demoContracts),
    streams: new Map(), log: [],
    views: { orders: new Map(), invoices: new Map(), sessions: new Map(), payments: new Map() },
    journal: [], scenarios: new Map(), caches: { payer: new Map(), merchantAmounts: new Map() },
    alerts: [], onboarding: [], keys: copy(demoKeys), endpoints: copy(demoEndpoints), deliveries: [], apiLog: [],
    insights: [], audit: [], payKeys: {}, routeWeights: {}, heldPayouts: [], lostSettlement: [], counters: {}, swarmAt: null, quiet: true,
  };
}
