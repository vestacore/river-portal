import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { settingEntries, type ChannelEntry, type ReferralEntry, type SettingsSnapshot } from '@river/settings';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Icon } from '../ui/Icon';

/** Next to the help form: other ways to reach us, services we refer to, and how we use information. */
export function HelpAside({ settings, locale, dict }: { settings: SettingsSnapshot; locale: Locale; dict: Dictionary }) {
  const channels = settingEntries<ChannelEntry>(settings, 'help.channels');
  const referrals = settingEntries<ReferralEntry>(settings, 'help.referrals');
  return (
    <aside className="mt-12 grid gap-8 sm:grid-cols-2">
      {channels.length > 0 ? (
        <div>
          <h2 className="annot mb-3 text-ink-500">{dict.help.otherWays}</h2>
          <ul className="space-y-2">
            {channels.map((c) => <li key={`${c.kind}-${c.value}`}><span className="text-ink-500">{pickText(c.label, locale)}</span><br /><b className="font-semibold text-ink-900">{c.value}</b></li>)}
          </ul>
        </div>
      ) : null}
      {referrals.length > 0 ? (
        <div>
          <h2 className="annot mb-3 text-ink-500">{dict.help.referrals}</h2>
          <ul className="space-y-3">
            {referrals.map((r) => (
              <li key={r.contact}>
                <b className="font-semibold text-ink-900">{pickText(r.name, locale)}</b> · <span className="whitespace-nowrap">{r.contact}</span>
                <p className="text-sm text-ink-500">{pickText(r.description, locale)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="flex items-center gap-2 text-sm sm:col-span-2">
        <Icon name="shield" className="size-4 text-teal-600" />
        <Link className="text-ink-700 underline decoration-graphite/40 underline-offset-4 hover:text-ink-900" href={href(locale, '/policies/privacy')}>{dict.help.privacyLink}</Link>
      </p>
    </aside>
  );
}
