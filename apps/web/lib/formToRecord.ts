/** Form fields as a plain record of strings (files are ignored). */
export function formToRecord(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === 'string') out[key] = value;
  return out;
}
