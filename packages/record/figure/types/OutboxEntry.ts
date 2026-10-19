/** One intention waiting for its controller. Written with the intention, in the same transaction. */
export type OutboxEntry = {
  controller: string;
  stream: string;
  seq: number;
  type: string;
  status: 'pending' | 'done';
  attempts: number;
  lastError: string | null;
  at: string;
};
