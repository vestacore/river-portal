import type { LocalisedText } from '@river/i18n';
import type { SessionOutcome } from '../types/SessionOutcome.ts';

export const sessionOutcomeLabels: Record<SessionOutcome, LocalisedText> = {
  open: { 'en-GB': 'In progress', uk: 'Триває' },
  review: { 'en-GB': 'On review', uk: 'На перевірці' },
  awaiting_consent: { 'en-GB': 'Waiting for the payer', uk: 'Чекає на платника' },
  awaiting_funds: { 'en-GB': 'Waiting for funds', uk: 'Чекає на кошти' },
  awaiting_capture: { 'en-GB': 'Waiting for capture', uk: 'Чекає на списання' },
  succeeded: { 'en-GB': 'Succeeded', uk: 'Успішно' },
  failed: { 'en-GB': 'Failed', uk: 'Невдало' },
  abandoned: { 'en-GB': 'Abandoned', uk: 'Покинуто' },
  expired: { 'en-GB': 'Expired', uk: 'Сплило' },
};
