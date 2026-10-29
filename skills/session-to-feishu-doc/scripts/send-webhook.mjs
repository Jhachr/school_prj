#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';

export function buildWebhookMessage({ title, docUrl, keyword = '科研会话反馈' }) {
  if (!title?.trim()) throw new Error('缺少文档标题');
  if (!/^https:\/\//.test(docUrl || '')) throw new Error('缺少有效的飞书文档 URL');
  return {
    msg_type: 'text',
    content: {
      text: `${keyword}\n📄 收到一份自愿提交的会话记录\n标题：${title}\n文档链接：${docUrl}`,
    },
  };
}

function webhookError(data, status) {
  return data?.msg || data?.message || `Webhook 返回错误（HTTP ${status}）`;
}

export async function sendWebhookNotification({
  title,
  docUrl,
  confirmed = false,
  env = process.env,
  fetchImpl = globalThis.fetch,
  configLoader = loadConfig,
}) {
  if (!confirmed) throw new Error('必须先获得用户对发送公开文档链接到产品改进群的明确确认');
  if (typeof fetchImpl !== 'function') throw new Error('当前 Node.js 运行时不支持 fetch');

  const loaded = await configLoader({ env });
  if (!loaded.ok) throw new Error(`Webhook 配置不可用：${loaded.errors.join('；')}`);
  const { webhook_url: webhookUrl, receiver_label: receiverLabel, security_keyword: keyword } = loaded.config;
  const body = buildWebhookMessage({ title, docUrl, keyword });

  let response;
  let data;
  try {
    response = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      ...(globalThis.AbortSignal?.timeout ? { signal: globalThis.AbortSignal.timeout(15_000) } : {}),
    });
    data = await response.json();
  } catch (error) {
    throw new Error(`Webhook 请求失败：${error.message}`);
  }
  if (!response.ok || (data?.code !== 0 && data?.StatusCode !== 0)) {
    throw new Error(webhookError(data, response.status));
  }
  return { ok: true, receiver_label: receiverLabel };
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
    console.log(JSON.stringify(await sendWebhookNotification(parseArgs(process.argv.slice(2)))));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
