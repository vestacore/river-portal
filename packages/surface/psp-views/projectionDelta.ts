import type { Projection } from '@river/psp-facts';
import type { ProjectionDelta } from './types/Views.ts';

const quiet = new Set(['updatedAt', 'timeline', 'bridges', 'last']);

function shown(value: unknown): unknown {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return value;
}

/**
 * What a fact changed in a view: the top-level fields whose value moved (lists and records by their
 * size), leaving out the bookkeeping fields. A created view lists what it was born with.
 */
export function projectionDelta(projection: Projection, key: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null): ProjectionDelta | null {
  if (!after) return null;
  const changes: ProjectionDelta['changes'] = [];
  for (const [field, value] of Object.entries(after)) {
    if (quiet.has(field)) continue;
    const from = before ? shown(before[field]) : null;
    const to = shown(value);
    if (JSON.stringify(from) !== JSON.stringify(to)) changes.push({ field, from, to });
  }
  if (changes.length === 0) return null;
  return { projection, key, created: before === null, changes: before === null ? changes.filter((c) => c.to !== null && c.to !== 0 && c.to !== false && c.to !== '') : changes };
}
