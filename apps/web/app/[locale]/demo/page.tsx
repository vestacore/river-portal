import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatMoney, pickText, segmentForLocale } from '@river/i18n';
import { getRuntime, listPersonas, personaName } from '@river/runtime';
import { findSettingDefinition, listProfiles, resolveSettings, settingNumber, settingText } from '@river/settings';
import { PageHead } from '@/components/site/PageHead';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { actAsAction, signOutAction, switchProfileAction } from '@/lib/actions/demoActions';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { getIdentity } from '@/lib/getIdentity';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { resolveLocale } from '@/lib/resolveLocale';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).nav.demo, robots: { index: false, follow: false } };
}

const banks = ['left', 'right', 'channel', 'stewards'] as const;

/**
 * Demo sign-in (adr/records/ADR-0021): act as any persona on the river, and choose the organisation
 * profile. Exists only when demo authentication is on (local runs and the sandbox).
 */
export default async function DemoPage({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const runtime = await getRuntime();
  if (runtime.config.auth !== 'demo') notFound();
  const dict = getDictionary(locale);
  const t = dict.demo;
  const [settings, identity] = await Promise.all([loadSettings(), getIdentity(locale)]);
  const { next } = await searchParams;
  const segment = segmentForLocale(locale);
  const label = (key: string) => pickText(findSettingDefinition(key)?.label, locale);
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 07`} title={t.title} lead={t.lead}>
        {identity ? (
          <form action={signOutAction} className="mt-8 flex flex-wrap items-center gap-4">
            <input type="hidden" name="localeSegment" value={segment} />
            <span className="annot text-ink-700">{t.current} <b className="text-ink-900">{identity.name}</b></span>
            <button type="submit" className="annot border border-graphite/30 px-3 py-1.5 text-ink-700 hover:border-graphite">{dict.nav.signOut}</button>
          </form>
        ) : null}
      </PageHead>
      <Container className="py-16">
        <div className="grid gap-x-12 gap-y-14 lg:grid-cols-2">
          {banks.map((bank) => (
            <section key={bank}>
              <h2 className="annot mb-5 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{t.banks[bank]}</h2>
              <ul className="grid gap-5">
                {listPersonas().filter((p) => p.bank === bank).map((p) => {
                  const active = identity?.personaId === p.id;
                  return (
                    <li key={p.id} className={`sketch grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center ${active ? 'bg-sunrise-100' : 'bg-paper'}`}>
                      <div>
                        <p className="text-lg font-semibold text-ink-900">{personaName(p.id, settings.profileId, locale)}</p>
                        <p className="annot mt-1 text-ink-500">{p.roles.map((r) => dict.roles[r]).join(' · ')}</p>
                        <p className="mt-2 text-[0.95rem] text-ink-700">{pickText(p.description, locale)}</p>
                      </div>
                      <form action={actAsAction}>
                        <input type="hidden" name="personaId" value={p.id} />
                        <input type="hidden" name="localeSegment" value={segment} />
                        {next ? <input type="hidden" name="next" value={next} /> : null}
                        <button type="submit" className="chamfer inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-paper [--cut:7px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]">
                          {active ? <Icon name="check" className="size-4" /> : null}{active ? t.active : t.actAs}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-14"><Button href={href(locale, '/demo/walk')} variant="secondary">{t.walk}<Icon name="arrow" className="size-4" /></Button></div>

        {runtime.config.store === 'memory' ? (
          <section className="mt-24 border-t border-graphite/15 pt-16">
            <SectionHeading index="07.2" title={t.profilesTitle} lead={t.profilesLead} />
            <div className="grid gap-8 lg:grid-cols-3">
              {listProfiles().map((profile) => {
                const active = profile.id === settings.profileId;
                const preset = resolveSettings(profile.id, {});
                const currency = settingText(preset, 'money.reportingCurrency');
                return (
                  <form key={profile.id} action={switchProfileAction} className={`sketch flex flex-col p-6 ${active ? 'bg-sunrise-100' : 'bg-paper'}`}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="localeSegment" value={segment} />
                    <h3 className="text-xl font-semibold text-ink-900">{pickText(profile.label, locale)}</h3>
                    <p className="mt-2 flex-1 text-[0.95rem] text-ink-700">{pickText(profile.description, locale)}</p>
                    <dl className="mt-5 border-t border-graphite/40 text-sm">
                      {([
                        [label('money.reportingCurrency'), currency],
                        [label('money.costApprovalLimit'), formatMoney(settingNumber(preset, 'money.costApprovalLimit'), currency, locale)],
                        [label('publication.safetyDelayDays'), String(settingNumber(preset, 'publication.safetyDelayDays'))],
                      ] as const).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-graphite/15 py-2"><dt className="text-ink-500">{k}</dt><dd className="font-mono tabular-nums text-ink-900">{v}</dd></div>
                      ))}
                    </dl>
                    <div className="mt-5">
                      {active ? <Badge tone="teal">{t.active}</Badge> : <button type="submit" className="annot border border-graphite/40 px-3 py-2 text-ink-900 hover:border-graphite">{t.switchTo}</button>}
                    </div>
                  </form>
                );
              })}
            </div>
            <p className="annot mt-8 text-ink-500">{t.resets}</p>
          </section>
        ) : null}
      </Container>
    </>
  );
}
