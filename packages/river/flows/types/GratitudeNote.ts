import type { Locale } from '@river/i18n';

/** A recipient's thanks (`orgs/{org}/gratitude/{id}`, visibility `private`); shared only as consented. */
export type GratitudeNote = {
  id: string;
  needId: string;
  flowId: string;
  locale: Locale;
  text: string;
  /** The thanks as givers and carriers see it: names and places removed when it was written. */
  sharedText: string | null;
  shareWithParticipants: boolean;
  showOnWall: boolean;
  writtenAt: string;
};
