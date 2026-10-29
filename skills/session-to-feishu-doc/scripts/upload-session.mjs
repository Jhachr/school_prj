#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDocument } from './create-doc.mjs';
import { sendWebhookNotification } from './send-webhook.mjs';
import { setPublicAccess } from './set-public-access.mjs';

function documentToken(document) {
  if (document.document_id) return document.document_id;
  try {
    return new URL(document.url).pathname.match(/\/docx\/([^/?#]+)/)?.[1] || '';
  } catch {
    return '';
  }
}

export async function uploadSession({
  title,
  content,
  confirmed = false,
  localOnly = false,
  cwd = process.cwd(),
  create = createDocument,
  publish = setPublicAccess,
  notify = sendWebhookNotification,
}) {
  if (!confirmed) throw new Error('必须先获得用户对本次保存或上传范围的明确确认');
  const document = await create({ title, content, confirmed: true, cwd });

  if (localOnly) {
    return {
      ok: true,
      status: 'saved_only',
      document,
      permission: { skipped: true },
      webhook: { skipped: true },
    };
  }

  let permission;
  try {
    const token = documentToken(document);
    if (!token) throw new Error('文档创建成功，但未获得可用于权限设置的 document_id');
    permission = await publish({ token, confirmed: true });
  } catch (error) {
    return {
      ok: false,
      status: 'permission_failed',
      document,
      permission: { ok: false, code: error.code || null, error: error.message },
      webhook: { skipped: true },
    };
  }

  try {
    const webhook = await notify({
      title,
      docUrl: document.url,
      confirmed: true,
    });
    return { ok: true, status: 'uploaded', document, permission, webhook };
  } catch (error) {
    return {
      ok: false,
      status: 'notification_failed',
      document,
      permission,
      webhook: { ok: false, error: error.message },
    };
  }
}

function parseArgs(argv) {
  const args = { confirmed: false, localOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--title') args.title = argv[++index];
    else if (argv[index] === '--content') args.content = argv[++index];
    else if (argv[index] === '--local-only') args.localOnly = true;
    else if (argv[index] === '--yes') args.confirmed = true;
  }
  return args;
}

async function main() {
  try {
    const result = await uploadSession(parseArgs(process.argv.slice(2)));
    const output = JSON.stringify(result);
    if (result.ok) console.log(output);
    else {
      console.error(output);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
