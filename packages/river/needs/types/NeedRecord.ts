import type { Locale } from '@river/i18n';
import type { RecipientKind } from '@river/privacy';
import type { HelpForm } from './HelpForm.ts';
import type { NeedStatus } from './NeedStatus.ts';
import type { TimelineEntry } from './TimelineEntry.ts';
import type { Urgency } from './Urgency.ts';

/** The team view of a need (`orgs/{org}/needs/{id}`, visibility `team`). No contact details. */
export type NeedRecord = {
  id: string;
  status: NeedStatus;
  categoryId: string;
  form: HelpForm;
  oblastId: string;
  forWhom: RecipientKind;
  householdSize: number | null;
  urgency: Urgency;
  locale: Locale;
  personId: string;
  summary: string;
  consentToStory: boolean;
  flowId: string | null;
  submittedAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
};
