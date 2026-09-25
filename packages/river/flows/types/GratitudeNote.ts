import type { Locale } from '@river/i18n';

/** A recipient's thanks (`orgs/{org}/gratitude/{id}`, visibility `private`); shared only as consented. */
export type GratitudeNote = {
  id: string;
  needId: string;
  flowId: string;
  locale: Locale;
  text: string;
  shareWithParticipants: boolean;
  showOnWall: boolean;
  writtenAt: string;
};
