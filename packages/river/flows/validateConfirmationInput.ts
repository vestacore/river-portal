import { locales, type Locale } from '@river/i18n';
import type { Result } from '@river/kernel';
import type { ConfirmationInput } from './types/ConfirmationInput.ts';

/** Validates the recipient's confirmation form. Thanks are optional; consents are off unless ticked. */
export function validateConfirmationInput(raw: Record<string, string | undefined>, needId: string): Result<ConfirmationInput> {
  if (raw.received !== 'on') return { ok: false, errors: [{ field: 'received', code: 'received' }] };
  const locale = (locales as readonly string[]).includes(raw.locale ?? '') ? (raw.locale as Locale) : 'en-GB';
  return {
    ok: true,
    value: {
      needId,
      by: 'recipient',
      note: (raw.note ?? '').trim().slice(0, 500),
      thanks: (raw.thanks ?? '').trim().slice(0, 1000),
      shareWithParticipants: raw.shareWithParticipants === 'on',
      showOnWall: raw.showOnWall === 'on',
      locale,
    },
  };
}
