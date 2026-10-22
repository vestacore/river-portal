import { pickText, type Locale } from '@river/i18n';
import { effectiveRules } from '@river/psp-risk';
import { findPolicyDefinition, resolvePolicy, unitKindLabels } from '@river/psp-units';
import { childTotals } from '@river/psp-views';
import { capturedSince, sinceDays } from '@/lib/figures';
import { count, money } from '@/lib/format';
import { lt } from '@/lib/lt';
import { policyText } from '@/lib/policyText';
import { groupFlows } from '@/lib/routingFigures';
import { roleText } from '@/lib/roleText';
import { treeLayout } from '@/lib/treeLayout';
import { BasinDrawing, type BasinMark } from '../river/BasinDrawing';
import { Icon } from '../ui/Icon';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

/** Article 05 — structure and policies: the group as a tree of units, policies that apply downwards, rules that accumulate, visibility upwards, delegated access. */
export function HierarchyArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const w = worlds.retail;
  const unitName = (id: string) => pickText(w.units.find((u) => u.id === id)?.name, locale);
  const outcomeWord: Record<string, [string, string]> = { applied: ['applied', 'застосовано'], narrowed: ['narrowed', 'звужено'], looser: ['looser — ignored', 'ширше — ігнорується'], below_enforced: ['under an enforced one', 'під закріпленою'], blocked: ['blocked', 'заблоковано'] };
  const chain = (unitId: string, key: string) => {
    const d = findPolicyDefinition(key);
    const unit = w.units.find((u) => u.id === unitId)!;
    const r = resolvePolicy(w.units, w.settings, unitId, d);
    return (
      <div className="not-prose border border-graphite/20 bg-paper p-4">
        <p className="text-[0.9rem]"><b className="text-ink-900">{unitName(unitId)}</b> · {pickText(d.label, locale)} = <b className="text-ink-900">{policyText(d, r.value, locale, unit.currency, unitName)}</b>{r.enforcedBy ? <span className="annot ml-2 inline-flex items-center gap-1 bg-sunrise-500 px-1.5 py-0.5 text-[0.55rem] text-ink-900"><Icon name="lock" className="size-3" />{unitName(r.enforcedBy)}</span> : null}</p>
        <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.78rem]">
          <li className="border border-dashed border-graphite/30 px-1.5 py-0.5 text-ink-500">{t('default', 'типове')}: {policyText(d, d.default, locale, unit.currency, unitName)}</li>
          {r.chain.map((s, i) => <li key={`${s.unitId}${i}`} className="flex items-center gap-1.5"><span className="text-ink-300">→</span><span className="border border-graphite/25 px-1.5 py-0.5"><span className="text-ink-700">{unitName(s.unitId)}</span>{s.mode === 'enforced' ? <Icon name="lock" className="ml-1 inline size-3 text-sunrise-600" /> : null} <span className="font-mono">{policyText(d, s.value, locale, unit.currency, unitName)}</span> <span className={`annot text-[0.5rem] ${s.outcome === 'applied' || s.outcome === 'narrowed' ? 'text-teal-600' : 'text-attention-500'}`}>{t(outcomeWord[s.outcome]![0], outcomeWord[s.outcome]![1])}</span></span></li>)}
        </ol>
      </div>
    );
  };
  const from = sinceDays(30);
  const paid = capturedSince(w, from);
  const flows = groupFlows(w, from);
  const shown = (u: (typeof w.units)[number]) => u.kind !== 'store' || u.channel !== 'pos';
  const tree = treeLayout(w.units, 'rt-group', shown, 1400, 92);
  const height = 40 + Math.max(...tree.map((n) => n.depth)) * 92 + 84;
  const short = (s: string) => (s.length > 18 ? `${s.slice(0, 17)}…` : s);
  const marks: Record<string, BasinMark> = Object.fromEntries(w.units.map((u) => [u.id, { unitId: u.id, flow: flows[u.id] ?? 0, enforced: w.settings.filter((s) => s.unitId === u.id && s.mode === 'enforced').length, set: 0, blocked: u.blockInheritance, onboarding: u.status === 'onboarding', label: short(pickText(u.name, locale)), sub: money(flows[u.id] ?? 0, 'UAH', locale, true) }]));
  const online = childTotals(w.units, paid, [...w.views.sessions.values()], 'rt-online', from);
  const rules = effectiveRules(w.units, w.rules, 'rt-web');
  const kinds = [...new Set(w.units.map((u) => u.kind))];
  return (
    <ArticleFrame locale={locale} slug="hierarchy" sheet="RP-05" title={t('Structure and policies', 'Структура і політики')}
      lead={t('The platform keeps everyone who accepts payments in a tree of units, the way a directory keeps an organisation: the group, its legal entities, regions, stores and online channels. A unit sees every payment of its subtree, and the policies it sets apply to everything below it — unless a lower unit overrides, narrows or blocks them, and except what is enforced above.', 'Платформа тримає всіх, хто приймає платежі, у дереві одиниць — так, як каталог тримає організацію: група, її юридичні особи, регіони, магазини й онлайн-канали. Одиниця бачить кожен платіж свого піддерева, а політики, які вона задає, діють на все нижче — якщо нижча одиниця їх не перевизначить, не звузить чи не заблокує, і крім того, що закріплено вище.')}
      cta={{ label: t('Open the administrator’s cabinet', 'Відкрити кабінет адміністратора'), path: '/demo' }}>
      <Section index="1" title={t('The group as a tree', 'Група як дерево')}>
        <p>{t('The demo group is made of', 'Демо-група складається з')} {kinds.map((k) => `${pickText(unitKindLabels[k], locale).toLowerCase()} (${w.units.filter((u) => u.kind === k).length})`).join(', ')}. {t('One legal entity runs the stores, by region; another runs online trade, with a website, an app, payment at the door and corporate orders. The drawing is the group’s own tree, live; the stores are left out for room. The wider the channel, the more money its subtree took in 30 days — online payments, and the stores’ card turnover from the banks’ reports.', 'Одна юридична особа керує магазинами за регіонами; інша — онлайн-торгівлею: сайт, застосунок, оплата при отриманні й корпоративні замовлення. Креслення — власне дерево групи, наживо; магазини не показано, щоб вмістити схему. Що ширше русло, то більше грошей прийняло піддерево за 30 днів — онлайн-платежі та картковий оборот магазинів зі звітів банків.')}</p>
        <Figure caption={t('Fig. 5.1 — the structure of the demo group. A lock: the unit enforces policies.', 'Рис. 5.1 — структура демо-групи. Замок: одиниця закріплює політики.')}>
          <div className="min-w-[1100px]"><BasinDrawing nodes={tree} marks={marks} width={1400} height={height} legend={{ flows: t('money of the subtree, 30 days', 'гроші піддерева, 30 днів'), policies: t('policies apply below', 'політики діють донизу'), enforced: t('enforces', 'закріплює'), blocked: t('blocks inheritance', 'блокує успадкування'), onboarding: t('onboarding', 'онбординг') }} /></div>
        </Figure>
      </Section>

      <Section index="2" title={t('How a setting meets the ones above', 'Як налаштування зустрічається з вищими')}>
        <p>{t('Each policy declares how a lower unit’s setting meets what was resolved above it. Most simply override. Limits narrow: a lower unit may lower a maximum, never raise it. Allowed instruments are a subset: a channel may take one away, never add one the group does not allow. Blocked countries are a union: anyone may add, nobody may remove. And any unit may enforce a setting, after which nothing below it counts.', 'Кожна політика визначає, як налаштування нижчої одиниці зустрічається з тим, що вирішено вище. Більшість просто перевизначаються. Ліміти звужуються: нижча одиниця може зменшити максимум, але не збільшити. Дозволені інструменти — підмножина: канал може прибрати інструмент, але не додати той, якого не дозволяє група. Заблоковані країни — об’єднання: додати може будь-хто, прибрати — ніхто. І будь-яка одиниця може закріпити налаштування — після цього ніщо нижче не діє.')}</p>
        <p>{t('These are live resolutions from the demo group, the same the cabinets show as each unit’s resultant set of policies:', 'Це живі розрахунки демо-групи — ті самі, що кабінети показують як результуючий набір політик кожної одиниці:')}</p>
        <div className="not-prose grid gap-3">
          {chain('rt-kyiv-3', 'settlement.model')}
          {chain('rt-web', 'routing.strategy')}
          {chain('rt-west', 'pos.acquirer')}
          {chain('rt-web', 'capture.mode')}
          {chain('rt-door', 'instruments.allowed')}
          {chain('rt-b2b', 'invoices.reminders')}
        </div>
        <p>{t('The first line is the frame of the whole assembly: the group enforces that its banks settle to its own accounts, so no unit below can turn the platform into a holder of the money. The routing strategy is set once for the group and reaches every channel; each region chooses the bank of its store terminals; the online channels capture after picking.', 'Перший рядок — рамка всієї збірки: група закріплює, що банки розраховуються з її власними рахунками, тож жодна одиниця нижче не може зробити платформу утримувачем коштів. Стратегію маршрутизації задано один раз для групи, і вона діє в кожному каналі; кожен регіон обирає банк терміналів своїх магазинів; онлайн-канали списують кошти після комплектації.')}</p>
      </Section>

      <Section index="3" title={t('Rules accumulate', 'Правила накопичуються')}>
        <p>{t('Conditional rules — a field, an operation, a value, and an action: block, hold for review, route or notify — accumulate down the tree. An attempt on the group’s website meets these, lowest priority first:', 'Умовні правила — поле, операція, значення і дія: заблокувати, затримати на перевірку, змінити маршрут чи сповістити — накопичуються донизу деревом. Спроба на сайті групи проходить такі, від меншого пріоритету:')}</p>
        <ul>{rules.map((r) => <li key={`${r.id}${r.unitId}`}><b>{pickText(r.name, locale)}</b> — {unitName(r.unitId)}{r.enforced ? t(', enforced', ', закріплено') : ''}</li>)}</ul>
      </Section>

      <Section index="4" title={t('A parent sees its children’s flows', 'Батьківська одиниця бачить потоки дочірніх')}>
        <p>{t('Visibility is one test: is the unit of a payment within the subtree of the unit the person is granted at? So the online entity sees, over the last 30 days:', 'Видимість — одна перевірка: чи лежить одиниця платежу в піддереві одиниці, до якої людина має доступ? Тож онлайн-юрособа бачить за останні 30 днів:')}</p>
        <ul>{online.map((x) => <li key={x.unit.id}>{pickText(x.unit.name, locale)}: <b>{Object.entries(x.byCurrency).map(([c, v]) => money(v ?? 0, c, locale)).join(' · ') || '—'}</b> {t('from', 'з')} {count(x.payments, locale)} {t('payments', 'платежів')}</li>)}</ul>
      </Section>

      <Section index="5" title={t('Delegated access and separated duties', 'Делегований доступ і розділені обов’язки')}>
        <p>{t('Access is a grant of one role at one unit, reaching its whole subtree: the payments manager of the group, the online operator of the online entity, a read-only auditor of one region. A person may hold several and switch between them. Some duties are kept apart over the same units: who moves money does not clear its checks. Requests for access are decided by someone else, never by the person asking. In a deployment the grants can follow the group’s own directory (SSO, SCIM); in the demo they are given in the cabinet.', 'Доступ — це надання однієї ролі в одній одиниці, що сягає всього її піддерева: менеджер платежів групи, онлайн-операціоніст онлайн-юрособи, аудитор одного регіону з правом лише перегляду. Людина може мати кілька доступів і перемикатися між ними. Деякі обов’язки над тими самими одиницями розділено: той, хто рухає гроші, не знімає з них перевірок. Запити на доступ вирішує інша людина, ніколи не та, що просить. У розгортанні доступи можуть наслідувати корпоративний каталог групи (SSO, SCIM); у демо їх видають у кабінеті.')}</p>
        <ul>{w.grants.filter((g) => g.status === 'active').slice(0, 10).map((g) => <li key={g.id}>{pickText(w.people.find((p) => p.id === g.personId)?.name, locale)} — {pickText(roleText('retail', g.role), locale).toLowerCase()} · {unitName(g.unitId)}</li>)}</ul>
        <p>{t('The PSP assembly of the demo uses the same structure for another purpose: licensed entities, partners and holdings, merchants being onboarded, the sellers of a marketplace.', 'PSP-збірка демо використовує ту саму структуру з іншою метою: ліцензовані юрособи, партнери й холдинги, мерчанти на онбордингу, продавці маркетплейсу.')}</p>
      </Section>
    </ArticleFrame>
  );
}
