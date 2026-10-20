import type { RiskRule } from '@river/psp-risk';
import type { PolicySetting } from '@river/psp-units';

const s = (unitId: string, key: string, value: PolicySetting['value'], mode: PolicySetting['mode'] = 'default', note?: string): PolicySetting => ({
  unitId, key, value, mode, setAt: '2026-08-01T09:00:00.000Z', ...(note ? { note } : {}),
  setBy: /^(risk|aml|sca)\./.test(key) ? 'p-marta' : key.startsWith('checkout.') && unitId.startsWith('ou-kvitka') ? 'p-sofiia' : 'p-andrii',
});

/**
 * The policies set on the demo units: the platform enforces sanctioned geographies; each licensed entity
 * enforces its regulator's reporting threshold and narrows the instruments; holdings, merchants and stores
 * narrow further, set their split, their pay page and how much the agents may do alone.
 */
export const demoSettings: readonly PolicySetting[] = [
  s('ou-riverpay', 'risk.countries.blocked', ['RU', 'BY', 'KP', 'IR', 'SY'], 'enforced', 'Sanctioned jurisdictions'),
  s('ou-riverpay', 'agents.autonomy', 'propose'),
  s('ou-riverpay', 'refunds.window.days', 180),

  s('ou-ua', 'limits.payment.max', 50_000_000),
  s('ou-ua', 'aml.threshold.report', 40_000_000, 'enforced', 'Threshold financial transaction (UAH 400,000)'),
  s('ou-ua', 'instruments.allowed', ['card', 'apple_pay', 'google_pay', 'pay_by_bank', 'bank_transfer', 'qr_nbu', 'installments', 'voucher']),
  s('ou-ua', 'sca.exemption.max', 150_000),
  s('ou-ua', 'agents.autonomy', 'propose', 'enforced'),
  s('ou-ua', 'settlement.schedule', 'T+1'),

  s('ou-eu', 'limits.payment.max', 2_500_000),
  s('ou-eu', 'aml.threshold.report', 1_500_000, 'enforced', 'EUR 15,000'),
  s('ou-eu', 'instruments.allowed', ['card', 'apple_pay', 'google_pay', 'pay_by_bank', 'bank_transfer', 'bnpl', 'wallet', 'stablecoin', 'direct_debit']),
  s('ou-eu', 'sca.exemption.max', 3_000),
  s('ou-eu', 'agents.autonomy', 'act_low_risk'),
  s('ou-eu', 'settlement.schedule', 'T+2'),
  s('ou-eu', 'checkout.languages', ['en-GB', 'uk']),

  s('ou-kvitka', 'split.charity.bps', 100),
  s('ou-kvitka', 'split.charity.recipient', 'ou-open-river'),
  s('ou-kvitka', 'checkout.accent', '#1f6f5c'),
  s('ou-kvitka', 'checkout.showSplit', true),
  s('ou-kvitka', 'risk.review.score', 70),
  s('ou-kvitka', 'invoices.reminders', [-2, 0, 2, 5]),

  s('ou-kvitka-market', 'split.template', 'marketplace'),
  s('ou-kvitka-market', 'split.commission.bps', 800),
  s('ou-kvitka-market', 'limits.payment.max', 15_000_000),
  s('ou-kvitka-market', 'checkout.instrumentOrder', ['card', 'apple_pay', 'google_pay', 'installments', 'qr_nbu', 'pay_by_bank', 'voucher', 'bank_transfer']),

  s('ou-kvitka-pharmacy', 'instruments.allowed', ['card', 'apple_pay', 'google_pay', 'qr_nbu']),
  s('ou-kvitka-pharmacy', 'checkout.showSplit', false),
  s('ou-kvitka-pharmacy', 'limits.payment.max', 2_500_000),

  s('ou-dnipro-travel', 'split.template', 'agency'),
  s('ou-dnipro-travel', 'split.commission.bps', 1_200),
  s('ou-dnipro-travel', 'invoices.dueDays', 3),
  s('ou-dnipro-travel', 'settlement.hold.days', 3),
  s('ou-dnipro-travel', 'settlement.reserve.bps', 500),
  s('ou-dnipro-travel', 'checkout.accent', '#0f4c81'),

  s('ou-open-river', 'checkout.accent', '#d27a10'),
  s('ou-open-river', 'checkout.showSplit', true),
  s('ou-open-river', 'invoices.dueDays', 14),

  s('ou-karpaty', 'checkout.accent', '#2d6590'),
  s('ou-karpaty', 'agents.enabled', ['sentinel', 'reconciler', 'collector', 'analyst', 'clerk', 'copilot', 'treasurer']),

  s('ou-zerno', 'split.template', 'franchise', 'enforced', 'Royalty from every franchisee'),
  s('ou-zerno', 'instruments.allowed', ['card', 'apple_pay', 'google_pay', 'qr_nbu']),
  s('ou-zerno', 'limits.payment.max', 2_000_000),
  s('ou-zerno', 'checkout.accent', '#6b3f22'),
  s('ou-zerno-uzh', 'checkout.accent', '#8a5a2b'),
  s('ou-zerno-uzh', 'limits.payment.max', 3_000_000),

  s('ou-krok', 'invoices.dueDays', 5),
  s('ou-krok', 'instruments.allowed', ['card', 'apple_pay', 'google_pay', 'installments', 'pay_by_bank', 'bank_transfer']),

  s('ou-baltic-bikes', 'capture.mode', 'manual'),
  s('ou-baltic-bikes', 'limits.payment.max', 800_000),
  s('ou-baltic-bikes', 'checkout.accent', '#14532d'),

  s('ou-nordlicht', 'instruments.allowed', ['card', 'apple_pay', 'google_pay', 'direct_debit', 'bank_transfer', 'wallet']),
  s('ou-nordlicht', 'invoices.dueDays', 14),
  s('ou-nordlicht', 'invoices.reminders', [-3, 0, 7, 14]),

  s('ou-amber', 'risk.review.score', 60),
  s('ou-amber', 'settlement.reserve.bps', 1_000),
  s('ou-amber', 'settlement.hold.days', 7),
];

