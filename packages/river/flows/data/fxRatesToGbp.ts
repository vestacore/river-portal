/**
 * Default conversion rates to GBP offered to coordinators (editable per cost). The rate used is
 * recorded on the event, so reports never change when defaults change.
 */
export const fxRatesToGbp: Readonly<Record<string, number>> = { GBP: 1, EUR: 0.85, PLN: 0.2, UAH: 0.019, USD: 0.75 };
