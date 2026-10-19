import { redirect } from 'next/navigation';
import { getPayRuntime, isOrderId } from '@river/pay-runtime';
import { readOrder } from '@river/pay-views';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { getPayActor } from '@/lib/pay/getPayActor';
import { resolveLocale } from '@/lib/resolveLocale';

/**
 * Where a provider sends the payer back when this browser no longer holds their pay key. A
 * signed-in payer is taken to their own invoice; anyone else is told to open their link again —
 * nothing about the order is shown to someone who only knows its number.
 */
export default async function ReturnedPage({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
  const { locale: segment, orderId } = await params;
  const locale = resolveLocale(segment);
  const actor = await getPayActor(locale);
  if (actor?.role === 'payer' && isOrderId(orderId)) {
    const runtime = await getPayRuntime();
    const view = await readOrder(runtime.store, runtime.root, orderId);
    if (view?.payerRef === actor.ref) redirect(href(locale, `/pay/payer/orders/${view.orderId}`));
  }
  const t = getDictionary(locale).pay.returned;
  return (
    <Container narrow className="py-24">
      <Icon name="route" className="size-10 text-teal-600" />
      <h1 className="mt-4 text-3xl font-semibold">{t.title}</h1>
      <p className="mt-3 text-lg text-ink-500">{t.text}</p>
    </Container>
  );
}
