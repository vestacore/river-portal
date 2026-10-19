/** External payment providers the river can route to. They move the money; the river records and routes. */
export const providerNames = ['stripe', 'paypal'] as const;
export type ProviderName = (typeof providerNames)[number];
