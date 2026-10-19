import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { payEnvironment } from './payEnvironment';
import type { PaySettings } from './types/PaySettings';
import type { Settings } from './types/Settings';

// All access is server-side through the service accounts; browsers get nothing.
const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

type SecretRef = { secret: gcp.secretmanager.Secret; version: gcp.secretmanager.SecretVersion };

/**
 * The payment river on Google Cloud (adr/records/ADR-0025).
 *
 * - Its own Firestore database, so access can be given per database: the functions write, the
 *   cabinets only read.
 * - One Cloud Run service per function, all from one image, each with its own identity and only its
 *   own secret: the door (gestures), a bank per provider (carries intentions), a webhook per
 *   connected provider (what the provider reports), and the clock.
 * - Messaging: a new document in a bank's outbox is an Eventarc Firestore event delivered to that
 *   bank's service, with retries; Cloud Scheduler calls the clock.
 *
 * The door is called by the cabinets with their own identity (IAM); the banks by what wakes them —
 * Eventarc, and the clock for an intention that has waited too long; the webhooks are public and
 * believe only signed requests; the clock accepts internal traffic only.
 */
export function createPayRiver(
  settings: Settings,
  pay: PaySettings,
  image: pulumi.Input<string>,
  cabinets: { web: gcp.serviceaccount.Account; studio: gcp.serviceaccount.Account },
  publicUrl: pulumi.Input<string>,
  dependsOn: gcp.projects.Service[],
) {
  const project = settings.project;
  const mounted = (['stripe', 'paypal'] as const).filter((name) => (name === 'stripe' ? pay.stripeMode : pay.paypalMode) !== 'off');
  const connected = (['stripe', 'paypal'] as const).filter((name) => (name === 'stripe' ? pay.stripeMode : pay.paypalMode) === 'connected');

  // The database, with point-in-time recovery, delete protection and rules that deny every client.
  const database = new gcp.firestore.Database('pay-firestore', {
    project,
    name: pay.database,
    locationId: settings.firestoreLocation,
    type: 'FIRESTORE_NATIVE',
    pointInTimeRecoveryEnablement: 'POINT_IN_TIME_RECOVERY_ENABLED',
    deleteProtectionState: 'DELETE_PROTECTION_ENABLED',
  }, { dependsOn, protect: true });
  const ruleset = new gcp.firebaserules.Ruleset('pay-firestore-rules', { project, source: { files: [{ name: 'firestore.rules', content: rules }] } }, { dependsOn: [database] });
  new gcp.firebaserules.Release('pay-firestore-rules-release', {
    project,
    name: `cloud.firestore/${pay.database}`,
    rulesetName: ruleset.name.apply((n) => `projects/${project}/rulesets/${n.split('/').pop()}`),
  });

  // Identities: one per function, and one for what wakes them (Eventarc and the scheduler).
  const account = (id: string, displayName: string) =>
    new gcp.serviceaccount.Account(`sa-pay-${id}`, { project, accountId: `river-pay-${id}`, displayName }, { dependsOn });
  const door = account('door', 'Payment river — the door (gestures)');
  const clock = account('clock', 'Payment river — the clock');
  const wake = account('wake', 'Payment river — wakes the banks and the clock');
  const banks = Object.fromEntries(mounted.map((name) => [name, account(name, `Payment river — the ${name} bank`)]));
  const hooks = Object.fromEntries(connected.map((name) => [name, account(`hook-${name}`, `Payment river — the ${name} webhook`)]));

  // Per-database access: the functions read and write the pay database and no other; the cabinets read it.
  const onPay = { title: 'pay-database-only', description: 'The payment river database and no other', expression: `resource.name == "projects/${project}/databases/${pay.database}"` };
  const grants: pulumi.Resource[] = [];
  const data = (name: string, role: string, sa: gcp.serviceaccount.Account) =>
    grants.push(new gcp.projects.IAMMember(`pay-${name}-datastore`, { project, role, member: sa.member, condition: onPay }, { dependsOn: [database] }));
  data('door', 'roles/datastore.user', door);
  data('clock', 'roles/datastore.user', clock);
  for (const [name, sa] of Object.entries(banks)) data(name, 'roles/datastore.user', sa);
  for (const [name, sa] of Object.entries(hooks)) data(`hook-${name}`, 'roles/datastore.user', sa);
  data('web', 'roles/datastore.viewer', cabinets.web);
  data('studio', 'roles/datastore.viewer', cabinets.studio);

  // Secrets: kept in the region, each readable only by the function that uses it.
  const secret = (id: string, value: pulumi.Output<string> | undefined, readers: Array<gcp.serviceaccount.Account | undefined>): SecretRef | undefined => {
    if (!value) return undefined;
    const held = new gcp.secretmanager.Secret(`pay-secret-${id}`, { project, secretId: `river-pay-${id}`, replication: { userManaged: { replicas: [{ location: settings.region }] } } }, { dependsOn });
    const version = new gcp.secretmanager.SecretVersion(`pay-secret-${id}-version`, { secret: held.id, secretData: value });
    readers.forEach((reader, i) => {
      if (reader) grants.push(new gcp.secretmanager.SecretIamMember(`pay-secret-${id}-reader-${i}`, { project, secretId: held.secretId, role: 'roles/secretmanager.secretAccessor', member: reader.member }));
    });
    return { secret: held, version };
  };
  const stripeKey = pay.stripeMode === 'connected' ? secret('stripe-secret-key', pay.secrets.stripeSecretKey, [banks.stripe]) : undefined;
  const stripeHookSecret = pay.stripeMode === 'connected' ? secret('stripe-webhook-secret', pay.secrets.stripeWebhookSecret, [hooks.stripe]) : undefined;
  const paypalId = pay.paypalMode === 'connected' ? secret('paypal-client-id', pay.secrets.paypalClientId, [banks.paypal, hooks.paypal]) : undefined;
  const paypalSecret = pay.paypalMode === 'connected' ? secret('paypal-secret', pay.secrets.paypalSecret, [banks.paypal, hooks.paypal]) : undefined;
  const paypalHookId = pay.paypalMode === 'connected' ? secret('paypal-webhook-id', pay.secrets.paypalWebhookId, [hooks.paypal]) : undefined;

  // The services. Plain settings are the same everywhere; a secret is an environment variable only where it is used.
  const plain: Record<string, pulumi.Input<string>> = {
    ...payEnvironment(settings, pay),
    RIVER_STORE: 'firestore',
    RIVER_ORG_ID: settings.orgId,
    GOOGLE_CLOUD_PROJECT: project,
    PAY_PUBLIC_URL: publicUrl,
  };
  // `callers`: reachable, but only by identities given the invoker role. `public`: no invoker check —
  // the handler itself believes only signed requests. `internal`: Google-internal traffic only.
  const service = (
    id: string,
    fn: string,
    sa: gcp.serviceaccount.Account,
    reach: 'callers' | 'public' | 'internal',
    secrets: Array<[string, SecretRef | undefined]> = [],
    extra: Record<string, pulumi.Input<string>> = {},
  ) =>
    new gcp.cloudrunv2.Service(`river-pay-${id}`, {
      project,
      location: settings.region,
      name: `river-pay-${id}`,
      ingress: reach === 'internal' ? 'INGRESS_TRAFFIC_INTERNAL_ONLY' : 'INGRESS_TRAFFIC_ALL',
      ...(reach === 'public' ? { invokerIamDisabled: true } : {}),
      deletionProtection: false,
      template: {
        serviceAccount: sa.email,
        scaling: { minInstanceCount: 0, maxInstanceCount: reach === 'public' ? 3 : 5 },
        maxInstanceRequestConcurrency: 16,
        timeout: '60s',
        containers: [{
          image,
          ports: { containerPort: 8080 },
          resources: { limits: { cpu: '1', memory: '512Mi' }, cpuIdle: true, startupCpuBoost: true },
          envs: [
            ...Object.entries({ ...plain, ...extra, PAY_FUNCTION: fn }).map(([name, value]) => ({ name, value })),
            ...secrets.flatMap(([name, ref]) => (ref ? [{ name, valueSource: { secretKeyRef: { secret: ref.secret.secretId, version: ref.version.version } } }] : [])),
          ],
          startupProbe: { httpGet: { path: '/ready' }, periodSeconds: 2, failureThreshold: 15 },
        }],
      },
    }, { dependsOn: [database, ...grants] });

  const doorService = service('door', 'ingest', door, 'callers');
  const bankSecrets: Record<string, Array<[string, SecretRef | undefined]>> = {
    stripe: [['PAY_STRIPE_SECRET_KEY', stripeKey]],
    paypal: [['PAY_PAYPAL_CLIENT_ID', paypalId], ['PAY_PAYPAL_SECRET', paypalSecret]],
  };
  const hookSecrets: Record<string, Array<[string, SecretRef | undefined]>> = {
    stripe: [['PAY_STRIPE_WEBHOOK_SECRET', stripeHookSecret]],
    paypal: [['PAY_PAYPAL_CLIENT_ID', paypalId], ['PAY_PAYPAL_SECRET', paypalSecret], ['PAY_PAYPAL_WEBHOOK_ID', paypalHookId]],
  };
  const bankServices = Object.fromEntries(Object.entries(banks).map(([name, sa]) => [name, service(name, 'discharge', sa, 'callers', bankSecrets[name])]));
  // The clock is told where the banks are, so that it can wake one whose intention has waited too long.
  const bankUrls = pulumi.jsonStringify(Object.fromEntries(Object.entries(bankServices).map(([name, target]) => [name, target.uri])));
  const clockService = service('clock', 'tick', clock, 'internal', [], { PAY_BANK_URLS: bankUrls });
  const hookServices = Object.fromEntries(Object.entries(hooks).map(([name, sa]) => [name, service(`hook-${name}`, `webhook-${name}`, sa, 'public', hookSecrets[name])]));

  // Who may call what: the cabinets call the door; Eventarc and the clock call the banks; the scheduler calls the clock.
  const invoker = (name: string, target: gcp.cloudrunv2.Service, member: pulumi.Input<string>) =>
    new gcp.cloudrunv2.ServiceIamMember(name, { project, location: settings.region, name: target.name, role: 'roles/run.invoker', member });
  invoker('pay-door-from-web', doorService, cabinets.web.member);
  invoker('pay-door-from-studio', doorService, cabinets.studio.member);
  const clockInvoker = invoker('pay-clock-from-wake', clockService, wake.member);
  for (const [name, target] of Object.entries(bankServices)) invoker(`pay-${name}-from-clock`, target, clock.member);

  // Messaging: a document created in a bank's outbox wakes that bank. Delivery is retried by
  // Eventarc; the kernel counts attempts and turns the last failure into a fact, and every
  // delivery carries the same idempotency key, so a repeated event repeats nothing.
  const receives = new gcp.projects.IAMMember('pay-wake-events', { project, role: 'roles/eventarc.eventReceiver', member: wake.member });
  for (const [name, target] of Object.entries(bankServices)) {
    const mayInvoke = invoker(`pay-${name}-from-wake`, target, wake.member);
    new gcp.eventarc.Trigger(`pay-outbox-${name}`, {
      project,
      location: settings.firestoreLocation,
      name: `river-pay-outbox-${name}`,
      matchingCriterias: [
        { attribute: 'type', value: 'google.cloud.firestore.document.v1.created' },
        { attribute: 'database', value: pay.database },
        { attribute: 'document', value: `orgs/${settings.orgId}/outbox/${name}/intentions/{intention}`, operator: 'match-path-pattern' },
      ],
      eventDataContentType: 'application/protobuf',
      serviceAccount: wake.email,
      destination: { cloudRunService: { service: target.name, region: settings.region, path: '/' } },
    }, { dependsOn: [database, receives, mayInvoke, ...dependsOn] });
  }

  // Time: the scheduler calls the clock, which cancels invoices past their date and wakes a bank whose intention has waited too long.
  new gcp.cloudscheduler.Job('pay-clock', {
    project,
    region: settings.region,
    name: 'river-pay-clock',
    description: 'Payment river: lets time enter as a fact',
    schedule: pay.tickSchedule,
    timeZone: 'Etc/UTC',
    attemptDeadline: '60s',
    httpTarget: { uri: clockService.uri, httpMethod: 'POST', oidcToken: { serviceAccountEmail: wake.email, audience: clockService.uri } },
  }, { dependsOn: [clockInvoker, ...dependsOn] });

  return {
    database,
    doorUrl: doorService.uri,
    webhookUrls: Object.fromEntries(Object.entries(hookServices).map(([name, target]) => [name, target.uri])) as Record<string, pulumi.Output<string>>,
  };
}
