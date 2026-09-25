/** Reads a dotted field path (`aggregate.id`) from a plain object. */
export function readField(data: Record<string, unknown>, field: string): unknown {
  let current: unknown = data;
  for (const key of field.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
