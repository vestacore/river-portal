import { pickText } from '@river/i18n';
import { dutyConflicts, pspRoles, roleLabels, type Grant, type Person, type PspRole } from '@river/psp-access';
import { ancestorsOf, subtreeOf } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { grantAction, revokeAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { ago, day } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery } from '@/lib/table';

// The pairs of roles one person may not hold over overlapping units (the runtime's `dutyConflicts`), and why.
const separated: ReadonlyArray<[PspRole, PspRole, string, string]> = [
  ['operator', 'compliance_officer', 'Who moves money does not clear its checks.', 'Хто рухає гроші, той не перевіряє їх.'],
  ['access_manager', 'compliance_officer', 'Who hands out access does not clear the checks.', 'Хто видає доступи, той не перевіряє операції.'],
  ['integrator', 'compliance_officer', 'Who wires the integration does not clear the checks.', 'Хто налаштовує інтеграцію, той не перевіряє операції.'],
];

/**
 * People and their grants within reach: who may do what, and where. Each grant is one role at one unit,
 * reaching down its subtree; a manager grants and revokes here, and the separation of duties the runtime
 * enforces is set out beside the list.
 */
export default async function People({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'grants.read');
  const { t } = c;
  const back = c.link(`/people${query.unit ? `?unit=${query.unit}` : ''}`);
  const live = (g: Grant) => g.status === 'active' && (g.expiresAt === null || g.expiresAt > c.now);
  const inReach = (p: Person) => c.visible.has(p.homeUnitId) || c.w.grants.some((g) => g.personId === p.id && c.visible.has(g.unitId));
  const people = c.w.people.filter(inReach);
  const grantsOf = (p: Person) => c.w.grants.filter((g) => g.personId === p.id && c.visible.has(g.unitId)).sort((a, b) => Number(live(b)) - Number(live(a)) || a.grantedAt.localeCompare(b.grantedAt));
  const outside = (p: Person) => c.w.grants.filter((g) => g.personId === p.id && live(g) && !c.visible.has(g.unitId)).length;
  const shown = people.filter((p) => (!query.role || grantsOf(p).some((g) => live(g) && g.role === query.role)) && matches(query.q, pickText(p.name, locale), pickText(p.title, locale), c.unitName(p.homeUnitId)));
  const roleText = (r: PspRole) => pickText(roleLabels[r], locale);
  // Grants already held that break the separation (none, as long as every grant went through the runtime), each pair once.
  const clashes = new Map<string, { p: Person; g: Grant; x: string }>();
  for (const p of people) {
    for (const g of c.w.grants.filter((x) => x.personId === p.id && live(x) && c.visible.has(x.unitId))) {
      for (const x of dutyConflicts(c.w.units, c.w.grants.filter((o) => o.id !== g.id), g)) clashes.set([p.id, ...[`${g.role}@${g.unitId}`, x].sort()].join('|'), { p, g, x });
    }
  }
  const standing = [...clashes.values()];
  const units = subtreeOf(c.w.units, c.focus);
  const depth = (id: string) => ancestorsOf(c.w.units, id).length - ancestorsOf(c.w.units, c.focus).length;
  const field = 'mt-1 block w-full border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  return (
    <>
      <CabinetHead kicker={t('Access', 'Доступ')} title={t('People and grants', 'Люди та доступи')}
        lead={t('Who may do what, and where: a grant gives one role at one unit and reaches down its subtree — never up or sideways.', 'Хто, що і де може робити: доступ дає одну роль в одній одиниці й поширюється вниз її піддеревом — ніколи вгору чи вбік.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="min-w-0 space-y-6">
          {c.may('grants.write') ? (
            <Panel title={t('Grant a role', 'Надати роль')} note={t('The runtime checks the separation of duties before it grants.', 'Перш ніж надати доступ, система перевіряє розподіл обов’язків.')}>
              <form action={grantAction} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <input type="hidden" name="back" value={back} />
                <label className="min-w-0 text-[0.8rem] text-ink-700">{t('Person', 'Особа')}
                  <select name="personId" className={field}>
                    {people.map((p) => <option key={p.id} value={p.id} disabled={p.id === c.actor.personId}>{p.id === c.actor.personId ? `${pickText(p.name, locale)} (${t('you', 'ви')})` : pickText(p.name, locale)}</option>)}
                  </select>
                </label>
                <label className="min-w-0 text-[0.8rem] text-ink-700">{t('Role', 'Роль')}
                  <select name="role" defaultValue="operator" className={field}>
                    {pspRoles.map((r) => <option key={r} value={r} disabled={r === 'hierarchy_admin' && c.actor.role !== 'hierarchy_admin'}>{roleText(r)}</option>)}
                  </select>
                </label>
                <label className="min-w-0 text-[0.8rem] text-ink-700">{t('At the unit', 'В одиниці')}
                  <select name="unitId" defaultValue={c.focus} className={field}>
                    {units.map((u) => <option key={u.id} value={u.id}>{`${'  '.repeat(depth(u.id))}${depth(u.id) > 0 ? '└ ' : ''}${pickText(u.name, locale)}`}</option>)}
                  </select>
                </label>
                <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Grant', 'Надати')}</button>
              </form>
            </Panel>
          ) : null}
          <FilterBar locale={locale} query={query} groups={[
            { param: 'role', label: t('Holds the role', 'Має роль'), options: pspRoles.map((r) => ({ value: r, label: roleText(r), count: people.filter((p) => grantsOf(p).some((g) => live(g) && g.role === r)).length })).filter((o) => o.count > 0) },
          ]} />
          <Panel title={`${t('People within reach', 'Люди у ваших межах')} · ${shown.length}`} flush>
            {shown.length === 0 ? <p className="p-4 text-ink-500">{t('Nobody matches.', 'Нікого не знайдено.')}</p> : (
              <ul className="divide-y divide-graphite/20">
                {shown.map((p) => {
                  const grants = grantsOf(p);
                  const more = outside(p);
                  return (
                    <li key={p.id} className="grid gap-x-6 gap-y-3 px-4 py-4 lg:grid-cols-[minmax(13rem,1fr)_2fr]">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">{pickText(p.name, locale)}{p.id === c.actor.personId ? <span className="annot ml-2 text-[0.6rem] text-sunrise-600">{t('you', 'ви')}</span> : null}</p>
                        <p className="text-[0.85rem] text-ink-500">{pickText(p.title, locale)}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="annot text-[0.6rem] text-ink-500">{c.unitName(p.homeUnitId)}</span>
                          <Status label={p.mfa ? t('MFA on', 'MFA увімкнено') : t('no MFA', 'без MFA')} tone={p.mfa ? 'success' : 'danger'} />
                          <span className="annot text-[0.6rem] text-ink-500" title={day(p.lastSeenAt, locale)}>{t('last seen', 'востаннє')} {ago(p.lastSeenAt, c.now, locale)}</span>
                        </p>
                      </div>
                      <div className="min-w-0">
                        {grants.length === 0 ? <p className="text-[0.85rem] text-ink-500">{t('No grant within your reach.', 'Немає доступів у ваших межах.')}</p> : (
                          <ul className="divide-y divide-graphite/15">
                            {grants.map((g) => (
                              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-[0.88rem]">
                                <span className="min-w-0">
                                  <span className="font-semibold text-ink-900">{roleText(g.role)}</span><span className="text-ink-500"> · </span><span className="text-ink-900">{c.unitName(g.unitId)}</span>
                                  <span className="annot mt-0.5 block text-[0.58rem] text-ink-500">{t('granted', 'надано')} {day(g.grantedAt, locale)} · {c.personName(g.grantedBy)}{g.expiresAt ? ` · ${t('until', 'до')} ${day(g.expiresAt, locale)}` : ''} · <span className="font-mono normal-case tracking-normal">{g.id}</span></span>
                                </span>
                                <span className="flex items-center gap-3">
                                  <Status label={live(g) ? t('active', 'діє') : g.status === 'revoked' ? t('revoked', 'відкликано') : t('expired', 'сплив')} tone={live(g) ? 'success' : 'neutral'} />
                                  {g.id === c.actor.grantId ? <span className="annot text-[0.58rem] text-sunrise-600">{t('your profile now', 'ваш профіль зараз')}</span>
                                    : live(g) && c.may('grants.write', g.unitId) ? (
                                      <form action={revokeAction}>
                                        <input type="hidden" name="grantId" value={g.id} /><input type="hidden" name="back" value={back} />
                                        <button type="submit" className="annot border border-attention-500 px-2.5 py-1.5 text-attention-500 hover:bg-attention-100">{t('Revoke', 'Відкликати')}</button>
                                      </form>
                                    ) : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {more > 0 ? <p className="annot mt-1 text-[0.58rem] text-ink-500">{t(`and ${more} more outside your reach`, `і ще ${more} поза вашими межами`)}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
        <div className="min-w-0 space-y-6">
          <Panel title={t('Separation of duties', 'Розподіл обов’язків')} note={t('The runtime refuses whatever breaks these rules, whoever asks — a grant here or an approved request.', 'Система відмовляє в усьому, що порушує ці правила, хто б не просив, — у доступі тут чи в схваленому запиті.')}>
            <ul className="space-y-3 text-[0.88rem]">
              {separated.map(([a, b, en, uk]) => (
                <li key={`${a}${b}`}>
                  <p className="flex flex-wrap items-baseline gap-x-2"><span className="font-semibold text-ink-900">{roleText(a)}</span><span className="annot text-[0.58rem] text-attention-500">{t('never with', 'не разом із')}</span><span className="font-semibold text-ink-900">{roleText(b)}</span></p>
                  <p className="text-ink-500">{t(en, uk)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.85rem] text-ink-700">{t('Never over overlapping units: when one unit lies within the other’s subtree.', 'Не над одиницями, що перетинаються: коли одна лежить у піддереві іншої.')}</p>
            <ul className="mt-4 space-y-2 border-t border-graphite/20 pt-4 text-[0.88rem] text-ink-700">
              <li>{t('Nobody grants a role to themselves, and nobody decides their own request.', 'Ніхто не надає роль сам собі й не вирішує власний запит.')}</li>
              <li>{t('Only a hierarchy administrator grants the administrator’s role.', 'Роль адміністратора надає лише адміністратор ієрархії.')}</li>
              <li>{t('Nobody revokes the profile they are acting in.', 'Ніхто не відкликає профіль, у якому зараз діє.')}</li>
            </ul>
            <div className="mt-4 border-t border-graphite/20 pt-4">
              {standing.length === 0 ? <Status label={t('Nobody within reach holds roles that must stay apart', 'Ніхто у ваших межах не має ролей, які слід розділяти')} tone="success" /> : (
                <ul className="space-y-1 text-[0.85rem] text-attention-500">
                  {standing.map(({ p, g, x }) => <li key={`${p.id}${g.id}${x}`}>{pickText(p.name, locale)}: {roleText(g.role)} · {c.unitName(g.unitId)} ⟷ {roleText(x.split('@')[0] as PspRole)} · {c.unitName(x.split('@')[1] ?? '')}</li>)}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
