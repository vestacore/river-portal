import type { CostKind } from '@river/flows';
import type { LocalisedText } from '@river/i18n';
import type { ProfileId } from '@river/settings';
import type { PersonaId } from './PersonaId.ts';

/** A cost line in the variant's own currencies (amounts in minor units, e.g. kopiykas). */
export type DemoCost = { kind: CostKind; amountMinor: number; currency: string; note: string };

/**
 * The demo data of one profile, so that each profile can be tested with coherent content:
 * the currency, names, campaigns, routes and costs of that kind of organisation. All fictional.
 */
export type DemoVariant = {
  profileId: ProfileId;
  currency: 'GBP' | 'UAH';
  /** Multiplies the base schedule of money gifts (written in pounds) into this currency. */
  amountFactor: number;
  personaNames: Record<PersonaId, LocalisedText>;
  campaigns: {
    fuel: { slug: string; title: LocalisedText; summary: LocalisedText; goalMajor: number };
    winter: { slug: string; title: LocalisedText; summary: LocalisedText; goalMajor: number };
  };
  /** Ten money givers, in the order of the base schedule; index 0 is the "james" persona. */
  givers: Array<{ name: string; email: string }>;
  goods: {
    generator: { description: string; giver: string; email: string };
    food: { description: string; giver: string; email: string };
    transport: { description: string; giver: string; email: string };
  };
  routes: { flow1From: string; flow2From: string; flow2Carrier: string };
  costs1: DemoCost[];
  costs2: DemoCost[];
  /** Five overrides aligned with the base needs (Olena, Sumy neighbours, school, Kherson family, Zaporizhzhia). */
  needOverrides: Array<{ oblastId?: string; settlement?: string }>;
  /** Olena's thanks after her delivery (she writes in Ukrainian), fitting the variant's route. */
  recipientThanks: string;
  milestone: LocalisedText;
};
