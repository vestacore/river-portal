import type { StandData } from '../types/Stand.ts';
import { retailAcquiring, retailContracts } from './retailContracts.ts';
import { retailEndpoints, retailKeys } from './retailIntegration.ts';
import { retailGrants, retailPeople, retailPersonas, retailRequests } from './retailPeople.ts';
import { retailRules, retailSettings } from './retailPolicies.ts';
import { retailProfiles } from './retailProfiles.ts';
import { retailUnits } from './retailUnits.ts';

/**
 * The orchestration assembly of the platform, for a retail group with its own acquiring agreements: the
 * banks settle to the group's accounts, the platform routes online payments by cost and on-us, connects
 * the order system, the bonus system and accounting, and reconciles every bank's settlements — the stores'
 * included, whose payments it does not process. Everything here is invented.
 */
export const retailStand: StandData = {
  id: 'retail',
  units: retailUnits, profiles: retailProfiles, settings: retailSettings, rules: retailRules,
  people: retailPeople, grants: retailGrants, requests: retailRequests, personas: retailPersonas,
  tariffs: [], contracts: retailContracts, acquiring: retailAcquiring,
  providers: ['acq-dnipro', 'acq-stepove', 'acq-karpaty', 'hub-ua-a2a', 'bank-ua-sep', 'lend-chastyny', 'bonus-system'],
  feeRecipient: null,
  keys: retailKeys, endpoints: retailEndpoints, failing: [{ endpointId: 'wh-r-erp', hours: 3 }],
};
