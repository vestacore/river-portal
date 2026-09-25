import Link from 'next/link';
import type { ReactNode } from 'react';

// Solid variants are flat fills with bevelled corners (.chamfer); the fill colour is the --fill variable.
const styles = {
  primary: 'chamfer text-ink-900 [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]',
  secondary: 'chamfer text-paper [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]',
  ghost: 'text-ink-900 underline decoration-ink-300 decoration-1 underline-offset-[6px] hover:decoration-sunrise-500 hover:decoration-2',
  quiet: 'text-river-700 hover:text-ink-900',
  danger: 'text-attention-500 underline decoration-attention-500/40 underline-offset-4 hover:decoration-attention-500',
} as const;

type Props = { children: ReactNode; variant?: keyof typeof styles; size?: 'sm' | 'md' | 'lg'; className?: string } & (
  | { href: string; type?: never; name?: never; value?: string; disabled?: never }
  | { href?: undefined; type?: 'button' | 'submit'; name?: string; value?: string; disabled?: boolean }
);

/** Buttons and button-styled links: flat, bevelled, no shadows. */
export function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }: Props) {
  const solid = variant === 'primary' || variant === 'secondary';
  const sizes = solid
    ? { sm: 'px-4 py-2 text-sm [--cut:7px]', md: 'px-6 py-3 text-[0.95rem]', lg: 'px-7 py-4 text-base [--cut:12px]' }[size]
    : { sm: 'py-1 text-sm', md: 'py-2 text-[0.95rem]', lg: 'py-3 text-base' }[size];
  const cls = `inline-flex items-center justify-center gap-2.5 font-semibold transition-colors duration-200 disabled:opacity-50 ${styles[variant]} ${sizes} ${className}`;
  if (rest.href !== undefined) return <Link href={rest.href} className={cls}>{children}</Link>;
  return <button type={rest.type ?? 'button'} name={rest.name} value={rest.value} disabled={rest.disabled} className={cls}>{children}</button>;
}
