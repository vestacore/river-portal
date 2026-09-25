// River Portal infrastructure (adr/records/ADR-0008). The owner runs `pulumi up`; nothing is changed by hand.
import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { buildImage } from './src/buildImage';
import { createArmorPolicy } from './src/createArmorPolicy';
import { createFirestore } from './src/createFirestore';
import { createLoadBalancer } from './src/createLoadBalancer';
import { createRegistry } from './src/createRegistry';
import { createServiceAccounts } from './src/createServiceAccounts';
import { createSurfaceService } from './src/createSurfaceService';
import { enableApis } from './src/enableApis';
import { grantIapAccess } from './src/grantIapAccess';
import { readSettings } from './src/readSettings';

const settings = readSettings();
const apis = enableApis(settings);
const projectNumber = gcp.organizations.getProjectOutput({ projectId: settings.project }).number;

const accounts = createServiceAccounts(settings, apis);
const registry = createRegistry(settings, apis);
const firestore = createFirestore(settings, apis);
const image = buildImage(settings, registry, accounts.build);

const web = createSurfaceService(settings, 'public', image, accounts.web, projectNumber);
const studio = createSurfaceService(settings, 'studio', image, accounts.studio, projectNumber);

const webArmor = createArmorPolicy(settings, 'river-web-armor', 600);
const studioArmor = createArmorPolicy(settings, 'river-studio-armor', 1200);
const lb = createLoadBalancer(settings, web, studio, webArmor, studioArmor);
grantIapAccess(settings, lb.studioBackend);

export const ip = lb.address.address;
export const url = pulumi.interpolate`https://${lb.domain}`;
export const studioUrl = pulumi.interpolate`https://${lb.studioDomain}`;
export const webImage = image;
export const firestoreDatabase = firestore.name;
export const note = 'The managed certificate can take 15–60 minutes to become ACTIVE after the first deployment.';
