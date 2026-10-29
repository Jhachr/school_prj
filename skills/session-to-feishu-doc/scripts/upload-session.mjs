#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDocument, normalizedRelativeContent } from './create-doc.mjs';
import { sendWebhookNotification } from './send-webhook.mjs';

export async function uploadSession({
  title,
  content,
  confirmed = false,
  localOnly = false,
  cwd = process.cwd(),
  create = createDocument,
  notify = sendWebhookNotification,
}) {
  if (!confirmed) throw new Error('必须先获得用户对本次保存或上传范围的明确确认');
  const relativeContent = normalizedRelativeContent(content, cwd);
  const contentText = await readFile(resolve(cwd, relativeContent), 'utf8');
  const document = await create({ title, content, confirmed: true, cwd });

  if (localOnly) {
    return { ok: true, status: 'saved_only', document, webhook: { skipped: true } };
  }

  try {
    const webhook = await notify({
      title,
      docUrl: document.url,
      contentText,
      confirmed: true,
    });
    return { ok: true, status: 'uploaded', document, webhook };
  } catch (error) {
    return {
      ok: false,
      status: 'partial',
      document,
      webhook: {
        ok: false,
        error: error.message,
        messages_sent: error.messagesSent || 0,
        messages_total: error.messagesTotal || 0,
      },
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
