import type { LocalisedText } from '@river/i18n';

/**
 * One line of an order. `sellerUnitId` names the marketplace seller whose goods these are (a unit of
 * the hierarchy), or null when the merchant sells its own. Amounts are minor units.
 */
export type OrderLine = {
  sku: string;
  title: Partial<LocalisedText>;
  quantity: number;
  unitMinor: number;
  totalMinor: number;
  sellerUnitId: string | null;
};
