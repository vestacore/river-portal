import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { findMerchant, getPayRuntime, isOrderId } from '@river/pay-runtime';
import { readOrder } from '@river/pay-views';
import { InvoiceSheet } from '@/components/pay/InvoiceSheet';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { getPayActor } from '@/lib/pay/getPayActor';
import { resolveLocale } from '@/lib/resolveLocale';

/** One invoice for the signed-in payer it is addressed to. */
export default async function PayerOrder({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
  const { locale: segment, orderId } = await params;
  const locale = resolveLocale(segment);
  const actor = await getPayActor(locale);
  if (!actor || actor.role !== 'payer') redirect(href(locale, '/pay'));
  const runtime = await getPayRuntime();
  const view = isOrderId(orderId) ? await readOrder(runtime.store, runtime.root, orderId) : null;
  if (!view || view.payerRef !== actor.ref) notFound();
  const dict = getDictionary(locale);
  return (
    <Container narrow className="py-12 sm:py-16">
      <p className="mb-8"><Link className="annot inline-flex items-center gap-2 text-ink-700 underline decoration-graphite/40 underline-offset-4 hover:text-ink-900" href={href(locale, '/pay/payer')}>← {dict.pay.payer.back}</Link></p>
      <InvoiceSheet view={view} merchantName={findMerchant(runtime.config, view.merchantId)?.name ?? view.merchantId} access={{ orderId: view.orderId }} locale={locale} dict={dict} now={new Date().toISOString()} />
    </Container>
  );
}
