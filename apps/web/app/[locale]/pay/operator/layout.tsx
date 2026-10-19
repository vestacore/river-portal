import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { TabNav } from '@/components/ui/TabNav';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { requireOperator } from '@/lib/pay/requireOperator';
import { resolveLocale } from '@/lib/resolveLocale';

/**
 * The operator's cabinet: stewards only — a Finance Steward or an Administrator acts, an Auditor
 * reads. Four readings of the same river: the orders, the ledger, the routes, the outbox. The frame
 * is drawn here; each page beneath checks the steward again before it reads (`requireOperator`).
 */
export default async function OperatorLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const operator = await requireOperator(locale);
  const t = getDictionary(locale).pay.operator;
  const tabs = [['', t.tabs.orders], ['/ledger', t.tabs.ledger], ['/routes', t.tabs.routes], ['/outbox', t.tabs.outbox]] as const;
  return (
    <div className="min-h-[70vh]">
      <Container className="py-8">
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <span className="annot inline-flex items-center gap-1.5 text-ink-500"><Icon name="shield" className="size-3.5 text-teal-600" />{t.role} <b className="text-ink-900">{operator.name}</b></span>
          {operator.canAct ? null : <Badge tone="attention">{t.readOnly}</Badge>}
        </div>
        <TabNav label={t.title} items={tabs.map(([path, label]) => ({ href: href(locale, `/pay/operator${path}`), label }))} />
        {children}
      </Container>
    </div>
  );
}
