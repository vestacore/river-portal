import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { dutyConflicts, pspRoles, roleLabels } from '@river/psp-access';
import { contractStatusAt } from '@river/psp-contracts';
import type { cabinet } from '@/lib/cabinet';
import { ago, count } from '@/lib/format';
import type { Query } from '@/lib/table';
import { HBars } from '../../charts/HBars';
import { DataTable } from '../../panels/DataTable';
import { Metric } from '../../panels/Metric';
import { Panel } from '../../panels/Panel';
import { Status } from '../../panels/Value';
import { auditColumns, contractColumns } from '../access/columns';
import { endsSoon } from '../access/contracts';

/**
 * The overview of the Access cabinet: contracts in force and those that need someone — unsigned, ending
 * with nobody renewing them, suspended or expired — the grants by role, the requests waiting for a
 * decision, and the latest lines of the audit trail.
 */
export function AccessOverview({ c, locale, query }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; query: Query }) {
  void query;
  const { t, w } = c;
  const contracts = w.contracts.filter((ct) => c.visible.has(ct.unitId));
  const active = contracts.filter((ct) => contractStatusAt(ct, c.now) === 'active').length;
  const ending = contracts.filter((ct) => endsSoon(ct, c.now)).length;
  const awaiting = contracts.filter((ct) => ct.status === 'draft' || ct.status === 'sent').length;
  const attention = contracts.filter((ct) => ['draft', 'sent', 'suspended', 'expired'].includes(contractStatusAt(ct, c.now)) || endsSoon(ct, c.now));
  const pending = w.requests.filter((r) => r.status === 'pending' && c.visible.has(r.unitId)).sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  const grants = w.grants.filter((g) => g.status === 'active' && (g.expiresAt === null || g.expiresAt > c.now) && c.visible.has(g.unitId));
  const people = new Set(grants.map((g) => g.personId)).size;
  const byRole = pspRoles.map((r) => ({ r, n: grants.filter((g) => g.role === r).length })).filter((x) => x.n > 0);
  const latest = w.audit.filter((e) => c.visible.has(e.unitId)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  const contractCols = contractColumns(c, locale).filter((col) => ['number', 'unit', 'kind', 'status', 'validTo'].includes(col.key));
  const auditCols = auditColumns(c, locale).filter((col) => ['at', 'person', 'action', 'target', 'detail'].includes(col.key));
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Metric label={t('Active contracts', 'Чинні договори')} value={count(active, locale)} note={t(`of ${count(contracts.length, locale)} within reach`, `із ${count(contracts.length, locale)} у ваших межах`)} href={c.link('/contracts?status=active')} />
        <Metric label={t('Ending within 30 days', 'Спливають за 30 днів')} value={count(ending, locale)} note={t('and nobody renews them', 'і ніхто їх не подовжує')} tone={ending ? 'warning' : undefined} href={c.link('/contracts')} />
        <Metric label={t('Awaiting signature', 'Очікують підпису')} value={count(awaiting, locale)} note={t('drafts and sent', 'чернетки й надіслані')} tone={awaiting ? 'warning' : undefined} href={c.link('/contracts?status=sent')} />
        <Metric label={t('Pending requests', 'Запити, що чекають')} value={count(pending.length, locale)} note={t('someone else decides', 'вирішує хтось інший')} tone={pending.length ? 'warning' : undefined} href={c.link('/requests')} />
        <Metric label={t('People with access', 'Люди з доступом')} value={count(people, locale)} note={t(`${count(grants.length, locale)} active grants`, `активних доступів: ${count(grants.length, locale)}`)} href={c.link('/people')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={t('Contracts needing attention', 'Договори, що потребують уваги')} note={t('Unsigned, ending with nobody renewing them, suspended or expired.', 'Непідписані, ті, що спливають без подовження, призупинені чи прострочені.')} flush
          actions={<Link href={c.link('/contracts')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All contracts', 'Усі договори')} →</Link>}>
          <div className="px-1"><DataTable columns={contractCols} rows={attention} locale={locale} query={{}} link={(ct) => c.link(`/contracts/${ct.id}`)} empty={t('Every contract within reach is in order.', 'Усі договори у ваших межах у порядку.')} /></div>
        </Panel>
        <Panel title={t('Grants by role', 'Доступи за ролями')} note={t('Active grants at the units within reach.', 'Активні доступи в одиницях у ваших межах.')}>
          {byRole.length === 0 ? <p className="text-ink-500">{t('No grants.', 'Доступів немає.')}</p> : (
            <HBars rows={byRole.map((x) => ({ label: pickText(roleLabels[x.r], locale), value: x.n, display: count(x.n, locale), tone: x.r === 'hierarchy_admin' ? 'sunrise' : x.r === 'compliance_officer' ? 'teal' : 'river' }))} />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <Panel title={t('Requests waiting', 'Запити, що чекають')} tone={pending.length ? 'attention' : 'plain'}
          actions={<Link href={c.link('/requests')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('Decide them', 'Вирішити')} →</Link>}>
          {pending.length === 0 ? <p className="text-ink-500">{t('No request waits.', 'Жоден запит не чекає.')}</p> : (
            <ul className="divide-y divide-graphite/15">
              {pending.map((r) => (
                <li key={r.id} className="py-2.5">
                  <p className="text-[0.9rem] text-ink-900"><span className="font-semibold">{c.personName(r.personId)}</span> · {pickText(roleLabels[r.role], locale)} · {c.unitName(r.unitId)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="annot text-[0.58rem] text-ink-500">{ago(r.requestedAt, c.now, locale)}</span>
                    {dutyConflicts(w.units, w.grants, r).length > 0 ? <Status label={t('breaks the separation of duties', 'порушує розподіл обов’язків')} tone="danger" /> : null}
                    {r.personId === c.actor.personId ? <Status label={t('your own request', 'ваш власний запит')} tone="neutral" /> : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={t('Latest in the audit trail', 'Останнє в журналі аудиту')} flush
          actions={<Link href={c.link('/audit')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('The whole trail', 'Увесь журнал')} →</Link>}>
          <div className="px-1"><DataTable columns={auditCols} rows={latest} locale={locale} query={{}} empty={t('Nothing recorded yet.', 'Ще нічого не записано.')} /></div>
        </Panel>
      </div>
    </div>
  );
}
