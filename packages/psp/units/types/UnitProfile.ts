import type { LocalisedText } from '@river/i18n';

/**
 * A unit's datasheet — what onboarding and contracts need to know about it. Demo values are invented;
 * registration codes follow the shape of the Ukrainian EDRPOU (8 digits) or an EU company code.
 */
export type UnitProfile = {
  unitId: string;
  legalName: LocalisedText;
  registrationCode: string;
  registeredAt: string;
  legalAddress: LocalisedText;
  website: string | null;
  supportEmail: string;
  supportPhone: string;
  iban: string | null;
  bank: string | null;
  contact: { initials: string; role: LocalisedText };
};
