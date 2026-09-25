import type { Metadata } from 'next';
import { findCategory, type TimelineCode } from '@river/needs';
import { formatDate, pickText, segmentForLocale } from '@river/i18n';
import { readRecipientView } from '@river/needs';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { Timeline } from '@/components/ui/Timeline';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { resolveLocale } from '@/lib/resolveLocale';
import { ConfirmForm } from '@/components/site/ConfirmForm';
import { QuickExitFor } from '@/components/site/QuickExitFor';
import { loadSettings } from '@/lib/loadSettings';
import { confirmAction } from './actions';
import { CopyLink } from './CopyLink';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).track.title, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

const journey: TimelineCode[] = ['submitted', 'acknowledged', 'triaged', 'matched', 'dispatched', 'delivered', 'confirmed'];

/** A recipient's private view of their request, reached only through the tracking link. */
export default async function TrackPage({ params, searchParams }: { params: Promise<{ locale: string; token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { locale: segment, token } = await params;
  const locale = resolveLocale(segment);
  const dict = getDictionary(locale);
  const t = dict.track;
  const [runtime, settings] = await Promise.all([getRuntime(), loadSettings()]);
  const view = await readRecipientView(runtime.store, runtime.config.orgId, token);
  if (!view) {
    return <Container narrow className="py-24"><h1 className="text-3xl font-extrabold">{t.title}</h1><p className="mt-4 text-lg text-ink-500">{t.notFound}</p></Container>;
  }
  const isNew = (await searchParams).new === '1';
  const done = new Map(view.timeline.map((e) => [e.code, e.at]));
  const steps = journey.map((code) => ({ label: t.timeline[code], when: done.has(code) ? formatDate(done.get(code) as string, locale, true) : undefined, done: done.has(code) }));
  return (
    <Container narrow className="py-14 sm:py-20">
      <QuickExitFor settings={settings} dict={dict} />
      {isNew ? (
        <div className="chamfer mb-10 animate-rise p-7 [--cut:24px] [--fill:var(--color-teal-100)]">
          <Icon name="check" className="size-9 text-teal-600" />
          <h1 className="mt-3 text-3xl font-extrabold">{t.newTitle}</h1>
          <p className="mt-2 text-ink-700">{t.newText}</p>
          <div className="mt-4"><CopyLink label={t.copy} done={t.copied} /></div>
        </div>
      ) : <h1 className="mb-8 text-4xl font-extrabold">{t.title}</h1>}
      <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
        <div className="sketch bg-paper p-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">{t.statusLead}</p>
          <p className="mb-6 mt-1"><Badge tone="teal">{pickText(findCategory(view.categoryId)?.label, locale)}</Badge></p>
          <Timeline steps={steps} />
        </div>
        <div className="sketch bg-paper p-7">
          {view.canConfirm ? <ConfirmForm action={confirmAction.bind(null, token)} localeSegment={segmentForLocale(locale)} t={t} /> : (
            <div className="grid h-full place-items-center text-center text-ink-500">
              <div><Icon name={view.status === 'confirmed' ? 'heart' : 'route'} className="mx-auto size-12 text-teal-500" /><p className="mt-3">{view.status === 'confirmed' ? t.confirmedText : t.timeline.acknowledged}</p></div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
