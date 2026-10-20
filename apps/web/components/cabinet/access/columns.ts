import { pickText, type Locale } from '@river/i18n';
import { roleLabels, type AuditEntry, type Permission } from '@river/psp-access';
import { contractKindLabels, contractStatusAt, contractStatusLabels, contractStatuses, type Contract } from '@river/psp-contracts';
import type { cabinet } from '@/lib/cabinet';
import { day } from '@/lib/format';
import type { Column } from '../../panels/DataTable';
import type { Cell } from '../../panels/Value';
import { contractTone, daysLeft, endsSoon } from './contracts';

type Cab = Awaited<ReturnType<typeof cabinet>>;

/**
 * The columns of the access cabinet's two registers, declared once: contracts (in their list, on the
 * overview, on an onboarding case) and the audit trail (its page and the overview's latest lines).
 */
export function contractColumns(c: Cab, locale: Locale): Column<Contract>[] {
  const { t } = c;
  const tariffOf = (ct: Contract) => (ct.tariffId ? c.w.tariffs.find((x) => x.id === ct.tariffId) : undefined);
  return [
    { key: 'number', label: t('Contract', 'Договір'), cell: (ct) => ({ kind: 'mono', value: ct.number, href: c.may('contracts.read', ct.unitId) ? c.link(`/contracts/${ct.id}`) : undefined }), sort: (ct) => ct.number },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (ct) => ({ kind: 'unit', name: c.unitName(ct.unitId) }), sort: (ct) => c.unitName(ct.unitId) },
    { key: 'kind', label: t('Kind', 'Вид'), cell: (ct) => ({ kind: 'text', value: pickText(contractKindLabels[ct.kind], locale) }), sort: (ct) => ct.kind },
    { key: 'status', label: t('Status', 'Статус'), cell: (ct) => { const s = contractStatusAt(ct, c.now); return { kind: 'status', label: pickText(contractStatusLabels[s], locale), tone: contractTone[s] }; }, sort: (ct) => contractStatuses.indexOf(contractStatusAt(ct, c.now)) },
    { key: 'tariff', label: t('Tariff', 'Тариф'), cell: (ct) => { const tf = tariffOf(ct); return tf ? { kind: 'link', label: pickText(tf.name, locale), href: c.link(`/tariffs#${tf.id}`), sub: tf.currency } : { kind: 'empty' }; }, sort: (ct) => pickText(tariffOf(ct)?.name, locale) },
    { key: 'validFrom', label: t('Valid from', 'Діє з'), cell: (ct) => ({ kind: 'date', iso: ct.validFrom }), sort: (ct) => ct.validFrom },
    { key: 'validTo', label: t('Valid to', 'Діє до'), cell: (ct) => validTo(c, ct, locale), sort: (ct) => ct.validTo ?? '9999' },
    { key: 'signed', label: t('Signed', 'Підписано'), cell: (ct) => ({ kind: 'date', iso: ct.signedAt }), sort: (ct) => ct.signedAt ?? '' },
  ];
}

/** The end of a contract: open-ended, renewing itself, or — warned — ending soon with nobody renewing it. */
export function validTo(c: Cab, ct: Contract, locale: Locale): Cell {
  const { t } = c;
  if (!ct.validTo) return { kind: 'text', value: t('open-ended', 'безстроково') };
  const left = daysLeft(ct, c.now) ?? 0;
  if (endsSoon(ct, c.now)) return { kind: 'status', label: `${day(ct.validTo, locale)} · ${left === 0 ? t('today', 'сьогодні') : t(left === 1 ? 'in 1 day' : `in ${left} days`, `через ${left} дн.`)}`, tone: 'warning' };
  return { kind: 'text', value: day(ct.validTo, locale), sub: ct.renewal === 'auto' ? t('renews itself', 'подовжується сам') : t('renewed by hand', 'подовжують вручну') };
}

// Where an audited target lives, by the shape of its id, and what it takes to open that page.
const targets: ReadonlyArray<[prefix: string, path: string, permission: Permission, byId: boolean]> = [
  ['ps_', '/sessions', 'flows.read', true], ['pay_', '/payments', 'flows.read', true], ['inv_', '/invoices', 'flows.read', true], ['ord_', '/orders', 'flows.read', true],
  ['ou-', '/units', 'flows.read', true], ['al_', '/alerts', 'aml.read', true], ['kyb-', '/onboarding', 'aml.read', true], ['ct-', '/contracts', 'contracts.read', true],
  ['wh-', '/webhooks', 'webhooks.manage', true], ['gr-', '/people', 'grants.read', false],
];

/** The page of an audited target, when its id says which and the reader may open it. */
export function auditTargetHref(c: Cab, e: AuditEntry): string | undefined {
  const found = targets.find(([prefix]) => e.target.startsWith(prefix));
  if (!found || !c.may(found[2], e.unitId)) return undefined;
  return c.link(found[3] ? `${found[1]}/${e.target}` : found[1]);
}

/** The profile an audit line was written in: a cabinet role, or the payer, an agent, a unit's policy. */
export function auditRoleText(c: Cab, role: AuditEntry['role'], locale: Locale): string {
  const { t } = c;
  if (role === 'payer') return t('Payer', 'Платник');
  if (role === 'agent') return t('Agent', 'Агент');
  if (role === 'policy') return t('Unit policy', 'Політика одиниці');
  return pickText(roleLabels[role], locale);
}

export function auditColumns(c: Cab, locale: Locale): Column<AuditEntry>[] {
  const { t } = c;
  return [
    { key: 'at', label: t('When', 'Коли'), cell: (e) => ({ kind: 'datetime', iso: e.at }), sort: (e) => e.at },
    { key: 'person', label: t('Person', 'Особа'), cell: (e) => ({ kind: 'text', value: c.personName(e.personId) }), sort: (e) => c.personName(e.personId) },
    { key: 'role', label: t('Profile', 'Профіль'), cell: (e) => ({ kind: 'text', value: auditRoleText(c, e.role, locale) }), sort: (e) => e.role },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (e) => ({ kind: 'unit', name: c.unitName(e.unitId) }), sort: (e) => c.unitName(e.unitId) },
    { key: 'action', label: t('Action', 'Дія'), cell: (e) => ({ kind: 'mono', value: e.action }), sort: (e) => e.action },
    { key: 'target', label: t('Target', 'Об’єкт'), cell: (e) => ({ kind: 'mono', value: e.target, href: auditTargetHref(c, e) }), sort: (e) => e.target },
    { key: 'detail', label: t('Detail', 'Подробиці'), cell: (e) => ({ kind: 'text', value: pickText(e.detail, locale) }) },
  ];
}
