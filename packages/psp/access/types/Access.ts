import type { LocalisedText } from '@river/i18n';

/** The roles of the cabinets. A grant gives one role at one unit, and with it the unit's whole subtree. */
export const pspRoles = ['hierarchy_admin', 'operator', 'compliance_officer', 'access_manager', 'checkout_designer', 'integrator', 'merchant_owner', 'auditor'] as const;
export type PspRole = (typeof pspRoles)[number];

export const permissions = [
  'flows.read', 'orders.write', 'payments.capture', 'payments.refund', 'disputes.respond', 'payouts.read',
  'units.write', 'policies.write', 'rules.write',
  'aml.read', 'aml.review',
  'contracts.read', 'contracts.write', 'grants.read', 'grants.write',
  'checkout.read', 'checkout.write',
  'keys.manage', 'webhooks.manage', 'logs.read',
  'agents.decide', 'audit.read',
] as const;
export type Permission = (typeof permissions)[number];

/** A person who works in the cabinets. No password, no e-mail in the demo: a name, a title, a home unit. */
export type Person = {
  id: string;
  name: LocalisedText;
  title: LocalisedText;
  homeUnitId: string;
  mfa: boolean;
  lastSeenAt: string;
};

/** One role at one unit for one person — a profile the person can switch to. */
export type Grant = {
  id: string;
  personId: string;
  role: PspRole;
  unitId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  status: 'active' | 'revoked';
};

/** A request for a grant, decided by someone other than the person it is for. */
export type AccessRequest = {
  id: string;
  personId: string;
  role: PspRole;
  unitId: string;
  reason: LocalisedText;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy: string | null;
  decidedAt: string | null;
};

/** One thing a person did in a cabinet, with the profile they acted in. The cabinets' own audit trail. */
export type AuditEntry = {
  id: string;
  at: string;
  personId: string;
  role: PspRole | 'payer' | 'agent' | 'policy';
  unitId: string;
  action: string;
  target: string;
  detail: LocalisedText;
};
