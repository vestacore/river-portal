import type { RiskReason, RiskRule } from '@river/psp-risk';

/** The screening of one attempt: the score and its reasons, the rules that matched, and what they decide. */
export type Screening = {
  score: number;
  level: 'low' | 'medium' | 'high';
  reasons: RiskReason[];
  decision: 'pass' | 'review' | 'block';
  matched: RiskRule[];
  routeTo: string | null;
  notify: boolean;
};
