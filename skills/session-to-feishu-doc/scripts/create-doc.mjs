#!/usr/bin/env node

import { access } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { commandError, parseJsonEnvelope, runCommand } from './lib/lark.mjs';

function normalizedRelativeContent(content, cwd = process.cwd()) {
  if (!content || isAbsolute(content)) throw new Error('内容文件必须使用当前工作目录下的相对路径');
  const absolute = resolve(cwd, content);
  const relativePath = relative(cwd, absolute);
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error('内容文件必须位于当前工作目录内');
  }
  return relativePath.replaceAll('\\', '/');
}

export function buildCreateDocArgs({ title, content, cwd = process.cwd() }) {
  if (!title?.trim()) throw new Error('缺少文档标题');
  const relativePath = normalizedRelativeContent(content, cwd);
  return [
    'docs', '+create',
    '--doc-format', 'markdown',
    '--title', title,
    '--content', `@./${relativePath}`,
    '--as', 'user',
  ];
}

export async function createDocument({
  title,
  content,
  confirmed = false,
  cwd = process.cwd(),
  runner = runCommand,
}) {
  if (!confirmed) throw new Error('必须先获得用户对创建飞书文档的明确确认');
  const relativePath = normalizedRelativeContent(content, cwd);
  await access(resolve(cwd, relativePath));
  const result = await runner('lark-cli', buildCreateDocArgs({ title, content, cwd }), { cwd });
  const { value } = parseJsonEnvelope(result);
  const document = value?.data?.document;
  if (result.code !== 0 || value?.ok !== true || !document?.url) {
    throw new Error(commandError(result, '飞书文档创建失败或未返回文档 URL'));
  }
  return {
    ok: true,
    url: document.url,
    document_id: document.document_id || '',
    warnings: document.warnings || value.data?.warnings || [],
  };
}

function parseArgs(argv) {
  const args = { confirmed: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--title') args.title = argv[++index];
    else if (argv[index] === '--content') args.content = argv[++index];
    else if (argv[index] === '--yes') args.confirmed = true;
  }
  return args;
}

async function main() {
  try {
    console.log(JSON.stringify(await createDocument(parseArgs(process.argv.slice(2)))));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
