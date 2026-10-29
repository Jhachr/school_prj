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

const validConfig = {
  webhook_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/test-id',
  receiver_label: '科研教练产品改进群',
  security_keyword: '科研会话反馈',
};

test('optional user override lives outside the installed skill', () => {
  assert.equal(
    configPath({ SESSION_TO_FEISHU_HOME: '/tmp/session-feedback' }),
    '/tmp/session-feedback/config.json',
  );
  assert.match(configPath({}), /\.session-to-feishu-doc\/config\.json$/);
});

test('config only accepts a Feishu custom-bot webhook and a receiver label', () => {
  assert.equal(validateConfig({ ...validConfig, webhook_url: 'http://example.com' }).ok, false);
  assert.equal(validateConfig({ ...validConfig, webhook_url: 'https://evil.example/hook/a' }).ok, false);
  assert.equal(validateConfig({ ...validConfig, receiver_label: '' }).ok, false);
  assert.equal(validateConfig(validConfig).ok, true);
});

test('loadConfig uses environment override without exposing a path', async () => {
  const loaded = await loadConfig({
    env: {
      SESSION_TO_FEISHU_WEBHOOK_URL: validConfig.webhook_url,
      SESSION_TO_FEISHU_RECEIVER_LABEL: '测试接收群',
    },
  });
  assert.equal(loaded.ok, true);
  assert.equal(loaded.source, 'environment');
  assert.equal(loaded.path, null);
  assert.equal(loaded.config.receiver_label, '测试接收群');
});

test('a valid user override takes precedence over the bundled default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'session-feedback-config-'));
  const env = { SESSION_TO_FEISHU_HOME: root };
  try {
    await writeFile(configPath(env), JSON.stringify(validConfig));
    const loaded = await loadConfig({ env, bundledPath: '/does-not-matter' });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.source, 'user');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('legacy open_id config is ignored during upgrade in favor of bundled webhook', async () => {
  const root = await mkdtemp(join(tmpdir(), 'session-feedback-config-'));
  const env = { SESSION_TO_FEISHU_HOME: root };
  const bundledPath = join(root, 'bundled.json');
  try {
    await writeFile(configPath(env), JSON.stringify({
      notify_user_id: 'ou_old',
      notify_user_label: '旧接收者',
    }));
    await writeFile(bundledPath, JSON.stringify(validConfig));
    const loaded = await loadConfig({ env, bundledPath });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.source, 'bundled');
    assert.match(loaded.warning, /旧版/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('saveConfig writes a secure optional override', async () => {
  const root = await mkdtemp(join(tmpdir(), 'session-feedback-config-'));
  const env = { SESSION_TO_FEISHU_HOME: root };
  try {
    await chmod(root, 0o755);
    await saveConfig(validConfig, { env });
    const saved = JSON.parse(await readFile(configPath(env), 'utf8'));
    assert.equal(saved.receiver_label, validConfig.receiver_label);
    assert.equal((await stat(root)).mode & 0o777, 0o700);
    assert.equal((await stat(configPath(env))).mode & 0o777, 0o600);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
