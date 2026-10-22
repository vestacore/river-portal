import type { RiskRule } from '@river/psp-risk';
import type { PolicySetting } from '@river/psp-units';

const s = (unitId: string, key: string, value: PolicySetting['value'], mode: PolicySetting['mode'] = 'default', note?: string, setAt = '2026-06-01T09:00:00.000Z', setBy = 'r-olha'): PolicySetting => ({
  unitId, key, value, mode, setAt, setBy, ...(note ? { note } : {}),
});
const r = (id: string, unitId: string, name: [string, string], priority: number, action: RiskRule['action'], conditions: RiskRule['conditions'], extra: Partial<RiskRule> = {}): RiskRule => ({
  id, unitId, name: { 'en-GB': name[0], uk: name[1] }, priority, enabled: true, enforced: false, action, target: null, compose: 'and', conditions, ...extra,
});

/**
 * The group's policies: acquirers settle to the legal entities' own accounts (enforced); routing starts
 * by approval rate — the payments manager moves it to on-us first during the history; the terminal bank
 * of each region; online orders are captured after picking; the pay page offers bonus points; the agents
 * propose and people decide, without the treasury agent, whose forecasts belong to the group's own ERP.
 */
export const retailSettings: readonly PolicySetting[] = [
  s('rt-group', 'settlement.model', 'direct', 'enforced', 'Acquirers settle to our own accounts'),
  s('rt-group', 'settlement.schedule', 'T+1'),
  s('rt-group', 'routing.strategy', 'approval_first', 'default', undefined, '2025-01-10T09:00:00.000Z', 'r-mykola'),
  s('rt-group', 'routing.minApproval.bps', 9_000, 'default', undefined, '2025-01-10T09:00:00.000Z', 'r-mykola'),
  s('rt-group', 'risk.countries.blocked', ['RU', 'BY', 'KP', 'IR', 'SY'], 'enforced', 'Sanctioned jurisdictions', '2025-01-10T09:00:00.000Z', 'r-anna'),
  s('rt-group', 'instruments.allowed', ['card', 'apple_pay', 'google_pay', 'qr_nbu', 'pay_by_bank', 'bank_transfer', 'installments', 'bonus_points']),
  s('rt-group', 'limits.payment.max', 20_000_000),
  s('rt-group', 'refunds.window.days', 14),
  s('rt-group', 'agents.enabled', ['sentinel', 'router', 'reconciler', 'collector', 'analyst', 'clerk', 'copilot'], 'default', 'Cash forecasts are kept in the group’s ERP'),
  s('rt-group', 'agents.autonomy', 'propose'),
  s('rt-kyiv', 'pos.acquirer', 'acq-karpaty', 'default', undefined, '2024-02-01T09:00:00.000Z', 'r-olha'),
  s('rt-west', 'pos.acquirer', 'acq-karpaty', 'default', undefined, '2024-02-01T09:00:00.000Z', 'r-olha'),
  s('rt-east', 'pos.acquirer', 'acq-stepove', 'default', undefined, '2024-02-01T09:00:00.000Z', 'r-olha'),
  s('rt-south', 'pos.acquirer', 'acq-dnipro', 'default', undefined, '2024-02-01T09:00:00.000Z', 'r-olha'),
  s('rt-web', 'capture.mode', 'manual', 'default', 'Captured after picking: weighed goods and substitutes', '2025-03-01T09:00:00.000Z', 'r-serhii'),
  s('rt-app', 'capture.mode', 'manual', 'default', 'Captured after picking: weighed goods and substitutes', '2025-03-01T09:00:00.000Z', 'r-serhii'),
  s('rt-online', 'checkout.loyalty', true, 'default', undefined, '2025-03-01T09:00:00.000Z', 'r-daria'),
  s('rt-online', 'checkout.accent', '#1f7a4d', 'default', undefined, '2025-03-01T09:00:00.000Z', 'r-daria'),
  s('rt-online', 'checkout.instrumentOrder', ['apple_pay', 'google_pay', 'card', 'bonus_points', 'qr_nbu', 'pay_by_bank', 'installments'], 'default', undefined, '2025-03-01T09:00:00.000Z', 'r-daria'),
  s('rt-door', 'instruments.allowed', ['qr_nbu', 'card']),
  s('rt-b2b', 'instruments.allowed', ['bank_transfer', 'qr_nbu', 'card']),
  s('rt-b2b', 'invoices.dueDays', 5),
  s('rt-b2b', 'invoices.reminders', [-1, 1, 3]),
];

/** Screening rules of the online trade. */
export const retailRules: readonly RiskRule[] = [
  r('rule-rt-velocity', 'rt-online', ['Five attempts in a day by one payer are reviewed', 'П’ять спроб одного платника за добу — на перевірку'], 15, 'review', [{ field: 'attempts_24h', op: 'ge', value: 5 }]),
  r('rule-rt-large', 'rt-online', ['Online baskets above UAH 40,000 with elevated risk are reviewed', 'Онлайн-кошики понад 40 000 ₴ з підвищеним ризиком — на перевірку'], 20, 'review', [{ field: 'amount', op: 'ge', value: 4_000_000 }, { field: 'score', op: 'ge', value: 35 }]),
  r('rule-rt-foreign', 'rt-online', ['Foreign cards above UAH 10,000 are reviewed', 'Іноземні картки понад 10 000 ₴ — на перевірку'], 30, 'review', [{ field: 'issuer_country', op: 'ne', value: 'UA' }, { field: 'amount', op: 'ge', value: 1_000_000 }]),
];
