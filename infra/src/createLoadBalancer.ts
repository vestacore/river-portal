import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import type { Settings } from './types/Settings';
import type { SurfaceService } from './types/SurfaceService';

/**
 * Global external Application Load Balancer: <domain> → web, studio.<domain> → studio (IAP),
 * Google-managed certificate, HTTP → HTTPS redirect. Without a configured domain, the domain is
 * derived from the static IP via sslip.io (ADR-0016).
 */
export function createLoadBalancer(settings: Settings, web: SurfaceService, studio: SurfaceService, webArmor: gcp.compute.SecurityPolicy, studioArmor: gcp.compute.SecurityPolicy) {
  const address = new gcp.compute.GlobalAddress('lb-ip', { project: settings.project, name: 'river-lb-ip' });
  const domain = settings.domain ? pulumi.output(settings.domain) : address.address.apply((ip) => `${ip.replace(/\./g, '-')}.sslip.io`);
  const studioDomain = pulumi.interpolate`studio.${domain}`;

  const backend = (name: string, surface: SurfaceService, armor: gcp.compute.SecurityPolicy, iap: boolean) =>
    new gcp.compute.BackendService(name, {
      project: settings.project,
      name,
      loadBalancingScheme: 'EXTERNAL_MANAGED',
      protocol: 'HTTPS',
      securityPolicy: armor.selfLink,
      backends: [{ group: surface.neg.id }],
      logConfig: { enable: true, sampleRate: 1 },
      ...(iap ? { iap: { enabled: true } } : {}),
    });
  const webBackend = backend('river-web-backend', web, webArmor, false);
  const studioBackend = backend('river-studio-backend', studio, studioArmor, true);

  const urlMap = new gcp.compute.URLMap('lb-https', {
    project: settings.project,
    name: 'river-https',
    defaultService: webBackend.id,
    hostRules: [{ hosts: [studioDomain], pathMatcher: 'studio' }],
    pathMatchers: [{ name: 'studio', defaultService: studioBackend.id }],
  });
  const certificate = new gcp.compute.ManagedSslCertificate('lb-cert', {
    project: settings.project,
    name: domain.apply((d) => `river-cert-${d.replace(/[^a-z0-9]/g, '-').slice(0, 40)}`),
    managed: { domains: [domain, studioDomain] },
  });
  const httpsProxy = new gcp.compute.TargetHttpsProxy('lb-https-proxy', { project: settings.project, name: 'river-https-proxy', urlMap: urlMap.id, sslCertificates: [certificate.id] });
  new gcp.compute.GlobalForwardingRule('lb-https-rule', {
    project: settings.project, name: 'river-https-rule', loadBalancingScheme: 'EXTERNAL_MANAGED',
    ipAddress: address.address, portRange: '443', target: httpsProxy.id,
  });

  const redirectMap = new gcp.compute.URLMap('lb-http-redirect', {
    project: settings.project,
    name: 'river-http-redirect',
    defaultUrlRedirect: { httpsRedirect: true, stripQuery: false, redirectResponseCode: 'MOVED_PERMANENTLY_DEFAULT' },
  });
  const httpProxy = new gcp.compute.TargetHttpProxy('lb-http-proxy', { project: settings.project, name: 'river-http-proxy', urlMap: redirectMap.id });
  new gcp.compute.GlobalForwardingRule('lb-http-rule', {
    project: settings.project, name: 'river-http-rule', loadBalancingScheme: 'EXTERNAL_MANAGED',
    ipAddress: address.address, portRange: '80', target: httpProxy.id,
  });

  return { address, domain, studioDomain, studioBackend };
}
