import { pickText, type Locale } from '@river/i18n';
import { boundaries, factCatalogue, projectionLabels, stageCatalogue } from '@river/psp-facts';
import { riverOfSession, type World } from '@river/psp-runtime';
import { stageFunnel } from '@river/psp-views';
import { sinceDays } from '@/lib/figures';
import { lt } from '@/lib/lt';
import { RiverFunnel } from '../charts/RiverFunnel';
import { BridgeTable } from '../river/BridgeTable';
import { SessionRiver } from '../river/SessionRiver';
import { ArticleFrame, Figure, Section } from './ArticleFrame';

/** Article 04 — the lifecycle: four boundaries, the bridges of the river, the projections each bridge forms, replay as the check. */
export function LifecycleArticle({ locale, w }: { locale: Locale; w: World }) {
  const t = lt(locale);
  const from = sinceDays(30);
  const sessions = [...w.views.sessions.values()].filter((s) => s.openedAt >= from);
  const example = sessions.filter((s) => s.outcome === 'succeeded' && s.instrument === 'card' && s.consent === 'authentication.Passed' && s.risk && s.risk.reasons.length > 0).at(-1) ?? sessions.find((s) => s.outcome === 'succeeded');
  const river = example ? riverOfSession(w, example.sessionId) : null;
  const labels = Object.fromEntries(factCatalogue.map((d) => [d.type, pickText(d.label, locale)]));
  const stageLabels = { ...Object.fromEntries(stageCatalogue.map((x) => [x.stage, pickText(x.label, locale)])), after: t('closing', 'завершення') };
  const funnel = stageFunnel(sessions).map((f) => ({ label: pickText(stageCatalogue.find((s) => s.stage === f.stage)!.label, locale), reached: f.reached }));
  const after = ['refund.Completed', 'dispute.Opened', 'dispute.Won', 'dispute.Lost', 'payout.Sent'].map((type) => ({ type, n: w.log.filter((f) => f.type === type && f.at >= from).length }));
  const boundaryText: Record<string, [string, string]> = {
    order: ['What is bought, from whom, and how its money will be distributed.', 'Що купують, у кого і як буде розподілено гроші.'],
    invoice: ['The payable claim: how much, by when, how much is still due.', 'Вимога до сплати: скільки, до коли, скільки ще належить.'],
    session: ['One attempt to pay: the river from unpaid to paid.', 'Одна спроба оплати: ріка від несплаченого до сплаченого.'],
    payment: ['Money secured by an attempt, and its life after the mouth.', 'Гроші, забезпечені спробою, і їхнє життя після гирла.'],
  };
  return (
    <ArticleFrame locale={locale} slug="lifecycle" sheet="RP-04" title={t('The whole life of a payment, its projections in view', 'Увесь життєвий цикл платежу — з проєкціями на виду')}
      lead={t('Four boundaries hold every payment: the order, the invoice, the payment session — the attempt itself, the river — and the payment. Each writes only its own facts and forms its own view from every fact that names it. The bridges are the facts of the session’s river: at each one, information forms the views of all four, and the ledger.', 'Кожен платіж тримають чотири межі: замовлення, інвойс, платіжна сесія — сама спроба, ріка — і платіж. Кожна пише лише власні факти й формує свою проєкцію з кожного факту, що її згадує. Мости — це факти ріки сесії: на кожному інформація формує проєкції всіх чотирьох і облік.')}
      cta={{ label: t('Follow a session in the cabinet', 'Простежте сесію в кабінеті'), path: '/demo' }}>
      <Section index="1" title={t('Four boundaries, one vocabulary', 'Чотири межі, один словник')}>
        <p>{t('The boundaries share a vocabulary — every fact type, its owner, its speaker and the views it forms — and nothing else: none of them imports another, and the build checks it. A fact is written only into a stream of the boundary that owns it; any boundary may hear it. That is the whole contract of a module:', 'Межі мають спільний словник — кожен тип факту, його власника, мовця і проєкції, які він формує, — і нічого більше: жодна не імпортує іншу, і збірка це перевіряє. Факт записується лише в потік межі-власника; почути його може будь-яка межа. Це і є весь контракт модуля:')}</p>
        <div className="not-prose overflow-x-auto border border-graphite/20">
          <table className="w-full text-left text-[0.82rem]">
            <thead><tr className="border-b border-ink-900/80">{[t('Boundary', 'Межа'), t('Holds', 'Тримає'), t('Writes (its own facts)', 'Пише (власні факти)'), t('Hears from the others', 'Чує від інших')].map((h) => <th key={h} className="annot px-3 py-2 text-[0.56rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
            <tbody>{boundaries.map((b) => (
              <tr key={b} className="border-b border-graphite/15 align-top">
                <td className="px-3 py-2 font-semibold text-ink-900">{pickText(projectionLabels[b], locale)}</td>
                <td className="px-3 py-2 text-ink-700">{t(boundaryText[b]![0], boundaryText[b]![1])}</td>
                <td className="px-3 py-2 font-mono text-[0.7rem] text-ink-700">{factCatalogue.filter((d) => d.owner === b).map((d) => d.type).join(' ')}</td>
                <td className="px-3 py-2 font-mono text-[0.7rem] text-ink-500">{factCatalogue.filter((d) => d.owner !== b && d.forms.includes(b)).map((d) => d.type).join(' ')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {river && example ? (
        <Section index="2" title={t('A real attempt, bridge by bridge', 'Справжня спроба, міст за мостом')}>
          <p>{t('This is a session of the demo stand as it was written. The squares under each bridge are the views it formed — Session, Order, Invoice, Payment, Ledger; the rows below say what changed in each, from what to what. The capture is the bridge where the invoice and the order become paid; the split forms the ledger.', 'Це сесія демо-стенда — така, як її записано. Квадрати під кожним мостом — проєкції, які він сформував: сесія, замовлення, інвойс, платіж, облік; рядки нижче кажуть, що саме змінилося в кожній, з чого на що. Списання — міст, де інвойс і замовлення стають сплаченими; розщеплення формує облік.')}</p>
          <Figure caption={`${t('Fig. 6 — session', 'Рис. 6 — сесія')} ${example.sessionId}`}>
            <SessionRiver bridges={river.bridges} labels={labels} stageLabels={stageLabels} ended="succeeded" legend={{ session: t('session', 'сесія'), order: t('order', 'замовлення'), invoice: t('invoice', 'інвойс'), payment: t('payment', 'платіж'), ledger: t('ledger', 'облік'), door: t('a person at the door', 'людина біля дверей'), figure: t('a figure of the machine', 'фігура машини'), world: t('the world: banks, clock', 'світ: банки, годинник') }} />
          </Figure>
          <div className="not-prose border border-graphite/20"><BridgeTable rows={river.bridges} locale={locale} currency={example.currency} /></div>
        </Section>
      ) : null}

      <Section index="3" title={t('The stages of the river', 'Стадії ріки')}>
        <ul>{stageCatalogue.map((s) => <li key={s.stage}><b>{pickText(s.label, locale)}</b> — {pickText(s.meaning, locale)}</li>)}</ul>
        <Figure caption={t('How many of the last 30 days’ attempts reached each stage — the funnel drawn as the river it is.', 'Скільки спроб за останні 30 днів дійшли до кожної стадії — воронка, накреслена як ріка, якою вона є.')}><RiverFunnel stages={funnel} /></Figure>
      </Section>

      <Section index="4" title={t('After the mouth', 'Після гирла')}>
        <p>{t('A payment lives on in its own stream: refunds and disputes take money back from the streams of the split, payouts carry each share to its recipient. In the last 30 days the demo stand recorded:', 'Платіж живе далі у власному потоці: повернення й спори забирають гроші з протоків розщеплення, виплати несуть кожну частку одержувачу. За останні 30 днів демо-стенд записав:')}</p>
        <ul>{after.map((a) => <li key={a.type}>{labels[a.type]}: <b>{a.n}</b></li>)}</ul>
      </Section>

      <Section index="5" title={t('Replay is the check', 'Перевірка — це відтворення')}>
        <p>{t('No view is written by hand. Replaying the facts, in order, through the boundaries’ projections gives exactly the views the cabinets read — the tests of the stand do it on every build — and the ledger balances in every currency because it is a projection of the split. The demo’s 75 days of history are themselves a replay: the same functions a live payment uses, driven by a seeded clock.', 'Жодна проєкція не пишеться вручну. Відтворення фактів по порядку через проєкції меж дає рівно ті проєкції, які читають кабінети, — тести стенда роблять це на кожній збірці, — а облік збалансований у кожній валюті, бо є проєкцією розщеплення. Самі 75 днів історії демо — теж відтворення: ті самі функції, що й живий платіж, під керуванням засіяного годинника.')}</p>
        <p>{t('A webhook is a released fact: its id names one fact in its stream, so a receiver deduplicates on it, and every event an integrator receives can be found, with what it formed, on the session’s page.', 'Вебхук — це випущений факт: його id називає один факт у потоці, тож отримувач дедуплікує за ним, а кожну подію, що отримав інтегратор, можна знайти — разом із тим, що вона сформувала, — на сторінці сесії.')}</p>
      </Section>
    </ArticleFrame>
  );
}
