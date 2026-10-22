import type { Permission, PspRole } from '../types/Access.ts';

const reads: Permission[] = ['flows.read', 'payouts.read', 'costs.read', 'aml.read', 'contracts.read', 'grants.read', 'checkout.read', 'logs.read', 'audit.read'];

/** What each role may do — within the subtree of the unit it is granted at. */
export const rolePermissions: Record<PspRole, readonly Permission[]> = {
  hierarchy_admin: ['flows.read', 'orders.write', 'payments.capture', 'payments.refund', 'disputes.respond', 'payouts.read', 'units.write', 'policies.write', 'rules.write', 'routing.write', 'costs.read', 'reconciliation.write', 'aml.read', 'aml.review', 'contracts.read', 'contracts.write', 'grants.read', 'grants.write', 'checkout.read', 'checkout.write', 'keys.manage', 'webhooks.manage', 'logs.read', 'agents.decide', 'audit.read'],
  operator: ['flows.read', 'orders.write', 'payments.capture', 'payments.refund', 'disputes.respond', 'payouts.read', 'checkout.read', 'agents.decide'],
  compliance_officer: ['flows.read', 'aml.read', 'aml.review', 'rules.write', 'contracts.read', 'agents.decide', 'audit.read'],
  access_manager: ['contracts.read', 'contracts.write', 'grants.read', 'grants.write', 'audit.read', 'flows.read'],
  checkout_designer: ['checkout.read', 'checkout.write', 'flows.read'],
  integrator: ['keys.manage', 'webhooks.manage', 'logs.read', 'flows.read', 'orders.write', 'checkout.read', 'agents.decide'],
  payments_manager: ['flows.read', 'routing.write', 'costs.read', 'contracts.read', 'payouts.read', 'agents.decide', 'audit.read'],
  finance_controller: ['flows.read', 'payouts.read', 'costs.read', 'reconciliation.write', 'contracts.read', 'disputes.respond', 'agents.decide', 'audit.read'],
  merchant_owner: ['flows.read', 'orders.write', 'payments.refund', 'payouts.read', 'contracts.read', 'grants.read', 'agents.decide'],
  auditor: reads,
};
