import type { Acquirer } from '../types/Instrument.ts';

/**
 * The acquirers, banks and providers of the demo. All are stand-ins with invented names: in this demo no
 * money moves and no real institution is contacted. `approvalBps` is how often each approves (×100 %).
 */
export const acquirers: readonly Acquirer[] = [
  { id: 'acq-dnipro', name: 'Dnipro Acquiring', rails: ['card'], regions: ['UA'], approvalBps: 9_350, standIn: true },
  { id: 'acq-karpaty', name: 'Karpaty Card Services', rails: ['card'], regions: ['UA'], approvalBps: 8_800, standIn: true },
  { id: 'acq-baltic', name: 'Baltic Acquiring', rails: ['card'], regions: ['EU'], approvalBps: 9_410, standIn: true },
  { id: 'hub-ua-a2a', name: 'UA Open Banking Hub', rails: ['a2a', 'qr'], regions: ['UA'], approvalBps: 9_700, standIn: true },
  { id: 'rail-sepa', name: 'SEPA Instant Rail', rails: ['a2a', 'transfer', 'debit'], regions: ['EU'], approvalBps: 9_800, standIn: true },
  { id: 'bank-ua-sep', name: 'UA Interbank Transfers', rails: ['transfer'], regions: ['UA'], approvalBps: 9_900, standIn: true },
  { id: 'lend-chastyny', name: 'Chastyny Credit', rails: ['credit'], regions: ['UA'], approvalBps: 8_200, standIn: true },
  { id: 'lend-later', name: 'Later Lending EU', rails: ['credit'], regions: ['EU'], approvalBps: 8_600, standIn: true },
  { id: 'wallet-net', name: 'Wallet Network', rails: ['wallet'], regions: ['EU'], approvalBps: 9_500, standIn: true },
  { id: 'chain-usdc', name: 'USDC Settlement Desk', rails: ['chain'], regions: ['EU'], approvalBps: 9_950, standIn: true },
  { id: 'kiosk-ua', name: 'Kiosk Network UA', rails: ['cash'], regions: ['UA'], approvalBps: 9_900, standIn: true },
];
