import type { CarrierKind } from './CarrierKind.ts';
import type { CostInput } from './CostInput.ts';

export type DispatchInput = {
  flowId: string;
  carrierKind: CarrierKind;
  carrierName: string;
  fromLabel: string;
  costs: CostInput[];
};
