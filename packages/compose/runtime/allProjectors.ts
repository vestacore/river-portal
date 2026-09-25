import { contentProjector } from '@river/content';
import { feedProjector } from '@river/feed';
import { flowProjector } from '@river/flows';
import { campaignProjector, giftProjector } from '@river/gifts';
import type { Projector } from '@river/log';
import { needProjector } from '@river/needs';
import { campaignPageProjector, sitePageProjector } from '@river/pages';
import { reportProjector } from '@river/reports';

/**
 * Projectors in dependency order: domain views first, then publications, then page documents,
 * which read the documents written before them in the same transaction.
 */
export function allProjectors(): readonly Projector[] {
  return [
    needProjector, giftProjector, campaignProjector, flowProjector,
    contentProjector, reportProjector, feedProjector,
    sitePageProjector, campaignPageProjector,
  ];
}
