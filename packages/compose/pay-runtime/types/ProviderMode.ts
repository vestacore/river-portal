/**
 * How a provider is mounted: not at all, as a deterministic stand-in that moves no money, or
 * connected to the provider's own API (its test mode or sandbox, unless live is explicitly allowed).
 */
export const providerModes = ['off', 'simulated', 'connected'] as const;
export type ProviderMode = (typeof providerModes)[number];
