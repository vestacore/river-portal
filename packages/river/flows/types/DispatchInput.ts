import type { CarrierKind } from './CarrierKind.ts';
import type { CostInput } from './CostInput.ts';

export type DispatchInput = {
  flowId: string;
  carrierKind: CarrierKind;
  carrierName: string;
  carrierPersonId?: string | null;
  fromLabel: string;
  costs: CostInput[];
};
