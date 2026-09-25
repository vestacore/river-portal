import type { FieldError, Result } from '@river/kernel';
import { giftKinds, type GiftKind } from './types/GiftKind.ts';
import type { PledgeInput } from './types/PledgeInput.ts';

/** Validates the "give" form. Money is pledged in GBP in iteration 1; goods need a description. */
export function validatePledgeInput(raw: Record<string, string | undefined>): Result<PledgeInput> {
  const errors: FieldError[] = [];
  const kind = raw.kind as GiftKind;
  if (!giftKinds.includes(kind)) errors.push({ field: 'kind', code: 'kind' });
  let amountMinor: number | null = null;
  if (kind === 'money') {
    const pounds = Number.parseFloat((raw.amount ?? '').replace(',', '.'));
    if (!Number.isFinite(pounds) || pounds < 1 || pounds > 100_000) errors.push({ field: 'amount', code: 'amount' });
    else amountMinor = Math.round(pounds * 100);
  }
  const description = (raw.description ?? '').trim().slice(0, 1000);
  if (kind !== 'money' && description.length < 3) errors.push({ field: 'description', code: 'description' });
  const name = (raw.name ?? '').trim().slice(0, 80);
  if (name.length < 1) errors.push({ field: 'name', code: 'name' });
  const email = (raw.email ?? '').trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ field: 'email', code: 'email' });
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      kind,
      amountMinor,
      description,
      campaignId: raw.campaignId?.trim() || null,
      name,
      email,
      giverDisplay: raw.showFirstName === 'on' ? 'first_name' : 'anonymous',
    },
  };
}
