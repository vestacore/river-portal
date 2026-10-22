import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { pickText, segmentForLocale } from '@river/i18n';
import { scopesOf } from '@river/psp-access';
import { agentCatalogue } from '@river/psp-agents';
import { reconcileSettlements, visibleUnits } from '@river/psp-runtime';
import { CabinetNav } from '@/components/cabinet/CabinetNav';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { LogoMark } from '@/components/site/LogoMark';
import { signOut, switchProfile } from '@/lib/actions/demo';
import { menuOf, sections, standLabels } from '@/lib/cabinetNav';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { requireActor } from '@/lib/session';
import { roleText } from '@/lib/roleText';
import { standOfPerson, world } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Cabinet', 'Кабінет'), robots: { index: false, follow: false } };
}

/**
 * The cabinet's frame: who is acting and in which profile (a role at a unit), a switch to their other
 * profiles, the role's menu, and the language. Every page inside checks its own permission again.
 */
export default async function CabinetLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const actor = await requireActor(locale);
  const stand = standOfPerson(actor.personId);
  const w = world(stand);
  const now = new Date().toISOString();
  const person = w.people.find((p) => p.id === actor.personId)!;
  const scopes = scopesOf(w.grants, actor.personId, now);
  const unit = w.units.find((u) => u.id === actor.unitId)!;
  const segment = segmentForLocale(locale);
  const reach = visibleUnits(w, actor);
  const audience = new Set(agentCatalogue.filter((a) => a.audience.includes(actor.role)).map((a) => a.id));
  const badges: Partial<Record<string, number>> = {
    reviews: [...w.views.sessions.values()].filter((s) => s.outcome === 'review' && reach.has(s.unitId)).length,
    requests: w.requests.filter((r) => r.status === 'pending' && reach.has(r.unitId)).length,
    agents: w.insights.filter((i) => i.status === 'open' && audience.has(i.agent) && reach.has(i.unitId)).length,
    settlements: w.views.settlements.size > 0 ? reconcileSettlements(w, now).filter((r) => !['matched', 'resolved', 'awaiting_report', 'awaiting_credit'].includes(r.reconciliation.status) && reach.has(r.view.storeId ?? r.view.merchantId)).length : 0,
  };
  const label = (key: keyof typeof sections) => standLabels[stand]?.[key] ?? [sections[key].en, sections[key].uk];
  const groups = menuOf(stand, actor.role).map((g) => ({
    label: g.group ? t(g.group[0], g.group[1]) : null,
    items: g.items.map((key) => ({ href: href(locale, `/cabinet${sections[key].path}`), label: t(label(key)[0], label(key)[1]), icon: sections[key].icon, ...(badges[key] ? { badge: badges[key] } : {}) })),
  }));
  const root = w.units.find((u) => u.parentId === null);
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-ink-900 bg-ink-900 text-paper">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
          <Link href={href(locale)} className="flex items-center gap-2.5"><LogoMark className="size-7" /><span className="font-semibold">River</span></Link>
          <span className="annot hidden text-paper/50 sm:inline">{pickText(root?.name, locale)} · {t('demo stand', 'демо-стенд')}</span>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 border border-paper/25 px-3 py-1.5 text-[0.85rem] hover:border-paper/60">
                <span className="font-semibold">{pickText(person.name, locale)}</span>
                <span className="annot text-[0.6rem] text-sunrise-300">{pickText(roleText(stand, actor.role), locale)} · {pickText(unit.name, locale)}</span>
              </summary>
              <div className="absolute right-0 z-50 mt-1 w-80 border border-ink-900 bg-paper p-3 text-ink-900 shadow-none">
                <p className="annot mb-2 text-[0.6rem] text-ink-500">{t('Profiles of', 'Профілі')} {pickText(person.name, locale)}</p>
                <ul className="space-y-1">
                  {scopes.map((g) => (
                    <li key={g.id}>
                      <form action={switchProfile}>
                        <input type="hidden" name="grantId" value={g.id} />
                        <input type="hidden" name="locale" value={segment} />
                        <button type="submit" className={`w-full border px-2.5 py-2 text-left text-[0.85rem] ${g.id === actor.grantId ? 'border-ink-900 bg-paper-deep' : 'border-graphite/20 hover:border-graphite'}`}>
                          <b className="font-semibold">{pickText(roleText(stand, g.role), locale)}</b><span className="annot block text-[0.6rem] text-ink-500">{pickText(w.units.find((u) => u.id === g.unitId)?.name, locale)}</span>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-graphite/20 pt-3">
                  <Link href={href(locale, '/demo')} className="annot text-river-700 hover:text-ink-900">{t('Act as someone else', 'Діяти як інша людина')}</Link>
                  <form action={signOut}><input type="hidden" name="locale" value={segment} /><button type="submit" className="annot text-ink-500 hover:text-ink-900">{t('Sign out', 'Вийти')}</button></form>
                </div>
              </div>
            </details>
            <div className="[&_a]:text-paper/70 [&_a[aria-current]]:text-paper"><LanguageSwitcher current={segment} label={t('Language', 'Мова')} /></div>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-graphite/20 bg-paper-deep py-5 lg:block">
          <div className="sticky top-16"><CabinetNav groups={groups} /></div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="border-b border-graphite/15 bg-paper-deep px-4 py-2 lg:hidden">
            <details><summary className="annot cursor-pointer text-ink-700">{t('Menu', 'Меню')}</summary><div className="mt-3"><CabinetNav groups={groups} /></div></details>
          </div>
          <main id="main" className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
