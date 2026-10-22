import type { StandData } from '../types/Stand.ts';
import { demoContracts, demoTariffs } from './demoContracts.ts';
import { demoEndpoints, demoKeys } from './demoIntegration.ts';
import { demoGrants, demoPeople, demoPersonas, demoRequests } from './demoPeople.ts';
import { demoRules, demoSettings } from './demoPolicies.ts';
import { demoProfiles } from './demoProfiles.ts';
import { demoUnits } from './demoUnits.ts';

/**
 * The PSP assembly of the platform: River Pay holds its merchants' money, takes its fee by tariff and
 * pays shares out, over its own acquirers, in Ukraine and in Europe. Everything here is invented.
 */
export const pspStand: StandData = {
  id: 'psp',
  units: demoUnits, profiles: demoProfiles, settings: demoSettings, rules: demoRules,
  people: demoPeople, grants: demoGrants, requests: demoRequests, personas: demoPersonas,
  tariffs: demoTariffs, contracts: demoContracts, acquiring: [],
  providers: ['acq-dnipro', 'acq-karpaty', 'acq-baltic', 'hub-ua-a2a', 'rail-sepa', 'bank-ua-sep', 'lend-chastyny', 'lend-later', 'wallet-net', 'chain-usdc', 'kiosk-ua'],
  feeRecipient: 'ou-riverpay',
  keys: demoKeys, endpoints: demoEndpoints, failing: [{ endpointId: 'wh-kvg-orders', hours: 5 }],
};
