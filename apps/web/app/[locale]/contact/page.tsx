import type { Metadata } from 'next';
import Link from 'next/link';
import { pickText } from '@river/i18n';
import { settingEntries, settingLocalised, settingText, type ChannelEntry } from '@river/settings';
import { FactTable } from '@/components/site/FactTable';
import { PageHead } from '@/components/site/PageHead';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { resolveLocale } from '@/lib/resolveLocale';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).contactPage.title };
}

/** Contact: every way to reach the organisation, all from settings; asking for help comes first. */
export default async function ContactPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const t = dict.contactPage;
  const settings = await loadSettings();
  const email = settingText(settings, 'contact.email');
  const phone = settingText(settings, 'contact.phone');
  const press = settingText(settings, 'contact.pressEmail');
  const channels = settingEntries<ChannelEntry>(settings, 'help.channels');
  const a = 'underline decoration-graphite/40 underline-offset-4 hover:decoration-sunrise-500';
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 04`} title={t.title} />
      <Container className="grid gap-16 py-16 lg:grid-cols-[1.2fr_1fr]">
        <FactTable rows={[
          [t.email, email ? <a key="e" className={a} href={`mailto:${email}`}>{email}</a> : ''],
          [t.phone, phone ? <a key="p" className={a} href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a> : ''],
          [t.address, pickText(settingLocalised(settings, 'contact.address'), locale)],
          [t.hours, pickText(settingLocalised(settings, 'contact.hours'), locale)],
          [t.press, press ? <a key="m" className={a} href={`mailto:${press}`}>{press}</a> : ''],
          ...channels.map((c): [string, string] => [pickText(c.label, locale), c.value]),
        ]} />
        <aside className="chamfer self-start p-7 [--cut:24px] [--fill:var(--color-sunrise-100)]">
          <Icon name="hand" className="size-8 text-ink-900" />
          <p className="mt-4 text-lg text-ink-900">{t.askNote}</p>
          <div className="mt-6"><Button href={href(locale, '/ask')}>{dict.nav.ask}<Icon name="arrow" className="size-4" /></Button></div>
          <p className="mt-6 text-sm"><Link className={a} href={href(locale, '/policies/complaints')}>{dict.policies.complaints}</Link></p>
        </aside>
      </Container>
    </>
  );
}
