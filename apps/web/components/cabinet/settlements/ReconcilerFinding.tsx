import Link from 'next/link';
import type { Locale } from '@river/i18n';
import type { Insight } from '@river/psp-agents';
import { lt } from '@/lib/lt';
import { InsightCard } from '../InsightCard';

/** Where a finding of the Reconciler leads: the batch it is about, or the provider's batches for a claim on fees. */
export function findingPath(insight: Insight): string | null {
  const params = insight.proposal?.params ?? {};
  if (typeof params.batchId === 'string') return `/settlements/${params.batchId}`;
  if (insight.series?.startsWith('reconciler:stl_')) return `/settlements/${insight.series.slice('reconciler:'.length)}`;
  if (insight.proposal?.kind === 'raise_claim' && typeof params.provider === 'string') return `/settlements?provider=${encodeURIComponent(params.provider)}`;
  return null;
}

/** Whether a finding of the Reconciler concerns a batch: about it, or a claim that lists it. */
export function findingConcerns(insight: Insight, batchId: string): boolean {
  if (insight.agent !== 'reconciler') return false;
  const batches = insight.proposal?.params.batches;
  return insight.series === `reconciler:${batchId}` || insight.proposal?.params.batchId === batchId || (Array.isArray(batches) && batches.includes(batchId)) || insight.evidence.some((e) => e.id === batchId);
}

/**
 * One finding of the Reconciler as the settlement pages show it: the agent's card, with its proposal and
 * the buttons to decide it, and a link to the batch or batches it is about.
 */
export function ReconcilerFinding({ insight, locale, link, back, canDecide, personName, here }: { insight: Insight; locale: Locale; link: (path: string) => string; back: string; canDecide: boolean; personName: (id: string) => string; here?: string }) {
  const t = lt(locale);
  const path = findingPath(insight);
  const claim = insight.proposal?.kind === 'raise_claim';
  return (
    <div className="min-w-0">
      <InsightCard insight={insight} locale={locale} link={link} back={back} canDecide={canDecide} personName={personName} />
      {path && path !== here ? (
        <p className="mt-1.5 text-right">
          <Link href={link(path)} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{claim ? t('The provider’s batches', 'Пакети провайдера') : t('Open the batch', 'Відкрити пакет')} →</Link>
        </p>
      ) : null}
    </div>
  );
}
