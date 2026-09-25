import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { settingEntries, settingList, type ChannelEntry, type SettingsSnapshot } from '@river/settings';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';

const target = { ask: '/ask', give: '/give', carry: '/give?kind=transport' } as const;
const icon = { ask: 'hand', give: 'heart', carry: 'van' } as const;

/** Three doors for three audiences, ordered in settings (home.doors), plus other ways to reach us. */
export function Doors({ settings, locale, dict }: { settings: SettingsSnapshot; locale: Locale; dict: Dictionary }) {
  const doors = settingList<'ask' | 'give' | 'carry'>(settings, 'home.doors').filter((d) => d in target);
  const channels = settingEntries<ChannelEntry>(settings, 'help.channels');
  if (doors.length === 0) return null;
  return (
    <section className="py-16">
      <Container>
        <h2 className="annot mb-8 flex items-center gap-3 text-ink-500"><span className="h-px w-12 bg-graphite/40" aria-hidden="true" />{dict.doors.title}</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {doors.map((door) => (
            <Link key={door} href={href(locale, target[door])} className="sketch group flex flex-col p-7 transition-colors hover:bg-paper-deep/60">
              <span className={`grid size-12 place-items-center ${door === 'ask' ? 'bg-sunrise-500 text-ink-900' : 'bg-ink-900 text-paper'}`}><Icon name={icon[door]} className="size-6" /></span>
              <span className="mt-5 text-xl font-semibold text-ink-900">{dict.doors[door].title}</span>
              <span className="mt-2 text-ink-500">{dict.doors[door].text}</span>
              <Icon name="arrow" className="mt-6 size-5 text-ink-900 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
        {channels.length > 0 ? (
          <div className="mt-10 grid gap-x-10 gap-y-3 border-t border-graphite/25 pt-5 sm:grid-cols-[auto_1fr] sm:items-baseline">
            <p className="annot text-ink-500">{dict.doors.otherWays}</p>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              {channels.map((c) => <li key={`${c.kind}-${c.value}`} className="text-[0.95rem]"><span className="text-ink-500">{pickText(c.label, locale)}</span> <b className="whitespace-nowrap font-semibold text-ink-900">{c.value}</b></li>)}
            </ul>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
