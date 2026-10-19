// River Portal infrastructure (adr/records/ADR-0008). The owner runs `pulumi up`; nothing is changed by hand.
import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { buildImage } from './src/buildImage';
import { buildPayImage } from './src/buildPayImage';
import { createAddress } from './src/createAddress';
import { createArmorPolicy } from './src/createArmorPolicy';
import { createFirestore } from './src/createFirestore';
import { createLoadBalancer } from './src/createLoadBalancer';
import { createPayRiver } from './src/createPayRiver';
import { createRegistry } from './src/createRegistry';
import { createServiceAccounts } from './src/createServiceAccounts';
import { createSurfaceService } from './src/createSurfaceService';
import { enableApis } from './src/enableApis';
import { grantIapAccess } from './src/grantIapAccess';
import { payEnvironment } from './src/payEnvironment';
import { readPaySettings } from './src/readPaySettings';
import { readSettings } from './src/readSettings';

const settings = readSettings();
// The payment river (adr/records/ADR-0025) is created only when `river-portal:payEnabled` is true.
const pay = readPaySettings();
const apis = enableApis(settings, pay.enabled ? ['eventarc.googleapis.com', 'pubsub.googleapis.com', 'cloudscheduler.googleapis.com'] : []);
const projectNumber = gcp.organizations.getProjectOutput({ projectId: settings.project }).number;

const accounts = createServiceAccounts(settings, apis, pay.enabled ? pay.database : undefined);
const registry = createRegistry(settings, apis);
const firestore = createFirestore(settings, apis);
const image = buildImage(settings, registry, accounts.build);

const site = createAddress(settings);

// The payment river comes before the cabinets: they only read it, and send their gestures to its door.
const payRiver = pay.enabled
  ? createPayRiver(settings, pay, buildPayImage(settings, registry, accounts.build), accounts, pulumi.interpolate`https://${site.domain}`, apis)
  : undefined;
const payEnv = payRiver ? { ...payEnvironment(settings, pay), PAY_DOOR_URL: payRiver.doorUrl } : {};
const web = createSurfaceService(settings, 'public', image, accounts.web, projectNumber, payEnv);
const studio = createSurfaceService(settings, 'studio', image, accounts.studio, projectNumber, payEnv);

const webArmor = createArmorPolicy(settings, 'river-web-armor', 600);
const studioArmor = createArmorPolicy(settings, 'river-studio-armor', 1200);
const lb = createLoadBalancer(settings, site, web, studio, webArmor, studioArmor);
grantIapAccess(settings, lb.studioBackend);

export const ip = lb.address.address;
export const url = pulumi.interpolate`https://${lb.domain}`;
export const studioUrl = pulumi.interpolate`https://${lb.studioDomain}`;
export const webImage = image;
export const firestoreDatabase = firestore.name;
// Give these to the providers as webhook endpoints (present only for connected providers).
export const payWebhookUrls = payRiver?.webhookUrls;
export const payDoorUrl = payRiver?.doorUrl;
export const note = 'The managed certificate can take 15–60 minutes to become ACTIVE after the first deployment.';
