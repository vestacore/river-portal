import { cookies } from 'next/headers';

/** What a command just showed once (an API key's secret, a sandbox pay key), read from the short-lived flash cookie. */
export async function flashSecret(): Promise<{ secret?: string; payKey?: string }> {
  try { return JSON.parse((await cookies()).get('psp-flash')?.value ?? '{}') as { secret?: string; payKey?: string }; } catch { return {}; }
}
