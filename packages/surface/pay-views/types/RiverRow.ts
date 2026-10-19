/**
 * One fact of an order's stream, as a row to read. `kind` says what the fact is in the anatomy of
 * the river: a person's gesture at the door, a figure's own step, an intention a figure hands to the
 * bank, the bank's answer to an intention, or a report the world sent unasked (a webhook, a clock).
 */
export type RiverRow = {
  seq: number;
  wave: number;
  at: string;
  type: string;
  kind: 'gesture' | 'figure' | 'intention' | 'answer' | 'report';
  who: string;
  causedBy: number | null;
  answering: number | null;
  payload: Record<string, unknown>;
};
