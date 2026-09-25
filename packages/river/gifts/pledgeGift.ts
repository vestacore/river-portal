import { newId } from '@river/kernel';
import { commit, type CommandEnv } from '@river/log';
import { redactPii } from '@river/privacy';
import { settingText } from '@river/settings';
import { giftPaths } from './paths.ts';
import type { GiftPledgedPayload } from './types/GiftPledgedPayload.ts';
import type { PledgeInput } from './types/PledgeInput.ts';

/** Records an offer that has been accepted as a pledge. Giver contact details stay private. */
export async function pledgeGift(env: CommandEnv, input: PledgeInput): Promise<string> {
  const giftId = newId('gift', env.ctx.at ? new Date(env.ctx.at) : new Date());
  const payload: GiftPledgedPayload = {
    kind: input.kind,
    amountMinor: input.amountMinor,
    currency: input.kind === 'money' ? settingText(env.settings, 'money.reportingCurrency') : null,
    description: redactPii(input.description, [input.name]),
    campaignId: input.campaignId,
    giverDisplay: input.giverDisplay,
    displayName: input.giverDisplay === 'first_name' ? (input.name.split(/\s+/)[0] ?? null) : null,
    giverId: input.giverId ?? null,
  };
  await commit(env, [{ type: 'gift.Pledged', aggregate: { kind: 'gift', id: giftId }, visibility: 'team', payload }], (tx) =>
    tx.set(giftPaths.giverPrivate(env.ctx.orgId, giftId), { giftId, name: input.name, email: input.email }),
  );
  return giftId;
}
