/**
 * Who gave a fact to the river (adr/records/ADR-0025). Three participants, never confused:
 * a person at the door, a figure of the machine, or the world beyond the bank — a provider, a clock.
 * `answering` is the sequence number of the intention a world fact answers, when it answers one.
 */
export type Origin =
  | { via: 'door'; actor: string; role: string }
  | { via: 'figure'; by: string }
  | { via: 'world'; controller: string; answering: number | null };
