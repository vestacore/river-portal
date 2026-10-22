import type { LocalisedText } from '@river/i18n';
import type { Projection } from '@river/psp-facts';

export const agentIds = ['sentinel', 'router', 'reconciler', 'collector', 'analyst', 'clerk', 'copilot', 'treasurer'] as const;
export type AgentId = (typeof agentIds)[number];

export const proposalKinds = ['open_alert', 'hold_payouts', 'shift_route', 'change_policy', 'negotiate_terms', 'send_reminder', 'investigate_break', 'raise_claim', 'escalate_alert', 'close_alert', 'prepare_evidence', 'retry_deliveries', 'fix_endpoint', 'prefund_payouts'] as const;
export type ProposalKind = (typeof proposalKinds)[number];

/** Who reads an agent's insights: the cabinets, by role name. */
export type Audience = 'hierarchy_admin' | 'operator' | 'compliance_officer' | 'access_manager' | 'checkout_designer' | 'integrator' | 'payments_manager' | 'finance_controller' | 'merchant_owner' | 'auditor';

/**
 * One agent of the swarm. It reads projections — never a stream of money directly — and writes only
 * insights, in its own namespace. What it may carry out alone is a policy of the unit (`agents.autonomy`).
 */
export type AgentDefinition = {
  id: AgentId;
  name: LocalisedText;
  role: LocalisedText;
  watches: readonly (Projection | 'alerts' | 'onboarding' | 'webhooks' | 'routes' | 'costs')[];
  proposes: readonly ProposalKind[];
  audience: readonly Audience[];
  glyph: string;
};

export type InsightSubject = { kind: 'session' | 'payment' | 'invoice' | 'order' | 'unit' | 'route' | 'endpoint' | 'alert' | 'currency'; id: string };

/** A proposal: what an agent suggests be done, what it would change, and whether it is low-risk. */
export type Proposal = {
  kind: ProposalKind;
  effect: LocalisedText;
  risk: 'low' | 'high';
  params: Record<string, string | number | string[]>;
};

/**
 * What an agent saw and proposes. Evidence points at facts and views, so a person can check the claim;
 * `consulted` are the other agents that looked at it (the swarm) and what each added.
 */
export type InsightDraft = {
  agent: AgentId;
  unitId: string;
  subject: InsightSubject;
  title: LocalisedText;
  finding: LocalisedText;
  evidence: Array<{ kind: InsightSubject['kind'] | 'fact'; id: string; note: LocalisedText }>;
  confidence: number;
  proposal: Proposal | null;
  consulted: Array<{ agent: AgentId; note: LocalisedText }>;
  /**
   * Findings of one series describe one standing condition — a forecast of its day, a cheaper route, a
   * batch's difference. A newer one supersedes the one still open, and when a round no longer finds the
   * condition, the open finding is superseded too.
   */
  series?: string;
};

/** An insight as recorded: a draft with its id, its time, and what people (or the policy) decided. */
export type Insight = InsightDraft & {
  id: string;
  at: string;
  status: 'open' | 'accepted' | 'declined' | 'applied' | 'auto_applied' | 'superseded';
  decidedBy: string | null;
  decidedAt: string | null;
};
