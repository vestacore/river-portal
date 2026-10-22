import Link from 'next/link';
import type { Locale } from '@river/i18n';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { Icon } from '@/components/ui/Icon';
import { ago } from '@/lib/format';
import { lt } from '@/lib/lt';
import { stateCell } from './stateCell';
import { systemName } from './systemName';
import type { ConnectedSystem } from './systemsOf';

/**
 * The connections at a glance: each connected system with its state, its calls and deliveries of the
 * last day, and its failures in a row or its last success — each a link to its part of the Connections page.
 */
export function SystemsStrip({ systems, locale, now, link, unitName }: { systems: readonly ConnectedSystem[]; locale: Locale; now: string; link: (path: string) => string; unitName: (id: string) => string }) {
  const t = lt(locale);
  return (
    <Panel title={t('Connections', 'Підключення')} note={t('The group’s systems joined to the platform, and how each did in the last day.', 'Системи групи, з’єднані з платформою, і як кожна працювала за останню добу.')}
      actions={<Link href={link('/connectors')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All connections', 'Усі підключення')} →</Link>}>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {systems.map((s) => {
          const h = s.health;
          const state = stateCell(h.state, locale);
          return (
            <li key={s.id} className="min-w-0">
              <Link href={link(`/connectors#${s.id}`)} className="block h-full border border-graphite/20 p-3 hover:bg-paper-deep">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-ink-900"><Icon name={s.definition?.icon ?? 'plug'} className="size-4 shrink-0 text-sunrise-600" /><span className="min-w-0 truncate">{systemName(s, locale, unitName)}</span></span>
                <span className="mt-1.5 block"><Status label={state.label} tone={state.tone} /></span>
                {h.state === 'unseen' ? null : (
                  <>
                    <span className="annot mt-2 block text-[0.56rem] text-ink-500">{t(`calls, 24 h: ${h.calls} · deliveries: ${h.deliveries}`, `викликів за 24 год: ${h.calls} · доставок: ${h.deliveries}`)}</span>
                    <span className="mt-1 block text-[0.8rem] text-ink-700">
                      {h.failingStreak >= 3 ? t(`${h.failingStreak} failures in a row`, `збоїв поспіль: ${h.failingStreak}`)
                        : h.lastSuccessAt ? `${t('last success', 'востаннє успішно')} ${ago(h.lastSuccessAt, now, locale)}`
                        : t('nothing went through yet', 'ще нічого не пройшло')}
                    </span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
