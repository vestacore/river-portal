import type { ApiKey } from '@river/psp-integration';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { ActionTable } from '@/components/cabinet/integration/ActionTable';
import { CodeBlock } from '@/components/cabinet/integration/CodeBlock';
import { UnitSelect, unitsFor } from '@/components/cabinet/integration/UnitSelect';
import type { Column } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { createKeyAction, revokeKeyAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { flashSecret } from '@/lib/flashSecret';
import { day as dayOf } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

const day = 86_400_000;

/**
 * The API keys of the units within reach. A key is shown in full once, when it is made; afterwards only
 * its prefix and last four remain. A secret key signs a server's calls, a publishable one only opens a
 * checkout in the browser; test keys reach the sandbox, live keys the river.
 */
export default async function Keys({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'keys.manage');
  const { t } = c;
  const once = query.done === 'created' ? (await flashSecret()).secret : undefined;
  const back = c.link(`/keys${query.unit ? `?unit=${query.unit}` : ''}`);
  const since = new Date(Date.parse(c.now) - day).toISOString();
  const calls = new Map<string, number>();
  for (const e of c.w.apiLog) if (e.at >= since) calls.set(e.keyId, (calls.get(e.keyId) ?? 0) + 1);
  const all = c.w.keys.filter((k) => c.visible.has(k.unitId)).sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === 'active' ? -1 : 1));
  const rows = all.filter((k) => (!query.mode || k.mode === query.mode) && (!query.status || k.status === query.status) && matches(query.q, k.id, k.label, k.last4, c.unitName(k.unitId)));
  const columns: Column<ApiKey>[] = [
    { key: 'label', label: t('Key', 'Ключ'), cell: (k) => ({ kind: 'text', value: k.label, sub: k.id }), sort: (k) => k.label },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (k) => ({ kind: 'unit', name: c.unitName(k.unitId) }), sort: (k) => c.unitName(k.unitId) },
    { key: 'mode', label: t('Mode', 'Режим'), cell: (k) => ({ kind: 'status', label: k.mode === 'live' ? t('live', 'бойовий') : t('test', 'тестовий'), tone: k.mode === 'live' ? 'accent' : 'info' }), sort: (k) => k.mode },
    { key: 'kind', label: t('Kind', 'Тип'), cell: (k) => ({ kind: 'text', value: k.kind === 'secret' ? t('secret', 'секретний') : t('publishable', 'публічний'), sub: k.kind === 'secret' ? t('server only', 'лише на сервері') : t('safe in a browser', 'можна в браузері') }), sort: (k) => k.kind },
    { key: 'value', label: t('Value', 'Значення'), cell: (k) => ({ kind: 'mono', value: `${k.prefix}_…${k.last4}` }) },
    { key: 'created', label: t('Created', 'Створено'), cell: (k) => ({ kind: 'text', value: dayOf(k.createdAt, locale), sub: c.personName(k.createdBy) }), sort: (k) => k.createdAt },
    { key: 'used', label: t('Last used', 'Останнє використання'), cell: (k) => ({ kind: 'ago', iso: k.lastUsedAt, now: c.now }), sort: (k) => k.lastUsedAt ?? '' },
    { key: 'calls', label: t('Calls, 24 h', 'Викликів, 24 год'), align: 'end', cell: (k) => ({ kind: 'count', n: calls.get(k.id) ?? 0 }), sort: (k) => calls.get(k.id) ?? 0 },
    { key: 'status', label: t('Status', 'Статус'), cell: (k) => ({ kind: 'status', label: k.status === 'active' ? t('active', 'діє') : t('revoked', 'відкликано'), tone: k.status === 'active' ? 'success' : 'neutral' }), sort: (k) => k.status },
  ];
  const page = sortAndPage(rows, columns, query);
  const units = unitsFor(c.w, c.actor.unitId, c.visible, (u) => c.may('keys.manage', u.id));
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  return (
    <>
      <CabinetHead kicker={t('Integration', 'Інтеграція')} title={t('API keys', 'API-ключі')}
        lead={t('A secret key signs your server’s calls; a publishable key only opens a checkout in the browser. Test keys reach the sandbox, live keys the river itself. A key is shown in full once — afterwards only its prefix and last four remain.', 'Секретний ключ підписує виклики вашого сервера; публічний лише відкриває оплату в браузері. Тестові ключі працюють із пісочницею, бойові — із самою рікою. Ключ показуємо повністю один раз — далі лишаються тільки префікс і чотири останні символи.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      {once ? (
        <Panel tone="attention" className="mb-6" title={t('Your new key — shown this once', 'Ваш новий ключ — показуємо лише цього разу')}
          note={t('Copy it now into your server’s secret store. We keep only its prefix and last four; if it is lost, revoke it and create another.', 'Скопіюйте його зараз до сховища секретів вашого сервера. Ми зберігаємо лише префікс і чотири останні символи; якщо ключ загубиться, відкличте його й створіть новий.')}>
          <p className="select-all break-all border border-ink-900 bg-paper px-3 py-2.5 font-mono text-[0.9rem] text-ink-900">{once}</p>
        </Panel>
      ) : null}
      <FilterBar locale={locale} query={query} groups={[
        { param: 'mode', label: t('Mode', 'Режим'), options: (['live', 'test'] as const).map((m) => ({ value: m, label: m === 'live' ? t('live', 'бойовий') : t('test', 'тестовий'), count: all.filter((k) => k.mode === m).length })).filter((o) => o.count > 0) },
        { param: 'status', label: t('Status', 'Статус'), options: (['active', 'revoked'] as const).map((s) => ({ value: s, label: s === 'active' ? t('active', 'діє') : t('revoked', 'відкликано'), count: all.filter((k) => k.status === s).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush>
        <div className="px-1">
          <ActionTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query}
            empty={t('No keys in this scope yet.', 'У цих межах ключів ще немає.')}
            trailing={{ label: '', align: 'end', render: (k) => (k.status === 'active' && c.may('keys.manage', k.unitId) ? (
              <form action={revokeKeyAction}>{hidden('keyId', k.id)}{hidden('back', back)}<button type="submit" aria-label={`${t('Revoke', 'Відкликати')} ${k.label}`} className="annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Revoke', 'Відкликати')}</button></form>
            ) : null) }} />
        </div>
      </Panel>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        {units.length > 0 ? (
          <Panel title={t('Create a key', 'Створити ключ')} note={t('The key belongs to the unit and works for its whole subtree.', 'Ключ належить одиниці й діє для всього її піддерева.')}>
            <form action={createKeyAction} className="flex flex-wrap items-end gap-3">
              {hidden('back', back)}
              <UnitSelect w={c.w} rootId={c.actor.unitId} units={units} locale={locale} label={t('Unit', 'Одиниця')} defaultValue={units.some((u) => u.id === c.focus) ? c.focus : undefined} />
              <label className="min-w-[14rem] flex-1 text-[0.8rem] text-ink-700">{t('Label', 'Назва')}<input name="label" required maxLength={60} placeholder={t('Orders service, staging', 'Сервіс замовлень, тестове середовище')} className={`mt-1 block w-full ${field}`} /></label>
              <label className="text-[0.8rem] text-ink-700">{t('Mode', 'Режим')}<select name="mode" defaultValue="test" className={`mt-1 block ${field}`}><option value="test">{t('test', 'тестовий')}</option><option value="live">{t('live', 'бойовий')}</option></select></label>
              <label className="text-[0.8rem] text-ink-700">{t('Kind', 'Тип')}<select name="kind" defaultValue="secret" className={`mt-1 block ${field}`}><option value="secret">{t('secret', 'секретний')}</option><option value="publishable">{t('publishable', 'публічний')}</option></select></label>
              <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Create the key', 'Створити ключ')}</button>
            </form>
          </Panel>
        ) : null}
        <Panel title={t('Using a key', 'Як користуватися ключем')} note={t('Send the secret key as a bearer token, and an idempotency key with every call that writes: a retried call with the same key returns the first answer and writes nothing twice.', 'Надсилайте секретний ключ як bearer-токен, а з кожним викликом, що записує, — ключ ідемпотентності: повторений виклик із тим самим ключем поверне першу відповідь і нічого не запише вдруге.')}>
          <CodeBlock label="curl" code={[
            'curl https://api.river-pay.example/v1/orders \\',
            '  -H "Authorization: Bearer rp_test_sk_…" \\',
            '  -H "Idempotency-Key: 5f1c0e7a-order-1042" \\',
            '  -H "Content-Type: application/json" \\',
            '  -d \'{ "unitId": "…", "lines": [ … ] }\'',
          ].join('\n')} />
        </Panel>
      </div>
    </>
  );
}
