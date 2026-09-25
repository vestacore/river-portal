import type { BlockMap } from '@river/content';
import type { Locale } from '@river/i18n';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';
import { SectionHeading } from '../ui/SectionHeading';
import { SiteText } from './SiteText';

/** "Who we are" on the home page, linking to the full About page. */
export function AboutTeaser({ blocks, locale, dict, index }: { blocks: BlockMap; locale: Locale; dict: Dictionary; index: string }) {
  return (
    <section className="border-t border-graphite/15 py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="self-start"><SectionHeading index={index} title={dict.aboutTeaser.title} /></div>
          <div>
            <SiteText blocks={blocks} blockId="home.about.teaser" locale={locale} className="text-lg" />
            <div className="mt-8"><Button href={href(locale, '/about')} variant="ghost">{dict.aboutTeaser.more}<Icon name="arrow" className="size-4" /></Button></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
