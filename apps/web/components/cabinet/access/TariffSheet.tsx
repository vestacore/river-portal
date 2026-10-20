import { pickText, type Locale } from '@river/i18n';
import { feeFor, type Rate, type Tariff } from '@river/psp-contracts';
import type { InstrumentId } from '@river/psp-facts';
import { findInstrument } from '@river/psp-instruments';
import { money, percent } from '@/lib/format';
import { instrumentIcon } from '@/lib/instrumentIcon';
import { lt } from '@/lib/lt';
import { DataTable, type Column } from '../../panels/DataTable';
import { FieldGrid } from '../../panels/FieldGrid';

const example = 100_000;

type Row = { instrument: InstrumentId | null; rate: Rate };

/**
 * A tariff read as a sheet: the rate of every instrument it names and of any other, what one payment of
 * 1 000.00 costs under each — the same `feeFor` the capture takes it by — and the fees of the other events.
 */
export function TariffSheet({ tariff, locale }: { tariff: Tariff; locale: Locale }) {
  const t = lt(locale);
  const named: Row[] = Object.entries(tariff.rates).flatMap(([id, rate]) => (rate ? [{ instrument: id as InstrumentId, rate }] : []));
  const rows: Row[] = [...named, { instrument: null, rate: tariff.fallback }];
  const fee = (r: Row) => (r.instrument ? feeFor(tariff, r.instrument, example) : feeFor({ ...tariff, rates: {} }, 'card', example));
  const sum = (minor: number) => ({ kind: 'money' as const, minor, currency: tariff.currency, muted: minor === 0 });
  const columns: Column<Row>[] = [
    { key: 'instrument', label: t('Instrument', 'Інструмент'), cell: (r) => (r.instrument ? { kind: 'instrument', label: pickText(findInstrument(r.instrument).label, locale), icon: instrumentIcon(r.instrument) } : { kind: 'text', value: named.length ? t('Any other instrument', 'Будь-який інший інструмент') : t('Every instrument', 'Кожен інструмент') }) },
    { key: 'bps', label: t('Rate', 'Ставка'), align: 'end', cell: (r) => ({ kind: 'text', value: percent(r.rate.bps, locale, 2) }) },
    { key: 'fixed', label: t('Fixed part', 'Фіксована частина'), align: 'end', cell: (r) => (r.rate.fixedMinor ? sum(r.rate.fixedMinor) : { kind: 'empty' }) },
    { key: 'min', label: t('Minimum', 'Мінімум'), align: 'end', cell: (r) => (r.rate.minMinor ? sum(r.rate.minMinor) : { kind: 'empty' }) },
    { key: 'example', label: t(`Fee on ${money(example, tariff.currency, locale)}`, `Комісія з ${money(example, tariff.currency, locale)}`), align: 'end', cell: (r) => sum(fee(r)) },
  ];
  return (
    <div>
      <div className="px-1"><DataTable columns={columns} rows={rows} locale={locale} query={{}} /></div>
      <div className="border-t border-graphite/20 p-4">
        <FieldGrid locale={locale} columns={4} fields={[
          { label: t('Per refund', 'За повернення'), cell: sum(tariff.refundFeeMinor) },
          { label: t('Per dispute', 'За спір'), cell: sum(tariff.disputeFeeMinor) },
          { label: t('Per payout', 'За виплату'), cell: sum(tariff.payoutFeeMinor) },
          { label: t('Monthly', 'Щомісяця'), cell: sum(tariff.monthlyMinor) },
        ]} />
      </div>
    </div>
  );
}
