import type { ReactNode } from 'react';

const tones = {
  river: 'text-river-700',
  teal: 'text-teal-600',
  sunrise: 'text-sunrise-600',
  ink: 'text-ink-500',
  attention: 'text-attention-500',
} as const;

/** A technical label: mono capitals after a small square swatch in the tone's colour. */
export function Badge({ children, tone = 'river', className = '' }: { children: ReactNode; tone?: keyof typeof tones; className?: string }) {
  return (
    <span className={`annot inline-flex items-center gap-1.5 whitespace-nowrap ${tones[tone]} ${className}`}>
      <span className="size-1.5 shrink-0 bg-current" aria-hidden="true" />
      <span className="text-ink-700">{children}</span>
    </span>
  );
}
