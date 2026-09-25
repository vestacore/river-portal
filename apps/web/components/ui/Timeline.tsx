/** Vertical steps on a hairline, with diamond nodes as in the drawing; the latest done step glows. */
export function Timeline({ steps }: { steps: Array<{ label: string; when?: string; done: boolean }> }) {
  const lastDone = steps.map((s) => s.done).lastIndexOf(true);
  return (
    <ol className="relative space-y-6 border-l border-graphite/35 pl-7">
      {steps.map((s, i) => (
        <li key={i} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[2.2rem] top-1 size-3.5 rotate-45 border ${s.done ? 'border-teal-600 bg-teal-500' : 'border-graphite/50 bg-paper'} ${i === lastDone ? 'animate-glow outline outline-4 outline-teal-500/20' : ''}`}
          />
          <p className={`font-medium ${s.done ? 'text-ink-900' : 'text-ink-500'}`}>{s.label}</p>
          {s.when ? <p className="annot mt-1 text-ink-500">{s.when}</p> : null}
        </li>
      ))}
    </ol>
  );
}
