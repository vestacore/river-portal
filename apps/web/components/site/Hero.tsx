import type { BlockMap } from '@river/content';
import { pickText, type Locale } from '@river/i18n';
import { settingBoolean, settingLocalised, type SettingsSnapshot } from '@river/settings';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';
import { RiverDrawing } from './RiverDrawing';
import { SiteText } from './SiteText';

/** Home hero on graph paper: sheet annotation, editable headline, three paths, and Fig. 1. */
export function Hero({ locale, dict, blocks, settings }: { locale: Locale; dict: Dictionary; blocks: BlockMap; settings: SettingsSnapshot }) {
  const drawing = settingBoolean(settings, 'home.heroDrawing');
  return (
    <section className="paper-grid relative overflow-hidden border-b border-graphite/15 pb-20 pt-12 sm:pt-16">
      <Container>
        <div className={`grid items-center gap-12 ${drawing ? 'lg:grid-cols-[1fr_1.1fr] lg:gap-10' : ''}`}>
          <div className="animate-rise">
            <p className="annot mb-8 flex items-center gap-3 text-ink-500">
              <span className="text-sunrise-600">{dict.home.sheet} · {pickText(settingLocalised(settings, 'org.name'), locale)}</span>
              <span className="h-px w-16 bg-graphite/40" aria-hidden="true" />
            </p>
            <SiteText blocks={blocks} blockId="home.hero.title" locale={locale} as="h1" className="text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] text-ink-900 sm:text-6xl lg:text-[3.5rem] xl:text-6xl" />
            <SiteText blocks={blocks} blockId="home.hero.lead" locale={locale} className="mt-6 max-w-xl text-lg text-ink-700 sm:text-xl" />
            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Button href={href(locale, '/ask')} size="lg"><Icon name="hand" />{dict.home.ctaAsk}</Button>
              <Button href={href(locale, '/give')} size="lg" variant="secondary"><Icon name="heart" />{dict.home.ctaGive}</Button>
              <Button href={href(locale, '/feed')} size="lg" variant="ghost">{dict.home.ctaSee}<Icon name="arrow" className="size-4" /></Button>
            </div>
            <ul className="annot mt-10 flex flex-wrap gap-x-6 gap-y-2 text-ink-500">
              {dict.home.trust.map((item) => (
                <li key={item} className="flex items-center gap-2"><Icon name="check" className="size-3.5 text-teal-600" />{item}</li>
              ))}
            </ul>
          </div>
          {drawing ? <figure className="relative">
            <RiverDrawing labels={dict.home.drawing} />
            <figcaption className="annot mt-4 flex items-center gap-3 text-ink-500">
              <span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{dict.home.drawing.caption}
            </figcaption>
          </figure> : null}
        </div>
      </Container>
    </section>
  );
}
