import type { Metadata } from 'next';
import { readPublicFeed } from '@river/feed';
import { getRuntime } from '@river/runtime';
import { FeedCard } from '@/components/site/FeedCard';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { resolveLocale } from '@/lib/resolveLocale';

export const revalidate = 30;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).feed.title };
}

/** The public feed: short, human-approved news composed from reports. */
export default async function FeedPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const runtime = await getRuntime();
  const items = await readPublicFeed(runtime.store, runtime.config.orgId, 60);
  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading title={<h1>{dict.feed.title}</h1>} lead={dict.feed.lead} />
      {items.length === 0 ? <p className="text-ink-500">{dict.home.feedEmpty}</p> : (
        <div className="columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {items.map((item) => <FeedCard key={item.id} item={item} locale={locale} dict={dict} />)}
        </div>
      )}
    </Container>
  );
}
