import type { LocalisedText } from '@river/i18n';

/** How an acquirer prices a merchant's card payments. */
export const acquiringModels = ['blended', 'ic_plus_plus'] as const;
export type AcquiringModel = (typeof acquiringModels)[number];

/**
 * A merchant's terms with one acquirer, for one channel. `blended`: one rate for every card. `ic_plus_plus`:
 * the card's interchange and the scheme's fee pass through at cost, and the acquirer adds its markup. An
 * on-us clause prices cards of the acquirer's own bank separately — the bank is on both sides of such a
 * payment and pays no interchange to another bank; without the clause the merchant pays the usual rate.
 */
export type AcquiringTerms = {
  id: string;
  acquirerId: string;
  merchantId: string;
  channel: 'online' | 'in_store';
  model: AcquiringModel;
  blendedBps: number | null;
  markupBps: number | null;
  fixedMinor: number;
  onUsBps: number | null;
  contractId: string | null;
  note: LocalisedText;
};

/** What routing and pricing know of a card, as the contracts read it. */
export type PricedCard = { scheme: string; product: string; domestic: boolean; onUs: boolean };

/** The cost of one card payment under a merchant's acquiring terms, by component where the model shows them. */
export type AcquiringCost = {
  model: AcquiringModel | 'on_us';
  interchangeMinor: number | null;
  schemeMinor: number | null;
  markupMinor: number | null;
  totalMinor: number;
};
