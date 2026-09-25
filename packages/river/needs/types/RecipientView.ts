import type { Locale } from '@river/i18n';
import type { HelpForm } from './HelpForm.ts';
import type { NeedStatus } from './NeedStatus.ts';
import type { TimelineEntry } from './TimelineEntry.ts';

/** What a recipient sees through their tracking link. */
export type RecipientView = {
  needId: string;
  status: NeedStatus;
  categoryId: string;
  form: HelpForm;
  locale: Locale;
  submittedAt: string;
  timeline: TimelineEntry[];
  canConfirm: boolean;
};
