#!/usr/bin/env node
/**
 * create-doc.mjs
 * 封装 lark-cli docs +create，把本地 Markdown 文件创建为飞书云文档。
 *
 * 用法：
 *   node create-doc.mjs --title "文档标题" --content "./相对路径.md"
 *
 * 输出（JSON）：
 *   成功：{ "ok": true, "url": "...", "document_id": "..." }
 *   失败：{ "ok": false, "error": "...", "exit_code": N }
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------- 参数解析 ----------
function parseArgs(argv) {
  const out = { title: '', content: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--title' && argv[i + 1]) {
      out.title = argv[++i];
    } else if (arg === '--content' && argv[i + 1]) {
      out.content = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      out.help = true;
    }
  }
  return out;
}

const { title, content, help } = parseArgs(process.argv.slice(2));

if (help) {
  console.log('用法: node create-doc.mjs --title "标题" --content "./file.md"');
  process.exit(0);
}

if (!title) {
  console.error(JSON.stringify({ ok: false, error: '缺少 --title 参数' }));
  process.exit(1);
}

if (!content) {
  console.error(JSON.stringify({ ok: false, error: '缺少 --content 参数' }));
  process.exit(1);
}

// content 必须是 CWD 下的相对路径（lark-cli @file 限制）
const contentPath = resolve(process.cwd(), content);
if (!existsSync(contentPath)) {
  console.error(JSON.stringify({
    ok: false,
    error: `内容文件不存在: ${content}（已解析为绝对路径 ${contentPath}）`,
  }));
  process.exit(1);
}

// ---------- 调用 lark-cli ----------
const larkArgs = [
  'docs', '+create',
  '--doc-format', 'markdown',
  '--title', title,
  '--content', `@./${content}`,
  '--as', 'user',
];

const proc = spawn('lark-cli', larkArgs, {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
proc.stdout.on('data', (chunk) => { stdout += chunk; });
proc.stderr.on('data', (chunk) => { stderr += chunk; });

proc.on('error', (err) => {
  console.error(JSON.stringify({
    ok: false,
    error: `无法启动 lark-cli: ${err.message}`,
  }));
  process.exit(127);
});

proc.on('close', (code) => {
  const raw = stdout.trim() || stderr.trim();

  // 尝试解析 JSON
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 非 JSON 输出，原样返回
    console.error(JSON.stringify({
      ok: false,
      exit_code: code,
      error: raw || `lark-cli 退出码 ${code}`,
    }));
    process.exit(code === 0 ? 0 : code || 1);
  }

  // lark-cli 返回了 JSON
  if (parsed && parsed.ok === true) {
    const doc = parsed.data?.document;
    console.log(JSON.stringify({
      ok: true,
      url: doc?.url || '',
      document_id: doc?.document_id || '',
      warnings: doc?.warnings || parsed.data?.warnings || [],
    }));
    process.exit(0);
  }

  // lark-cli 返回 ok: false
  const errMsg = parsed?.error?.message
    || parsed?.error
    || raw
    || `lark-cli 退出码 ${code}`;
  const errType = parsed?.error?.type || '';
  const errHint = parsed?.error?.hint || '';

  console.error(JSON.stringify({
    ok: false,
    exit_code: code,
    error: errMsg,
    type: errType,
    hint: errHint,
  }));

  // 未认证时给出明确退出码 10，方便上层识别
  if (errType === 'config' || errMsg.includes('not_configured')) {
    process.exit(10);
  }
  process.exit(code === 0 ? 1 : code);
});
