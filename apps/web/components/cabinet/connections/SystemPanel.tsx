import Link from 'next/link';
import type { ReactNode } from 'react';
import { pickText, type Locale } from '@river/i18n';
import type { World } from '@river/psp-runtime';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Panel } from '@/components/panels/Panel';
import { Status, Value } from '@/components/panels/Value';
import { Icon } from '@/components/ui/Icon';
import { count } from '@/lib/format';
import { lt } from '@/lib/lt';
import { eventTags } from '../integration/columns';
import { stateCell } from './stateCell';
import { systemName } from './systemName';
import type { ConnectedSystem } from './systemsOf';

const day = 86_400_000;

/**
 * One connected system, read in full: what it is, what goes to the platform and what comes back, how it
 * did in the last day, and the keys and endpoints it uses — each a link to its own page for a profile
 * that may open it. `children` add what only this system has (the bonus system's points and batches).
 */
export function SystemPanel({ system, w, locale, now, link, unitName, can, children }: {
  system: ConnectedSystem; w: World; locale: Locale; now: string; link: (path: string) => string; unitName: (id: string) => string;
  can: { keys: boolean; webhooks: boolean; logs: boolean }; children?: ReactNode;
}) {
  const t = lt(locale);
  const d = system.definition;
  const h = system.health;
  const state = stateCell(h.state, locale);
  const ctx = { locale, now, unitName, link };
  const since = new Date(Date.parse(now) - day).toISOString();
  const role = d ? pickText(d.role, locale)
    : system.unitId ? t('The systems of this unit that call the platform and hear its events.', 'Системи цієї одиниці, що викликають платформу й отримують її події.')
    : t('Added in the cabinet and not assigned to one of the group’s systems.', 'Додані в кабінеті й не віднесені до жодної із систем групи.');
  const toPlatform = d ? d.toPlatform.map((x) => pickText(x, locale)) : [t('Orders, and requests to capture or refund, signed by its keys (API).', 'Замовлення та запити на списання чи повернення, підписані її ключами (API).')];
  const fromPlatform = d ? d.fromPlatform.map((x) => pickText(x, locale)) : [t('The events its endpoints hear (webhook).', 'Події, які отримують її кінцеві точки (вебхук).')];
  const callsOf = (keyId: string) => w.apiLog.filter((e) => e.keyId === keyId && e.at >= since).length;
  const deliveriesOf = (endpointId: string) => w.deliveries.filter((x) => x.endpointId === endpointId && x.at >= since);
  const linkClass = 'text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700';
  const direction = (label: string, items: string[], empty: string) => (
    <div className="min-w-0">
      <p className="annot text-[0.6rem] text-ink-500">{label}</p>
      {items.length === 0 ? <p className="mt-1 text-[0.85rem] text-ink-500">{empty}</p> : (
        <ul className="mt-1 space-y-1 text-[0.85rem] text-ink-700">
          {items.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true" className="text-ink-300">→</span><span className="min-w-0">{x}</span></li>)}
        </ul>
      )}
    </div>
  );
  return (
    <Panel id={system.id} className="scroll-mt-6"
      title={<span className="flex items-center gap-2"><Icon name={d?.icon ?? 'plug'} className="size-4 shrink-0 text-sunrise-600" />{systemName(system, locale, unitName)}</span>}
      note={role} actions={<Status label={state.label} tone={state.tone} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        {direction(t('To the platform', 'До платформи'), toPlatform, t('Nothing: it only listens.', 'Нічого: вона лише отримує.'))}
        {direction(t('From the platform', 'Від платформи'), fromPlatform, t('Nothing.', 'Нічого.'))}
      </div>
      {h.state === 'unseen' ? (
        <p className="mt-4 border-t border-graphite/15 pt-3 text-[0.85rem] text-ink-500">{t('Its keys and endpoints sit at units outside your reach.', 'Її ключі й кінцеві точки належать одиницям поза вашими межами.')}</p>
      ) : (
        <>
          <div className="mt-4">
            <FieldGrid locale={locale} columns={4} fields={[
              { label: t('Calls, 24 h', 'Виклики, 24 год'), cell: system.keys.length ? { kind: 'text', value: count(h.calls, locale), sub: t(`refused: ${h.refused}`, `відхилено: ${h.refused}`) } : { kind: 'text', value: '—', sub: t('no key of its own', 'власного ключа немає') } },
              { label: t('Deliveries, 24 h', 'Доставки, 24 год'), cell: system.endpoints.length ? { kind: 'text', value: count(h.deliveries, locale), sub: t(`failed: ${h.failed}`, `не доставлено: ${h.failed}`) } : { kind: 'text', value: '—', sub: t('no endpoint', 'кінцевої точки немає') } },
              { label: t('Failing in a row', 'Збоїв поспіль'), cell: { kind: 'status', label: String(h.failingStreak), tone: h.failingStreak >= 3 ? 'danger' : h.failingStreak > 0 ? 'warning' : 'neutral' } },
              { label: t('Last success', 'Востаннє успішно'), cell: { kind: 'ago', iso: h.lastSuccessAt, now } },
            ]} />
          </div>
          {system.keys.length > 0 ? (
            <div className="mt-4">
              <p className="annot text-[0.6rem] text-ink-500">{t('API keys that sign its calls', 'API-ключі, що підписують її виклики')}</p>
              <ul className="mt-1 divide-y divide-graphite/15">
                {system.keys.map((k) => {
                  const n = callsOf(k.id);
                  return (
                    <li key={k.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5 text-[0.85rem]">
                      <span className="min-w-0">
                        {can.keys ? <Link href={link('/keys')} className={linkClass}>{k.label}</Link> : <span className="text-ink-900">{k.label}</span>}
                        <span className="ml-2 break-all font-mono text-[0.72rem] text-ink-500">{k.prefix}_…{k.last4}</span>
                        <span className="annot block text-[0.55rem] text-ink-500">{k.mode === 'live' ? t('live', 'бойовий') : t('test', 'тестовий')} · {k.kind === 'secret' ? t('secret, server only', 'секретний, лише на сервері') : t('publishable, opens the pay page', 'публічний, відкриває сторінку оплати')}</span>
                      </span>
                      <span className="annot text-[0.58rem] text-ink-700">{can.logs && n > 0 ? <Link href={link(`/logs?q=${k.id}`)} className={linkClass}>{t(`calls, 24 h: ${n}`, `викликів за 24 год: ${n}`)}</Link> : t(`calls, 24 h: ${n}`, `викликів за 24 год: ${n}`)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {system.endpoints.length > 0 ? (
            <div className="mt-4">
              <p className="annot text-[0.6rem] text-ink-500">{t('Endpoints that hear the platform', 'Кінцеві точки, що отримують події платформи')}</p>
              <ul className="mt-1 divide-y divide-graphite/15">
                {system.endpoints.map((r) => {
                  const recent = deliveriesOf(r.endpoint.id);
                  const failed = recent.filter((x) => x.status === 'failed').length;
                  const status = r.endpoint.status === 'disabled' ? { label: t('disabled', 'вимкнено'), tone: 'neutral' as const } : r.health.failingStreak >= 3 ? { label: t('failing', 'збоїть'), tone: 'danger' as const } : { label: t('enabled', 'увімкнено'), tone: 'success' as const };
                  const url = r.endpoint.url.replace(/^https:\/\//, '');
                  return (
                    <li key={r.endpoint.id} className="py-2 text-[0.85rem]">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        {can.webhooks ? <Link href={link(`/webhooks/${r.endpoint.id}`)} className={`min-w-0 break-all font-mono text-[0.78rem] ${linkClass}`}>{url}</Link> : <span className="min-w-0 break-all font-mono text-[0.78rem] text-ink-700">{url}</span>}
                        <Status label={status.label} tone={status.tone} />
                      </div>
                      <p className="annot mt-1 text-[0.55rem] text-ink-500">{t(`deliveries, 24 h: ${recent.length} · failed: ${failed} · in a row: ${r.health.failingStreak}`, `доставок за 24 год: ${recent.length} · не доставлено: ${failed} · поспіль: ${r.health.failingStreak}`)}{r.health.lastError ? ` · ${r.health.lastError}` : ''}</p>
                      <div className="mt-1.5"><Value cell={eventTags(ctx, r.endpoint.events, 5)} locale={locale} /></div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      )}
      {children}
    </Panel>
  );
}
