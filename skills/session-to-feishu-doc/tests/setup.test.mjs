import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkSetup } from '../scripts/check-setup.mjs';
import {
  buildAuthLoginArgs,
  larkEnvironment,
  normalizeAuthStatus,
} from '../scripts/lib/lark.mjs';

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

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

test('setup is ready without a receiver prompt when app, user, and bundled webhook are valid', async () => {
  const runner = async (command, args) => {
    if (command === 'curl') return { code: 0, stdout: 'curl 8.0.0', stderr: '' };
    if (args[0] === '--version') return { code: 0, stdout: '1.0.0', stderr: '' };
    return {
      code: 0,
      stdout: JSON.stringify({
        appId: 'cli_x',
        identity: 'user',
        verified: true,
        identities: { user: { status: 'ready', userName: 'Teacher' } },
      }),
      stderr: '',
    };
  };
  const result = await checkSetup({
    runner,
    env: {
      SESSION_TO_FEISHU_WEBHOOK_URL: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.next_action, 'ready');
});

test('setup reports a missing system curl before an upload can reach the webhook step', async () => {
  const runner = async (command, args) => {
    if (command === 'curl') return { code: 127, stdout: '', stderr: 'not found' };
    if (args[0] === '--version') return { code: 0, stdout: '1.0.0', stderr: '' };
    return {
      code: 0,
      stdout: JSON.stringify({
        appId: 'cli_x',
        identity: 'user',
        verified: true,
        identities: { user: { status: 'ready', userName: 'Teacher' } },
      }),
      stderr: '',
    };
  };
  const result = await checkSetup({
    runner,
    env: {
      SESSION_TO_FEISHU_WEBHOOK_URL: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.checks.curlInstalled, false);
  assert.equal(result.next_action, 'install_curl');
});

test('setup wizard uses split authorization and never waits on readline stdin', async () => {
  const source = await readFile(join(skillRoot, 'scripts', 'setup-wizard.mjs'), 'utf8');
  assert.match(source, /--start-auth/);
  assert.match(source, /--finish-auth/);
  assert.doesNotMatch(source, /node:readline|askQuestion|rl\.question/);
});
