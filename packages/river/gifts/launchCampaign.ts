import { newId, slugify } from '@river/kernel';
import { commit, type CommandEnv } from '@river/log';
import type { CampaignInput } from './types/CampaignInput.ts';
import type { CampaignLaunchedPayload } from './types/CampaignLaunchedPayload.ts';

/** Opens a campaign: a time- and purpose-bound collection, e.g. transport costs for one run. */
export async function launchCampaign(env: CommandEnv, input: CampaignInput): Promise<string> {
  const campaignId = newId('campaign', env.ctx.at ? new Date(env.ctx.at) : new Date());
  const payload: CampaignLaunchedPayload = { ...input, slug: input.slug ?? slugify(input.title['en-GB']) };
  await commit(env, [{ type: 'campaign.Launched', aggregate: { kind: 'campaign', id: campaignId }, visibility: 'public', payload }]);
  return campaignId;
}
