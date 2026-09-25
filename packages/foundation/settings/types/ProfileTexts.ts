import type { LocalisedText } from '@river/i18n';

/** A way to reach the organisation other than the web form. */
export type ChannelEntry = { kind: 'phone' | 'viber' | 'telegram' | 'whatsapp' | 'email' | 'visit'; label: LocalisedText; value: string };

/** Another service a person can turn to when this organisation cannot help. */
export type ReferralEntry = { name: LocalisedText; description: LocalisedText; contact: string };

/** A place where goods can be dropped off. */
export type DropOffEntry = { place: LocalisedText; hours: LocalisedText };

/** A partner organisation shown publicly (with its consent). */
export type PartnerEntry = { name: string; url: string; role: LocalisedText };

/** The bilingual texts that give each profile its example identity. Every value is fictional. */
export type ProfileTexts = {
  label: LocalisedText;
  description: LocalisedText;
  orgName: LocalisedText;
  tagline: LocalisedText;
  scope: LocalisedText;
  legalName: LocalisedText;
  registration: LocalisedText;
  address: LocalisedText;
  hours: LocalisedText;
  privacyAuthority: LocalisedText;
  emergency: LocalisedText;
  channels: ChannelEntry[];
  referrals: ReferralEntry[];
  givingInstructions: LocalisedText;
  dropOff: DropOffEntry[];
  partners: PartnerEntry[];
};
