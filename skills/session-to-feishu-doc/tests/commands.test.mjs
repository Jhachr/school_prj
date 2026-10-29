import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCreateDocArgs, createDocument } from '../scripts/create-doc.mjs';
import {
  buildGetPublicPermissionArgs,
  buildManagePublicAuthArgs,
  buildSetPublicPermissionArgs,
  setPublicAccess,
} from '../scripts/set-public-access.mjs';
import {
  buildCurlArgs,
  buildWebhookMessage,
  sendWebhookNotification,
} from '../scripts/send-webhook.mjs';
import { uploadSession } from '../scripts/upload-session.mjs';

function validWebhookConfig() {
  return {
    webhook_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
    receiver_label: '产品改进群',
    security_keyword: '科研会话反馈',
  };
}

function success(data = {}) {
  return { code: 0, stdout: JSON.stringify({ ok: true, data }), stderr: '' };
}

test('document creation uses a safe relative Markdown reference', () => {
  assert.deepEqual(buildCreateDocArgs({ title: '会话记录', content: './_session.md' }), [
    'docs', '+create',
    '--doc-format', 'markdown',
    '--title', '会话记录',
    '--content', '@./_session.md',
    '--as', 'user',
  ]);
  assert.throws(() => buildCreateDocArgs({ title: 'x', content: '/tmp/session.md' }), /相对路径/);
  assert.throws(() => buildCreateDocArgs({ title: 'x', content: '../session.md' }), /当前工作目录/);
});

test('document creation refuses file access and lark calls without confirmation', async () => {
  let called = false;
  await assert.rejects(createDocument({
    title: '会话记录',
    content: './does-not-exist.md',
    confirmed: false,
    runner: async () => {
      called = true;
      return { code: 0, stdout: '{}', stderr: '' };
    },
  }), /明确确认/);
  assert.equal(called, false);
});

test('public-link commands use manage-public precheck and exact read-only internet settings', () => {
  assert.deepEqual(buildManagePublicAuthArgs({ token: 'dox1' }), [
    'drive', 'permission.members', 'auth',
    '--token', 'dox1', '--type', 'docx', '--action', 'manage_public',
    '--as', 'user', '--json',
  ]);
  assert.deepEqual(buildGetPublicPermissionArgs({ token: 'dox1' }), [
    'drive', 'permission.public', 'get',
    '--token', 'dox1', '--type', 'docx', '--as', 'user', '--json',
  ]);
  assert.deepEqual(buildSetPublicPermissionArgs({ token: 'dox1' }), [
    'drive', 'permission.public', 'patch',
    '--token', 'dox1', '--type', 'docx',
    '--data', '{"external_access":true,"link_share_entity":"anyone_readable"}',
    '--as', 'user', '--yes', '--json',
  ]);
});

test('public-link permission refuses all lark calls without explicit confirmation', async () => {
  let called = false;
  await assert.rejects(setPublicAccess({
    token: 'dox1',
    confirmed: false,
    runner: async () => {
      called = true;
      return success();
    },
  }), /明确确认/);
  assert.equal(called, false);
});

test('public-link permission checks capability, snapshots state, patches, and fresh-reads verification', async () => {
  const actions = [];
  let reads = 0;
  const result = await setPublicAccess({
    token: 'dox1',
    confirmed: true,
    runner: async (_command, args) => {
      const action = `${args[1]} ${args[2]}`;
      actions.push(action);
      if (action === 'permission.members auth') return success({ auth_result: true });
      if (action === 'permission.public patch') return success({ permission_public: {} });
      reads += 1;
      return success({
        permission_public: reads === 1
          ? { external_access: false, link_share_entity: 'closed' }
          : { external_access: true, link_share_entity: 'anyone_readable' },
      });
    },
  });
  assert.deepEqual(actions, [
    'permission.members auth',
    'permission.public get',
    'permission.public patch',
    'permission.public get',
  ]);
  assert.equal(result.changed, true);
  assert.equal(result.verified, true);
  assert.deepEqual(result.after, {
    external_access: true,
    link_share_entity: 'anyone_readable',
  });
});

test('tenant external-sharing policy errors are surfaced without retry', async () => {
  let step = 0;
  await assert.rejects(setPublicAccess({
    token: 'dox1',
    confirmed: true,
    runner: async () => {
      step += 1;
      if (step === 1) return success({ auth_result: true });
      if (step === 2) {
        return success({ permission_public: { external_access: false, link_share_entity: 'closed' } });
      }
      return {
        code: 1,
        stdout: '',
        stderr: JSON.stringify({ ok: false, error: { code: 91009, message: 'forbidden' } }),
      };
    },
  }), /租户安全策略/);
  assert.equal(step, 3);
});

