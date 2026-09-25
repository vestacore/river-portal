import * as path from 'node:path';
import * as pulumi from '@pulumi/pulumi';
import type { Settings } from './types/Settings';

/** Reads stack configuration with safe defaults (europe-west1, Firestore eur3). */
export function readSettings(): Settings {
  const gcp = new pulumi.Config('gcp');
  const river = new pulumi.Config('river-portal');
  return {
    project: gcp.require('project'),
    region: gcp.get('region') ?? 'europe-west1',
    firestoreLocation: river.get('firestoreLocation') ?? 'eur3',
    orgId: river.get('orgId') ?? 'open-river-aid',
    seed: river.get('seed') === 'none' ? 'none' : 'demo',
    aiModel: river.get('aiModel') ?? 'gemini-2.5-flash',
    aiLocation: river.get('aiLocation') ?? 'europe-west4',
    domain: river.get('domain'),
    iapMembers: river.getObject<string[]>('iapMembers') ?? [],
    staffRoles: river.get('staffRoles') ?? '',
    repoRoot: path.resolve(__dirname, '..', '..'),
  };
}
