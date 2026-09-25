import type { Role } from '@river/identity';

export type StageKey = 'board' | 'inflow' | 'channels' | 'tolls' | 'mouth' | 'surface' | 'settings';

type Stage = { key: StageKey; path: string; icon: 'dots' | 'inbox' | 'route' | 'coins' | 'check' | 'sparkle' | 'pen'; see: readonly Role[]; act: readonly Role[] };

const everyone: readonly Role[] = ['coordinator', 'finance_steward', 'editor', 'safeguarding_lead', 'administrator', 'auditor'];

/**
 * The studio follows the river (adr/records/ADR-0021): who may see each stage, and who may act in
 * it. Auditors see every stage and act in none. Server Actions check roles again (requireRole).
 */
export const studioStages: readonly Stage[] = [
  { key: 'board', path: '/studio', icon: 'dots', see: everyone, act: [] },
  { key: 'inflow', path: '/studio/inflow', icon: 'inbox', see: ['coordinator', 'safeguarding_lead', 'administrator', 'auditor'], act: ['coordinator', 'safeguarding_lead', 'administrator'] },
  { key: 'channels', path: '/studio/channels', icon: 'route', see: ['coordinator', 'finance_steward', 'administrator', 'auditor'], act: ['coordinator', 'administrator'] },
  { key: 'tolls', path: '/studio/tolls', icon: 'coins', see: ['finance_steward', 'coordinator', 'administrator', 'auditor'], act: ['finance_steward', 'coordinator', 'administrator'] },
  { key: 'mouth', path: '/studio/mouth', icon: 'check', see: ['coordinator', 'safeguarding_lead', 'administrator', 'auditor'], act: ['coordinator', 'safeguarding_lead', 'administrator'] },
  { key: 'surface', path: '/studio/surface', icon: 'sparkle', see: ['editor', 'coordinator', 'administrator', 'auditor'], act: ['editor', 'coordinator', 'administrator'] },
  { key: 'settings', path: '/studio/settings', icon: 'pen', see: ['administrator', 'editor', 'auditor'], act: ['administrator', 'editor'] },
];
