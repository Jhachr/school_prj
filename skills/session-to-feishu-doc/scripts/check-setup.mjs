#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { readAuthStatus, runCommand } from './lib/lark.mjs';

export async function checkSetup({ runner = runCommand, env = process.env } = {}) {
  const curlVersion = await runner('curl', ['--version'], { env });
  const version = await runner('lark-cli', ['--version'], { env });
  const curlInstalled = curlVersion.code === 0;
  const larkCliInstalled = version.code === 0;
  const auth = larkCliInstalled
    ? await readAuthStatus({ runner, env })
    : { ok: false, status: {} };
  const config = await loadConfig({ env });
  const checks = {
    curlInstalled,
    larkCliInstalled,
    appConfigured: auth.status.appConfigured === true,
    userAuthorized: auth.status.userAuthorized === true && auth.status.verified === true,
    webhookConfigured: config.ok === true,
  };
  const nextAction = !checks.larkCliInstalled
    ? 'install_lark_cli'
    : !checks.curlInstalled
      ? 'install_curl'
      : !checks.appConfigured
        ? 'configure_app'
        : !checks.userAuthorized
          ? 'authorize_user'
          : !checks.webhookConfigured
            ? 'repair_webhook_config'
            : 'ready';
  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    next_action: nextAction,
    webhook_source: config.source || null,
    message: Object.values(checks).every(Boolean)
      ? '配置完成，可以在明确同意后保存或上传会话'
      : '配置未完成，请按 next_action 完成对应步骤',
  };
}

async function main() {
  const result = await checkSetup();
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
