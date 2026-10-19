/** What the person on the simulated provider's page chose. */
export const simulatedOutcomes = ['paid', 'declined'] as const;
export type SimulatedOutcome = (typeof simulatedOutcomes)[number];
