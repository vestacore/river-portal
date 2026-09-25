import type { FieldError, Result } from '@river/kernel';
import { commit, type CommandEnv } from '@river/log';
import { findSettingDefinition, validateSettingValue, type SettingValue } from '@river/settings';

// Key order does not make two values different.
const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const sorted = (v: unknown): unknown => (Array.isArray(v) ? v.map(sorted) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([x], [y]) => x.localeCompare(y)).map(([k, x]) => [k, sorted(x)])) : v);

/**
 * Changes one or more settings after validating each against the registry (types, ranges, floors,
 * contrast). All values are applied together or none is. A value equal to the one in force is not
 * recorded, so it keeps its source (default or profile). Returns the validation errors, if any.
 */
export async function changeSettings(env: CommandEnv, input: { values: Record<string, unknown> }): Promise<Result<void>> {
  const errors: FieldError[] = [];
  const values: Record<string, SettingValue> = {};
  for (const [key, raw] of Object.entries(input.values)) {
    const definition = findSettingDefinition(key);
    if (!definition) { errors.push({ field: key, code: 'unknown' }); continue; }
    const result = validateSettingValue(definition, raw);
    if (!result.ok) errors.push(...result.errors);
    else if (!sameValue(result.value, env.settings.values[key])) values[key] = result.value;
  }
  if (errors.length > 0) return { ok: false, errors };
  if (Object.keys(values).length > 0) {
    await commit(env, [{ type: 'settings.ValuesChanged', aggregate: { kind: 'settings', id: env.ctx.orgId }, visibility: 'team', payload: { values } }]);
  }
  return { ok: true, value: undefined };
}
