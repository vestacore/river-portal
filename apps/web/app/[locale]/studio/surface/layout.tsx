import type { ReactNode } from 'react';
import { TabNav } from '@/components/ui/TabNav';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';

/** Surface: what the public sees — reports, the feed and every text of the site. */
export default async function SurfaceLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  await requireStage('surface', locale);
  const t = getDictionary(locale).studio;
  return (
    <>
      <TabNav label={t.stages.surface.label} items={[
        { href: href(locale, '/studio/surface'), label: t.surfaceNav.reports },
        { href: href(locale, '/studio/surface/feed'), label: t.surfaceNav.feed },
        { href: href(locale, '/studio/surface/texts'), label: t.surfaceNav.texts },
      ]} />
      {children}
    </>
  );
}
