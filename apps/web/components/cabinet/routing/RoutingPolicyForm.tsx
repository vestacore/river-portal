import type { ReactNode } from 'react';
import { setPolicyAction } from '@/lib/actions/cabinet';

/**
 * A small form that sets one routing policy on one unit through the cabinets' own policy action — the
 * runtime checks the right to change routing and refuses a setting that would not take effect. The
 * control (named `value`) and any note come as children.
 */
export function RoutingPolicyForm({ unitId, policyKey, kind, back, mode = 'default', submit, children, className = '' }: { unitId: string; policyKey: string; kind: string; back: string; mode?: 'default' | 'enforced'; submit: string; children: ReactNode; className?: string }) {
  return (
    <form action={setPolicyAction} className={className}>
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="key" value={policyKey} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="back" value={back} />
      {children}
      <button type="submit" className="annot shrink-0 border border-ink-900 px-2.5 py-1.5 text-[0.6rem] text-ink-900 hover:bg-ink-900 hover:text-paper">{submit}</button>
    </form>
  );
}
