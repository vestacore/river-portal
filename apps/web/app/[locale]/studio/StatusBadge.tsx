import { Badge } from '@/components/ui/Badge';

const tones: Record<string, 'river' | 'teal' | 'sunrise' | 'ink' | 'attention'> = {
  submitted: 'sunrise', acknowledged: 'sunrise', triaged: 'river', open: 'river', matched: 'teal', partially_matched: 'teal',
  in_delivery: 'teal', delivered: 'teal', confirmed: 'ink', closed: 'ink', on_hold: 'attention', withdrawn: 'ink', referred: 'ink',
};

/** A need status as a coloured badge. */
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={tones[status] ?? 'ink'}>{label}</Badge>;
}
