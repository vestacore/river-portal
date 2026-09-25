import type { ReactNode } from 'react';

/** Page-width wrapper with side gutters. */
export function Container({ children, className = '', narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={`mx-auto w-full ${narrow ? 'max-w-3xl' : 'max-w-6xl'} px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
