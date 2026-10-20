import { pickText } from '@river/i18n';
import { roleLabels } from '@river/psp-access';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { FlowsOverview } from '@/components/cabinet/FlowsOverview';
import { RoleOverview } from '@/components/cabinet/RoleOverview';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { Flash } from '@/components/panels/Flash';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

/**
 * The overview of a cabinet. Who looks decides what it shows: the flows of the profile's reach for the
 * operators, the administrator, a merchant's owner and the auditor; their own work for the others.
 */
export default async function Overview({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit);
  const { t } = c;
  const days = query.days === '7' ? 7 : query.days === '90' ? 75 : 30;
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const flows = ['operator', 'hierarchy_admin', 'merchant_owner', 'auditor'].includes(c.actor.role);
  const back = c.link(`${query.unit ? `?unit=${query.unit}` : ''}`);
  return (
    <>
      <CabinetHead kicker={`${pickText(roleLabels[c.actor.role], locale)} · ${c.unitName(c.focus)}`} title={t('Overview', 'Огляд')}
        lead={flows ? t('Everything that flows through the units of your reach — and what waits for someone.', 'Усе, що тече через одиниці у ваших межах, — і що чекає на когось.') : undefined}
        actions={flows ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="annot flex gap-1 text-[0.6rem]">{[['7', '7'], ['30', '30'], ['90', '75']].map(([v, label]) => <a key={v} href={`?days=${v}${query.unit ? `&unit=${query.unit}` : ''}`} className={`border px-2 py-1 ${String(days) === label ? 'border-ink-900 bg-ink-900 text-paper' : 'border-graphite/30 text-ink-700'}`}>{label} {t('d', 'дн')}</a>)}</div>
            <ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />
          </div>
        ) : undefined} />
      <Flash query={query} locale={locale} />
      {flows
        ? <FlowsOverview w={c.w} visible={c.visible} locale={locale} ctx={ctx} role={c.actor.role} days={days} back={back} canDecide={c.may('agents.decide')} personName={c.personName} />
        : <RoleOverview c={c} locale={locale} query={query} />}
    </>
  );
}
