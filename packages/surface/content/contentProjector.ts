import type { Locale } from '@river/i18n';
import type { Projector } from '@river/log';
import type { ContentBlock } from './types/ContentBlock.ts';
import type { RichDoc } from './types/RichDoc.ts';

/** Keeps the latest version of each edited block. */
export const contentProjector: Projector = {
  name: 'content',
  handles: ['content.BlockEdited'],
  async project(event, tx) {
    const p = event.payload as { blockId: string; locale: Locale; doc: RichDoc; html: string };
    const path = `orgs/${event.orgId}/content/${p.blockId}`;
    const block = (await tx.get<ContentBlock>(path)) ?? { id: p.blockId, text: {}, updatedAt: event.occurredAt, updatedBy: '' };
    block.text[p.locale] = { doc: p.doc, html: p.html };
    block.updatedAt = event.occurredAt;
    block.updatedBy = event.actor.label ?? event.actor.role;
    tx.set(path, block);
  },
};
