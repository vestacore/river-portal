import type { ReactNode } from 'react';
import { Container } from '../ui/Container';

/** The head of an inner page, like the title of a drawing sheet: sheet number, title, lead. */
export function PageHead({ sheet, title, lead, children }: { sheet: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="paper-grid border-b border-graphite/15">
      <Container className="py-14 sm:py-20">
        <p className="annot mb-5 flex items-center gap-3 text-ink-500"><span className="text-sunrise-600">{sheet}</span><span className="h-px w-12 bg-graphite/40" aria-hidden="true" /></p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">{title}</h1>
        {lead ? <div className="mt-5 max-w-2xl text-lg text-ink-500">{lead}</div> : null}
        {children}
      </Container>
    </header>
  );
}
