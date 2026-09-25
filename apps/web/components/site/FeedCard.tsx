import Link from 'next/link';
import type { PublicFeedItem } from '@river/feed';
import { formatDate, oblastName, pickText, type Locale } from '@river/i18n';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

const tone = { delivery: 'teal', thanks: 'sunrise', costs: 'river', milestone: 'sunrise', update: 'ink' } as const;

/** One short public news item: a top rule, annotations, the text. */
export function FeedCard({ item, locale, dict }: { item: PublicFeedItem; locale: Locale; dict: Dictionary }) {
  return (
    <article className="flex flex-col border-t border-graphite/70 pt-5">
      <div className="flex items-center gap-3">
        <Badge tone={tone[item.kind]}>{dict.feed.kinds[item.kind]}</Badge>
        <time className="annot ml-auto text-ink-500" dateTime={item.publishedAt}>{formatDate(item.publishedAt, locale)}</time>
      </div>
      <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-900">{pickText(item.text, locale)}</p>
      <div className="annot mt-auto flex items-center gap-3 pt-5 text-ink-500">
        {item.oblastId ? <span>{oblastName(item.oblastId, locale)}</span> : null}
        {item.reportId ? (
          <Link href={href(locale, `/reports/${item.reportId}`)} className="ml-auto inline-flex items-center gap-1.5 text-ink-900 hover:text-river-700">
            {dict.common.readReport}<Icon name="arrow" className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
