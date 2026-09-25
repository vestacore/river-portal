import type { BlockMap } from '@river/content';
import type { Locale } from '@river/i18n';
import type { Dictionary } from '@/lib/dictionary/types';
import { Editable } from '../edit/Editable';
import { Container } from '../ui/Container';

/** The river in four steps: a straight process line with diamond nodes and oblique arrowheads. */
export function HowItWorks({ locale, dict, blocks }: { locale: Locale; dict: Dictionary; blocks: BlockMap }) {
  return (
    <section className="py-24">
      <Container>
        <div className="mb-14 max-w-2xl">
          <p className="annot mb-4 flex items-center gap-3 text-ink-500"><span className="text-sunrise-600">§ 01</span><span className="h-px w-12 bg-graphite/40" aria-hidden="true" /></p>
          <Editable blocks={blocks} blockId="home.how.title" locale={locale} as="h2" className="text-3xl font-semibold sm:text-[2.6rem]" />
          <Editable blocks={blocks} blockId="home.how.lead" locale={locale} className="mt-4 text-lg text-ink-500" />
        </div>
        <ol className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {dict.home.how.map((step, i) => (
            <li key={step.title} className={`relative animate-rise pl-9 sm:pl-0 ${i < 3 ? "before:absolute before:left-[6px] before:top-6 before:-bottom-10 before:w-px before:bg-graphite/35 sm:before:hidden" : ''}`} style={{ animationDelay: `${i * 110}ms` }}>
              <div className="absolute left-0 top-0.5 mb-7 flex h-4 items-center sm:relative sm:top-0">
                <span className={`relative z-10 size-3.5 rotate-45 border border-graphite ${i === 3 ? 'bg-teal-500' : i === 0 ? 'bg-sunrise-500' : 'bg-paper'}`} aria-hidden="true" />
                {i < 3 ? (
                  <span className="absolute left-5 right-[-2rem] top-1/2 hidden h-px bg-graphite/60 lg:block" aria-hidden="true">
                    <span className="absolute -right-px -top-[4px] h-[9px] w-px rotate-45 bg-graphite" />
                  </span>
                ) : null}
              </div>
              <p className="annot text-ink-500">{dict.home.step} 0{i + 1}</p>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-ink-500">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
