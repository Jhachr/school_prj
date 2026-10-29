#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { commandError, parseJsonEnvelope, runCommand } from './lib/lark.mjs';

export function buildNotificationArgs({ userId, text }) {
  if (!/^ou_/.test(userId || '')) throw new Error('缺少有效的接收者 open_id');
  if (!text?.trim()) throw new Error('通知内容不能为空');
  return [
    'im', '+messages-send',
    '--user-id', userId,
    '--text', text,
    '--as', 'user',
  ];
}

export async function sendNotification({
  docUrl,
  title,
  confirmed = false,
  runner = runCommand,
  env = process.env,
}) {
  if (!confirmed) throw new Error('必须先获得用户对发送上传通知的明确确认');
  if (!docUrl || !title) throw new Error('缺少文档 URL 或标题');
  const loaded = await loadConfig({ env });
  if (!loaded.ok) throw new Error(`通知接收者配置不可用：${loaded.errors.join('；')}`);
  const { notify_user_id: userId, notify_user_label: label } = loaded.config;
  const text = `📄 收到一份自愿提交的会话记录\n\n标题：${title}\n接收者：${label}\n链接：${docUrl}`;
  const result = await runner('lark-cli', buildNotificationArgs({ userId, text }), { env });
  const { value, raw } = parseJsonEnvelope(result);
  if (result.code !== 0 || value?.ok !== true) {
    throw new Error(commandError(result, '飞书通知发送失败'));
  }
  return {
    ok: true,
    message_id: value.data?.message_id || '',
    chat_id: value.data?.chat_id || '',
    raw: value.data ? undefined : raw,
  };
}

function parseArgs(argv) {
  const args = { confirmed: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--doc-url') args.docUrl = argv[++index];
    else if (argv[index] === '--title') args.title = argv[++index];
    else if (argv[index] === '--yes') args.confirmed = true;
  }
  return args;
}

async function main() {
  try {
    console.log(JSON.stringify(await sendNotification(parseArgs(process.argv.slice(2)))));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
