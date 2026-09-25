import type * as gcp from '@pulumi/gcp';

/** A Cloud Run service with the serverless NEG that connects it to the load balancer. */
export type SurfaceService = { service: gcp.cloudrunv2.Service; neg: gcp.compute.RegionNetworkEndpointGroup };
