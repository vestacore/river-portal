import { policyDefinitions } from './data/policyDefinitions.ts';
import type { PolicyDefinition } from './types/Policy.ts';

/** The declared form of a policy; throws for a key nobody declared. */
export function findPolicyDefinition(key: string): PolicyDefinition {
  const definition = policyDefinitions.find((d) => d.key === key);
  if (!definition) throw new Error(`Unknown policy ${key}`);
  return definition;
}
