import type { Locale } from '@river/i18n';
import type { cabinet } from '@/lib/cabinet';
import type { Query } from '@/lib/table';
import { AccessOverview } from './overview/AccessOverview';
import { CheckoutOverview } from './overview/CheckoutOverview';
import { ComplianceOverview } from './overview/ComplianceOverview';
import { FinanceOverview } from './overview/FinanceOverview';
import { IntegratorOverview } from './overview/IntegratorOverview';
import { PaymentsManagerOverview } from './overview/PaymentsManagerOverview';

/** The overview of the cabinets whose work is not the flows themselves: routing and costs, reconciliation, compliance, access, the pay page, integration. */
export function RoleOverview({ c, locale, query }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; query: Query }) {
  switch (c.actor.role) {
    case 'payments_manager': return <PaymentsManagerOverview c={c} locale={locale} query={query} />;
    case 'finance_controller': return <FinanceOverview c={c} locale={locale} query={query} />;
    case 'compliance_officer': return <ComplianceOverview c={c} locale={locale} query={query} />;
    case 'access_manager': return <AccessOverview c={c} locale={locale} query={query} />;
    case 'checkout_designer': return <CheckoutOverview c={c} locale={locale} query={query} />;
    default: return <IntegratorOverview c={c} locale={locale} query={query} />;
  }
}
