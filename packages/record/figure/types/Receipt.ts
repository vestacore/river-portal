import type { Fact } from '@river/stream';

/**
 * What one settle returned: the fragment it wrote, and the intentions in it that a controller
 * claimed (they now wait in the outbox). `duplicate` is true when the same act had already entered.
 */
export type Receipt = {
  stream: string;
  wave: number;
  facts: Fact[];
  intentions: Array<{ controller: string; seq: number }>;
  duplicate: boolean;
};
