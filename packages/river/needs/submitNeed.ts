import { hashToken, newId, newToken } from '@river/kernel';
import { commit, type CommandEnv } from '@river/log';
import { needPaths } from './paths.ts';
import type { NeedInput } from './types/NeedInput.ts';
import type { NeedPrivate } from './types/NeedPrivate.ts';
import type { NeedSubmittedPayload } from './types/NeedSubmittedPayload.ts';

/**
 * Records a request for help. Access is always open (spec ADR-005): no account, no history check.
 * Personal details go to a `private` document, never into the log. The request is acknowledged
 * automatically at once (spec: Canonical Parameters, under 1 hour).
 * Returns the tracking token, shown to the recipient exactly once.
 */
export async function submitNeed(env: CommandEnv, input: NeedInput): Promise<{ needId: string; trackingToken: string }> {
  const at = env.ctx.at ? new Date(env.ctx.at) : new Date();
  const needId = newId('need', at);
  const personId = newId('person', at);
  const trackingToken = newToken();
  const aggregate = { kind: 'need', id: needId };
  const details: NeedPrivate = {
    needId,
    personId,
    name: input.name,
    contactChannel: input.contactChannel,
    contactValue: input.contactValue,
    settlement: input.settlement,
    description: input.description,
  };

  await commit(
    env,
    [
      {
        type: 'need.Submitted',
        aggregate,
        visibility: 'team',
        payload: {
          personId,
          categoryId: input.categoryId,
          form: input.form,
          oblastId: input.oblastId,
          forWhom: input.forWhom,
          householdSize: input.householdSize,
          urgency: input.urgency,
          locale: input.locale,
          consentToStory: input.consentToStory,
        } satisfies NeedSubmittedPayload,
      },
      { type: 'need.Acknowledged', aggregate, visibility: 'team', payload: { automatic: true } },
    ],
    (tx) => {
      tx.set(needPaths.private(env.ctx.orgId, needId), details);
      tx.set(needPaths.tracking(env.ctx.orgId, hashToken(trackingToken)), { needId });
    },
  );
  return { needId, trackingToken };
}
