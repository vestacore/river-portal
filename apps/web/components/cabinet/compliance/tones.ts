import type { AlertStatus, KybCase } from '@river/psp-risk';
import type { Tone } from '../../panels/Value';

/**
 * How the compliance cabinet draws its records, the same in every panel: the tone of an alert's status,
 * of a risk score, and the words and tones of an onboarding case — its stage, status, risk, checks and
 * documents. Words are pairs, British English first: `t(kybStageText[k.stage][0], kybStageText[k.stage][1])`.
 */
export const alertTone: Record<AlertStatus, Tone> = { new: 'warning', investigating: 'info', escalated: 'danger', reported: 'success', closed: 'neutral' };

/** A risk score in the screening's own levels: high from 70, medium from 40. */
export function scoreTone(score: number): Tone {
  return score >= 70 ? 'danger' : score >= 40 ? 'warning' : 'success';
}

export const kybStageText: Record<KybCase['stage'], [string, string]> = {
  documents: ['Collecting documents', 'Збір документів'],
  screening: ['Screening', 'Скринінг'],
  assessment: ['Risk assessment', 'Оцінка ризику'],
  decision: ['Awaiting the decision', 'Очікує рішення'],
  done: ['Done', 'Завершено'],
};

export const kybStatusText: Record<KybCase['status'], [string, string]> = {
  open: ['In progress', 'У роботі'],
  more_info: ['More information asked', 'Запитано додаткову інформацію'],
  approved: ['Approved', 'Схвалено'],
  rejected: ['Rejected', 'Відхилено'],
};
export const kybStatusTone: Record<KybCase['status'], Tone> = { open: 'info', more_info: 'warning', approved: 'success', rejected: 'danger' };

export const kybRiskText: Record<KybCase['risk'], [string, string]> = { low: ['Low risk', 'Низький ризик'], medium: ['Medium risk', 'Середній ризик'], high: ['High risk', 'Високий ризик'] };
export const kybRiskTone: Record<KybCase['risk'], Tone> = { low: 'success', medium: 'warning', high: 'danger' };

type CheckResult = KybCase['checks'][number]['result'];
export const checkResultText: Record<CheckResult, [string, string]> = { pass: ['Passed', 'Пройдено'], review: ['To review', 'Потребує перевірки'], fail: ['Failed', 'Не пройдено'], pending: ['Pending', 'Очікується'] };
export const checkResultTone: Record<CheckResult, Tone> = { pass: 'success', review: 'warning', fail: 'danger', pending: 'neutral' };

type DocumentStatus = KybCase['documents'][number]['status'];
export const documentText: Record<DocumentStatus, [string, string]> = { received: ['Received', 'Отримано'], missing: ['Missing', 'Бракує'], expired: ['Expired', 'Прострочено'] };
export const documentTone: Record<DocumentStatus, Tone> = { received: 'success', missing: 'danger', expired: 'warning' };

/** Whether an onboarding case still waits for a decision. */
export const kybUndecided = (k: KybCase) => k.status === 'open' || k.status === 'more_info';
