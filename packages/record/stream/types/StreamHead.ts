/** The head of one stream: the next free sequence number and how many waves it has settled. */
export type StreamHead = {
  stream: string;
  nextSeq: number;
  waves: number;
  updatedAt: string | null;
};
