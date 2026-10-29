import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  configPath,
  loadConfig,
  saveConfig,
  validateConfig,
} from '../scripts/lib/config.mjs';

test('config lives outside the installed skill and honors SESSION_TO_FEISHU_HOME', () => {
  assert.equal(
    configPath({ SESSION_TO_FEISHU_HOME: '/tmp/session-feedback' }),
    '/tmp/session-feedback/config.json',
  );
  assert.match(configPath({}), /\.session-to-feishu-doc\/config\.json$/);
});

test('config requires a readable recipient label and an open_id', () => {
  assert.equal(validateConfig({ notify_user_id: 'bad' }).ok, false);
  assert.equal(validateConfig({ notify_user_id: 'ou_valid' }).ok, false);
  assert.equal(
    validateConfig({
      notify_user_id: 'ou_valid',
      notify_user_label: '产品改进团队',
    }).ok,
    true,
  );
});

test('saveConfig persists timestamps and loadConfig validates the result', async () => {
  const root = await mkdtemp(join(tmpdir(), 'session-feedback-config-'));
  const env = { SESSION_TO_FEISHU_HOME: root };
  try {
    const saved = await saveConfig({
      notify_user_id: 'ou_receiver',
      notify_user_label: '产品改进团队',
    }, { env });
    assert.ok(saved.created_at);
    assert.ok(saved.updated_at);

    const loaded = await loadConfig({ env });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.config.notify_user_id, 'ou_receiver');
    assert.equal(JSON.parse(await readFile(configPath(env), 'utf8')).notify_user_label, '产品改进团队');
    assert.equal((await stat(root)).mode & 0o777, 0o700);
    assert.equal((await stat(configPath(env))).mode & 0o777, 0o600);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('saveConfig tightens permissions on an existing directory and file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'session-feedback-config-'));
  const env = { SESSION_TO_FEISHU_HOME: root };
  try {
    await writeFile(configPath(env), JSON.stringify({
      notify_user_id: 'ou_old',
      notify_user_label: '旧接收者',
    }), { mode: 0o644 });
    await chmod(root, 0o755);

    await saveConfig({
      notify_user_id: 'ou_receiver',
      notify_user_label: '产品改进团队',
    }, { env });

    assert.equal((await stat(root)).mode & 0o777, 0o700);
    assert.equal((await stat(configPath(env))).mode & 0o777, 0o600);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
