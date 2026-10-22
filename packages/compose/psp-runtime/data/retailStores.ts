/**
 * How the stores of the retail stand trade by card — the material of the settlement reports their
 * terminal banks send. `dailyMinor` is a store's card sales on an ordinary weekday, `ticketMinor` its
 * average card payment. The issuer mix of each region is the share of card turnover by issuing bank.
 */
export const retailStores: ReadonlyArray<{ unitId: string; dailyMinor: number; ticketMinor: number }> = [
  { unitId: 'rt-kyiv-1', dailyMinor: 240_000_000, ticketMinor: 62_000 }, { unitId: 'rt-kyiv-2', dailyMinor: 88_000_000, ticketMinor: 46_000 },
  { unitId: 'rt-kyiv-3', dailyMinor: 82_000_000, ticketMinor: 44_000 }, { unitId: 'rt-kyiv-4', dailyMinor: 26_000_000, ticketMinor: 23_000 },
  { unitId: 'rt-kyiv-5', dailyMinor: 61_000_000, ticketMinor: 42_000 },
  { unitId: 'rt-west-1', dailyMinor: 205_000_000, ticketMinor: 58_000 }, { unitId: 'rt-west-2', dailyMinor: 74_000_000, ticketMinor: 43_000 },
  { unitId: 'rt-west-3', dailyMinor: 66_000_000, ticketMinor: 41_000 }, { unitId: 'rt-west-4', dailyMinor: 21_000_000, ticketMinor: 22_000 },
  { unitId: 'rt-west-5', dailyMinor: 57_000_000, ticketMinor: 40_000 },
  { unitId: 'rt-east-1', dailyMinor: 196_000_000, ticketMinor: 55_000 }, { unitId: 'rt-east-2', dailyMinor: 79_000_000, ticketMinor: 44_000 },
  { unitId: 'rt-east-3', dailyMinor: 63_000_000, ticketMinor: 41_000 }, { unitId: 'rt-east-4', dailyMinor: 19_000_000, ticketMinor: 21_000 },
  { unitId: 'rt-east-5', dailyMinor: 58_000_000, ticketMinor: 39_000 },
  { unitId: 'rt-south-1', dailyMinor: 214_000_000, ticketMinor: 60_000 }, { unitId: 'rt-south-2', dailyMinor: 69_000_000, ticketMinor: 42_000 },
  { unitId: 'rt-south-3', dailyMinor: 55_000_000, ticketMinor: 39_000 }, { unitId: 'rt-south-4', dailyMinor: 20_000_000, ticketMinor: 22_000 },
  { unitId: 'rt-south-5', dailyMinor: 71_000_000, ticketMinor: 43_000 },
];

export const regionIssuerMix: Record<string, Record<string, number>> = {
  'rt-kyiv': { 'bank-dnipro': 36, 'bank-stepove': 20, 'bank-karpaty': 12, 'bank-polissia': 14, 'bank-misto': 13, foreign: 5 },
  'rt-west': { 'bank-dnipro': 40, 'bank-stepove': 12, 'bank-karpaty': 22, 'bank-polissia': 10, 'bank-misto': 12, foreign: 4 },
  'rt-east': { 'bank-dnipro': 33, 'bank-stepove': 30, 'bank-karpaty': 8, 'bank-polissia': 16, 'bank-misto': 11, foreign: 2 },
  'rt-south': { 'bank-dnipro': 38, 'bank-stepove': 18, 'bank-karpaty': 10, 'bank-polissia': 18, 'bank-misto': 13, foreign: 3 },
};

/** The share of card turnover by card product, the same in every region. ПРОСТІР is part of the debit share. */
export const productMix: Record<string, number> = { debit: 70, credit: 19, premium: 8, commercial: 3 };
