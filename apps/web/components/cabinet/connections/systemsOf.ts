import type { ApiKey, WebhookEndpoint } from '@river/psp-integration';
import type { World } from '@river/psp-runtime';
import { endpointRows, type EndpointRow } from '../integration/columns';
import { systemCatalogue, type SystemDefinition } from './systemCatalogue';
import { systemHealth, type SystemHealth } from './systemHealth';

/**
 * One connected system of a reach: on the retail stand one of the group's own systems (or the keys and
 * endpoints not yet assigned to any); on the PSP stand the systems of one unit — a merchant's backend, its
 * accounting — with the keys and endpoints that unit holds.
 */
export type ConnectedSystem = { id: string; definition: SystemDefinition | null; unitId: string | null; keys: ApiKey[]; endpoints: EndpointRow[]; health: SystemHealth };

const hostLabel = (url: string) => /^https?:\/\/([^./:]+)/.exec(url)?.[1] ?? '';

/** The group's system an endpoint belongs to: named in the catalogue, or recognised by its address. */
const systemOfEndpoint = (e: WebhookEndpoint) => systemCatalogue.find((d) => d.endpoints.includes(e.id)) ?? systemCatalogue.find((d) => d.hosts.includes(hostLabel(e.url))) ?? null;

/**
 * The systems connected to the platform within a reach, each with its keys, its endpoints and its health
 * over the last day. Revoked keys are left out; disabled endpoints stay, marked so.
 */
export function systemsOf(w: World, visible: ReadonlySet<string>, now: string): ConnectedSystem[] {
  const keys = w.keys.filter((k) => visible.has(k.unitId) && k.status === 'active');
  const endpoints = endpointRows(w, visible);
  const build = (id: string, definition: SystemDefinition | null, unitId: string | null, own: ApiKey[], hooks: EndpointRow[]): ConnectedSystem => ({ id, definition, unitId, keys: own, endpoints: hooks, health: systemHealth(w, own, hooks, now) });
  if (w.stand === 'retail') {
    const systems = systemCatalogue.map((d) => build(d.id, d, null, keys.filter((k) => d.keys.includes(k.id)), endpoints.filter((e) => systemOfEndpoint(e.endpoint)?.id === d.id)));
    const otherKeys = keys.filter((k) => !systemCatalogue.some((d) => d.keys.includes(k.id)));
    const otherHooks = endpoints.filter((e) => systemOfEndpoint(e.endpoint) === null);
    return otherKeys.length + otherHooks.length > 0 ? [...systems, build('other', null, null, otherKeys, otherHooks)] : systems;
  }
  const units = [...new Set([...keys.map((k) => k.unitId), ...endpoints.map((e) => e.endpoint.unitId)])];
  return units.map((unitId) => build(unitId, null, unitId, keys.filter((k) => k.unitId === unitId), endpoints.filter((e) => e.endpoint.unitId === unitId)));
}
