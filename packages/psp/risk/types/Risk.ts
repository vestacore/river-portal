import type { LocalisedText } from '@river/i18n';
import type { Currency, InstrumentId } from '@river/psp-facts';

/** Why an attempt scored what it did. */
export const riskReasons = ['amount_spike', 'velocity', 'country_mismatch', 'blocked_country', 'new_payer', 'night_time', 'high_risk_mcc', 'crypto', 'threshold', 'structuring', 'rule'] as const;
export type RiskReason = (typeof riskReasons)[number];

/** What the screening of one attempt looks at. No names, no addresses: handles, countries and counts. */
export type RiskSignals = {
  amountMinor: number;
  currency: Currency;
  typicalMinor: number;
  instrument: InstrumentId;
  payerCountry: string;
  issuerCountry: string | null;
  blockedCountries: readonly string[];
  attempts24h: number;
  amount24hMinor: number;
  newPayer: boolean;
  hour: number;
  mccRisk: 'low' | 'medium' | 'high';
  reportThresholdMinor: number | null;
};

/** One condition of a rule (the grammar of the earlier portal: a field, an operation, a value). */
export type Condition = {
  field: 'amount' | 'currency' | 'instrument' | 'payer_country' | 'issuer_country' | 'mcc_risk' | 'score' | 'attempts_24h' | 'amount_24h';
  op: 'gt' | 'ge' | 'lt' | 'le' | 'eq' | 'ne' | 'in' | 'not_in';
  value: number | string | string[];
};

/**
 * A rule set on a unit. Rules accumulate down the hierarchy: a unit's attempts meet the rules of every
 * unit above it and its own, by priority. `enforced` rules cannot be switched off below.
 */
export type RiskRule = {
  id: string;
  unitId: string;
  name: LocalisedText;
  priority: number;
  enabled: boolean;
  enforced: boolean;
  action: 'block' | 'review' | 'route' | 'notify';
  target: string | null;
  compose: 'and' | 'or';
  conditions: Condition[];
};

export type RiskContext = Omit<RiskSignals, 'blockedCountries' | 'typicalMinor' | 'newPayer' | 'hour' | 'reportThresholdMinor'> & { score: number };

export const alertKinds = ['threshold', 'structuring', 'velocity', 'sanctions', 'geography', 'mismatch', 'rule'] as const;
export type AlertKind = (typeof alertKinds)[number];

export const alertStatuses = ['new', 'investigating', 'escalated', 'reported', 'closed'] as const;
export type AlertStatus = (typeof alertStatuses)[number];

/** A monitoring alert: what was seen, about what, and how it is being handled. */
export type AmlAlert = {
  id: string;
  kind: AlertKind;
  unitId: string;
  sessionId: string | null;
  paymentId: string | null;
  amountMinor: number;
  currency: Currency;
  score: number;
  reasons: RiskReason[];
  status: AlertStatus;
  assignee: string | null;
  openedAt: string;
  updatedAt: string;
  /** What people wrote on it, in both languages; a person's own words stand as typed in both. */
  notes: Array<{ at: string; by: string; text: LocalisedText }>;
};

export const kybChecks = ['registry', 'sanctions', 'pep', 'adverse_media', 'ubo', 'website', 'mcc', 'bank_account'] as const;
export type KybCheck = (typeof kybChecks)[number];

/** Onboarding of a merchant (know your business): its checks, beneficial owners, documents and decision. */
export type KybCase = {
  id: string;
  unitId: string;
  stage: 'documents' | 'screening' | 'assessment' | 'decision' | 'done';
  status: 'open' | 'more_info' | 'approved' | 'rejected';
  risk: 'low' | 'medium' | 'high';
  openedAt: string;
  updatedAt: string;
  checks: Array<{ check: KybCheck; result: 'pass' | 'review' | 'fail' | 'pending'; note: LocalisedText }>;
  owners: Array<{ initials: string; sharePct: number; pep: boolean; country: string }>;
  documents: Array<{ title: LocalisedText; status: 'received' | 'missing' | 'expired' }>;
  decidedBy: string | null;
  decidedAt: string | null;
};
