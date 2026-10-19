import type { Assembly } from '@river/figure';
import type { FetchLike } from '@river/pay-providers';
import type { DocStore } from '@river/store';
import type { FunctionCall } from './FunctionCall.ts';
import type { PayConfig } from './PayConfig.ts';

/**
 * Everything a cabinet or a function needs at run time. `wire` is the way out to the providers when
 * it is not the platform's own `fetch`, and `call` the way to another function of the river (tests
 * hand in theirs). `demoPayKeys` exists only for seeded demo orders, so testers can open an invoice
 * by its link; a real pay key is shown once, never kept.
 */
export type PayRuntime = {
  config: PayConfig;
  store: DocStore;
  root: string;
  assembly: Assembly;
  wire: FetchLike | null;
  call: FunctionCall;
  demoPayKeys: Record<string, string>;
};
