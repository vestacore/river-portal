import { listOblasts } from '@river/i18n';
import type { Profile } from '../types/Profile.ts';
import type { ProfileId } from '../types/ProfileId.ts';
import type { SettingValue } from '../types/SettingValue.ts';
import { profileTexts } from './profileTexts.ts';

const allOblasts = listOblasts('en-GB').map((o) => o.id);
const allKinds = ['food', 'medicine', 'energy', 'shelter', 'hygiene', 'clothing', 'children', 'mobility', 'education', 'transport', 'other'];
const uahRates = [{ currency: 'UAH', rate: '1' }, { currency: 'GBP', rate: '52' }, { currency: 'EUR', rate: '45' }, { currency: 'USD', rate: '41' }, { currency: 'PLN', rate: '10.5' }];

function texts(id: ProfileId): Record<string, SettingValue> {
  const p = profileTexts[id];
  return {
    'org.name': p.orgName, 'org.tagline': p.tagline, 'org.scope': p.scope, 'org.legalName': p.legalName, 'org.registration': p.registration,
    'org.partners': p.partners, 'org.privacyAuthority': p.privacyAuthority, 'contact.address': p.address, 'contact.hours': p.hours,
    'help.emergency': p.emergency, 'help.channels': p.channels, 'help.referrals': p.referrals,
    'giving.instructions': p.givingInstructions, 'giving.dropOff': p.dropOff,
  };
}

/** The three profiles. Structural values here; example identity texts in profileTexts.ts. */
export const profiles: Record<ProfileId, Profile> = {
  'state-programme': {
    id: 'state-programme', label: profileTexts['state-programme'].label, description: profileTexts['state-programme'].description,
    values: {
      ...texts('state-programme'),
      'org.foundedYear': 2024, 'org.areasServed': allOblasts, 'org.helpKinds': allKinds,
      'contact.email': 'hello@one-river.example.org', 'contact.phone': '0 800 000 000', 'contact.pressEmail': 'press@one-river.example.org',
      'help.replyWithinDays': 3, 'giving.suggestedAmounts': [200, 500, 1000, 5000],
      'money.reportingCurrency': 'UAH', 'money.fxRates': uahRates, 'money.costApprovalLimit': 5_000_000,
      'publication.safetyDelayDays': 21,
      'home.sections': ['hero', 'trust', 'doors', 'counters', 'how', 'campaigns', 'reports', 'feed', 'thanks', 'about'],
      'appearance.accent': '#f2c230',
    },
  },
  'city-foundation': {
    id: 'city-foundation', label: profileTexts['city-foundation'].label, description: profileTexts['city-foundation'].description,
    values: {
      ...texts('city-foundation'),
      'org.foundedYear': 2022, 'org.areasServed': ['dnipropetrovsk'], 'org.helpKinds': ['food', 'medicine', 'energy', 'shelter', 'hygiene', 'children', 'mobility'],
      'contact.email': 'hello@warm-bridge.example.org', 'contact.phone': '+380 00 000 00 00', 'contact.pressEmail': 'press@warm-bridge.example.org',
      'help.replyWithinDays': 2, 'giving.kinds': ['money', 'goods', 'time', 'transport'], 'giving.suggestedAmounts': [100, 250, 500, 1000],
      'money.reportingCurrency': 'UAH', 'money.fxRates': uahRates, 'money.costApprovalLimit': 1_000_000,
      'home.sections': ['hero', 'doors', 'trust', 'counters', 'campaigns', 'how', 'feed', 'thanks', 'reports', 'about'],
      'appearance.accent': '#5cc4b8',
    },
  },
  'small-nationwide': {
    id: 'small-nationwide', label: profileTexts['small-nationwide'].label, description: profileTexts['small-nationwide'].description,
    values: {
      ...texts('small-nationwide'),
      'org.foundedYear': 2022, 'org.areasServed': ['kharkiv', 'sumy', 'kherson', 'zaporizhzhia', 'dnipropetrovsk', 'donetsk', 'mykolaiv'], 'org.helpKinds': allKinds,
      'contact.email': 'hello@openriver.example.org', 'contact.phone': '+44 0000 000000', 'contact.pressEmail': 'press@openriver.example.org',
      'help.replyWithinDays': 2, 'giving.suggestedAmounts': [10, 25, 50, 100],
      'money.reportingCurrency': 'GBP', 'money.fxRates': [{ currency: 'GBP', rate: '1' }, { currency: 'EUR', rate: '0.85' }, { currency: 'PLN', rate: '0.2' }, { currency: 'UAH', rate: '0.019' }, { currency: 'USD', rate: '0.75' }],
      'money.costApprovalLimit': 25_000,
      'appearance.accent': '#f0962a',
    },
  },
};
