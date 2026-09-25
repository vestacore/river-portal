import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { segmentForLocale } from '@river/i18n';
import { getRuntime, personaName, type PersonaId } from '@river/runtime';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { actAsAction } from '@/lib/actions/demoActions';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { loadSettings } from '@/lib/loadSettings';
import { resolveLocale } from '@/lib/resolveLocale';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).walk.title, robots: { index: false, follow: false } };
}

// Who acts at each step of the walk, and where they start (aligned with dict.walk.steps).
const route: Array<[PersonaId, string]> = [
  ['olena', '/ask'], ['andriy', '/studio/inflow'], ['james', '/give'], ['andriy', '/studio/inflow'], ['mykola', '/me'],
  ['olena', '/me'], ['helen', '/studio/tolls'], ['sofia', '/studio/surface'], ['james', '/me'], ['iryna', '/studio/settings'],
];

/** The guided walk: the whole river in ten steps, each signing in as the person whose turn it is. */
export default async function WalkPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  if ((await getRuntime()).config.auth !== 'demo') notFound();
  const dict = getDictionary(locale);
  const t = dict.walk;
  const settings = await loadSettings();
  const segment = segmentForLocale(locale);
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 08`} title={t.title} lead={t.lead} />
      <Container narrow className="py-16">
        <ol className="relative border-l border-graphite/40">
          {t.steps.map((step, i) => {
            const [personaId, path] = route[i] as [PersonaId, string];
            const name = personaName(personaId, settings.profileId, locale);
            return (
              <li key={step.title} className="relative pb-12 pl-10 last:pb-0">
                <span className="absolute -left-4 top-0 grid size-8 place-items-center bg-ink-900 font-mono text-sm text-paper">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="text-xl font-semibold text-ink-900">{step.title}</h2>
                <p className="mt-1 text-ink-700">{step.text}</p>
                <form action={actAsAction} className="mt-4">
                  <input type="hidden" name="personaId" value={personaId} />
                  <input type="hidden" name="localeSegment" value={segment} />
                  <input type="hidden" name="next" value={`/${segment}${path}`} />
                  <button type="submit" className="inline-flex items-center gap-2 text-[0.95rem] font-semibold text-ink-900 underline decoration-sunrise-500 decoration-2 underline-offset-[6px] hover:text-river-800">
                    {t.go.replace('{name}', name)} <span className="annot text-ink-500">{path}</span><Icon name="arrow" className="size-4" />
                  </button>
                </form>
              </li>
            );
          })}
        </ol>
      </Container>
    </>
  );
}
