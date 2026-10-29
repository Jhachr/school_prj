import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCreateDocArgs, createDocument } from '../scripts/create-doc.mjs';
import { buildShareArgs, shareDocument } from '../scripts/share-doc.mjs';
import { buildNotificationArgs, sendNotification } from '../scripts/send-notification.mjs';

test('document creation uses a safe relative Markdown reference', () => {
  assert.deepEqual(buildCreateDocArgs({ title: '会话记录', content: './_session.md' }), [
    'docs', '+create',
    '--doc-format', 'markdown',
    '--title', '会话记录',
    '--content', '@./_session.md',
    '--as', 'user',
  ]);
  assert.throws(
    () => buildCreateDocArgs({ title: 'x', content: '/tmp/session.md' }),
    /相对路径/,
  );
  assert.throws(
    () => buildCreateDocArgs({ title: 'x', content: '../session.md' }),
    /当前工作目录/,
  );
});

test('sharing grants only view access and carries an explicit confirmation flag', () => {
  assert.deepEqual(buildShareArgs({
    docUrl: 'https://example.feishu.cn/docx/dox1',
    userId: 'ou_receiver',
  }), [
    'drive', '+member-add',
    '--token', 'https://example.feishu.cn/docx/dox1',
    '--type', 'docx',
    '--member-id', 'ou_receiver',
    '--member-type', 'openid',
    '--perm', 'view',
    '--as', 'user',
    '--yes',
  ]);
});

test('sharing refuses to invoke lark-cli without upload confirmation', async () => {
  let called = false;
  await assert.rejects(
    shareDocument({
      docUrl: 'https://example.feishu.cn/docx/dox1',
      userId: 'ou_receiver',
      confirmed: false,
      runner: async () => {
        called = true;
        return { code: 0, stdout: '{}', stderr: '' };
      },
    }),
    /明确确认/,
  );
  assert.equal(called, false);
});

test('document creation refuses to touch the file or invoke lark-cli without confirmation', async () => {
  let called = false;
  await assert.rejects(
    createDocument({
      title: '会话记录',
      content: './does-not-exist.md',
      confirmed: false,
      runner: async () => {
        called = true;
        return { code: 0, stdout: '{}', stderr: '' };
      },
    }),
    /明确确认/,
  );
  assert.equal(called, false);
});

test('notification is addressed to the configured receiver as the user', () => {
  assert.deepEqual(buildNotificationArgs({
    userId: 'ou_receiver',
    text: 'uploaded',
  }), [
    'im', '+messages-send',
    '--user-id', 'ou_receiver',
    '--text', 'uploaded',
    '--as', 'user',
  ]);
});

test('notification refuses to load configuration or invoke lark-cli without confirmation', async () => {
  let called = false;
  await assert.rejects(
    sendNotification({
      docUrl: 'https://example.feishu.cn/docx/dox1',
      title: '会话记录',
      confirmed: false,
      env: { SESSION_TO_FEISHU_HOME: '/does-not-exist' },
      runner: async () => {
        called = true;
        return { code: 0, stdout: '{}', stderr: '' };
      },
    }),
    /明确确认/,
  );
  assert.equal(called, false);
});
