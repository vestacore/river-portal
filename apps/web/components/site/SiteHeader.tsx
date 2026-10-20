import Link from 'next/link';
import { pickText, segmentForLocale, type Locale } from '@river/i18n';
import { roleLabels } from '@river/psp-access';
import type { Actor } from '@river/psp-runtime';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { Icon } from '../ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoMark } from './LogoMark';

/**
 * The header of the public site: the mark, the platform's six themes, pricing and developers, the
 * language, and the two ways into the demo — pay as a customer, or work in a cabinet. A signed-in demo
 * person sees who they act as.
 */
export function SiteHeader({ locale, actor, personName }: { locale: Locale; actor: Extract<Actor, { kind: 'person' }> | null; personName: string | null }) {
  const t = lt(locale);
  const link = 'whitespace-nowrap px-2 py-2 text-[0.93rem] font-medium text-ink-700 transition-colors hover:text-ink-900 hover:underline hover:decoration-sunrise-500 hover:decoration-2 hover:underline-offset-[6px]';
  const nav: Array<[string, string]> = [
    ['/platform/split', t('Split', 'Розщеплення')], ['/platform/hierarchy', t('Hierarchy', 'Ієрархія')], ['/platform/instruments', t('Instruments', 'Інструменти')],
    ['/platform/lifecycle', t('Lifecycle', 'Життєвий цикл')], ['/platform/agents', t('Agents', 'Агенти')], ['/platform/invoicing', t('Invoicing', 'Інвойсинг')],
    ['/pricing', t('Pricing', 'Тарифи')], ['/developers', t('Developers', 'Розробникам')],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-graphite/20 bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-paper focus:px-4 focus:py-2">{t('Skip to content', 'Перейти до змісту')}</a>
      {actor && personName ? (
        <div className="annot flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink-900 px-4 py-1.5 text-paper">
          <span>{t('Acting as', 'Ви дієте як')} <b className="font-medium text-sunrise-300">{personName}</b> · {pickText(roleLabels[actor.role], locale)}</span>
          <Link className="underline decoration-sunrise-500 underline-offset-4" href={href(locale, '/cabinet')}>{t('Open the cabinet', 'Відкрити кабінет')}</Link>
          <Link className="underline decoration-graphite underline-offset-4" href={href(locale, '/demo')}>{t('Switch', 'Змінити')}</Link>
        </div>
      ) : null}
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={href(locale)} className="flex min-w-0 items-center gap-3">
          <LogoMark />
          <span className="font-display text-[1.1rem] font-semibold tracking-tight text-ink-900">River Pay</span>
          <span className="annot hidden border border-graphite/30 px-1.5 py-0.5 text-ink-500 md:inline">{t('demo stand', 'демо-стенд')}</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
          <LanguageSwitcher current={segmentForLocale(locale)} label={t('Language', 'Мова')} />
          <Link href={href(locale, '/shop')} className="annot hidden border border-graphite/30 px-2.5 py-1.5 text-ink-700 hover:border-graphite sm:inline-flex">{t('Pay as a customer', 'Сплатити як клієнт')}</Link>
          <Link href={href(locale, '/demo')} className="chamfer inline-flex items-center whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-ink-900 [--cut:7px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]">
            <Icon name="layers" className="mr-1.5 size-4" />{t('Try a cabinet', 'Спробувати кабінет')}
          </Link>
        </div>
      </div>
      <nav className="border-t border-graphite/10" aria-label={t('Main', 'Головна навігація')}>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-2 sm:px-4 lg:px-6">
          {nav.map(([path, label]) => <Link key={path} className={link} href={href(locale, path)}>{label}</Link>)}
          <Link className={`${link} sm:hidden`} href={href(locale, '/shop')}>{t('Pay as a customer', 'Сплатити як клієнт')}</Link>
        </div>
      </nav>
    </header>
  );
}
