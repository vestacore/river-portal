import type { Condition, RiskContext, RiskRule } from './types/Risk.ts';

function valueOf(ctx: RiskContext, field: Condition['field']): number | string | null {
  switch (field) {
    case 'amount': return ctx.amountMinor;
    case 'currency': return ctx.currency;
    case 'instrument': return ctx.instrument;
    case 'payer_country': return ctx.payerCountry;
    case 'issuer_country': return ctx.issuerCountry;
    case 'mcc_risk': return ctx.mccRisk;
    case 'score': return ctx.score;
    case 'attempts_24h': return ctx.attempts24h;
    case 'amount_24h': return ctx.amount24hMinor;
  }
}

function holds(condition: Condition, ctx: RiskContext): boolean {
  const left = valueOf(ctx, condition.field);
  const right = condition.value;
  if (left === null) return false;
  switch (condition.op) {
    case 'gt': return typeof left === 'number' && left > Number(right);
    case 'ge': return typeof left === 'number' && left >= Number(right);
    case 'lt': return typeof left === 'number' && left < Number(right);
    case 'le': return typeof left === 'number' && left <= Number(right);
    case 'eq': return String(left) === String(right);
    case 'ne': return String(left) !== String(right);
    case 'in': return Array.isArray(right) && right.includes(String(left));
    case 'not_in': return Array.isArray(right) && !right.includes(String(left));
  }
}

/** Whether a rule's conditions hold for an attempt (all of them for `and`, any for `or`; no conditions holds). */
export function matchRule(rule: RiskRule, ctx: RiskContext): boolean {
  if (rule.conditions.length === 0) return true;
  return rule.compose === 'and' ? rule.conditions.every((c) => holds(c, ctx)) : rule.conditions.some((c) => holds(c, ctx));
}
