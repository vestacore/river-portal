import { pickText } from '@river/i18n';
import { dutyConflicts, roleLabels, type AccessRequest, type PspRole } from '@river/psp-access';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { ago } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery, sortAndPage } from '@/lib/table';
import { requestDecisionAction } from '@/lib/actions/cabinet';

/**
 * Requests for a role at a unit within reach. Someone other than the person asking decides; before they
 * do, the page says what the runtime will refuse — a request that breaks the separation of duties, one's
 * own request, the administrator's role asked of someone who is not an administrator.
 */
export default async function Requests({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'grants.read');
  const { t } = c;
  const back = c.link(`/requests${query.unit ? `?unit=${query.unit}` : ''}`);
  const all = c.w.requests.filter((r) => c.visible.has(r.unitId));
  const pending = all.filter((r) => r.status === 'pending').sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  const decided = all.filter((r) => r.status !== 'pending').sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''));
  const roleText = (r: PspRole) => pickText(roleLabels[r], locale);
  const warnings = (r: AccessRequest): string[] => {
    const who = c.personName(r.personId);
    const held = dutyConflicts(c.w.units, c.w.grants, r).map((x) => { const [role, unitId] = x.split('@'); return `${roleText(role as PspRole)} · ${c.unitName(unitId ?? '')}`; });
    return [
      ...(held.length > 0 ? [t(`It will be refused: ${who} already holds ${held.join(', ')}, and the two roles must stay apart over the same units.`, `Його буде відхилено: ${who} уже має роль ${held.join(', ')}, а ці ролі не можна поєднувати над тими самими одиницями.`)] : []),
      ...(r.personId === c.actor.personId ? [t('This is your own request: someone else must decide it.', 'Це ваш власний запит: рішення має ухвалити хтось інший.')] : []),
      ...(r.role === 'hierarchy_admin' && c.actor.role !== 'hierarchy_admin' ? [t('Only a hierarchy administrator grants this role: approving it here will be refused.', 'Цю роль надає лише адміністратор ієрархії: схвалення тут буде відхилено.')] : []),
    ];
  };
  const columns: Column<AccessRequest>[] = [
    { key: 'person', label: t('Person', 'Особа'), cell: (r) => ({ kind: 'text', value: c.personName(r.personId) }), sort: (r) => c.personName(r.personId) },
    { key: 'role', label: t('Role asked for', 'Запитана роль'), cell: (r) => ({ kind: 'text', value: roleText(r.role) }), sort: (r) => r.role },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (r) => ({ kind: 'unit', name: c.unitName(r.unitId) }), sort: (r) => c.unitName(r.unitId) },
    { key: 'reason', label: t('Reason given', 'Обґрунтування'), cell: (r) => ({ kind: 'text', value: pickText(r.reason, locale) }) },
    { key: 'requested', label: t('Asked', 'Запит'), cell: (r) => ({ kind: 'datetime', iso: r.requestedAt }), sort: (r) => r.requestedAt },
    { key: 'status', label: t('Decision', 'Рішення'), cell: (r) => (r.status === 'approved' ? { kind: 'status', label: t('approved', 'схвалено'), tone: 'success' } : { kind: 'status', label: t('declined', 'відхилено'), tone: 'danger' }), sort: (r) => r.status },
    { key: 'by', label: t('Decided by', 'Хто вирішив'), cell: (r) => (r.decidedBy ? { kind: 'text', value: c.personName(r.decidedBy) } : { kind: 'empty' }), sort: (r) => (r.decidedBy ? c.personName(r.decidedBy) : '') },
    { key: 'decided', label: t('Decided', 'Коли'), cell: (r) => ({ kind: 'datetime', iso: r.decidedAt }), sort: (r) => r.decidedAt ?? '' },
  ];
  const page = sortAndPage(decided, columns, query);
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  return (
    <>
      <CabinetHead kicker={t('Access', 'Доступ')} title={t('Access requests', 'Запити доступу')}
        lead={t('People ask for a role at a unit; someone else decides. Approved, the role is granted at once — unless it breaks the separation of duties, which the runtime refuses.', 'Люди просять роль в одиниці; вирішує хтось інший. Після схвалення роль надається одразу — якщо не порушує розподіл обов’язків: таке система відхиляє.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <Panel title={`${t('Waiting for a decision', 'Чекають на рішення')} · ${pending.length}`} tone={pending.length > 0 ? 'attention' : 'plain'} flush>
        {pending.length === 0 ? <p className="p-4 text-ink-500">{t('No request waits.', 'Жоден запит не чекає.')}</p> : (
          <ul className="divide-y divide-graphite/20">
            {pending.map((r) => {
              const warned = warnings(r);
              const mayDecide = r.personId !== c.actor.personId && c.may('grants.write', r.unitId);
              return (
                <li key={r.id} className="grid gap-x-8 gap-y-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="text-[0.95rem] text-ink-900"><span className="font-semibold">{c.personName(r.personId)}</span> {t('asks for the role', 'просить роль')} <span className="font-semibold">{roleText(r.role)}</span> {t('at', 'в одиниці')} <span className="font-semibold">{c.unitName(r.unitId)}</span></p>
                    <p className="mt-1 text-[0.88rem] text-ink-700">“{pickText(r.reason, locale)}”</p>
                    <p className="annot mt-1 text-[0.58rem] text-ink-500">{t('asked', 'запит')} {ago(r.requestedAt, c.now, locale)} · <span className="font-mono normal-case tracking-normal">{r.id}</span></p>
                    {warned.map((w) => <p key={w} role="note" className="mt-2 border-l-2 border-attention-500 bg-attention-100 px-3 py-2 text-[0.85rem] text-ink-900">{w}</p>)}
                  </div>
                  {mayDecide ? (
                    <div className="flex flex-wrap items-start gap-2">
                      <form action={requestDecisionAction}>{hidden('requestId', r.id)}{hidden('decision', 'approve')}{hidden('back', back)}<button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Approve and grant', 'Схвалити й надати')}</button></form>
                      <form action={requestDecisionAction}>{hidden('requestId', r.id)}{hidden('decision', 'reject')}{hidden('back', back)}<button type="submit" className="annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Decline', 'Відхилити')}</button></form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel title={t('Decided', 'Вирішені')} className="mt-6" flush>
        <div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} empty={t('Nothing decided yet.', 'Ще нічого не вирішено.')} /></div>
      </Panel>
    </>
  );
}
