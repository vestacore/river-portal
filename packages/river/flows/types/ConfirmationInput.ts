import type { Locale } from '@river/i18n';

/** A recipient's confirmation of receipt, with optional thanks and specific consents. */
export type ConfirmationInput = {
  needId: string;
  by: 'recipient' | 'proxy' | 'carrier';
  note: string;
  thanks: string;
  shareWithParticipants: boolean;
  showOnWall: boolean;
  locale: Locale;
};
