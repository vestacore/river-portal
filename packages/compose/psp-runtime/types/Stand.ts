import type { AccessRequest, Grant, Person } from '@river/psp-access';
import type { AcquiringTerms, Contract, Tariff } from '@river/psp-contracts';
import type { ApiKey, WebhookEndpoint } from '@river/psp-integration';
import type { RiskRule } from '@river/psp-risk';
import type { PolicySetting, Unit, UnitProfile } from '@river/psp-units';
import type { Persona, StandId } from './World.ts';

/** Everything a stand starts from before its history: its hierarchy, people, contracts, connections and integration. */
export type StandData = {
  id: StandId;
  units: readonly Unit[];
  profiles: readonly UnitProfile[];
  settings: readonly PolicySetting[];
  rules: readonly RiskRule[];
  people: readonly Person[];
  grants: readonly Grant[];
  requests: readonly AccessRequest[];
  personas: readonly Persona[];
  tariffs: readonly Tariff[];
  contracts: readonly Contract[];
  acquiring: readonly AcquiringTerms[];
  providers: readonly string[];
  feeRecipient: string | null;
  keys: readonly ApiKey[];
  endpoints: readonly WebhookEndpoint[];
  failing: ReadonlyArray<{ endpointId: string; hours: number }>;
};
