'use server';

import type { PspRole } from '@river/psp-access';
import type { ContractStatus } from '@river/psp-contracts';
import type { OrderLine } from '@river/psp-facts';
import type { AlertStatus, RiskRule } from '@river/psp-risk';
import {
  advanceContract, captureHold, createApiKey, createUnit, decideInsight, decideOnboarding, decideRequest, decideReview, grantRole, markFulfilment,
  placeOrder, refundPayment, remindInvoice, revokeApiKey, revokeGrant, saveEndpoint, saveRule, sendTestEvent, setBlockInheritance, setPolicy, setUnitStatus,
  guard, submitEvidence, updateAlert, voidHold, voidInvoice,
} from '@river/psp-runtime';
import type { PolicySetting, Unit } from '@river/psp-units';
import { world } from '../world';
import { runCommand as run } from './runCommand';

const now = () => new Date().toISOString();
const str = (form: FormData, key: string) => String(form.get(key) ?? '');

export async function decideInsightAction(form: FormData) { await run(form, (a) => decideInsight(world(), a, str(form, 'insightId'), str(form, 'decision') === 'accept', now()), str(form, 'decision') === 'accept' ? 'accepted' : 'declined'); }
export async function captureAction(form: FormData) { await run(form, (a) => captureHold(world(), a, str(form, 'paymentId'), now()), 'captured'); }
export async function voidAction(form: FormData) { await run(form, (a) => voidHold(world(), a, str(form, 'paymentId'), str(form, 'reason') || 'Released by an operator', now()), 'released'); }
export async function refundAction(form: FormData) {
  const amount = Math.round(Number(str(form, 'amount').replace(',', '.')) * 100);
  await run(form, (a) => refundPayment(world(), a, str(form, 'paymentId'), amount, str(form, 'reason') || 'Refund', now()), 'refunded');
}
export async function evidenceAction(form: FormData) { await run(form, (a) => submitEvidence(world(), a, str(form, 'paymentId'), str(form, 'disputeId'), Number(str(form, 'documents') || 3), now()), 'evidenced'); }
export async function reviewAction(form: FormData) {
  const clear = str(form, 'decision') === 'clear';
  const mismatch = str(form, 'kind') === 'mismatch';
  await run(form, (a) => decideReview(world(), a, str(form, 'sessionId'), clear, str(form, 'note'), now()), mismatch ? (clear ? 'taken' : 'returned') : (clear ? 'cleared' : 'rejected'));
}
export async function alertAction(form: FormData) { await run(form, (a) => updateAlert(world(), a, str(form, 'alertId'), str(form, 'status') as AlertStatus, str(form, 'note'), now()), 'updated'); }
export async function onboardingAction(form: FormData) { await run(form, (a) => decideOnboarding(world(), a, str(form, 'caseId'), str(form, 'decision') as 'approved' | 'rejected' | 'more_info', now()), 'decided'); }
export async function voidInvoiceAction(form: FormData) { await run(form, (a) => voidInvoice(world(), a, str(form, 'invoiceId'), str(form, 'reason') || 'Withdrawn by the merchant', now()), 'voided'); }
export async function remindAction(form: FormData) {
  await run(form, (a) => {
    const inv = world().views.invoices.get(str(form, 'invoiceId'));
    if (!inv) return { ok: false, error: 'not_found' };
    return remindInvoice(world(), inv.invoiceId, inv.reminders.length, 'email', a.personId, now()) ? { ok: true, value: {} } : { ok: false, error: 'nothing_to_remind' };
  }, 'reminded');
}
export async function fulfilmentAction(form: FormData) { await run(form, (a) => markFulfilment(world(), a, str(form, 'orderId'), str(form, 'step') as 'accepted' | 'shipped' | 'delivered', now()), 'moved'); }
export async function setPolicyAction(form: FormData) {
  const raw = str(form, 'value');
  const kind = str(form, 'kind');
  const clear = str(form, 'clear') === '1';
  const value: PolicySetting['value'] | undefined = clear ? undefined
    : kind === 'boolean' ? raw === 'true'
    : kind === 'number' ? Number(raw)
    : kind === 'percent' ? Math.round(Number(raw.replace(',', '.')) * 100)
    : kind === 'money' ? (raw.trim() === '' ? null : Math.round(Number(raw.replace(',', '.')) * 100))
    : kind === 'list' ? form.getAll('value').map(String).filter(Boolean).flatMap((v) => v.split(',').map((x) => x.trim()).filter(Boolean)).map((x) => (/^-?\d+$/.test(x) && str(form, 'numeric') === '1' ? Number(x) : x)) as string[]
    : raw;
  await run(form, (a) => setPolicy(world(), a, { unitId: str(form, 'unitId'), key: str(form, 'key'), value, mode: str(form, 'mode') === 'enforced' ? 'enforced' : 'default', note: str(form, 'note') }, now()), clear ? 'cleared' : 'saved');
}
export async function blockAction(form: FormData) { await run(form, (a) => setBlockInheritance(world(), a, str(form, 'unitId'), str(form, 'block') === '1', now()), 'saved'); }
export async function createUnitAction(form: FormData) {
  await run(form, (a) => createUnit(world(), a, { parentId: str(form, 'parentId'), kind: str(form, 'kind') as Unit['kind'], name: { 'en-GB': str(form, 'nameEn'), uk: str(form, 'nameUk') }, code: str(form, 'code') }, now()), 'created');
}
export async function unitStatusAction(form: FormData) { await run(form, (a) => setUnitStatus(world(), a, str(form, 'unitId'), str(form, 'status') as Unit['status'], now()), 'saved'); }
export async function saveRuleAction(form: FormData) {
  const rule: RiskRule = {
    id: str(form, 'ruleId') || `rule-${Date.now().toString(36)}`, unitId: str(form, 'unitId'), name: { 'en-GB': str(form, 'nameEn') || str(form, 'nameUk') || 'Rule', uk: str(form, 'nameUk') || str(form, 'nameEn') || 'Правило' }, priority: Number(str(form, 'priority') || 50),
    enabled: str(form, 'enabled') !== '0', enforced: str(form, 'enforced') === '1', action: (str(form, 'action') || 'review') as RiskRule['action'], target: str(form, 'target') || null,
    compose: str(form, 'compose') === 'or' ? 'or' : 'and',
    conditions: str(form, 'field') ? [{ field: str(form, 'field') as RiskRule['conditions'][number]['field'], op: str(form, 'op') as RiskRule['conditions'][number]['op'], value: /^\d+(\.\d+)?$/.test(str(form, 'cvalue')) ? (str(form, 'field') === 'amount' || str(form, 'field') === 'amount_24h' ? Math.round(Number(str(form, 'cvalue')) * 100) : Number(str(form, 'cvalue'))) : str(form, 'cvalue').includes(',') ? str(form, 'cvalue').split(',').map((x) => x.trim()) : str(form, 'cvalue') }] : [],
  };
  const existing = world().rules.find((r) => r.id === rule.id && r.unitId === rule.unitId);
  if (existing && !str(form, 'field')) rule.conditions = existing.conditions;
  await run(form, (a) => saveRule(world(), a, rule, now()), 'saved');
}
export async function grantAction(form: FormData) { await run(form, (a) => grantRole(world(), a, { personId: str(form, 'personId'), role: str(form, 'role') as PspRole, unitId: str(form, 'unitId') }, now()), 'granted'); }
export async function revokeAction(form: FormData) { await run(form, (a) => revokeGrant(world(), a, str(form, 'grantId'), now()), 'revoked'); }
export async function requestDecisionAction(form: FormData) { await run(form, (a) => decideRequest(world(), a, str(form, 'requestId'), str(form, 'decision') === 'approve', now()), str(form, 'decision') === 'approve' ? 'approved' : 'declined'); }
export async function contractAction(form: FormData) { await run(form, (a) => advanceContract(world(), a, str(form, 'contractId'), str(form, 'status') as ContractStatus, now()), 'saved'); }
export async function createKeyAction(form: FormData) { await run(form, (a) => createApiKey(world(), a, { unitId: str(form, 'unitId'), label: str(form, 'label'), mode: str(form, 'mode') === 'live' ? 'live' : 'test', kind: str(form, 'kind') === 'publishable' ? 'publishable' : 'secret' }, now()), 'created'); }
export async function revokeKeyAction(form: FormData) { await run(form, (a) => revokeApiKey(world(), a, str(form, 'keyId'), now()), 'revoked'); }
export async function endpointAction(form: FormData) {
  await run(form, (a) => saveEndpoint(world(), a, { endpointId: str(form, 'endpointId') || undefined, unitId: str(form, 'unitId'), url: str(form, 'url'), events: form.getAll('events').map(String), enabled: str(form, 'enabled') !== '0', description: str(form, 'description') }, now()), 'saved');
}
export async function testEventAction(form: FormData) { await run(form, (a) => sendTestEvent(world(), a, str(form, 'endpointId'), now()), 'sent'); }
export async function sandboxOrderAction(form: FormData) {
  await run(form, (a) => {
    const unitId = str(form, 'unitId');
    const denied = guard(world(), a, 'orders.write', unitId, now());
    if (denied) return { ok: false, error: denied };
    const amount = Math.max(1, Math.round(Number(str(form, 'amount').replace(',', '.') || '100') * 100));
    const lines: OrderLine[] = [{ sku: 'SANDBOX', title: { 'en-GB': str(form, 'title') || 'Sandbox order', uk: str(form, 'title') || 'Тестове замовлення' }, quantity: 1, unitMinor: amount, totalMinor: amount, sellerUnitId: null }];
    const placed = placeOrder(world(), { unitId, channel: 'api', lines, payerRef: `py_sandbox_${Date.now().toString(36)}` }, { via: 'door', actor: a.personId, role: a.role }, now());
    return 'error' in placed ? { ok: false, error: placed.error } : { ok: true, value: { payKey: placed.payKey, orderId: placed.orderId } };
  }, 'created');
}
