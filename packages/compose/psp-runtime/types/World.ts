import type { LocalisedText } from '@river/i18n';
import type { AccessRequest, AuditEntry, Grant, Person, PspRole } from '@river/psp-access';
import type { Insight } from '@river/psp-agents';
import type { AcquiringTerms, Contract, Tariff } from '@river/psp-contracts';
import type { PspFact } from '@river/psp-facts';
import type { ApiKey, ApiLogEntry, WebhookDelivery, WebhookEndpoint } from '@river/psp-integration';
import type { InvoiceView } from '@river/psp-invoice';
import type { JournalEntry } from '@river/psp-ledger';
import type { OrderView } from '@river/psp-order';
import type { PaymentView } from '@river/psp-payment';
import type { AmlAlert, KybCase, RiskRule } from '@river/psp-risk';
import type { SessionView } from '@river/psp-session';
import type { SettlementView } from '@river/psp-settlement';
import type { PolicySetting, Unit, UnitProfile } from '@river/psp-units';

/** The stands of the demo: one platform, two assemblies of it. */
export type StandId = 'retail' | 'psp';

/**
 * The demo world of one stand, in memory. The streams are the truth; `views` and `journal` are their
 * projections, written only by `appendFacts`. Everything else is the cabinets' own records — the
 * hierarchy, its policies and rules, people and grants, contracts and acquiring terms, the providers the
 * stand is connected with, integration, alerts, insights.
 */
export type World = {
  stand: StandId;
  startedAt: string;
  version: number;
  /** The providers this stand has connections with (acquirers, hubs, lenders, the bonus system). */
  providers: string[];
  /** Who earns the `fee` rule of a split when the platform holds the money; null when acquirers settle directly. */
  feeRecipient: string | null;
  units: Unit[];
  profiles: Record<string, UnitProfile>;
  settings: PolicySetting[];
  rules: RiskRule[];
  people: Person[];
  grants: Grant[];
  requests: AccessRequest[];
  tariffs: Tariff[];
  contracts: Contract[];
  acquiring: AcquiringTerms[];
  streams: Map<string, PspFact[]>;
  log: PspFact[];
  views: {
    orders: Map<string, OrderView>;
    invoices: Map<string, InvoiceView>;
    sessions: Map<string, SessionView>;
    payments: Map<string, PaymentView>;
    settlements: Map<string, SettlementView>;
  };
  journal: JournalEntry[];
  scenarios: Map<string, Scenario>;
  caches: { payer: Map<string, Array<{ at: number; amountMinor: number; failed: boolean }>>; merchantAmounts: Map<string, number[]> };
  alerts: AmlAlert[];
  onboarding: KybCase[];
  keys: ApiKey[];
  endpoints: WebhookEndpoint[];
  deliveries: WebhookDelivery[];
  apiLog: ApiLogEntry[];
  insights: Insight[];
  audit: AuditEntry[];
  payKeys: Record<string, string>;
  routeWeights: Record<string, Record<string, number>>;
  heldPayouts: string[];
  lostSettlement: string[];
  /** Webhook endpoints of the demo's story that fail for the last hours of its history, until someone fixes them. */
  failing: Array<{ endpointId: string; hours: number }>;
  /** Refunds and chargebacks a direct settlement has already netted from a batch. */
  netted: string[];
  /** What the demo's providers and banks will get wrong about a batch, keyed by batch id (stories of the history). */
  quirks: Record<string, { feeDeltaMinor?: number; grossDeltaMinor?: number; noCredit?: boolean; shortCreditMinor?: number }>;
  counters: Record<string, number>;
  swarmAt: string | null;
  quiet: boolean;
};

/** Who acts in a cabinet: a person in one of their profiles (a grant), or the payer holding a pay key. */
export type Actor =
  | { kind: 'person'; personId: string; grantId: string; role: PspRole; unitId: string }
  | { kind: 'payer'; payKey: string };

/** The answer of a command: what it did, or why it did nothing. */
export type CommandResult<T = Record<string, unknown>> = { ok: true; value: T } | { ok: false; error: string };

/** A demo persona: a person to act as, the cabinet they open first, and why they are here. */
export type Persona = {
  personId: string;
  cabinet: 'operator' | 'hierarchy' | 'compliance' | 'access' | 'checkout' | 'integrator' | 'routing' | 'reconciliation' | 'auditor';
  description: LocalisedText;
};

/**
 * What the stand-in world will answer in one attempt — the issuer, the device, the bank, the lender, the
 * pushed money. Live, it comes from the payer's test card and clicks; in the history, from the seeded chance.
 */
export type Scenario = {
  challenge: boolean;
  challengePass?: boolean;
  issuer: 'approve' | 'decline' | 'insufficient_funds' | 'by_acquirer';
  device?: boolean;
  consent?: boolean;
  credit?: boolean;
  pushed?: boolean;
  mismatchMinor?: number;
  mandateRef?: string;
  captureRequested?: boolean;
  /** What the operator or the order system asked to capture — less than the hold after picking. */
  captureAmountMinor?: number;
  parts?: number;
  routeTo?: string | null;
};

/** What an attempt waits for after a drive: a gesture of the payer, pushed money, an operator, an officer — or nothing. */
export type Waiting = 'challenge' | 'device' | 'consent' | 'funds' | 'mandate' | 'capture' | 'review' | 'done' | 'failed';

/** A gesture of the payer in the middle of an attempt. */
export type PayerGesture =
  | { kind: 'challenge'; pass: boolean }
  | { kind: 'device' }
  | { kind: 'consent'; approve: boolean }
  | { kind: 'funds' }
  | { kind: 'mandate'; iban: string };
