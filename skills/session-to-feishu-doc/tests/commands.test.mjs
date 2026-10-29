import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { buildCreateDocArgs, createDocument } from '../scripts/create-doc.mjs';
import {
  buildWebhookMessages,
  chunkUtf8,
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

test('webhook content is UTF-8 safe and every request remains below the Feishu limit', () => {
  const contentText = `老师说：${'教学改进🙂\n'.repeat(1800)}`;
  const chunks = chunkUtf8(contentText);
  assert.equal(chunks.join(''), contentText);
  const messages = buildWebhookMessages({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    contentText,
    keyword: '科研会话反馈',
  });
  assert.ok(messages.length > 1);
  for (const message of messages) {
    assert.ok(Buffer.byteLength(JSON.stringify(message)) < 20_000);
    assert.match(message.content.text, /科研会话反馈/);
  }
});

test('webhook refuses to load its credential or send without explicit confirmation', async () => {
  let loaded = false;
  let fetched = false;
  await assert.rejects(sendWebhookNotification({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    contentText: 'content',
    confirmed: false,
    configLoader: async () => {
      loaded = true;
      return {};
    },
    fetchImpl: async () => {
      fetched = true;
      return {};
    },
  }), /明确确认/);
  assert.equal(loaded, false);
  assert.equal(fetched, false);
});

test('webhook sends all chunks to the configured receiver without returning its URL', async () => {
  const requests = [];
  const result = await sendWebhookNotification({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    contentText: '内容'.repeat(5000),
    confirmed: true,
    configLoader: async () => ({
      ok: true,
      config: validWebhookConfig(),
    }),
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ code: 0 }) };
    },
    wait: async () => {},
  });
  assert.ok(requests.length > 1);
  assert.equal(result.messages_sent, requests.length);
  assert.equal(result.receiver_label, '产品改进群');
  assert.equal('webhook_url' in result, false);
});

test('an explicitly requested retry resumes after already delivered chunks', async () => {
  const requests = [];
  const contentText = '内容'.repeat(5000);
  const total = buildWebhookMessages({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    contentText,
  }).length;
  const result = await sendWebhookNotification({
    title: '会话记录',
    docUrl: 'https://example.feishu.cn/docx/dox1',
    contentText,
    confirmed: true,
    startAt: 1,
    configLoader: async () => ({ ok: true, config: validWebhookConfig() }),
    fetchImpl: async (...args) => {
      requests.push(args);
      return { ok: true, status: 200, json: async () => ({ code: 0 }) };
    },
    wait: async () => {},
  });
  assert.equal(requests.length, total - 1);
  assert.equal(result.messages_sent, total);
});

test('the upload transaction runs without intermediate prompts and reports partial delivery', async () => {
  const root = await mkdtemp(join(tmpdir(), 'session-upload-'));
  try {
    await writeFile(join(root, '_session.md'), '脱敏后的会话');
    const calls = [];
    const result = await uploadSession({
      title: '会话记录',
      content: './_session.md',
      confirmed: true,
      cwd: root,
      create: async () => {
        calls.push('create');
        return { ok: true, url: 'https://example.feishu.cn/docx/dox1' };
      },
      notify: async () => {
        calls.push('notify');
        const error = new Error('群机器人暂时不可用');
        error.messagesSent = 1;
        error.messagesTotal = 2;
        throw error;
      },
    });
    assert.deepEqual(calls, ['create', 'notify']);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'partial');
    assert.equal(result.document.url, 'https://example.feishu.cn/docx/dox1');
    assert.equal(result.webhook.messages_sent, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('local-only mode creates a document and never invokes the webhook', async () => {
  const root = await mkdtemp(join(tmpdir(), 'session-upload-'));
  try {
    await writeFile(join(root, '_session.md'), '仅保存');
    let notified = false;
    const result = await uploadSession({
      title: '会话记录',
      content: './_session.md',
      confirmed: true,
      localOnly: true,
      cwd: root,
      create: async () => ({ ok: true, url: 'https://example.feishu.cn/docx/dox1' }),
      notify: async () => {
        notified = true;
      },
    });
    assert.equal(result.status, 'saved_only');
    assert.equal(notified, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
