import type { OrderStatus } from '@river/pay-views';
import type { Dictionary } from '@/lib/dictionary/types';
import { Badge } from '../ui/Badge';

const tones: Record<OrderStatus, 'river' | 'teal' | 'sunrise' | 'ink' | 'attention'> = {
  placed: 'ink', invoiced: 'sunrise', routing: 'river', open: 'river', approved: 'teal', paid: 'teal', retry: 'attention', refused: 'attention', flagged: 'attention', cancelled: 'ink',
};

/** An order's status as a badge. */
export function PayStatus({ status, t }: { status: OrderStatus; t: Dictionary['pay'] }) {
  return <Badge tone={tones[status]}>{t.status[status]}</Badge>;
}
