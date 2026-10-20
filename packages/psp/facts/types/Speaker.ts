/**
 * Who gives a fact to the river (adr/records/ADR-0025): a person at the door (payer, merchant,
 * operator, an integrator's server), a figure of the machine (risk, routing, split), or the world
 * beyond the bank (an issuer, a bank, a wallet, a chain, a kiosk network, the clock).
 */
export type Speaker = 'door' | 'figure' | 'world';
