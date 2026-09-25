import type { Locale } from '@river/i18n';
import type { RecipientKind } from '@river/privacy';
import type { ContactChannel } from './ContactChannel.ts';
import type { HelpForm } from './HelpForm.ts';
import type { Urgency } from './Urgency.ts';

/** A validated request for help, as submitted through the help-seeker form. */
export type NeedInput = {
  categoryId: string;
  form: HelpForm;
  description: string;
  oblastId: string;
  settlement: string;
  forWhom: RecipientKind;
  householdSize: number | null;
  urgency: Urgency;
  name: string;
  contactChannel: ContactChannel;
  contactValue: string;
  locale: Locale;
  consentToStory: boolean;
};
