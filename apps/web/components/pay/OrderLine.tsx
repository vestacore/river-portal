import type { OrderStatus } from '@river/pay-views';
import type { Dictionary } from '@/lib/dictionary/types';

const stages = ['order', 'invoice', 'gate', 'bank', 'mouth'] as const;

// Where each status stands on the line, and how: moving on, arrived, held up, or ended early.
const standing: Record<OrderStatus, { at: number; how: 'moving' | 'arrived' | 'held' | 'ended' }> = {
  placed: { at: 0, how: 'moving' }, invoiced: { at: 1, how: 'moving' }, routing: { at: 2, how: 'moving' }, open: { at: 3, how: 'moving' }, approved: { at: 3, how: 'moving' },
  paid: { at: 4, how: 'arrived' }, retry: { at: 2, how: 'held' }, refused: { at: 2, how: 'held' }, flagged: { at: 4, how: 'held' }, cancelled: { at: 1, how: 'ended' },
};

/**
 * One order's place on the river, the same five stages for every role: order (the source), invoice
 * (the key), gate, provider (the crossing), paid (the mouth). `full` names every stage where there is
 * room and only the present one on a narrow screen; `brief` names the present one; `compact` draws
 * the line alone, for tables.
 */
export function OrderLine({ status, t, mode = 'full' }: { status: OrderStatus; t: Dictionary['pay']; mode?: 'full' | 'brief' | 'compact' }) {
  const { at, how } = standing[status];
  const here = stages[at] ?? 'order';
  const captionTone = how === 'held' ? 'text-attention-500' : how === 'ended' ? 'text-ink-500' : 'text-ink-900';
  return (
    <div className={mode === 'compact' ? 'w-28' : undefined}>
      <ol className={`grid grid-cols-5 ${mode === 'compact' ? 'gap-0.5' : 'gap-1'}`} aria-label={`${t.status[status]}: ${t.stages[here]}`}>
        {stages.map((stage, i) => {
          const present = i === at;
          const tone = how === 'ended' ? (i <= at ? 'border-graphite/50 text-ink-500' : 'border-graphite/15 text-ink-300')
            : i < at || (present && how === 'arrived') ? 'border-teal-500 text-ink-900'
            : present && how === 'held' ? 'border-attention-500 text-attention-500'
            : present ? 'border-sunrise-500 text-ink-900'
            : 'border-graphite/20 text-ink-300';
          return (
            <li key={stage} title={mode === 'full' ? undefined : t.stages[stage]} className={`${mode === 'full' ? 'border-t-2' : 'border-t-[3px]'} ${tone}`}>
              {mode === 'full' ? (
                <span className="hidden pt-2 sm:block">
                  <span className={`block text-sm ${present ? 'font-semibold' : ''}`}>{t.stages[stage]}</span>
                  <span className="annot block text-[0.58rem] opacity-70">{t.stagesRiver[stage]}</span>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {mode === 'compact' ? null : (
        <p className={`mt-2 text-sm ${mode === 'full' ? 'sm:hidden' : ''} ${captionTone}`}>
          <span className="font-semibold">{t.stages[here]}</span> <span className="annot text-[0.6rem] opacity-70">{t.stagesRiver[here]}</span>
        </p>
      )}
    </div>
  );
}
