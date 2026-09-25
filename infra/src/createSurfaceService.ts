import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import type { Settings } from './types/Settings';
import type { SurfaceService } from './types/SurfaceService';

/**
 * One surface of the app (ADR-0010) on Cloud Run. Ingress only from the load balancer, so Cloud Armor
 * and IAP cannot be bypassed; the IAM invoker check is off because the edge enforces access.
 */
export function createSurfaceService(
  settings: Settings,
  surface: 'public' | 'studio',
  image: pulumi.Input<string>,
  account: gcp.serviceaccount.Account,
  projectNumber: pulumi.Input<string>,
): SurfaceService {
  const name = surface === 'public' ? 'river-web' : 'river-studio';
  const env: Record<string, pulumi.Input<string>> = {
    RIVER_SURFACE: surface,
    RIVER_STORE: 'firestore',
    RIVER_ORG_ID: settings.orgId,
    RIVER_SEED: settings.seed,
    GOOGLE_CLOUD_PROJECT: settings.project,
    RIVER_AI: surface === 'studio' ? 'vertex' : 'fallback',
    RIVER_AI_MODEL: settings.aiModel,
    RIVER_AI_LOCATION: settings.aiLocation,
    RIVER_IAP_AUDIENCE_PREFIX: pulumi.interpolate`/projects/${projectNumber}/global/backendServices/`,
    RIVER_STAFF_ROLES: settings.staffRoles,
  };
  const service = new gcp.cloudrunv2.Service(name, {
    project: settings.project,
    location: settings.region,
    name,
    ingress: 'INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER',
    invokerIamDisabled: true,
    deletionProtection: false,
    template: {
      serviceAccount: account.email,
      scaling: { minInstanceCount: 0, maxInstanceCount: surface === 'public' ? 10 : 3 },
      maxInstanceRequestConcurrency: 80,
      containers: [{
        image,
        ports: { containerPort: 8080 },
        resources: { limits: { cpu: '1', memory: '1Gi' }, cpuIdle: true, startupCpuBoost: true },
        envs: Object.entries(env).map(([key, value]) => ({ name: key, value })),
        startupProbe: { httpGet: { path: '/robots.txt' }, periodSeconds: 3, failureThreshold: 20 },
      }],
    },
  });
  const neg = new gcp.compute.RegionNetworkEndpointGroup(`${name}-neg`, {
    project: settings.project,
    region: settings.region,
    networkEndpointType: 'SERVERLESS',
    cloudRun: { service: service.name },
  });
  return { service, neg };
}
