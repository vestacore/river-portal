import * as gcp from '@pulumi/gcp';
import type { Settings } from './types/Settings';

const wafRules = ['sqli-v33-stable', 'xss-v33-stable', 'lfi-v33-stable', 'rfi-v33-stable', 'rce-v33-stable', 'methodenforcement-v33-stable', 'scannerdetection-v33-stable', 'protocolattack-v33-stable', 'sessionfixation-v33-stable'];

/**
 * Cloud Armor Standard policy (ADR-0009): OWASP CRS 3.3 preconfigured WAF rules at sensitivity 1,
 * per-IP throttling, and a stricter limit on form posts. Default: allow.
 * Order matters: a throttle rule's conform action ("allow") ends evaluation, so WAF rules come first.
 */
export function createArmorPolicy(settings: Settings, name: string, requestsPerMinute: number) {
  return new gcp.compute.SecurityPolicy(name, {
    project: settings.project,
    name,
    type: 'CLOUD_ARMOR',
    description: 'River Portal edge policy (WAF + rate limits)',
    advancedOptionsConfig: { jsonParsing: 'STANDARD', logLevel: 'VERBOSE' },
    rules: [
      ...wafRules.map((rule, i) => ({
        priority: 100 + i,
        action: 'deny(403)',
        description: `WAF ${rule}`,
        match: { expr: { expression: `evaluatePreconfiguredWaf('${rule}', {'sensitivity': 1})` } },
      })),
      {
        priority: 900,
        action: 'throttle',
        description: 'Form posts: 20 per minute per IP',
        match: { expr: { expression: "request.method == 'POST'" } },
        rateLimitOptions: { conformAction: 'allow', exceedAction: 'deny(429)', enforceOnKey: 'IP', rateLimitThreshold: { count: 20, intervalSec: 60 } },
      },
      {
        priority: 2000,
        action: 'throttle',
        description: `All requests: ${requestsPerMinute} per minute per IP`,
        match: { versionedExpr: 'SRC_IPS_V1', config: { srcIpRanges: ['*'] } },
        rateLimitOptions: { conformAction: 'allow', exceedAction: 'deny(429)', enforceOnKey: 'IP', rateLimitThreshold: { count: requestsPerMinute, intervalSec: 60 } },
      },
      { priority: 2147483647, action: 'allow', description: 'Default allow', match: { versionedExpr: 'SRC_IPS_V1', config: { srcIpRanges: ['*'] } } },
    ],
  });
}
