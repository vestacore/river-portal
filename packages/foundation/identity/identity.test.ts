import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signSession } from './signSession.ts';
import { verifySession } from './verifySession.ts';
import { hasRole } from './hasRole.ts';
import { isStaff } from './isStaff.ts';

test('sessions verify, and tampered or expired ones do not', () => {
  const token = signSession({ personaId: 'andriy', iat: Math.floor(Date.now() / 1000) }, 'secret');
  assert.equal(verifySession(token, 'secret')?.personaId, 'andriy');
  assert.equal(verifySession(token, 'other'), null);
  const [body, mac] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ personaId: 'iryna', iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  assert.equal(verifySession(`${forged}.${mac}`, 'secret'), null);
  assert.equal(verifySession(`${body}`, 'secret'), null);
  const old = signSession({ personaId: 'andriy', iat: 0 }, 'secret');
  assert.equal(verifySession(old, 'secret'), null);
});

test('roles', () => {
  const coordinator = { personId: null, name: 'A', roles: ['coordinator' as const], via: 'demo' as const };
  const giver = { personId: 'p', name: 'J', roles: ['giver' as const], via: 'demo' as const };
  assert.ok(isStaff(coordinator));
  assert.ok(!isStaff(giver));
  assert.ok(hasRole(giver, 'giver', 'sponsor'));
  assert.ok(!hasRole(null, 'giver'));
});