const r = (id: string, unitId: string, name: [string, string], priority: number, action: RiskRule['action'], conditions: RiskRule['conditions'], extra: Partial<RiskRule> = {}): RiskRule => ({
  id, unitId, name: { 'en-GB': name[0], uk: name[1] }, priority, enabled: true, enforced: false, action, target: null, compose: 'and', conditions, ...extra,
});

/** Rules set on the demo units. They accumulate downwards: a store meets its own rules and every rule above it. */
export const demoRules: readonly RiskRule[] = [
  r('rule-crypto-review', 'ou-riverpay', ['Stablecoins above €5,000 are reviewed', 'Стейблкоїни понад 5 000 € — на перевірку'], 10, 'review', [{ field: 'instrument', op: 'eq', value: 'stablecoin' }, { field: 'amount', op: 'ge', value: 500_000 }], { enforced: true }),
  r('rule-ua-night', 'ou-ua', ['Large card payments with elevated risk are reviewed', 'Великі карткові платежі з підвищеним ризиком — на перевірку'], 20, 'review', [{ field: 'amount', op: 'ge', value: 5_000_000 }, { field: 'score', op: 'ge', value: 40 }]),
  r('rule-ua-credit-notify', 'ou-ua', ['Instalments above UAH 100,000 notify compliance', 'Розстрочка понад 100 000 ₴ — сповіщення комплаєнсу'], 30, 'notify', [{ field: 'instrument', op: 'eq', value: 'installments' }, { field: 'amount', op: 'ge', value: 10_000_000 }]),
  r('rule-eu-bnpl-route', 'ou-eu', ['Pay-later goes to the EU lender', 'Оплата пізніше — до кредитора ЄС'], 40, 'route', [{ field: 'instrument', op: 'eq', value: 'bnpl' }], { target: 'lend-later' }),
  r('rule-kvm-velocity', 'ou-kvitka-market', ['Five attempts in a day by one payer are reviewed', 'П’ять спроб одного платника за добу — на перевірку'], 15, 'review', [{ field: 'attempts_24h', op: 'ge', value: 5 }]),
  r('rule-karpaty-route', 'ou-karpaty', ['Cards go to the partner’s own acquirer', 'Картки — до власного еквайра партнера'], 25, 'route', [{ field: 'instrument', op: 'in', value: ['card', 'apple_pay', 'google_pay'] }], { target: 'acq-karpaty' }),
  r('rule-bbk-foreign', 'ou-baltic-bikes', ['Foreign cards above €3,000 are reviewed', 'Іноземні картки понад 3 000 € — на перевірку'], 35, 'review', [{ field: 'issuer_country', op: 'not_in', value: ['LT', 'LV', 'EE', 'PL', 'DE'] }, { field: 'amount', op: 'ge', value: 300_000 }]),
];
