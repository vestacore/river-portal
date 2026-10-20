import Link from 'next/link';
import type { Locale } from '@river/i18n';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { Container } from '../ui/Container';
import { LogoMark } from './LogoMark';

/** The footer, drawn as the title block of a sheet: what this stand is, where everything is, and its honest limits. */
export function SiteFooter({ locale }: { locale: Locale }) {
  const t = lt(locale);
  const columns: Array<[string, Array<[string, string]>]> = [
    [t('Platform', 'Платформа'), [['/platform/split', t('Split payments', 'Розщеплення платежів')], ['/platform/hierarchy', t('Hierarchy of units', 'Ієрархія одиниць')], ['/platform/instruments', t('Payment instruments', 'Платіжні інструменти')], ['/platform/lifecycle', t('Lifecycle and projections', 'Життєвий цикл і проєкції')], ['/platform/agents', t('Agent swarm', 'Рій агентів')], ['/platform/invoicing', t('Invoices and orders', 'Інвойси та замовлення')]]],
    [t('For business', 'Для бізнесу'), [['/pricing', t('Pricing', 'Тарифи')], ['/shop', t('Pay a demo invoice', 'Сплатити демо-інвойс')], ['/demo', t('Six cabinets', 'Шість кабінетів')]]],
    [t('Developers', 'Розробникам'), [['/developers', t('Four entities and their API', 'Чотири сутності та їх API')], ['/developers#events', t('Event catalogue', 'Каталог подій')], ['/cabinet/sandbox', t('Sandbox', 'Пісочниця')]]],
  ];
  return (
    <footer className="mt-24 border-t-2 border-ink-900 bg-paper-deep">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3"><LogoMark /><span className="text-lg font-semibold text-ink-900">River Pay</span></div>
            <p className="mt-4 max-w-sm text-[0.95rem] text-ink-700">{t('A payment platform drawn as a river: one attempt to pay is one river from unpaid to paid.', 'Платіжна платформа, накреслена як ріка: одна спроба оплати — одна ріка від несплаченого до сплаченого.')}</p>
            <p className="annot mt-6 max-w-sm text-ink-500">{t('Demo stand · invented organisations and people · stand-in banks · no money moves', 'Демо-стенд · вигадані організації та люди · банки-імітатори · гроші не рухаються')}</p>
          </div>
          {columns.map(([title, links]) => (
            <div key={title}>
              <p className="annot mb-4 text-ink-500">{title}</p>
              <ul className="space-y-2.5">{links.map(([path, label]) => <li key={path}><Link href={href(locale, path)} className="text-[0.95rem] text-ink-900 hover:underline hover:decoration-sunrise-500 hover:underline-offset-4">{label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="annot mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-graphite/30 pt-5 text-ink-500">
          <span>{t('Sheet', 'Аркуш')} RP-00 · {t('Code Apache 2.0 · documents CC BY-NC 4.0', 'Код Apache 2.0 · документи CC BY-NC 4.0')}</span>
          <span>{t('Built with an AI partner; people decide', 'Створено з ШІ-партнером; вирішують люди')}</span>
        </div>
      </Container>
    </footer>
  );
}
