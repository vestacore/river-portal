import { commit, type CommandEnv } from '@river/log';

/** A coordinator confirms that pledged money arrived or goods are in hand. */
export async function markGiftReceived(env: CommandEnv, input: { giftId: string }): Promise<void> {
  await commit(env, [{ type: 'gift.Received', aggregate: { kind: 'gift', id: input.giftId }, visibility: 'team', payload: {} }]);
}
