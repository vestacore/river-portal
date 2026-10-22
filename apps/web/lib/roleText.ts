import type { LocalisedText } from '@river/i18n';
import { roleLabels, type PspRole } from '@river/psp-access';
import type { StandId } from '@river/psp-runtime';

const retail: Partial<Record<PspRole, LocalisedText>> = {
  compliance_officer: { 'en-GB': 'Risk and fraud', uk: 'Ризики й антифрод' },
  operator: { 'en-GB': 'Online operations', uk: 'Онлайн-операції' },
  auditor: { 'en-GB': 'Read-only view', uk: 'Лише перегляд' },
};

/** A role's name on a stand: the retail group calls its compliance officer's work risk and fraud. */
export function roleText(stand: StandId, role: PspRole): LocalisedText {
  return (stand === 'retail' ? retail[role] : undefined) ?? roleLabels[role];
}
