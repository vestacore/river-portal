import type { Locale } from '@river/i18n';
import { lt } from '../lt';

/**
 * Why a routing decision chose its acquirer, in one line — read from the rule the decision recorded:
 * a route rule, on-us first, least cost, the fallback to approval first, or the shares by weight.
 */
export function ruleText(rule: string, locale: Locale, name: (acquirerId: string) => string): string {
  const t = lt(locale);
  if (rule.startsWith('rule:route→')) {
    const target = name(rule.slice('rule:route→'.length));
    return t(`A route rule of the unit sends these attempts to ${target}; the strategy and the threshold do not apply.`, `Правило маршруту одиниці спрямовує ці спроби до «${target}»; стратегія і поріг тут не діють.`);
  }
  if (rule === 'on-us') return t('On-us first: this acquirer belongs to the bank that issued the card, your terms with it price the card, and its approval rate meets the threshold.', 'Спершу on-us: цей еквайр належить банку, що випустив картку, ваші умови з ним її передбачають, і його рівень схвалення не нижчий за поріг.');
  if (rule === 'least-cost:on-us') return t('Least cost: the lowest expected fee among the acquirers that meet the threshold — here the card’s own bank.', 'Найменша вартість: найнижча очікувана комісія серед еквайрів, що проходять поріг, — тут це банк самої картки.');
  if (rule === 'least-cost') return t('Least cost: the lowest expected fee among the acquirers that meet the threshold.', 'Найменша вартість: найнижча очікувана комісія серед еквайрів, що проходять поріг.');
  if (rule === 'fallback:approval-first') return t('No acquirer qualified on cost — none priced the card at or above the threshold — so approval first decided.', 'Жоден еквайр не пройшов за вартістю — ніхто не мав ціни для картки за рівня схвалення не нижче порогу, — тож вирішило «Спершу схвалення».');
  if (rule.startsWith('weights:')) {
    const shares = rule.slice('weights:'.length).split('/').join(' / ');
    return t(`Approval first, by the weights set for the entity (${shares}); the session id decides the share, so a replay routes the same way.`, `Спершу схвалення, за вагами, заданими для юрособи (${shares}); частку визначає ідентифікатор сесії, тож повтор маршрутизує так само.`);
  }
  if (rule === 'best-approval-first') return t('Approval first: the acquirer with the best approval rate takes 65 % of the traffic; the session id decides the share, so a replay routes the same way.', 'Спершу схвалення: еквайр із найкращим рівнем схвалення отримує 65 % трафіку; частку визначає ідентифікатор сесії, тож повтор маршрутизує так само.');
  return rule;
}