test('webhook contains only the title and public document link, never conversation body', () => {
  const body = buildWebhookMessage({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    keyword: '科研会话反馈',
  });
  assert.match(body.content.text, /会话记录/);
  assert.match(body.content.text, /https:\/\/example\.feishu\.cn\/docx\/dox1/);
  assert.doesNotMatch(body.content.text, /完整对话|会话正文|教学改进内容/);
});

test('webhook curl command keeps TLS verification and reads JSON from stdin', () => {
  const args = buildCurlArgs({
    webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
  });
  assert.ok(args.includes('@-'));
  assert.ok(args.includes('=https'));
  assert.equal(args.includes('--insecure'), false);
  assert.equal(args.includes('-k'), false);
});

test('webhook refuses to load its credential or send without explicit confirmation', async () => {
  let loaded = false;
  let executed = false;
  await assert.rejects(sendWebhookNotification({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    confirmed: false,
    configLoader: async () => {
      loaded = true;
      return {};
    },
    runner: async () => {
      executed = true;
      return { code: 0, stdout: '{}\n200', stderr: '' };
    },
  }), /明确确认/);
  assert.equal(loaded, false);
  assert.equal(executed, false);
});

test('webhook uses curl once and returns no credential', async () => {
  const requests = [];
  const result = await sendWebhookNotification({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    confirmed: true,
    configLoader: async () => ({ ok: true, config: validWebhookConfig() }),
    runner: async (command, args, options) => {
      requests.push({ command, args, options });
      return { code: 0, stdout: '{"code":0,"msg":"success"}\n200', stderr: '' };
    },
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].command, 'curl');
  assert.match(requests[0].options.input, /文档链接/);
  assert.doesNotMatch(requests[0].options.input, /完整对话|教学改进内容/);
  assert.equal(result.receiver_label, '产品改进群');
  assert.equal('webhook_url' in result, false);
});

test('curl TLS diagnostics are preserved without retrying or disabling verification', async () => {
  let attempts = 0;
  await assert.rejects(sendWebhookNotification({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    confirmed: true,
    configLoader: async () => ({ ok: true, config: validWebhookConfig() }),
    runner: async () => {
      attempts += 1;
      return {
        code: 60,
        stdout: '\n000',
        stderr: 'curl: (60) SSL certificate problem: self-signed certificate in certificate chain',
      };
    },
  }), /self-signed certificate/);
  assert.equal(attempts, 1);
});

test('upload transaction creates, publishes, verifies, then notifies in order', async () => {
  const calls = [];
  const result = await uploadSession({
    title: '会话记录',
    content: './_session.md',
    confirmed: true,
    create: async () => {
      calls.push('create');
      return { ok: true, document_id: 'dox1', url: 'https://example.feishu.cn/docx/dox1' };
    },
    publish: async () => {
      calls.push('publish');
      return { ok: true, verified: true };
    },
    notify: async () => {
      calls.push('notify');
      return { ok: true };
    },
  });
  assert.deepEqual(calls, ['create', 'publish', 'notify']);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'uploaded');
});

test('permission failure preserves the private document and never invokes webhook', async () => {
  let notified = false;
  const result = await uploadSession({
    title: '会话记录',
    content: './_session.md',
    confirmed: true,
    create: async () => ({
      ok: true,
      document_id: 'dox1',
      url: 'https://example.feishu.cn/docx/dox1',
    }),
    publish: async () => {
      const error = new Error('租户安全策略禁止对外分享');
      error.code = 91009;
      throw error;
    },
    notify: async () => {
      notified = true;
    },
  });
  assert.equal(result.status, 'permission_failed');
  assert.equal(result.permission.code, 91009);
  assert.equal(result.webhook.skipped, true);
  assert.equal(notified, false);
});

test('notification failure reports that the document is already public', async () => {
  const result = await uploadSession({
    title: '会话记录',
    content: './_session.md',
    confirmed: true,
    create: async () => ({
      ok: true,
      document_id: 'dox1',
      url: 'https://example.feishu.cn/docx/dox1',
    }),
    publish: async () => ({ ok: true, verified: true }),
    notify: async () => {
      throw new Error('群机器人暂时不可用');
    },
  });
  assert.equal(result.status, 'notification_failed');
  assert.equal(result.permission.verified, true);
  assert.match(result.webhook.error, /暂时不可用/);
});

test('local-only mode creates a private document and skips permission and webhook', async () => {
  let published = false;
  let notified = false;
  const result = await uploadSession({
    title: '会话记录',
    content: './_session.md',
    confirmed: true,
    localOnly: true,
    create: async () => ({ ok: true, url: 'https://example.feishu.cn/docx/dox1' }),
    publish: async () => {
      published = true;
    },
    notify: async () => {
      notified = true;
    },
  });
  assert.equal(result.status, 'saved_only');
  assert.equal(result.permission.skipped, true);
  assert.equal(result.webhook.skipped, true);
  assert.equal(published, false);
  assert.equal(notified, false);
});
