import Link from 'next/link';
import { formatMoney, pickText, type Locale } from '@river/i18n';
import type { CampaignCard as Campaign } from '@river/pages';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Icon } from '../ui/Icon';
import { ProgressBar } from '../ui/ProgressBar';

/** Campaign as a sketched sheet: purpose, a measuring scale, and the numbers as annotations. */
export function CampaignCard({ campaign, locale, dict }: { campaign: Campaign; locale: Locale; dict: Dictionary }) {
  const money = (n: number) => formatMoney(n, campaign.currency, locale);
  const pct = campaign.goalMinor > 0 ? Math.round((campaign.receivedMinor / campaign.goalMinor) * 100) : 0;
  const facts = [
    [dict.campaign.raised, money(campaign.receivedMinor)],
    [dict.campaign.goal, money(campaign.goalMinor)],
    [dict.campaign.spent, money(campaign.spentGbpMinor)],
    [dict.campaign.gifts, String(campaign.giftsCount)],
  ];
  return (
    <Link href={href(locale, `/campaigns/${campaign.slug}`)} className="sketch group flex flex-col p-8 transition-colors hover:bg-paper-deep/60">
      <p className="annot flex items-center gap-2 text-ink-500">
        <span className={`size-1.5 ${campaign.status === 'active' ? 'bg-teal-500' : 'bg-ink-300'}`} aria-hidden="true" />
        {dict.campaign.label} · {dict.campaign[campaign.status]}
      </p>
      <h3 className="mt-4 text-2xl font-semibold leading-snug text-ink-900">{pickText(campaign.title, locale)}</h3>
      <p className="mt-3 line-clamp-3 text-ink-500">{pickText(campaign.summary, locale)}</p>
      <div className="mt-auto pt-8">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-display text-3xl font-semibold tabular-nums text-ink-900">{money(campaign.receivedMinor)}</span>
          <span className="annot text-ink-500">{pct}%</span>
        </div>
        <ProgressBar value={campaign.receivedMinor} pending={campaign.pledgedMinor} goal={campaign.goalMinor} label={pickText(campaign.title, locale)} />
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-graphite/20 pt-5">
          {facts.map(([label, value]) => (
            <div key={label}><dt className="annot text-ink-500">{label}</dt><dd className="mt-1 font-medium tabular-nums text-ink-900">{value}</dd></div>
          ))}
        </dl>
        <span className="mt-6 inline-flex items-center gap-2 font-semibold text-ink-900 underline decoration-sunrise-500 decoration-2 underline-offset-[6px]">
          {dict.campaign.view}<Icon name="arrow" className="size-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
