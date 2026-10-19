import { findMerchant, getPayRuntime } from '@river/pay-runtime';
import { readOrderByPayKey } from '@river/pay-views';
import { InvoiceSheet } from '@/components/pay/InvoiceSheet';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { resolveLocale } from '@/lib/resolveLocale';

/**
 * An invoice opened by its pay key — the payer's door, which needs no account. The key is the
 * authority: whoever holds the link may pay this one invoice, and keeps the receipt at the same link.
 */
export default async function InvoiceByKey({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale: segment, key } = await params;
  const locale = resolveLocale(segment);
  const dict = getDictionary(locale);
  const runtime = await getPayRuntime();
  const view = await readOrderByPayKey(runtime.store, runtime.root, key);
  if (!view) {
    return (
      <Container narrow className="py-24">
        <Icon name="lock" className="size-10 text-ink-300" />
        <h1 className="mt-4 text-3xl font-semibold">{dict.pay.invoice.notFoundTitle}</h1>
        <p className="mt-3 text-lg text-ink-500">{dict.pay.invoice.notFoundText}</p>
      </Container>
    );
  }
  return (
    <Container narrow className="py-12 sm:py-16">
      <InvoiceSheet view={view} merchantName={findMerchant(runtime.config, view.merchantId)?.name ?? view.merchantId} access={{ key }} locale={locale} dict={dict} now={new Date().toISOString()} />
    </Container>
  );
}
