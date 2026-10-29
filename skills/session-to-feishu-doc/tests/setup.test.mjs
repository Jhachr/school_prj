import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAuthLoginArgs,
  larkEnvironment,
  normalizeAuthStatus,
} from '../scripts/lib/lark.mjs';

test('normalizes the verified top-level auth status contract', () => {
  assert.deepEqual(normalizeAuthStatus({
    appId: 'cli_x',
    identity: 'user',
    verified: true,
    identities: { user: { status: 'ready', userName: 'Teacher' } },
  }), {
    appConfigured: true,
    identity: 'user',
    verified: true,
    userAuthorized: true,
    userName: 'Teacher',
  });
});
test('auth login requests only the domains used by the upload transaction', () => {
  assert.deepEqual(buildAuthLoginArgs(), [
    'auth', 'login',
    '--domain', 'docs',
    '--domain', 'drive',
    '--domain', 'im',
    '--no-wait',
    '--json',
  ]);
});

test('machine-readable lark calls suppress notifier noise', () => {
  const env = larkEnvironment({ PATH: '/bin' });
  assert.equal(env.PATH, '/bin');
  assert.equal(env.LARKSUITE_CLI_NO_UPDATE_NOTIFIER, '1');
  assert.equal(env.LARKSUITE_CLI_NO_SKILLS_NOTIFIER, '1');
});
