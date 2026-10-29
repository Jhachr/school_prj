#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { readAuthStatus, runCommand } from './lib/lark.mjs';

export async function checkSetup({ runner = runCommand, env = process.env } = {}) {
  const version = await runner('lark-cli', ['--version'], { env });
  const larkCliInstalled = version.code === 0;
  const auth = larkCliInstalled
    ? await readAuthStatus({ runner, env })
    : { ok: false, status: {} };
  const config = await loadConfig({ env });
  const checks = {
    larkCliInstalled,
    appConfigured: auth.status.appConfigured === true,
    userAuthorized: auth.status.userAuthorized === true && auth.status.verified === true,
    configValid: config.ok === true,
  };
  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    config_path: config.path,
    message: Object.values(checks).every(Boolean)
      ? '配置完成，可以在明确同意后上传会话'
      : '配置未完成，请运行 setup-wizard.mjs',
  };
}

async function main() {
  const result = await checkSetup();
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
