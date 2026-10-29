#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { normalizedRelativeContent } from './create-doc.mjs';

const CONTENT_CHUNK_BYTES = 8_000;
const FEISHU_BODY_LIMIT_BYTES = 20_000;

export function chunkUtf8(text, maxBytes = CONTENT_CHUNK_BYTES) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1) throw new Error('分片大小必须为正整数');
  const chunks = [];
  let current = '';
  let currentBytes = 0;
  for (const character of String(text || '')) {
    const bytes = Buffer.byteLength(character);
    if (bytes > maxBytes) throw new Error('存在无法安全分片的字符');
    if (current && currentBytes + bytes > maxBytes) {
      chunks.push(current);
      current = '';
      currentBytes = 0;
    }
    current += character;
    currentBytes += bytes;
  }
  if (current || chunks.length === 0) chunks.push(current);
  return chunks;
}

export function buildWebhookMessages({ title, docUrl, contentText, keyword = '科研会话反馈' }) {
  if (!title?.trim()) throw new Error('缺少文档标题');
  if (!/^https:\/\//.test(docUrl || '')) throw new Error('缺少有效的飞书文档 URL');
  if (!contentText?.trim()) throw new Error('会话内容不能为空');

  const chunks = chunkUtf8(contentText);
  return chunks.map((chunk, index) => {
    const sequence = `${index + 1}/${chunks.length}`;
    const link = index === 0 ? `\n文档链接：${docUrl}` : '';
    const text = `${keyword}\n📄 收到一份自愿提交的会话记录\n标题：${title}${link}\n会话内容（${sequence}）：\n\n${chunk}`;
    const body = { msg_type: 'text', content: { text } };
    if (Buffer.byteLength(JSON.stringify(body)) > FEISHU_BODY_LIMIT_BYTES) {
      throw new Error('Webhook 消息超过飞书 20 KB 请求体限制');
    }
    return body;
  });
}

function webhookError(data, status) {
  return data?.msg || data?.message || `Webhook 返回错误（HTTP ${status}）`;
}

export async function sendWebhookNotification({
  title,
  docUrl,
  contentText,
  confirmed = false,
  env = process.env,
  fetchImpl = globalThis.fetch,
  wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)),
  configLoader = loadConfig,
  startAt = 0,
}) {
  if (!confirmed) throw new Error('必须先获得用户对上传会话到产品改进群的明确确认');
  if (typeof fetchImpl !== 'function') throw new Error('当前 Node.js 运行时不支持 fetch');

  const loaded = await configLoader({ env });
  if (!loaded.ok) throw new Error(`Webhook 配置不可用：${loaded.errors.join('；')}`);
  const { webhook_url: webhookUrl, receiver_label: receiverLabel, security_keyword: keyword } = loaded.config;
  const messages = buildWebhookMessages({ title, docUrl, contentText, keyword });
  if (!Number.isInteger(startAt) || startAt < 0 || startAt > messages.length) {
    throw new Error('startAt 必须是有效的分片序号');
  }

  let sent = startAt;
  for (const body of messages.slice(startAt)) {
    if (sent > startAt) await wait(250);
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
      const wrapped = new Error(`Webhook 请求失败：${error.message}`);
      wrapped.messagesSent = sent;
      wrapped.messagesTotal = messages.length;
      throw wrapped;
    }
    if (!response.ok || (data?.code !== 0 && data?.StatusCode !== 0)) {
      const error = new Error(webhookError(data, response.status));
      error.messagesSent = sent;
      error.messagesTotal = messages.length;
      throw error;
    }
    sent += 1;
  }

  return {
    ok: true,
    receiver_label: receiverLabel,
    messages_sent: sent,
    messages_total: messages.length,
  };
}

function parseArgs(argv) {
  const args = { confirmed: false, startAt: 0 };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--doc-url') args.docUrl = argv[++index];
    else if (argv[index] === '--title') args.title = argv[++index];
    else if (argv[index] === '--content') args.content = argv[++index];
    else if (argv[index] === '--start-at') args.startAt = Number.parseInt(argv[++index], 10);
    else if (argv[index] === '--yes') args.confirmed = true;
  }
  return args;
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.confirmed) throw new Error('必须先获得用户对上传会话到产品改进群的明确确认');
    const relativeContent = normalizedRelativeContent(args.content);
    args.contentText = await readFile(resolve(process.cwd(), relativeContent), 'utf8');
    console.log(JSON.stringify(await sendWebhookNotification(args)));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      error: error.message,
      messages_sent: error.messagesSent || 0,
      messages_total: error.messagesTotal || 0,
    }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
