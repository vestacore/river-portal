import * as command from '@pulumi/command';
import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { sourceHash } from './sourceHash';
import type { Settings } from './types/Settings';

/**
 * Builds the web image with Cloud Build (no local Docker, ADR-0014) and returns its digest reference.
 * Rebuilds only when the source hash changes.
 */
export function buildImage(settings: Settings, registry: gcp.artifactregistry.Repository, buildAccount: gcp.serviceaccount.Account): pulumi.Output<string> {
  const tag = sourceHash(settings.repoRoot);
  const image = pulumi.interpolate`${settings.region}-docker.pkg.dev/${settings.project}/${registry.repositoryId}/web`;
  const build = new command.local.Command('build-web-image', {
    dir: settings.repoRoot,
    create: pulumi.interpolate`gcloud builds submit . --project=${settings.project} --region=${settings.region} --config=cloudbuild.yaml --substitutions=_IMAGE=${image}:${tag} --service-account=${buildAccount.id} --quiet 1>&2 && gcloud artifacts docker images describe ${image}:${tag} --project=${settings.project} --format='value(image_summary.fully_qualified_digest)'`,
    triggers: [tag],
  }, { dependsOn: [registry, buildAccount] });
  return build.stdout.apply((out) => out.trim());
}
