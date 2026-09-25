import * as gcp from '@pulumi/gcp';
import type { Settings } from './types/Settings';

const apis = [
  'compute.googleapis.com', 'run.googleapis.com', 'iap.googleapis.com', 'artifactregistry.googleapis.com',
  'cloudbuild.googleapis.com', 'firestore.googleapis.com', 'firebaserules.googleapis.com', 'aiplatform.googleapis.com',
  'iam.googleapis.com', 'logging.googleapis.com', 'secretmanager.googleapis.com', 'cloudresourcemanager.googleapis.com',
];

/** Enables the Google Cloud APIs the portal needs. Never disabled on destroy. */
export function enableApis(settings: Settings): gcp.projects.Service[] {
  return apis.map((api) => new gcp.projects.Service(`api-${api.split('.')[0]}`, { project: settings.project, service: api, disableOnDestroy: false }));
}
