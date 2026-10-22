import type { LocalisedText } from '@river/i18n';
import type { Channel, Currency } from '@river/psp-facts';

/** Kinds of unit, from the platform or a group of companies down to a region, a store, a channel or a marketplace's seller. */
export const unitKinds = ['platform', 'entity', 'partner', 'holding', 'merchant', 'region', 'store', 'seller'] as const;
export type UnitKind = (typeof unitKinds)[number];

/**
 * One organisational unit. A unit sees and steers its subtree: the flows of every unit below it are its
 * flows, and the policies it sets apply below it unless a lower unit overrides, narrows or blocks them.
 * `blockInheritance` stops policies of the units above, except the enforced ones.
 */
export type Unit = {
  id: string;
  parentId: string | null;
  kind: UnitKind;
  name: LocalisedText;
  code: string;
  country: string;
  currency: Currency;
  status: 'active' | 'onboarding' | 'suspended';
  blockInheritance: boolean;
  mcc: string | null;
  channel: Channel | null;
  createdAt: string;
};
