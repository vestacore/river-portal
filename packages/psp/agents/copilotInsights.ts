import { endpointHealth } from '@river/psp-integration';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';
import { counted } from './counted.ts';

function diagnose(status: number | null, error: string | null): { 'en-GB': string; uk: string } {
  if (status === 401 || status === 403) return { 'en-GB': 'The endpoint refuses the signature: the webhook secret on the server is probably old.', uk: 'Кінцева точка відхиляє підпис: імовірно, на сервері старий секрет вебхука.' };
  if (status === 404) return { 'en-GB': 'The path does not exist: the URL was probably changed in a release.', uk: 'Шляху не існує: імовірно, URL змінили під час релізу.' };
  if (status !== null && status >= 500) return { 'en-GB': 'The integrator’s server fails while handling the event; their logs will say why.', uk: 'Сервер інтегратора падає під час обробки події; причину покажуть його журнали.' };
  if (error?.includes('timeout')) return { 'en-GB': 'The endpoint answers too slowly: reply 200 at once, then process in the background.', uk: 'Кінцева точка відповідає надто повільно: відповідайте 200 одразу, обробляйте у фоні.' };
  return { 'en-GB': 'Deliveries fail without a clear cause.', uk: 'Доставки не вдаються без явної причини.' };
}

/** The Integration copilot: endpoints that keep failing, with a diagnosis and the deliveries to retry. */
export function copilotInsights(input: SwarmInput): InsightDraft[] {
  const out: InsightDraft[] = [];
  for (const endpoint of input.endpoints) {
    const deliveries = input.deliveries.filter((d) => d.endpointId === endpoint.id);
    const health = endpointHealth(deliveries);
    if (health.failingStreak < 3) continue;
    const failed = deliveries.filter((d) => d.status === 'failed');
    const last = failed.at(-1) ?? null;
    out.push({
      agent: 'copilot', unitId: endpoint.unitId, subject: { kind: 'endpoint', id: endpoint.id },
      title: { 'en-GB': `${endpoint.url}: ${counted(health.failingStreak, ['failure', 'failures'], ['збій', 'збої', 'збоїв'])['en-GB']} in a row`, uk: `${endpoint.url}: ${counted(health.failingStreak, ['failure', 'failures'], ['збій', 'збої', 'збоїв']).uk} поспіль` },
      finding: diagnose(last?.httpStatus ?? null, last?.error ?? null),
      evidence: failed.slice(-4).map((d) => ({ kind: 'fact' as const, id: d.eventId, note: { 'en-GB': `${d.type} → ${d.httpStatus ?? d.error}`, uk: `${d.type} → ${d.httpStatus ?? d.error}` } })),
      confidence: 0.86,
      proposal: { kind: 'retry_deliveries', risk: 'low', params: { endpointId: endpoint.id, deliveries: failed.map((d) => d.id) },
        effect: { 'en-GB': `Retry ${counted(failed.length, ['failed delivery', 'failed deliveries'], ['невдалу доставку', 'невдалі доставки', 'невдалих доставок'])['en-GB']} once the endpoint is fixed.`, uk: `Повторити ${counted(failed.length, ['failed delivery', 'failed deliveries'], ['невдалу доставку', 'невдалі доставки', 'невдалих доставок']).uk}, щойно кінцеву точку виправлять.` } },
      consulted: [],
    });
  }
  return out;
}
