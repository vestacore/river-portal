import type { Locale } from '@river/i18n';
import type { RecipientKind } from '@river/privacy';
import type { HelpForm } from './HelpForm.ts';
import type { Urgency } from './Urgency.ts';

/** Payload of `need.Submitted` (visibility `team`; no personal details). */
export type NeedSubmittedPayload = {
  personId: string;
  categoryId: string;
  form: HelpForm;
  oblastId: string;
  forWhom: RecipientKind;
  householdSize: number | null;
  urgency: Urgency;
  locale: Locale;
  consentToStory: boolean;
};
