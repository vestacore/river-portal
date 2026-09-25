import type { CostKind } from './CostKind.ts';

export type CostInput = { kind: CostKind; amountMinor: number; currency: string; note: string };
