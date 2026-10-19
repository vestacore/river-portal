'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

const styles = {
  primary: 'chamfer text-ink-900 [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]',
  secondary: 'chamfer text-paper [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]',
  outline: 'border border-graphite/40 text-ink-900 hover:border-graphite',
} as const;

/** A form's submit button that says what is happening while the action runs, and cannot be pressed twice. */
export function SubmitButton({ children, pending, variant = 'primary', size = 'md', name, value }: {
  children: ReactNode; pending?: ReactNode; variant?: keyof typeof styles; size?: 'sm' | 'md' | 'lg'; name?: string; value?: string;
}) {
  const status = useFormStatus();
  const sizes = { sm: 'px-4 py-2 text-sm [--cut:7px]', md: 'px-6 py-3 text-[0.95rem]', lg: 'px-8 py-4 text-lg [--cut:12px]' }[size];
  return (
    <button type="submit" name={name} value={value} disabled={status.pending} aria-busy={status.pending}
      className={`inline-flex items-center justify-center gap-2.5 font-semibold transition-colors duration-200 disabled:opacity-60 ${styles[variant]} ${sizes}`}>
      {status.pending && pending ? pending : children}
    </button>
  );
}
