import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { hasRole, isStaff } from '@river/identity';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { getIdentity } from '@/lib/getIdentity';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';
import { studioStages } from '@/lib/studioStages';
import { StageNav } from './StageNav';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).studio.title, robots: { index: false, follow: false } };
}

/**
 * Studio shell: staff only (IAP in the cloud, a demo persona locally). Stages of the river the
 * person may see; an auditor sees everything, read-only.
 */
export default async function StudioLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const identity = await getIdentity(locale);
  if (!identity || !isStaff(identity)) notFound();
  const dict = getDictionary(locale);
  const t = dict.studio;
  const items = studioStages.filter((s) => hasRole(identity, ...s.see)).map((s) => ({ path: s.path, href: href(locale, s.path), label: t.stages[s.key].label, river: t.stages[s.key].river }));
  const readOnly = !studioStages.some((s) => hasRole(identity, ...s.act));
  return (
    <div className="min-h-[70vh]">
      <Container className="py-8">
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <span className="annot inline-flex items-center gap-1.5 text-ink-500">
            <Icon name="shield" className="size-3.5 text-teal-600" />
            {identity.via === 'iap' ? t.surfaceNote : dict.nav.demo} <b className="text-ink-900">{identity.name}</b> · {identity.roles.map((r) => dict.roles[r]).join(', ')}
          </span>
          {readOnly ? <Badge tone="attention">{t.readOnly}</Badge> : null}
        </div>
        <StageNav items={items} label={t.title} />
        {children}
      </Container>
    </div>
  );
}
