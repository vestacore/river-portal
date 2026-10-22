import type { LocalisedText } from '@river/i18n';
import type { Currency, InstrumentId } from '@river/psp-facts';

/** A rate for one instrument: `bps` of the amount plus a fixed part, never below `minMinor`. */
export type Rate = { bps: number; fixedMinor: number; minMinor: number };

/** A tariff: what the PSP charges, per instrument and per event. */
export type Tariff = {
  id: string;
  name: LocalisedText;
  currency: Currency;
  rates: Partial<Record<InstrumentId, Rate>>;
  fallback: Rate;
  refundFeeMinor: number;
  disputeFeeMinor: number;
  payoutFeeMinor: number;
  monthlyMinor: number;
};

export const contractStatuses = ['draft', 'sent', 'signed', 'active', 'suspended', 'terminated', 'expired'] as const;
export type ContractStatus = (typeof contractStatuses)[number];

export type ContractKind = 'merchant_agreement' | 'marketplace_addendum' | 'partner_agreement' | 'nonprofit_agreement' | 'data_processing' | 'acquiring_agreement' | 'platform_agreement';

/** A contract with a unit of the hierarchy. Signatories are named by role and initials only. */
export type Contract = {
  id: string;
  number: string;
  unitId: string;
  kind: ContractKind;
  status: ContractStatus;
  tariffId: string | null;
  validFrom: string;
  validTo: string | null;
  signedAt: string | null;
  renewal: 'auto' | 'manual';
  signatories: Array<{ name: string; role: LocalisedText; signedAt: string | null }>;
  documents: Array<{ title: LocalisedText; version: string; at: string }>;
  history: Array<{ at: string; by: string; what: LocalisedText }>;
};
