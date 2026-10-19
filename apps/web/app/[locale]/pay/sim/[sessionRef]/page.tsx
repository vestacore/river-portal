import { notFound } from 'next/navigation';
import { segmentForLocale } from '@river/i18n';
import { providerLabels } from '@river/pay-facts';
import { findMerchant, getPayRuntime } from '@river/pay-runtime';
import { SubmitButton } from '@/components/pay/SubmitButton';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { simulateAction } from '@/lib/pay/actions';
import { ownStandIn } from '@/lib/pay/ownStandIn';
import { resolveLocale } from '@/lib/resolveLocale';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * The stand-in provider's page: the other bank, drawn dark so that nobody mistakes it for the river.
 * It exists only while a provider is mounted as a stand-in; it moves no money and says so. It opens
 * only for the payer whose session it is — a session reference alone shows nothing.
 */
export default async function StandInPage({ params }: { params: Promise<{ locale: string; sessionRef: string }> }) {
  const { locale: segment, sessionRef } = await params;
  const locale = resolveLocale(segment);
  const dict = getDictionary(locale);
  const t = dict.pay.sim;
  const runtime = await getPayRuntime();
  if (runtime.config.stripe.mode !== 'simulated' && runtime.config.paypal.mode !== 'simulated') notFound();
  // Only the payer whose session this is sees it; to anyone else — and for a session already answered — it is closed.
  const view = (await ownStandIn(decodeURIComponent(sessionRef)))?.view;
  const session = view?.session;
  if (!view || !session || view.status !== 'open') {
    return (
      <Container narrow className="py-24">
        <h1 className="text-3xl font-semibold">{t.closedTitle}</h1>
        <p className="mt-3 text-lg text-ink-500">{t.closedText}</p>
        <p className="mt-8"><a className="font-semibold underline decoration-sunrise-500 decoration-2 underline-offset-4" href={view ? `/pay/return/${view.orderId}` : href(locale, '/pay')}>{t.back}</a></p>
      </Container>
    );
  }
  const provider = providerLabels[session.provider];
  const amount = payMoney(view.amountMinor, view.currency, locale);
  return (
    <div className="bg-ink-900 py-16 text-paper sm:py-24">
      <Container narrow>
        <p className="annot flex items-center gap-3 text-sunrise-300"><Icon name="shield" className="size-4" />{dict.pay.standIn}</p>
        <h1 className="mt-4 text-4xl font-semibold text-paper sm:text-5xl">{t.title.replace('{provider}', provider)}</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-300">{t.lead}</p>
        <div className="mt-10 border-y border-paper/25 py-8">
          <p className="text-ink-300">{t.asks.replace('{merchant}', findMerchant(runtime.config, view.merchantId)?.name ?? view.merchantId)}</p>
          <p className="mt-1 font-display text-6xl font-semibold tabular-nums text-paper">{amount}</p>
          <p className="mt-3 text-lg text-paper">{view.title}</p>
          <p className="annot mt-4 break-all text-ink-300">{session.sessionRef}</p>
        </div>
        <form action={simulateAction} className="mt-10 flex flex-wrap items-center gap-5">
          <input type="hidden" name="sessionRef" value={session.sessionRef} />
          <input type="hidden" name="localeSegment" value={segmentForLocale(locale)} />
          <SubmitButton size="lg" name="outcome" value="paid">{t.pay.replace('{amount}', amount)}</SubmitButton>
          <button type="submit" name="outcome" value="declined" className="px-2 py-3 font-semibold text-paper underline decoration-paper/40 underline-offset-[6px] hover:decoration-sunrise-500">{t.decline}</button>
        </form>
      </Container>
    </div>
  );
}
