import type { Locale } from '@river/i18n';
import { lt } from '@/lib/lt';

/** Code as an integrator copies it — a request, a handler, a header — in the dark frame of the kit, with an optional caption. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <figure className="min-w-0">
      {label ? <figcaption className="annot mb-1.5 text-[0.6rem] text-ink-500">{label}</figcaption> : null}
      <pre className="overflow-x-auto bg-ink-900 p-4 font-mono text-[0.78rem] leading-relaxed text-paper">{code}</pre>
    </figure>
  );
}

/**
 * A JSON document exactly as it is sent — two spaces of indentation, keys in the order they were written.
 * With `lines`, a long one is cut there and says how many lines were left out.
 */
export function JsonBlock({ value, locale, label, lines }: { value: unknown; locale: Locale; label?: string; lines?: number }) {
  const t = lt(locale);
  const all = JSON.stringify(value, null, 2).split('\n');
  const shown = lines !== undefined && all.length > lines + 2 ? all.slice(0, lines) : all;
  const rest = all.length - shown.length;
  return <CodeBlock label={label} code={rest > 0 ? `${shown.join('\n')}\n  … ${t(`${rest} more lines`, `ще рядків: ${rest}`)}` : shown.join('\n')} />;
}
