export const carrierKinds = ['volunteer', 'courier', 'postal', 'company', 'partner'] as const;
export type CarrierKind = (typeof carrierKinds)[number];
