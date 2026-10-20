import type { LocalisedText } from '@river/i18n';
import { refundReasonLabels } from './data/reasonLabels.ts';
import { refundReasons, type RefundReason } from './types/Reasons.ts';

/** A refund's reason in both languages: the label of its code, or a person's own words as typed. */
export function refundReasonText(reason: string): LocalisedText {
  return (refundReasons as readonly string[]).includes(reason) ? refundReasonLabels[reason as RefundReason] : { 'en-GB': reason, uk: reason };
}
