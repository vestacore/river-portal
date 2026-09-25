import { isOblast, locales, type Locale } from '@river/i18n';
import type { FieldError, Result } from '@river/kernel';
import { recipientKinds, type RecipientKind } from '@river/privacy';
import { findCategory } from './findCategory.ts';
import { contactChannels, type ContactChannel } from './types/ContactChannel.ts';
import { helpForms, type HelpForm } from './types/HelpForm.ts';
import type { NeedInput } from './types/NeedInput.ts';
import { urgencies, type Urgency } from './types/Urgency.ts';

const oneOf = <T extends string>(list: readonly T[], value: string | undefined): value is T =>
  value !== undefined && (list as readonly string[]).includes(value);

/**
 * Validates the help-seeker form. Asks only what is needed to deliver help (spec: Data Minimisation).
 * Error codes map to dictionary keys `ask.errors.<code>`.
 */
export function validateNeedInput(raw: Record<string, string | undefined>): Result<NeedInput> {
  const errors: FieldError[] = [];
  const text = (key: string, max: number) => (raw[key] ?? '').trim().slice(0, max);

  const categoryId = text('categoryId', 40);
  if (!findCategory(categoryId)) errors.push({ field: 'categoryId', code: 'category' });
  const form = raw.form;
  if (!oneOf<HelpForm>(helpForms, form)) errors.push({ field: 'form', code: 'form' });
  const description = text('description', 2000);
  if (description.length < 5) errors.push({ field: 'description', code: 'description' });
  const oblastId = text('oblastId', 40);
  if (!isOblast(oblastId)) errors.push({ field: 'oblastId', code: 'oblast' });
  const settlement = text('settlement', 120);
  if (settlement.length < 2) errors.push({ field: 'settlement', code: 'settlement' });
  const forWhom = raw.forWhom;
  if (!oneOf<RecipientKind>(recipientKinds, forWhom)) errors.push({ field: 'forWhom', code: 'forWhom' });
  const urgency = raw.urgency;
  if (!oneOf<Urgency>(urgencies, urgency)) errors.push({ field: 'urgency', code: 'urgency' });
  const sizeText = text('householdSize', 4);
  const householdSize = sizeText === '' ? null : Number.parseInt(sizeText, 10);
  if (householdSize !== null && (!Number.isFinite(householdSize) || householdSize < 1 || householdSize > 500)) {
    errors.push({ field: 'householdSize', code: 'householdSize' });
  }
  const name = text('name', 80);
  if (name.length < 1) errors.push({ field: 'name', code: 'name' });
  const contactChannel = raw.contactChannel;
  if (!oneOf<ContactChannel>(contactChannels, contactChannel)) errors.push({ field: 'contactChannel', code: 'contactChannel' });
  const contactValue = text('contactValue', 120);
  const contactOk =
    contactChannel === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue) : contactValue.replace(/\D/g, '').length >= 7 || contactValue.startsWith('@');
  if (!contactOk) errors.push({ field: 'contactValue', code: 'contactValue' });
  if (raw.consentToContact !== 'on') errors.push({ field: 'consentToContact', code: 'consentToContact' });
  const locale = oneOf<Locale>(locales, raw.locale) ? raw.locale : 'en-GB';

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      categoryId,
      form: form as HelpForm,
      description,
      oblastId,
      settlement,
      forWhom: forWhom as RecipientKind,
      householdSize,
      urgency: urgency as Urgency,
      name,
      contactChannel: contactChannel as ContactChannel,
      contactValue,
      locale: locale as Locale,
      consentToStory: raw.consentToStory === 'on',
    },
  };
}
