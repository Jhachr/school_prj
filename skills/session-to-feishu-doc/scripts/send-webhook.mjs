#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { runCommand } from './lib/lark.mjs';

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

export function buildCurlArgs({ webhookUrl }) {
  if (!/^https:\/\/open\.feishu\.cn\/open-apis\/bot\/v2\/hook\/[A-Za-z0-9_-]+$/.test(webhookUrl || '')) {
    throw new Error('缺少有效的飞书自定义机器人 Webhook URL');
  }
  return [
    '--silent',
    '--show-error',
    '--request', 'POST',
    '--connect-timeout', '10',
    '--max-time', '20',
    '--proto', '=https',
    '--header', 'Content-Type: application/json',
    '--data-binary', '@-',
    '--write-out', '\n%{http_code}',
    webhookUrl,
  ];
}

function parseCurlOutput(stdout = '') {
  const boundary = stdout.lastIndexOf('\n');
  const statusText = boundary >= 0 ? stdout.slice(boundary + 1).trim() : '';
  if (!/^\d{3}$/.test(statusText)) {
    throw new Error('Webhook curl 请求未返回可识别的 HTTP 状态码');
  }
  const responseText = stdout.slice(0, boundary).trim();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Webhook 返回了无法解析的响应（HTTP ${statusText}）`);
  }
  return { status: Number(statusText), data };
}

export async function sendWebhookNotification({
  title,
  docUrl,
  confirmed = false,
  env = process.env,
  runner = runCommand,
  configLoader = loadConfig,
}) {
  if (!confirmed) throw new Error('必须先获得用户对发送公开文档链接到产品改进群的明确确认');

  const loaded = await configLoader({ env });
  if (!loaded.ok) throw new Error(`Webhook 配置不可用：${loaded.errors.join('；')}`);
  const { webhook_url: webhookUrl, receiver_label: receiverLabel, security_keyword: keyword } = loaded.config;
  const body = buildWebhookMessage({ title, docUrl, keyword });

  const result = await runner('curl', buildCurlArgs({ webhookUrl }), {
    env,
    input: JSON.stringify(body),
  });
  if (result.code !== 0) {
    const detail = result.stderr?.trim() || `curl 退出码 ${result.code}`;
    throw new Error(`Webhook curl 请求失败：${detail}`);
  }
  const { status, data } = parseCurlOutput(result.stdout);
  if (status < 200 || status >= 300 || (data?.code !== 0 && data?.StatusCode !== 0)) {
    throw new Error(webhookError(data, status));
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
