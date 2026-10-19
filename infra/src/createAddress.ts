import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import type { Settings } from './types/Settings';

/**
 * The static IP of the load balancer and the domain that follows from it: the configured one, or —
 * without one — a name derived from the address via sslip.io (ADR-0016). Created before the services,
 * so that whatever must know its own public address can be told it.
 */
export function createAddress(settings: Settings): { address: gcp.compute.GlobalAddress; domain: pulumi.Output<string> } {
  const address = new gcp.compute.GlobalAddress('lb-ip', { project: settings.project, name: 'river-lb-ip' });
  const domain = settings.domain ? pulumi.output(settings.domain) : address.address.apply((ip) => `${ip.replace(/\./g, '-')}.sslip.io`);
  return { address, domain };
}
