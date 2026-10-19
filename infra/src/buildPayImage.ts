import * as command from '@pulumi/command';
import type * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { sourceHash } from './sourceHash';
import type { Settings } from './types/Settings';

/**
 * Builds the image of the payment river's functions with Cloud Build (no local Docker, ADR-0014;
 * Dockerfile.pay) and returns its digest reference. Rebuilds only when its sources change.
 */
export function buildPayImage(settings: Settings, registry: gcp.artifactregistry.Repository, buildAccount: gcp.serviceaccount.Account): pulumi.Output<string> {
  const tag = sourceHash(settings.repoRoot, 'apps/pay-functions', 'Dockerfile.pay');
  const image = pulumi.interpolate`${settings.region}-docker.pkg.dev/${settings.project}/${registry.repositoryId}/pay-functions`;
  const build = new command.local.Command('build-pay-image', {
    dir: settings.repoRoot,
    create: pulumi.interpolate`gcloud builds submit . --project=${settings.project} --region=${settings.region} --config=cloudbuild.yaml --substitutions=_IMAGE=${image}:${tag},_DOCKERFILE=Dockerfile.pay --service-account=${buildAccount.id} --quiet 1>&2 && gcloud artifacts docker images describe ${image}:${tag} --project=${settings.project} --format='value(image_summary.fully_qualified_digest)'`,
    triggers: [tag],
  }, { dependsOn: [registry, buildAccount] });
  return build.stdout.apply((out) => out.trim());
}
