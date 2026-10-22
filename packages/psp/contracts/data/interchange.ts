/**
 * Interchange and scheme fees of the demo, in basis points. These are assumptions for the stand, not
 * published rates: in Ukraine the domestic interchange of consumer cards is capped at 1.2 % (since 26
 * November 2021, by the National Bank's memorandum with Visa and Mastercard); commercial and cross-border
 * cards are not under the cap; ПРОСТІР is the national scheme. Real rates come from the schemes' tables and
 * the acquirer's IC++ reports.
 */
export const interchangeBps = {
  domestic: { debit: 90, credit: 110, premium: 120, commercial: 180, other: 110 } as Record<string, number>,
  prostir: 60,
  crossBorder: 180,
} as const;

export const schemeFeeBps: Record<string, number> = { visa: 12, mastercard: 12, prostir: 5, amex: 0, other: 12 };
