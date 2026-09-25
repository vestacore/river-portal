import { settingNumber, type SettingsSnapshot } from '@river/settings';

/** Costs a Lead Coordinator may approve alone, in minor units of the reporting currency (DP-06). */
export function approvalLimitMinor(settings: SettingsSnapshot): number {
  return settingNumber(settings, 'money.costApprovalLimit');
}
