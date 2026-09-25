export const costKinds = ['fuel', 'ferry', 'tolls', 'postage', 'packaging', 'customs', 'vehicle', 'other'] as const;
export type CostKind = (typeof costKinds)[number];
