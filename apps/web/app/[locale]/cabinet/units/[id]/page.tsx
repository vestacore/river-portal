import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { roleLabels } from '@river/psp-access';
import { contractKindLabels, contractStatusAt, contractStatusLabels } from '@river/psp-contracts';
import type { Currency } from '@river/psp-facts';
import { effectiveRules } from '@river/psp-risk';
import { effectiveFor } from '@river/psp-runtime';
import { ancestorsOf, childrenOf, isWithin, policyDefinitions, policyGroupLabels, policyGroups, unitKindLabels } from '@river/psp-units';
import { childTotals, kpisOf } from '@river/psp-views';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { PolicyEditor } from '@/components/cabinet/PolicyEditor';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { Icon } from '@/components/ui/Icon';
import { blockAction, unitStatusAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { count, money, percent } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { readQuery } from '@/lib/table';

/**
 * One unit of the hierarchy: where it stands in the tree, its datasheet, the flows of its subtree, its
 * resultant set of policy — every policy with the value in effect, where it comes from and the chain
 * from the root — the rules its attempts meet, who may see and steer it, its contracts, and what the
 * swarm noticed in its subtree.
 */
export default async function UnitPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, id, 'flows.read');
  const { t } = c;
  const unit = c.w.units.find((u) => u.id === id);
  if (!unit || !c.visible.has(id)) notFound();
  const path = ancestorsOf(c.w.units, id);
  const children = childrenOf(c.w.units, id);
  const effective = effectiveFor(c.w, id);
  const profile = c.w.profiles[id];
  const group = query.group && (policyGroups as readonly string[]).includes(query.group) ? query.group : 'limits';
  const back = c.link(`/units/${id}?group=${group}`);
  const editableGroup = (g: string) => (g === 'checkout' ? c.may('checkout.write', id) || c.may('policies.write', id) : g === 'risk' ? c.may('rules.write', id) || c.may('policies.write', id) : c.may('policies.write', id));
  const from = new Date(Date.parse(c.now) - 30 * 86_400_000).toISOString();
  const { sessions, payments } = scoped(c.w, c.visible);
  const currency: Currency = unit.currency;
  const k = kpisOf(sessions, payments, currency, from);
  const totals = childTotals(c.w.units, payments, sessions, id, from);
  const rules = effectiveRules(c.w.units, c.w.rules, id);
  const stewards = c.w.grants.filter((g) => g.status === 'active' && isWithin(c.w.units, id, g.unitId));
  const contracts = c.w.contracts.filter((x) => x.unitId === id);
  const insights = c.w.insights.filter((i) => isWithin(c.w.units, i.unitId, id)).slice(-4).reverse();
  const hidden = (n: string, v: string) => <input type="hidden" name={n} value={v} />;
  return (
    <>
      <nav className="annot mb-3 flex flex-wrap items-center gap-1.5 text-[0.6rem] text-ink-500">
        {path.map((u, i) => <span key={u.id} className="flex items-center gap-1.5">{i > 0 ? <span>/</span> : null}{c.visible.has(u.id) || u.id === id ? <Link href={c.link(`/units/${u.id}`)} className="hover:text-ink-900">{pickText(u.name, locale)}</Link> : <span>{pickText(u.name, locale)}</span>}</span>)}
      </nav>
      <CabinetHead kicker={`${pickText(unitKindLabels[unit.kind], locale)} · ${unit.code}`} title={pickText(unit.name, locale)}
        lead={<span className="flex flex-wrap items-center gap-3"><Status label={unit.status === 'active' ? t('active', 'діє') : unit.status === 'onboarding' ? t('onboarding', 'онбординг') : t('suspended', 'призупинено')} tone={unit.status === 'active' ? 'success' : unit.status === 'onboarding' ? 'warning' : 'danger'} />{unit.blockInheritance ? <Status label={t('blocks inheritance', 'блокує успадкування')} tone="danger" /> : null}<span className="text-ink-500">{unit.country} · {unit.currency}{unit.mcc ? ` · MCC ${unit.mcc}` : ''}</span></span>}
        actions={
          <div className="flex flex-wrap gap-2">
            {unit.parentId && c.may('policies.write', unit.parentId) ? <form action={blockAction}>{hidden('unitId', id)}{hidden('block', unit.blockInheritance ? '0' : '1')}{hidden('back', back)}<button type="submit" className="annot border border-graphite/40 px-3 py-2 text-ink-700 hover:border-ink-900">{unit.blockInheritance ? t('Restore inheritance', 'Відновити успадкування') : t('Block inheritance', 'Блокувати успадкування')}</button></form> : null}
            {unit.parentId && c.may('units.write', id) ? <form action={unitStatusAction}>{hidden('unitId', id)}{hidden('status', unit.status === 'suspended' ? 'active' : 'suspended')}{hidden('back', back)}<button type="submit" className={unit.status === 'suspended' ? 'annot border border-teal-600 px-3 py-2 text-teal-600' : 'annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100'}>{unit.status === 'suspended' ? t('Reactivate', 'Відновити') : t('Suspend', 'Призупинити')}</button></form> : null}
          </div>
        } />
      <Flash query={query} locale={locale} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={t(`Captured in the subtree, 30 days, ${currency}`, `Списано в піддереві, 30 днів, ${currency}`)} value={money(k.grossMinor, currency, locale, true)} note={`${count(k.payments, locale)} ${t('payments', 'платежів')}`} />
        <Metric label={t('Approved', 'Схвалено')} value={percent(k.approvalBps, locale)} />
        <Metric label={t('Conversion', 'Конверсія')} value={percent(k.conversionBps, locale)} />
        <Metric label={t('Units below', 'Одиниць нижче')} value={String(c.visible.size - 1)} note={`${children.length} ${t('directly', 'безпосередньо')}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Panel title={t('Resultant set of policy', 'Результуючий набір політик')} note={t('What is in effect here, where it comes from, and what happened to every setting on the way down from the root.', 'Що діє тут, звідки воно, і що сталося з кожним налаштуванням на шляху від кореня донизу.')}>
          <nav className="mb-2 flex flex-wrap gap-1">
            {policyGroups.map((g) => <Link key={g} href={`?group=${g}`} className={`border px-2 py-1 text-[0.78rem] ${g === group ? 'border-ink-900 bg-ink-900 text-paper' : 'border-graphite/25 text-ink-700 hover:border-graphite'}`}>{pickText(policyGroupLabels[g], locale)}<span className="ml-1 font-mono text-[0.65rem] opacity-70">{c.w.settings.filter((s) => s.unitId === id && policyDefinitions.find((d) => d.key === s.key)?.group === g).length || ''}</span></Link>)}
          </nav>
          <div className="divide-y divide-graphite/15">
            {policyDefinitions.filter((d) => d.group === group).map((d) => (
              <PolicyEditor key={d.key} definition={d} effective={effective.find((e) => e.key === d.key)!} here={c.w.settings.find((s) => s.unitId === id && s.key === d.key)} unit={unit} units={c.w.units} locale={locale} back={back} editable={editableGroup(group)} />
            ))}
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title={t('Datasheet', 'Відомості')}>
            {profile ? (
              <FieldGrid locale={locale} columns={2} fields={[
                { label: t('Legal name', 'Повна назва'), cell: { kind: 'text', value: pickText(profile.legalName, locale) }, wide: true },
                { label: t('Registration code', 'Реєстраційний код'), cell: { kind: 'mono', value: profile.registrationCode } },
                { label: t('Registered', 'Зареєстровано'), cell: { kind: 'text', value: profile.registeredAt } },
                { label: t('Legal address', 'Юридична адреса'), cell: { kind: 'text', value: pickText(profile.legalAddress, locale) }, wide: true },
                { label: t('Website', 'Вебсайт'), cell: profile.website ? { kind: 'mono', value: profile.website } : { kind: 'empty' } },
                { label: t('Support', 'Підтримка'), cell: { kind: 'text', value: profile.supportEmail, sub: profile.supportPhone } },
                { label: 'IBAN', cell: profile.iban ? { kind: 'mono', value: profile.iban } : { kind: 'empty' } },
                { label: t('Bank', 'Банк'), cell: profile.bank ? { kind: 'text', value: profile.bank } : { kind: 'empty' } },
                { label: t('Contact', 'Контакт'), cell: { kind: 'text', value: profile.contact.initials, sub: pickText(profile.contact.role, locale) } },
              ]} />
            ) : <p className="text-ink-500">{t('A store or a seller shares its merchant’s datasheet.', 'Точка продажу чи продавець користується відомостями свого мерчанта.')}</p>}
          </Panel>
          <Panel title={t('Units below', 'Одиниці нижче')} note={t('Each child’s whole subtree, 30 days: a parent sees all of it.', 'Усе піддерево кожної дочірньої одиниці за 30 днів: батьківська бачить усе.')}>
            {totals.length === 0 ? <p className="text-ink-500">{t('No units below.', 'Нижчих одиниць немає.')}</p> : (
              <ul className="divide-y divide-graphite/15 text-[0.88rem]">
                {totals.map((x) => <li key={x.unit.id} className="flex items-center justify-between gap-3 py-2"><Link href={c.link(`/units/${x.unit.id}`)} className="text-ink-900 hover:underline hover:decoration-sunrise-500">{pickText(x.unit.name, locale)}<span className="annot ml-2 text-[0.55rem] text-ink-500">{pickText(unitKindLabels[x.unit.kind], locale)}</span></Link><span className="text-right tabular-nums">{Object.entries(x.byCurrency).map(([cur, v]) => money(v ?? 0, cur, locale, true)).join(' · ') || '—'}<span className="annot block text-[0.55rem] text-ink-500">{x.payments} {t('payments', 'платежів')} · {x.sessions ? Math.round((x.succeeded / x.sessions) * 100) : 0} %</span></span></li>)}
              </ul>
            )}
          </Panel>
          <Panel title={t('Rules its attempts meet', 'Правила для його спроб')} actions={<Link href={c.link('/rules')} className="annot text-[0.6rem] text-river-700">{t('All rules', 'Усі правила')} →</Link>}>
            {rules.length === 0 ? <p className="text-ink-500">{t('No rules apply.', 'Правила не застосовуються.')}</p> : (
              <ul className="space-y-2 text-[0.86rem]">{rules.map((r) => <li key={`${r.id}${r.unitId}`} className="flex items-start justify-between gap-3"><span><span className="font-mono text-[0.72rem] text-ink-500">{r.priority}</span> <span className="text-ink-900">{pickText(r.name, locale)}</span>{r.enforced ? <Icon name="lock" className="ml-1 inline size-3 text-sunrise-600" /> : null}<span className="annot block text-[0.55rem] text-ink-500">{t('from', 'від')} {c.unitName(r.unitId)}</span></span><Status label={r.action} tone={r.action === 'block' ? 'danger' : r.action === 'review' ? 'warning' : 'info'} /></li>)}</ul>
            )}
          </Panel>
          <Panel title={t('Who sees and steers it', 'Хто бачить і спрямовує її')} note={t('Every grant at this unit or above it reaches here.', 'Кожен доступ на цій одиниці чи вище сягає сюди.')}>
            <ul className="divide-y divide-graphite/15 text-[0.86rem]">{stewards.map((g) => <li key={g.id} className="flex justify-between gap-3 py-1.5"><span>{c.personName(g.personId)}<span className="annot block text-[0.55rem] text-ink-500">{pickText(roleLabels[g.role], locale)}</span></span><span className="text-right text-ink-500">{c.unitName(g.unitId)}</span></li>)}</ul>
          </Panel>
          {contracts.length > 0 ? (
            <Panel title={t('Contracts', 'Договори')}>
              <ul className="divide-y divide-graphite/15 text-[0.86rem]">{contracts.map((x) => <li key={x.id} className="flex justify-between gap-3 py-1.5"><span className="font-mono text-[0.78rem]">{x.number}<span className="annot block font-sans text-[0.55rem] text-ink-500">{pickText(contractKindLabels[x.kind], locale)}</span></span><Status label={pickText(contractStatusLabels[contractStatusAt(x, c.now)], locale)} tone={contractStatusAt(x, c.now) === 'active' ? 'success' : 'warning'} /></li>)}</ul>
            </Panel>
          ) : null}
        </div>
      </div>
      {insights.length > 0 ? (
        <Panel title={t('What the swarm noticed below', 'Що рій помітив нижче')} className="mt-6">
          <div className="grid gap-3 lg:grid-cols-2">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        </Panel>
      ) : null}
    </>
  );
}
