#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { commandError, parseJsonEnvelope, runCommand } from './lib/lark.mjs';

export function buildShareArgs({ docUrl, userId }) {
  if (!/^https:\/\//.test(docUrl || '')) throw new Error('缺少有效的飞书文档 URL');
  if (!/^ou_/.test(userId || '')) throw new Error('缺少有效的接收者 open_id');
  return [
    'drive', '+member-add',
    '--token', docUrl,
    '--type', 'docx',
    '--member-id', userId,
    '--member-type', 'openid',
    '--perm', 'view',
    '--as', 'user',
    '--yes',
  ];
}

export async function shareDocument({
  docUrl,
  userId,
  confirmed = false,
  runner = runCommand,
}) {
  if (!confirmed) throw new Error('必须先获得用户对上传和授权的明确确认');
  const result = await runner('lark-cli', buildShareArgs({ docUrl, userId }));
  const { value } = parseJsonEnvelope(result);
  if (result.code !== 0 || value?.ok !== true) {
    throw new Error(commandError(result, '无法向接收者授予文档只读权限'));
  }
  return { ok: true, data: value.data || {} };
}

function parseArgs(argv) {
  const args = { confirmed: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--doc-url') args.docUrl = argv[++index];
    else if (argv[index] === '--user-id') args.userId = argv[++index];
    else if (argv[index] === '--yes') args.confirmed = true;
  }
  return args;
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.userId) {
      const loaded = await loadConfig();
      if (!loaded.ok) throw new Error(`通知接收者配置不可用：${loaded.errors.join('；')}`);
      args.userId = loaded.config.notify_user_id;
    }
    console.log(JSON.stringify(await shareDocument(args)));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
