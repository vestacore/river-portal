import { pickText } from '@river/i18n';
import { factDefinition, type Posting } from '@river/psp-facts';
import { acquirers } from '@river/psp-instruments';
import { balancesOf, isBalanced, type Balance, type JournalEntry } from '@river/psp-ledger';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { ActionTable } from '@/components/cabinet/integration/ActionTable';
import { pathOfStream, unitOfStream } from '@/components/cabinet/integration/facts';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { cabinet } from '@/lib/cabinet';
import { count, money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

type Entry = JournalEntry & { unitId: string };

/**
 * The ledger of a reach: the double entries the facts formed — the split, refunds, lost disputes, payouts —
 * newest first, each with its postings; the balance of every account; and the law of conservation: in
 * every currency, debits equal credits. Nobody writes the ledger by hand; it is a projection of the facts.
 */
export default async function Ledger({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'payouts.read');
  const { t } = c;
  const entries: Entry[] = [];
  for (const e of c.w.journal) {
    const unitId = unitOfStream(c.w, e.stream);
    if (unitId && c.visible.has(unitId)) entries.push({ ...e, unitId });
  }
  entries.sort((a, b) => b.at.localeCompare(a.at) || b.seq - a.seq);
  // The retail group's banks settle to it directly: its accounts read as what each bank owes and keeps, and what is due to whom.
  const retail = c.stand === 'retail';
  const provider = (id: string) => pickText(acquirers.find((a) => a.id === id)?.label, locale) || id;
  const account = (name: string) => {
    const [kind, id = ''] = name.split(':');
    if (retail && kind === 'clearing') return t(`Clearing with ${provider(id)}`, `Кліринг із «${provider(id)}»`);
    if (retail && kind === 'acquirer-fees') return t(`Fees kept by ${provider(id)}`, `Комісії «${provider(id)}»`);
    if (retail && kind === 'payable') return t(`Due to ${c.unitName(id)}`, `Належить: ${c.unitName(id)}`);
    if (name === 'revenue:psp-fees') return t('Revenue · PSP fees', 'Дохід · комісії PSP');
    if (kind === 'payable') return `${t('Payable', 'До виплати')} · ${c.unitName(id)}`;
    if (kind === 'reserve') return `${t('Reserve', 'Резерв')} · ${c.unitName(id)}`;
    if (kind === 'clearing') return `${t('Clearing', 'Кліринг')} · ${id}`;
    return name;
  };
  const types = [...new Set(entries.map((e) => e.type))];
  const currencies = [...new Set(entries.flatMap((e) => e.postings.map((p) => p.currency)))].sort();
  const rows = entries.filter((e) => (!query.type || e.type === query.type) && (!query.currency || e.postings.some((p) => p.currency === query.currency))
    && matches(query.q, e.stream, c.unitName(e.unitId), ...e.postings.map((p) => account(p.account)), ...e.postings.map((p) => p.account)));
  const columns: Column<Entry>[] = [
    { key: 'at', label: t('When', 'Коли'), cell: (e) => ({ kind: 'datetime', iso: e.at }), sort: (e) => e.at },
    { key: 'fact', label: t('Fact', 'Факт'), cell: (e) => ({ kind: 'text', value: pickText(factDefinition(e.type).label, locale), sub: e.type }), sort: (e) => e.type },
    { key: 'stream', label: t('Stream', 'Потік'), cell: (e) => ({ kind: 'mono', value: `${e.stream}#${e.seq}`, href: c.link(pathOfStream(e.stream, e.seq)) }), sort: (e) => e.stream },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (e) => ({ kind: 'unit', name: c.unitName(e.unitId) }), sort: (e) => c.unitName(e.unitId) },
  ];
  const page = sortAndPage(rows, columns, query);
  const postings: Posting[] = entries.flatMap((e) => e.postings);
  const balances = balancesOf(postings);
  const side = (minor: number) => (minor > 0 ? t('Dr', 'Дт') : minor < 0 ? t('Cr', 'Кт') : '');
  const balanceColumns: Column<Balance>[] = [
    { key: 'account', label: t('Account', 'Рахунок обліку'), cell: (b) => ({ kind: 'text', value: account(b.account), sub: b.account }) },
    { key: 'currency', label: t('Currency', 'Валюта'), cell: (b) => ({ kind: 'mono', value: b.currency }) },
    { key: 'debit', label: t('Debits', 'Дебет'), align: 'end', cell: (b) => ({ kind: 'money', minor: b.debitMinor, currency: b.currency, muted: true }) },
    { key: 'credit', label: t('Credits', 'Кредит'), align: 'end', cell: (b) => ({ kind: 'money', minor: b.creditMinor, currency: b.currency, muted: true }) },
    { key: 'balance', label: t('Balance', 'Сальдо'), align: 'end', cell: (b) => (b.balanceMinor === 0 ? { kind: 'text', value: t('settled', 'закрито') } : { kind: 'text', value: `${money(Math.abs(b.balanceMinor), b.currency, locale)} ${side(b.balanceMinor)}` }) },
  ];
  return (
    <>
      <CabinetHead kicker={t('After the mouth', 'Після гирла')} title={t('Ledger', 'Облік')}
        lead={retail
          ? t('The split of every payment, every refund, every lost dispute and every bank’s settlement forms a balanced double entry; nobody posts by hand. The platform holds no money here: the ledger follows what each bank owes for captured payments until it settles them to the group’s accounts.', 'Розщеплення кожного платежу, кожне повернення, кожен програний спір і кожен розрахунок банку формують збалансовану подвійну проводку; вручну ніхто нічого не проводить. Платформа тут не тримає грошей: облік стежить за тим, що кожен банк винен за списані платежі, доки не перерахує їх на рахунки групи.')
          : t('Water is neither made nor lost inside the river. The split, every refund, every lost dispute and every payout forms a balanced double entry; nobody posts by hand.', 'Вода в ріці не з’являється і не зникає. Розщеплення, кожне повернення, кожен програний спір і кожна виплата формують збалансовану подвійну проводку; вручну ніхто нічого не проводить.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Panel title={t('Conservation', 'Збереження')} className="mb-6"
        note={t('The ledger is a projection: replaying the facts gives the same journal. Each entry balances on its own, so every part of the ledger — this scope included — balances too.', 'Облік — це проєкція: якщо відтворити факти, вийде той самий журнал. Кожна проводка збалансована сама собою, тож збалансована й будь-яка частина обліку — зокрема в цих межах.')}>
        {currencies.length === 0 ? <p className="text-ink-500">{t('No entries in this scope yet.', 'У цих межах проводок ще немає.')}</p> : (
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
            {currencies.map((cur) => {
              const own = postings.filter((p) => p.currency === cur);
              const debit = own.filter((p) => p.side === 'debit').reduce((s, p) => s + p.amountMinor, 0);
              const credit = own.filter((p) => p.side === 'credit').reduce((s, p) => s + p.amountMinor, 0);
              return (
                <li key={cur} className="border-t border-graphite/15 pt-2">
                  <p className="flex items-center justify-between gap-3"><span className="font-mono text-[0.85rem] text-ink-900">{cur}</span>{isBalanced(own) ? <Status label={t('debits equal credits', 'дебет дорівнює кредиту')} tone="success" /> : <Status label={t('out of balance', 'не збалансовано')} tone="danger" />}</p>
                  <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[0.85rem]">
                    <dt className="text-ink-500">{t('Debits', 'Дебет')}</dt><dd className="text-right tabular-nums text-ink-900">{money(debit, cur, locale)}</dd>
                    <dt className="text-ink-500">{t('Credits', 'Кредит')}</dt><dd className="text-right tabular-nums text-ink-900">{money(credit, cur, locale)}</dd>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <FilterBar locale={locale} query={query} groups={[
        { param: 'type', label: t('Fact', 'Факт'), options: types.map((x) => ({ value: x, label: pickText(factDefinition(x).label, locale), count: entries.filter((e) => e.type === x).length })) },
        { param: 'currency', label: t('Currency', 'Валюта'), options: currencies.map((cur) => ({ value: cur, label: cur, count: entries.filter((e) => e.postings.some((p) => p.currency === cur)).length })) },
      ]} />
      <Panel title={t('Journal', 'Журнал проводок')} note={t(`${count(entries.length, locale)} entries in this scope, newest first. Each links to the bridge that formed it.`, `Проводок у цих межах: ${count(entries.length, locale)}, найновіші вгорі. Кожна веде до мосту, що її сформував.`)} flush>
        <div className="px-1">
          <ActionTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} empty={t('No entries match.', 'Жодна проводка не підходить.')}
            trailing={{ label: t('Postings', 'Проводки'), render: (e) => (
              <ul className="min-w-[22rem] space-y-0.5 font-mono text-[0.72rem] leading-snug">
                {e.postings.map((p, i) => (
                  <li key={`${p.account}${p.side}${i}`} className="grid grid-cols-[1.6rem_minmax(0,1fr)_auto] gap-x-2">
                    <span className={p.side === 'debit' ? 'text-ink-900' : 'text-ink-500'}>{p.side === 'debit' ? t('Dr', 'Дт') : t('Cr', 'Кт')}</span>
                    <span className={`truncate text-ink-700 ${p.side === 'credit' ? 'pl-3' : ''}`} title={p.account}>{account(p.account)}</span>
                    <span className="text-right tabular-nums text-ink-900">{money(p.amountMinor, p.currency, locale)}</span>
                  </li>
                ))}
              </ul>
            ) }} />
        </div>
      </Panel>
      <Panel title={t('Balances', 'Сальдо рахунків')} className="mt-6" flush note={retail
        ? t('Debits less credits, per account and currency. A debit balance on a clearing account is what a bank owes for payments captured and not yet settled; the credit balances beside it are the share due to the merchant and the fee the bank keeps. Once the bank settles, all of them are back to zero.', 'Дебет мінус кредит — за рахунком і валютою. Дебетове сальдо на рахунку клірингу — те, що банк винен за списані, але ще не розраховані платежі; кредитові сальдо поруч — частка, що належить мерчанту, і комісія, яку банк утримує. Щойно банк розрахується, усі вони повертаються до нуля.')
        : t('Debits less credits, per account and currency. A credit balance is owed to someone or earned: a recipient’s payable, a reserve, the PSP’s revenue. A debit balance on a clearing account is what an acquirer still holds for the PSP.', 'Дебет мінус кредит — за рахунком і валютою. Кредитове сальдо — те, що належить комусь або зароблено: до виплати одержувачу, резерв, дохід PSP. Дебетове сальдо на рахунку клірингу — те, що еквайр ще тримає для PSP.')}>
        <div className="px-1"><DataTable columns={balanceColumns} rows={balances} locale={locale} query={{}} pageSize={Math.max(1, balances.length)} empty={t('No balances in this scope yet.', 'У цих межах сальдо ще немає.')} /></div>
      </Panel>
    </>
  );
}
