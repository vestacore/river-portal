import type { FactDraft } from '@river/stream';

/**
 * A bridge (NestVM: a bind descriptor). It demands the states of named listeners and, once every
 * one of them is ready — the barrier — emits facts with a pure function of that scope. It fires
 * once per round: by default once per stream; `round` names a further crossing (a retry, an attempt).
 */
export type Joiner<Scope> = {
  id: string;
  demands: { readonly [K in keyof Scope]: string };
  round?: (scope: Scope) => string;
  emit: (scope: Scope) => readonly FactDraft[];
};
