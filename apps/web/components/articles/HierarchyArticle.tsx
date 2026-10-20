import { pickText, type Locale } from '@river/i18n';
import { roleLabels } from '@river/psp-access';
import { effectiveRules } from '@river/psp-risk';
import type { World } from '@river/psp-runtime';
import { findPolicyDefinition, resolvePolicy, unitKindLabels, unitKinds } from '@river/psp-units';
import { childTotals } from '@river/psp-views';
import { capturedSince, sinceDays, subtreeFlows } from '@/lib/figures';
import { money } from '@/lib/format';
import { lt } from '@/lib/lt';
import { policyText } from '@/lib/policyText';
import { treeLayout } from '@/lib/treeLayout';
import { BasinDrawing, type BasinMark } from '../river/BasinDrawing';
import { Icon } from '../ui/Icon';
import { ArticleFrame, Figure, Section } from './ArticleFrame';

/** Article 02 — the hierarchy of units: a directory of everyone who takes payments, policies that flow down, flows that rise up. */
export function HierarchyArticle({ locale, w }: { locale: Locale; w: World }) {
  const t = lt(locale);
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
  const flows = subtreeFlows(w, from);
  const paid = capturedSince(w, from);
  const tree = treeLayout(w.units, 'ou-riverpay', (u) => u.kind !== 'store' && u.kind !== 'seller', 1400, 92);
  const height = 40 + Math.max(...tree.map((n) => n.depth)) * 92 + 84;
  const short = (s: string) => (s.length > 18 ? `${s.slice(0, 17)}…` : s);
  const marks: Record<string, BasinMark> = Object.fromEntries(w.units.map((u) => [u.id, { unitId: u.id, flow: flows[u.id] ?? 0, enforced: w.settings.filter((s) => s.unitId === u.id && s.mode === 'enforced').length, set: 0, blocked: u.blockInheritance, onboarding: u.status === 'onboarding', label: short(pickText(u.name, locale).replace(/^River Pay /, '')), sub: '' }]));
  const ua = childTotals(w.units, paid, [...w.views.sessions.values()], 'ou-ua', from);
  const rules = effectiveRules(w.units, w.rules, 'ou-zerno-if');
  return (
    <ArticleFrame locale={locale} slug="hierarchy" sheet="RP-02" title={t('Rules flow down, flows rise up', 'Правила течуть донизу, потоки — догори')}
      lead={t('River Pay keeps everyone who takes payments in a tree of units, the way a directory keeps an organisation: the platform, its licensed entities, partners and holdings, merchants, their stores and sellers. A unit sees every payment of its subtree, and the policies it sets apply to everything below it — unless a lower unit overrides, narrows or blocks them, and except what it enforces.', 'River Pay тримає всіх, хто приймає платежі, у дереві одиниць — так, як каталог тримає організацію: платформа, її ліцензовані юрособи, партнери й холдинги, мерчанти, їхні точки продажу та продавці. Одиниця бачить кожен платіж свого піддерева, а політики, які вона задає, діють на все нижче — якщо нижча одиниця їх не перевизначить, не звузить чи не заблокує, і крім того, що закріплено.')}
      cta={{ label: t('Open the administrator’s cabinet', 'Відкрити кабінет адміністратора'), path: '/demo' }}>
      <Section index="1" title={t('A tree of units', 'Дерево одиниць')}>
        <p>{t('Seven kinds of unit make the tree:', 'Дерево складають сім видів одиниць:')} {unitKinds.map((k) => `${pickText(unitKindLabels[k], locale).toLowerCase()} (${w.units.filter((u) => u.kind === k).length})`).join(', ')}. {t('The drawing is the demo’s own tree, live: the wider the channel, the more money its subtree took in 30 days — and every unit sees all of it below.', 'Креслення — власне дерево демо, наживо: що ширше русло, то більше грошей прийняло його піддерево за 30 днів — і кожна одиниця бачить усе, що нижче.')}</p>
        <Figure caption={t('Fig. 3 — the basin of River Pay. A lock: the unit enforces policies; a red gate: the unit blocks inheritance; dashed: still onboarding.', 'Рис. 3 — басейн River Pay. Замок: одиниця закріплює політики; червоний затвор: блокує успадкування; пунктир: ще на онбордингу.')}>
          <div className="min-w-[1100px]"><BasinDrawing nodes={tree} marks={marks} width={1400} height={height} legend={{ flows: t('money of the subtree, 30 days', 'гроші піддерева, 30 днів'), policies: t('policies apply below', 'політики діють донизу'), enforced: t('enforces', 'закріплює'), blocked: t('blocks inheritance', 'блокує успадкування'), onboarding: t('onboarding', 'онбординг') }} /></div>
        </Figure>
      </Section>

      <Section index="2" title={t('How a setting meets the ones above', 'Як налаштування зустрічається з вищими')}>
        <p>{t('Each policy declares how a lower unit’s setting meets what was resolved above it. Most simply override. Limits narrow: a lower unit may lower a maximum, never raise it. Allowed instruments are a subset: a shop may take one away, never add one its entity does not allow. Blocked countries are a union: anyone may add, nobody may remove. And any unit may enforce a setting, after which nothing below it counts — not even a block of inheritance.', 'Кожна політика оголошує, як налаштування нижчої одиниці зустрічається з тим, що вирішено вище. Більшість просто перевизначаються. Ліміти звужуються: нижча одиниця може зменшити максимум, але не збільшити. Дозволені інструменти — підмножина: точка може прибрати інструмент, але не додати той, що не дозволяє її юрособа. Заблоковані країни — об’єднання: додати може будь-хто, прибрати — ніхто. І будь-яка одиниця може закріпити налаштування — після цього ніщо нижче не діє, навіть блокування успадкування.')}</p>
        <p>{t('These are live resolutions from the demo, the same the cabinets show as each unit’s resultant set of policy:', 'Це живі розрахунки з демо — ті самі, що кабінети показують як результуючий набір політик кожної одиниці:')}</p>
        <div className="not-prose grid gap-3">
          {chain('ou-kvitka-pharmacy', 'instruments.allowed')}
          {chain('ou-zerno-uzh', 'limits.payment.max')}
          {chain('ou-zerno-uzh', 'split.template')}
          {chain('ou-baltic-bikes', 'agents.autonomy')}
          {chain('ou-kvitka-market', 'agents.autonomy')}
          {chain('ou-amber', 'risk.countries.blocked')}
        </div>
        <p>{t('The second line is a governance finding in plain sight: Zerno Uzhhorod blocks inheritance, so its holding’s 20,000 limit does not reach it and its own, looser one applies. The administrator sees it, and may enforce the limit instead — the third line shows that this is exactly what the holding did with its franchise split.', 'Другий рядок — знахідка для управління на видноті: «Зерно Ужгород» блокує успадкування, тож ліміт холдингу 20 000 до нього не доходить і діє власний, ширший. Адміністратор це бачить і може закріпити ліміт — третій рядок показує, що саме так холдинг вчинив зі своїм розщепленням франшизи.')}</p>
      </Section>

      <Section index="3" title={t('Rules accumulate', 'Правила накопичуються')}>
        <p>{t('Conditional rules — the earlier portal’s “Rules and Limits”: a field, an operation, a value, and an action to block, hold for review, route or notify — accumulate down the tree. An attempt at Zerno Ivano-Frankivsk meets these, lowest priority first:', 'Умовні правила — «Rules and Limits» попереднього порталу: поле, операція, значення і дія заблокувати, затримати на перевірку, змінити маршрут чи сповістити — накопичуються донизу деревом. Спроба в «Зерно Івано-Франківськ» проходить такі, від меншого пріоритету:')}</p>
        <ul>{rules.map((r) => <li key={`${r.id}${r.unitId}`}><b>{pickText(r.name, locale)}</b> — {unitName(r.unitId)}{r.enforced ? t(', enforced', ', закріплено') : ''}</li>)}</ul>
      </Section>

      <Section index="4" title={t('A parent sees its children’s flows', 'Батьківська одиниця бачить потоки дочірніх')}>
        <p>{t('Visibility is one test: is the unit of a payment within the subtree of the unit the person is granted at? So River Pay Ukraine sees, over the last 30 days:', 'Видимість — одна перевірка: чи лежить одиниця платежу в піддереві одиниці, до якої людина має доступ? Тож River Pay Україна бачить за останні 30 днів:')}</p>
        <ul>{ua.map((x) => <li key={x.unit.id}>{pickText(x.unit.name, locale)}: <b>{Object.entries(x.byCurrency).map(([c, v]) => money(v ?? 0, c, locale)).join(' · ') || '—'}</b> {t('from', 'з')} {x.payments} {t('payments', 'платежів')}</li>)}</ul>
      </Section>

      <Section index="5" title={t('Delegation, and the duties kept apart', 'Делегування і розділені обов’язки')}>
        <p>{t('Access is a grant of one role at one unit, reaching its whole subtree — an operator of the Ukrainian entity, a pay page designer of a holding, an integrator of a merchant. A person may hold several and switch between them. Some roles are kept apart over the same units: who moves money does not clear its checks. Requests for access are decided by someone else, never by the person asking.', 'Доступ — це надання однієї ролі в одній одиниці, що сягає всього її піддерева: операціоніст української юрособи, дизайнер сторінки оплати холдингу, інтегратор мерчанта. Людина може мати кілька і перемикатися між ними. Деякі ролі над тими самими одиницями розділено: той, хто рухає гроші, не знімає з них перевірок. Запити на доступ вирішує інша людина, ніколи не та, що просить.')}</p>
        <ul>{w.grants.filter((g) => g.status === 'active').slice(0, 8).map((g) => <li key={g.id}>{pickText(w.people.find((p) => p.id === g.personId)?.name, locale)} — {pickText(roleLabels[g.role], locale).toLowerCase()} · {unitName(g.unitId)}</li>)}</ul>
      </Section>
    </ArticleFrame>
  );
}
