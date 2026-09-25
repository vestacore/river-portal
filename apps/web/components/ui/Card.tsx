import type { ReactNode } from 'react';

/** A sketched frame (hairlines overshooting the corners, one bevelled corner). */
export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'article' | 'section' | 'li' }) {
  return <Tag className={`sketch bg-paper p-6 ${className}`}>{children}</Tag>;
}
