/** Roles on the river (spec: Role). A person may hold several. */
export const roles = [
  'recipient', 'giver', 'sponsor', 'carrier', 'volunteer', 'partner',
  'coordinator', 'finance_steward', 'editor', 'safeguarding_lead', 'administrator', 'auditor',
] as const;
export type Role = (typeof roles)[number];

/** Roles that work in the studio. */
export const staffRoles: readonly Role[] = ['coordinator', 'finance_steward', 'editor', 'safeguarding_lead', 'administrator', 'auditor'];
