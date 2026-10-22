import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { acquirers, findInstrument } from '@river/psp-instruments';
import type { PolicyDefinition, PolicyValue } from '@river/psp-units';
import { money, percent } from './format';
import { lt } from './lt';

const enumWords: Record<string, [string, string]> = {
  risk_based: ['by risk, with exemptions', 'за ризиком, з винятками'], always: ['always challenge', 'завжди запитувати'],
  auto: ['at once', 'одразу'], manual: ['later: after picking or at shipment', 'пізніше: після комплектації чи при відвантаженні'],
  approval_first: ['approval first', 'спершу схвалення'], least_cost: ['least cost', 'найменша вартість'], on_us_first: ['on-us first', 'спершу on-us'],
  'T+0': ['the same day', 'того ж дня'], 'T+1': ['next day (T+1)', 'наступного дня (T+1)'], 'T+2': ['in two days (T+2)', 'через два дні (T+2)'], weekly: ['weekly', 'щотижня'],
  direct: ['direct', 'напряму'], marketplace: ['marketplace', 'маркетплейс'], agency: ['agency', 'агентська схема'], franchise: ['franchise', 'франшиза'],
  propose: ['propose only', 'лише пропонувати'], act_low_risk: ['carry out low-risk proposals alone', 'виконувати низькоризикові самостійно'],
};

/** A policy's value as people read it: money in the unit's currency, shares as percentages, lists by name. */
export function policyText(definition: PolicyDefinition, value: PolicyValue, locale: Locale, currency: string, unitName: (id: string) => string): string {
  const t = lt(locale);
  if (value === null || value === undefined) return t('no limit', 'без обмеження');
  switch (definition.kind) {
    case 'money': return typeof value === 'number' ? money(value, currency, locale) : String(value);
    case 'percent': return typeof value === 'number' ? percent(value, locale, value % 100 === 0 ? 0 : 1) : String(value);
    case 'boolean': return value === true ? t('yes', 'так') : t('no', 'ні');
    case 'enum': {
      if (definition.key === 'settlement.model') return value === 'direct' ? t('banks settle to the merchant directly', 'банки розраховуються з мерчантом напряму') : t('the platform holds the money', 'кошти тримає платформа');
      if (definition.key === 'pos.acquirer') return pickText(acquirers.find((a) => a.id === value)?.label, locale) || String(value);
      const w = enumWords[String(value)];
      return w ? t(w[0], w[1]) : String(value);
    }
    case 'text': return definition.key === 'split.charity.recipient' ? unitName(String(value)) : String(value);
    case 'colour': return String(value);
    case 'number': {
      const n = String(value);
      return definition.measure === 'days' ? t(`${n} days`, `${n} дн.`) : definition.measure === 'minutes' ? t(`${n} minutes`, `${n} хв`) : definition.measure === 'score' ? t(`score ${n}`, `бал ${n}`) : n;
    }
    case 'list': {
      const items = Array.isArray(value) ? value.map(String) : [];
      if (items.length === 0) return t('none', 'немає');
      if (definition.key.startsWith('instruments.') || definition.key === 'checkout.instrumentOrder') return items.map((i) => { try { return pickText(findInstrument(i).label, locale); } catch { return i; } }).join(', ');
      if (definition.key === 'agents.enabled') return items.map((i) => pickText(agentCatalogue.find((a) => a.id === i)?.name, locale) || i).join(', ');
      if (definition.key === 'checkout.languages') return items.map((l) => (l === 'uk' ? 'українська' : 'English')).join(', ');
      if (definition.key === 'invoices.reminders') return items.map((d) => (Number(d) > 0 ? `+${d}` : d)).join(', ') + t(' days', ' дн.');
      return items.join(', ');
    }
  }
}
