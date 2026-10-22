import type { Acquirer } from '../types/Instrument.ts';

/**
 * The acquirers, banks and providers of the demo. All are stand-ins with invented names: in this demo no
 * money moves and no real institution is contacted. `approvalBps` is how often each approves (×100 %).
 */
export const acquirers: readonly Acquirer[] = [
  { id: 'acq-dnipro', name: 'Dnipro Acquiring', label: { 'en-GB': 'Dnipro Acquiring', uk: 'Дніпро Еквайринг' }, rails: ['card'], regions: ['UA'], approvalBps: 9_350, standIn: true },
  { id: 'acq-karpaty', name: 'Karpaty Card Services', label: { 'en-GB': 'Karpaty Card Services', uk: 'Карпати Картковий Сервіс' }, rails: ['card'], regions: ['UA'], approvalBps: 8_800, standIn: true },
  { id: 'acq-stepove', name: 'Stepove Acquiring', label: { 'en-GB': 'Stepove Acquiring', uk: 'Степовий Еквайринг' }, rails: ['card'], regions: ['UA'], approvalBps: 9_200, standIn: true },
  { id: 'acq-baltic', name: 'Baltic Acquiring', label: { 'en-GB': 'Baltic Acquiring', uk: 'Балтик Еквайринг' }, rails: ['card'], regions: ['EU'], approvalBps: 9_410, standIn: true },
  { id: 'hub-ua-a2a', name: 'UA Open Banking Hub', label: { 'en-GB': 'UA Open Banking Hub', uk: 'Хаб відкритого банкінгу UA' }, rails: ['a2a', 'qr'], regions: ['UA'], approvalBps: 9_700, standIn: true },
  { id: 'rail-sepa', name: 'SEPA Instant Rail', label: { 'en-GB': 'SEPA Instant Rail', uk: 'SEPA Instant' }, rails: ['a2a', 'transfer', 'debit'], regions: ['EU'], approvalBps: 9_800, standIn: true },
  { id: 'bank-ua-sep', name: 'UA Interbank Transfers', label: { 'en-GB': 'UA Interbank Transfers', uk: 'Міжбанківські перекази UA' }, rails: ['transfer'], regions: ['UA'], approvalBps: 9_900, standIn: true },
  { id: 'lend-chastyny', name: 'Chastyny Credit', label: { 'en-GB': 'Chastyny Credit', uk: 'Частини Кредит' }, rails: ['credit'], regions: ['UA'], approvalBps: 8_200, standIn: true },
  { id: 'lend-later', name: 'Later Lending EU', label: { 'en-GB': 'Later Lending EU', uk: 'Later Lending EU' }, rails: ['credit'], regions: ['EU'], approvalBps: 8_600, standIn: true },
  { id: 'wallet-net', name: 'Wallet Network', label: { 'en-GB': 'Wallet Network', uk: 'Wallet Network' }, rails: ['wallet'], regions: ['EU'], approvalBps: 9_500, standIn: true },
  { id: 'chain-usdc', name: 'USDC Settlement Desk', label: { 'en-GB': 'USDC Settlement Desk', uk: 'USDC Settlement Desk' }, rails: ['chain'], regions: ['EU'], approvalBps: 9_950, standIn: true },
  { id: 'kiosk-ua', name: 'Kiosk Network UA', label: { 'en-GB': 'Kiosk Network UA', uk: 'Мережа терміналів UA' }, rails: ['cash'], regions: ['UA'], approvalBps: 9_900, standIn: true },
  { id: 'bonus-system', name: 'Merchant bonus system (connector)', label: { 'en-GB': 'Merchant bonus system (connector)', uk: 'Бонусна система мерчанта (конектор)' }, rails: ['loyalty'], regions: ['UA'], approvalBps: 9_990, standIn: true },
];
