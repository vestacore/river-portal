import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Radio buttons presented as large tappable cards (good for low-literacy and touch users). */
export function ChoiceCards({ name, options, defaultValue, columns = 2, invalid }: {
  name: string;
  options: Array<{ value: string; label: ReactNode; icon?: string }>;
  defaultValue?: string;
  columns?: 2 | 3 | 4;
  invalid?: boolean;
}) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];
  return (
    <div className={`grid grid-cols-1 gap-2.5 ${grid}`} role="radiogroup" aria-invalid={invalid || undefined}>
      {options.map((o) => (
        <label key={o.value} className="group relative flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-line transition hover:ring-teal-500 has-[:checked]:bg-teal-100/60 has-[:checked]:ring-2 has-[:checked]:ring-teal-500">
          <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="peer sr-only" />
          {o.icon ? <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-river-700 group-has-[:checked]:bg-white"><Icon name={o.icon} /></span> : null}
          <span className="font-medium text-ink-900">{o.label}</span>
          <Icon name="check" className="ml-auto size-5 text-teal-600 opacity-0 transition peer-checked:opacity-100" />
        </label>
      ))}
    </div>
  );
}
