import type { Locale } from '@river/i18n';
import { day, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { countText } from '@/lib/routing/countText';
import type { RoutedWeek } from '@/lib/routing/weeklyRouting';

/**
 * Two figures of the online card routing week by week, on one axis of weeks: the share routed on-us as
 * columns, the effective rate as a line beneath — and a dashed line at the week the strategy changed.
 * Every column and point carries a native tooltip with its week and figures.
 */
export function WeeklyRoutingChart({ weeks, marker, locale }: { weeks: RoutedWeek[]; marker: { week: string; label: string } | null; locale: Locale }) {
  const t = lt(locale);
  const width = 720;
  const left = 56;
  const right = 12;
  const top = 22;
  const panel = 92;
  const gap = 36;
  const bottom = 24;
  const top2 = top + panel + gap;
  const height = top2 + panel + bottom;
  const n = Math.max(1, weeks.length);
  const slot = (width - left - right) / n;
  const bar = Math.max(4, slot * 0.58);
  const cx = (i: number) => left + i * slot + slot / 2;
  const shareMax = Math.min(10_000, Math.max(2_000, Math.ceil(Math.max(0, ...weeks.map((w) => w.onUsBps)) / 1_000) * 1_000 + 1_000));
  const rateMax = Math.max(25, Math.ceil(Math.max(0, ...weeks.map((w) => w.rateBps)) / 25) * 25 + 25);
  const y1 = (v: number) => top + (1 - v / shareMax) * panel;
  const y2 = (v: number) => top2 + (1 - v / rateMax) * panel;
  const every = Math.max(1, Math.ceil(weeks.length / 8));
  const label = (w: RoutedWeek) => day(`${w.week}T12:00:00.000Z`, locale);
  const tip = (w: RoutedWeek) => `${t('Week of', 'Тиждень від')} ${label(w)} · ${countText(w.sessions, locale, ['attempt', 'attempts'], ['спроба', 'спроби', 'спроб'])} · on-us ${percent(w.onUsBps, locale)} · ${t('effective rate', 'ефективна ставка')} ${percent(w.rateBps, locale, 2)}`;
  const m = marker ? weeks.findIndex((w) => w.week === marker.week) : -1;
  const mx = left + m * slot;
  const path = weeks.map((w, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y2(w.rateBps).toFixed(1)}`).join(' ');
  const grid = (y: number, text: string) => (
    <g key={`${y}${text}`}>
      <line x1={left} x2={width - right} y1={y} y2={y} stroke="var(--color-blueline)" strokeOpacity="0.55" strokeWidth="0.8" />
      <text x={left - 8} y={y + 3.5} textAnchor="end" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-500)">{text}</text>
    </g>
  );
  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[34rem]" role="img" aria-label={t('On-us share and effective rate by week', 'Частка on-us та ефективна ставка за тижнями')}>
          <text x={left} y={top - 9} className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-700)">{t('On-us share', 'Частка on-us')}</text>
          {[0, shareMax / 2, shareMax].map((v) => grid(y1(v), percent(v, locale, 0)))}
          {weeks.map((w, i) => <rect key={w.week} x={cx(i) - bar / 2} y={y1(w.onUsBps)} width={bar} height={top + panel - y1(w.onUsBps)} fill="var(--color-teal-500)"><title>{tip(w)}</title></rect>)}
          <line x1={left} x2={width - right} y1={top + panel} y2={top + panel} stroke="var(--color-graphite)" strokeWidth="1" />
          <text x={left} y={top2 - 9} className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-700)">{t('Effective rate', 'Ефективна ставка')}</text>
          {[0, rateMax / 2, rateMax].map((v) => grid(y2(v), percent(v, locale, 2)))}
          <path d={path} fill="none" stroke="var(--color-river-700)" strokeWidth="1.6" />
          {weeks.map((w, i) => <circle key={w.week} cx={cx(i)} cy={y2(w.rateBps)} r="2.6" fill="var(--color-paper)" stroke="var(--color-river-700)" strokeWidth="1.2"><title>{tip(w)}</title></circle>)}
          <line x1={left} x2={width - right} y1={top2 + panel} y2={top2 + panel} stroke="var(--color-graphite)" strokeWidth="1" />
          {weeks.map((w, i) => (i % every === 0 ? <text key={w.week} x={cx(i)} y={height - 8} textAnchor="middle" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-500)">{label(w)}</text> : null))}
          {m >= 0 && marker ? (
            <g>
              <line x1={mx} x2={mx} y1={top - 4} y2={top2 + panel} stroke="var(--color-sunrise-600)" strokeWidth="1.2" strokeDasharray="4 3" />
              <text x={mx > width * 0.7 ? mx - 5 : mx + 5} y={top + panel + 14} textAnchor={mx > width * 0.7 ? 'end' : 'start'} className="annot" style={{ fontSize: 9 }} fill="var(--color-sunrise-600)">{marker.label}</text>
            </g>
          ) : null}
        </svg>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <li className="annot flex items-center gap-1.5 text-[0.6rem] text-ink-500"><span className="inline-block size-2.5 bg-teal-500" />{t('share of attempts routed on-us', 'частка спроб, маршрутизованих on-us')}</li>
        <li className="annot flex items-center gap-1.5 text-[0.6rem] text-ink-500"><span className="inline-block h-0.5 w-4 bg-river-700" />{t('expected acquiring fee ÷ amount', 'очікувана комісія еквайрингу ÷ сума')}</li>
        {m >= 0 && marker ? <li className="annot flex items-center gap-1.5 text-[0.6rem] text-ink-500"><span className="inline-block h-3 w-0 border-l border-dashed border-sunrise-600" />{marker.label}</li> : null}
      </ul>
    </div>
  );
}
