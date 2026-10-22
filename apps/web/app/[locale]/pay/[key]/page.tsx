import type { Metadata } from 'next';
import { invoiceByPayKey } from '@river/psp-runtime';
import { Checkout } from '@/components/checkout/Checkout';
import { payStatus } from '@/lib/actions/pay';
import { checkoutProps } from '@/lib/checkoutProps';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { worldOfPayKey } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Pay', 'Оплата'), robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

/**
 * The hosted pay page of one invoice. The key in the link is the payer's only authority; the page shows
 * the merchant's own colours, instruments and texts as its unit's policies make them.
 */
export default async function PayPage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale: segment, key } = await params;
  const locale = resolveLocale(segment);
  const t = lt(locale);
  const w = worldOfPayKey(key);
  const invoice = invoiceByPayKey(w, key);
  if (!invoice) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f1f4f8] p-6">
        <div className="max-w-md border border-[#e6e9ef] bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold">{t('Invoice not found', 'Рахунок не знайдено')}</h1>
          <p className="mt-2 text-ink-700">{t('Check the link you were given.', 'Перевірте отримане посилання.')}</p>
        </div>
      </main>
    );
  }
  const status = await payStatus(key);
  const closed = invoice.voided !== null && status.state === 'choose';
  return <Checkout {...checkoutProps(w, invoice, key, locale, closed ? { ...status, state: 'failed', failure: 'not_payable' } : status)} />;
}
