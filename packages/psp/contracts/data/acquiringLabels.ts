import type { LocalisedText } from '@river/i18n';
import type { AcquiringModel } from '../types/Acquiring.ts';

export const acquiringModelLabels: Record<AcquiringModel | 'on_us', LocalisedText> = {
  blended: { 'en-GB': 'Blended rate', uk: 'Єдина ставка' },
  ic_plus_plus: { 'en-GB': 'Interchange++', uk: 'Interchange++' },
  on_us: { 'en-GB': 'On-us rate', uk: 'Ставка on-us' },
};
