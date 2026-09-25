import { hashToken } from '@river/kernel';
import type { DocStore } from '@river/store';
import { needPaths } from './paths.ts';
import type { NeedRecord } from './types/NeedRecord.ts';
import type { RecipientView } from './types/RecipientView.ts';

/** Resolves a tracking token to the recipient's view of their request; null for unknown tokens. */
export async function readRecipientView(store: DocStore, orgId: string, token: string): Promise<RecipientView | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const link = await store.get<{ needId: string }>(needPaths.tracking(orgId, hashToken(token)));
  if (!link) return null;
  const record = await store.get<NeedRecord>(needPaths.record(orgId, link.needId));
  if (!record) return null;
  return {
    needId: record.id,
    status: record.status,
    categoryId: record.categoryId,
    form: record.form,
    locale: record.locale,
    submittedAt: record.submittedAt,
    timeline: record.timeline,
    canConfirm: record.status === 'in_delivery' || record.status === 'delivered',
  };
}
